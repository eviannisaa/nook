const mongoose = require("mongoose");
const shareSchema = require("./share");

const Writing = mongoose.model(
  "Writing",
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
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      // Teks catatan tanpa HTML dan gambar, untuk preview dan pencarian.
      // Dihapus selama catatan terkunci, supaya isinya tidak bisa dibaca
      text: {
        type: String,
      },
      // jenis kertas tempat catatan ditulis
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
      // waktu terakhir catatan diedit dari halaman edit. Beda dengan
      // updatedAt, yang ikut berubah saat catatan dikunci atau dibuka
      editedAt: {
        type: Date,
      },
      isEncrypted: {
        type: Boolean,
        default: false,
      },
      // salt dan iv cuma ada selama catatan terkunci
      salt: {
        type: String,
      },
      iv: {
        type: String,
      },
      // cara catatan dikunci. 2 = dikunci di browser (cara sekarang).
      // Kosong = catatan lama yang dikunci di server, yang punya authTag
      // sendiri
      encVersion: {
        type: Number,
      },
      authTag: {
        type: String,
      },
    },
    { timestamps: true }
  )
);

module.exports = Writing;
