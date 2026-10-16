/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, cleanFirestoreData } from './firebase';
import { UserProfile, UserRole } from './types';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CitizenDashboard } from './components/CitizenDashboard';
import { ResponderDashboard } from './components/ResponderDashboard';
import { InstallGuideModal } from './components/InstallGuideModal';
import { 
  ShieldAlert, 
  LogOut, 
  User as UserIcon, 
  Radio, 
  AlertTriangle, 
  Smartphone,
  CheckCircle2,
  Lock,
  ChevronDown,
  Building,
  Download
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Active view for responders / admins: 'citizen' or 'command'
  const [activeView, setActiveView] = useState<'citizen' | 'command'>('citizen');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMandatoryProfile, setIsMandatoryProfile] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Active emergency broadcast tracked across session
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Check if bootstrapped admin
        const isSuper = user.email === 'fabianricky28@gmail.com';
        if (isSuper) {
          setIsAdminUser(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              setIsAdminUser(true);
            } else if (user.email) {
              const emailQ = query(
                collection(db, 'admins'), 
                where('email', '==', user.email.toLowerCase().trim())
              );
              const emailSnap = await getDocs(emailQ);
              if (!emailSnap.empty) {
                setIsAdminUser(true);
                // Synchronize UID into admins so that firestore security rules pass
                const matched = emailSnap.docs[0].data();
                await setDoc(doc(db, 'admins', user.uid), cleanFirestoreData({
                  email: user.email.toLowerCase().trim(),
                  role: matched.role || 'relawan',
                  name: matched.name || user.displayName || 'Tim Relawan',
                  addedAt: new Date().toISOString(),
                }), { merge: true });
              } else {
                setIsAdminUser(false);
              }
            } else {
              setIsAdminUser(false);
            }
          } catch (err) {
            console.warn('Admin check notice:', err);
            setIsAdminUser(false);
          }
        }
      } else {
        setUserProfile(null);
        setIsAdminUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to User Profile changes
  useEffect(() => {
    if (!currentUser) return;

    const docPath = `users/${currentUser.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUserProfile(profile);
          setIsMandatoryProfile(false);
          if (profile.role === 'relawan' || profile.role === 'perangkat_desa' || profile.role === 'admin' || currentUser.email === 'fabianricky28@gmail.com') {
            setIsAdminUser(true);
          }
        } else {
          // New user who hasn't completed their identity profile
          setIsMandatoryProfile(true);
          setIsProfileModalOpen(true);
        }
      },
      (error) => {
        console.warn('Profile read warning (may not exist yet):', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveAlertId(null);
      setActiveView('citizen');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Village Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-xl shadow-md shadow-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-slate-900">Siaga Keluarga</h1>
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-extrabold uppercase">
                  Desa
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Tanggap Darurat Terpadu Warga & Relawan
              </p>
            </div>
          </div>

          {/* User Controls & View Switcher */}
          <div className="flex items-center gap-2">
            {/* Quick Install Guide Button */}
            <button
              type="button"
              onClick={() => setIsInstallGuideOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/90 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Panduan Pasang di HP Warga"
            >
              <Smartphone className="w-3.5 h-3.5 text-red-600" />
              <span>Pasang di HP</span>
            </button>

            {authLoading ? (
              <span className="text-xs text-slate-400">Memuat...</span>
            ) : currentUser ? (
              <>
                {/* Responder / Command Center Toggle for Relawan & Admins */}
                {isAdminUser && (
                  <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-300 flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveView('citizen')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeView === 'citizen'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Tombol SOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('command')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                        activeView === 'command'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      <span>Posko Relawan</span>
                    </button>
                  </div>
                )}

                {/* Profile Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMandatoryProfile(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  title="Lihat atau Ubah Profil Identitas"
                >
                  <UserIcon className="w-3.5 h-3.5 text-red-600" />
                  <span className="max-w-[100px] sm:max-w-[150px] truncate">
                    {userProfile?.callSign || currentUser.displayName || 'Profil'}
                  </span>
                </button>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Keluar Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                Masuk / Buat Akun
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {authLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Menghubungkan ke Jaringan Siaga Desa...</p>
          </div>
        ) : !currentUser ? (
          /* Landing Screen when NOT logged in yet */
          <div className="py-8 sm:py-12 space-y-8 text-center max-w-xl mx-auto">
            {/* Big Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-700 rounded-3xl shadow-xl shadow-red-600/30 flex items-center justify-center mx-auto text-white">
                <ShieldAlert className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Aplikasi Siaga Keluarga
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Peringatan tanggap darurat warga terhubung langsung dengan Tim Relawan dan Perangkat Desa dengan koordinat GPS akurat.
                </p>
              </div>

              {/* Requirement explanation: 1x login for distinct identifier */}
              <div className="text-left bg-red-50/70 border border-red-200/90 rounded-2xl p-4 text-xs text-red-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                  Mengapa Harus Login Sekali?
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Cukup <strong>sekali login</strong> saja untuk mendaftarkan nama unik/panggilan Anda (misal: <em>"Pak Budi RT 02"</em>) serta alamat domisili. Saat ada situasi darurat (medis, kebakaran, keamanan, bencana), tim relawan langsung tahu siapa yang meminta tolong dan ke mana harus meluncur tanpa perlu ditanya ulang.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk Sekarang (Google atau Akun Baru)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInstallGuideOpen(true)}
                  className="w-full py-2.5 text-xs text-slate-700 hover:text-red-700 font-bold flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl transition-all"
                >
                  <Smartphone className="w-4 h-4 text-red-600" />
                  <span>Cara Pasang di Layar HP (Tanpa Play Store)</span>
                </button>
              </div>
            </div>

            {/* Quick feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="font-bold text-xs text-slate-900 mb-1">📍 Pelacakan GPS Real-Time</div>
                <p className="text-[11px] text-slate-500">Koordinat akurat langsung dikirimkan ke tim relawan terdekat.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="font-bold text-xs text-slate-900 mb-1">🚨 Sirine Posko Lapangan</div>
                <p className="text-[11px] text-slate-500">Pusat komando relawan langsung membunyikan alarm darurat.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="bg-emerald-500/10 text-emerald-800 font-bold text-xs mb-1">🤝 Langsung Ditindaklanjuti</div>
                <p className="text-[11px] text-slate-500">Hanya perangkat desa & relawan yang bertugas menanggapi laporan.</p>
              </div>
            </div>
          </div>
        ) : (
          /* User is logged in: Check profile or render dashboard */
          <>
            {userProfile ? (
              activeView === 'command' && isAdminUser ? (
                /* RESPONDER / VILLAGE OFFICIAL DASHBOARD */
                <ResponderDashboard
                  currentUser={{
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                  }}
                  currentUserProfile={userProfile}
                />
              ) : (
                /* CITIZEN DASHBOARD */
                <CitizenDashboard
                  userId={currentUser.uid}
                  userProfile={userProfile}
                  activeAlertId={activeAlertId}
                  onActiveAlertChange={setActiveAlertId}
                  onOpenProfile={() => {
                    setIsMandatoryProfile(false);
                    setIsProfileModalOpen(true);
                  }}
                  onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
                />
              )
            ) : (
              /* Waiting for user profile prompt */
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-md space-y-4 max-w-md mx-auto my-12">
                <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit mx-auto">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Satu Langkah Lagi!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan isi identitas nama panggilan unik dan alamat domisili Anda agar tombol darurat dapat diaktifkan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Isi Data Identitas Warga
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Copyright Siaga Keluarga ©2026. Ricky Fabian Syahreza. All Rights Reserved.</span>
          <button
            type="button"
            onClick={() => setIsInstallGuideOpen(true)}
            className="text-red-600 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Panduan Pasang HP</span>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userId={currentUser.uid}
          userEmail={currentUser.email || undefined}
          initialProfile={userProfile}
          onProfileUpdated={(updated) => setUserProfile(updated)}
          isMandatory={isMandatoryProfile}
        />
      )}

      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />
    </div>
  );
}
