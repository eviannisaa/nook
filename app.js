const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const Contact = require("./model/contact");
const Writing = require("./model/writing");
const Marker = require("./model/marker");
const DayMark = require("./model/day-mark");
const User = require("./model/user");
const MongoStore = require("./utils/session-store");
const { hashPassword, verifyPassword, needsRehash, DUMMY_HASH } = require("./utils/password");
const { decryptText, isLegacyLock, readCipher } = require("./utils/crypto");
const { noteHtml, noteText, hasNoteContent } = require("./utils/note-html");

// Catatan yang dibuat sebelum ada editor belum punya field text, jadi field
// itu diisi saat aplikasi dijalankan
Writing.find({ isEncrypted: { $ne: true }, text: { $exists: false } })
  .then((writings) =>
    Promise.all(
      writings.map((writing) =>
        Writing.updateOne(
          { _id: writing._id },
          { $set: { text: noteText(writing.content) } }
        )
      )
    )
  )
  .catch((err) => console.log(err));

// Pilihan ikon untuk tanda hari. Warnanya ada di MARK_COLORS
const MARK_ICONS = ["drop", "moon", "star", "heart", "pill", "dot"];
// Shade 600 dari Tailwind: cukup cerah, tapi tetap terbaca di latar kertas
const MARK_COLORS = {
  red: "#dc2626",
  orange: "#ea580c",
  amber: "#d97706",
  green: "#16a34a",
  teal: "#0d9488",
  blue: "#2563eb",
  violet: "#7c3aed",
  pink: "#db2777",
};
// jumlah tanda maksimal dalam satu hari
const MAX_MARKS_PER_DAY = 20;
const dayIsFull = async (owner, day) =>
  (await DayMark.countDocuments({ owner, day })) >= MAX_MARKS_PER_DAY;

// Tanda dengan nama (tanpa membedakan huruf besar/kecil), ikon, dan warna
// yang sama dianggap kembar, jadi diperlakukan sebagai satu tanda
const markerLook = (marker) => [marker.name.trim().toLowerCase(), marker.icon, marker.color].join("|");
// id sebuah tanda beserta semua kembarannya
const twinIds = async (marker) =>
  (
    await Marker.find(
      {
        owner: marker.owner,
        name: { $regex: `^\\s*${escapeRegex(marker.name.trim())}\\s*$`, $options: "i" },
        icon: marker.icon,
        color: marker.color,
      },
      { _id: 1 }
    ).lean()
  ).map((m) => m._id);

const app = express();
const port = 3000;

// Di belakang reverse proxy, TRUST_PROXY menentukan proxy yang dipercaya
// untuk alamat pengunjung dan https (jumlah hop seperti "1", atau
// "loopback"). Jika kosong, semua header forwarded diabaikan
if (process.env.TRUST_PROXY) {
  const trust = process.env.TRUST_PROXY;
  app.set("trust proxy", /^\d+$/.test(trust) ? Number(trust) : trust);
}

// Halaman aplikasi ini tidak boleh dimuat dalam frame situs lain
// (clickjacking), ditebak tipenya oleh browser, atau membocorkan alamatnya
// ke situs lain
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
  next();
});

// Request yang mengubah data hanya diterima dari halaman aplikasi ini.
// SameSite=Lax menahan cookie pada POST dari situs lain, tapi tidak
// melindungi form login: situs lain tetap bisa membuat seseorang login ke
// akun milik penyerang. Asal request dibaca dari Sec-Fetch-Site, atau dari
// Origin/Referer di browser lama. Jika semuanya kosong, request ditolak
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const ownOrigin = (req) => process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
const originOf = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
app.use((req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();
  const site = req.get("Sec-Fetch-Site");
  const from = site ? null : originOf(req.get("Origin") || req.get("Referer"));
  if (site === "same-origin" || site === "none" || (from && from === ownOrigin(req))) {
    return next();
  }
  res.status(403).send("Forbidden");
});

// Form bisa mengirim PUT dan DELETE lewat field _method
app.use(methodOverride("_method"));

// Setup EJS. Folder dicari dari lokasi file ini, bukan dari tempat aplikasi
// dijalankan, jadi tetap ditemukan di host seperti Vercel
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
// Isi public/ disajikan apa adanya, kecuali foto upload. Foto hanya dikirim
// ke akun yang boleh melihat kontaknya (GET /uploads/:file, di bawah)
const servePublic = express.static(path.join(__dirname, "public"));
app.use((req, res, next) =>
  req.path.startsWith("/uploads/") ? next() : servePublic(req, res, next)
);
// Gambar disimpan langsung di isi catatan, jadi body form bisa beberapa MB
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
// catatan lama yang dikunci ulang di browser dikirim kembali sebagai JSON
app.use(express.json({ limit: "15mb" }));

// Konfigurasi session. Secret untuk sign cookie session diambil dari
// SESSION_SECRET (misalnya `node --env-file=.env app.js`). Jika kosong,
// secret dibuat saat start pertama dan disimpan di .session-secret (tidak
// di-commit), jadi restart tidak membuat semua user logout
const SECRET_FILE = ".session-secret";
const sessionSecret = () => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    return fs.readFileSync(SECRET_FILE, "utf8").trim();
  } catch {
    const secret = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
    return secret;
  }
};
const SESSION_SECRET = sessionSecret();
app.use(cookieParser(SESSION_SECRET));
// Login berlaku seminggu dan session disimpan di MongoDB, jadi restart tidak
// membuat user logout. SameSite=Lax menahan cookie pada form dari situs lain,
// sehingga halaman lain tidak bisa bertindak atas nama user
app.use(
  session({
    name: "sid",
    store: new MongoStore(),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // Isi SESSION_COOKIE_SECURE=1 untuk https agar cookie tidak terkirim
      // lewat http biasa (di belakang proxy, isi juga TRUST_PROXY)
      secure: process.env.SESSION_COOKIE_SECURE === "1",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
  })
);
app.use(flash());
app.use((req, res, next) => {
  // flash hanya dibaca jika memang ada. Memanggil req.flash() saja sudah
  // membuat session, sehingga setiap kunjungan sebelum login ikut tersimpan
  const waiting = Boolean(req.session.flash);
  const message = waiting ? req.flash("msg") : [];
  res.locals.msg = message.length > 0 ? message[0] : null;
  // Ditampilkan di toast merah yang sama dengan error validasi
  res.locals.errors = waiting ? req.flash("error").map((msg) => ({ msg })) : [];
  next();
});
// Redirect baru dikirim setelah session selesai disimpan. express-session
// mengirim header sebelum save selesai, sehingga halaman berikutnya bisa
// membaca session lama dan pesan seperti "… added successfully" baru muncul
// satu halaman kemudian. Hanya session yang berisi data yang disimpan, jadi
// kunjungan sebelum login tetap tidak membuat session
app.use((req, res, next) => {
  const redirect = res.redirect.bind(res);
  res.redirect = (...args) => {
    if (!req.session || !(req.session.userId || req.session.flash)) return redirect(...args);
    req.session.save(() => redirect(...args));
  };
  next();
});
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Path saat ini, untuk menandai menu aktif di navbar
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// ---- Akun ----

