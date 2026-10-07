const fs = require("fs");
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

// Notes saved before the editor have no text field yet
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

// Looks a day mark can take. The colors are earthy tones from the same
// family as the sage and terracotta of the app: close in lightness and
// softness, so any mix of marks sits calmly together, and each keeps 4.5:1
// with the white text of a picked chip
const MARK_ICONS = ["drop", "moon", "star", "heart", "pill", "dot"];
// Tailwind's 600 shades: bright, but still dark enough to read on paper
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
// how many marks one day can hold
const MAX_MARKS_PER_DAY = 20;
const dayIsFull = async (owner, day) =>
  (await DayMark.countDocuments({ owner, day })) >= MAX_MARKS_PER_DAY;

// Marks with the same name (in any case), icon and color are twins: shown
// and treated as one mark
const markerLook = (marker) => [marker.name.trim().toLowerCase(), marker.icon, marker.color].join("|");
// the ids of a mark and its twins
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

// Behind a reverse proxy, TRUST_PROXY says which one to believe for the
// visitor's address and https (a hop count like "1", or "loopback"); unset,
// no forwarded header is trusted
if (process.env.TRUST_PROXY) {
  const trust = process.env.TRUST_PROXY;
  app.set("trust proxy", /^\d+$/.test(trust) ? Number(trust) : trust);
}

// No page here may be framed by another site (clickjacking), sniffed as
// another type, or leak its address to other sites
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

// A form or request that changes something must come from this app's own
// pages. SameSite=Lax keeps the cookie off other sites' posts, but not off
// the sign-in form, where another site could sign someone into its account.
// Browsers say where a request came from in Sec-Fetch-Site; older ones only
// in Origin or Referer. With none of them, it's refused
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

// Setup Method Override
app.use(methodOverride("_method"));

// Setup EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
// public/ is served as it is, except uploaded photos: those go only to who
// may see their contact (GET /uploads/:file, below)
const servePublic = express.static("public");
app.use((req, res, next) =>
  req.path.startsWith("/uploads/") ? next() : servePublic(req, res, next)
);
// Notes carry their images inline, so the form body can be a few MB
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
// an older locked note, locked again in the browser, comes back as JSON
app.use(express.json({ limit: "15mb" }));

// Session configuration. The secret signs the session cookie: from
// SESSION_SECRET (e.g. `node --env-file=.env app.js`), or else one made on
// the first start and kept in .session-secret (never committed), so a
// restart doesn't sign everyone out
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
// Signed in for a week, kept in MongoDB so a restart doesn't sign anyone
// out. SameSite=Lax keeps the cookie off forms posted from other sites, so
// another page can't act as the person signed in here
app.use(
  session({
    name: "sid",
    store: new MongoStore(),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // SESSION_COOKIE_SECURE=1 when served over https, so the cookie never
      // goes over plain http (behind a proxy, set TRUST_PROXY too)
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
  // read only when one is waiting: req.flash() on its own starts a session,
  // which would store one for every visit before signing in
  const waiting = Boolean(req.session.flash);
  const message = waiting ? req.flash("msg") : [];
  res.locals.msg = message.length > 0 ? message[0] : null;
  // Feeds the same red toast the validation errors use
  res.locals.errors = waiting ? req.flash("error").map((msg) => ({ msg })) : [];
  next();
});
// A redirect goes out only once the session is saved: express-session sends
// the headers before its save is done, so the next page could be read from
// the old session, and a message ("… added successfully") would turn up a
// page late. Only a session with something in it is saved, so a visit before
// signing in still stores none
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

// Active menu for the navbar
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// ---- Accounts ----

// pages that open without signing in
const PUBLIC_PATHS = ["/login", "/signup"];

// Each visit keeps a session going for another week, but never past 30 days
// from signing in: then it's time to sign in again
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const sessionTooOld = (session) => {
  // sessions from before this limit start counting now, not sign out at once
  if (!session.signedInAt) session.signedInAt = Date.now();
  return Date.now() - session.signedInAt > SESSION_MAX_AGE;
};

// The signed-in account, as req.user and (for the views) user; anyone else
// is sent to the sign-in page, and comes back where they were going after
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

// View Helpers
app.locals.noteHtml = noteHtml;
app.locals.moods = ["Happy", "Grateful", "Excited", "Calm", "Tired", "Sad"];
// the face shown for each mood (the mood picker, the note detail)
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

// Jakarta has no daylight saving, so a fixed offset is enough to map a calendar
// day onto the instant it starts at
const TZ_OFFSET = "+07:00";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "2026-09-22" for whichever day the instant falls on in Jakarta
const dayKey = (date) => dayKeyFormat.format(new Date(date));

const isDayKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isMonthKey = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);

