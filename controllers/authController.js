const bcrypt = require("bcrypt");
const User = require("../models/User");

module.exports.renderSignup = (req, res) => {
  res.render("auth/signup");
};

module.exports.renderLogin = (req, res) => {
  res.render("auth/login");
};

module.exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  req.session.userId = user._id;
  res.redirect("/setup");
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.redirect("/login");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.redirect("/login");

  req.session.userId = user._id;
  res.redirect("/setup");
};

module.exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
