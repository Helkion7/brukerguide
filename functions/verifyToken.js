const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Check if token exists in cookies

  if (!token) {
    return res.redirect("/login"); // Redirect if no token
  }

  // Verify the token and attach the decoded user info to req.user
  jwt.verify(token, process.env.secretKey, (error, decoded) => {
    if (error) {
      return res.status(403).json({ error: "Invalid token." });
    }

    // Log the decoded token for debugging
    console.log("Decoded Token:", decoded);

    req.user = decoded; // Attach user info to the request
    next(); // Proceed to the next middleware
  });
};
module.exports = verifyToken;
