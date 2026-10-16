import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { UserCheck, ShieldAlert, Phone, MapPin, Users, HeartPulse, Sparkles, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  initialProfile?: UserProfile | null;
  onProfileUpdated?: (profile: UserProfile) => void;
  isMandatory?: boolean; // When first time registering
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  initialProfile,
  onProfileUpdated,
  isMandatory = false,
}) => {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || '');
  const [callSign, setCallSign] = useState(initialProfile?.callSign || '');
  const [phoneNumber, setPhoneNumber] = useState(initialProfile?.phoneNumber || '');
  const [address, setAddress] = useState(initialProfile?.address || '');
  const [rtRw, setRtRw] = useState(initialProfile?.rtRw || '');
  const [emergencyContactName, setEmergencyContactName] = useState(initialProfile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(initialProfile?.emergencyContactPhone || '');
  const [notes, setNotes] = useState(initialProfile?.notes || '');
  const [role, setRole] = useState<UserRole>(initialProfile?.role || 'warga');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setDisplayName(initialProfile.displayName || '');
      setCallSign(initialProfile.callSign || '');
      setPhoneNumber(initialProfile.phoneNumber || '');
      setAddress(initialProfile.address || '');
      setRtRw(initialProfile.rtRw || '');
      setEmergencyContactName(initialProfile.emergencyContactName || '');
      setEmergencyContactPhone(initialProfile.emergencyContactPhone || '');
      setNotes(initialProfile.notes || '');
      setRole(initialProfile.role || 'warga');
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!callSign.trim()) {
      setError('Nama panggilan pembeda wajib diisi (contoh: Pak Budi RT 02)');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Nomor HP / WhatsApp wajib diisi agar relawan bisa menghubungi');
      return;
    }
    if (!address.trim()) {
      setError('Alamat rumah atau patokan wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if user is the admin email
      const finalRole = userEmail === 'fabianricky28@gmail.com' ? 'admin' : (initialProfile?.role || 'warga');

      const rawProfile: Record<string, unknown> = {
        displayName: displayName.trim().slice(0, 100),
        callSign: callSign.trim().slice(0, 60),
        phoneNumber: phoneNumber.trim().slice(0, 20),
        address: address.trim().slice(0, 200),
        role: finalRole,
        createdAt: initialProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (rtRw.trim()) {
        rawProfile.rtRw = rtRw.trim().slice(0, 30);
      }
      if (emergencyContactName.trim()) {
        rawProfile.emergencyContactName = emergencyContactName.trim().slice(0, 100);
      }
      if (emergencyContactPhone.trim()) {
        rawProfile.emergencyContactPhone = emergencyContactPhone.trim().slice(0, 20);
      }
      if (notes.trim()) {
        rawProfile.notes = notes.trim().slice(0, 300);
      }
      if (userEmail) {
        rawProfile.email = userEmail.slice(0, 120);
      }

      const profileData = cleanFirestoreData(rawProfile) as unknown as UserProfile;
      const docPath = `users/${userId}`;

      try {
        await setDoc(doc(db, 'users', userId), profileData, { merge: true });

        // If user is admin/relawan, write to admins collection as well
        if (finalRole === 'admin' || finalRole === 'relawan' || finalRole === 'perangkat_desa') {
          try {
            await setDoc(doc(db, 'admins', userId), {
              email: userEmail || '',
              role: finalRole,
              name: displayName.trim().slice(0, 100),
              addedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (adminErr) {
            console.warn('Admin record notice:', adminErr);
          }
        }
      } catch (firestoreErr) {
        handleFirestoreError(firestoreErr, OperationType.WRITE, docPath);
      }

      if (onProfileUpdated) {
        onProfileUpdated(profileData);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      setError('Gagal menyimpan profil identitas. Silakan coba kembali.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isMandatory ? 'Lengkapi Identitas Warga (1x Saja)' : 'Ubah Data Identitas & Alamat'}
              </h3>
              <p className="text-xs text-slate-300">
                Data ini memastikan Tim Relawan & Perangkat Desa tepat sasaran saat merespons darurat.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tips Nama Pembeda:</strong> Buat nama panggilan yang spesifik agar tidak tertukar dengan tetangga (misal: <em>"Pak Budi RT 02"</em>, <em>"Ibu Siti Toko Berkah"</em>, atau <em>"Ricky Fabian - Gang 3"</em>).
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap KTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Ricky Fabian"
                maxLength={100}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pembeda / Panggilan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                placeholder="Misal: Mas Ricky RT 04"
                maxLength={60}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-red-700 bg-red-50/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp / HP Aktif <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08123456789"
                  maxLength={20}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                RT / RW <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={rtRw}
                onChange={(e) => setRtRw(e.target.value)}
                placeholder="Contoh: RT 02 / RW 04"
                maxLength={30}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Rumah & Patokan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Misal: Jl. Mangga No. 8 (Rumah cat putih seberang pos ronda)"
                maxLength={200}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sertakan patokan warna rumah atau ciri khas agar tim relawan tidak tersesat saat malam/hujan.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Kontak Darurat Keluarga Terdekat (Opsional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Nama (misal: Istri / Anak / Saudara)"
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="No HP Kontak Keluarga"
                  maxLength={20}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              Catatan Medis Khusus / Kondisi Rumah (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Ada orang tua lansia tirah baring / riwayat jantung / ada tabung oksigen"
              rows={2}
              maxLength={300}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Identitas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
