const express = require("express");
const captureLeadsController = require("../controllers/captureLeads.controller");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", captureLeadsController.getAll);
// Must be before GET /:id so "bulk" is not treated as an id.
router.post("/bulk", authRequired, requireRole("admin"), captureLeadsController.createBulk);
router.get("/:id", captureLeadsController.getById);
// Users can view leads, but only admins can capture/update/delete leads.
router.post("/", authRequired, requireRole("admin"), captureLeadsController.create);
router.patch("/:id", authRequired, requireRole("admin"), captureLeadsController.patch);
router.delete("/:id", authRequired, requireRole("admin"), captureLeadsController.remove);

module.exports = { captureLeadsRouter: router };

