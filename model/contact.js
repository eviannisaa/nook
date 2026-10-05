const mongoose = require("mongoose");

const Contact = mongoose.model(
  "Contact",
  new mongoose.Schema(
    {
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