// Midday keeps the stored instant on the intended day whichever way it is read
const dayToDate = (key) => new Date(`${key}T12:00:00${TZ_OFFSET}`);

const shiftMonth = (monthKey, step) => {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + step, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Calendar days read in English: "Sep 28", "Monday, September 28, 2026"
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

// a note's day for the search list's margin: "Sep 28", and its year apart,
// only when it isn't this year ("" otherwise)
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

// Keeps the "go back where you came from" field from turning into an open
// redirect: only a path on this app is followed. Browsers read "/\evil.com"
// as "//evil.com", so backslashes and control characters are refused before
// the path is resolved, and anything that lands on another host falls back
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

// a Mongo ObjectId, as it comes in a path or a form
const isId = (id) => /^[0-9a-f]{24}$/i.test(String(id || ""));

// search words matched as they are typed, not as a regular expression
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchOf = (value) => (typeof value === "string" ? value.trim().slice(0, 100) : "");

// What an account may see: its own, and what was shared with it
const visibleTo = (user) => ({ $or: [{ owner: user._id }, { "shares.user": user._id }] });

// "owner", "edit" (shared with editing), "view" (shared to read), or null
const accessOf = (doc, user) => {
  if (!doc || !user) return null;
  if (String(doc.owner?._id || doc.owner) === String(user._id)) return "owner";
  const share = (doc.shares || []).find((s) => String(s.user?._id || s.user) === String(user._id));
  if (!share) return null;
  return share.canEdit ? "edit" : "view";
};
const ACCESS_RANK = { view: 1, edit: 2, owner: 3 };

// A contact or note by id, when this account may at least `need` it:
// { doc, access }, or null (missing and not allowed look the same)
const findFor = async (Model, id, user, need = "view") => {
  if (!isId(id)) return null;
  const doc = await Model.findById(id).populate("owner", "username");
  const access = accessOf(doc, user);
  if (!access || ACCESS_RANK[access] < ACCESS_RANK[need]) return null;
  return { doc, access };
};

// Setup Multer for upload file: photos only, up to 2MB, under a random
// name (the name sent with the file is never used)
const multer = require("multer");
const UPLOAD_DIR = "public/uploads";
const PHOTO_TYPES = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" };
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString("hex") + PHOTO_TYPES[file.mimetype]);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(PHOTO_TYPES[file.mimetype])),
});

// a photo too big comes back as a message on the form, not a crash
const uploadPhoto = (req, res, next) =>
  upload.single("image")(req, res, (err) => {
    if (err) {
      req.flash("error", err.code === "LIMIT_FILE_SIZE" ? "The photo can be up to 2MB." : "That photo couldn't be uploaded.");
      return res.redirect(safeRedirect(req.get("Referer")?.replace(/^https?:\/\/[^/]+/, ""), "/contacts"));
    }
    next();
  });

// An uploaded photo's path as stored on a contact: "/uploads/<name>" and
// nothing else, so a path from a form can never reach another file
const PHOTO_PATH = /^\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/;
const removePhoto = (image) => {
  if (PHOTO_PATH.test(image || "")) fs.unlink("public" + image, () => {});
};

