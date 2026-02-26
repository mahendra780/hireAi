const express = require("express");
const router = express.Router();
const interviewController = require("../controllers/interviewController");
const isLoggedIn = require("../middlewares/isLoggedIn");

router.post("/question", interviewController.getQuestion);
router.post("/evaluate", interviewController.evaluate);
router.post("/:id/delete", isLoggedIn, interviewController.deleteInterview);

module.exports = router;
