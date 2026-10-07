const mongoose = require("mongoose");

// User yang diberi akses ke kontak atau catatan, beserta izin edit-nya.
// Hanya pemilik yang boleh menghapus atau membagikannya lagi
module.exports = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);
