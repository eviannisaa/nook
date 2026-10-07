const mongoose = require("mongoose");
const shareSchema = require("./share");

const Writing = mongoose.model(
  "Writing",
  new mongoose.Schema(
    {
      // the account it belongs to
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      // other accounts it is shared with
      shares: {
        type: [shareSchema],
        default: [],
      },
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      // Words of the note without markup or images, for previews and
      // search; empty while the note is encrypted
      text: {
        type: String,
      },
      // the paper the note was written on
      paper: {
        type: String,
        enum: ["plain", "lined"],
        default: "plain",
      },
      mood: {
        type: String,
      },
      date: {
        type: Date,
        required: true,
      },
      // when the note was last saved from the edit page (not when it was
      // locked or unlocked, which updatedAt also counts)
      editedAt: {
        type: Date,
      },
      isEncrypted: {
        type: Boolean,
        default: false,
      },
      // Only set while the note is encrypted
      salt: {
        type: String,
      },
      iv: {
        type: String,
      },
      // 2: locked in the browser (PBKDF2-SHA256 + AES-256-GCM, base64, the
      // auth tag on the ciphertext's end). Unset on a note locked on the
      // server before that (scrypt, hex, with its own authTag)
      encVersion: {
        type: Number,
      },
      authTag: {
        type: String,
      },
    },
    { timestamps: true }
  ),
  // the collection from when notes were called diaries, so they stay put
  "diaries"
);

module.exports = Writing;
