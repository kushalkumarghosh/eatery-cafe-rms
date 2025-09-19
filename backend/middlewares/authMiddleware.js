const User = require("../models/User");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).send({ msg: "User not found" });
      }

      // Check if the token matches the user's activeToken (for single-session)
      if (req.user.activeToken !== token) {
        return res
          .status(401)
          .send({ msg: "Session expired. Please log in again." });
      }

      next();
    } catch (err) {
      console.error(err);
      return res
        .status(401)
        .send({ msg: "Token is not valid, Not authorized" });
    }
  } else {
    return res.status(401).send({ msg: "No token, authorization denied" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).send({ msg: "Not authorized as admin" });
  }
};

module.exports = { protect, admin };   
