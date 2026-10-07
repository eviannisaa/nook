const mongoose = require("mongoose");

// Satu tanda di satu tanggal, misalnya tanda "Gym" di 22 September.
// Tanggalnya disimpan sebagai teks biasa ("2026-09-22"), bukan sebagai
// tanggal plus jam. Jadi tanggalnya tidak bisa maju atau mundur sehari
// karena beda zona waktu. Tanggal yang dipakai adalah tanggal di Jakarta.
const schema = new mongoose.Schema(
  {
    // akun pemiliknya (sama dengan pemilik marker-nya)
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
