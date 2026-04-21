const express = require("express");

const siteVisitsController = require("../controllers/siteVisits.controller");

const router = express.Router();

router.get("/", siteVisitsController.getAll);
router.get("/:id", siteVisitsController.getById);
router.post("/", siteVisitsController.create);
router.patch("/:id", siteVisitsController.patch);
router.delete("/:id", siteVisitsController.remove);

module.exports = { siteVisitsRouter: router };

