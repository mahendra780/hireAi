const Interview = require("../models/Interview");

module.exports.renderSetup = (req, res) => {
  res.render("pages/setup");
};

module.exports.renderInterview = (req, res) => {
  console.log("QUERY PARAMS:", req.query);

  const { role, level } = req.query;

  res.render("pages/interview", {
    role,
    level
  });
};


module.exports.renderSummary = async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  res.render("pages/summary", { interview });
};
module.exports.renderLanding = (req, res) => {
  res.render("pages/landing");
};

