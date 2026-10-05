/* Aturan berapa entri stack yang tampil per lebar layar, dipakai bersama oleh
   WorkHighlight dan ProjectsHighlight: 2 di bawah sm, 3 di sm, 5 dari md.

   Riwayatnya: 1/2/5 -> 2/2/5 (tingkat sm sempat dihapus karena tidak lagi
   membedakan apa pun) -> 2/3/5 sekarang, jadi tingkat sm dipakai lagi.

   Ditaruh di satu tempat karena kebijakannya sama di kedua daftar; kalau
   disalin, mengubah angkanya nanti berarti mengubahnya di dua berkas dan salah
   satu pasti terlewat.

   Dikerjakan lewat kelas responsif, bukan memotong array dengan JS: jumlah yang
   dirender di server harus sama dengan di klien, sedangkan lebar jendela baru
   diketahui SETELAH hidrasi. Semua entri tetap ada di DOM, yang berubah hanya
   `display`-nya.

   Nama kelasnya ditulis UTUH sebagai literal, bukan dirakit seperti
   `hidden md:${display}`. Tailwind memindai berkas sumber mencari nama kelas
   apa adanya; potongan yang dirangkai saat runtime tidak terlihat olehnya, jadi
   aturannya tidak ikut dihasilkan dan kelasnya diam-diam tidak berefek. Versi
   pertama helper ini memakai template string, dan `md:flex` memang hilang dari
   CSS keluaran.

   Urutan indeksnya: [selalu, dari sm, dari md]. */
const SLOT = {
  flex: ["flex", "hidden sm:flex", "hidden md:flex"],
  "inline-flex": ["inline-flex", "hidden sm:inline-flex", "hidden md:inline-flex"],
} as const;

/* Batas 5 ditulis eksplisit meski kedua daftar sekarang pas 5 entri: tanpa itu,
   entri ke-6 yang ditambahkan nanti akan diam-diam ikut tampil di md. */
export function stackSlot(i: number, display: keyof typeof SLOT = "flex") {
  if (i >= 5) return "hidden";
  const s = SLOT[display];
  if (i >= 4) return s[2]; // entri ke-4 dan ke-5: hanya md ke atas
  if (i >= 2) return s[1]; // entri ke-3: mulai tampil di sm
  return s[0]; // dua entri pertama: selalu
}
