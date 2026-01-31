const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    role: String,
    level: String,
    question: String,
    answer: String,
    feedback: String,
    score: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
