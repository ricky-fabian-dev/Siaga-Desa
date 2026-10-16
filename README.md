# 🚨 Siaga Keluarga - Tanggap Darurat Warga & Desa

> **Sistem Informasi & Peringatan Darurat Warga Real-Time** yang menghubungkan warga desa secara langsung dengan Tim Relawan dan Posko Perangkat Desa berbasis titik koordinat GPS akurat, sirine peringatan posko, identitas terverifikasi, dan panduan P3K mandiri.

[![Build Android APK](https://github.com/USERNAME/REPO/actions/workflows/build-apk.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/build-apk.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-emerald.svg)](https://web.dev/progressive-web-apps/)
[![Capacitor Android](https://img.shields.io/badge/Capacitor-Android_APK-blue.svg)](https://capacitorjs.com/)
[![React 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## 📱 Fitur Utama Aplikasi

1. **Tombol Panik Darurat (SOS Button):**
   - 4 Kategori Darurat: Medis/Kesehatan, Kebakaran, Keamanan/Kriminalitas, dan Bencana Alam.
   - Deteksi koordinat GPS presisi secara otomatis dan pelacakan live status penanganan.
2. **Posko Komando Relawan & Perangkat Desa:**
   - Audio sirine darurat otomatis berbunyi di posko saat warga menekan tombol SOS.
   - Peta dan koordinat penjemputan warga (langsung buka Google Maps rute tercepat).
   - Penugasan relawan, pencatatan tindakan lapangan, dan penyelesaian insiden.
3. **PWA & Android Native APK:**
   - Dapat dipasang langsung di layar HP Android/iOS dalam 10 detik tanpa Play Store.
   - Siap dikemas menjadi file fisik `.apk` Android menggunakan Capacitor atau GitHub Actions.
4. **Brosur QR Code & Broadcast WhatsApp:**
   - Generator QR Code resmi desa untuk dicetak di Gardu Ronda/Poskamling.
   - Tombol 1-klik broadcast template pesan darurat ke grup WhatsApp RT/RW.
5. **Panduan Tanggap Darurat & P3K:**
   - Protokol RJP (CPR) henti jantung, penanganan tabung gas bocor, dan mitigasi bencana.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite, Lucide Icons, Motion
- **Database & Auth:** Firebase Firestore (Realtime Data Streams) & Firebase Authentication
- **Mobile Engine:** Vite PWA (`vite-plugin-pwa`) & Capacitor 8 (`@capacitor/android`)
- **CI/CD:** GitHub Actions (Otomatis kompilasi APK Android)

---

## 🚀 Panduan Memasukkan Coding ke GitHub (Push to GitHub)

Jalankan perintah berikut di terminal / command prompt komputer Anda:

```bash
# 1. Inisialisasi Git di folder proyek ini (jika belum)
git init

# 2. Tambahkan semua berkas ke git staging
git add .

# 3. Lakukan commit pertama
git commit -m "feat: initial commit Siaga Keluarga App v1.0.0"

# 4. Ubah branch default menjadi 'main'
git branch -M main

# 5. Hubungkan ke repositori GitHub Anda (ganti URL di bawah dengan URL repo GitHub Anda)
git remote add origin https://github.com/USERNAME_ANDA/siaga-keluarga.git

# 6. Push kode ke GitHub
git push -u origin main
```

---

## 📦 Cara Menjadikan File APK Android

Terdapat 3 pilihan mudah untuk mengubah source code ini menjadi file installer `.apk`:

### Pilihan A: Otomatis via GitHub Actions (Paling Praktis Tanpa Install Software)
Repositori ini sudah dilengkapi berkas workflow `.github/workflows/build-apk.yml`.
1. Begitu Anda menjalankan `git push -u origin main`, GitHub akan otomatis mem-build file APK di cloud.
2. Buka halaman GitHub repo Anda $\rightarrow$ klik tab **Actions**.
3. Klik proses workflow **Build Android APK** yang selesai.
4. Di bagian **Artifacts**, klik **`Siaga-Keluarga-Debug-APK`** untuk langsung mengunduh file `.apk` yang siap dipasang di HP!

### Pilihan B: Lewat Generator Microsoft PWABuilder (1 Menit)
1. Buka situs resmi: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
2. Masukkan URL web aplikasi yang sudah online / dideploy.
3. Klik **Start** $\rightarrow$ **Package for Android** $\rightarrow$ **Generate APK**.
4. Unduh file `.apk` dan bagikan ke warga.

### Pilihan C: Build Offline dengan Android Studio (Capacitor)
Jika Anda memiliki Android Studio di komputer:

```bash
# 1. Build berkas web
npm run build

# 2. Tambahkan platform Android (hanya dilakukan sekali di awal)
npx cap add android

# 3. Sinkronkan assets ke folder Android
npm run cap:sync

# 4. Buka proyek di Android Studio
npm run cap:open
```
Di Android Studio:
Pilih menu **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.

---

## 💻 Menjalankan Aplikasi Secara Lokal (Development)

```bash
# 1. Pasang dependensi
npm install

# 2. Salin template variabel lingkungan
cp .env.example .env

# 3. Jalankan server lokal
npm run dev
```
Buka browser di `http://localhost:3000`.



---

## 📄 Lisensi
Hak Cipta © 2026 **Siaga Keluarga**. Seluruh hak dilindungi undang-undang.
Dibuat untuk keselamatan warga dan kesiapsiagaan tanggap darurat desa.
