import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, SosAlert, VillageContact } from '../types';
import { SosPanicButton } from './SosPanicButton';
import { 
  PhoneCall, 
  HeartHandshake, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Ambulance,
  Phone,
  Download
} from 'lucide-react';

interface CitizenDashboardProps {
  userId: string;
  userProfile: UserProfile;
  activeAlertId: string | null;
  onActiveAlertChange: (alertId: string | null) => void;
  onOpenProfile: () => void;
  onOpenInstallGuide: () => void;
}

const DEFAULT_EMERGENCY_CONTACTS: VillageContact[] = [
  {
    id: 'default_1',
    title: 'Posko Relawan & Ambulans Desa',
    phone: '0812-3456-7890',
    category: 'Relawan Siaga 24 Jam',
    order: 1,
  },
  {
    id: 'default_2',
    title: 'Puskesmas / Layanan Medis',
    phone: '119',
    category: 'Medis & Gawat Darurat',
    order: 2,
  },
  {
    id: 'default_3',
    title: 'Bhabinkamtibmas & Polsek',
    phone: '110',
    category: 'Keamanan Lingkungan',
    order: 3,
  },
  {
    id: 'default_4',
    title: 'Pemadam Kebakaran (Damkar)',
    phone: '113',
    category: 'Pencegahan Api',
    order: 4,
  },
];

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  userId,
  userProfile,
  activeAlertId,
  onActiveAlertChange,
  onOpenProfile,
  onOpenInstallGuide,
}) => {
  const [myHistory, setMyHistory] = useState<SosAlert[]>([]);
  const [villageContacts, setVillageContacts] = useState<VillageContact[]>(DEFAULT_EMERGENCY_CONTACTS);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  // Listen to this user's emergency history
  useEffect(() => {
    const q = query(
      collection(db, 'sos_alerts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SosAlert[] = [];
        snapshot.forEach((docSnap) => {
          const alert = { id: docSnap.id, ...docSnap.data() } as SosAlert;
          list.push(alert);
          // Auto-detect active alert
          if ((alert.status === 'menunggu' || alert.status === 'proses') && !activeAlertId) {
            onActiveAlertChange(alert.id || null);
          }
        });
        setMyHistory(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'sos_alerts');
      }
    );

    return () => unsubscribe();
  }, [userId, activeAlertId, onActiveAlertChange]);

  // Listen to village emergency contacts
  useEffect(() => {
    const q = query(collection(db, 'village_contacts'), orderBy('order', 'asc'), limit(10));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: VillageContact[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as VillageContact);
          });
          setVillageContacts(list);
        }
      },
      (error) => {
        console.warn('Village contacts notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      {/* Citizen Welcome Card with CallSign identity badge */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Sistem Siaga Terhubung</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Halo, <span className="underline decoration-white/40">{userProfile.callSign}</span>!
            </h2>
            <p className="text-xs text-red-100 mt-1 max-w-md">
              Alamat terdaftar: <strong>{userProfile.address}</strong> {userProfile.rtRw && `(${userProfile.rtRw})`}. 
              Pencet tombol di bawah saat butuh pertolongan mendesak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/20"
            >
              Ubah Data Diri
            </button>
            <button
              type="button"
              onClick={onOpenInstallGuide}
              className="px-3.5 py-2 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pasang di HP</span>
            </button>
          </div>
        </div>
      </div>

      {/* THE SOS PANIC BUTTON */}
      <SosPanicButton
        userProfile={userProfile}
        userId={userId}
        activeAlertId={activeAlertId}
        onActiveAlertChange={onActiveAlertChange}
      />

      {/* QUICK EMERGENCY VILLAGE CONTACTS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nomor Darurat Siaga Desa</h3>
              <p className="text-xs text-slate-500">Dapat langsung dipanggil seketika dalam kondisi mendesak</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {villageContacts.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/70 border border-slate-200 hover:border-red-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 group-hover:text-red-600 group-hover:border-red-200 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-900">
                    {contact.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">{contact.phone}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg group-hover:bg-red-700 transition-all shadow-sm">
                Panggil
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* EMERGENCY FIRST AID & SAFETY GUIDELINES (P3K) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Panduan Tanggap Darurat & P3K Warga</h3>
            <p className="text-xs text-slate-500">Tindakan pertolongan pertama sembari menunggu tim relawan tiba di lokasi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Serangan Jantung & Pingsan */}
          <div
            onClick={() => setSelectedGuide('medis')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-2 w-fit bg-rose-100 text-rose-700 rounded-xl mb-2.5">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">
                Warga Pingsan / Henti Napas
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cek respon, longgarkan pakaian, periksa denyut nadi, lakukan kompresi dada (RJP/CPR) jika henti napas.
              </p>
            </div>
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-3">
              Baca panduan <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Kebakaran Gas & Listrik */}
          <div
            onClick={() => setSelectedGuide('kebakaran')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-orange-300 bg-orange-50/40 hover:bg-orange-50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-2 w-fit bg-orange-100 text-orange-700 rounded-xl mb-2.5">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">
                Gas Bocor / Korsleting Api
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Jangan nyalakan saklar, tutup kobaran dengan kain basah, cabut regulator tabung gas, buka pintu dan jendela lebar.
              </p>
            </div>
            <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1 mt-3">
              Baca panduan <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Evakuasi Bencana */}
          <div
            onClick={() => setSelectedGuide('bencana')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-blue-50/40 hover:bg-blue-50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-2 w-fit bg-blue-100 text-blue-700 rounded-xl mb-2.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">
                Evakuasi Banjir & Longsor
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Matikan meteran listrik PLN, amankan berkas penting dalam plastik, evakuasi lansia dan balita ke titik kumpul aman desa.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-3">
              Baca panduan <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* MY SOS HISTORY */}
      {myHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Riwayat Panggilan Darurat Saya
            </h3>
          </div>

          <div className="space-y-2.5">
            {myHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 capitalize">
                      Darurat {item.emergencyType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'menunggu'
                          ? 'bg-red-600 text-white animate-pulse'
                          : item.status === 'proses'
                          ? 'bg-amber-500 text-white'
                          : item.status === 'selesai'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {new Date(item.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  {item.resolvedNotes && (
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      Catatan relawan: "{item.resolvedNotes}"
                    </p>
                  )}
                </div>

                {item.handledByName && (
                  <div className="text-right text-[11px] text-slate-500">
                    <span>Relawan:</span>
                    <strong className="block text-slate-800">{item.handledByName}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDE DETAIL MODAL */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            {selectedGuide === 'medis' && (
              <>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  Pertolongan Pertama Warga Pingsan / Henti Napas
                </h3>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p><strong>1. Periksa Kesadaran:</strong> Tepuk bahu korban dan panggil dengan suara keras ("Pak/Bu, buka matanya!").</p>
                  <p><strong>2. Hubungi Relawan / Ambulans Segera:</strong> Tekan tombol SOS di aplikasi ini.</p>
                  <p><strong>3. Cek Napas:</strong> Dekatkan telinga ke hidung korban dan perhatikan pergerakan dada selama 5-10 detik.</p>
                  <p><strong>4. Jika Masih Bernapas Normal:</strong> Miringkan tubuh korban ke samping (posisi pemulihan) agar jalan napas tidak tertutup lidah atau muntahan.</p>
                  <p><strong>5. Jika Tidak Ada Napas (Henti Jantung):</strong> Letakkan kedua telapak tangan di tengah dada, lakukan tekanan dada cepat (100-120 kali per menit) dengan kedalaman sekitar 5 cm sampai tim medis tiba.</p>
                </div>
              </>
            )}

            {selectedGuide === 'kebakaran' && (
              <>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Penanganan Kebakaran Tabung Gas & Api Dapur
                </h3>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p><strong>1. JANGAN PANIK & JANGAN MENYALAKAN LISTRIK:</strong> Hindari memencet saklar lampu atau kipas karena percikan listrik bisa memicu ledakan gas.</p>
                  <p><strong>2. Matikan Kompor & Lepas Regulator:</strong> Jika memungkinkan, putar tuas regulator gas untuk memutus pasokan bahan bakar.</p>
                  <p><strong>3. Tutup Api dengan Kain Basah:</strong> Ambil karung goni, selimut, atau handuk tebal, basahi dengan air sampai basah merata, lalu tutupkan ke arah kobaran api secara perlahan hingga padam.</p>
                  <p><strong>4. Ventilasi:</strong> Buka semua jendela dan pintu agar gas keluar dari ruangan.</p>
                </div>
              </>
            )}

            {selectedGuide === 'bencana' && (
              <>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-blue-600" />
                  Evakuasi Aman Bencana Banjir & Gempa
                </h3>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p><strong>1. Matikan Aliran Listrik Utama:</strong> Turunkan saklar MCB PLN di rumah untuk menghindari sengatan listrik air banjir.</p>
                  <p><strong>2. Amankan Tas Siaga:</strong> Siapkan obat-obatan darurat, KTP, KK, surat tanah, dan pakaian secukupnya dalam plastik kedap air.</p>
                  <p><strong>3. Utamakan Kelompok Rentan:</strong> Segera bantu lansia, ibu hamil, anak balita, dan penyandang disabilitas ke tempat evakuasi yang sudah ditentukan desa.</p>
                  <p><strong>4. Kirim SOS Koordinat:</strong> Jika terjebak di atap rumah atau terisolasi arus deras, kirim SOS lewat aplikasi ini agar titik koordinat Anda terlacak.</p>
                </div>
              </>
            )}

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
