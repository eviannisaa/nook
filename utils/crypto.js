const crypto = require("crypto");

// Catatan sekarang di-encrypt di browser (lihat public/js/note-crypto.js),
// sehingga server tidak mengetahui key maupun isi catatan dan hanya menyimpan
// hasilnya. Kode di file ini hanya untuk catatan lama yang dulu di-encrypt di
// server. Catatan lama di-decrypt sekali di sini, lalu di-encrypt ulang di browser
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

const deriveKey = (key, salt) => crypto.scryptSync(key, salt, KEY_LENGTH);

// mengecek apakah catatan di-encrypt dengan cara lama di server (tanpa encVersion)
const isLegacyLock = (writing) => Boolean(writing?.isEncrypted && !writing.encVersion);

// Decrypt catatan lama. Melempar error jika key salah
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

// Mengecek data catatan terkunci yang dikirim dari form, yaitu isi yang
// sudah di-encrypt, salt, dan iv. Mengembalikan data yang siap disimpan,
// atau null jika formatnya tidak valid
const readCipher = (fields, maxLength) => {
  const { content, salt, iv } = fields || {};
  if (![content, salt, iv].every((v) => typeof v === "string" && BASE64.test(v))) {
    return null;
  }
  if (byteLength(salt) !== 16 || byteLength(iv) !== 12) return null;
  // isi tidak boleh terlalu pendek dan tidak boleh melebihi ukuran
  // maksimum catatan
  if (byteLength(content) <= 16 || content.length > maxLength) return null;

  return { content, salt, iv, encVersion: 2, isEncrypted: true };
};

module.exports = { decryptText, isLegacyLock, readCipher };
