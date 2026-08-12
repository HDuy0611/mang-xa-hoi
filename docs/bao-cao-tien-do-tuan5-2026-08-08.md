# Báo cáo tiến trình — Tuần 5: Hồ sơ cá nhân & Cài đặt tài khoản

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 08/08/2026
**Phạm vi:** Nối chức năng Hồ sơ cá nhân / Cài đặt ở frontend với backend thật — sửa thông tin cá nhân, đổi ảnh đại diện, đổi mật khẩu

---

## 1. Bối cảnh trước khi làm

Bảng `users` trong database thật ra đã có sẵn các cột `bio`, `location`, `website`, `avatar_url`, `cover_url` từ lúc thiết kế schema ban đầu (tuần 1-2), nhưng chưa có API nào đụng tới, cũng chưa có chỗ nào trên giao diện dùng đến.

Cụ thể tình trạng lúc bắt đầu:

- Trang **Cài đặt** (`Settings.jsx`) chỉ là giao diện tĩnh: các ô nhập dùng `defaultValue`, gõ vào không lưu lại đâu cả, nút "Lưu thay đổi" không gắn sự kiện gì.
- Trang **Trang cá nhân** (`Profile.jsx`) hiển thị toàn dữ liệu mẫu cứng trong code (`mockProfile`): bio, địa chỉ, website, màu nền avatar... không liên quan gì tới người dùng thật đang đăng nhập. Chỉ có tên, username, email là lấy từ `AuthContext`.
- Avatar hiển thị ở khắp nơi (Navbar, trang Tạo bài viết, Trang cá nhân) đều chỉ là chữ cái viết tắt của tên, chưa từng có khái niệm "ảnh đại diện thật".
- `AuthContext` chỉ lưu đúng 4 trường tối thiểu trả về lúc đăng nhập/đăng ký (`id`, `name`, `username`, `email`), không có cách nào lấy thêm bio/avatar sau đó.
- Chưa có API nào để sửa hồ sơ hay đổi mật khẩu.

## 2. Mục tiêu

Làm cho phần "Cài đặt tài khoản" hoạt động thật: sửa được tên/tiểu sử/địa chỉ/website và lưu vào database, đổi được ảnh đại diện, đổi được mật khẩu (có kiểm tra mật khẩu cũ), và đồng bộ ảnh đại diện thật ra mọi nơi trong app thay vì chỉ có initials.

## 3. Các bước đã thực hiện

Việc đầu tiên là làm cho phía máy chủ "hiểu" được các yêu cầu liên quan tới hồ sơ cá nhân — trước đó hệ thống mới chỉ xử lý đăng nhập và đăng ký, còn sửa thông tin, đổi mật khẩu hay đổi ảnh đại diện thì chưa ai làm cả. Nên bước đầu tiên là bổ sung phần xử lý ở backend cho các việc này: lấy về toàn bộ thông tin hồ sơ, cập nhật tên/tiểu sử/địa chỉ/website, đổi mật khẩu (có kiểm tra mật khẩu cũ cho chắc ăn), và tải ảnh đại diện/ảnh bìa lên.

Sau khi phần xử lý phía máy chủ đã xong, vấn đề tiếp theo là làm sao để cả ứng dụng luôn biết đầy đủ thông tin của người đang đăng nhập. Trước đây lúc đăng nhập chỉ lấy được vài thông tin cơ bản như tên, tên đăng nhập, email — còn tiểu sử, địa chỉ, ảnh đại diện thì không nơi nào có cả. Nên đã chỉnh lại phần quản lý phiên đăng nhập của ứng dụng: mỗi khi có người đăng nhập, hệ thống sẽ tự động lấy về đầy đủ hồ sơ, và toàn bộ các trang trong app dùng chung một nguồn thông tin đó, tránh tình trạng mỗi trang hiển thị một kiểu dữ liệu khác nhau.

Có dữ liệu đầy đủ rồi mới nối được trang Cài đặt vào hoạt động thật. Các ô nhập tên, tiểu sử, địa chỉ, website giờ gõ vào là lưu được thật, bấm "Lưu thay đổi" là ghi thẳng vào cơ sở dữ liệu chứ không còn là giao diện giả như trước nữa. Phần đổi ảnh đại diện cũng được làm trong bước này — chỉ cần bấm vào biểu tượng máy ảnh, chọn ảnh là tải lên ngay lập tức. Ngoài ra còn thêm hẳn một khu vực đổi mật khẩu riêng, bắt buộc nhập đúng mật khẩu cũ mới cho đổi sang mật khẩu mới, để tránh trường hợp ai đó ngồi vào máy đã đăng nhập sẵn cũng có thể đổi được mật khẩu người khác.

