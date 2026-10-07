const mongoose = require("mongoose");
const shareSchema = require("./share");

const Contact = mongoose.model(
  "Contact",
  new mongoose.Schema(
    {
      // akun pemiliknya
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      // akun lain yang diberi akses
      shares: {
        type: [shareSchema],
        default: [],
      },
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      company: {
        type: String,
      },
      notes: {
        type: String,
      },
      image: {
        type: String,
      },
    },
    { timestamps: true }
  )
);

module.exports = Contact;
