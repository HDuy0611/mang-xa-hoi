# Báo cáo tiến trình — Tuần 7: Vai trò Quản trị viên (Admin)

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 15/08/2026
**Phạm vi:** Triển khai vai trò Admin đã thiết kế trong sơ đồ Use Case tuần 6 thành chức năng thật trên backend-nodejs — xem thống kê hệ thống, quản lý/khóa tài khoản người dùng, kiểm duyệt bài viết

---

## 1. Bối cảnh trước khi làm

Trước buổi làm việc này, hệ thống có tình trạng:

- Sơ đồ Use Case vẽ ở tuần 6 đã thiết kế vai trò Admin với 4 nhóm quyền: quản lý người dùng, kiểm duyệt nội dung, khóa/mở khóa tài khoản, xem thống kê tổng quan — nhưng chưa có một dòng code nào triển khai.
- Cột `role` trong bảng `users` đã có sẵn từ lúc thiết kế schema ban đầu (mặc định `'user'`), nhưng không API nào đọc hay ghi giá trị này ngoài lúc tạo tài khoản mới.
- Chưa có khái niệm "khóa tài khoản" — bảng `users` chưa có cột nào đánh dấu trạng thái này.
- Navbar chỉ có 5 mục cố định (Trang chủ, Bạn bè, Thông báo, Đã lưu, Cài đặt), chưa có chỗ nào dẫn tới trang quản trị vì trang đó chưa tồn tại.
- Không có cách nào để một tài khoản trở thành Admin ngoài việc sửa tay trong database.

→ Kết luận: Admin mới dừng ở bản vẽ trên sơ đồ, chưa chạm được vào dữ liệu thật.

## 2. Mục tiêu

Triển khai 3 nhóm chức năng Admin đã vẽ trong Use Case tuần trước lên backend-nodejs và giao diện thật: xem thống kê tổng quan hệ thống, quản lý và khóa/mở khóa tài khoản người dùng, kiểm duyệt (xóa) bài viết vi phạm — kèm chặn đăng nhập cho tài khoản đã bị khóa.

## 3. Các bước đã thực hiện

### Bước 1 — Thêm cột `is_locked` và middleware kiểm tra quyền Admin

- Thêm cột `is_locked BOOLEAN NOT NULL DEFAULT FALSE` vào bảng `users` (ALTER có kiểm tra tồn tại trước trong `scripts/migrate.js`), chạy migration thật trên database `nova_db`.
- Viết middleware `requireAdmin` trong `middleware/auth.js`: chạy sau `requireAuth`, tra `role` của user hiện tại trong database, nếu khác `'admin'` thì trả lỗi 403.

### Bước 2 — Xây dựng API quản trị (`routes/admin.js`)

- `GET /api/admin/stats`: đếm tổng số người dùng, bài viết, bình luận, và tài khoản đang bị khóa.
- `GET /api/admin/users?search=`: danh sách người dùng kèm bộ lọc theo tên/username/email.
- `PATCH /api/admin/users/:id/lock` và `/unlock`: khóa/mở khóa một tài khoản — chặn không cho tự khóa chính mình và không cho khóa một admin khác.
- `GET /api/admin/posts?search=`: danh sách bài viết kèm bộ lọc theo nội dung hoặc tác giả.
- `DELETE /api/admin/posts/:id`: admin xóa được bài viết của bất kỳ ai, khác với route xóa bài viết thường (chỉ chủ bài mới xóa được).
- Toàn bộ route trong file đều bọc chung bằng `requireAuth` + `requireAdmin` ngay từ đầu router.

### Bước 3 — Chặn đăng nhập cho tài khoản bị khóa

- Route đăng nhập email/mật khẩu: sau khi xác nhận đúng mật khẩu, kiểm tra `is_locked`, nếu `true` thì trả lỗi 403 "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
- Áp dụng chặn tương tự cho cả đăng nhập Google và Facebook, vì cả hai đường này đều dùng chung hàm `findOrCreateOAuthUser` trả về nguyên hàng dữ liệu người dùng.
- Đưa `role` vào SELECT của route `/api/users/me` và vào dữ liệu trả về khi đăng nhập, để frontend biết được ai đang là admin.

### Bước 4 — Trang Quản trị trên giao diện

- Trang mới `src/admin/Admin.jsx`: 3 tab — Tổng quan (4 thẻ thống kê), Người dùng (danh sách kèm nút khóa/mở khóa và ô tìm kiếm), Bài viết (danh sách kèm nút xóa và ô tìm kiếm).
- Route `/admin` bọc bằng component `AdminRoute` mới trong `App.jsx`: chưa đăng nhập thì về `/login`, đã đăng nhập nhưng không phải admin thì về trang chủ, không hiện thông báo "không có quyền" lộ liễu.
- Navbar chỉ hiện mục "Quản trị" khi `user.role === 'admin'` — người dùng thường không thấy mục này tồn tại.

