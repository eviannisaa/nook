# Nook

**Nook** adalah aplikasi web pribadi untuk menyimpan kontak dan menulis catatan
harian. Setiap user punya akun sendiri, dan kontak atau catatan bisa dibagikan
ke akun lain. Catatan bisa dikunci dengan key yang hanya diketahui pemiliknya.

Dibangun dengan Node.js, Express, MongoDB, dan EJS.

## Fitur

### Akun

- Sign up dan login dengan username dan password.
- Password di-hash dengan scrypt.
- Session disimpan di MongoDB, jadi user tetap login saat aplikasi di-restart.
  Session berlaku seminggu sejak kunjungan terakhir, paling lama 30 hari sejak
  login.
- Percobaan login dan sign up dibatasi per alamat dan per username.

### Kontak

- Create, lihat detail, edit, dan delete kontak.
- Search berdasarkan nama, email, nomor HP, atau perusahaan, dengan pagination.
- Tampilan list atau card.
- Upload foto kontak. Foto hanya dikirim ke user yang berhak melihat kontak
  tersebut.

### Catatan (Writing)

- Kalender bulanan untuk melihat catatan per hari.
- Editor dengan format teks, perataan, gambar, dan drawing pad.
- Pilihan mood dan jenis kertas (polos atau bergaris).
- Mark untuk menandai hari, misalnya "Gym", dengan ikon dan warna sendiri.
- Download catatan sebagai PDF. PDF dibuat langsung di browser.
- **Catatan terkunci:** catatan di-encrypt di browser dengan AES-256-GCM,
  dengan key yang diturunkan dari passphrase memakai PBKDF2-SHA256. Server
  hanya menyimpan ciphertext, sehingga isi catatan tidak bisa dibaca tanpa key.

### Berbagi

- Kontak dan catatan bisa dibagikan ke akun lain berdasarkan username.
- Pemilik menentukan apakah penerima hanya bisa melihat atau juga bisa edit.
- Hanya pemilik yang bisa delete atau membagikannya lagi.

## Tech Stack

- **Backend:** [Node.js](https://nodejs.org/) dan
  [Express 5](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) dengan
  [Mongoose](https://mongoosejs.com/)
- **View:** [EJS](https://ejs.co/) dengan `express-ejs-layouts`
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Penyimpanan foto:** disk lokal, atau [MinIO](https://min.io/) /
  layanan yang kompatibel dengan S3
- **Package lain:** `express-session`, `express-validator`, `multer`,
  `sanitize-html`, `method-override`, `connect-flash`, `cookie-parser`

## Prasyarat

1. [Node.js](https://nodejs.org/) versi 20.6 atau lebih baru (untuk opsi `--env-file`).
2. MongoDB yang sedang berjalan. Secara default aplikasi terhubung ke
   `mongodb://127.0.0.1:27017/nook`.

## Menjalankan di Lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Pastikan MongoDB sudah berjalan. Database `nook` dibuat otomatis saat
   pertama kali dipakai.

3. Jalankan aplikasi:

   ```bash
   node app.js
   ```

   Jika memakai file `.env`:

   ```bash
   node --env-file=.env app.js
   ```

4. Buka [http://localhost:3000](http://localhost:3000), lalu buat akun di
   halaman sign up.

Untuk mengubah styling, jalankan Tailwind dalam mode watch agar
`public/css/output.css` dibuat ulang setiap ada perubahan:

```bash
npm run tw
```

## Environment Variable

Semua variabel bersifat opsional. Tanpa konfigurasi apa pun, aplikasi bisa
langsung dijalankan di lokal.

| Variabel                | Keterangan                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MONGODB_URI`           | Alamat MongoDB. Default: `mongodb://127.0.0.1:27017/nook`.                                                                                             |
| `SESSION_SECRET`        | Secret untuk menandatangani cookie session. Jika kosong, secret dibuat otomatis dan disimpan di `.session-secret`.                                     |
| `SESSION_COOKIE_SECURE` | Isi `1` jika aplikasi diakses lewat https, agar cookie tidak terkirim lewat http.                                                                      |
| `TRUST_PROXY`           | Proxy yang dipercaya saat aplikasi berjalan di belakang reverse proxy, misalnya `1` atau `loopback`.                                                   |
| `APP_ORIGIN`            | Origin aplikasi, misalnya `https://nook.example.com`. Dipakai untuk mengecek bahwa form dikirim dari halaman aplikasi ini.                             |
| `HOST`                  | Alamat server untuk listen. Default `127.0.0.1` (hanya komputer ini). Isi `0.0.0.0` untuk membukanya ke jaringan.                                      |
| `MINIO_ENDPOINT`        | URL lengkap MinIO / S3, misalnya `http://127.0.0.1:9000`. Jika diisi, foto kontak disimpan di bucket. Jika kosong, foto disimpan di `public/uploads/`. |
| `MINIO_ACCESS_KEY`      | Access key MinIO.                                                                                                                                      |
| `MINIO_SECRET_KEY`      | Secret key MinIO.                                                                                                                                      |
| `MINIO_BUCKET`          | Nama bucket. Default: `nook-uploads`. Bucket dibuat otomatis jika belum ada.                                                                           |
| `MINIO_REGION`          | Region bucket. Default: `us-east-1`.                                                                                                                   |

## Deploy ke Vercel

`app.js` meng-export aplikasi Express, sehingga Vercel bisa menjalankannya
langsung. Server hanya listen sendiri jika dijalankan dengan `node app.js`.

Karena Vercel tidak bisa menulis ke disk, isi variabel berikut:

- `MONGODB_URI` ke database MongoDB yang bisa diakses dari internet
- `SESSION_SECRET`
- `SESSION_COOKIE_SECURE=1`
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, dan `MINIO_SECRET_KEY` untuk foto
  kontak

## Struktur Folder

```
app.js            Aplikasi Express: middleware, route, dan start server
model/            Schema Mongoose (User, Contact, Writing, DayMark, Marker, Share)
utils/            Koneksi database, session store, hash password, encrypt
                  catatan lama, sanitize HTML catatan, dan penyimpanan foto
views/            Halaman EJS
views/layouts/    Layout utama
views/partials/   Komponen yang dipakai ulang (editor, modal, style, ikon)
public/css/       Source Tailwind (tailwind.css) dan hasil build (output.css)
public/js/        Script browser: encrypt catatan dan download PDF
public/fonts/     Font Comic Neue untuk PDF
public/uploads/   Foto kontak saat MinIO tidak dipakai (tidak di-commit)
```
