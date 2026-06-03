const { MulterError } = require("multer");
const {
  ConnectionError,
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} = require("sequelize");
const { AppError } = require("../lib/AppError");

function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.status).json({
      ok: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File too large (max 10MB)" });
      return;
    }
    res.status(400).json({ error: err.message || "Upload error" });
    return;
  }
  if (err && err.message === "Only image uploads are allowed") {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message || "Validation failed" });
    return;
  }
  if (err instanceof ForeignKeyConstraintError) {
    res.status(400).json({ error: "Invalid reference (related record not found)" });
    return;
  }
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: "Record already exists" });
    return;
  }
  if (err instanceof ConnectionError) {
    res.status(503).json({ error: "Database connection failed. Please try again." });
    return;
  }
  if (err instanceof DatabaseError) {
    const code = err?.parent?.code || err?.original?.code;
    if (code === "22P02") {
      res.status(400).json({ error: "Invalid id format" });
      return;
    }
  }

  const status = Number(err.status || err.statusCode || 500);
  res
    .status(status)
    .json({ error: status >= 500 ? "Internal server error" : err.message || "Error" });
}

module.exports = { errorHandler };