// halaman yang bisa dibuka tanpa login
const PUBLIC_PATHS = ["/login", "/signup"];

// Setiap kunjungan memperpanjang session seminggu lagi, tapi paling lama 30
// hari sejak login. Setelah itu user harus login ulang
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const sessionTooOld = (session) => {
  // session lama tanpa signedInAt mulai dihitung sekarang, tidak langsung logout
  if (!session.signedInAt) session.signedInAt = Date.now();
  return Date.now() - session.signedInAt > SESSION_MAX_AGE;
};

// Akun yang sedang login disimpan di req.user (dan user untuk view).
// Pengunjung yang belum login diarahkan ke halaman login, lalu dikembalikan
// ke halaman tujuannya
app.use(async (req, res, next) => {
  res.locals.user = null;
  if (req.session.userId && sessionTooOld(req.session)) {
    delete req.session.userId;
    delete req.session.signedInAt;
  }
  const userId = req.session.userId;
  if (userId) {
    const user = await User.findById(userId, { username: 1 }).lean();
    if (user) {
      req.user = user;
      res.locals.user = user;
      return next();
    }
    delete req.session.userId;
  }
  if (PUBLIC_PATHS.includes(req.path)) return next();
  if (req.method === "GET" && req.accepts("html")) {
    const target = req.originalUrl === "/" ? "" : "?next=" + encodeURIComponent(req.originalUrl);
    return res.redirect("/login" + target);
  }
  res.status(401).json({ error: "Sign in first." });
});

const TIME_ZONE = "Asia/Jakarta";

// Helper untuk view
app.locals.noteHtml = noteHtml;
app.locals.moods = ["Happy", "Grateful", "Excited", "Calm", "Tired", "Sad"];
// emoji untuk setiap mood (di pilihan mood dan detail catatan)
app.locals.moodFaces = { Happy: "😊", Grateful: "🥰", Excited: "🤩", Calm: "😌", Tired: "😴", Sad: "😢" };
app.locals.formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZone: TIME_ZONE,
        timeZoneName: "short",
      }).format(new Date(date))
    : "-";

// Jakarta tidak memakai daylight saving, jadi offset tetap sudah cukup untuk
// menentukan waktu mulai sebuah tanggal
const TZ_OFFSET = "+07:00";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Tanggal di Jakarta untuk waktu tersebut, dalam format "2026-09-22"
const dayKey = (date) => dayKeyFormat.format(new Date(date));

const isDayKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isMonthKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);

// Jam 12 siang dipakai agar tanggalnya tetap sama, baik dibaca dalam UTC
// maupun waktu Jakarta
const dayToDate = (key) => new Date(`${key}T12:00:00${TZ_OFFSET}`);

const shiftMonth = (monthKey, step) => {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + step, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Format tanggal kalender dalam bahasa Inggris: "Sep 28",
// "Monday, September 28, 2026"
app.locals.formatShortDay = (key) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(dayToDate(key));

app.locals.formatDay = (key) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(dayToDate(key));

// tanggal catatan di margin hasil search ("Sep 28"). Tahunnya terpisah dan
// hanya diisi jika bukan tahun ini (selain itu "")
app.locals.formatNoteDay = (date) => app.locals.formatShortDay(dayKey(date));
app.locals.formatNoteYear = (date) => {
  const year = dayKey(date).slice(0, 4);
  return year === dayKey(new Date()).slice(0, 4) ? "" : year;
};

app.locals.formatTime = (date) =>
  date
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: TIME_ZONE,
      }).format(new Date(date))
    : "-";

// Mencegah field "kembali ke halaman sebelumnya" menjadi open redirect: hanya
// path di aplikasi ini yang diikuti. Browser membaca "/\evil.com" sebagai
// "//evil.com", jadi backslash dan karakter kontrol ditolak sebelum path
// di-resolve, dan hasil yang mengarah ke host lain diganti fallback
const LOCAL_BASE = "http://app.invalid";
const safeRedirect = (target, fallback) => {
  // eslint-disable-next-line no-control-regex
  if (typeof target !== "string" || !target.startsWith("/") || /[\\\x00-\x1f\x7f]/.test(target)) {
    return fallback;
  }
  try {
    const url = new URL(target, LOCAL_BASE);
    return url.origin === LOCAL_BASE ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
};

// cek apakah nilai dari path atau form berupa ObjectId Mongo
const isId = (id) => /^[0-9a-f]{24}$/i.test(String(id || ""));

// kata search dicocokkan apa adanya, bukan sebagai regular expression
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchOf = (value) => (typeof value === "string" ? value.trim().slice(0, 100) : "");

// Yang boleh dilihat akun: miliknya sendiri dan yang dibagikan kepadanya
const visibleTo = (user) => ({ $or: [{ owner: user._id }, { "shares.user": user._id }] });

// "owner", "edit" (dibagikan, boleh edit), "view" (hanya baca), atau null
const accessOf = (doc, user) => {
  if (!doc || !user) return null;
  if (String(doc.owner?._id || doc.owner) === String(user._id)) return "owner";
  const share = (doc.shares || []).find((s) => String(s.user?._id || s.user) === String(user._id));
  if (!share) return null;
  return share.canEdit ? "edit" : "view";
};
const ACCESS_RANK = { view: 1, edit: 2, owner: 3 };

// Kontak atau catatan dengan id ini, jika akun punya akses minimal `need`.
// Hasilnya { doc, access }, atau null jika data tidak ada maupun tidak boleh
// diakses (keduanya sengaja dibuat sama)
const findFor = async (Model, id, user, need = "view") => {
  if (!isId(id)) return null;
  const doc = await Model.findById(id).populate("owner", "username");
  const access = accessOf(doc, user);
  if (!access || ACCESS_RANK[access] < ACCESS_RANK[need]) return null;
  return { doc, access };
};

// Setup Multer untuk upload foto: hanya gambar, maksimal 2MB, dengan nama
// acak (nama file asli tidak pernah dipakai). Multer menyimpan file di
// memory, lalu photo store (MinIO, atau public/uploads jika MinIO tidak
// dipakai) menyimpannya dengan nama tersebut
const multer = require("multer");
const photos = require("./utils/photo-store");
const PHOTO_TYPES = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(PHOTO_TYPES[file.mimetype])),
});

