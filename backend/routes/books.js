// routes/books.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// ── GET /api/books ───────────────────────────
// Query params: featured, isNew, isTrending, category, search
router.get('/', async (req, res) => {
    try {
        let sql = 'SELECT * FROM books WHERE 1=1';
        const params = [];

        if (req.query.featured === 'true') {
            sql += ' AND is_featured = 1';
        }
        if (req.query.isNew === 'true') {
            sql += ' AND is_new = 1';
        }
        if (req.query.isTrending === 'true') {
            sql += ' AND is_trending = 1';
        }
        if (req.query.isForeign === 'true') {
            sql += ' AND is_foreign = 1';
        }
        if (req.query.category) {
            sql += ' AND category_id = ?';
            params.push(req.query.category);
        }
        if (req.query.search) {
            sql += ' AND (title LIKE ? OR author LIKE ?)';
            const keyword = `%${req.query.search}%`;
            params.push(keyword, keyword);
        }

        sql += ' ORDER BY created_at DESC LIMIT 20';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── GET /api/books/:id ───────────────────────
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy sách' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── POST /api/books ──────────────────────────
// Chỉ admin mới được thêm sách
router.post('/', requireAdmin, async (req, res) => {
    const { title, author, description, price, image, stock, category_id, is_featured, is_new, is_trending, is_foreign } = req.body;
    if (!title || !author || !price)
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });

    try {
        const [result] = await db.query(
            `INSERT INTO books (title, author, description, price, image, stock, category_id, is_featured, is_new, is_trending, is_foreign)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, author, description || '', price, image || '', stock || 0,
                category_id || null, is_featured ? 1 : 0, is_new ? 1 : 0, is_trending ? 1 : 0, is_foreign ? 1 : 0]
        );
        res.status(201).json({ id: result.insertId, message: 'Thêm sách thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── PUT /api/books/:id ───────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
    const { title, author, description, price, image, stock, category_id, is_featured, is_new, is_trending, is_foreign } = req.body;
    try {
        await db.query(
            `UPDATE books SET title=?, author=?, description=?, price=?, image=?, stock=?,
       category_id=?, is_featured=?, is_new=?, is_trending=?, is_foreign=? WHERE id=?`,
            [title, author, description, price, image, stock,
                category_id, is_featured ? 1 : 0, is_new ? 1 : 0, is_trending ? 1 : 0, is_foreign ? 1 : 0, req.params.id]
        );
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── DELETE /api/books/:id ────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
        res.json({ message: 'Xóa sách thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ─── MIDDLEWARE ──────────────────────────────
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin')
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
}

module.exports = router;
