const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const isLoggedIn = require("../middlewares/isLoggedIn");

// 🌐 PUBLIC landing page
router.get("/", pageController.renderLanding);

// 🔐 PROTECTED pages
router.get("/setup", isLoggedIn, pageController.renderSetup);
router.get("/interview", isLoggedIn, pageController.renderInterview);
router.get("/summary/:id", isLoggedIn, pageController.renderSummary);

module.exports = router;
