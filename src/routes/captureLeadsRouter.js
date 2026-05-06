const express = require("express");
const captureLeadsController = require("../controllers/captureLeads.controller");

const router = express.Router();

router.get("/", captureLeadsController.getAll);
// Must be before GET /:id so "bulk" is not treated as an id.
router.post("/bulk", authRequired, requireRole("admin"), captureLeadsController.createBulk);
router.get("/:id", captureLeadsController.getById);
// Open access for capture leads CRUD.
router.post("/", captureLeadsController.create);
router.patch("/:id", captureLeadsController.patch);
router.delete("/:id", captureLeadsController.remove);

module.exports = { captureLeadsRouter: router };

