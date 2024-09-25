const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const Schema = mongoose.Schema;

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  fileName: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    console.log("EXT", ext);

    const fileName = file.originalname + ".png";

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

const brukerSchema = new Schema({
  tittel: String,
  tag: String,
  overskrift: Array,
  beskrivelse: Array,
  bilde: Array,
});

const User = mongoose.model("User", userSchema);
const saltRounds = 10;

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  console.log("logger ut her", req.body);
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      bcrypt.compare(password, user.password).then((result) => {
        if (result) {
          return res.status(200).redirect("/dashboard");
        } else {
          return res.status(400).json({ error: "Invalid info" });
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
  console.log("lagrer bruker", req.body);
  const { email, password, repeatPassword } = req.body;

  if (password === repeatPassword) {
    bcrypt.hash(password, saltRounds, async function (error, hash) {
      try {
        const newUser = new User({ email: email, password: hash });
        const result = await newUser.save();
        console.log(result);
        console.log(newUser);

        if (result._id) {
          res.redirect("/login");
        }
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json("Error saving user");
      }
    });
  } else {
    res.status(400).json("Passwords do not match");
  }
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/guides", (req, res) => {
  res.render("guides");
});

app.get("/createGuide", (req, res) => {
  res.render("createGuide");
});

app.get("/*", (req, res) => {
  res.render("404");
});

app.listen(process.env.PORT);
