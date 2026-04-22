const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const { env } = require("./config/env");
const { apiRouter } = require("./routes");
const { openapi } = require("./swagger/openapi");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}

const isDev = env.nodeEnv !== "production";
const corsAllowList = String(env.corsOrigin)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    // Dev: reflect request Origin so http://localhost:* and http://127.0.0.1:* both work (file uploads use preflight).
    ...(isDev
      ? { origin: true, credentials: true }
      : {
          origin: corsAllowList.length <= 1 ? corsAllowList[0] : corsAllowList,
          credentials: true,
        }),
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/openapi.json", (_req, res) => {
  res.json(openapi);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "CRM Backend API",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };

