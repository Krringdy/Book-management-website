/* =============================================
   DUNAVITU BOOKS - script.js
   Tất cả logic phía client
   ============================================= */

const API = '';  // Cùng origin với server

// ─── STATE ──────────────────────────────────────
const state = {
    user: null,        // thông tin user đang đăng nhập
    cart: [],          // giỏ hàng: [{bookId, title, price, image, quantity}]
};

// ─── UTILS ──────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(API + endpoint, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
    return data;
}

function formatPrice(p) {
    return p.toLocaleString('vi-VN') + 'đ';
}

function showToast(msg, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── AUTH ────────────────────────────────────────
async function loadUser() {
    try {
        state.user = await apiFetch('/api/auth/me');
    } catch {
        state.user = null;
    }
    renderAuthUI();
}

function renderAuthUI() {
    const loginLink = document.querySelector('.actions .login');
    const cartBtn = document.querySelector('.actions button');
    if (!loginLink) return;

    if (state.user) {
        loginLink.textContent = state.user.name;
        loginLink.href = '#';
        loginLink.onclick = (e) => { e.preventDefault(); showUserMenu(); };

        // Nếu là admin, hiện link admin
        if (state.user.role === 'admin' && !document.getElementById('admin-link')) {
            const adminLink = document.createElement('a');
            adminLink.id = 'admin-link';
            adminLink.href = '/pages/admin.html';
            adminLink.className = 'login';
            adminLink.textContent = '⚙️ Quản trị';
            adminLink.style.background = '#8b1e1e';
            adminLink.style.color = 'white';
            adminLink.style.padding = '8px 14px';
            adminLink.style.borderRadius = '6px';
            loginLink.parentNode.insertBefore(adminLink, loginLink.nextSibling);
        }
    } else {
        loginLink.textContent = 'Đăng nhập';
        loginLink.onclick = (e) => { e.preventDefault(); openModal('modal-login'); };
    }
    updateCartBadge();
}

function showUserMenu() {
    let menu = document.getElementById('user-dropdown');
    if (menu) { menu.remove(); return; }
    menu = document.createElement('div');
    menu.id = 'user-dropdown';
    menu.className = 'user-dropdown';
    menu.innerHTML = `
    <a href="/pages/orders.html">📦 Lịch sử mua hàng</a>
    <a href="#" id="logout-btn">🚪 Đăng xuất</a>
  `;
    document.querySelector('.actions .login').after(menu);
    document.getElementById('logout-btn').onclick = async (e) => {
        e.preventDefault();
        await apiFetch('/api/auth/logout', { method: 'POST' });
        state.user = null;
        menu.remove();
        renderAuthUI();
        showToast('Đã đăng xuất');
    };
    setTimeout(() => document.addEventListener('click', () => menu?.remove(), { once: true }), 100);
}

// ─── MODAL ──────────────────────────────────────
function openModal(id) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function createModals() {
    const html = `
  <!-- MODAL ĐĂNG NHẬP -->
  <div class="modal" id="modal-login">
    <div class="modal-box">
      <button class="modal-close" onclick="closeAllModals()">✕</button>
      <h2>Đăng nhập</h2>
      <input type="email" id="login-email" placeholder="Email" />
      <input type="password" id="login-password" placeholder="Mật khẩu" />
      <button class="btn-primary" onclick="handleLogin()">Đăng nhập</button>
      <p class="modal-switch">Chưa có tài khoản? <a href="#" onclick="openModal('modal-register')">Đăng ký</a></p>
    </div>
  </div>

  <!-- MODAL ĐĂNG KÝ -->
  <div class="modal" id="modal-register">
    <div class="modal-box">
      <button class="modal-close" onclick="closeAllModals()">✕</button>
      <h2>Đăng ký</h2>
      <input type="text" id="reg-name" placeholder="Họ và tên" />
      <input type="email" id="reg-email" placeholder="Email" />
      <input type="password" id="reg-password" placeholder="Mật khẩu" />
      <button class="btn-primary" onclick="handleRegister()">Đăng ký</button>
      <p class="modal-switch">Đã có tài khoản? <a href="#" onclick="openModal('modal-login')">Đăng nhập</a></p>
    </div>
  </div>

  <!-- MODAL CHI TIẾT SÁCH -->
  <div class="modal" id="modal-book">
    <div class="modal-box modal-book-box">
      <button class="modal-close" onclick="closeAllModals()">✕</button>
      <div id="modal-book-content"></div>
    </div>
  </div>

  <!-- MODAL GIỎ HÀNG -->
  <div class="modal" id="modal-cart">
    <div class="modal-box modal-cart-box">
      <button class="modal-close" onclick="closeAllModals()">✕</button>
      <h2>🛒 Giỏ hàng</h2>
      <div id="cart-items"></div>
      <div id="cart-footer"></div>
    </div>
  </div>

  <!-- MODAL THANH TOÁN -->
  <div class="modal" id="modal-checkout">
    <div class="modal-box">
      <button class="modal-close" onclick="closeAllModals()">✕</button>
      <h2>Thanh toán</h2>
      <div id="checkout-summary"></div>
      <input type="text" id="checkout-address" placeholder="Địa chỉ giao hàng..." />
      <button class="btn-primary" onclick="handleCheckout()">Xác nhận đặt hàng</button>
    </div>
  </div>

  <!-- TOAST -->
  <div id="toast" class="toast"></div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Đóng modal khi click nền
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeAllModals(); });
    });
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        state.user = data.user;
        closeAllModals();
        renderAuthUI();
        showToast(`Chào mừng, ${data.user.name}!`);
        if (data.user.role === 'admin') {
            setTimeout(() => { if (confirm('Bạn có muốn vào trang quản trị?')) window.location = '/pages/admin.html'; }, 500);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    try {
        const data = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        state.user = data.user;
        closeAllModals();
        renderAuthUI();
        showToast('Đăng ký thành công!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─── BOOKS ──────────────────────────────────────
async function loadBooks() {
    try {
        const [featured, foreign, newBooks, trending] = await Promise.all([
            apiFetch('/api/books?featured=true'),
            apiFetch('/api/books?isForeign=true'),
            apiFetch('/api/books?isNew=true'),
            apiFetch('/api/books?isTrending=true'),
        ]);
        renderBookSection('[data-section="featured"] .book-list', featured);
        renderBookSection('[data-section="foreign"] .book-list', foreign);
        renderBookSection('[data-section="new"] .book-list', newBooks);
        renderBookSection('[data-section="trending"] .book-list', trending);
    } catch (err) {
        console.error('Lỗi tải sách:', err);
    }
}

function renderBookSection(selector, books) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = books.map(b => `
    <div class="book-card" data-id="${b.id}">
      <img src="${b.image}" alt="${b.title}" loading="lazy">
      <h3>${b.title}</h3>
      <p class="author">${b.author}</p>
      <span>${formatPrice(b.price)}</span>
      <div style="display:flex;gap:8px;padding:0 20px 10px;">
        <button onclick="showBookDetail('${b.id}')">Chi tiết</button>
        <button onclick="addToCart('${b.id}','${b.title}',${b.price},'${b.image}')" style="background:#555;">🛒</button>
      </div>
    </div>
  `).join('');
}

async function showBookDetail(id) {
    try {
        const book = await apiFetch(`/api/books/${id}`);
        document.getElementById('modal-book-content').innerHTML = `
      <div class="book-detail">
        <img src="${book.image}" alt="${book.title}">
        <div class="book-detail-info">
          <h2>${book.title}</h2>
          <p class="author">Tác giả: <strong>${book.author}</strong></p>
          <p class="book-desc">${book.description}</p>
          <p class="book-stock">Còn lại: ${book.stock} cuốn</p>
          <span class="book-price">${formatPrice(book.price)}</span>
          <button class="btn-primary" onclick="addToCart('${book.id}','${book.title}',${book.price},'${book.image}');closeAllModals();">
            🛒 Thêm vào giỏ
          </button>
        </div>
      </div>
    `;
        openModal('modal-book');
    } catch (err) {
        showToast('Không thể tải thông tin sách', 'error');
    }
}

// ─── CART ────────────────────────────────────────
function loadCart() {
    const saved = localStorage.getItem('dunavitu_cart');
    state.cart = saved ? JSON.parse(saved) : [];
    updateCartBadge();
}

function saveCart() {
    localStorage.setItem('dunavitu_cart', JSON.stringify(state.cart));
    updateCartBadge();
}

function addToCart(bookId, title, price, image) {
    const existing = state.cart.find(i => i.bookId === bookId);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ bookId, title, price, image, quantity: 1 });
    }
    saveCart();
    showToast(`Đã thêm "${title}" vào giỏ hàng 🛒`);
}

function updateCartBadge() {
    const btn = document.querySelector('.actions button');
    if (!btn) return;
    const total = state.cart.reduce((s, i) => s + i.quantity, 0);
    btn.textContent = total > 0 ? `Giỏ hàng (${total})` : 'Giỏ hàng';
}

function openCart() {
    renderCart();
    openModal('modal-cart');
}

function renderCart() {
    const el = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    if (!el) return;

    if (!state.cart.length) {
        el.innerHTML = '<p style="text-align:center;color:#888;padding:40px 0">Giỏ hàng trống</p>';
        footer.innerHTML = '';
        return;
    }

    el.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <strong>${item.title}</strong>
        <span>${formatPrice(item.price)}</span>
      </div>
      <div class="cart-qty">
        <button onclick="changeQty('${item.bookId}',-1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty('${item.bookId}',1)">+</button>
      </div>
      <button class="cart-remove" onclick="removeFromCart('${item.bookId}')">✕</button>
    </div>
  `).join('');

    const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    footer.innerHTML = `
    <div class="cart-total">Tổng cộng: <strong>${formatPrice(total)}</strong></div>
    <button class="btn-primary" onclick="openCheckout()">Thanh toán</button>
  `;
}

function changeQty(bookId, delta) {
    const item = state.cart.find(i => i.bookId === bookId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(bookId);
    else { saveCart(); renderCart(); }
}

function removeFromCart(bookId) {
    state.cart = state.cart.filter(i => i.bookId !== bookId);
    saveCart();
    renderCart();
}

function openCheckout() {
    if (!state.user) {
        closeAllModals();
        openModal('modal-login');
        showToast('Vui lòng đăng nhập để thanh toán', 'error');
        return;
    }
    const total = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    document.getElementById('checkout-summary').innerHTML = `
    <ul class="checkout-list">
      ${state.cart.map(i => `<li>${i.title} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}</li>`).join('')}
    </ul>
    <p class="checkout-total">Tổng: <strong>${formatPrice(total)}</strong></p>
  `;
    openModal('modal-checkout');
}

async function handleCheckout() {
    const address = document.getElementById('checkout-address').value.trim();
    if (!address) { showToast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; }
    try {
        await apiFetch('/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                items: state.cart.map(i => ({ bookId: i.bookId, quantity: i.quantity })),
                address
            })
        });
        state.cart = [];
        saveCart();
        closeAllModals();
        showToast('Đặt hàng thành công! 🎉');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ─── SEARCH ─────────────────────────────────────
function initSearch() {
    const input = document.querySelector('.actions input');
    if (!input) return;

    let timer;
    input.addEventListener('keyup', (e) => {
        clearTimeout(timer);
        if (e.key === 'Enter') doSearch(input.value);
        else timer = setTimeout(() => { if (input.value.length >= 2) doSearch(input.value); }, 400);
    });
}

