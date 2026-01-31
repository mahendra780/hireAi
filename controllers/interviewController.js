const Interview = require("../models/Interview");
const { generateQuestion, evaluateAnswer } = require("../services/aiService");

module.exports.getQuestion = async (req, res) => {
  const { role, level } = req.body;
  const question = await generateQuestion(role, level);
  res.json({ question });
};

module.exports.evaluate = async (req, res) => {
  const { role, level, question, answer } = req.body;

  const feedback = await evaluateAnswer(question, answer);

  // ✅ SAFE SCORE EXTRACTION
  const scoreMatch = feedback.match(/Score[^0-9]*([0-9]{1,2})/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : 0;

  const interview = await Interview.create({
    role,
    level,
    question,
    answer,
    feedback,
    score
  });

  res.json({ redirectUrl: `/summary/${interview._id}` });
};
