const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");

router.post("/question", interviewController.getQuestion);
router.post("/evaluate", interviewController.evaluate);

module.exports = router;
