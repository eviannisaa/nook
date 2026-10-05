/* Satu-satunya bagian di halaman about yang datanya belum ada di repo: tidak
   ada berkas desain apa pun di public/. Isi `img` dengan path ke gambar yang
   ditaruh di public/assets/designs/ (mis. "/assets/designs/nama.png"); selama
   masih kosong, kartunya menggambar bingkai sketsa berisi judulnya, jadi
   tata letaknya tetap benar dan tidak ada gambar rusak.

   `MORE` adalah tujuan tautan "see more". Behance sudah disebut di baris
   social home, tapi handle-nya belum ada di repo — ganti "#" dengan URL
   profilnya. */
export const DESIGN_MORE = "#";

export type Design = {
  title: string;
  note: string;
  img?: string;
  href?: string;
};

export const designs: Design[] = [
  {
    title: "Dashboard study",
    note: "layout · spacing · type scale",
  },
  {
    title: "Mobile flow",
    note: "onboarding · empty states",
  },
];