// a photo goes only to who may see a contact that has it
app.get("/uploads/:file", async (req, res) => {
  const image = "/uploads/" + req.params.file;
  if (!PHOTO_PATH.test(image)) return res.sendStatus(404);
  const contact = await Contact.exists({ image, ...visibleTo(req.user) });
  if (!contact) return res.sendStatus(404);
  res.sendFile(image, { root: "public", headers: { "X-Content-Type-Options": "nosniff" } });
});

// ---- Sign in, sign up, sign out ----

// Counts per key (an address, a username) within a window; past `max` it
// says how many seconds to wait. It holds at most `size` keys, dropping the
// ones least recently counted, so a flood of new names can't grow it forever
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

// Wrong passwords: 10 in 15 minutes for one username from one address, 30
// from one address whatever the usernames (one password tried on many
// accounts), and 50 an hour on one account from anywhere (many addresses)
const MINUTE = 60 * 1000;
const loginByAddressAndName = limiter({ max: 10, window: 15 * MINUTE });
const loginByAddress = limiter({ max: 30, window: 15 * MINUTE });
const loginByName = limiter({ max: 50, window: 60 * MINUTE });
// new accounts from one address: 5 an hour
const signupByAddress = limiter({ max: 5, window: 60 * MINUTE });

// the longest password taken; a longer one isn't hashed at all
const MAX_PASSWORD = 200;

const USERNAME = /^[a-z0-9_.]{3,24}$/;
// the form shows its own errors, so they don't go to the toast as well
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

// a fresh session id for the account, so one handed out before sign-in is
// worthless after it
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
  // a missing account is checked against a dummy hash, so it takes as long
  // to refuse as a wrong password
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
  // a hash made with older, cheaper settings is made again now, while the
  // password is at hand
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
    // the same name taken a moment earlier
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

// ---- Sharing ----

// The owner shares a contact or note with another account by username, to
// read or to edit too; sharing again with the same person changes that
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

  // the owner stops sharing with someone; or someone it's shared with takes
  // it off their own account, which leaves the owner's copy as it is
  app.delete(`${base}/:_id/shares/:userId`, async (req, res) => {
    const leaving = req.params.userId === String(req.user._id);
    const found = await findFor(Model, req.params._id, req.user, leaving ? "view" : "owner");
    const back = `${base}/${req.params._id}`;
    if (!found || !isId(req.params.userId) || (leaving && found.access === "owner")) {
      req.flash("error", "That share couldn't be removed.");
      return res.redirect(back);
    }
    // only the share is pulled, so an edit saved meanwhile isn't overwritten
    await Model.updateOne({ _id: found.doc._id }, { $pull: { shares: { user: req.params.userId } } });
    if (leaving) {
      req.flash("msg", `${nameOf(found.doc)} removed from your account`);
      return res.redirect(base === "/contact" ? "/contacts" : base);
    }
    req.flash("msg", "No longer shared");
    res.redirect(back);
  });
};

// who a contact or note is shared with, for its owner's Share popup
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

// Home Page
app.get("/", (req, res) => {
  res.render("index", {
    title: "My App",
    layout: "layouts/main-layout",
    showDoodles: true,
  });
});

