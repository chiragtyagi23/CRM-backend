const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

function isTiffByExt(file) {
  const ext = path.extname(String(file.originalname || "")).toLowerCase();
  return ext === ".tif" || ext === ".tiff";
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const base = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${base}`);
  },
});

const uploadImage = multer({
  storage,
  // 150 MB
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    // Some TIFF uploads come as application/octet-stream from browsers/tools,
    // so we allow by extension too.
    if (!file.mimetype.startsWith("image/") && !isTiffByExt(file)) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

const uploadVideo = multer({
  storage,
  // 500 MB
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("video/")) {
      cb(new Error("Only video uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

module.exports = { uploadImage, uploadVideo };
