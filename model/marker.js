const mongoose = require("mongoose");

// Jenis tanda untuk hari di kalender. Semua tanda dibuat sendiri oleh user
// ("Fasting", "Gym", "Sick", ...)
const Marker = mongoose.model(
  "Marker",
  new mongoose.Schema(
    {
      // akun pemilik
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 24,
      },
      icon: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = Marker;
