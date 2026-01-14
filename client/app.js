
// LOAD ENV VARIABLES (VERY FIRST LINE)
require("dotenv").config();

// DEBUG (remove later if you want)
console.log("ENV CHECK =>", process.env.MONGO_URI);

// IMPORTS
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const router = require("./controller/router");

// APP INIT
const app = express();
const PORT = process.env.PORT || 7000;

// MONGOOSE CONFIG
mongoose.set("strictQuery", false);

console.log("🔄 Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connection successful!");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed:", err.message);
  });

// IMAGE STATIC FILES
  app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/img", express.static(path.join(__dirname, "views/img")));

// SESSION MIDDLEWARE
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tripwheels_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: false, // Render free / local
    },
  })
);

// GLOBAL USER FOR EJS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// VIEW ENGINE
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// STATIC FILES
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

// BODY PARSER
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DEBUG ROUTE LOG
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.url} - ${
      req.session.user ? req.session.user.email : "Guest"
    }`
  );
  next();
});

// ROUTES
app.use("/", router);

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).render("404");
});

// 404 PAGE
app.use((req, res) => {
  res.status(404).render("404");
});

// START SERVER
app.listen(PORT, () => {
  console.log("🚗 TripWheels Server Started Successfully!");
  console.log(`🌐 Running on port ${PORT}`);
});
