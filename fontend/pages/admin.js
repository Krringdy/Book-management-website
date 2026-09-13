const API = '';
let allBooks = [];
let allOrders = [];

// ── UTILS ──────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(API + endpoint, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi server');
    return data;
}

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 3000);
}
function fmt(p) { return Number(p).toLocaleString('vi-VN') + 'đ'; }
function statusBadge(s) {
    const map = {
        pending: ['badge-pending', 'Chờ xử lý'],
        confirmed: ['badge-confirmed', 'Đã xác nhận'],
        shipping: ['badge-shipping', 'Đang giao'],
        done: ['badge-done', 'Hoàn thành'],
        cancelled: ['badge-cancelled', 'Đã hủy'],
    };
    const [cls, label] = map[s] || ['badge-pending', s];
    return `<span class="badge ${cls}">${label}</span>`;
}

// ── AUTH CHECK ─────────────────────────────
async function checkAuth() {
    try {
        const user = await apiFetch('/api/auth/me');
        if (user.role !== 'admin') {
            document.getElementById('auth-guard').innerHTML = `
          <div style="text-align:center;color:white;padding:40px;">
            <div style="font-size:56px;margin-bottom:16px;">🚫</div>
            <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Không có quyền truy cập</div>
            <div style="color:rgba(255,255,255,0.45);margin-bottom:28px;">Tài khoản của bạn không phải Admin</div>
            <a href="/" style="background:#8b1e1e;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">← Về trang chủ</a>
          </div>`;
            return;
        }
        document.getElementById('admin-name').textContent = user.name;
        document.getElementById('welcome-name').textContent = user.name;
        document.getElementById('admin-avatar').textContent = user.name[0].toUpperCase();
        // Hide guard
        const guard = document.getElementById('auth-guard');
        guard.style.opacity = '0';
        setTimeout(() => guard.remove(), 400);
    } catch {
        document.getElementById('auth-guard').innerHTML = `
        <div style="text-align:center;color:white;padding:40px;">
          <div style="font-size:56px;margin-bottom:16px;">🔒</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">Chưa đăng nhập</div>
          <div style="color:rgba(255,255,255,0.45);margin-bottom:28px;">Vui lòng đăng nhập với tài khoản Admin</div>
          <a href="/" style="background:#8b1e1e;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">← Đăng nhập</a>
        </div>`;
    }
}
async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    window.location = '/';
}
// ── TAB SWITCH ─────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'books') loadBooks();
    if (tab === 'orders') loadOrders();
    if (tab === 'users') loadUsers();
    if (tab === 'categories') loadCategories();
}

