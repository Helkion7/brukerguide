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

app.get("/guides", (req, res) => {
  res.render("login");
});

app.listen(process.env.PORT);
