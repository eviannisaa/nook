const mongoose = require("mongoose");

// Satu tanda pada satu tanggal, misalnya tanda "Gym" pada 22 September.
// Tanggal disimpan sebagai teks ("2026-09-22"), bukan Date yang memiliki
// jam, sehingga tidak bergeser sehari karena perbedaan zona waktu.
// Tanggal yang dipakai mengikuti zona waktu Jakarta.
const schema = new mongoose.Schema(
  {
    // akun pemilik (sama dengan pemilik marker)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    day: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    marker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marker",
      required: true,
    },
  },
  { timestamps: true }
);

schema.index({ day: 1, marker: 1 }, { unique: true });
schema.index({ owner: 1, day: 1 });

module.exports = mongoose.model("DayMark", schema);
