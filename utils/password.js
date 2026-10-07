const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Parameter scrypt untuk hash password, sesuai rekomendasi OWASP.
// Parameter ini butuh memori 128MB, sedangkan batas default Node hanya
// 32MB, sehingga batasnya dinaikkan
const N = 2 ** 17;
const R = 8;
const P = 1;
const MAX_N = 2 ** 20;
const maxmem = (n, r) => 256 * n * r;

// Hash password menjadi teks "scrypt$N$r$p$salt$hash". Setiap password
// mendapat salt baru. Parameter ikut disimpan, sehingga nanti bisa diubah
// tanpa membuat password lama tidak valid
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

// Memecah hash yang tersimpan menjadi bagian-bagiannya. Hash dari versi
// lama berformat "salt:hash" dan memakai parameter default Node
const readHash = (stored) => {
  const text = String(stored || "");
  if (!text.startsWith("scrypt$")) {
    const [salt, hash] = text.split(":");
    return { n: 2 ** 14, r: 8, p: 1, salt, hash };
  }
  const [, n, r, p, salt, hash] = text.split("$");
  return { n: Number(n), r: Number(r), p: Number(p), salt, hash };
};

// Mengecek password. Hash dibandingkan dalam waktu yang konstan, sehingga
// password tidak bisa ditebak dari lama prosesnya
const verifyPassword = async (password, stored) => {
  const { n, r, p, salt, hash } = readHash(stored);
  // parameter yang tidak wajar atau terlalu besar ditolak agar memori tidak habis
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

// true jika hash masih memakai parameter lama. Hash dibuat ulang saat login
const needsRehash = (stored) => !String(stored || "").startsWith(`scrypt$${N}$${R}$${P}$`);

// hash palsu yang dicek jika username tidak ditemukan, sehingga login yang
// gagal selalu sama lamanya dan username yang terdaftar tidak bisa ditebak
const DUMMY_HASH = `scrypt$${N}$${R}$${P}$${"0".repeat(32)}$${"0".repeat(KEY_LENGTH * 2)}`;

module.exports = { hashPassword, verifyPassword, needsRehash, DUMMY_HASH };
