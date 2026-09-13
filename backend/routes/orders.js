// routes/orders.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware: phải đăng nhập
function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
    next();
}
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin')
        return res.status(403).json({ error: 'Không có quyền' });
    next();
}

// ── POST /api/orders ─────────────────────────
// Tạo đơn hàng mới
router.post('/', requireAuth, async (req, res) => {
    const { items, address, _adminUserId } = req.body;
    // Admin có thể tạo đơn thay cho user khác bằng _adminUserId
    const isAdmin = req.session.user.role === 'admin';
    const userId = (isAdmin && _adminUserId) ? _adminUserId : req.session.user.id;

    if (!items || !items.length)
        return res.status(400).json({ error: 'Giỏ hàng trống' });
    if (!address)
        return res.status(400).json({ error: 'Vui lòng nhập địa chỉ' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Tính tổng tiền & kiểm tra tồn kho
        let total = 0;
        const enriched = [];

        for (const item of items) {
            const [rows] = await conn.query('SELECT * FROM books WHERE id = ?', [item.bookId]);
            if (!rows.length) throw new Error(`Không tìm thấy sách ID ${item.bookId}`);
            const book = rows[0];
            if (book.stock < item.quantity)
                throw new Error(`Sách "${book.title}" không đủ hàng`);

            total += book.price * item.quantity;
            enriched.push({ book, quantity: item.quantity });
        }

        // Tạo đơn hàng
        const [orderResult] = await conn.query(
            'INSERT INTO orders (user_id, address, total) VALUES (?, ?, ?)',
            [userId, address, total]
        );
        const orderId = orderResult.insertId;

        // Tạo order items & trừ tồn kho
        for (const { book, quantity } of enriched) {
            await conn.query(
                'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, book.id, quantity, book.price]
            );
            await conn.query('UPDATE books SET stock = stock - ? WHERE id = ?', [quantity, book.id]);
        }

        await conn.commit();
        res.status(201).json({ orderId, total, message: 'Đặt hàng thành công!' });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ── GET /api/orders ──────────────────────────
// Lịch sử đơn hàng của user đang đăng nhập
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const isAdmin = req.session.user.role === 'admin';

        let sql = `
      SELECT o.*, u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
        const params = [];

        if (!isAdmin) {
            sql += ' WHERE o.user_id = ?';
            params.push(userId);
        }

        sql += ' ORDER BY o.created_at DESC';

        const [orders] = await db.query(sql, params);

        // Gắn items vào mỗi đơn hàng
        for (const order of orders) {
            const [items] = await db.query(
                `SELECT oi.*, b.title, b.image
         FROM order_items oi
         JOIN books b ON oi.book_id = b.id
         WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── GET /api/orders/:id ──────────────────────
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

        const order = rows[0];
        if (req.session.user.role !== 'admin' && order.user_id !== req.session.user.id)
            return res.status(403).json({ error: 'Không có quyền xem đơn hàng này' });

        const [items] = await db.query(
            `SELECT oi.*, b.title, b.image
       FROM order_items oi
       JOIN books b ON oi.book_id = b.id
       WHERE oi.order_id = ?`,
            [order.id]
        );
        order.items = items;
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── PATCH /api/orders/:id/cancel ─────────────
// User tự hủy đơn (chỉ khi đơn đang pending)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

        const order = rows[0];

        // Chỉ chủ đơn hàng mới được hủy
        if (order.user_id !== req.session.user.id && req.session.user.role !== 'admin')
            return res.status(403).json({ error: 'Không có quyền hủy đơn hàng này' });

        // Chỉ cho hủy khi đơn đang pending
        if (order.status !== 'pending')
            return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' });

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Hoàn lại tồn kho
            const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            for (const item of items) {
                await conn.query('UPDATE books SET stock = stock + ? WHERE id = ?', [item.quantity, item.book_id]);
            }

            await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', order.id]);
            await conn.commit();
            res.json({ message: 'Đã hủy đơn hàng thành công' });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ── PATCH /api/orders/:id/status ─────────────
// Admin cập nhật trạng thái đơn hàng
router.patch('/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipping', 'done', 'cancelled'];
    if (!validStatuses.includes(status))
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });

    try {
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