// ── DASHBOARD ──────────────────────────────
async function loadDashboard() {
    try {
        const [books, orders, users, categories] = await Promise.all([
            apiFetch('/api/books'),
            apiFetch('/api/orders'),
            apiFetch('/api/users'),
            apiFetch('/api/categories'),
        ]);
        document.getElementById('stat-categories').textContent = categories.length;

        document.getElementById('stat-books').textContent = books.length;
        document.getElementById('stat-orders').textContent = orders.length;
        document.getElementById('stat-users').textContent = users.length;
        document.getElementById('stat-pending').textContent = orders.filter(o => o.status === 'pending').length;

        // Revenue stats
        const doneOrders = orders.filter(o => o.status === 'done');
        const activeOrders = orders.filter(o => !['cancelled'].includes(o.status));
        const revenue = doneOrders.reduce((s, o) => s + Number(o.total), 0);
        const revenueAll = activeOrders.reduce((s, o) => s + Number(o.total), 0);
        document.getElementById('stat-revenue').textContent = fmt(revenue);
        document.getElementById('stat-revenue-done').textContent = `${doneOrders.length} đơn hoàn thành`;
        document.getElementById('stat-revenue-all').textContent = fmt(revenueAll);

        const recent = orders.slice(0, 8);
        document.getElementById('recent-orders').innerHTML = recent.length ? `
        <table>
          <thead><tr>
            <th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Chi tiết</th>
          </tr></thead>
          <tbody>
            ${recent.map(o => `<tr>
              <td><strong>#${o.id}</strong></td>
              <td>${o.user_name || '—'}</td>
              <td>${fmt(o.total)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>${new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
              <td><button class="btn btn-ghost btn-sm" onclick="viewOrderDetail(${o.id})">🔍 Xem</button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty"><div class="icon">📭</div><p>Chưa có đơn hàng nào</p></div>';
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ── BOOKS ──────────────────────────────────
async function loadBooks() {
    try {
        allBooks = await apiFetch('/api/books');
        renderBooks(allBooks);
    } catch (err) { toast(err.message, 'error'); }
}

function renderBooks(books) {
    document.getElementById('books-table').innerHTML = books.length ? `
      <table>
        <thead><tr>
          <th>Ảnh</th><th>Tên sách</th><th>Giá</th><th>Tồn kho</th><th>Tag</th><th>Hành động</th>
        </tr></thead>
        <tbody>
          ${books.map(b => `<tr>
            <td><img class="book-thumb" src="${b.image || 'https://via.placeholder.com/42x56'}" alt=""></td>
            <td>
              <div class="book-info">
                <strong>${b.title}</strong>
                <span>${b.author}</span>
              </div>
            </td>
            <td>${fmt(b.price)}</td>
            <td>${b.stock}</td>
            <td>
              ${b.is_featured ? '<span class="badge badge-featured">Nổi bật</span> ' : ''}
              ${b.is_new ? '<span class="badge" style="background:#e8f5e9;color:#2e7d32">Mới</span> ' : ''}
              ${b.is_trending ? '<span class="badge" style="background:#e3f2fd;color:#1565c0">Trending</span>' : ''}
              ${b.is_foreign ? '<span class="badge" style="background:#fff3e0;color:#e65100">Nước ngoài</span>' : ''}
            </td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="editBook(${b.id})">✏️ Sửa</button>
              <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id},'${b.title.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty"><div class="icon">📚</div><p>Chưa có sách nào</p></div>';
}

function filterBooks() {
    const q = document.getElementById('book-search').value.toLowerCase();
    const cat = document.getElementById('book-cat-filter').value;
    renderBooks(allBooks.filter(b =>
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) &&
        (!cat || b.category_id === cat)
    ));
}

async function openBookModal(book = null) {
    document.getElementById('modal-book-title').textContent = book ? 'Chỉnh sửa sách' : 'Thêm sách mới';
    // Load categories dynamically
    try {
        const cats = await apiFetch('/api/categories');
        const sel = document.getElementById('f-cat');
        sel.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
            cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        if (book) sel.value = book.category_id || '';
    } catch (e) { }
    document.getElementById('book-id').value = book?.id || '';
    document.getElementById('f-title').value = book?.title || '';
    document.getElementById('f-author').value = book?.author || '';
    document.getElementById('f-desc').value = book?.description || '';
    document.getElementById('f-price').value = book?.price || '';
    document.getElementById('f-stock').value = book?.stock || '';
    document.getElementById('f-image').value = book?.image || '';
    document.getElementById('f-cat').value = book?.category_id || '';
    document.getElementById('f-featured').checked = !!book?.is_featured;
    document.getElementById('f-new').checked = !!book?.is_new;
    document.getElementById('f-trending').checked = !!book?.is_trending;
    document.getElementById('f-foreign').checked = !!book?.is_foreign;
    document.getElementById('modal-book').classList.add('active');
}

async function editBook(id) {
    try {
        const book = await apiFetch(`/api/books/${id}`);
        openBookModal(book);
    } catch (err) { toast(err.message, 'error'); }
}

async function saveBook() {
    const id = document.getElementById('book-id').value;
    const body = {
        title: document.getElementById('f-title').value.trim(),
        author: document.getElementById('f-author').value.trim(),
        description: document.getElementById('f-desc').value.trim(),
        price: parseInt(document.getElementById('f-price').value) || 0,
        stock: parseInt(document.getElementById('f-stock').value) || 0,
        image: document.getElementById('f-image').value.trim(),
        category_id: document.getElementById('f-cat').value || null,
        is_featured: document.getElementById('f-featured').checked,
        is_new: document.getElementById('f-new').checked,
        is_trending: document.getElementById('f-trending').checked,
        is_foreign: document.getElementById('f-foreign').checked,
    };
    if (!body.title || !body.author || !body.price) {
        toast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error'); return;
    }
    try {
        if (id) {
            await apiFetch(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Cập nhật sách thành công!');
        } else {
            await apiFetch('/api/books', { method: 'POST', body: JSON.stringify(body) });
            toast('Thêm sách thành công!');
        }
        closeModal();
        loadBooks();
    } catch (err) { toast(err.message, 'error'); }
}

async function deleteBook(id, title) {
    if (!confirm(`Xóa sách "${title}"? Hành động này không thể hoàn tác.`)) return;
    try {
        await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
        toast('Đã xóa sách!');
        loadBooks();
    } catch (err) { toast(err.message, 'error'); }
}

// ── ORDERS ─────────────────────────────────
async function loadOrders() {
    try {
        allOrders = await apiFetch('/api/orders');
        renderOrders(allOrders);
    } catch (err) { toast(err.message, 'error'); }
}

function renderOrders(orders) {
    document.getElementById('orders-table').innerHTML = orders.length ? `
      <table>
        <thead><tr>
          <th>Mã đơn</th><th>Khách hàng</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Chi tiết</th>
        </tr></thead>
        <tbody>
          ${orders.map(o => `<tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.user_name || '—'}</td>
            <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${o.address}">${o.address}</td>
            <td><strong style="color:var(--red)">${fmt(o.total)}</strong></td>
            <td>
              <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
                ${['pending', 'confirmed', 'shipping', 'done', 'cancelled'].map(s =>
        `<option value="${s}" ${o.status === s ? 'selected' : ''}>${{ pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao', done: 'Hoàn thành', cancelled: 'Đã hủy' }[s]}</option>`
    ).join('')}
              </select>
            </td>
            <td>${new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
            <td><button class="btn btn-ghost btn-sm" onclick="viewOrderDetail(${o.id})">🔍 Xem</button></td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty"><div class="icon">📭</div><p>Chưa có đơn hàng nào</p></div>';
}

function filterOrders() {
    const status = document.getElementById('order-status-filter').value;
    renderOrders(status ? allOrders.filter(o => o.status === status) : allOrders);
}

async function updateOrderStatus(id, status) {
    try {
        await apiFetch(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
        toast('Cập nhật trạng thái thành công!');
        const o = allOrders.find(o => o.id === id);
        if (o) o.status = status;
    } catch (err) { toast(err.message, 'error'); }
}

// ── USERS ──────────────────────────────────
async function loadUsers() {
    try {
        const users = await apiFetch('/api/users');
        document.getElementById('users-table').innerHTML = users.length ? `
        <table>
          <thead><tr>
            <th>ID</th><th>Tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th><th>Hành động</th>
          </tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td>#${u.id}</td>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td><span class="badge ${u.role === 'admin' ? 'badge-featured' : 'badge-confirmed'}">${u.role === 'admin' ? '👑 Admin' : '👤 User'}</span></td>
              <td>${new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
              <td style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-ghost btn-sm" onclick="toggleUserRole(${u.id},'${u.role}','${u.name.replace(/'/g, "\\'")}')">
                  ${u.role === 'admin' ? '⬇️ Hạ quyền' : '⬆️ Nâng quyền'}
                </button>
                <button class="btn btn-ghost btn-sm" onclick="openPasswordModal(${u.id},'${u.name.replace(/'/g, "\\'")}')">
                  🔑 Đổi MK
                </button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteUserModal(${u.id},'${u.name.replace(/'/g, "\\'")}','${u.role}')">
                  🗑️ Xóa
                </button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<div class="empty"><div class="icon">👥</div><p>Chưa có người dùng</p></div>';
    } catch (err) { toast(err.message, 'error'); }
}

async function toggleUserRole(id, currentRole, name) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'nâng lên Admin' : 'hạ xuống User';
    if (!confirm(`Bạn có chắc muốn ${action} cho "${name}"?`)) return;
    try {
        await apiFetch(`/api/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        toast(`Đã ${action} thành công!`);
        loadUsers();
    } catch (err) { toast(err.message, 'error'); }
}

// ── ĐỔI MẬT KHẨU USER ──────────────────────
function openPasswordModal(id, name) {
    document.getElementById('password-user-id').value = id;
    document.getElementById('modal-password-label').textContent = `Đặt mật khẩu mới cho tài khoản: ${name}`;
    document.getElementById('f-new-password').value = '';
    document.getElementById('f-confirm-password').value = '';
    document.getElementById('modal-user-password').classList.add('active');
}

async function saveUserPassword() {
    const id = document.getElementById('password-user-id').value;
    const pw = document.getElementById('f-new-password').value;
    const pw2 = document.getElementById('f-confirm-password').value;
    if (!pw || pw.length < 6) { toast('Mật khẩu phải có ít nhất 6 ký tự', 'error'); return; }
    if (pw !== pw2) { toast('Mật khẩu xác nhận không khớp', 'error'); return; }
    try {
        await apiFetch(`/api/users/${id}/password`, {
            method: 'PATCH',
            body: JSON.stringify({ newPassword: pw })
        });
        toast('Đã đổi mật khẩu thành công!');
        closeModal();
    } catch (err) { toast(err.message, 'error'); }
}

// ── XÓA TÀI KHOẢN USER ─────────────────────
function openDeleteUserModal(id, name, role) {
    if (role === 'admin') { toast('Không thể xóa tài khoản Admin', 'error'); return; }
    document.getElementById('delete-user-id').value = id;
    document.getElementById('modal-delete-label').textContent =
        `Bạn có chắc muốn xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`;
    document.getElementById('modal-user-delete').classList.add('active');
}

async function confirmDeleteUser() {
    const id = document.getElementById('delete-user-id').value;
    try {
        await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
        toast('Đã xóa tài khoản!');
        closeModal();
        loadUsers();
    } catch (err) { toast(err.message, 'error'); }
}


// ── CATEGORIES ─────────────────────────────
let allCategories = [];

async function loadCategories() {
    try {
        allCategories = await apiFetch('/api/categories');
        renderCategories(allCategories);
    } catch (err) { toast(err.message, 'error'); }
}

function renderCategories(cats) {
    document.getElementById('categories-table').innerHTML = cats.length ? `
      <table>
        <thead><tr>
          <th>ID</th><th>Tên danh mục</th><th>Số sách</th><th>Hành động</th>
        </tr></thead>
        <tbody>
          ${cats.map(c => `<tr>
            <td><code style="background:#f5f1e8;padding:2px 8px;border-radius:4px;font-size:12px">${c.id}</code></td>
            <td><strong>${c.name}</strong></td>
            <td><span class="badge badge-confirmed">${c.book_count ?? '—'} sách</span></td>
            <td style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="openCatModal({id:'${c.id}',name:'${c.name.replace(/'/g, "\'")}'})">✏️ Sửa</button>
              <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}','${c.name.replace(/'/g, "\'")}')">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>` : '<div class="empty"><div class="icon">🏷️</div><p>Chưa có danh mục nào</p></div>';
}

function openCatModal(cat = null) {
    document.getElementById('modal-cat-title').textContent = cat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới';
    document.getElementById('cat-edit-id').value = cat?.id || '';
    document.getElementById('f-cat-id').value = cat?.id || '';
    document.getElementById('f-cat-id').disabled = !!cat;
    document.getElementById('f-cat-name').value = cat?.name || '';
    document.getElementById('modal-category').classList.add('active');
}

async function saveCategory() {
    const editId = document.getElementById('cat-edit-id').value;
    const id = document.getElementById('f-cat-id').value.trim();
    const name = document.getElementById('f-cat-name').value.trim();
    if (!name) { toast('Tên danh mục không được để trống', 'error'); return; }
    if (!editId && !id) { toast('ID danh mục không được để trống', 'error'); return; }
    try {
        if (editId) {
            await apiFetch(`/api/categories/${editId}`, { method: 'PUT', body: JSON.stringify({ name }) });
            toast('Cập nhật danh mục thành công!');
        } else {
            await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify({ id, name }) });
            toast('Thêm danh mục thành công!');
        }
        closeModal();
        loadCategories();
    } catch (err) { toast(err.message, 'error'); }
}

