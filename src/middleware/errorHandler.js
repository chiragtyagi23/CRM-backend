const { MulterError } = require("multer");
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

  const status = Number(err.status || err.statusCode || 500);
  res
    .status(status)
    .json({ error: status >= 500 ? "Internal server error" : err.message || "Error" });
}

module.exports = { errorHandler };