async function doSearch(query) {
    if (!query.trim()) return;
    try {
        const results = await apiFetch(`/api/books?search=${encodeURIComponent(query)}`);
        showSearchResults(results, query);
    } catch { }
}

function showSearchResults(books, query) {
    let panel = document.getElementById('search-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'search-panel';
        panel.className = 'search-panel';
        document.querySelector('.actions').appendChild(panel);
        document.addEventListener('click', e => {
            if (!panel.contains(e.target) && e.target !== document.querySelector('.actions input'))
                panel.remove();
        });
    }
    if (!books.length) {
        panel.innerHTML = `<p style="padding:20px;color:#888">Không tìm thấy sách nào cho "${query}"</p>`;
        return;
    }
    panel.innerHTML = books.slice(0, 5).map(b => `
    <div class="search-item" onclick="showBookDetail('${b.id}');document.getElementById('search-panel')?.remove()">
      <img src="${b.image}" alt="${b.title}">
      <div>
        <strong>${b.title}</strong>
        <span>${b.author} — ${formatPrice(b.price)}</span>
      </div>
    </div>
  `).join('');
}

// ─── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    createModals();
    loadCart();
    await loadUser();
    await loadBooks();
    initSearch();

    // Nút giỏ hàng
    const cartBtn = document.querySelector('.actions button');
    if (cartBtn) cartBtn.onclick = openCart;
});