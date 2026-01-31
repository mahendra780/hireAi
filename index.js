const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const pageRoutes = require("./routes/pages");
const interviewRoutes = require("./routes/interview");
const authRoutes = require("./routes/auth");
const User = require("./models/User");

const app = express();

/*BASIC MIDDLEWARES*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

// DATABASE
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// SESSION CONFIG (AUTH)
app.use(
  session({
    secret: "hireai-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// GLOBAL USER (OPTIONAL)
app.use(async (req, res, next) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    res.locals.currentUser = user;
  } else {
    res.locals.currentUser = null;
  }
  next();
});
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});


// ROUTES

// Auth routes (login, signup, logout)
app.use(authRoutes);

app.use("/", pageRoutes);

// Interview APIs
app.use("/interview", interviewRoutes);

//  SERVER

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
