const mongoose = require("mongoose");

// A kind of mark that can be put on calendar days, all made by hand
// ("Fasting", "Gym", "Sick", ...)
const Marker = mongoose.model(
  "Marker",
  new mongoose.Schema(
    {
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
