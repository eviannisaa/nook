/* Nama stack -> slug berkas di public/assets/icons.

   Sengaja TIDAK memuat semua nama yang dipakai proyek: banyak entri (GeoJSON,
   Places API, Playwright, Katalon Studio, Google OAuth 2.0) memang belum punya
   berkas ikon. Yang tidak terdaftar bukan kesalahan - itu jalur normal, dan
   pemakainya wajib menyiapkan tampilan tanpa ikon.

   `stackIcon()` dipakai sebagai gerbang tunggal supaya tidak ada pemakai yang
   merangkai `url(/assets/icons/${name}.svg)` langsung dari nama stack; nama
   yang belum dipetakan akan menghasilkan URL 404 yang gagal diam-diam (mask
   kosong = kotak transparan, bukan error yang terlihat).

   Catatan: src/components/SkillList.tsx masih menyimpan salinan peta ini,
   tapi salinan itu mati - hanya dirujuk dari blok JSX yang dikomentari. Kalau
   ikon di sana dihidupkan lagi, hapus salinannya dan pakai berkas ini. */
const STACK_ICON: Record<string, string> = {
  "Next.js": "nextdotjs",
  "Vue.js": "vuedotjs",
  "Astro.js": "astro",
  React: "react",
  TypeScript: "typescript",
  JavaScript: "javascript",
  Python: "python",
  "TanStack Query": "reactquery",
  "Tailwind CSS": "tailwindcss",
  Tailwind: "tailwindcss",
  "Google Maps JS API": "googlemaps",
  "MapLibre GL JS": "maplibre",
  Jest: "jest",
  Golang: "go",
  "Express.js": "express",
  JWT: "jsonwebtokens",
  "Auth & Authorization": "auth0",
  Swagger: "swagger",
  Postman: "postman",
  PostgreSQL: "postgresql",
  MongoDB: "mongodb",
  "Prisma ORM": "prisma",
  Drizzle: "drizzle",
  Docker: "docker",
  MinIO: "minio",
  Resend: "resend",
  "Resend API": "resend",
  Nginx: "nginx",
  Jenkins: "jenkins",
  Git: "git",
  GitHub: "github",
  GitLab: "gitlab",
};

/* Koreksi optis, dipisah dari ukuran yang diminta pemakai.

   `mask-size: contain` di `.stack-logo` memasang seluruh `viewBox` 24x24 ke
   dalam kotaknya, BUKAN tintanya - jadi dua ikon berukuran kotak sama bisa
   terbaca sangat berbeda besarnya, tergantung seberapa penuh tintanya mengisi
   kanvas itu. Diukur dari berkasnya sendiri (persen piksel bertinta, median
   seluruh folder ~32%):

     go       18% tinta, tingginya cuma 37% kanvas - lambangnya lebar dan
              pendek, jadi lima per delapan kotaknya kosong di atas-bawah dan
              ia terlihat kecil di antara yang lain
     resend   41% tinta, mengisi 99% x 100% kanvas - tidak ada ruang kosong
              sama sekali, jadi ia terbaca paling besar dan paling berat

   Faktornya mengejar median itu, bukan angka bulat asal: 18% x 1.25^2 ~= 28%,
   41% x 0.85^2 ~= 30%. Yang tidak terdaftar tetap 1 - mayoritas ikon Simple
   Icons sudah seimbang satu sama lain.

   Mengubah `--size`, bukan `mask-size`: memperbesar mask melewati `contain`
   membuat lambangnya melewati kotak elemennya, dan bagian yang keluar itu
   terpotong - pada `go` yang tintanya sudah selebar penuh kanvas, sisi kiri
   dan kanannya yang hilang. Kotaknya yang harus tumbuh. */
const ICON_SCALE: Record<string, number> = {
  go: 1.25,
  resend: 0.85,
};

export function stackIconScale(name: string): number {
  const slug = STACK_ICON[name];
  return (slug && ICON_SCALE[slug]) || 1;
}

export function stackIcon(name: string): string | undefined {
  const slug = STACK_ICON[name];
  return slug ? `url(/assets/icons/${slug}.svg)` : undefined;
}
