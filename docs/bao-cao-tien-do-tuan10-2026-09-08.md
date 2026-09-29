# Báo cáo tiến trình — Tuần 10: Hoàn thiện bộ sơ đồ thiết kế hệ thống (UML & ERD)

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 08/09/2026
**Phạm vi:** Vẽ và hoàn thiện 5 sơ đồ thiết kế kỹ thuật cho dự án bằng draw.io — ERD, Use Case, Class, Sequence, Deployment — lưu tại `C:\world\SƠ ĐỒ`, làm tài liệu tham chiếu cho phần thiết kế hệ thống trong báo cáo đồ án

---

## 1. Kết quả đạt được

- Hoàn thiện 5 sơ đồ thiết kế bằng draw.io, lưu tại `C:\world\SƠ ĐỒ` (`ERD.drawio`, `USECASE.drawio`, `class.drawio`, `developmet.drawio`, `sequence.drawio`)
- Sơ đồ ERD: mô hình hoá 10 bảng dữ liệu chính của hệ thống (USER, POSTS, FRIENDSHIPS, NOTIFICATIONS, USER_SETTINGS, PASSWORD_RESETS, REPORTS, POST_LIKES, COMMENTS, BOOKMARKS), thể hiện đầy đủ khóa chính/khóa ngoại và các quan hệ đặc thù như bảng FRIENDSHIPS tự tham chiếu tới USER qua 2 vai trò requester/addressee, bảng NOTIFICATIONS tham chiếu USER qua 2 vai trò user (người nhận) và actor (người gây ra hành động)
- Sơ đồ Use Case: xác định 2 tác nhân (Người dùng, Quản trị viên) và toàn bộ nhóm chức năng — nhóm người dùng thường (đăng nhập/đăng ký, quên mật khẩu, đăng bài, thích/bình luận/lưu bài, kết bạn/chặn, tìm kiếm, chỉnh sửa hồ sơ và cài đặt, báo cáo vi phạm) và nhóm riêng của quản trị viên (đăng nhập quản trị, quản lý người dùng khóa/mở khóa, quản lý bài viết, xử lý báo cáo, xem thống kê hệ thống), có thể hiện quan hệ include/extend bằng nhãn "điều kiện"/"bắt buộc"
- Sơ đồ Class: chuyển 9 bảng dữ liệu trong ERD thành 9 lớp đối tượng đặt tên tiếng Việt (NGƯỜI DÙNG, BÀI VIẾT, KẾT BẠN BÈ, THÔNG BÁO, BÁO CÁO VI PHẠM, CÀI ĐẶT NGƯỜI DÙNG, YÊU CẦU ĐẶT LẠI MẬT KHẨU, BÌNH LUẬN, ĐÃ LƯU), bổ sung các phương thức nghiệp vụ tương ứng chức năng thật của hệ thống (ví dụ lớp NGƯỜI DÙNG có dangKy(), dangNhap(), dangNhapGoogle(), capNhatHoSo(), doiMatKhau())
- Sơ đồ Sequence: minh hoạ chi tiết luồng xử lý chức năng "Thích bài viết" theo đúng cách hệ thống thật đang chạy — từ thao tác bấm icon trái tim trên `PostCard.jsx`, qua Axios tự đính kèm JWT vào header Authorization, Vite dev server proxy sang Express cổng 4000, middleware `requireAuth` xác thực token, đến truy vấn/ghi CSDL (SELECT kiểm tra đã thích chưa, rồi INSERT hoặc DELETE `post_likes` tương ứng, kèm INSERT `notifications` khi thích mới), và phản hồi JSON để cập nhật lại giao diện
- Sơ đồ Deployment: mô tả đúng kiến trúc triển khai thật của hệ thống hiện tại — máy người dùng (trình duyệt) gọi tới máy chủ phát triển chạy SPA React 19 qua Vite Dev Server cổng 5173, máy chủ ứng dụng chạy Node.js/Express cổng 4000 với middleware xác thực và multer lưu ảnh vào thư mục uploads, máy chủ CSDL MySQL 8 cổng 3306 qua mysql2/promise, cùng các dịch vụ ngoài Google OAuth, Facebook Graph API và SMTP server phục vụ đặt lại mật khẩu

## 2. Khó khăn

- Quan hệ bạn bè trong FRIENDSHIPS là quan hệ tự tham chiếu 2 chiều (một USER vừa có thể là requester vừa có thể là addressee tùy lời mời), draw.io không có ký hiệu ERD chuẩn sẵn cho kiểu quan hệ này nên phải tự vẽ 2 đường nối riêng và ghi nhãn thủ công để phân biệt vai trò
- Sơ đồ Sequence chỉ chọn minh hoạ một chức năng duy nhất ("Thích bài viết") trong khi hệ thống có hàng chục chức năng khác cùng dạng luồng xử lý tương tự (bình luận, lưu bài, kết bạn...), nên sơ đồ này chỉ mang tính đại diện chứ chưa bao quát hết toàn bộ nghiệp vụ
- Sơ đồ Deployment thể hiện đúng thực tế multer đang lưu ảnh trực tiếp lên ổ đĩa cục bộ của máy chủ ứng dụng (thư mục uploads) thay vì dùng dịch vụ lưu trữ ngoài, đây là điểm giới hạn về khả năng mở rộng cần lưu ý nếu sau này triển khai lên nhiều máy chủ

## 3. Xử lý

- Với quan hệ tự tham chiếu của FRIENDSHIPS, dùng shape quan hệ (relationship) thường của draw.io, kéo 2 đường nối riêng biệt từ bảng FRIENDSHIPS về bảng USER rồi gắn nhãn "requester" và "addressee" ngay trên từng đường nối thay vì cố tìm ký hiệu UML "đúng chuẩn" không tồn tại
- Chọn "Thích bài viết" làm ví dụ minh hoạ vì đây là luồng xử lý ngắn gọn nhưng đầy đủ các thành phần chính của kiến trúc (xác thực JWT, proxy dev server, truy vấn có điều kiện rẽ nhánh, ghi thông báo), đủ đại diện cho cách các chức năng tương tự khác vận hành mà không cần vẽ lặp lại nhiều sơ đồ giống nhau
- Ghi chú rõ trực tiếp trên sơ đồ Deployment phần "Uploads" là lưu trên ổ đĩa cục bộ, giữ nguyên hiện trạng thay vì vẽ theo kiến trúc lý tưởng chưa triển khai, để sơ đồ phản ánh đúng hệ thống đang chạy thật
