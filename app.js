const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const router = require('./controller/router');
const app = express();
const PORT = 7000;

// MongoDB Connection
console.log("🔄 Connecting to MongoDB...");

mongoose.connect("mongodb+srv://admin:admin@cluster0.pm6vus3.mongodb.net/demo?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("✅ MongoDB connection successful!");
})
.catch((err) => {
    console.log("❌ MongoDB connection failed:", err.message);
});

// Session Middleware
app.use(session({
    secret: 'tripwheels_secret_key_2024_very_secure',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: false
    }
}));

// Make user available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Express Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files Middleware
app.use(express.static(path.join(__dirname, 'views')));
app.use('/img', express.static(path.join(__dirname, 'views/img')));
app.use('/css', express.static(path.join(__dirname, 'views/css')));
app.use('/js', express.static(path.join(__dirname, 'views/js')));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${req.session.user ? 'User: ' + req.session.user.email : 'Guest'}`);
    next();
});

// Use Router
app.use('/', router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).render('404');
});

// 404 Page
app.use((req, res) => {
    res.status(404).render('404');
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚗 TripWheels Server Started Successfully!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`📝 Register: http://localhost:${PORT}/register`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`\n📝 TEST CREDENTIALS:`);
    console.log(`👑 Admin: admin@tripwheels.com / admin123`);
    console.log(`👤 User: Register करें (auto login)`);
    console.log(`\n⚡ Server running on port ${PORT}`);
});