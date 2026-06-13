const express = require("express");

const authController = require("../controllers/auth.controller");
const {
  authRequired,
  requireAnyModuleAccess,
  requireModuleAccess,
} = require("../middleware/auth");

const router = express.Router();

router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authRequired, authController.me);
router.get(
  "/assignees",
  authRequired,
  requireAnyModuleAccess("capture_lead", "leads.assignto", "campaign.assignto"),
  authController.listAssignees,
);
router.get(
  "/users",
  authRequired,
  requireModuleAccess("profile.allUserTable"),
  authController.listUsers,
);
router.get("/roles", authRequired, authController.listRoles);
router.post("/users", authRequired, authController.createUser);

module.exports = { authRouter: router };

