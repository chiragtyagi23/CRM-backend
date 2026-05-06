const express = require("express");

const authController = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/users", authRequired, authController.listUsers);

module.exports = { authRouter: router };

