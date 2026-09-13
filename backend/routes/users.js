// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin')
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
}

// ── POST /api/users ────────────────────────────────────────────────────────
// Admin tạo tài khoản mới
router.post('/', requireAdmin, async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !name.trim())
        return res.status(400).json({ error: 'Họ tên không được để trống' });
    if (!email || !email.trim())
        return res.status(400).json({ error: 'Email không được để trống' });
    if (!password || password.length < 6)
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    if (!['admin', 'user'].includes(role))
        return res.status(400).json({ error: 'Vai trò không hợp lệ (admin | user)' });

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        if (existing.length)
            return res.status(400).json({ error: 'Email đã được sử dụng' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email.trim(), hashed, role]
        );
        res.status(201).json({ id: result.insertId, message: 'Tạo tài khoản thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── GET /api/users ─────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── PATCH /api/users/:id/role ──────────────────────────────────────────────
// Admin thay đổi vai trò của user (nâng lên admin / hạ xuống user)
router.patch('/:id/role', requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    const adminId = req.session.user.id;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role))
        return res.status(400).json({ error: 'Vai trò không hợp lệ (admin | user)' });

    if (targetId === adminId)
        return res.status(400).json({ error: 'Không thể thay đổi quyền của chính mình' });

    try {
        const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [targetId]);
        if (!rows.length)
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, targetId]);
        res.json({ message: `Đã cập nhật vai trò thành ${role}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── PATCH /api/users/:id/password ─────────────────────────────────────────
// Admin đặt lại mật khẩu cho bất kỳ user nào
router.patch('/:id/password', requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });

    try {
        const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [targetId]);
        if (!rows.length)
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, targetId]);
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────
// Admin xóa tài khoản user (không được xóa tài khoản admin)
router.delete('/:id', requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    const adminId = req.session.user.id;

    if (targetId === adminId)
        return res.status(400).json({ error: 'Không thể xóa chính tài khoản đang đăng nhập' });

    try {
        const [rows] = await db.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
        if (!rows.length)
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        if (rows[0].role === 'admin')
            return res.status(400).json({ error: 'Không thể xóa tài khoản Admin' });

        await db.query('DELETE FROM users WHERE id = ?', [targetId]);
        res.json({ message: 'Đã xóa tài khoản thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
