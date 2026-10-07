const mongoose = require("mongoose");

// Satu akun untuk satu orang. Semua yang dibuat akun ini cuma bisa dibuka
// pemiliknya, kecuali dibagikan (lihat shares di Contact dan Writing)
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      // disimpan dalam huruf kecil, jadi "Ani" dan "ani" itu akun yang sama
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9_.]{3,24}$/,
      },
      // password yang sudah diacak, bukan password aslinya. Caranya ada di
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
