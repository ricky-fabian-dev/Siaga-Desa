import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase';
import { SosAlert, SosStatus, UserProfile, VillageContact } from '../types';
import { getGoogleMapsNavUrl, getWhatsAppUrl } from '../utils/geo';
import { playIncomingAlertChime, playEmergencySiren, stopEmergencySiren } from '../utils/sound';
import { 
  ShieldAlert, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  User, 
  AlertTriangle,
  Ambulance,
  Flame,
  Waves,
  HelpCircle,
  Check,
  Search,
  Filter,
  Users,
  Building,
  Plus,
  Trash2
} from 'lucide-react';

interface ResponderDashboardProps {
  currentUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  };
  currentUserProfile: UserProfile | null;
}

export const ResponderDashboard: React.FC<ResponderDashboardProps> = ({
  currentUser,
  currentUserProfile,
}) => {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [filterStatus, setFilterStatus] = useState<SosStatus | 'semua'>('menunggu');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'laporan' | 'kontak' | 'tim'>('laporan');

  // Resolution modal state
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<SosAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Village contacts state
  const [contacts, setContacts] = useState<VillageContact[]>([]);
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCategory, setNewContactCategory] = useState('Puskesmas & Medis');

  // Relawan & Admin Team State
  interface AdminItem {
    id: string;
    email: string;
    role: 'relawan' | 'perangkat_desa' | 'admin';
    name?: string;
    addedAt?: string;
  }
  const [adminList, setAdminList] = useState<AdminItem[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'relawan' | 'perangkat_desa' | 'admin'>('relawan');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);

  // Track previous pending IDs for audio alerts
  const prevPendingCountRef = useRef<number>(0);

  // Listen to Admin / Relawan Team Directory
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const items: AdminItem[] = [];
        let hasSuperAdmin = false;
        snapshot.forEach((d) => {
          const data = d.data();
          const email = (data.email || '').toLowerCase().trim();
          if (email === 'fabianricky28@gmail.com') hasSuperAdmin = true;
          items.push({
            id: d.id,
            email,
            role: data.role || 'relawan',
            name: data.name || '',
            addedAt: data.addedAt,
          });
        });

        // Always show primary super admin if not in list yet
        if (!hasSuperAdmin) {
          items.unshift({
            id: 'super_admin_primary',
            email: 'fabianricky28@gmail.com',
            role: 'admin',
            name: 'Ricky Fabian (Super Admin)',
            addedAt: 'Utama',
          });
        }
        setAdminList(items);
      },
      (error) => {
        console.warn('Admins snapshot notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to SOS alerts
  useEffect(() => {
    const q = query(collection(db, 'sos_alerts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: SosAlert[] = [];
        let pendingCount = 0;
        snapshot.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as SosAlert;
          fetched.push(item);
          if (item.status === 'menunggu') {
            pendingCount++;
          }
        });

        // Trigger chime if there are new pending alerts
        if (pendingCount > prevPendingCountRef.current && soundEnabled) {
          playIncomingAlertChime();
        }
        prevPendingCountRef.current = pendingCount;
        setAlerts(fetched);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'sos_alerts');
      }
    );

    return () => unsubscribe();
  }, [soundEnabled]);

  // Listen to village contacts
  useEffect(() => {
    const q = query(collection(db, 'village_contacts'), orderBy('order', 'asc'), limit(20));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: VillageContact[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as VillageContact);
        });
        setContacts(list);
      },
      (error) => {
        // If collection doesn't exist yet, handle gracefully
        console.warn('Contacts snapshot warning:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleTakeAction = async (alert: SosAlert) => {
    if (!alert.id) return;
    const responderName = currentUserProfile?.callSign || currentUserProfile?.displayName || currentUser.displayName || 'Tim Relawan';
    
    try {
      const updatePayload = cleanFirestoreData({
        status: 'proses',
        handledByUserId: currentUser.uid,
        handledByName: responderName,
        handledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'sos_alerts', alert.id), updatePayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sos_alerts/${alert.id}`);
    }
  };

  const handleOpenResolveModal = (alert: SosAlert) => {
    setSelectedAlertForResolve(alert);
    setResolveNotes('');
  };

  const handleConfirmResolve = async () => {
    if (!selectedAlertForResolve?.id) return;
    try {
      setResolving(true);
      const resolvePayload = cleanFirestoreData({
        status: 'selesai',
        resolvedNotes: resolveNotes.trim() || 'Telah ditangani oleh tim relawan di lokasi kejadian.',
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'sos_alerts', selectedAlertForResolve.id), resolvePayload);
      setSelectedAlertForResolve(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sos_alerts/${selectedAlertForResolve.id}`);
    } finally {
      setResolving(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactTitle.trim() || !newContactPhone.trim()) return;

    try {
      const contactId = `contact_${Date.now()}`;
      const contactPayload = cleanFirestoreData({
        title: newContactTitle.trim().slice(0, 100),
        phone: newContactPhone.trim().slice(0, 20),
        category: newContactCategory,
        order: contacts.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'village_contacts', contactId), contactPayload);
      setNewContactTitle('');
      setNewContactPhone('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'village_contacts');
    }
  };

  const handleDeleteContact = async (id?: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'village_contacts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `village_contacts/${id}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setAdminErrorMsg(null);
    setAdminSuccessMsg(null);
    setAddingAdmin(true);

    try {
      const cleanEmail = newAdminEmail.toLowerCase().trim();
      const safeId = `admin_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      const adminPayload = cleanFirestoreData({
        email: cleanEmail,
        name: newAdminName.trim() || 'Petugas Siaga',
        role: newAdminRole,
        addedAt: new Date().toISOString(),
      });

      await setDoc(doc(db, 'admins', safeId), adminPayload);
      setAdminSuccessMsg(`Berhasil! Email ${cleanEmail} telah didaftarkan sebagai ${newAdminRole === 'relawan' ? 'Tim Relawan' : newAdminRole === 'perangkat_desa' ? 'Perangkat Desa' : 'Admin'}. Saat login, mereka langsung mendapatkan akses Posko.`);
      setNewAdminEmail('');
      setNewAdminName('');
    } catch (err) {
      console.error('Error adding admin:', err);
      setAdminErrorMsg('Gagal menambahkan hak akses relawan. Pastikan koneksi aman.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (email === 'fabianricky28@gmail.com') {
      alert('Email ini adalah Super Admin utama dan tidak dapat dicabut.');
      return;
    }
    const confirmDel = window.confirm(`Cabut hak akses relawan/admin untuk ${email}?`);
    if (!confirmDel) return;

    try {
      await deleteDoc(doc(db, 'admins', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((item) => {
    if (filterStatus === 'semua') return true;
    return item.status === filterStatus;
  });

  const pendingCount = alerts.filter((a) => a.status === 'menunggu').length;
  const inProgressCount = alerts.filter((a) => a.status === 'proses').length;
  const resolvedCount = alerts.filter((a) => a.status === 'selesai').length;

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medis':
        return <Ambulance className="w-5 h-5 text-rose-600" />;
      case 'kebakaran':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'bencana':
        return <Waves className="w-5 h-5 text-blue-600" />;
      case 'keamanan':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Posko Siaga Relawan & Perangkat Desa</h2>
                <span className="px-2 py-0.5 bg-red-500/30 text-red-300 border border-red-500/40 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Live Response
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pusat penerimaan panggilan darurat warga, koordinasi tim relawan, dan respon cepat lapangan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sirine Suara Aktif' : 'Suara Mati'}</span>
            </button>
          </div>
        </div>

        {/* Real-time stats summary */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70">
            <span className="text-[11px] font-medium text-slate-400 block">Menunggu Respon</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-rose-500">{pendingCount}</span>
              {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70">
            <span className="text-[11px] font-medium text-slate-400 block">Sedang Ditangani</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{inProgressCount}</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70">
            <span className="text-[11px] font-medium text-slate-400 block">Selesai Ditangani</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{resolvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'laporan'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Daftar Panggilan Darurat ({alerts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kontak')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'kontak'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Kontak Posko & Instansi ({contacts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tim')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'tim'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Tim Relawan & Admin ({adminList.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: SOS REPORTS */}
      {activeTab === 'laporan' && (
        <div className="space-y-4">
          {/* Status Filter buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterStatus('menunggu')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'menunggu'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>Menunggu ({pendingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('proses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'proses'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Sedang Ditangani ({inProgressCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('selesai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'selesai'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Selesai ({resolvedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'semua'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Semua Laporan ({alerts.length})</span>
            </button>
          </div>

          {/* Cards List */}
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Situasi Kondusif & Terkendali</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tidak ada laporan darurat dengan status "{filterStatus}". Sistem tetap siaga menerima laporan kapan saja.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAlerts.map((alert) => {
                const isPending = alert.status === 'menunggu';
                const isProcess = alert.status === 'proses';
                const isDone = alert.status === 'selesai';
                const isCanceled = alert.status === 'dibatalkan';

                return (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-2xl shadow-md border overflow-hidden transition-all ${
                      isPending
                        ? 'border-red-500 ring-2 ring-red-500/20 shadow-red-500/10'
                        : isProcess
                        ? 'border-amber-400'
                        : 'border-slate-200 opacity-90'
                    }`}
                  >
                    {/* Header bar of card */}
                    <div
                      className={`px-4 py-3 flex items-center justify-between text-xs font-bold ${
                        isPending
                          ? 'bg-red-50 border-b border-red-200 text-red-900'
                          : isProcess
                          ? 'bg-amber-50 border-b border-amber-200 text-amber-900'
                          : isDone
                          ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-900'
                          : 'bg-slate-100 border-b border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getEmergencyIcon(alert.emergencyType)}
                        <span className="uppercase tracking-wider">
                          Darurat {alert.emergencyType}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                          isPending
                            ? 'bg-red-600 text-white animate-pulse'
                            : isProcess
                            ? 'bg-amber-500 text-white'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-400 text-white'
                        }`}
                      >
                        {isPending
                          ? '🔴 Butuh Bantuan'
                          : isProcess
                          ? '🟡 Ditangani'
                          : isDone
                          ? '🟢 Selesai'
                          : 'Dibatalkan'}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3.5">
                      {/* Pelapor Profile */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <h3 className="text-base font-black text-slate-900">
                              {alert.userCallSign}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500">
                            Nama KTP: {alert.userName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(alert.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Address & GPS */}
                      <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200/70 text-xs">
                        <div className="flex items-start gap-2 text-slate-800">
                          <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Alamat / Patokan:</span>
                            <span className="text-slate-700">{alert.address}</span>
                            {alert.rtRw && (
                              <span className="inline-block ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                                {alert.rtRw}
                              </span>
                            )}
                          </div>
                        </div>

                        {alert.description && (
                          <div className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 italic">
                            "{alert.description}"
                          </div>
                        )}

                        {/* GPS Coordinates & Google Maps Route link */}
                        {alert.latitude && alert.longitude && (
                          <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                            <span className="text-[11px] text-slate-500 font-mono">
                              GPS: {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                            </span>
                            <a
                              href={getGoogleMapsNavUrl(alert.latitude, alert.longitude)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Buka Navigasi Rute</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Quick Communication Actions (Phone & WhatsApp) */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${alert.userPhone}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>Telepon ({alert.userPhone})</span>
                        </a>

                        <a
                          href={getWhatsAppUrl(
                            alert.userPhone,
                            `Halo ${alert.userCallSign}, kami dari Tim Relawan Siaga Desa menerima panggilan darurat Anda terkait ${alert.emergencyType}. Bantuan sedang kami koordinasikan.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Warga</span>
                        </a>
                      </div>

                      {/* Respon status log */}
                      {alert.handledByName && (
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <p className="font-semibold">
                            Sedang ditangani oleh: <strong>{alert.handledByName}</strong>
                          </p>
                          {alert.handledAt && (
                            <span className="text-[10px] text-amber-700">
                              Mulai respon: {new Date(alert.handledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}

                      {alert.resolvedNotes && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                          <p className="font-bold text-emerald-800">Catatan Penanganan Selesai:</p>
                          <p className="mt-0.5 text-slate-700">{alert.resolvedNotes}</p>
                        </div>
                      )}

                      {/* Action buttons for Relawan */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleTakeAction(alert)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            <span>🚨 Tangani Sekarang (Saya Menuju TKP)</span>
                          </button>
                        )}

                        {isProcess && (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => handleOpenResolveModal(alert)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Tandai Selesai & Beri Catatan</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: VILLAGE CONTACTS */}
      {activeTab === 'kontak' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Direktori Kontak Cepat Darurat Desa</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nomor-nomor ini akan tampil langsung di halaman utama aplikasi warga agar dapat dihubungi seketika.
            </p>
          </div>

          {/* Form to add new contact */}
          <form onSubmit={handleAddContact} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-red-600" />
              Tambah Nomor Kontak Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Instansi / Kontak</label>
                <input
                  type="text"
                  value={newContactTitle}
                  onChange={(e) => setNewContactTitle(e.target.value)}
                  placeholder="Misal: Ambulans Siaga Desa / Pak RT 01"
                  maxLength={100}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Telepon / HP</label>
                <input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="08123456789 atau 112"
                  maxLength={20}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kategori</label>
                <select
                  value={newContactCategory}
                  onChange={(e) => setNewContactCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Puskesmas & Medis">Puskesmas & Medis</option>
                  <option value="Keamanan & Polsek">Keamanan & Polsek</option>
                  <option value="Damkar & Kebakaran">Damkar & Kebakaran</option>
                  <option value="Perangkat Desa">Perangkat Desa</option>
                  <option value="Relawan Siaga">Relawan Siaga</option>
                </select>
              </div>
            </div>

            <div className="text-right pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Simpan Nomor Kontak
              </button>
            </div>
          </form>

          {/* List of Contacts */}
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{contact.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">{contact.phone}</span>
                    {contact.category && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                        {contact.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                  >
                    Uji Panggil
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RELAWAN & ADMIN TEAM MANAGEMENT */}
      {activeTab === 'tim' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Kelola Tim Relawan & Perangkat Desa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftarkan email orang yang berhak mengakses Posko, menerima sinyal darurat, dan merespons warga.
            </p>
          </div>

          {/* Explanation Card */}
          <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed">
            <strong>Cara Kerja:</strong> Masukkan alamat email Google / akun personil di formulir bawah ini. Saat orang tersebut membuka link aplikasi ini dan login dengan email tersebut, menu <strong>Posko Relawan</strong> akan otomatis terbuka di HP-nya!
          </div>

          {adminSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{adminSuccessMsg}</span>
            </div>
          )}

          {adminErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{adminErrorMsg}</span>
            </div>
          )}

          {/* Form to add new admin / relawan */}
          <form onSubmit={handleAddAdmin} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-red-600" />
              Tambah Hak Akses Relawan / Perangkat Desa
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Alamat Email (Google / Akun) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="contoh: budi.relawan@gmail.com"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Personil / Jabatan
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Misal: Budi Santoso - Ketua RT 02"
                  maxLength={100}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tingkat Peran / Hak Akses
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'relawan' | 'perangkat_desa' | 'admin')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                >
                  <option value="relawan">🚨 Tim Relawan Lapangan</option>
                  <option value="perangkat_desa">🏛️ Perangkat Desa / Pamong</option>
                  <option value="admin">⭐ Admin Posko Utama</option>
                </select>
              </div>
            </div>

            <div className="text-right pt-1">
              <button
                type="submit"
                disabled={addingAdmin}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {addingAdmin ? 'Mendaftarkan...' : 'Tambah Hak Akses'}
              </button>
            </div>
          </form>

          {/* List of Responders & Admins */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Personil Terdaftar ({adminList.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {adminList.map((adm) => {
                const isSuper = adm.email === 'fabianricky28@gmail.com';
                return (
                  <div
                    key={adm.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl text-white ${isSuper ? 'bg-amber-600' : adm.role === 'perangkat_desa' ? 'bg-indigo-600' : 'bg-red-600'}`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                            {adm.name || adm.email}
                          </h4>
                          {isSuper && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {adm.email}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">
                          {adm.role === 'relawan' ? 'Relawan Lapangan' : adm.role === 'perangkat_desa' ? 'Perangkat Desa' : 'Admin'}
                        </span>
                      </div>
                    </div>

                    {!isSuper && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Cabut Akses Relawan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* RESOLUTION MODAL */}
      {selectedAlertForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Selesaikan Penanganan Darurat
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pelapor: <strong>{selectedAlertForResolve.userCallSign}</strong> ({selectedAlertForResolve.userName})
              <br />
              Situasi: <strong className="capitalize">{selectedAlertForResolve.emergencyType}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Penanganan Relawan:
              </label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Contoh: Korban sudah dievakuasi ke RSUD oleh relawan, kondisi stabil. Situasi aman terkendali."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAlertForResolve(null)}
                disabled={resolving}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={resolving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {resolving ? 'Menyimpan...' : 'Konfirmasi Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
