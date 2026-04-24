const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { uploadImage, uploadVideo } = require("../services/multer");
const { maybeUploadToS3AndGetUrl } = require("../services/s3Media");

const router = express.Router();

function isTiffFile(file) {
  if (!file) return false;
  const ext = path.extname(String(file.originalname || "")).toLowerCase();
  if (ext === ".tif" || ext === ".tiff") return true;
  const mt = String(file.mimetype || "").toLowerCase();
  return mt === "image/tiff" || mt === "image/x-tiff";
}

function isDraftUpload(req) {
  return String(req.query?.draft ?? "") === "1";
}

router.post("/upload", (req, res, next) => {
  const draft = isDraftUpload(req);
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    (async () => {
      // Convert TIFF/TIF to JPEG on upload so browsers can render it.
      if (isTiffFile(req.file)) {
        const uploadsDir = path.join(__dirname, "..", "..", "uploads");
        const base = path.basename(req.file.filename, path.extname(req.file.filename)).replace(/[^a-zA-Z0-9._-]/g, "_");
        const outName = `${base}.jpg`;
        const outPath = path.join(uploadsDir, outName);

        await sharp(req.file.path, { failOn: "none" })
          .rotate()
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(outPath);

        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }

        const uploaded = await maybeUploadToS3AndGetUrl({
          localPath: outPath,
          filename: outName,
          contentType: "image/jpeg",
          skipS3: draft,
        });
        res.status(201).json({
          message: "File uploaded successfully",
          url: uploaded.url,
          file: {
            filename: uploaded.filename,
            mimetype: uploaded.mimetype,
            size: uploaded.size,
          },
        });
        return;
      }

      const uploaded = await maybeUploadToS3AndGetUrl({
        localPath: req.file.path,
        filename: req.file.filename,
        contentType: req.file.mimetype,
        size: req.file.size,
        skipS3: draft,
      });
      res.status(201).json({
        message: "File uploaded successfully",
        url: uploaded.url,
        file: {
          filename: uploaded.filename,
          mimetype: uploaded.mimetype,
          size: uploaded.size,
        },
      });
    })().catch(next);
  });
});

router.post("/upload/video", (req, res, next) => {
  const draft = isDraftUpload(req);
  uploadVideo.single("video")(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    (async () => {
      const uploaded = await maybeUploadToS3AndGetUrl({
        localPath: req.file.path,
        filename: req.file.filename,
        contentType: req.file.mimetype,
        size: req.file.size,
        skipS3: draft,
      });
      res.status(201).json({
        message: "File uploaded successfully",
        url: uploaded.url,
        file: {
          filename: uploaded.filename,
          mimetype: uploaded.mimetype,
          size: uploaded.size,
        },
      });
    })().catch(next);
  });
});

module.exports = { uploadRouter: router };
