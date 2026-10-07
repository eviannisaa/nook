const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// OWASP's minimum for scrypt. N=2^17 takes 128MB while hashing, more than
// Node's 32MB default, so the limit is raised for it
const N = 2 ** 17;
const R = 8;
const P = 1;
const MAX_N = 2 ** 20;
const maxmem = (n, r) => 256 * n * r;

// "scrypt$N$r$p$salt$hash", salt and hash in hex; a fresh salt for every
// password, and the settings kept with it so they can be raised later
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: maxmem(N, R) });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
};

// The settings and parts of a stored hash. Older ones are "salt:hash", made
// with Node's defaults (N=2^14, r=8, p=1)
const readHash = (stored) => {
  const text = String(stored || "");
  if (!text.startsWith("scrypt$")) {
    const [salt, hash] = text.split(":");
    return { n: 2 ** 14, r: 8, p: 1, salt, hash };
  }
  const [, n, r, p, salt, hash] = text.split("$");
  return { n: Number(n), r: Number(r), p: Number(p), salt, hash };
};

// compared in constant time, so the answer's timing gives nothing away
const verifyPassword = async (password, stored) => {
  const { n, r, p, salt, hash } = readHash(stored);
  // settings out of reach would only burn memory: refused
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

// a hash made with cheaper settings than today's, to make again at sign-in
const needsRehash = (stored) => !String(stored || "").startsWith(`scrypt$${N}$${R}$${P}$`);

// a hash to check against when the username doesn't exist, so a missing
// account takes as long to refuse as a wrong password
const DUMMY_HASH = `scrypt$${N}$${R}$${P}$${"0".repeat(32)}$${"0".repeat(KEY_LENGTH * 2)}`;

module.exports = { hashPassword, verifyPassword, needsRehash, DUMMY_HASH };
