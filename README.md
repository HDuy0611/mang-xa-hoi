# SUNSET - Mạng xã hội thu nhỏ

Đồ án React + Node.js: xây dựng mạng xã hội thu nhỏ (đăng bài, kết bạn, thông báo, báo cáo vi phạm, trang quản trị...).

- Frontend: React 19 + Vite
- Backend: Node.js + Express
- Database: MySQL

## Cài đặt và chạy (môi trường phát triển cục bộ)

### 1. Cơ sở dữ liệu

```
mysql -u root -p < backend-nodejs/sql/schema.sql
cd backend-nodejs && node scripts/migrate.js
```

### 2. Cấu hình biến môi trường

Sao chép `.env.example` thành `.env` ở cả thư mục gốc và `backend-nodejs/`, điền các giá trị cần thiết (thông tin kết nối MySQL, JWT secret, SMTP nếu muốn gửi email đặt lại mật khẩu thật, Google/Facebook OAuth Client ID nếu muốn dùng đăng nhập mạng xã hội).

### 3. Chạy Backend (cổng 4000)

```
cd backend-nodejs
npm install
npm run dev
```

### 4. Chạy Frontend (cổng 5173)

```
npm install
npm run dev
```

### 5. Truy cập trang chính

Mở trình duyệt tại **http://localhost:5173**, đăng ký một tài khoản người dùng bình thường để dùng thử các chức năng.

### 6. Truy cập trang Quản trị (Admin)

Trang Quản trị dùng địa chỉ đăng nhập riêng, không có liên kết công khai trên giao diện chính. Một tài khoản quản trị mặc định đã được tự động tạo sẵn khi chạy `node scripts/migrate.js` ở bước 1:

- **Tài khoản:** `admin`
- **Mật khẩu:** `admin`

Mở **http://localhost:5173/admin-portal**, đăng nhập bằng tài khoản trên. Hệ thống sẽ tự chuyển vào trang Quản trị tại `/admin`.

> **Lưu ý thứ tự:** phải chạy xong Backend + Frontend trước (mục 3, 4), vì trang Quản trị dùng chung backend/database với trang chính.

## Phiên bản backend C#

Phiên bản dùng backend C# ASP.NET Core (kèm trang quản trị riêng `admin-web`) nằm ở nhánh [`backend-csharp`](https://github.com/HDuy0611/mang-xa-hoi/tree/backend-csharp)
