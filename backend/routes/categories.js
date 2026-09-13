// routes/categories.js
const express = require('express');
const db = require('../db');
const router = express.Router();

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin')
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    next();
}

// GET /api/categories — public, dùng cho cả client lẫn admin
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT c.id, c.name,
             COUNT(b.id) AS book_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.id ASC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// POST /api/categories — thêm danh mục mới
router.post('/', requireAdmin, async (req, res) => {
    const { id, name } = req.body;
    if (!id || !name)
        return res.status(400).json({ error: 'Thiếu id hoặc tên danh mục' });
    if (!/^[a-z0-9_-]+$/i.test(id))
        return res.status(400).json({ error: 'ID chỉ được chứa chữ cái, số, dấu - hoặc _' });
    try {
        const [exist] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
        if (exist.length)
            return res.status(400).json({ error: 'ID danh mục đã tồn tại' });
        await db.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id.toLowerCase(), name.trim()]);
        res.status(201).json({ message: 'Thêm danh mục thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// PUT /api/categories/:id — cập nhật tên danh mục
router.put('/:id', requireAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Tên danh mục không được để trống' });
    try {
        const [exist] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
        if (!exist.length)
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
        res.json({ message: 'Cập nhật danh mục thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// DELETE /api/categories/:id — xóa danh mục
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const [exist] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
        if (!exist.length)
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        // Sách thuộc danh mục này sẽ tự SET NULL nhờ FOREIGN KEY ON DELETE SET NULL
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
