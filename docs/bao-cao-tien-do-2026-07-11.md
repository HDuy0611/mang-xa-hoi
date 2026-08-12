# Báo cáo tiến trình — Hoàn thiện chức năng Đăng nhập/Đăng ký

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 11/07/2026
**Phạm vi:** Nối chức năng Đăng nhập frontend với backend, quản lý phiên đăng nhập, bảo vệ route

---

## 1. Bối cảnh trước khi làm

Trước buổi làm việc này, hệ thống có tình trạng:

- Backend (Node.js và C#) đã có sẵn 2 API: `POST /api/auth/register` và `POST /api/auth/login`, hoạt động đúng, đã test bằng curl.
- Frontend React: trang **Đăng ký** (`Register.jsx`) đã gọi API thật.
- Trang **Đăng nhập** (`Login.jsx`) **chỉ là giao diện tĩnh** — nút bấm không có sự kiện, 2 ô nhập liệu không lưu giá trị, không gọi API nào cả.
- Không có nơi nào lưu lại token sau khi đăng nhập (không `localStorage`, không state toàn cục).
- Mọi trang trong app (Trang chủ, Trang cá nhân, Cài đặt...) đều xem được **mà không cần đăng nhập**.
- Nút "Đăng xuất" chỉ chuyển trang, không xóa gì cả.

→ Kết luận: có API nhưng frontend chưa "biết" ai đang đăng nhập, và không hề bảo vệ dữ liệu.

## 2. Mục tiêu

Hoàn thiện 4 phần còn thiếu để chức năng đăng nhập hoạt động đầy đủ, khép kín vòng đời phiên đăng nhập (login → lưu phiên → bảo vệ trang → logout).

## 3. Các bước đã thực hiện

### Bước 1 — Tạo trạng thái đăng nhập dùng chung toàn app

**File mới:** `src/core/AuthContext.jsx`

Dùng React Context để tạo một "kho dữ liệu" chứa `token`, `user` mà mọi component trong app đều đọc/ghi được thông qua hook `useAuth()`.

- Khi app khởi động, tự đọc token đã lưu trong `localStorage` (nếu có) → giữ được phiên đăng nhập qua các lần F5/đóng mở lại trình duyệt.
- Hàm `login(token, user)`: lưu token + thông tin user vào `localStorage` và cập nhật state.
- Hàm `logout()`: xóa sạch token/user khỏi `localStorage` và state.
- `useEffect` tự động gắn header `Authorization: Bearer <token>` vào mọi request axios sau này khi có token, gỡ ra khi không có.

### Bước 2 — Bảo vệ route (chặn xem khi chưa đăng nhập)

**File sửa:** `src/core/App.jsx`

- Viết component `ProtectedRoute`: kiểm tra `isAuthenticated` từ Context; nếu **chưa đăng nhập** → tự động chuyển hướng về `/login`; nếu đã đăng nhập → hiển thị trang bình thường.
- Bọc tất cả các route cần đăng nhập (Trang chủ, Trang cá nhân, Khám phá, Thông báo, Bạn bè, Đã lưu, Cài đặt, Tạo bài viết) bằng `<ProtectedRoute>`.
- Các trang công khai (`/login`, `/register`, `/forgot-password`) không bị bọc, để người dùng vào được mà đăng nhập.
- Bọc `<AuthProvider>` ở gốc cây component (bao ngoài `<App />`) để toàn bộ app dùng được Context.

### Bước 3 — Nối form Đăng nhập vào API thật

**File sửa:** `src/login/Login.jsx`

- Thêm state quản lý `email`, `password`, `error`, `loading`.
- Viết hàm `handleSubmit`: gọi `axios.post('/api/auth/login', { email, password })`.
  - Thành công → gọi `login(token, user)` từ Context để lưu phiên, rồi chuyển về trang chủ.
  - Thất bại → hiển thị thông báo lỗi trả về từ backend (ví dụ: "Email hoặc mật khẩu không đúng.").
- Bọc form bằng thẻ `<form onSubmit={handleSubmit}>` để hỗ trợ submit bằng phím Enter.
- Cập nhật component `InputField` để nhận `value`/`onChange` (trước đó là input "câm", gõ vào không lưu).
- Cập nhật component `GradientBtn` thành `type="submit"`, thêm trạng thái `disabled` khi đang gọi API.

### Bước 4 — Đăng xuất xóa phiên thật

**File sửa:** `src/components/LeftSidebar.jsx`

- Thêm hàm `handleLogout()`: gọi `logout()` từ Context (xóa token khỏi `localStorage` + state) **trước khi** chuyển hướng về `/login`.
- Gắn `handleLogout` vào nút "Đăng xuất" (trước đó chỉ `navigate('/login')`, không xóa gì).

## 4. Kết quả kiểm thử

| Kịch bản | Kết quả |
|---|---|
| Truy cập `/` khi chưa đăng nhập | ✅ Tự động chuyển về `/login` |
| Đăng nhập đúng email/mật khẩu | ✅ Lưu token, chuyển về trang chủ |
| Đăng nhập sai mật khẩu | ✅ Hiện lỗi "Email hoặc mật khẩu không đúng." |
| F5 lại trang sau khi đăng nhập | ✅ Vẫn giữ phiên (nhờ `localStorage`) |
| Bấm "Đăng xuất" | ✅ Xóa token, chuyển về `/login`, không vào lại được trang cũ |
| Biên dịch frontend (Vite HMR) | ✅ Không lỗi |

## 5. Việc còn thiếu (chưa làm trong buổi này)

- Quên mật khẩu thật (gửi email) — backend chưa có endpoint, frontend đang giả lập.
- Đăng nhập bằng Google/Facebook — mới có giao diện, chưa có OAuth thật.
- Hiển thị tên/avatar người dùng thật trên Navbar, Profile... (hiện vẫn là dữ liệu mẫu cứng "Hoàng Duy").
- Xử lý token hết hạn (JWT hết hạn sau 7 ngày nhưng frontend chưa tự phát hiện và đăng xuất khi token hết hạn).

## 6. Ghi chú kỹ thuật khác trong ngày

Ngoài 4 bước trên, trong ngày còn thực hiện:

- Dịch toàn bộ giao diện NOVA sang tiếng Việt (phong cách Facebook).
- Xây dựng backend C# (ASP.NET Core) song song với backend Node.js, cùng chức năng đăng ký/đăng nhập, dùng database MySQL riêng (`nova_csharp`) để phục vụ 2 đề tài độc lập.
- Đổi tên thư mục `backend` → `backend-nodejs`, `backend-csharp` → `backend-c#`.
- Đổi tên database `nova` → `nova_nodejs_db`, đổi tên user MySQL `nova_db` → `nova_nodejs_db` cho đồng bộ, dễ phân biệt với `nova_csharp_db`.
