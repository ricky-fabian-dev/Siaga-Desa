import React, { useState } from 'react';
import { 
  Smartphone, 
  CheckCircle, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  X, 
  Download, 
  Package, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Send, 
  AlertTriangle,
  Info,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'share'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Detect current web app URL (use production/shared fallback if in iframe)
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-h47w37ukr7hzok6ekbjgqj-721872863395.asia-northeast1.run.app';
  const cleanAppUrl = currentUrl.split('?')[0].split('#')[0];
  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(cleanAppUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanAppUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🚨 *APLIKASI SIAGA KELUARGA - TANGGAP DARURAT DESA*\n\nBapak/Ibu/Saudara warga desa, mari pasang aplikasi tombol darurat Siaga Desa di HP masing-masing. Ketika terjadi darurat (medis, kebakaran, keamanan, bencana), cukup 1 kali klik dan tim relawan desa langsung tahu titik lokasi GPS kita!\n\n📲 *Buka & Pasang di HP sekarang:*\n${cleanAppUrl}\n\n_(Cukup buka di Chrome/Safari lalu pilih 'Tambahkan ke Layar Utama' / 'Instal Aplikasi')_`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Panduan Akses & Unduh APK Warga</h3>
              <p className="text-[11px] text-slate-400">Pilihan cara instalasi mudah untuk masyarakat desa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-3 px-2 sm:px-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'border-red-600 text-red-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Pasang HP (PWA)</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] rounded font-extrabold uppercase">
              Rekomendasi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 px-2 sm:px-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'border-red-600 text-red-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Download .APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-2 sm:px-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-red-600 text-red-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Bagikan / QR</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: PWA (CARA TERBAIK UNTUK WARGA DESA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* Direct 1-Click Install Button if supported by current browser */}
              {isInstallable && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center space-y-2 shadow-sm">
                  <div className="font-bold text-sm text-emerald-950">Browser Mendukung 1-Klik Pasang!</div>
                  <p className="text-xs text-emerald-800">
                    Klik tombol di bawah ini untuk langsung memasang ikon aplikasi Siaga Keluarga ke layar HP Anda:
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await install();
                      if (success) onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instal Langsung ke HP Sekarang</span>
                  </button>
                </div>
              )}

              {/* Mengapa PWA lebih disarankan daripada file APK biasa */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-950">
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  Mengapa Pasang Langsung Lebih Baik dari File APK?
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  Warga <strong>tidak perlu mengizinkan "Sumber Tidak Dikenal"</strong> atau terkena peringatan Play Protect yang membingungkan. Ukuran sangat hemat (&lt; 1 MB) dan aplikasi otomatis terbarui ketika ada rilis baru tanpa warga harus unduh ulang file APK!
                </p>
              </div>

              {/* Android Chrome Instructions */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Panduan untuk HP Android (Google Chrome):
                </h4>
                <ol className="space-y-2.5 text-slate-700 pl-1">
                  <li className="flex items-start gap-2">
                    <MoreVertical className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>Buka link ini di Google Chrome, lalu ketuk <strong>ikon titik tiga (⋮)</strong> di sudut kanan atas browser.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> (atau <em>"Instal Aplikasi"</em>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Klik <strong>"Tambah"</strong>. Ikon <strong>Siaga Keluarga</strong> akan otomatis muncul di layar utama HP seperti aplikasi biasa!</span>
                  </li>
                </ol>
              </div>

              {/* iPhone Safari Instructions */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Panduan untuk Pengguna iPhone (Safari):
                </h4>
                <ol className="space-y-2.5 text-slate-700 pl-1">
                  <li className="flex items-start gap-2">
                    <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Buka di browser Safari, lalu ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas di bilah bawah).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>Gulir ke bawah dan ketuk <strong>"Add to Home Screen"</strong> (Tambahkan ke Layar Utama).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Ketuk <strong>"Add"</strong> di pojok kanan atas. Aplikasi selesai terpasang!</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD FILE .APK */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 space-y-1.5">
                <div className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <Package className="w-4 h-4 text-blue-600 shrink-0" />
                  Pembuatan Berkas Fisik Android APK (.apk)
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900/90">
                  Jika pihak Desa/RT ingin membagikan berkas installer mentah <strong>.APK</strong> lewat WhatsApp, Google Drive, atau Flashdisk tanpa melalui browser, berkas APK dapat dibuat dalam 1 menit menggunakan generator resmi <strong>Microsoft PWA Builder</strong>.
                </p>
              </div>

              {/* Step by Step Generation */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Langkah Membuat File APK:</h4>
                <ol className="space-y-3 text-slate-700 pl-1">
                  <li className="space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                      Salin URL Web Aplikasi Siaga:
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                      <input 
                        type="text" 
                        readOnly 
                        value={cleanAppUrl} 
                        className="flex-1 text-[11px] font-mono text-slate-600 bg-transparent outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                  </li>

                  <li className="space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                      Buka Generator Resmi PWA Builder:
                    </div>
                    <p className="text-[11px] text-slate-500">
                      PWABuilder adalah perangkat resmi dari Microsoft untuk mengemas web PWA menjadi APK Android bersertifikat.
                    </p>
                    <a
                      href={pwaBuilderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka PWABuilder (Otomatis Terisi URL)</span>
                    </a>
                  </li>

                  <li className="space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                      Download File .APK:
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      Di halaman PWABuilder, klik <strong>Package for Android</strong> &rarr; pilih <strong>Generate APK</strong>. File <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[10px]">app-release-unsigned.apk</code> akan terunduh ke komputer/HP Anda!
                    </p>
                  </li>

                  <li className="space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
                      Bagikan ke Warga:
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                      Kirimkan file <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[10px]">.apk</code> tersebut ke grup WhatsApp desa. Saat warga mengklik APK, jika muncul peringatan <em>"Instal aplikasi yang tidak dikenal"</em>, minta warga memilih <strong>Izinkan dari sumber ini</strong>.
                    </p>
                  </li>
                </ol>
              </div>

              {/* Notice about Offline Build with Capacitor */}
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <span className="font-bold text-slate-800">Catatan untuk Pengembang / Admin IT Desa:</span>
                <p>
                  Tersedia juga panduan build native via Android Studio & Capacitor di dalam dokumen <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">PANDUAN_CASAOS_DAN_APK.md</code>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: BAGIKAN KE WARGA & QR CODE */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">QR Code Akses Cepat Warga</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Cetak QR Code ini untuk ditempel di Balai Desa, Poskamling / Gardu Ronda, Puskesmas, atau kirim fotonya ke WhatsApp RT.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 p-5 rounded-3xl text-center flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cleanAppUrl)}&margin=10`}
                    alt="QR Code Siaga Keluarga"
                    className="w-44 h-44 object-contain mx-auto rounded-lg"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono break-all max-w-xs">
                  {cleanAppUrl}
                </div>
              </div>

              {/* Action Buttons for Sharing */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Teks Undangan ke WhatsApp Grup Warga</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tautan Tersalin!' : 'Salin Tautan'}</span>
                  </button>

                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(cleanAppUrl)}&margin=10`}
                    download="QR-Code-Siaga-Keluarga.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Gambar QR</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Siaga Keluarga Desa</span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
