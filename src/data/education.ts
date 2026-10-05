/* ISI DULU SEBELUM DIPAKAI.

   Tidak ada data pendidikan di repo ini, jadi nilai di bawah sengaja ditulis
   sebagai penampung yang kelihatan jelas ("20XX", "Nama kampus") — bukan
   tebakan yang bisa disangka data sebenarnya. Ganti isinya di sini; komponen
   EducationTimeline membacanya langsung.

   `note` opsional; kalau kosong, barisnya tidak dirender. */
export type Education = {
  period: string;
  degree: string;
  school: string;
  note?: string;
};

export const education: Education[] = [
  {
    period: "20XX - 20XX",
    degree: "Program studi",
    school: "Nama kampus",
    note: "Coursework and an internship program",
  },
];
