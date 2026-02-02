const mongoose = require("mongoose");

const qaSchema = new mongoose.Schema({
  question: String,
  answer: String,
  feedback: String,
  score: Number
});

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: String,
  level: String,
  questions: [qaSchema],
  averageScore: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Interview", interviewSchema);
