const mongoose = require("mongoose");

// One mark on one day, the day kept as a Jakarta calendar day ("2026-09-22")
// so it never drifts across a day boundary
const schema = new mongoose.Schema(
  {
    // the account it belongs to (the same as its marker's)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    day: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    marker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marker",
      required: true,
    },
  },
  { timestamps: true }
);

schema.index({ day: 1, marker: 1 }, { unique: true });
schema.index({ owner: 1, day: 1 });

module.exports = mongoose.model("DayMark", schema);
