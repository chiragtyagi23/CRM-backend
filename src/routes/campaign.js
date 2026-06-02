const express = require("express");
const campaignController = require("../controllers/campaign.controller");
const { authRequired, requireModuleAccess } = require("../middleware/auth");

const router = express.Router();

router.get("/", campaignController.getAll);
router.get("/:id", campaignController.getById);
router.post("/full", authRequired, requireModuleAccess("campaign.edit"), campaignController.createFull);
router.put("/:id/full", authRequired, requireModuleAccess("campaign.edit"), campaignController.updateFull);
router.patch("/:id/assignee", authRequired, requireModuleAccess("campaign.assignto"), campaignController.updateAssignee);
// router.post("/", campaignController.create);
// router.patch("/:id", campaignController.patch);
// router.delete("/:id", campaignController.remove);

// Template-1 section payloads
// router.put("/:id/hero", campaignController.putHero);
// router.put("/:id/overview", campaignController.putOverview);
// router.put("/:id/gallery", campaignController.putGallery);
// router.put("/:id/floorplans", campaignController.putFloorplans);
// router.put("/:id/amenities", campaignController.putAmenities);
// router.put("/:id/highlights", campaignController.putHighlights);
// router.put("/:id/benefits", campaignController.putBenefits);
// router.put("/:id/social-infrastructure", campaignController.putSocialInfrastructure);
// router.put("/:id/documents", campaignController.putDocuments);

module.exports = { campaignRouter: router };

