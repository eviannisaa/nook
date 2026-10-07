const crypto = require("crypto");

// Sekarang catatan dikunci di browser (lihat public/js/note-crypto.js).
// Server tidak pernah tahu key catatan atau isinya. Server cuma menyimpan
// hasilnya. Kode di file ini cuma untuk catatan lama yang dulu dikunci di
// server. Catatan lama itu dibuka sekali, lalu dikunci lagi di browser
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

const deriveKey = (key, salt) => crypto.scryptSync(key, salt, KEY_LENGTH);

// cek apakah ini catatan lama yang dikunci di server (tanpa encVersion)
const isLegacyLock = (writing) => Boolean(writing?.isEncrypted && !writing.encVersion);

// Membuka catatan lama. Error kalau key-nya salah
const decryptText = (writing, key) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(key, Buffer.from(writing.salt, "hex")),
    Buffer.from(writing.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(writing.authTag, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(writing.content, "hex")),
    decipher.final(),
  ]).toString("utf8");
};

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const byteLength = (text) => Buffer.from(text, "base64").length;

// Mengecek data catatan terkunci yang dikirim dari form: isi yang sudah
// dikunci, salt dan iv (nilai acak untuk mengunci). Hasilnya data yang
// siap disimpan, atau null kalau datanya tidak sesuai
const readCipher = (fields, maxLength) => {
  const { content, salt, iv } = fields || {};
  if (![content, salt, iv].every((v) => typeof v === "string" && BASE64.test(v))) {
    return null;
  }
  if (byteLength(salt) !== 16 || byteLength(iv) !== 12) return null;
  // isinya tidak boleh terlalu pendek, dan tidak boleh lebih besar dari
  // catatan terbesar yang diizinkan
  if (byteLength(content) <= 16 || content.length > maxLength) return null;

  return { content, salt, iv, encVersion: 2, isEncrypted: true };
};

module.exports = { decryptText, isLegacyLock, readCipher };
