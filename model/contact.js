const mongoose = require("mongoose");

const Contact = mongoose.model("Contact", {
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
});

module.exports = Contact;
