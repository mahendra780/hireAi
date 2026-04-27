/**
 * Validation middleware for interview routes.
 * File: middleware/validateInterview.js
 */

/**
 * Validates the body when starting an interview (POST /interview).
 * Expects: { role: string, level: "junior" | "mid" | "senior" }
 */
module.exports.validateInterviewStart = (req, res, next) => {
  const { role, level } = req.body;

  if (!role || role.trim().length < 2) {
    return res.status(400).json({ error: "A valid role is required to start the interview." });
  }

  const validLevels = ["junior", "mid", "senior"];
  if (!level || !validLevels.includes(level.trim().toLowerCase())) {
    return res.status(400).json({
      error: `Level must be one of: ${validLevels.join(", ")}.`
    });
  }

  // Sanitise before passing to controller
  req.body.role  = role.trim();
  req.body.level = level.trim().toLowerCase();

  next();
};

/**
 * Validates the body when evaluating an answer (POST /interview/evaluate).
 * Expects: { question: string, answer: string }
 * Note: a short/empty answer is allowed — the controller scores it 0.
 */
module.exports.validateEvaluate = (req, res, next) => {
  const { question, answer } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: "Question is missing from the request." });
  }

  if (answer === undefined || answer === null) {
    return res.status(400).json({ error: "Answer field is required." });
  }

  next();
};