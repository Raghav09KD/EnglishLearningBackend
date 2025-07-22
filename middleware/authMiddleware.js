const jwt = require("jsonwebtoken");
const User = require('../models/User')
const Admin = require('../models/Admin')


exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id);

    if (!user) {
      user = await Admin.findById(decoded.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Explicitly assign default role if Admin schema doesn't include it
      user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: "admin", // <=== hardcode here if Admin has no 'role' field
      };
    } else {
      user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "student", // fallback if missing
      };
    }


    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

exports.verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let admin = await Admin.findById(decoded.id);
    // Optional: check if role is admin (if you store roles)
    if (!admin) return res.status(404).json({ error: "User not found" });

    req.user = decoded; // attach admin data to req
    req.user = {
      id: admin.id,
      email: admin.email,
      name: admin.name || "Admin",
      role: "admin", // enforce admin role here
    };
    next();
  } catch (err) {
    // console.error("Auth Error:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};