// jika upload gagal (misalnya foto lebih dari 2MB), user diarahkan kembali
// dengan pesan error, bukan crash
const uploadPhoto = (req, res, next) =>
  upload.single("image")(req, res, async (err) => {
    if (!err && req.file) {
      // req.file.filename diisi nama simpanan file, seperti pada disk storage
      req.file.filename = crypto.randomBytes(16).toString("hex") + PHOTO_TYPES[req.file.mimetype];
      try {
        await photos.save(req.file.filename, req.file.buffer);
      } catch (saveErr) {
        console.error(saveErr);
        err = saveErr;
      }
    }
    if (err) {
      req.flash("error", err.code === "LIMIT_FILE_SIZE" ? "The photo can be up to 2MB." : "That photo couldn't be uploaded.");
      return res.redirect(safeRedirect(req.get("Referer")?.replace(/^https?:\/\/[^/]+/, ""), "/contacts"));
    }
    next();
  });

// Path foto yang disimpan di kontak hanya boleh "/uploads/<name>", jadi path
// dari form tidak pernah bisa mengarah ke file lain
const PHOTO_PATH = /^\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/;
const removePhoto = (image) => {
  if (PHOTO_PATH.test(image || "")) photos.remove(image.slice("/uploads/".length)).catch(() => {});
};

// foto hanya dikirim ke akun yang boleh melihat kontak yang memakainya
app.get("/uploads/:file", async (req, res) => {
  const image = "/uploads/" + req.params.file;
  if (!PHOTO_PATH.test(image)) return res.sendStatus(404);
  const contact = await Contact.exists({ image, ...visibleTo(req.user) });
  if (!contact) return res.sendStatus(404);
  const stream = await photos.open(req.params.file);
  if (!stream) return res.sendStatus(404);
  res.set({
    "Content-Type": photos.contentType(req.params.file),
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  stream.on("error", (err) => {
    console.error(err);
    res.destroy();
  });
  stream.pipe(res);
});

// ---- Login, sign up, logout ----

// Menghitung percobaan per key (alamat atau username) dalam satu window.
// Lewat dari `max`, wait() memberi jumlah detik yang harus ditunggu. Maksimal
// `size` key disimpan; key yang paling lama tidak dihitung dibuang lebih dulu,
// jadi banjir nama baru tidak membuatnya terus membesar
const limiter = ({ max, window, size = 10000 }) => {
  const counts = new Map();
  const current = (key) => {
    const entry = counts.get(key);
    if (entry && entry.until <= Date.now()) counts.delete(key);
    return counts.get(key);
  };
  return {
    wait: (key) => {
      const entry = current(key);
      return entry && entry.count >= max ? Math.ceil((entry.until - Date.now()) / 1000) : 0;
    },
    count: (key) => {
      const entry = current(key) || { count: 0, until: Date.now() + window };
      entry.count++;
      counts.delete(key);
      counts.set(key, entry);
      if (counts.size > size) counts.delete(counts.keys().next().value);
    },
    clear: (key) => counts.delete(key),
  };
};

// Batas password salah: 10 kali dalam 15 menit untuk satu username dari satu
// alamat, 30 kali dari satu alamat untuk username apa pun (satu password
// dicoba di banyak akun), dan 50 kali per jam untuk satu akun dari alamat
// mana pun
const MINUTE = 60 * 1000;
const loginByAddressAndName = limiter({ max: 10, window: 15 * MINUTE });
const loginByAddress = limiter({ max: 30, window: 15 * MINUTE });
const loginByName = limiter({ max: 50, window: 60 * MINUTE });
// akun baru dari satu alamat: 5 per jam
const signupByAddress = limiter({ max: 5, window: 60 * MINUTE });

// batas panjang password; yang lebih panjang langsung ditolak tanpa di-hash
const MAX_PASSWORD = 200;

const USERNAME = /^[a-z0-9_.]{3,24}$/;
// form menampilkan error-nya sendiri, jadi error tidak ikut muncul di toast
const authPage = (res, mode, { errors = [], ...extra } = {}) =>
  res.render("auth", {
    title: mode === "login" ? "Nook" : "Sign Up · Nook",
    layout: "layouts/main-layout",
    mode,
    username: "",
    next: "",
    ...extra,
    formErrors: errors,
    errors: [],
  });

// session id dibuat ulang saat login, jadi id yang sudah ada sebelum login
// tidak bisa dipakai lagi
const signIn = (req, user) =>
  new Promise((resolve, reject) =>
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      req.session.signedInAt = Date.now();
      req.session.save((err2) => (err2 ? reject(err2) : resolve()));
    })
  );

app.get("/login", (req, res) => {
  if (req.user) return res.redirect("/");
  authPage(res, "login", { next: safeRedirect(req.query.next, "") });
});

app.post("/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const next = safeRedirect(req.body.next, "/");
  const who = `${req.ip}:${username}`;

  const wait = Math.max(
    loginByAddressAndName.wait(who),
    loginByAddress.wait(req.ip),
    loginByName.wait(username)
  );
  if (wait) {
    res.set("Retry-After", String(wait));
    return authPage(res.status(429), "login", {
      username,
      next,
      errors: [{ msg: "Too many tries. Wait a few minutes and try again." }],
    });
  }

  const user = USERNAME.test(username) ? await User.findOne({ username }) : null;
  // akun yang tidak ada tetap dicek dengan dummy hash, agar waktu penolakannya
  // sama dengan password salah
  const ok =
    password.length <= MAX_PASSWORD &&
    (await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH));
  if (!user || !ok) {
    loginByAddressAndName.count(who);
    loginByAddress.count(req.ip);
    loginByName.count(username);
    return authPage(res.status(401), "login", {
      username,
      next,
      errors: [{ msg: "Wrong username or password." }],
    });
  }

  loginByAddressAndName.clear(who);
  // hash yang dibuat dengan pengaturan lama yang lebih ringan dibuat ulang
  // sekarang, selagi password aslinya tersedia
  if (needsRehash(user.passwordHash)) {
    await User.updateOne({ _id: user._id }, { passwordHash: await hashPassword(password) });
  }
  await signIn(req, user);
  res.redirect(next);
});

