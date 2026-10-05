const crypto = require("crypto");

// Notes are locked in the browser now (public/js/note-crypto.js): the server
// never sees their key or words, it only checks and stores what comes back.
// What's left here is for notes locked before that, on the server, with
// scrypt and AES-256-GCM: each is opened one last time and locked again in
// the browser
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

const deriveKey = (key, salt) => crypto.scryptSync(key, salt, KEY_LENGTH);

// a note locked on the server: it has an authTag and no encVersion
const isLegacyLock = (writing) => Boolean(writing?.isEncrypted && !writing.encVersion);

// Throws when the key is wrong: GCM fails the auth tag check
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

// A note locked in the browser, as sent with a form: the ciphertext (the
// auth tag on its end) with a 16-byte salt and a 12-byte iv, all base64.
// Returns the fields to store, or null when they don't look like that
const readCipher = (fields, maxLength) => {
  const { content, salt, iv } = fields || {};
  if (![content, salt, iv].every((v) => typeof v === "string" && BASE64.test(v))) {
    return null;
  }
  if (byteLength(salt) !== 16 || byteLength(iv) !== 12) return null;
  // at least the 16-byte auth tag, and no bigger than an open note may be
  // once encrypted
  if (byteLength(content) <= 16 || content.length > maxLength) return null;

  return { content, salt, iv, encVersion: 2, isEncrypted: true };
};

module.exports = { decryptText, isLegacyLock, readCipher };
