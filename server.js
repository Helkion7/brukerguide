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

const verifyToken = require("./functions/verifyToken.js");

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
  bilde: [String],
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

// Routes
app.get("/", async (req, res) => {
  try {
    const guides = await Guide.find({});
    res.render("index", { guides });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

app.get("/login", (req, res) => res.render("login"));

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
          { expiresIn: "100y" } // Set to expire in 100 years
        );
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 years in milliseconds
          secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        });
        res.redirect("/dashboard");
      });
    })
    .catch((error) => res.status(500).json({ error: "Server error" }));
});
app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
  const { email, password, repeatPassword } = req.body;

  if (password !== repeatPassword)
    return res.status(400).json({ error: "Passwords do not match" });

  bcrypt.hash(password, 10, async (error, hash) => {
    if (error) return res.status(500).json({ error: "Error hashing password" });

    const newUser = new User({ email, password: hash });
    try {
      await newUser.save();
      console.log(newUser);
      res.redirect("/login");
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ error: "Error saving user" });
    }
  });
});

app.get("/dashboard", verifyToken, async (req, res) => {
  try {
    // Fetch guides created by the logged-in user
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
    res.render("guides", { guides, selectedGuide: null });
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

    if (!selectedGuide) {
      return res.status(404).render("404");
    }

    // Check if the logged-in user is the author of the guide
    const isAuthor =
      req.user && req.user.userId === selectedGuide.author._id.toString();

    // Log the current user and guide author to debug
    console.log("Logged in user ID:", req.user.userId);
    console.log("Guide author ID:", selectedGuide.author._id.toString());

    const guides = await Guide.find({});
    res.render("guides", { guides, selectedGuide, isAuthor });
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({ error: "Error fetching guide" });
  }
});

// Edit guide route - display the form to edit the guide
app.get("/guides/:id/edit", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await Guide.findById(guideId);

    // Ensure that only the author can edit the guide
    if (!guide || guide.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to edit this guide." });
    }

    res.render("editGuide", { guide });
  } catch (error) {
    console.error("Error fetching guide for editing:", error);
    res.status(500).json({ error: "Error fetching guide" });
  }
});

// Update guide route - process the form submission and update the guide
app.put(
  "/guides/:id",
  verifyToken,
  uploads.array("bilde"),
  async (req, res) => {
    try {
      const guideId = req.params.id;
      const guide = await Guide.findById(guideId);

      // Ensure that only the author can update the guide
      if (!guide || guide.author.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "You are not authorized to edit this guide." });
      }

      const { title, tag, overskrift, beskrivelse } = req.body;
      const bilde = req.files.map((file) => file.filename);

      // Update the guide's fields
      guide.tittel = title;
      guide.tag = tag;
      guide.overskrift = Array.isArray(overskrift) ? overskrift : [overskrift];
      guide.beskrivelse = Array.isArray(beskrivelse)
        ? beskrivelse
        : [beskrivelse];
      if (bilde.length > 0) guide.bilde = bilde;

      // Save the updated guide
      await guide.save();
      console.log("Guide updated:", guideId);

      res.redirect(`/guides/${guideId}`);
    } catch (error) {
      console.error("Error updating guide:", error);
      res.status(500).json({ error: "Error updating guide" });
    }
  }
);

// Delete guide route
app.delete("/guides/:id", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await Guide.findById(guideId);

    // Check if the guide exists and if the user is the author
    beskrivelse: sanitizedBeskrivelse, res.redirect("/guides");
  } catch (error) {
    console.error("Error deleting guide:", error);
    res.status(500).json({ error: "Error deleting guide" });
  }
});

app.get("/createGuide", verifyToken, (req, res) =>
  res.render("createGuide", { user: req.user })
);

app.post(
  "/createGuide",
  verifyToken,
  uploads.array("bilde"),
  async (req, res) => {
    try {
      const { title, tag, overskrift, beskrivelse } = req.body;
      const bilde = req.files.map((file) => file.filename);

      // Sanitize and prepare the input data
      const sanitizedOverskrift = Array.isArray(overskrift)
        ? overskrift.filter(Boolean)
        : overskrift
        ? [overskrift]
        : [];

      const sanitizedBeskrivelse = Array.isArray(beskrivelse)
        ? beskrivelse.filter(Boolean)
        : beskrivelse
        ? [beskrivelse]
        : [];

      const newGuide = new Guide({
        tittel: title,
        tag,
        overskrift: sanitizedOverskrift,
        beskrivelse: sanitizedBeskrivelse,
        bilde,
        author: req.user.userId,
      });

      await newGuide.save();
      res.redirect("/guides");
    } catch (error) {
      console.error("Error creating guide:", error);
      res.status(500).json({ error: "Error creating guide" });
    }
  }
);

// Handle 404 errors
app.get("/*", (req, res) => res.render("404"));

// Start the server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