*(Dán ảnh chụp màn hình 3 tab của trang Quản trị vào đây)*

## 4. Kết quả kiểm thử

| Kịch bản | Kết quả |
|---|---|
| Tài khoản thường (role=user) gọi thẳng API `/api/admin/stats` | ✅ Trả 403 "Bạn không có quyền truy cập chức năng này." |
| Tài khoản Admin mở tab Tổng quan | ✅ Hiển thị đúng số người dùng / bài viết / bình luận / tài khoản đang bị khóa |
| Admin khóa một tài khoản, tài khoản đó thử đăng nhập lại | ✅ Báo "Tài khoản của bạn đã bị khóa...", không vào được |
| Admin mở khóa lại tài khoản vừa khóa | ✅ Đăng nhập lại được bình thường |
| Admin tự khóa chính mình / khóa một admin khác | ✅ Bị chặn với thông báo lỗi tương ứng |
| Admin xóa một bài viết ở tab Bài viết | ✅ Bài viết biến mất khỏi cả trang quản trị lẫn bảng tin |
| Tài khoản thường truy cập thẳng URL `/admin` | ✅ Tự động chuyển về trang chủ, không thấy được nội dung |
| Tìm kiếm người dùng / bài viết theo từ khóa | ✅ Lọc đúng kết quả theo tên, username, email hoặc nội dung |

Kiểm thử làm hai lớp như mọi tuần trước: gọi thẳng API bằng `curl` để chắc chắn backend đúng, sau đó thao tác lại trên giao diện thật (Chrome) bằng các tài khoản test riêng để không đụng vào dữ liệu người dùng có sẵn.

## 5. Việc còn thiếu (chưa làm trong buổi này)

- Chỉ mới triển khai trên `backend-nodejs`. `backend-c#` hiện đang được giữ nguyên trạng theo quyết định từ trước (dùng cho một đề tài báo cáo song song), nên khi frontend đang trỏ sang `backend-c#` (cấu hình đã đổi ở tuần 6), mục "Quản trị" và các API liên quan sẽ không hoạt động cho tới khi đổi proxy sang `backend-nodejs` hoặc làm thêm bản C# tương đương.
- Danh sách người dùng / bài viết trong trang quản trị giới hạn 100 dòng đầu, chưa có phân trang.
- Chưa có nhật ký (log) ghi lại admin nào đã khóa/xóa gì vào lúc nào — hiện chỉ thấy trạng thái hiện tại, không thấy lịch sử.
- Cách duy nhất để một tài khoản trở thành Admin vẫn là sửa tay cột `role` trong database, chưa có giao diện "cấp quyền admin" để admin hiện tại tự thao tác.
- Mục "Quản trị" trên thanh điều hướng khi hiện lên làm cụm nav bị tràn nhẹ so với lúc chỉ có 5 mục — chưa chỉnh lại khoảng đệm cho trường hợp 6 mục.

## 6. Ghi chú kỹ thuật khác trong ngày

- Tài khoản admin đầu tiên được cấp bằng cách chạy UPDATE trực tiếp trên database cho tài khoản chính (`nguyenhoangduy06112006`), không đụng tới tài khoản người dùng thật nào khác.
- Trong lúc kiểm thử phát hiện một lỗi nhỏ ở giao diện: `is_locked` lấy từ MySQL trả về là số `0`/`1` chứ không phải `true`/`false`, mà đoạn code lúc đó viết `{u.isLocked && (...)}` nên React in hẳn số "0" ra màn hình ở chỗ đáng lẽ phải ẩn đi — sửa lại thành `{!!u.isLocked && (...)}` để ép về đúng kiểu boolean.
- Toàn bộ kiểm thử tạo 3 tài khoản test riêng (không đụng dữ liệu người dùng thật); sau khi xác nhận mọi thứ hoạt động đã xóa sạch các tài khoản này khỏi database.
- Phát hiện lại rằng cấu hình proxy của frontend (`vite.config.js`) hiện đang trỏ sang `backend-c#` (cổng 5080) theo thay đổi từ tuần 6, không phải `backend-nodejs` (cổng 4000) — phải tạm đổi proxy sang 4000 để kiểm thử tính năng mới, rồi đổi lại đúng như cũ sau khi xong để không ảnh hưởng cấu hình đang chạy.
