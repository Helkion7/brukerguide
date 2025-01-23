// Import required modules
const express = require("express"); // Express framework for building the application
const app = express(); // Initialize the Express app
const morgan = require("morgan"); // Middleware for logging HTTP requests
const mongoose = require("mongoose"); // MongoDB object modeling tool
const bcrypt = require("bcrypt"); // Library for hashing passwords
const multer = require("multer"); // Middleware for handling file uploads
const path = require("path"); // Node.js utility module for handling file paths
const jwt = require("jsonwebtoken"); // Library for creating and verifying JSON Web Tokens
const cookieParser = require("cookie-parser"); // Middleware for parsing cookies
const methodOverride = require("method-override"); // Middleware for supporting HTTP verbs such as PUT and DELETE
require("dotenv").config(); // Load environment variables from a .env file

// Middleware Setup
app.use(cookieParser()); // Parse cookies for access in the request object
app.use(methodOverride("_method")); // Allow overriding HTTP methods using query parameters
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(morgan("tiny")); // Log HTTP requests in a concise format

// Set EJS as the view engine for rendering templates
app.set("view engine", "ejs");

// MongoDB connection setup
mongoose
  .connect(process.env.MONGODB_URI) // Use environment variable instead of hardcoded URL
  .then(() => console.log(`Connected to MongoDB Atlas`))
  .catch((error) => console.error("Database connection error:", error));

// Define Mongoose Schemas for database structure
const Schema = mongoose.Schema;

// Schema for user data, including email and hashed password
const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

// Schema for guides created by users, including title, tags, subtitles, descriptions, images, and author reference
const brukerSchema = new Schema({
  tittel: { type: String, required: true }, // Title of the guide
  tag: String, // Tag for categorizing the guide
  overskrift: [String], // Array of subtitles
  beskrivelse: [String], // Array of descriptions corresponding to subtitles
  bilde: Array, // Array of uploaded image filenames
  author: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user who created the guide
});

// Define Mongoose Models based on schemas
const User = mongoose.model("User", userSchema); // Model for users
const Guide = mongoose.model("Guide", brukerSchema); // Model for guides

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"), // Save files in the "public/uploads" folder
  filename: (req, file, cb) => {
    // Generate sanitized filenames to avoid conflicts and ensure security
    const sanitizedName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    cb(null, Date.now() + "-" + sanitizedName); // Prepend a timestamp to ensure uniqueness
  },
});
const uploads = multer({ storage }); // Configure multer to use the defined storage options

// Middleware to verify JWT tokens for authentication
const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Get the token from cookies

  if (!token) {
    req.user = null; // If no token, set user as null
    return next(); // Proceed without a user
  }

  jwt.verify(token, process.env.secretKey, (error, decoded) => {
    if (error) {
      req.user = null; // If token is invalid, set user as null
      return next();
    }

    req.user = decoded; // Set the decoded user data in the request object
    next(); // Proceed to the next middleware or route
  });
};

// Apply verifyToken middleware globally
app.use(verifyToken);

// Routes
// Home route: Fetch and display all guides
app.get("/", async (req, res) => {
  try {
    const guides = await Guide.find({}); // Fetch all guides from the database
    res.render("index", { guides, user: req.user }); // Render the homepage with guides and user data
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

// Login page route: Render the login page
app.get("/login", (req, res) => res.render("login", { user: req.user }));

// Login POST route: Handle user login
app.post("/login", (req, res) => {
  const { email, password } = req.body; // Extract email and password from the request body

  User.findOne({ email }) // Check if the user exists in the database
    .then((user) => {
      if (!user) return res.status(400).json({ error: "User not found" }); // Return error if user doesn't exist

      // Compare entered password with the stored hashed password
      bcrypt.compare(password, user.password).then((result) => {
        if (!result)
          return res.status(400).json({ error: "Invalid credentials" }); // Return error for incorrect password

        // Generate JWT token for the user
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.secretKey,
          { expiresIn: "100y" }
        );

        // Set the token as a secure HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 100 * 365 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === "production", // Secure in production
        });

        res.status(200).json({ success: true, message: "Login successful" }); // Send success response
      });
    })
    .catch((error) => {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error: " + error.message }); // Handle server errors
    });
});

// Logout route: Clear the token cookie and redirect to the homepage
app.post("/logout", (req, res) => {
  res.clearCookie("token"); // Remove the token cookie
  res.redirect("/"); // Redirect to the homepage
});

