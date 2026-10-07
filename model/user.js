const mongoose = require("mongoose");

// One account per person; everything they make is theirs alone unless they
// share it (see the shares on Contact and Writing)
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      // kept lowercase, so "Ani" and "ani" are the same account
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9_.]{3,24}$/,
      },
      // scrypt: "scrypt$N$r$p$salt$hash", or "salt:hash" from before
      // (utils/password.js)
      passwordHash: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = User;
