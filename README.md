# Jurnal 7 KAIH - SMP Negeri 2 Kasihan

Aplikasi pencatatan jurnal harian **7 Kebiasaan Anak Indonesia Hebat (7 KAIH)** untuk SMP Negeri 2 Kasihan, Bantul. Dilengkapi dengan validasi orang tua, panel wali kelas, analisis kebiasaan, dan cetak rekap laporan resmi PDF.

---

## 🚀 Panduan Deploy ke GitHub & Vercel

### 1. Upload / Push ke GitHub

Buka terminal di folder project Anda, lalu jalankan perintah berikut:

```bash
# 1. Inisialisasi Git (jika belum)
git init

# 2. Tambahkan semua file ke staging
git add .

# 3. Buat commit pertama
git commit -m "feat: initial commit Jurnal 7 KAIH SMPN 2 Kasihan"

# 4. Buat branch utama main
git branch -M main

# 5. Hubungkan ke repository GitHub Anda (ganti URL dengan repo Anda)
git remote add origin https://github.com/USERNAME/NAMA-REPO.git

# 6. Push ke GitHub
git push -u origin main
```

---

### 2. Deploy ke Vercel

Aplikasi ini sudah dilengkapi konfigurasi `vercel.json` untuk SPA (Single Page Application) routing.

#### Opsi A: Melalui Dashboard Vercel (Paling Mudah)
1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** ➜ **"Project"**.
3. Pilih repository GitHub Anda (`NAMA-REPO`) dan klik **"Import"**.
4. Pengaturan build akan otomatis terdeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Klik **"Deploy"**.
6. Dalam hitungan detik, aplikasi Anda sudah live dengan domain gratis `https://nama-project.vercel.app`.

#### Opsi B: Melalui Vercel CLI (Terminal)
```bash
# Install Vercel CLI secara global (jika belum)
npm i -g vercel

# Login ke akun Vercel
vercel login

# Deploy ke production
vercel --prod
```

---

## 🛠️ Perintah Pengembangan Lokal (Local Development)

```bash
# Install dependensi
npm install

# Jalankan server lokal
npm run dev

# Build untuk produksi
npm run build

# Preview hasil build
npm run preview
```

---

## 📁 Struktur File Konfigurasi
- `vercel.json`: Konfigurasi routing rewrite SPA dan caching header aset di Vercel.
- `.github/workflows/deploy.yml`: Otomasi CI GitHub Actions untuk verifikasi linting dan build setiap push ke branch `main`/`master`.
- `.gitignore`: Mengabaikan file temporary, `node_modules/`, `dist/`, dan `.vercel`.
