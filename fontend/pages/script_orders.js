const STATUS_MAP = {
    pending: { label: '⏳ Chờ xác nhận', cls: 'status-pending' },
    confirmed: { label: '✅ Đã xác nhận', cls: 'status-confirmed' },
    shipping: { label: '🚚 Đang giao', cls: 'status-shipping' },
    done: { label: '🎉 Hoàn thành', cls: 'status-done' },
    cancelled: { label: '❌ Đã hủy', cls: 'status-cancelled' },
};

function formatPrice(p) {
    return Number(p).toLocaleString('vi-VN') + 'đ';
}

function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 3000);
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này không?\nTồn kho sẽ được hoàn lại tự động.')) return;
    try {
        const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');

        showToast('Đã hủy đơn hàng thành công!', 'success');

        // Cập nhật UI ngay mà không cần reload trang
        const card = document.getElementById(`order-card-${orderId}`);
        if (card) {
            const statusEl = card.querySelector('.order-status');
            statusEl.className = 'order-status status-cancelled';
            statusEl.textContent = '❌ Đã hủy';

            const cancelBtn = card.querySelector('.btn-cancel');
            if (cancelBtn) cancelBtn.remove();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    try {
        // Kiểm tra đăng nhập
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (!meRes.ok) {
            container.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">🔒</div>
                    <h3>Bạn chưa đăng nhập</h3>
                    <p>Vui lòng đăng nhập để xem lịch sử đơn hàng</p>
                    <a href="/">Về trang chủ</a>
                </div>`;
            return;
        }

        const res = await fetch('/api/orders', { credentials: 'include' });
        const orders = await res.json();

        if (!orders.length) {
            container.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">📭</div>
                    <h3>Chưa có đơn hàng nào</h3>
                    <p>Hãy khám phá và đặt mua những cuốn sách hay nhé!</p>
                    <a href="/">Mua sắm ngay</a>
                </div>`;
            return;
        }

        container.innerHTML = orders.map(order => {
            const status = STATUS_MAP[order.status] || { label: order.status, cls: '' };
            const canCancel = order.status === 'pending';

            const items = (order.items || []).map(item => `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/50x65'">
                    <div class="item-info">
                        <strong>${item.title}</strong>
                        <span>Số lượng: ${item.quantity}</span>
                    </div>
                    <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
                </div>
            `).join('');

            return `
                <div class="order-card" id="order-card-${order.id}">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Đơn hàng #${order.id}${order.user_name ? '&nbsp; <span style="font-size:12px;font-weight:400;color:#888;">— của ' + order.user_name + '</span>' : ''}</div>
                            <div class="order-date">${formatDate(order.created_at)}</div>
                        </div>
                        <span class="order-status ${status.cls}">${status.label}</span>
                    </div>
                    <div class="order-items">${items}</div>
                    <div class="order-footer">
                        <div class="order-address">📍 Giao tới: <span>${order.address}</span></div>
                        <div class="order-footer-right">
                            ${canCancel ? `<button class="btn-cancel" onclick="cancelOrder(${order.id})">🗑️ Hủy đơn</button>` : ''}
                            <div class="order-total">Tổng: ${formatPrice(order.total)}</div>
                        </div>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        container.innerHTML = `<div class="loading">❌ Không thể tải đơn hàng. Vui lòng thử lại.</div>`;
    }
}

loadOrders();