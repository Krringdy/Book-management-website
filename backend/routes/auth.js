// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// ── GET /api/auth/me ─────────────────────────
// Trả về user đang đăng nhập (từ session)
router.get('/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
    res.json(req.session.user);
});

// ── POST /api/auth/register ──────────────────
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });

    if (password.length < 6)
        return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự' });

    try {
        // Kiểm tra email đã tồn tại chưa
        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0)
            return res.status(409).json({ error: 'Email đã được sử dụng' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashed]
        );

        const user = { id: result.insertId, name, email, role: 'user' };
        req.session.user = user;
        res.status(201).json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── POST /api/auth/login ─────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length)
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

        const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        // Tạo session mới để tránh session fixation (lẫn dữ liệu nick cũ)
        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ error: 'Lỗi session' });
            req.session.user = sessionUser;
            res.json({ user: sessionUser });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── POST /api/auth/logout ────────────────────
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Đã đăng xuất' });
    });
});

module.exports = router;