app.get("/signup", (req, res) => {
  if (req.user) return res.redirect("/");
  authPage(res, "signup");
});

app.post("/signup", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const confirm = String(req.body.confirm || "");

  const wait = signupByAddress.wait(req.ip);
  if (wait) {
    res.set("Retry-After", String(wait));
    return authPage(res.status(429), "signup", {
      username,
      errors: [{ msg: "Too many new accounts from here. Try again later." }],
    });
  }

  const errors = [];
  if (!USERNAME.test(username)) {
    errors.push({ path: "username", msg: "Use 3–24 letters, numbers, _ or ." });
  } else if (await User.exists({ username })) {
    errors.push({ path: "username", msg: "That username is taken." });
  }
  if (password.length < 8 || password.length > MAX_PASSWORD) {
    errors.push({ path: "password", msg: "Use at least 8 characters." });
  } else if (password !== confirm) {
    errors.push({ path: "confirm", msg: "The passwords don't match." });
  }
  if (errors.length) return authPage(res.status(400), "signup", { username, errors });

  let user;
  try {
    user = await User.create({ username, passwordHash: await hashPassword(password) });
  } catch (err) {
    // username yang sama baru saja dipakai akun lain
    if (err.code === 11000) {
      return authPage(res.status(400), "signup", {
        username,
        errors: [{ path: "username", msg: "That username is taken." }],
      });
    }
    throw err;
  }
  signupByAddress.count(req.ip);
  await signIn(req, user);
  res.redirect("/");
});

app.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("sid");
    res.redirect("/login");
  });
});

// ---- Berbagi akses ----

// Pemilik membagikan kontak atau catatan ke akun lain lewat username, untuk
// dibaca saja atau juga diedit. Membagikan lagi ke orang yang sama akan
// mengubah aksesnya
const shareRoutes = (Model, base, noun, nameOf) => {
  app.post(`${base}/:_id/shares`, async (req, res) => {
    const found = await findFor(Model, req.params._id, req.user, "owner");
    const back = `${base}/${req.params._id}`;
    if (!found) {
      req.flash("error", `This ${noun} can't be shared.`);
      return res.redirect(base === "/contact" ? "/contacts" : base);
    }
    const username = String(req.body.username || "").trim().toLowerCase().replace(/^@/, "");
    const target = USERNAME.test(username) ? await User.findOne({ username }, { username: 1 }) : null;
    if (!target) {
      req.flash("error", `There's no account called ${username || "that"}.`);
      return res.redirect(back);
    }
    if (String(target._id) === String(req.user._id)) {
      req.flash("error", `This ${noun} is already yours.`);
      return res.redirect(back);
    }
    const canEdit = req.body.canEdit === "1";
    const { doc } = found;
    const existing = doc.shares.find((share) => String(share.user) === String(target._id));
    if (existing) existing.canEdit = canEdit;
    else doc.shares.push({ user: target._id, canEdit });
    await doc.save();
    req.flash("msg", `${nameOf(doc)} shared with ${target.username}${canEdit ? " (can edit)" : ""}`);
    res.redirect(back);
  });

  // pemilik berhenti membagikan ke seseorang, atau penerima menghapusnya dari
  // akunnya sendiri tanpa mengubah data milik pemilik
  app.delete(`${base}/:_id/shares/:userId`, async (req, res) => {
    const leaving = req.params.userId === String(req.user._id);
    const found = await findFor(Model, req.params._id, req.user, leaving ? "view" : "owner");
    const back = `${base}/${req.params._id}`;
    if (!found || !isId(req.params.userId) || (leaving && found.access === "owner")) {
      req.flash("error", "That share couldn't be removed.");
      return res.redirect(back);
    }
    // hanya data share yang dihapus, jadi edit yang disimpan di saat yang
    // sama tidak tertimpa
    await Model.updateOne({ _id: found.doc._id }, { $pull: { shares: { user: req.params.userId } } });
    if (leaving) {
      req.flash("msg", `${nameOf(found.doc)} removed from your account`);
      return res.redirect(base === "/contact" ? "/contacts" : base);
    }
    req.flash("msg", "No longer shared");
    res.redirect(back);
  });
};

// daftar penerima share kontak atau catatan, untuk popup Share pemiliknya
const sharesOf = async (doc) => {
  const users = await User.find(
    { _id: { $in: doc.shares.map((share) => share.user) } },
    { username: 1 }
  ).lean();
  const names = new Map(users.map((u) => [String(u._id), u.username]));
  return doc.shares
    .map((share) => ({
      userId: String(share.user),
      username: names.get(String(share.user)),
      canEdit: share.canEdit,
    }))
    .filter((share) => share.username);
};

// Halaman utama
app.get("/", (req, res) => {
  res.render("index", {
    title: "My App",
    layout: "layouts/main-layout",
    showDoodles: true,
  });
});

// Halaman kontak
app.get("/contacts", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = 5;
  const skip = (page - 1) * limit;
  const search = searchOf(req.query.search);

  // search tidak memakai halaman, jadi page/all yang tersisa di URL dihapus
  if (search && (req.query.page || req.query.all)) {
    return res.redirect("/contacts?search=" + encodeURIComponent(search));
  }

  // saat search, semua hasil ditampilkan sekaligus tanpa halaman
  const viewAll = req.query.all === "1" || !!search;

  // kontak milik akun ini dan kontak yang dibagikan kepadanya
  const pattern = escapeRegex(search);
  const query = search
    ? {
        $and: [
          visibleTo(req.user),
          {
            $or: [
              { name: { $regex: pattern, $options: "i" } },
              { email: { $regex: pattern, $options: "i" } },
              { phone: { $regex: pattern, $options: "i" } },
              { company: { $regex: pattern, $options: "i" } },
            ],
          },
        ],
      }
    : visibleTo(req.user);

  const totalContacts = await Contact.countDocuments(query);
  const totalPages = Math.ceil(totalContacts / limit);

  // urut abjad tanpa membedakan huruf besar/kecil, agar daftar bisa
  // dikelompokkan A, B, C...
  const contactsQuery = Contact.find(query)
    .populate("owner", "username")
    .collation({ locale: "en", strength: 2 })
    .sort({ name: 1 });
  const contacts = viewAll
    ? await contactsQuery
    : await contactsQuery.skip(skip).limit(limit);

  res.render("contacts", {
    title: "Contact Page",
    layout: "layouts/main-layout",
    students: contacts,
    currentPage: page,
    totalPages,
    totalContacts,
    limit,
    search,
    viewAll,
  });
});

