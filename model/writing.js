const mongoose = require("mongoose");
const shareSchema = require("./share");

const Writing = mongoose.model(
  "Writing",
  new mongoose.Schema(
    {
      // akun pemilik
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
      // Dihapus selama catatan terkunci agar isinya tidak bisa dibaca
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
      // waktu terakhir catatan diubah dari halaman edit. Berbeda dengan
      // updatedAt, yang juga berubah saat catatan dikunci atau dibuka
      editedAt: {
        type: Date,
      },
      isEncrypted: {
        type: Boolean,
        default: false,
      },
      // salt dan iv hanya ada selama catatan terkunci
      salt: {
        type: String,
      },
      iv: {
        type: String,
      },
      // cara catatan di-encrypt. 2 = di-encrypt di browser (cara sekarang).
      // Kosong = catatan lama yang di-encrypt di server dan memiliki authTag
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
