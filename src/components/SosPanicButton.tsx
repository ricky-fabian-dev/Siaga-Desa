import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase';
import { UserProfile, EmergencyType, SosAlert } from '../types';
import { getCurrentLocation, GeoCoordinates, getGoogleMapsUrl } from '../utils/geo';
import { playEmergencySiren, stopEmergencySiren, playSuccessChime } from '../utils/sound';
import { 
  AlertTriangle, 
  Flame, 
  Ambulance, 
  ShieldAlert, 
  Waves, 
  HelpCircle, 
  MapPin, 
  Volume2, 
  VolumeX, 
  XCircle, 
  PhoneCall, 
  CheckCircle,
  Loader2,
  Navigation
} from 'lucide-react';

interface SosPanicButtonProps {
  userProfile: UserProfile;
  userId: string;
  activeAlertId: string | null;
  onActiveAlertChange: (alertId: string | null) => void;
}

const EMERGENCY_TYPES: { type: EmergencyType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    type: 'medis',
    label: 'Medis / Sakit Parah',
    icon: <Ambulance className="w-5 h-5 text-rose-600" />,
    color: 'border-rose-500 bg-rose-50/70 text-rose-900',
    desc: 'Kondisi kritis, henti napas, serangan jantung, pendarahan, kecelakaan, atau melahirkan',
  },
  {
    type: 'kebakaran',
    label: 'Kebakaran / Gas Bocor',
    icon: <Flame className="w-5 h-5 text-orange-600" />,
    color: 'border-orange-500 bg-orange-50/70 text-orange-900',
    desc: 'Kobaran api rumah/lahan, korsleting listrik besar, atau tabung gas bocor terbakar',
  },
  {
    type: 'keamanan',
    label: 'Keamanan / Maling / Begal',
    icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
    color: 'border-amber-500 bg-amber-50/70 text-amber-900',
    desc: 'Pencurian, begal, perampokan, keributan massa, atau ancaman keselamatan fisik',
  },
  {
    type: 'bencana',
    label: 'Bencana Alam / Evakuasi',
    icon: <Waves className="w-5 h-5 text-blue-600" />,
    color: 'border-blue-500 bg-blue-50/70 text-blue-900',
    desc: 'Banjir bandang, tanah longsor, angin puting beliung, pohon tumbang, atau gempa',
  },
  {
    type: 'lainnya',
    label: 'Bantuan Darurat Lainnya',
    icon: <HelpCircle className="w-5 h-5 text-purple-600" />,
    color: 'border-purple-500 bg-purple-50/70 text-purple-900',
    desc: 'Warga hilang, terjebak di sumur/atap, atau situasi butuh bantuan warga segera',
  },
];

