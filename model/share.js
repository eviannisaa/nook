const mongoose = require("mongoose");

// Orang yang diberi akses ke kontak atau catatan, dan boleh mengedit atau
// tidak. Cuma pemiliknya yang boleh menghapus atau membagikan lagi
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