*(Dán ảnh chụp màn hình trang Cài đặt sau khi sửa hồ sơ vào đây)*

Cuối cùng là làm cho ảnh đại diện thật hiển thị đồng bộ ở mọi nơi trong ứng dụng, thay vì chỉ hiện chữ cái viết tắt tên như trước. Thanh điều hướng trên cùng, trang tạo bài viết và trang cá nhân giờ đều hiển thị đúng ảnh đại diện nếu người dùng đã tải lên, còn ai chưa có ảnh thì vẫn hiện chữ cái như cũ để giao diện không bị trống trải. Trang cá nhân cũng được sửa lại để hiển thị đúng tiểu sử, địa chỉ, website và ngày tham gia thật của người dùng, thay vì dữ liệu mẫu vẫn nằm sẵn trong code từ trước; và nút "Chỉnh sửa trang cá nhân" giờ bấm vào sẽ đưa thẳng sang trang Cài đặt thay vì không phản ứng gì.

*(Dán ảnh chụp màn hình Trang cá nhân hiển thị avatar/bio/địa chỉ thật vào đây)*

## 4. Kết quả kiểm thử

| Kịch bản | Kết quả |
|---|---|
| Sửa tên/tiểu sử/địa chỉ/website, bấm "Lưu thay đổi" | ✅ Lưu vào database, hiện "Đã lưu thay đổi." |
| F5 lại trang Cài đặt sau khi lưu | ✅ Vẫn giữ đúng dữ liệu vừa sửa (lấy từ DB, không phải chỉ lưu tạm trên máy) |
| Tải lên ảnh đại diện mới | ✅ Ảnh hiện ngay ở Cài đặt, đồng bộ luôn sang Navbar và Trang cá nhân |
| Đổi mật khẩu, nhập sai mật khẩu hiện tại | ✅ Báo lỗi "Mật khẩu hiện tại không đúng.", không cho đổi |
| Đổi mật khẩu đúng mật khẩu hiện tại | ✅ Báo "Đổi mật khẩu thành công." |
| Đăng xuất rồi đăng nhập lại bằng mật khẩu mới | ✅ Đăng nhập được, avatar/thông tin cũ vẫn còn nguyên |
| Bấm "Chỉnh sửa trang cá nhân" ở Trang cá nhân | ✅ Điều hướng đúng sang trang Cài đặt |
| Trang cá nhân hiển thị bio/địa chỉ/website/ngày tham gia | ✅ Đúng dữ liệu thật, không còn là dữ liệu mẫu |

Toàn bộ kiểm thử trên được làm hai lớp: gọi trực tiếp API bằng `curl` để chắc chắn backend đúng trước, sau đó thao tác lại trên giao diện thật (Chrome) bằng một tài khoản test riêng để không đụng vào dữ liệu người dùng có sẵn trong database.

## 5. Việc còn thiếu (chưa làm trong buổi này)

- API upload ảnh bìa (`POST /api/users/me/cover`) đã viết xong ở backend nhưng chưa nối nút bấm nào ở giao diện — trang cá nhân vẫn đang ưu tiên hiển thị ảnh bìa mặc định.
- Các mục còn lại trong Cài đặt (Quyền riêng tư, Thông báo, Giao diện, Vô hiệu hóa & Xóa tài khoản) vẫn chỉ là giao diện demo, chưa có API đứng sau.
- Avatar của tác giả bài viết trên bảng tin (`PostCard`) — tức avatar của người khác chứ không phải của mình — vẫn đang dùng gradient + initials, chưa lấy ảnh thật. Muốn sửa thì cần thêm cột `avatar_url` vào câu `SELECT` trong `routes/posts.js`.

## 6. Ghi chú kỹ thuật khác trong ngày

- Không cần chạy migration thêm cột nào cả, vì bảng `users` đã có sẵn `bio/location/website/avatar_url/cover_url` từ trước — chỉ cần viết API dùng tới các cột này.
- Test bằng một tài khoản tạo riêng cho việc kiểm thử (không phải tài khoản chính), để tránh làm lộn xộn dữ liệu người dùng thật đã có trong database.
