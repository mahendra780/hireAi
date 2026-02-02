const { TOTAL_QUESTIONS } = require("../config/interview");

const Interview = require("../models/Interview");
const { generateQuestion, evaluateAnswer } = require("../services/aiService");

module.exports.getQuestion = async (req, res) => {
  const { role, level } = req.body;

  // Start session if not exists
  if (!req.session.interview) {
    req.session.interview = {
      role,
      level,
      index: 0,
      questions: []
    };
  }

  const question = await generateQuestion(role, level);
  res.json({ question, index: req.session.interview.index + 1, total: TOTAL_QUESTIONS });
};


module.exports.evaluate = async (req, res) => {
  const { question, answer } = req.body;
  const session = req.session.interview;

  if (!session) {
    return res.status(400).json({ error: "Interview session not found" });
  }

  // Validation: short/empty answer
  if (!answer || answer.trim().length < 10) {
    session.questions.push({
      question,
      answer,
      feedback: "Answer is too short or empty. Please provide a meaningful answer.",
      score: 0
    });
  } else {
    const feedback = await evaluateAnswer(question, answer);

    const scoreMatch = feedback.match(/Score[^0-9]*([0-9]{1,2})/i);
    const score = scoreMatch ? Number(scoreMatch[1]) : 0;

    session.questions.push({
      question,
      answer,
      feedback,
      score
    });
  }

  session.index += 1;

  // If more questions remain → send next question
  if (session.index < TOTAL_QUESTIONS) {
    const nextQuestion = await generateQuestion(session.role, session.level);
    return res.json({
      next: true,
      question: nextQuestion,
      index: session.index + 1,
      total: TOTAL_QUESTIONS
    });
  }

  // Finish interview → calculate average
  const totalScore = session.questions.reduce((s, q) => s + (q.score || 0), 0);
  const averageScore = Math.round(totalScore / session.questions.length);

  const interview = await Interview.create({
    user: req.session.userId,
    role: session.role,
    level: session.level,
    questions: session.questions,
    averageScore
  });

  // Cleanup session
  req.session.interview = null;

  return res.json({
    next: false,
    redirectUrl: `/summary/${interview._id}`
  });
};
