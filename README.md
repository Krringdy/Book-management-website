# Dunavitu Books

Website bán sách trực tuyến, xây dựng theo mô hình fullstack: frontend HTML/CSS/JavaScript thuần và backend Node.js/Express kết nối MySQL. Có trang quản trị (admin) để quản lý sách, danh mục và đơn hàng.

## Tính năng

- Xem danh sách sách theo danh mục
- Đặt hàng, xem lịch sử đơn hàng
- Đăng ký / đăng nhập người dùng
- Trang quản trị (admin) để thêm/sửa/xóa sách, quản lý đơn hàng

## Công nghệ sử dụng

**Frontend:** HTML, CSS, JavaScript thuần
**Backend:** Node.js, Express
**Database:** MySQL
**Khác:** bcryptjs (mã hóa mật khẩu), express-session (quản lý phiên đăng nhập), cors, dotenv

## Cấu trúc thư mục

```
dunavitu-books/
├── README.md
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── modal-styles.css
│   └── pages/
│       ├── admin.html / admin.js / admin.css
│       ├── orders.html
│       ├── script_orders.js
│       └── style_orders.css
└── backend/
    ├── server.js
    ├── db.js
    ├── database.sql      # schema database
    ├── package.json
    ├── .env.example      ← thay cho .env
    └── routes/
        ├── auth.js
        ├── books.js
        ├── categories.js
        ├── orders.js
        └── users.js
```

## Cài đặt và chạy thử

1. Clone repo về máy:
   ```bash
   git clone <link-repo-cua-ban>
   cd dunavitu-books
   ```

2. Cài đặt XAMPP (hoặc MySQL server bất kỳ), tạo database và import file `dunavitu-backend/database.sql`.

3. Cài dependencies cho backend:
   ```bash
   cd dunavitu-backend
   npm install
   ```

4. Tạo file `.env` từ mẫu `.env.example` và điền thông tin database của bạn:
   ```bash
   cp .env.example .env
   ```

5. Chạy backend:
   ```bash
   npm run dev
   ```

6. Mở file `index.html` (frontend) bằng Live Server hoặc trình duyệt để sử dụng.

## Định hướng cải thiện

- [ ] Tách frontend/backend rõ ràng hơn trong cấu trúc thư mục
- [ ] Thêm validate dữ liệu đầu vào ở backend
- [ ] Viết unit test cho các route API
- [ ] Responsive tốt hơn cho giao diện mobile

## Ghi chú

Đây là project cá nhân được thực hiện trong quá trình học đại học, dùng để thực hành xây dựng ứng dụng web fullstack hoàn chỉnh từ giao diện đến backend và database.
