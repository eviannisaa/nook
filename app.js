const fs = require("fs");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const Contact = require("./model/contact");

const app = express();
const port = 3000;

// Setup Method Override
app.use(methodOverride("_method"));

// Setup EJS
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Flash Configuration
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use((req, res, next) => {
  const message = req.flash("msg");
  res.locals.msg = message.length > 0 ? message[0] : null;
  next();
});
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

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
  res.redirect("/contacts");
});

// Contact Page
app.get("/contacts", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

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

  const totalContacts = await Contact.countDocuments();
  const totalPages = Math.ceil(totalContacts / limit);

  const contacts = await Contact.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.render("contacts", {
    title: "Contact Page",
    layout: "layouts/main-layout",
    students: contacts,
    currentPage: page,
    totalPages,
    totalContacts,
    limit,
    search,
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

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