export const SosPanicButton: React.FC<SosPanicButtonProps> = ({
  userProfile,
  userId,
  activeAlertId,
  onActiveAlertChange,
}) => {
  const [selectedType, setSelectedType] = useState<EmergencyType>('medis');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active alert details
  const [activeAlert, setActiveAlert] = useState<SosAlert | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  // Fetch initial location
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const pos = await getCurrentLocation();
      setCoords(pos);
    } catch (err: unknown) {
      setGpsError(err instanceof Error ? err.message : 'Gagal mendeteksi lokasi');
    } finally {
      setGpsLoading(false);
    }
  };

  // Listen to active alert changes
  useEffect(() => {
    if (!activeAlertId) {
      setActiveAlert(null);
      stopEmergencySiren();
      setIsSirenPlaying(false);
      return;
    }

    const docPath = `sos_alerts/${activeAlertId}`;
    const unsubscribe = onSnapshot(
      doc(db, 'sos_alerts', activeAlertId),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as SosAlert;
          setActiveAlert(data);
          if (data.status === 'selesai' || data.status === 'dibatalkan') {
            stopEmergencySiren();
            setIsSirenPlaying(false);
            playSuccessChime();
          }
        } else {
          setActiveAlert(null);
          onActiveAlertChange(null);
          stopEmergencySiren();
          setIsSirenPlaying(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );

    return () => {
      unsubscribe();
      stopEmergencySiren();
    };
  }, [activeAlertId, onActiveAlertChange]);

  const toggleSirenAudio = () => {
    if (isSirenPlaying) {
      stopEmergencySiren();
      setIsSirenPlaying(false);
    } else {
      playEmergencySiren(0.3);
      setIsSirenPlaying(true);
    }
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          triggerSosAlert();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  const triggerSosAlert = async () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);

    try {
      setSubmitting(true);
      // Ensure we have coords or fallback
      let loc = coords;
      if (!loc) {
        try {
          loc = await getCurrentLocation();
          setCoords(loc);
        } catch {
          // Proceed even if GPS failed, rely on registered address
        }
      }

      const rawAlert: Record<string, unknown> = {
        userId,
        userName: userProfile.displayName,
        userCallSign: userProfile.callSign,
        userPhone: userProfile.phoneNumber,
        emergencyType: selectedType,
        address: userProfile.address,
        status: 'menunggu',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (description.trim()) {
        rawAlert.description = description.trim().slice(0, 500);
      }
      if (userProfile.rtRw) {
        rawAlert.rtRw = userProfile.rtRw.slice(0, 30);
      }
      if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        rawAlert.latitude = loc.latitude;
        rawAlert.longitude = loc.longitude;
        if (typeof loc.accuracy === 'number') {
          rawAlert.accuracy = loc.accuracy;
        }
      }

      const alertPayload = cleanFirestoreData(rawAlert);
      const docRef = await addDoc(collection(db, 'sos_alerts'), alertPayload);
      onActiveAlertChange(docRef.id);
      playEmergencySiren(0.3);
      setIsSirenPlaying(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sos_alerts');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelActiveAlert = async () => {
    if (!activeAlertId || !activeAlert) return;
    const confirmCancel = window.confirm('Batalkan panggilan darurat ini? (Pilih Oke jika situasi sudah aman/salah tekan)');
    if (!confirmCancel) return;

    try {
      await updateDoc(doc(db, 'sos_alerts', activeAlertId), {
        status: 'dibatalkan',
        updatedAt: new Date().toISOString(),
      });
      stopEmergencySiren();
      setIsSirenPlaying(false);
      onActiveAlertChange(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sos_alerts/${activeAlertId}`);
    }
  };

  // If user currently has an active broadcast
  if (activeAlert && (activeAlert.status === 'menunggu' || activeAlert.status === 'proses')) {
    const isAccepted = activeAlert.status === 'proses';

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-red-500 overflow-hidden">
        {/* Flashing Top Alert Bar */}
        <div className={`p-4 text-white text-center transition-colors ${isAccepted ? 'bg-amber-600' : 'bg-red-600 animate-pulse'}`}>
          <div className="flex items-center justify-center gap-2 font-black text-lg tracking-wide uppercase">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <span>{isAccepted ? 'Darurat Sedang Ditangani Tim' : 'Sinyal SOS Sedang Terpancar!'}</span>
          </div>
          <p className="text-xs text-white/90 mt-0.5">
            {isAccepted
              ? 'Petugas relawan sudah mengonfirmasi dan sedang menuju lokasi Anda.'
              : 'Pusat Komando Relawan & Perangkat Desa telah menerima alarm darurat ini.'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Details */}
          <div className={`p-4 rounded-xl border ${isAccepted ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Tindak Lanjut</span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isAccepted ? 'bg-amber-500 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
                {isAccepted ? 'Sedang Bergerak Menuju TKP' : 'Menunggu Respon Relawan'}
              </span>
            </div>

            {isAccepted && activeAlert.handledByName && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 text-sm text-slate-800">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Ditangani oleh: {activeAlert.handledByName}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tetap tenang dan amankan diri di lokasi sampai personil tiba.
                </p>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Jenis Darurat:</span>
                <p className="font-bold text-slate-800 capitalize">{activeAlert.emergencyType}</p>
              </div>
              <div>
                <span className="text-slate-400">Identitas Pelapor:</span>
                <p className="font-bold text-slate-800">{activeAlert.userCallSign}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Alamat Terdaftar:</span>
                <p className="font-medium text-slate-800">{activeAlert.address} ({activeAlert.rtRw || 'RT/RW -'})</p>
              </div>
              {activeAlert.latitude && activeAlert.longitude && (
                <div className="col-span-2 flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                    <span>GPS: {activeAlert.latitude.toFixed(5)}, {activeAlert.longitude.toFixed(5)}</span>
                  </div>
                  <a
                    href={getGoogleMapsUrl(activeAlert.latitude, activeAlert.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Cek Peta</span>
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Audio siren toggle & Cancel Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSirenAudio}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSirenPlaying 
                  ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-inner' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isSirenPlaying ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>{isSirenPlaying ? 'Bunyikan Sirine (Nyala)' : 'Sirine Senyap (Mati)'}</span>
            </button>

            <button
              type="button"
              onClick={cancelActiveAlert}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Batalkan Laporan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
      {/* Category selector */}
      <div className="p-5 pb-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          1. Pilih Situasi Darurat Anda:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EMERGENCY_TYPES.map((item) => {
            const isSelected = selectedType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${item.color} ring-2 ring-red-500 shadow-md font-semibold`
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {item.icon}
                  {isSelected && <span className="w-2 h-2 rounded-full bg-red-600" />}
                </div>
                <div className="text-xs font-bold leading-tight">{item.label}</div>
              </button>
            );
          })}
        </div>

        {/* Selected type description */}
        <p className="text-[11px] text-slate-500 mt-2 px-1">
          {EMERGENCY_TYPES.find((t) => t.type === selectedType)?.desc}
        </p>
      </div>

      {/* GPS Status and Optional Note */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>Lokasi GPS Perangkat:</span>
          </div>
          <button
            type="button"
            onClick={fetchLocation}
            disabled={gpsLoading}
            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Perbarui GPS'}
          </button>
        </div>

        {coords ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Akurasi GPS: ~{coords.accuracy} meter</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </span>
          </div>
        ) : gpsError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
            {gpsError}. Relawan akan menggunakan alamat rumah terdaftar: <strong>{userProfile.address}</strong>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Mencari koordinat GPS satelit...</span>
          </div>
        )}

        {/* Quick note input */}
        <div className="mt-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan singkat / patokan posisi saat ini (opsional)"
            maxLength={200}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* BIG PANIC BUTTON ACTION */}
      <div className="p-6 bg-gradient-to-b from-slate-50 to-red-50/40 flex flex-col items-center justify-center border-t border-slate-200">
        {countdown !== null ? (
          /* Countdown In Progress */
          <div className="text-center py-4 space-y-4">
            <div className="text-sm font-bold text-slate-700">
              Panggilan Darurat Akan Terkirim Dalam:
            </div>
            <div className="w-24 h-24 rounded-full bg-red-600 text-white font-black text-5xl flex items-center justify-center mx-auto shadow-2xl animate-ping-slow">
              {countdown}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={triggerSosAlert}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Kirim Langsung Sekarang
              </button>
              <button
                type="button"
                onClick={handleCancelCountdown}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batalkan
              </button>
            </div>
          </div>
        ) : (
          /* Idle Panic Button */
          <div className="flex flex-col items-center">
            <div className="relative group">
              {/* Outer pulsing ripples */}
              <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
              <div className="absolute -inset-2 bg-red-600/30 rounded-full animate-pulse pointer-events-none" />

              <button
                type="button"
                onClick={handleStartCountdown}
                disabled={submitting}
                className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-800 active:scale-95 text-white font-black shadow-2xl shadow-red-600/50 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border-4 border-white select-none"
              >
                <AlertTriangle className="w-12 h-12 text-white animate-pulse" />
                <span className="text-2xl sm:text-3xl tracking-wider font-extrabold">SOS</span>
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-red-100 bg-red-900/40 px-3 py-0.5 rounded-full">
                  Pencet Darurat
                </span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-5 text-center max-w-xs">
              Ketuk untuk memulai hitungan 3 detik atau kirim sinyal ke Posko Relawan & Perangkat Desa.
            </p>

            <button
              type="button"
              onClick={triggerSosAlert}
              disabled={submitting}
              className="mt-3 text-xs text-red-600 hover:text-red-700 font-semibold underline cursor-pointer"
            >
              Tanpa hitungan (Kirim Seketika)
            </button>
          </div>
        )}
      </div>

      {/* Identity Preview Footnote */}
      <div className="bg-slate-900 text-slate-300 px-5 py-3 text-xs flex items-center justify-between">
        <div>
          <span className="text-slate-400">Identitas Pelapor:</span>{' '}
          <strong className="text-white">{userProfile.callSign}</strong>{' '}
          <span className="text-slate-400">({userProfile.displayName})</span>
        </div>
        <div className="text-right text-slate-400">
          {userProfile.phoneNumber}
        </div>
      </div>
    </div>
  );
};
