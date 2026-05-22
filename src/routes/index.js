const express = require("express");
const { campaignRouter } = require("./campaign");
const { uploadRouter } = require("./upload");
const { captureLeadsRouter } = require("./captureLeadsRouter");
const { siteVisitsRouter } = require("./siteVisitsRouter");
const { authRouter } = require("./authRouter");
const { webhook99acresRouter } = require("./webhook99acres");

const router = express.Router();

router.use(uploadRouter);
router.use("/auth", authRouter);
router.use("/campaigns", campaignRouter);
router.use("/capture-leads", captureLeadsRouter);
router.use("/site-visits", siteVisitsRouter);
router.use("/webhook", webhook99acresRouter);


module.exports = { apiRouter: router };

