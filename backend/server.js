// server.js - Entry point chính
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ──────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: cho phép frontend gọi API kèm cookie
app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
    ],
    credentials: true,
}));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'dunavitu_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    },
}));

// ─── STATIC FILES ────────────────────────────
// Phục vụ file HTML/CSS/JS của frontend
app.use(express.static(path.join(__dirname, '../')));

// ─── API ROUTES ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);

// ─── HEALTH CHECK ────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── 404 ─────────────────────────────────────
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint không tồn tại' });
});

// ─── ERROR HANDLER ───────────────────────────
app.use((err, req, res, next) => {
    console.error('Lỗi server:', err.stack);
    res.status(500).json({ error: 'Đã xảy ra lỗi, vui lòng thử lại' });
});

// ─── START ───────────────────────────────────
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🚀 Dunavitu Books Server            ║
  ║   http://localhost:${PORT}               ║
  ╚═══════════════════════════════════════╝
  `);
});
