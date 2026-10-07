# Nook

**Nook** adalah aplikasi pengelolaan kontak sederhana berbasis web yang dibangun menggunakan Node.js dan Express. Aplikasi ini memungkinkan pengguna untuk menyimpan, melihat, mengedit, dan menghapus data kontak dengan fitur tambahan seperti pencarian, pagination, dan unggah foto profil.

## Fitur Utama

- **CRUD Kontak**: Tambah, Lihat Detail, Ubah, dan Hapus data kontak.
- **Pencarian**: Mencari kontak berdasarkan nama, email, nomor HP, atau perusahaan.
- **Pagination**: Menampilkan data kontak dalam beberapa halaman untuk kenyamanan navigasi.
- **Image Upload**: Mendukung pengunggahan foto profil kontak menggunakan `multer`.
- **Validasi Data**: Menggunakan `express-validator` untuk memastikan data yang masuk (email, nomor HP, nama unik) valid.
- **Flash Messages**: Memberikan umpan balik visual setelah operasi berhasil dilakukan.

## Tech Stack

Aplikasi ini dibangun menggunakan teknologi berikut:

- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) dengan [Mongoose](https://mongoosejs.com/) (ODM)
- **Templating Engine**: [EJS](https://ejs.co/) (Embedded JavaScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Middleware**:
  - `express-ejs-layouts` (Layouting)
  - `express-validator` (Validation)
  - `multer` (File Upload)
  - `method-override` (HTTP Verb support for forms)
  - `connect-flash` & `express-session` (Feedback messages)

## Prasyarat (Prerequisites)

Sebelum menjalankan project ini, pastikan Anda sudah menginstal:

1. [Node.js](https://nodejs.org/) (versi terbaru disarankan)
2. [MongoDB](https://www.mongodb.com/try/download/community) terinstal dan berjalan di komputer Anda (default: `localhost:27017`)

## Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan project di lingkungan lokal Anda:

### 1. Clone atau Download Project

Pastikan Anda berada di direktori root project (`contact-app`).

### 2. Instal Dependensi

Jalankan perintah berikut di terminal untuk menginstal semua package yang dibutuhkan:

```bash
npm install
```

### 3. Persiapan Database

Pastikan layanan MongoDB Anda sudah aktif. Aplikasi ini akan otomatis membuat database bernama `nook` saat dijalankan (lihat konfigurasi di `utils/db.js`).

### 4. Build Tailwind CSS (Opsional/Development)

Jika Anda ingin memantau perubahan pada styling Tailwind CSS, jalankan:

```bash
npm run tw
```

### 5. Jalankan Aplikasi

Jalankan aplikasi dengan perintah:

```bash
node app
```

_Catatan: Jika Anda ingin menggunakan `nodemon` untuk auto-restart saat ada perubahan kode, Anda bisa menginstalnya terlebih dahulu lalu jalankan `nodemon app`._

### 6. Akses di Browser

Buka browser Anda dan akses alamat berikut:
[http://localhost:3000](http://localhost:3000)

---

## Struktur Folder

- `app.js`: File utama aplikasi Express.
- `model/`: Definisi skema database (Mongoose).
- `utils/`: Konfigurasi koneksi database.
- `views/`: File template EJS untuk tampilan UI.
- `public/`: Asset statis (CSS, Images, Uploads).
- `public/uploads/`: Tempat penyimpanan foto profil yang diunggah.