// Registration page route: Render the registration page
app.get("/register", (req, res) => res.render("register", { user: req.user }));

// Registration POST route: Handle new user registration
app.post("/register", async (req, res) => {
  const { email, password, repeatPassword } = req.body; // Extract form data

  try {
    if (password !== repeatPassword) {
      return res.status(400).json({ error: "Passwords do not match" }); // Ensure passwords match
    }

    const existingUser = await User.findOne({ email }); // Check if email is already registered
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" }); // Return error if email exists
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newUser = new User({ email, password: hashedPassword }); // Create a new user instance
    await newUser.save(); // Save the user to the database
    res.status(200).json({ message: "Registration successful" }); // Send success response
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Error during registration" }); // Handle server errors
  }
});

// Dashboard route: Display user-specific guides
app.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userGuides = await Guide.find({ author: req.user.userId }); // Fetch guides created by the logged-in user
    res.render("dashboard", { user: req.user, guides: userGuides }); // Render dashboard view
  } catch (error) {
    console.error("Error fetching user guides:", error);
    res.status(500).json({ error: "Error fetching user guides" });
  }
});

// Guides list route: Display all guides
app.get("/guides", async (req, res) => {
  try {
    const guides = await Guide.find({}); // Fetch all guides
    res.render("guides", { guides, selectedGuide: null, user: req.user }); // Render guides list
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).json({ error: "Error fetching guides" });
  }
});

// Guide detail route: View a single guide by ID
app.get("/guides/:id", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id; // Extract guide ID from URL
    const selectedGuide = await Guide.findById(guideId).populate(
      "author",
      "email"
    ); // Find the guide and populate author details

    if (!selectedGuide) {
      return res.status(404).render("404", { user: req.user }); // Render 404 if guide not found
    }

    const isAuthor =
      req.user && req.user.userId === selectedGuide.author._id.toString(); // Check if logged-in user is the author
    const guides = await Guide.find({}); // Fetch all guides for sidebar or related list
    res.render("guides", { guides, selectedGuide, isAuthor, user: req.user }); // Render guide view
  } catch (error) {
    console.error("Error fetching guide:", error);
    res.status(500).json({ error: "Error fetching guide" });
  }
});

// Edit guide route: Render edit form for a specific guide
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

// Update guide route: Handle guide updates
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

      guide.tittel = title; // Update title
      guide.tag = tag; // Update tag
      guide.overskrift = Array.isArray(overskrift) ? overskrift : [overskrift]; // Update subtitles
      guide.beskrivelse = Array.isArray(beskrivelse)
        ? beskrivelse
        : [beskrivelse]; // Update descriptions
      guide.bilde = req.files; // Update uploaded images

      await guide.save(); // Save changes to the database
      res.redirect(`/guides/${guideId}`); // Redirect to the updated guide's page
    } catch (error) {
      console.error("Error updating guide:", error);
      res.status(500).json({ error: "Error updating guide" });
    }
  }
);

// Delete guide route: Remove a guide by ID
app.delete("/guides/:id", verifyToken, async (req, res) => {
  try {
    const guideId = req.params.id;
    const guide = await Guide.findById(guideId);

    if (!guide || guide.author.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this guide." });
    }

    await Guide.findByIdAndDelete(guideId); // Delete the guide from the database
    res.redirect("/guides"); // Redirect to the guides list
  } catch (error) {
    console.error("Error deleting guide:", error);
    res.status(500).json({ error: "Error deleting guide" });
  }
});

// Create guide route: Render the guide creation form
app.get("/createGuide", verifyToken, (req, res) => {
  if (!req.user) {
    return res.redirect("/login"); // Redirect to login if not authenticated
  }
  res.render("createGuide", { user: req.user }); // Render creation form
});

// Create guide POST route: Handle guide creation
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
      const bilde = req.files.map((file) => file.filename); // Get uploaded file names

      const newGuide = new Guide({
        tittel: title,
        tag,
        overskrift: Array.isArray(overskrift) ? overskrift : [overskrift],
        beskrivelse: Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse],
        bilde: req.files,
        author: req.user.userId,
      });

      await newGuide.save(); // Save the new guide to the database
      res.redirect("/guides"); // Redirect to the guides list
    } catch (error) {
      console.error("Error creating guide:", error);
      res.status(500).json({ error: "Error creating guide" });
    }
  }
);

// 404 Error handling route: Render custom 404 page for unmatched routes
app.get("/*", (req, res) => res.render("404", { user: req.user }));

// Start the server
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
