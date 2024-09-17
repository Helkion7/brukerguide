const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const Schema = mongoose.Schema;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("tiny"));

mongoose
  .connect("mongodb://127.0.0.1:27017/brukerGuide")
  .then(() => console.log("connected"))
  .catch((error) => console.log("error", error));

const userSchema = new Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  console.log("logger ut her", req.body);
  const { email, password } = req.body;
  res.status("200").json("OK");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  console.log("lagrer bruker", req.body);
  const { email, password, repeatPassword } = req.body;

  if (password === repeatPassword) {
    // Fixed syntax for the if statement
    const newUser = new User({ email: email, password: password });

    try {
      const result = await newUser.save();
      console.log(result);

      if (result._id) {
        res.redirect("/");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json("Error saving user");
    }
  } else {
    res.status(400).json("Passwords do not match"); // Replaced alert with server-side response
  }
});

app.get("/guides", (req, res) => {
  res.render("guides");
});

app.listen(process.env.PORT);