// Contact Page
app.get("/contacts", async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = 5;
  const skip = (page - 1) * limit;
  const search = searchOf(req.query.search);

  // a search has no pages, so drop a leftover page/all from its URL
  if (search && (req.query.page || req.query.all)) {
    return res.redirect("/contacts?search=" + encodeURIComponent(search));
  }

  // a search has no pages: every match is shown at once
  const viewAll = req.query.all === "1" || !!search;

  // this account's contacts and the ones shared with it
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

  // alphabetical (case-insensitive) so the list can be grouped A, B, C...
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

// Form New Contact Page
app.get("/contact/new", (req, res) => {
  res.render("new-contact", {
    title: "New Contact Page",
    layout: "layouts/main-layout",
  });
});

// Post New Contact
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
      // the form comes back without the photo, so it isn't kept either
      if (req.file) removePhoto("/uploads/" + req.file.filename);
      res.render("new-contact", {
        title: "New Contact Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        // keep what was typed so the form comes back filled in
        contact: req.body,
      });
    } else {
      // only the form's own fields, owned by whoever made it
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

// Delete Detail Contact
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

// Form Edit Contact Page
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

// Post Edit Contact
app.put(
  "/contact",
  uploadPhoto,
  [
    body("name").custom(async (value, { req }) => {
      // another of the owner's contacts already has this name
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
        // the photo stays what is saved; the form can't point it elsewhere
        contact: { ...req.body, _id: existing._id, image: existing.image },
      });
    } else {
      // a new photo replaces the saved one; an emptied field removes it;
      // otherwise it stays as saved (the form's value is never trusted)
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

// Detail Contact Page
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

// Old diary list path, kept so earlier links and bookmarks still land
app.get("/diaries", (req, res) => {
  const query = req.originalUrl.slice(req.path.length);
  res.redirect(301, "/writing" + query);
});

// Lists only need a preview: the words of an open note, the start of an
// encrypted one's ciphertext; the full content (with its images) stays out
const PREVIEW_FIELDS = {
  // whose it is, so a note shared with this account can say so
  owner: 1,
  title: 1,
  mood: 1,
  date: 1,
  isEncrypted: 1,
  createdAt: 1,
  text: 1,
  content: { $substrCP: ["$content", 0, 300] },
};

// Longest note body accepted; a MongoDB document tops out at 16MB
const MAX_NOTE_LENGTH = 7 * 1024 * 1024;
// the same note locked in the browser: base64 is a third longer, plus room
// for words that take more than a byte
const MAX_CIPHER_LENGTH = Math.ceil(MAX_NOTE_LENGTH * 1.5);

const paperOf = (value) => (value === "lined" ? "lined" : "plain");

// A note sent locked (encrypt set) is ciphertext from the browser: only its
// shape can be checked. An open one is checked for words and size
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

// Writing Page: a month calendar by default, a flat result list while searching
app.get("/writing", async (req, res) => {
  const search = searchOf(req.query.search);

  if (search) {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 5;
    const skip = (page - 1) * limit;

    // An encrypted content field only holds ciphertext, so it is not searchable
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

  // A calendar date read as UTC gives the right weekday and month length
  const firstWeekday = new Date(Date.UTC(year, monthNo - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNo, 0)).getUTCDate();

  // twins (the same name, icon and color, made twice before names were kept
  // unique) are one mark everywhere: the oldest stands for them all
  const markers = [];
  const markerOf = new Map(); // a twin's id -> the mark shown for it
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
  // days each mark is on (two twins on one day count once)
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
      // in the same order as the legend
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
    // every note, shown in the count row like the contacts total
    totalNotes: await Writing.countDocuments(visibleTo(req.user)),
  });
});

// Put a mark on a day, or take it off again
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
  // the mark is on the day when any of its twins is; taken off, all go
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

// New kind of mark, put straight on the day it was made from
app.post("/markers", async (req, res) => {
  const day = isDayKey(req.body.date) ? req.body.date : null;
  const back = day ? "/writing?month=" + day.slice(0, 7) : "/writing";
  const name = String(req.body.name || "").trim();

  if (!name || name.length > 24) {
    req.flash("error", "Give the mark a name of up to 24 characters!");
    return res.redirect(back);
  }
  // a full day takes no new mark, unless this name is already on it
  if (day && (await dayIsFull(req.user._id, day))) {
    const onDay = await DayMark.find({ owner: req.user._id, day }).populate("marker", "name").lean();
    if (!onDay.some((m) => m.marker?.name.toLowerCase() === name.toLowerCase())) {
      req.flash("error", `A day can hold up to ${MAX_MARKS_PER_DAY} marks!`);
      return res.redirect(back);
    }
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // a name made before is put on the day as it is, not made a second time
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

// Delete a kind of mark for good, along with every day it was put on
app.delete("/markers/:_id", async (req, res) => {
  const back = safeRedirect(req.body?.redirect, "/writing");
  const marker = isId(req.params._id)
    ? await Marker.findOne({ _id: req.params._id, owner: req.user._id })
    : null;
  if (!marker) {
    req.flash("error", "This mark cannot be deleted!");
    return res.redirect(back);
  }

  // with its twins, as they are shown as one mark
  const ids = await twinIds(marker);
  await DayMark.deleteMany({ marker: { $in: ids } });
  await Marker.deleteMany({ _id: { $in: ids } });
  req.flash("msg", `${marker.name} deleted`);
  res.redirect(back);
});

// a note's id in a path: a Mongo ObjectId (anything else isn't a note, so
// /writing/new and the like fall through to their own routes)
const isNoteId = (id) => /^[0-9a-f]{24}$/i.test(String(id || ""));

// Old new-note path, kept so earlier links and bookmarks still land
app.get("/diary/new", (req, res) => {
  const query = req.originalUrl.slice(req.path.length);
  res.redirect(301, "/writing/new" + query);
});

// Form New Writing Page
app.get("/writing/new", (req, res) => {
  res.render("new-writing", {
    title: "New Note Page",
    layout: "layouts/main-layout",
    // The calendar links here with the day the note belongs to
    writing: { date: isDayKey(req.query.date) ? req.query.date : "" },
  });
});

// Post New Writing
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
        // ciphertext can't go back into the editor
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

// Encrypt Writing: the note comes back locked from the browser
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

// Decrypt Writing: the browser opened the note with its key and sends back
// its words, saved open from now on
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

// Wrong keys tried on an older locked note, per address and note: after 5
// in a minute it waits. (Notes locked in the browser are never checked here,
// the server doesn't get their key)
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

// Open an older locked note one last time: its words go back to the
// browser, which locks it again there (relock below)
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

// An older locked note, locked again in the browser with the same key
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

// Old unlock path: a locked note opens on its own page now, asking its key
// there
app.post("/diary/unlock", (req, res) => {
  if (!isNoteId(req.body._id)) return res.redirect("/writing");
  res.redirect(303, "/writing/" + req.body._id + "#open");
});

// Delete Writing
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

// Form Edit Writing Page
app.get("/writing/edit/:_id", async (req, res) => {
  const found = await findFor(Writing, req.params._id, req.user, "edit");
  if (!found) {
    req.flash("error", "This note can't be edited.");
    return res.redirect("/writing");
  }
  const writing = found.doc;

  // a locked note opens in the editor once its key is given on the page,
  // and is locked again there before it's saved
  res.render("edit-writing", {
    title: "Edit Note Page",
    layout: "layouts/main-layout",
    writing,
  });
});

// Post Edit Writing
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
      // a locked note's ciphertext can't go back into the editor: the page
      // asks its key again
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
      // a locked note is saved locked, an open one open
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

// Detail Writing Page
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

// Old edit path, kept so earlier links and bookmarks still land
app.get("/diary/edit/:_id", (req, res, next) => {
  if (!isNoteId(req.params._id)) return next();
  res.redirect(301, "/writing/edit/" + req.params._id);
});

// Old detail path, kept so earlier links and bookmarks still land
app.get("/diary/:_id", (req, res, next) => {
  if (!isNoteId(req.params._id)) return next();
  res.redirect(301, "/writing/" + req.params._id);
});

// Anything else: not a page here
app.use((req, res) => {
  res.status(404).send("Not found");
});

// An unexpected error is logged here, never shown with its stack
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).send("Something went wrong.");
});

// Only this computer can reach the app (HOST=0.0.0.0 opens it to the
// network)
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
