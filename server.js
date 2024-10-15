const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
require("dotenv").config();

// Middleware Setup
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

// Set EJS as the view engine
app.set("view engine", "ejs");

// MongoDB connection setup
mongoose
  .connect("mongodb://127.0.0.1:27017/brukerGuide")
  .then(() => console.log(`Connected at port ${process.env.PORT}`))
  .catch((error) => console.error("Database connection error:", error));

// Define Mongoose Schemas
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const brukerSchema = new Schema({
  tittel: { type: String, required: true },
  tag: String,
  overskrift: [String],
  beskrivelse: [String],
  bilde: Array,
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Define Models
const User = mongoose.model("User", userSchema);
const Guide = mongoose.model("Guide", brukerSchema);

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const uploads = multer({ storage });

// JWT Token Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.secretKey, (error, decoded) => {
    if (error) {
      req.user = null;
      return next();
    }

    req.user = decoded;
    next();
  });
};

// Apply verifyToken middleware to all routes
app.use(verifyToken);

// Routes
app.get("/", async (req, res) => {
  try {
    const guides = await Guide.find({});
    res.render("index", { guides, user: req.user });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

app.get("/login", (req, res) => res.render("login", { user: req.user }));

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) return res.status(400).json({ error: "User not found" });

      bcrypt.compare(password, user.password).then((result) => {
        if (!result)
          return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.secretKey,
          { expiresIn: "100y" }
        );
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 100 * 365 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production",
        });
        // Send a JSON response with success flag
        res.status(200).json({ success: true, message: "Login successful" });
      });
    })
    .catch((error) => {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error: " + error.message });
    });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.get("/register", (req, res) => res.render("register", { user: req.user }));

app.post("/register", async (req, res) => {
  const { email, password, repeatPassword } = req.body;

  try {
    // Check if passwords match
    if (password !== repeatPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // If email is not in use, proceed with user creation
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(200).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Error during registration" });
  }
});
app.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userGuides = await Guide.find({ author: req.user.userId });
    res.render("dashboard", { user: req.user, guides: userGuides });
  } catch (error) {
    console.error("Error fetching user guides:", error);
    res.status(500).json({ error: "Error fetching user guides" });
  }
});

app.get("/guides", async (req, res) => {
  try {
    const guides = await Guide.find({});
    res.render("guides", { guides, selectedGuide: null, user: req.user });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

app.get("/guides/:id", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const selectedGuide = await Guide.findById(guideId).populate(
      "author",
      "email"
    );
    console.log(selectedGuide);

    if (!selectedGuide) {
      return res.status(404).render("404", { user: req.user });
    }

    const isAuthor =
      req.user && req.user.userId === selectedGuide.author._id.toString();

    console.log(
      "Logged in user ID:",
      req.user ? req.user.userId : "Not logged in"
    );
    console.log("Guide author ID:", selectedGuide.author._id.toString());

    const guides = await Guide.find({});
    res.render("guides", { guides, selectedGuide, isAuthor, user: req.user });
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({ error: "Error fetching guide" });
  }
});

app.get("/guides/:id/edit", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await Guide.findById(guideId);

    if (!guide || guide.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this guide." });
    }

    res.render("editGuide", { guide, user: req.user });
  } catch (error) {
    console.error("Error fetching guide for editing:", error);
    res.status(500).json({ error: "Error fetching guide" });
  }
});

app.put(
  "/guides/:id",
  verifyToken,
  uploads.array("bilde"),
  async (req, res) => {
    try {
      const guideId = req.params.id;
      const guide = await Guide.findById(guideId);

      if (!guide || guide.author.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "You are not authorized to edit this guide." });
      }

      const { title, tag, overskrift, beskrivelse } = req.body;

      guide.tittel = title;
      guide.tag = tag;
      guide.overskrift = Array.isArray(overskrift) ? overskrift : [overskrift];
      guide.beskrivelse = Array.isArray(beskrivelse)
        ? beskrivelse
        : [beskrivelse];

      guide.bilde = req.files;

      await guide.save();
      console.log("Guide updated:", guideId);
      res.redirect(`/guides/${guideId}`);
    } catch (error) {
      console.error("Error updating guide:", error);
      res.status(500).json({ error: "Error updating guide" });
    }
  }
);

app.delete("/guides/:id", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await Guide.findById(guideId);

    if (!guide || guide.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this guide." });
    }

    await Guide.findByIdAndDelete(guideId);
    console.log("Guide deleted:", guideId);

    res.redirect("/guides");
  } catch (error) {
    console.error("Error deleting guide:", error);
    res.status(500).json({ error: "Error deleting guide" });
  }
});

app.get("/createGuide", verifyToken, (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  res.render("createGuide", { user: req.user });
});

app.post(
  "/createGuide",
  verifyToken,
  uploads.array("bilde"),
  async (req, res) => {
    if (!req.user) {
      return res
        .status(403)
        .json({ error: "You must be logged in to create a guide." });
    }

    try {
      const { title, tag, overskrift, beskrivelse } = req.body;
      const bilde = req.files.map((file) => file.filename);
      console.log(req.files, "REQ.FILES");

      const overskriftArray = Array.isArray(overskrift)
        ? overskrift
        : [overskrift];
      const beskrivelseArray = Array.isArray(beskrivelse)
        ? beskrivelse
        : [beskrivelse];

      const newGuide = new Guide({
        tittel: title,
        tag,
        overskrift: overskriftArray,
        beskrivelse: beskrivelseArray,
        bilde: req.files,
        author: req.user.userId,
      });

      console.log("New Guide:", newGuide);

      await newGuide.save();
      res.redirect("/guides");
    } catch (error) {
      console.error("Error creating guide:", error);
      res.status(500).json({ error: "Error creating guide" });
    }
  }
);

// Handle 404 errors
app.get("/*", (req, res) => res.render("404", { user: req.user }));

// Start the server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
