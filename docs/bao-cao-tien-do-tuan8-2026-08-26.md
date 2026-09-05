# Báo cáo tiến trình — Tuần 8: Giao diện quản trị và chức năng báo cáo/xử lý vi phạm

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 26/08/2026
**Phạm vi:** Hoàn thiện lại trang Quản trị và xây dựng chức năng người dùng báo cáo vi phạm để admin xử lý (cảnh cáo, khóa có thời hạn hoặc vĩnh viễn) — thay cho hướng cấp quyền admin/nhật ký thao tác đã bỏ.

---

## 1. Giao diện quản trị

Trang Quản trị có 4 tab:

- **Tổng quan**: 5 thẻ thống kê — số người dùng, số bài viết, số bình luận, số tài khoản đang bị khóa, và số báo cáo đang chờ xử lý.
- **Người dùng**: tìm kiếm theo tên/username/email, có phân trang; mỗi người dùng chỉ còn nút Khóa/Mở khóa (đã bỏ hẳn nút cấp quyền admin).
- **Bài viết**: tìm kiếm theo nội dung/tác giả, có phân trang; nút Xóa cho từng bài.
- **Báo cáo** (mới thay cho tab Nhật ký cũ): lọc theo trạng thái (Chờ xử lý / Đã xử lý / Đã bỏ qua / Tất cả). Mỗi báo cáo hiện rõ ai báo cáo, báo cáo ai/bài viết nào, lý do, và 3 nút hành động — **Cảnh cáo**, **Khóa**, **Bỏ qua**. Bấm Cảnh cáo hoặc Khóa sẽ mở một khung riêng để admin nhập thông tin trước khi xác nhận, thay vì thực hiện ngay.

Ngoài ra đã dọn gọn tiêu đề trang: bỏ icon và dòng mô tả phụ ở đầu trang "Đã lưu" và "Quản trị hệ thống", chỉ còn lại tên trang.

## 2. Chức năng

- **Người dùng thường** có thể báo cáo một bài viết (từ menu "..." trên bài viết của người khác) hoặc báo cáo thẳng một tài khoản (nút trên trang cá nhân người đó), kèm theo lý do tự viết.
- **Quản trị viên** xử lý mỗi báo cáo đang chờ theo một trong ba cách:
  - **Cảnh cáo**: quản trị viên tự viết lý do cảnh cáo (không bắt buộc lấy nguyên lý do của người báo cáo) — hệ thống gửi thành một thông báo tới tài khoản bị cảnh cáo, xem được trong mục Thông báo.
  - **Khóa**: chọn "Có thời hạn" (nhập số ngày) hoặc "Vĩnh viễn" trong cùng một khung, kèm lý do khóa bắt buộc.
  - **Bỏ qua**: đóng báo cáo mà không áp dụng hình phạt.
- Tài khoản bị khóa nhìn thấy đúng thời hạn (hoặc "vĩnh viễn") và lý do bị khóa ngay khi thử đăng nhập.
- Tài khoản bị khóa có thời hạn tự động mở khóa khi hết hạn, không cần admin thao tác thủ công.
- Đã bỏ hẳn hai chức năng cũ không còn dùng: cấp quyền admin qua giao diện, và nhật ký ghi lại thao tác admin — toàn bộ được thay bằng luồng báo cáo → cảnh cáo/khóa/bỏ qua ở trên.
