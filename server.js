const express = require("express");
const app = express();
const morgan = require("morgan");
require("dotenv").config();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("tiny"));

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

app.get("/guides", (req, res) => {
  res.render("guides");
});

app.listen(process.env.PORT);