// Halaman form kontak baru
app.get("/contact/new", (req, res) => {
  res.render("new-contact", {
    title: "New Contact Page",
    layout: "layouts/main-layout",
  });
});

// Simpan kontak baru
app.post(
  "/contact",
  uploadPhoto,
  [
    body("name").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ owner: req.user._id, name: String(value) });
      if (duplicate) {
        throw new Error("Contatct name have already exist!");
      }
      return true;
    }),
    check("email", "Email not valid!").isEmail(),
    check("phone", "Phone not valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // form dikembalikan tanpa foto, jadi foto yang di-upload juga dihapus
      if (req.file) removePhoto("/uploads/" + req.file.filename);
      res.render("new-contact", {
        title: "New Contact Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        // isian user dipertahankan agar form tetap terisi
        contact: req.body,
      });
    } else {
      // hanya field dari form, dengan pembuatnya sebagai owner
      await Contact.create({
        owner: req.user._id,
        name: String(req.body.name),
        email: String(req.body.email),
        phone: String(req.body.phone),
        company: String(req.body.company || ""),
        notes: String(req.body.notes || ""),
        image: req.file ? "/uploads/" + req.file.filename : undefined,
      });
      req.flash("msg", `${req.body.name} added successfully`);
      res.redirect("/contacts");
    }
  }
);

// Hapus kontak
app.delete("/contact", async (req, res) => {
  const found = await findFor(Contact, req.body._id, req.user, "owner");
  if (!found) {
    req.flash("error", "This contact can't be deleted.");
    return res.redirect("/contacts");
  }
  removePhoto(found.doc.image);
  await Contact.deleteOne({ _id: found.doc._id });
  req.flash("msg", `${found.doc.name} deleted successfully`);
  res.redirect("/contacts");
});

// Halaman form edit kontak
app.get("/contact/edit/:_id", async (req, res) => {
  const found = await findFor(Contact, req.params._id, req.user, "edit");
  if (!found) {
    req.flash("error", "This contact can't be edited.");
    return res.redirect("/contacts");
  }
  const contact = found.doc;

  res.render("edit-contact", {
    title: "Edit Contact Page",
    layout: "layouts/main-layout",
    contact,
  });
});

// Simpan perubahan kontak
app.put(
  "/contact",
  uploadPhoto,
  [
    body("name").custom(async (value, { req }) => {
      // cek apakah kontak lain milik pemilik yang sama sudah memakai nama ini
      const contact = isId(req.body._id) ? await Contact.findById(req.body._id, { owner: 1 }) : null;
      const duplicate = contact
        ? await Contact.findOne({ owner: contact.owner, name: String(value), _id: { $ne: contact._id } })
        : null;
      if (duplicate) {
        throw new Error("Contatct name have already exist!");
      }
      return true;
    }),
    check("email", "Email not valid!").isEmail(),
    check("phone", "Phone not valid!").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const found = await findFor(Contact, req.body._id, req.user, "edit");
    if (!found) {
      if (req.file) removePhoto("/uploads/" + req.file.filename);
      req.flash("error", "This contact can't be edited.");
      return res.redirect("/contacts");
    }
    const existing = found.doc;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) removePhoto("/uploads/" + req.file.filename);
      return res.render("edit-contact", {
        title: "Edit Contact Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        // foto tetap memakai yang tersimpan; form tidak bisa mengubah path-nya
        contact: { ...req.body, _id: existing._id, image: existing.image },
      });
    } else {
      // foto baru menggantikan yang lama, field kosong menghapusnya, selain itu
      // foto tidak berubah (path dari form tidak pernah dipakai)
      let image = existing.image;
      if (req.file) image = "/uploads/" + req.file.filename;
      else if (!req.body.image) image = undefined;
      if (image !== existing.image) removePhoto(existing.image);

      await Contact.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: String(req.body.name),
            email: String(req.body.email),
            phone: String(req.body.phone),
            company: String(req.body.company || ""),
            notes: String(req.body.notes || ""),
            ...(image ? { image } : {}),
          },
          ...(image ? {} : { $unset: { image: "" } }),
        }
      );
      req.flash("msg", `${req.body.name} updated successfully`);
      res.redirect("/contact/" + existing._id);
    }
  }
);

// Halaman detail kontak
app.get("/contact/:_id", async (req, res) => {
  const found = await findFor(Contact, req.params._id, req.user);
  if (!found) {
    req.flash("error", "That contact isn't there.");
    return res.redirect("/contacts");
  }
  res.render("detail", {
    title: "Detail Contact Page",
    layout: "layouts/main-layout",
    contact: found.doc,
    access: found.access,
    shares: found.access === "owner" ? await sharesOf(found.doc) : [],
  });
});

shareRoutes(Contact, "/contact", "contact", (contact) => contact.name);

// Daftar hanya butuh preview: teks catatan biasa, atau awal ciphertext untuk
// catatan terenkripsi. Isi lengkap beserta gambarnya tidak ikut diambil
const PREVIEW_FIELDS = {
  // pemilik catatan, agar catatan yang dibagikan ke akun ini bisa ditandai
  owner: 1,
  title: 1,
  mood: 1,
  date: 1,
  isEncrypted: 1,
  createdAt: 1,
  text: 1,
  content: { $substrCP: ["$content", 0, 300] },
};

// Panjang maksimal isi catatan; satu dokumen MongoDB maksimal 16MB
const MAX_NOTE_LENGTH = 7 * 1024 * 1024;
// batas catatan yang sama setelah dikunci di browser: base64 sepertiga lebih
// panjang, ditambah ruang untuk karakter yang lebih dari satu byte
const MAX_CIPHER_LENGTH = Math.ceil(MAX_NOTE_LENGTH * 1.5);

const paperOf = (value) => (value === "lined" ? "lined" : "plain");

