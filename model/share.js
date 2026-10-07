const mongoose = require("mongoose");

// Someone a contact or note is shared with, and whether they may edit it
// (only its owner may delete or share it further)
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
