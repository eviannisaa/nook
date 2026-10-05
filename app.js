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
const dayIsFull = async (day) =>
  (await DayMark.countDocuments({ day })) >= MAX_MARKS_PER_DAY;

const app = express();
const port = 3000;

// Setup Method Override
app.use(methodOverride("_method"));

// Setup EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
// Notes carry their images inline, so the form body can be a few MB
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
// an older locked note, locked again in the browser, comes back as JSON
app.use(express.json({ limit: "15mb" }));

// Flash Configuration. The secret signs the session cookie: from
// SESSION_SECRET (e.g. `node --env-file=.env app.js`), or a new random one
// each start, which only drops a flash message still waiting
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
app.use(cookieParser(SESSION_SECRET));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use((req, res, next) => {
  const message = req.flash("msg");
  res.locals.msg = message.length > 0 ? message[0] : null;
  // Feeds the same red toast the validation errors use
  res.locals.errors = req.flash("error").map((msg) => ({ msg }));
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

// Keeps the "go back where you came from" field from turning into an open redirect
const safeRedirect = (target, fallback) =>
  typeof target === "string" &&
  target.startsWith("/") &&
  !target.startsWith("//")
    ? target
    : fallback;

// Setup Multer for upload file
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

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
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  // a search has no pages, so drop a leftover page/all from its URL
  if (search && (req.query.page || req.query.all)) {
    return res.redirect("/contacts?search=" + encodeURIComponent(search));
  }

  // a search has no pages: every match is shown at once
  const viewAll = req.query.all === "1" || !!search;

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const totalContacts = await Contact.countDocuments(query);
  const totalPages = Math.ceil(totalContacts / limit);

  // alphabetical (case-insensitive) so the list can be grouped A, B, C...
  const contactsQuery = Contact.find(query)
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
  upload.single("image"),
  [
    body("name").custom(async (value) => {
      const duplicate = await Contact.findOne({ name: value });
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
      res.render("new-contact", {
        title: "New Contact Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        // keep what was typed so the form comes back filled in
        contact: req.body,
      });
    } else {
      await Contact.insertMany({
        ...req.body,
        image: req.file ? "/uploads/" + req.file.filename : req.body.image,
      });
      req.flash("msg", `${req.body.name} added successfully`);
      res.redirect("/contacts");
    }
  }
);

// Delete Detail Contact
app.delete("/contact", async (req, res) => {
  const stores = await Contact.findById(req.body._id);
  if (stores?.image) fs.unlink("public" + stores.image, () => {});

  await Contact.deleteOne({ _id: req.body._id });
  req.flash("msg", `${req.body.name} deleted successfully`);
  res.redirect("/contacts");
});

// Form Edit Contact Page
app.get("/contact/edit/:_id", async (req, res) => {
  const contact = await Contact.findById(req.params._id);

  res.render("edit-contact", {
    title: "Edit Contact Page",
    layout: "layouts/main-layout",
    contact,
  });
});

// Post Edit Contact
app.put(
  "/contact",
  upload.single("image"),
  [
    body("name").custom(async (value, { req }) => {
      const duplicate = await Contact.findOne({ name: value });
      if (value !== req.body.oldName && duplicate) {
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
      return res.render("edit-contact", {
        title: "Edit Contact Page",
        layout: "layouts/main-layout",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      if (req.file && req.body.image) {
        fs.unlink("public" + req.body.image, () => {});
      }

      await Contact.updateOne(
        { _id: req.body._id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            company: req.body.company,
            notes: req.body.notes,
            image: req.file ? "/uploads/" + req.file.filename : req.body.image,
          },
        }
      );
      req.flash("msg", `${req.body.name} updated successfully`);
      res.redirect("/contact/" + req.body._id);
    }
  }
);

// Detail Contact Page
app.get("/contact/:_id", async (req, res) => {
  const contact = await Contact.findById(req.params._id);
  res.render("detail", {
    title: "Detail Contact Page",
    layout: "layouts/main-layout",
    contact,
  });
});

// Old diary list path, kept so earlier links and bookmarks still land
app.get("/diaries", (req, res) => {
  const query = req.originalUrl.slice(req.path.length);
  res.redirect(301, "/writing" + query);
});

// Lists only need a preview: the words of an open note, the start of an
// encrypted one's ciphertext; the full content (with its images) stays out
const PREVIEW_FIELDS = {
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
  const search = req.query.search || "";

  if (search) {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // An encrypted content field only holds ciphertext, so it is not searchable
    const query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { mood: { $regex: search, $options: "i" } },
        {
          isEncrypted: false,
          text: { $regex: search, $options: "i" },
        },
      ],
    };

    const totalWritings = await Writing.countDocuments(query);

    const writings = await Writing.find(query, PREVIEW_FIELDS)
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
    { date: { $gte: monthStart, $lt: monthEnd } },
    PREVIEW_FIELDS
  ).sort({
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

  const markers = (await Marker.find().sort({ createdAt: 1, _id: 1 }).lean()).map(
    (marker) => ({
      ...marker,
      id: String(marker._id),
      hex: MARK_COLORS[marker.color] || MARK_COLORS.green,
    })
  );

  const monthMarks = await DayMark.find({
    day: { $gte: `${month}-01`, $lt: `${shiftMonth(month, 1)}-01` },
  }).lean();
  const marksByDay = new Map();
  const markCounts = {};
  monthMarks.forEach((mark) => {
    const id = String(mark.marker);
    if (!marksByDay.has(mark.day)) marksByDay.set(mark.day, new Set());
    marksByDay.get(mark.day).add(id);
    markCounts[id] = (markCounts[id] || 0) + 1;
  });

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
    totalNotes: await Writing.countDocuments(),
  });
});

// Put a mark on a day, or take it off again
app.post("/marks", async (req, res) => {
  const day = req.body.date;
  const marker = await Marker.findById(req.body.marker).catch(() => null);
  if (!isDayKey(day) || !marker) {
    req.flash("error", "That mark could not be saved!");
    return res.redirect("/writing");
  }

  const back = "/writing?month=" + day.slice(0, 7);
  const removed = await DayMark.findOneAndDelete({ day, marker: marker._id });
  if (!removed) {
    if (await dayIsFull(day)) {
      req.flash("error", `A day can hold up to ${MAX_MARKS_PER_DAY} marks!`);
      return res.redirect(back);
    }
    await DayMark.create({ day, marker: marker._id });
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
  if (day && (await dayIsFull(day))) {
    const onDay = await DayMark.find({ day }).populate("marker", "name").lean();
    if (!onDay.some((m) => m.marker?.name.toLowerCase() === name.toLowerCase())) {
      req.flash("error", `A day can hold up to ${MAX_MARKS_PER_DAY} marks!`);
      return res.redirect(back);
    }
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // a name made before is put on the day as it is, not made a second time
  const marker =
    (await Marker.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } })) ||
    (await Marker.create({
      name,
      icon: MARK_ICONS.includes(req.body.icon) ? req.body.icon : "dot",
      color: MARK_COLORS[req.body.color] ? req.body.color : "green",
    }));
  if (day) {
    await DayMark.updateOne(
      { day, marker: marker._id },
      { $setOnInsert: { day, marker: marker._id } },
      { upsert: true }
    );
  }
  req.flash("msg", `${marker.name} added${day ? " on " + app.locals.formatShortDay(day) : ""}`);
  res.redirect(back);
});

// Delete a kind of mark for good, along with every day it was put on
app.delete("/markers/:_id", async (req, res) => {
  const back = safeRedirect(req.body?.redirect, "/writing");
  const marker = await Marker.findById(req.params._id).catch(() => null);
  if (!marker) {
    req.flash("error", "This mark cannot be deleted!");
    return res.redirect(back);
  }

  await DayMark.deleteMany({ marker: marker._id });
  await Marker.deleteOne({ _id: marker._id });
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
        title: req.body.title,
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
  const writing = await Writing.findById(req.body._id);

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
  const writing = await Writing.findById(req.body._id);

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
  if (!isNoteId(req.params._id)) return res.status(404).json({ error: "Note not found." });
  const writing = await Writing.findById(req.params._id);
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
  if (!isNoteId(req.params._id)) return res.status(404).json({ error: "Note not found." });
  const writing = await Writing.findById(req.params._id);
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
  await Writing.deleteOne({ _id: req.body._id });
  req.flash("msg", `${req.body.title} deleted successfully`);
  res.redirect("/writing");
});

// Form Edit Writing Page
app.get("/writing/edit/:_id", async (req, res) => {
  const writing = await Writing.findById(req.params._id);

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
      const writing = await Writing.findById(req.body._id);
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
        { _id: req.body._id },
        {
          $set: {
            title: req.body.title,
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
  const writing = await Writing.findById(req.params._id);
  res.render("detail-writing", {
    title: "Detail Note Page",
    layout: "layouts/main-layout",
    writing,
  });
});

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

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
