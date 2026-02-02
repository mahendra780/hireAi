const PDFDocument = require("pdfkit");
const Interview = require("../models/Interview");

/* ======================
   SETUP & INTERVIEW
====================== */

module.exports.renderSetup = (req, res) => {
  res.render("pages/setup");
};

module.exports.renderInterview = (req, res) => {
  const { role, level } = req.query;

  res.render("pages/interview", {
    role,
    level,
  });
};

/* ======================
   SUMMARY
====================== */

module.exports.renderSummary = async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  res.render("pages/summary", { interview });
};

/* ======================
   LANDING
====================== */

module.exports.renderLanding = (req, res) => {
  res.render("pages/landing");
};

/* ======================
   HISTORY (USER-SPECIFIC)
====================== */

module.exports.renderHistory = async (req, res) => {
  const interviews = await Interview.find({
    user: req.session.userId,
  }).sort({ createdAt: -1 });

  res.render("pages/history", {
    interviews,
    user: res.locals.currentUser,
  });
};

/* ======================
   ANALYTICS (UPDATED)
====================== */

module.exports.renderAnalytics = async (req, res) => {
  const interviews = await Interview.find({
    user: req.session.userId,
  }).sort({ createdAt: 1 });

  const labels = interviews.map((i) =>
    new Date(i.createdAt).toLocaleDateString()
  );

  const scores = interviews.map((i) => i.averageScore);

  const totalInterviews = interviews.length;

  let bestInterview = null;
  let latestInterview = null;

  if (interviews.length > 0) {
    bestInterview = interviews.reduce((best, curr) =>
      curr.averageScore > best.averageScore ? curr : best
    );

    latestInterview = interviews[interviews.length - 1];
  }

  res.render("pages/analytics", {
    labels: JSON.stringify(labels),
    scores: JSON.stringify(scores),
    totalInterviews,
    bestScore: bestInterview ? bestInterview.averageScore : 0,
    latestScore: latestInterview ? latestInterview.averageScore : 0,
    bestInterviewId: bestInterview ? bestInterview._id : null,
    latestInterviewId: latestInterview ? latestInterview._id : null,
  });
};

/* ======================
   PDF EXPORT
====================== */

module.exports.downloadSummaryPDF = async (req, res) => {
  const interview = await Interview.findById(req.params.id);

  if (!interview) {
    return res.status(404).send("Interview not found");
  }

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=HireAi_Interview_Report.pdf"
  );

  doc.pipe(res);

  // Title
  doc.fontSize(20).text("HireAi – Interview Summary", { align: "center" });
  doc.moveDown();

  // Meta
  doc.fontSize(12).text(`Role: ${interview.role}`);
  doc.text(`Level: ${interview.level}`);
  doc.text(`Average Score: ${interview.averageScore} / 10`);
  doc.text(`Date: ${new Date(interview.createdAt).toLocaleString()}`);
  doc.moveDown();

  // Questions
  interview.questions.forEach((q, index) => {
    doc.fontSize(14).text(`Question ${index + 1}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text(`Question: ${q.question}`);
    doc.moveDown(0.5);

    doc.text(`Your Answer: ${q.answer}`);
    doc.moveDown(0.5);

    doc.text(`Score: ${q.score} / 10`);
    doc.moveDown(0.5);

    doc.text(`Feedback: ${q.feedback}`);
    doc.moveDown(1.5);
  });

  doc.end();
};
