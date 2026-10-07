const mongoose = require("mongoose");

// Satu akun untuk satu orang. Semua data milik akun ini hanya bisa dibuka
// pemiliknya, kecuali dibagikan (lihat shares di Contact dan Writing)
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      // disimpan dalam huruf kecil, sehingga "Ani" dan "ani" dianggap akun yang sama
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9_.]{3,24}$/,
      },
      // hash password, bukan password aslinya. Cara pembuatannya ada di
      // utils/password.js
      passwordHash: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = User;
