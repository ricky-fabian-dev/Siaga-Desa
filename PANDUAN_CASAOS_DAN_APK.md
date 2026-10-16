# Panduan Lengkap: Cara Download File APK & Akses Aplikasi oleh Masyarakat Desa

Aplikasi **Siaga Keluarga - Tanggap Darurat Desa** dirancang agar dapat diakses oleh seluruh lapisan masyarakat dengan sangat mudah, baik sebagai file fisik installer **APK Android** maupun sebagai **Aplikasi Web Mandiri (PWA)** yang dapat langsung dipasang ke layar beranda HP.

---

## 🌟 Cara 1 (Paling Direkomendasikan untuk Warga): Pasang Langsung ke Layar HP (PWA)

### Mengapa Cara Ini Paling Cocok untuk Masyarakat?
1. **Tidak Ribet:** Warga tidak perlu membuka menu pengaturan HP untuk mengaktifkan *"Izinkan instal dari sumber tidak dikenal"*.
2. **Bebas Peringatan Google Play Protect:** Tidak ada pop-up pemblokiran keamanan.
3. **Ukuran Sangat Ringan (< 1 MB):** Tidak memenuhi memori HP warga.
4. **Otomatis Ter-update:** Jika tim desa memperbarui aplikasi, HP warga otomatis ikut terbarui tanpa harus mengunduh ulang file APK.

### Langkah Pasang untuk Warga:
- **Pengguna Android (Google Chrome):**
  1. Buka link aplikasi web:  
     `https://ais-pre-h47w37ukr7hzok6ekbjgqj-721872863395.asia-northeast1.run.app`
  2. Ketuk ikon titik tiga (⋮) di pojok kanan atas browser Chrome.
  3. Pilih **"Tambahkan ke Layar Utama"** (atau *"Instal Aplikasi"*).
  4. Ketuk **Tambah / Instal**. Ikon **Siaga Keluarga** langsung muncul di halaman depan HP warga seperti aplikasi dari Play Store.

- **Pengguna iPhone (Safari):**
  1. Buka link di Safari.
  2. Ketuk tombol **Bagikan (Share)** (ikon kotak dengan panah ke atas di bagian bawah layar).
  3. Gulir ke bawah dan ketuk **"Add to Home Screen"** (Tambahkan ke Layar Utama).
  4. Ketuk **Add**.

---

## 📦 Cara 2: Membuat & Mengunduh Berkas Fisik `.APK` Android

Jika Anda sebagai perangkat desa atau pengurus RT/RW ingin membagikan berkas installer mentah berupa file **`.apk`** (misal dikirim lewat dokumen WhatsApp, Google Drive, atau Flashdisk):

### Cara Cepat (1 Menit via Microsoft PWA Builder):
Aplikasi ini sudah memenuhi standar 100% PWA (Service Worker aktif, Web App Manifest valid, Ikon 192px & 512px). Anda bisa mengubahnya menjadi file APK secara instan:

1. **Buka generator resmi PWA Builder (milik Microsoft):**  
   👉 **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
2. Masukkan URL aplikasi Anda:  
   `https://ais-pre-h47w37ukr7hzok6ekbjgqj-721872863395.asia-northeast1.run.app`
3. Klik tombol **Start**. Sistem akan memverifikasi manifest dan ikon secara otomatis (skor PWA Store Ready).
4. Di bagian Android, klik tombol **Package for Android**.
5. Pilih opsi **Generate APK** (atau Download Package).
6. Simpan file `.apk` yang dihasilkan di komputer atau HP Anda.
7. File `.apk` siap disebarkan ke warga!

> **Tips Saat Warga Menginstal File APK:**  
> Karena APK ini didistribusikan langsung (sideload) dan belum masuk Google Play Store berbayar, saat warga membuka file `.apk` pertama kali, Android akan memunculkan konfirmasi:
> - Klik **Setelan (Settings)** $\rightarrow$ aktifkan **"Izinkan dari sumber ini (Allow from this source)"**.
> - Klik **Instal**.

---

## 📢 Cara 3: Membagikan Akses Cepat ke Warga Desa (Brosur QR Code & WhatsApp)

Di dalam aplikasi, kami telah menambahkan fitur **"Unduh APK / Pasang HP"** di bilah atas:

1. **QR Code Balai Desa & Pos Ronda:**
   - Buka menu **Unduh APK / Pasang HP** di pojok kanan atas.
   - Buka tab **"Bagikan / QR"**.
   - Unduh gambar QR Code resmi Siaga Desa.
   - Cetak dan tempel di Pos Ronda, Balai Desa, Tempat Ibadah, atau Warung Warga. Warga cukup mengarahkan kamera HP ke QR Code tersebut untuk langsung masuk ke aplikasi.

2. **Broadcast WhatsApp Grup RT/RW:**
   - Di tab **"Bagikan / QR"**, klik tombol **"Kirim Teks Undangan ke WhatsApp Grup Warga"**.
   - Sistem akan otomatis menyiapkan pesan resmi lengkap dengan link dan petunjuk singkat bagi warga.

---

## 💻 Cara 4 (Untuk Tim IT Desa): Build Native APK via Capacitor & Android Studio

Jika ingin menandatangani APK dengan KeyStore resmi atau mengunggahnya ke Google Play Console desa:

```bash
# 1. Pasang modul Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inisialisasi Proyek Capacitor
npx cap init "Siaga Keluarga" "com.siagakeluarga.desa" --web-dir dist

# 3. Build bundle produksi
npm run build

# 4. Tambahkan platform Android
npx cap add android

# 5. Buka di Android Studio
npx cap open android
```
Di Android Studio:  
Pilih menu **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**. File APK siap digunakan.
