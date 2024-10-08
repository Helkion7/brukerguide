const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(cookieParser());

const Schema = mongoose.Schema;

// const uploads = multer({dest: "uploads/"})
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    console.log(file);
    const ext = path.extname(file.originalname);
    console.log("EXT", ext);
    // if(ext !== ".png" || ext !== ".jpg") {
    //     return cb(new Error("Only PNG FILES allowed, stay away Martin!"))
    // }
    const fileName = file.originalname;
    cb(null, fileName);
  },
});
const uploads = multer({
  storage: diskStorage,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("tiny"));

mongoose
  .connect("mongodb://127.0.0.1:27017/brukerGuide")
  .then(() => console.log("connected at port", process.env.PORT))
  .catch((error) => console.log("error", error));

const userSchema = new Schema({
  email: String,
  password: String,
});

// Define the brukerSchema
const brukerSchema = new Schema({
  tittel: String,
  tag: String,
  overskrift: Array,
  beskrivelse: Array,
  bilde: Array,
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookie

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, process.env.secretKey, (error, decoded) => {
    if (error) {
      return res.status(403).json({ error: "Invalid token." });
    }

    req.user = decoded; // Add decoded token info to the request
    next();
  });
};

// Create a model from the brukerSchema
const Guide = mongoose.model("Guide", brukerSchema);

const User = mongoose.model("User", userSchema);
const saltRounds = 10;

app.get("/", async (req, res) => {
  try {
    const guides = await Guide.find({});
    res.render("index", { guides });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      bcrypt.compare(password, user.password).then((result) => {
        if (result) {
          const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.secretKey,
            { expiresIn: "1h" } // Optional: token expiry
          );

          // Set the JWT as a cookie
          res.cookie("token", token, { httpOnly: true });

          // Redirect the user to the dashboard
          return res.redirect("/dashboard");
        } else {
          return res.status(400).json({ error: "Invalid credentials" });
        }
      });
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).json({ error: "Server error" });
    });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { email, password, repeatPassword } = req.body;

  if (password === repeatPassword) {
    bcrypt.hash(password, saltRounds, async function (error, hash) {
      try {
        const newUser = new User({ email: email, password: hash });
        const result = await newUser.save();
        console.log(result);

        if (result._id) {
          res.redirect("/login");
        }
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Error saving user" });
      }
    });
  } else {
    res.status(400).json({ error: "Passwords do not match" });
  }
});

app.get("/dashboard", verifyToken, (req, res) => {
  res.render("dashboard", { user: req.user });
});

app.get("/guides", async (req, res) => {
  try {
    const guides = await Guide.find({});

    res.render("guides", { guides });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

app.get("/createGuide", verifyToken, (req, res) => {
  res.render("createGuide", { user: req.user });
});

app.post("/createGuide", uploads.array("bilde"), async (req, res) => {
  try {
    const { title, tag, overskrift, beskrivelse } = req.body;
    const bilde = req.files.map((file) => file.filename); // Store only the filenames

    const newGuide = new Guide({
      tittel: title,
      tag: tag,
      overskrift: overskrift ? [overskrift] : [],
      beskrivelse: beskrivelse ? [beskrivelse] : [],
      bilde: bilde,
    });

    const result = await newGuide.save();
    console.log("Guide saved:", result);
    res.redirect("/guides");
  } catch (error) {
    console.error("Error creating guide:", error);
    res.status(500).json({ error: "Error creating guide" });
  }
});

app.get("/*", (req, res) => {
  res.render("404");
});

app.listen(process.env.PORT);
