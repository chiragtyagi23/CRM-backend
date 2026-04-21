const express = require("express");

const authController = require("../controllers/auth.controller");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/users", authRequired, requireRole("admin"), authController.listUsers);

module.exports = { authRouter: router };

