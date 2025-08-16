const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/mp3 folder exists
const uploadDir = path.join(__dirname, "../uploads/mp3");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // absolute path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // e.g., 1234567890.mp3
  }
});

// File filter to allow only MP3 files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["audio/mpeg", "audio/mp3"];
  const extname = path.extname(file.originalname).toLowerCase() === ".mp3";
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only MP3 files are allowed!"));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});