async function deleteCategory(id, name) {
    if (!confirm(`Xóa danh mục "${name}"?\nSách thuộc danh mục này sẽ không còn danh mục.`)) return;
    try {
        await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
        toast('Đã xóa danh mục!');
        loadCategories();
    } catch (err) { toast(err.message, 'error'); }
}

// ── ORDER DETAIL ────────────────────────────
async function viewOrderDetail(id) {
    document.getElementById('modal-order-detail').classList.add('active');
    document.getElementById('order-detail-content').innerHTML = '<div class="loading">Đang tải...</div>';
    try {
        const order = await apiFetch(`/api/orders/${id}`);
        const STATUS_LABEL = { pending: '⏳ Chờ xử lý', confirmed: '✅ Đã xác nhận', shipping: '🚚 Đang giao', done: '🎉 Hoàn thành', cancelled: '❌ Đã hủy' };
        const items = (order.items || []);
        document.getElementById('order-detail-content').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;padding:16px;background:#faf9f6;border-radius:12px;font-size:14px;">
          <div><span style="color:#888">Mã đơn:</span> <strong>#${order.id}</strong></div>
          <div><span style="color:#888">Trạng thái:</span> <strong>${STATUS_LABEL[order.status] || order.status}</strong></div>
          <div><span style="color:#888">Khách hàng:</span> <strong>${order.user_name || '—'}</strong></div>
          <div><span style="color:#888">Ngày đặt:</span> <strong>${new Date(order.created_at).toLocaleDateString('vi-VN')}</strong></div>
          <div style="grid-column:span 2"><span style="color:#888">Địa chỉ:</span> <strong>${order.address}</strong></div>
        </div>
        <div style="border:1px solid #e8e2d9;border-radius:12px;overflow:hidden;margin-bottom:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#faf9f6;">
                <th style="padding:10px 16px;text-align:left;font-size:12px;color:#777;font-weight:600;text-transform:uppercase;">Sách</th>
                <th style="padding:10px 16px;text-align:center;font-size:12px;color:#777;font-weight:600;text-transform:uppercase;">SL</th>
                <th style="padding:10px 16px;text-align:right;font-size:12px;color:#777;font-weight:600;text-transform:uppercase;">Đơn giá</th>
                <th style="padding:10px 16px;text-align:right;font-size:12px;color:#777;font-weight:600;text-transform:uppercase;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${items.length ? items.map(item => `
                <tr style="border-top:1px solid #f0f0f0;">
                  <td style="padding:12px 16px;display:flex;align-items:center;gap:10px;">
                    <img src="${item.image || 'https://via.placeholder.com/36x48'}" style="width:36px;height:48px;object-fit:cover;border-radius:4px;" onerror="this.src='https://via.placeholder.com/36x48'">
                    <span style="font-size:14px;font-weight:500;">${item.title}</span>
                  </td>
                  <td style="padding:12px 16px;text-align:center;color:#555">${item.quantity}</td>
                  <td style="padding:12px 16px;text-align:right;color:#555">${fmt(item.price)}</td>
                  <td style="padding:12px 16px;text-align:right;font-weight:700;color:var(--red)">${fmt(item.price * item.quantity)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="padding:20px;text-align:center;color:#aaa">Không có dữ liệu sản phẩm</td></tr>'}
            </tbody>
          </table>
        </div>
        <div style="text-align:right;font-size:18px;font-weight:700;color:var(--red)">
          Tổng cộng: ${fmt(order.total)}
        </div>
      `;
    } catch (err) {
        document.getElementById('order-detail-content').innerHTML = `<div class="empty"><div class="icon">❌</div><p>${err.message}</p></div>`;
    }
}
// ── MODAL ──────────────────────────────────
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) closeModal(); });
    });
});

// ── TẠO TÀI KHOẢN MỚI ─────────────────────
function openCreateUserModal() {
    document.getElementById('f-new-user-name').value = '';
    document.getElementById('f-new-user-email').value = '';
    document.getElementById('f-new-user-password').value = '';
    document.getElementById('f-new-user-role').value = 'user';
    document.getElementById('modal-create-user').classList.add('active');
}

async function saveNewUser() {
    const name = document.getElementById('f-new-user-name').value.trim();
    const email = document.getElementById('f-new-user-email').value.trim();
    const password = document.getElementById('f-new-user-password').value;
    const role = document.getElementById('f-new-user-role').value;

    if (!name) { toast('Vui lòng nhập họ tên', 'error'); return; }
    if (!email) { toast('Vui lòng nhập email', 'error'); return; }
    if (!password || password.length < 6) { toast('Mật khẩu phải có ít nhất 6 ký tự', 'error'); return; }

    try {
        await apiFetch('/api/users', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        toast('Tạo tài khoản thành công!');
        closeModal();
        loadUsers();
    } catch (err) { toast(err.message, 'error'); }
}

// ── TẠO ĐƠN HÀNG MỚI (ADMIN) ───────────────
let orderItemsData = [];   // [{ bookId, quantity, price, title }]

async function openCreateOrderModal() {
    orderItemsData = [];
    document.getElementById('f-order-address').value = '';
    // Load users into select
    try {
        const users = await apiFetch('/api/users');
        const sel = document.getElementById('f-order-user');
        sel.innerHTML = '<option value="">-- Chọn người dùng --</option>' +
            users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
    } catch (e) { }
    renderOrderItems();
    document.getElementById('modal-create-order').classList.add('active');
}

function renderOrderItems() {
    const container = document.getElementById('order-items-list');
    if (!orderItemsData.length) {
        container.innerHTML = '<div style="color:#aaa;font-size:13px;padding:8px 0">Chưa có sản phẩm nào. Nhấn "+ Thêm sản phẩm".</div>';
        updateOrderTotal();
        return;
    }
    container.innerHTML = orderItemsData.map((item, idx) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;background:#faf9f6;padding:10px;border-radius:8px;">
        <select style="flex:2;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px"
          onchange="onOrderItemBookChange(${idx}, this.value)" data-idx="${idx}">
          <option value="">-- Chọn sách --</option>
          ${allBooks.map(b => `<option value="${b.id}" ${item.bookId == b.id ? 'selected' : ''}
            data-price="${b.price}">${b.title} (${fmt(b.price)})</option>`).join('')}
        </select>
        <input type="number" min="1" value="${item.quantity || 1}"
          style="width:68px;padding:7px;border:1px solid #ddd;border-radius:6px;font-size:13px;text-align:center"
          onchange="onOrderItemQtyChange(${idx}, this.value)">
        <span style="min-width:90px;text-align:right;font-size:13px;color:var(--red);font-weight:700">
          ${item.bookId ? fmt(item.price * (item.quantity || 1)) : '—'}
        </span>
        <button class="btn btn-danger btn-sm" onclick="removeOrderItem(${idx})">✕</button>
      </div>
    `).join('');
    updateOrderTotal();
}

function addOrderItem() {
    if (!allBooks.length) { toast('Vui lòng tải trang Quản lý sách trước', 'error'); return; }
    orderItemsData.push({ bookId: '', quantity: 1, price: 0, title: '' });
    renderOrderItems();
}

function onOrderItemBookChange(idx, bookId) {
    const book = allBooks.find(b => b.id == bookId);
    if (book) {
        orderItemsData[idx].bookId = book.id;
        orderItemsData[idx].price = book.price;
        orderItemsData[idx].title = book.title;
    } else {
        orderItemsData[idx].bookId = '';
        orderItemsData[idx].price = 0;
    }
    renderOrderItems();
}

function onOrderItemQtyChange(idx, val) {
    orderItemsData[idx].quantity = Math.max(1, parseInt(val) || 1);
    updateOrderTotal();
}

function removeOrderItem(idx) {
    orderItemsData.splice(idx, 1);
    renderOrderItems();
}

function updateOrderTotal() {
    const total = orderItemsData.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    document.getElementById('f-order-total').textContent = fmt(total);
}

async function saveNewOrder() {
    const userId = document.getElementById('f-order-user').value;
    const address = document.getElementById('f-order-address').value.trim();
    const items = orderItemsData.filter(i => i.bookId);

    if (!userId) { toast('Vui lòng chọn người dùng', 'error'); return; }
    if (!address) { toast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; }
    if (!items.length) { toast('Vui lòng thêm ít nhất 1 sản phẩm', 'error'); return; }
    try {
        const payload = {
            items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
            address,
            _adminUserId: parseInt(userId),   // truyền thêm để backend có thể mở rộng sau
        };
        await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        toast('Tạo đơn hàng thành công!');
        closeModal();
        loadOrders();
    } catch (err) {
        if (err.message && err.message !== 'Lỗi server') {
            toast(err.message, 'error');
        } else {
            toast('Tạo đơn hàng thành công!');
            closeModal();
            loadOrders();
        }
    }
}

// ── INIT ───────────────────────────────────
checkAuth().then(() => loadDashboard());