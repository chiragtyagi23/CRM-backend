const express = require("express");
const captureLeadsController = require("../controllers/captureLeads.controller");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", captureLeadsController.getAll);
router.get("/:id", captureLeadsController.getById);
// Users can view leads, but only admins can capture/update/delete leads.
router.post("/", authRequired, requireRole("admin"), captureLeadsController.create);
router.patch("/:id", authRequired, requireRole("admin"), captureLeadsController.patch);
router.delete("/:id", authRequired, requireRole("admin"), captureLeadsController.remove);

module.exports = { captureLeadsRouter: router };