// Catatan yang dikirim terkunci (encrypt diisi) berupa ciphertext dari
// browser, jadi hanya bentuknya yang bisa dicek. Catatan biasa dicek isi dan
// ukurannya
const checkNoteContent = body("content").custom((value, { req }) => {
  if (req.body.encrypt) {
    if (!readCipher(req.body, MAX_CIPHER_LENGTH)) {
      throw new Error("This locked note couldn't be saved. Try again.");
    }
    return true;
  }
  if (!hasNoteContent(value)) throw new Error("Content is required!");
  if (value.length > MAX_NOTE_LENGTH) {
    throw new Error("This note is too big. Try fewer or smaller images.");
  }
  return true;
});

// Halaman catatan: default kalender bulanan, daftar hasil saat search
app.get("/writing", async (req, res) => {
  const search = searchOf(req.query.search);

  if (search) {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 5;
    const skip = (page - 1) * limit;

    // Catatan terenkripsi hanya berisi ciphertext, jadi isinya tidak di-search
    const pattern = escapeRegex(search);
    const query = {
      $and: [
        visibleTo(req.user),
        {
          $or: [
            { title: { $regex: pattern, $options: "i" } },
            { mood: { $regex: pattern, $options: "i" } },
            {
              isEncrypted: false,
              text: { $regex: pattern, $options: "i" },
            },
          ],
        },
      ],
    };

    const totalWritings = await Writing.countDocuments(query);

    const writings = await Writing.find(query, PREVIEW_FIELDS)
      .populate("owner", "username")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 });

    return res.render("writings", {
      title: "Writing Page",
      layout: "layouts/main-layout",
      mode: "list",
      writings,
      currentPage: page,
      totalPages: Math.ceil(totalWritings / limit),
      totalWritings,
      limit,
      search,
    });
  }

  const today = dayKey(new Date());
  const month = isMonthKey(req.query.month)
    ? req.query.month
    : today.slice(0, 7);
  const [year, monthNo] = month.split("-").map(Number);

  const monthStart = new Date(`${month}-01T00:00:00${TZ_OFFSET}`);
  const monthEnd = new Date(`${shiftMonth(month, 1)}-01T00:00:00${TZ_OFFSET}`);

  const writings = await Writing.find(
    { ...visibleTo(req.user), date: { $gte: monthStart, $lt: monthEnd } },
    PREVIEW_FIELDS
  )
    .populate("owner", "username")
    .sort({
      date: 1,
      createdAt: 1,
    });

  const notesByDay = new Map();
  writings.forEach((writing) => {
    const key = dayKey(writing.date);
    if (!notesByDay.has(key)) notesByDay.set(key, []);
    notesByDay.get(key).push(writing);
  });

  // Dibaca sebagai UTC agar hari dan jumlah hari dalam bulan tepat
  const firstWeekday = new Date(Date.UTC(year, monthNo - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNo, 0)).getUTCDate();

  // tanda kembar (nama, ikon, dan warna sama, yang sempat dibuat dua kali
  // sebelum nama dibuat unik) dianggap satu tanda, diwakili yang paling lama
  const markers = [];
  const markerOf = new Map(); // id kembaran -> tanda yang ditampilkan
  const byLook = new Map();
  (await Marker.find({ owner: req.user._id }).sort({ createdAt: 1, _id: 1 }).lean()).forEach((marker) => {
    const id = String(marker._id);
    const shown = byLook.get(markerLook(marker));
    if (shown) return markerOf.set(id, shown.id);
    const entry = { ...marker, id, hex: MARK_COLORS[marker.color] || MARK_COLORS.green };
    byLook.set(markerLook(marker), entry);
    markers.push(entry);
    markerOf.set(id, id);
  });

  const monthMarks = await DayMark.find({
    owner: req.user._id,
    day: { $gte: `${month}-01`, $lt: `${shiftMonth(month, 1)}-01` },
  }).lean();
  const marksByDay = new Map();
  monthMarks.forEach((mark) => {
    const id = markerOf.get(String(mark.marker));
    if (!id) return;
    if (!marksByDay.has(mark.day)) marksByDay.set(mark.day, new Set());
    marksByDay.get(mark.day).add(id);
  });
  // jumlah hari tiap tanda (kembaran di hari yang sama dihitung sekali)
  const markCounts = {};
  marksByDay.forEach((ids) => ids.forEach((id) => (markCounts[id] = (markCounts[id] || 0) + 1)));

  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${month}-${String(day).padStart(2, "0")}`;
    const dayMarks = marksByDay.get(key) || new Set();
    cells.push({
      day,
      key,
      notes: notesByDay.get(key) || [],
      // urutannya sama dengan legend
      marks: markers.filter((marker) => dayMarks.has(marker.id)),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  res.render("writings", {
    title: "Writing Page",
    layout: "layouts/main-layout",
    mode: "calendar",
    search,
    weeks,
    month,
    monthLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(monthStart),
    prevMonth: shiftMonth(month, -1),
    nextMonth: shiftMonth(month, 1),
    thisMonth: today.slice(0, 7),
    today,
    totalWritings: writings.length,
    markers,
    markCounts,
    markIcons: MARK_ICONS,
    markColors: MARK_COLORS,
    // semua catatan, ditampilkan di baris jumlah seperti total kontak
    totalNotes: await Writing.countDocuments(visibleTo(req.user)),
  });
});

// Pasang tanda di suatu hari, atau lepas jika sudah terpasang
app.post("/marks", async (req, res) => {
  const day = req.body.date;
  const marker = isId(req.body.marker)
    ? await Marker.findOne({ _id: req.body.marker, owner: req.user._id })
    : null;
  if (!isDayKey(day) || !marker) {
    req.flash("error", "That mark could not be saved!");
    return res.redirect("/writing");
  }

  const back = "/writing?month=" + day.slice(0, 7);
  // tanda dianggap terpasang jika salah satu kembarannya terpasang; saat
  // dilepas, semuanya dihapus
  const twins = await twinIds(marker);
  const removed = (await DayMark.deleteMany({ day, marker: { $in: twins } })).deletedCount > 0;
  if (!removed) {
    if (await dayIsFull(req.user._id, day)) {
      req.flash("error", `A day can hold up to ${MAX_MARKS_PER_DAY} marks!`);
      return res.redirect(back);
    }
    await DayMark.create({ owner: req.user._id, day, marker: marker._id });
  }
  req.flash(
    "msg",
    `${marker.name} ${removed ? "removed from" : "marked on"} ${app.locals.formatShortDay(day)}`
  );
  res.redirect(back);
});

// Jenis tanda baru, langsung dipasang di hari tempat tanda itu dibuat
app.post("/markers", async (req, res) => {
  const day = isDayKey(req.body.date) ? req.body.date : null;
  const back = day ? "/writing?month=" + day.slice(0, 7) : "/writing";
  const name = String(req.body.name || "").trim();

  if (!name || name.length > 24) {
    req.flash("error", "Give the mark a name of up to 24 characters!");
    return res.redirect(back);
  }
  // hari yang penuh tidak menerima tanda baru, kecuali nama ini sudah ada
  if (day && (await dayIsFull(req.user._id, day))) {
    const onDay = await DayMark.find({ owner: req.user._id, day }).populate("marker", "name").lean();
    if (!onDay.some((m) => m.marker?.name.toLowerCase() === name.toLowerCase())) {
      req.flash("error", `A day can hold up to ${MAX_MARKS_PER_DAY} marks!`);
      return res.redirect(back);
    }
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // nama yang sudah pernah dibuat langsung dipasang, tidak dibuat ulang
  const marker =
    (await Marker.findOne({
      owner: req.user._id,
      name: { $regex: `^${escaped}$`, $options: "i" },
    })) ||
    (await Marker.create({
      owner: req.user._id,
      name,
      icon: MARK_ICONS.includes(req.body.icon) ? req.body.icon : "dot",
      color: MARK_COLORS[req.body.color] ? req.body.color : "green",
    }));
  if (day) {
    await DayMark.updateOne(
      { day, marker: marker._id },
      { $setOnInsert: { owner: req.user._id, day, marker: marker._id } },
      { upsert: true }
    );
  }
  req.flash("msg", `${marker.name} added${day ? " on " + app.locals.formatShortDay(day) : ""}`);
  res.redirect(back);
});

// Hapus jenis tanda secara permanen, beserta semua hari yang memakainya
app.delete("/markers/:_id", async (req, res) => {
  const back = safeRedirect(req.body?.redirect, "/writing");
  const marker = isId(req.params._id)
    ? await Marker.findOne({ _id: req.params._id, owner: req.user._id })
    : null;
  if (!marker) {
    req.flash("error", "This mark cannot be deleted!");
    return res.redirect(back);
  }

  // beserta kembarannya, karena semuanya ditampilkan sebagai satu tanda
  const ids = await twinIds(marker);
  await DayMark.deleteMany({ marker: { $in: ids } });
  await Marker.deleteMany({ _id: { $in: ids } });
  req.flash("msg", `${marker.name} deleted`);
  res.redirect(back);
});

// id catatan di path harus berupa ObjectId Mongo. Selain itu bukan catatan,
// jadi /writing/new dan sejenisnya diteruskan ke route masing-masing
const isNoteId = (id) => /^[0-9a-f]{24}$/i.test(String(id || ""));

// Halaman form catatan baru
app.get("/writing/new", (req, res) => {
  res.render("new-writing", {
    title: "New Note Page",
    layout: "layouts/main-layout",
    // Kalender mengarah ke sini dengan membawa tanggal catatan
    writing: { date: isDayKey(req.query.date) ? req.query.date : "" },
  });
});

// Simpan catatan baru
app.post(
  "/writing",
  [
    check("title", "Title is required!").notEmpty(),
    checkNoteContent,
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("new-writing", {
        title: "New Note Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        // ciphertext tidak bisa dimasukkan kembali ke editor
        writing: { ...req.body, content: req.body.encrypt ? "" : req.body.content },
      });
    } else {
      let fields;
      if (req.body.encrypt) {
        fields = readCipher(req.body, MAX_CIPHER_LENGTH);
      } else {
        const content = noteHtml(req.body.content);
        fields = { content, text: noteText(content) };
      }
      await Writing.create({
        owner: req.user._id,
        title: String(req.body.title),
        mood: req.body.mood,
        paper: paperOf(req.body.paper),
        date: isDayKey(req.body.date) ? dayToDate(req.body.date) : new Date(),
        ...fields,
      });
      req.flash(
        "msg",
        `${req.body.title} added successfully${req.body.encrypt ? " and encrypted" : ""}`
      );
      res.redirect("/writing");
    }
  }
);

// Encrypt catatan: browser mengirim catatan yang sudah dikunci
app.post("/writing/encrypt", async (req, res) => {
  const back = safeRedirect(req.body.redirect, "/writing");
  const writing = (await findFor(Writing, req.body._id, req.user, "owner"))?.doc;

  if (!writing || writing.isEncrypted) {
    req.flash("error", "This note cannot be encrypted!");
    return res.redirect(back);
  }

  const locked = readCipher(req.body, MAX_CIPHER_LENGTH);
  if (!locked) {
    req.flash("error", "This note couldn't be locked. Try again.");
    return res.redirect(back);
  }

  await Writing.updateOne(
    { _id: writing._id },
    { $set: locked, $unset: { text: "", authTag: "" } }
  );
  req.flash("msg", `${writing.title} locked`);
  res.redirect(back);
});

// Decrypt catatan: browser membuka catatan dengan key-nya, lalu mengirim
// isinya untuk disimpan tanpa kunci
app.post("/writing/decrypt", async (req, res) => {
  const back = safeRedirect(req.body.redirect, "/writing");
  const writing = (await findFor(Writing, req.body._id, req.user, "owner"))?.doc;

  if (!writing || !writing.isEncrypted) {
    req.flash("error", "This note is not encrypted!");
    return res.redirect(back);
  }

  const content = noteHtml(req.body.content);
  if (!hasNoteContent(content) || content.length > MAX_NOTE_LENGTH) {
    req.flash("error", "The lock couldn't be removed. Try again.");
    return res.redirect(back);
  }

  await Writing.updateOne(
    { _id: writing._id },
    {
      $set: { content, text: noteText(content), isEncrypted: false },
      $unset: { salt: "", iv: "", authTag: "", encVersion: "" },
    }
  );
  req.flash("msg", `Lock removed from ${writing.title}`);
  res.redirect(back);
});

// Batas key salah untuk catatan terkunci versi lama, per alamat dan catatan:
// setelah 5 kali dalam semenit, harus menunggu. (Catatan yang dikunci di
// browser tidak pernah dicek di sini, karena server tidak menerima key-nya)
const LEGACY_TRIES = 5;
const LEGACY_WINDOW = 60 * 1000;
const legacyMisses = new Map();

const legacyBlocked = (who) => {
  const entry = legacyMisses.get(who);
  if (entry && entry.until < Date.now()) legacyMisses.delete(who);
  return (legacyMisses.get(who)?.count || 0) >= LEGACY_TRIES;
};

const legacyMiss = (who) => {
  const entry = legacyMisses.get(who) || { count: 0, until: Date.now() + LEGACY_WINDOW };
  entry.count++;
  legacyMisses.set(who, entry);
};

// Membuka catatan terkunci versi lama untuk terakhir kali: isinya dikirim ke
// browser, lalu dikunci ulang di sana (lihat relock di bawah)
app.post("/writing/:_id/legacy-open", async (req, res) => {
  const writing = (await findFor(Writing, req.params._id, req.user, "owner"))?.doc;
  if (!writing) return res.status(404).json({ error: "Note not found." });
  if (!isLegacyLock(writing)) {
    return res.status(409).json({ error: "This note doesn't need its lock upgraded." });
  }

  const who = `${req.ip}:${writing._id}`;
  if (legacyBlocked(who)) {
    return res.status(429).json({ error: "Too many wrong keys. Wait a minute and try again." });
  }

  let content;
  try {
    content = decryptText(writing, String(req.body?.key || ""));
  } catch {
    legacyMiss(who);
    return res.status(401).json({ error: "Wrong key!" });
  }

  legacyMisses.delete(who);
  res.json({ content: noteHtml(content) });
});

// Menyimpan catatan versi lama yang sudah dikunci ulang di browser dengan
// key yang sama
app.post("/writing/:_id/relock", async (req, res) => {
  const writing = (await findFor(Writing, req.params._id, req.user, "owner"))?.doc;
  if (!writing) return res.status(404).json({ error: "Note not found." });
  const locked = readCipher(req.body, MAX_CIPHER_LENGTH);
  if (!isLegacyLock(writing) || !locked) {
    return res.status(400).json({ error: "This note's lock couldn't be upgraded." });
  }

  await Writing.updateOne({ _id: writing._id }, { $set: locked, $unset: { authTag: "" } });
  res.json({ ok: true });
});

// Hapus catatan
app.delete("/writing", async (req, res) => {
  const found = await findFor(Writing, req.body._id, req.user, "owner");
  if (!found) {
    req.flash("error", "This note can't be deleted.");
    return res.redirect("/writing");
  }
  await Writing.deleteOne({ _id: found.doc._id });
  req.flash("msg", `${found.doc.title} deleted successfully`);
  res.redirect("/writing");
});

// Halaman form edit catatan
app.get("/writing/edit/:_id", async (req, res) => {
  const found = await findFor(Writing, req.params._id, req.user, "edit");
  if (!found) {
    req.flash("error", "This note can't be edited.");
    return res.redirect("/writing");
  }
  const writing = found.doc;

  // catatan terkunci dibuka di editor setelah key-nya dimasukkan di halaman,
  // lalu dikunci lagi di sana sebelum disimpan
  res.render("edit-writing", {
    title: "Edit Note Page",
    layout: "layouts/main-layout",
    writing,
  });
});

// Simpan perubahan catatan
app.put(
  "/writing",
  [
    check("title", "Title is required!").notEmpty(),
    checkNoteContent,
  ],
  async (req, res) => {
    const found = await findFor(Writing, req.body._id, req.user, "edit");
    if (!found) {
      req.flash("error", "This note can't be edited.");
      return res.redirect("/writing");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // ciphertext catatan terkunci tidak bisa dimasukkan kembali ke editor,
      // jadi halaman edit dibuka ulang dan key diminta lagi
      if (req.body.encrypt) {
        req.flash("error", errors.array()[0].msg);
        return res.redirect("/writing/edit/" + req.body._id);
      }
      return res.render("edit-writing", {
        title: "Edit Note Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        writing: req.body,
      });
    } else {
      const writing = found.doc;
      // catatan terkunci harus disimpan terkunci, catatan biasa tetap biasa
      if (!writing || Boolean(writing.isEncrypted) !== Boolean(req.body.encrypt)) {
        req.flash("error", "This note couldn't be saved. Try again.");
        return res.redirect("/writing/" + req.body._id);
      }

      let fields;
      if (writing.isEncrypted) {
        fields = readCipher(req.body, MAX_CIPHER_LENGTH);
      } else {
        const content = noteHtml(req.body.content);
        fields = { content, text: noteText(content) };
      }
      await Writing.updateOne(
        { _id: writing._id },
        {
          $set: {
            title: String(req.body.title),
            ...fields,
            mood: req.body.mood,
            paper: paperOf(req.body.paper),
            editedAt: new Date(),
          },
          ...(writing.isEncrypted ? { $unset: { authTag: "" } } : {}),
        }
      );
      req.flash("msg", `${req.body.title} updated successfully`);
      res.redirect("/writing/" + req.body._id);
    }
  }
);

// Halaman detail catatan
app.get("/writing/:_id", async (req, res, next) => {
  if (!isNoteId(req.params._id)) return next();
  const found = await findFor(Writing, req.params._id, req.user);
  if (!found) {
    req.flash("error", "That note isn't there.");
    return res.redirect("/writing");
  }
  res.render("detail-writing", {
    title: "Detail Note Page",
    layout: "layouts/main-layout",
    writing: found.doc,
    access: found.access,
    shares: found.access === "owner" ? await sharesOf(found.doc) : [],
  });
});

shareRoutes(Writing, "/writing", "note", (writing) => writing.title);

// Selain route di atas: halaman tidak ditemukan
app.use((req, res) => {
  res.status(404).send("Not found");
});

// Error yang tidak terduga dicatat di log, stack-nya tidak pernah ditampilkan
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).send("Something went wrong.");
});

// Hanya komputer ini yang bisa mengakses aplikasi (HOST=0.0.0.0 membukanya
// ke jaringan). Server hanya listen jika dijalankan dengan `node app.js`;
// host seperti Vercel memakai app yang di-export dan menjalankannya sendiri
const host = process.env.HOST || "127.0.0.1";
if (require.main === module) {
  app.listen(port, host, () => {
    console.log(`Nook | listening at http://localhost:${port}`);
  });
}

module.exports = app;
