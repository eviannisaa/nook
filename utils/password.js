const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Setelan untuk mengacak password (scrypt), sesuai saran keamanan OWASP.
// Setelan ini butuh memori 128MB, padahal batas bawaan Node cuma 32MB.
// Jadi batasnya dinaikkan
const N = 2 ** 17;
const R = 8;
const P = 1;
const MAX_N = 2 ** 20;
const maxmem = (n, r) => 256 * n * r;

// Mengacak password jadi teks "scrypt$N$r$p$salt$hash". Tiap password
// dapat salt (nilai acak) baru. Setelannya ikut disimpan, jadi nanti bisa
// diganti tanpa merusak password lama
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

// Memecah password tersimpan jadi bagian-bagiannya. Password dari versi
// lama formatnya "salt:hash", dengan setelan bawaan Node
const readHash = (stored) => {
  const text = String(stored || "");
  if (!text.startsWith("scrypt$")) {
    const [salt, hash] = text.split(":");
    return { n: 2 ** 14, r: 8, p: 1, salt, hash };
  }
  const [, n, r, p, salt, hash] = text.split("$");
  return { n: Number(n), r: Number(r), p: Number(p), salt, hash };
};

// Mengecek password. Lama pengecekannya selalu sama, jadi orang tidak bisa
// menebak password dari waktu yang dibutuhkan
const verifyPassword = async (password, stored) => {
  const { n, r, p, salt, hash } = readHash(stored);
  // setelan yang aneh atau terlalu besar ditolak, supaya memori tidak habis
  if (!salt || !hash || !Number.isInteger(n) || n < 2 || n > MAX_N || (n & (n - 1)) !== 0 || r !== 8 || p !== 1) {
    return false;
  }
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), expected.length, {
    N: n,
    r,
    p,
    maxmem: maxmem(n, r),
  });
  return crypto.timingSafeEqual(actual, expected);
};

// true kalau password ini masih pakai setelan lama. Diacak ulang saat login
const needsRehash = (stored) => !String(stored || "").startsWith(`scrypt$${N}$${R}$${P}$`);

// password palsu, dicek kalau username-nya tidak ada. Jadi login yang gagal
// selalu sama lamanya, dan orang tidak bisa menebak username mana yang ada
const DUMMY_HASH = `scrypt$${N}$${R}$${P}$${"0".repeat(32)}$${"0".repeat(KEY_LENGTH * 2)}`;

module.exports = { hashPassword, verifyPassword, needsRehash, DUMMY_HASH };
