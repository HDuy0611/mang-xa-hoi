# SUNSET - Mạng xã hội thu nhỏ

Đồ án xây dựng mạng xã hội thu nhỏ: đăng bài kèm ảnh, thích/bình luận, kết bạn, thông báo thời gian thực, tìm kiếm, lưu bài, báo cáo vi phạm và trang quản trị riêng.

- Backend: C# ASP.NET Core 9 Web API (Dapper + MySqlConnector, SignalR) - thư mục `backend-c#`
- Frontend: React 19 + Vite - thư mục gốc (`src/`)
- Trang quản trị: React + Vite, ứng dụng riêng - thư mục `admin-web`
- Database: MySQL 8

## Cần cài trước

| Phần mềm | Dùng cho |
|---|---|
| [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) | Chạy backend C# |
| [Node.js 20+](https://nodejs.org/) (kèm npm) | Cài thư viện và chạy giao diện React (frontend + admin-web). Backend **không** dùng Node.js |
| [MySQL 8](https://dev.mysql.com/downloads/mysql/) | Cơ sở dữ liệu |

## Cài đặt và chạy

### 1. Tạo cơ sở dữ liệu

```
mysql -u root -p < backend-c#/sql/schema.sql
```

Lệnh này tạo database `nova_db`, đủ 10 bảng và sẵn một tài khoản quản trị (xem mục 5).

### 2. Cấu hình và chạy Backend (cổng 5080)

Sao chép `backend-c#/appsettings.json.example` thành `backend-c#/appsettings.json`, rồi điền:

- `ConnectionStrings:Default`: thông tin đăng nhập MySQL của bạn, ví dụ `Server=localhost;Database=nova_db;User=root;Password=matkhau;`
- `Jwt:Secret`: một chuỗi bất kỳ **dài ít nhất 32 ký tự**
- (không bắt buộc) `Google:ClientId`, `Facebook:AppId/AppSecret` nếu muốn đăng nhập bằng Google/Facebook, `Smtp` nếu muốn gửi email quên mật khẩu

```
cd backend-c#
dotnet run --urls http://localhost:5080
```

Nếu thiếu `appsettings.json` hoặc chưa điền đủ, backend sẽ dừng ngay và báo thiếu cấu hình nào.

### 3. Chạy Frontend (cổng 5173)

Sao chép `.env.example` thành `.env` ở thư mục gốc (giữ nguyên `VITE_REALTIME=signalr` để nhận thông báo tức thời), rồi:

```
npm install
npm run dev
```

Mở **http://localhost:5173** và đăng ký một tài khoản để dùng thử.

### 4. Chạy Trang quản trị (cổng 5174)

```
cd admin-web
npm install
npm run dev
```

### 5. Đăng nhập Trang quản trị

Mở **http://localhost:5174**, đăng nhập bằng tài khoản quản trị tạo sẵn ở bước 1:

- **Tài khoản:** `admin`
- **Mật khẩu:** `admin`

> Thứ tự chạy: Backend (bước 2) phải chạy trước, vì cả trang chính và trang quản trị đều gọi API qua cùng một backend.

## Ghi chú

- Ảnh người dùng tải lên được lưu trong `backend-c#/uploads` (đổi được qua `Uploads:Path` trong `appsettings.json`).
- Tài khoản quản trị không đăng nhập được ở trang chính, chỉ đăng nhập được ở trang quản trị.
