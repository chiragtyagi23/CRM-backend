const express = require("express");
const captureLeadsController = require("../controllers/captureLeads.controller");
const { authRequired, requireModuleAccess, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, requireModuleAccess("leads"), captureLeadsController.getAll);
// Must be before GET /:id so "bulk" is not treated as an id.
router.post("/bulk", authRequired, requireRole("admin"), captureLeadsController.createBulk);
router.get("/:id", authRequired, requireModuleAccess("leads"), captureLeadsController.getById);
// Public for campaign enquiry forms.
router.post("/", captureLeadsController.create);
router.patch("/:id", authRequired, requireModuleAccess("leads"), captureLeadsController.patch);
router.delete("/:id", authRequired, requireModuleAccess("leads.delete"), captureLeadsController.remove);

module.exports = { captureLeadsRouter: router };

