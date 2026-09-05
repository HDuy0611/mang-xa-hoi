# Báo cáo tiến trình — Tuần 9: Thử nghiệm giao diện tối theo chủ đề hoàng hôn (SUNSET)

**Dự án:** NOVA (mạng xã hội)
**Ngày:** 02/09/2026
**Phạm vi:** Thử nghiệm đổi màu chế độ tối theo đúng tên đồ án "SUNSET" — bắt đầu từ thanh điều hướng, sau đó mở rộng ra toàn bộ bảng màu chế độ tối (nền, chữ, viền, bóng đổ), rồi khôi phục lại bảng màu tối ban đầu theo quyết định cuối cùng, không đổi gì ở chế độ sáng

---

## 1. Kết quả đạt được

- Đổi màu thanh điều hướng ở chế độ tối thành dải gradient theo tông hoàng hôn (tím than, hồng tía, cam, vàng gold), đúng tên đồ án "SUNSET", chỉ áp dụng cho chế độ tối bằng cách sửa biến `--nav-bg` trong khối `:root[data-theme="dark"]` của `src/core/index.css`
- Từ đó dựng thử một bảng màu tối đầy đủ theo cùng chủ đề: đổi `--bg`, `--surface`, `--surface-2` sang tông đen ngả tím, `--text`, `--text-2`, `--text-3` sang trắng ngà ấm, `--accent`, `--purple` sang cam san hô và hồng tía, cùng `--border`, `--shadow`, `--overlay-rgb` theo tông ấm tương ứng
- Mở app thật trên Chrome (localhost:5173) sau mỗi lần đổi màu, kiểm tra trên các trang Trang chủ, Cài đặt, Trang cá nhân để xác nhận hiển thị đúng và không vỡ bố cục trước khi đổi tiếp
- Xác nhận trong suốt quá trình thử nghiệm chế độ sáng không hề bị ảnh hưởng, vì mọi thay đổi chỉ nằm trong khối biến riêng của chế độ tối, đúng yêu cầu ban đầu
- Theo quyết định cuối cùng, khôi phục lại toàn bộ bảng màu chế độ tối về đúng giá trị gốc, hiện tại giao diện tối trở lại như trước khi bắt đầu thử nghiệm

## 2. Khó khăn

- Giữ chế độ sáng nguyên vẹn trong khi liên tục đổi thử nhiều phiên bản màu cho chế độ tối, dễ sửa nhầm sang khối biến dùng chung cho cả hai chế độ nếu không để ý kỹ
- Một phần màu cam/nâu của giao diện (nút "Tạo bài viết", viền ảnh đại diện, số thông báo chưa đọc...) đang được viết cứng thẳng bằng mã màu ngay trong hơn 20 file giao diện thay vì lấy từ biến `--accent`/`--purple`, nên khi đổi bảng màu tối những chỗ này không tự đổi theo, muốn đồng bộ toàn bộ sẽ phải sửa rất nhiều file cùng lúc
- Sau vài lần đổi qua lại theo phản hồi (đổi nền sang tím, rồi sang đen ngả tím, rồi quay lại đen cũ), có lúc mép trái của thanh điều hướng và phần nền phía dưới bị lệch tông, không liền mạch với nhau

## 3. Xử lý

- Tận dụng đúng kiến trúc biến CSS có sẵn của dự án, mọi thay đổi chỉ sửa trong khối `:root[data-theme="dark"]`, không đụng vào khối `:root` của chế độ sáng, nên chế độ sáng chắc chắn không đổi mà không cần dò lại từng dòng
- Với phần màu viết cứng ở hơn 20 file, quyết định chưa sửa trong đợt thử nghiệm này để tránh rủi ro lan rộng ra nhiều nơi cùng lúc, chỉ ghi nhận lại như một việc có thể chuẩn hoá sau nếu cần đồng bộ toàn bộ giao diện theo chủ đề
- Mỗi lần đổi màu nền đều canh lại điểm đầu của dải gradient thanh điều hướng cho khớp đúng màu nền ngay bên dưới để hai phần liền mạch với nhau
- Khi được yêu cầu khôi phục, đổi lại từng biến về đúng giá trị ban đầu rồi đọc lại toàn bộ file CSS và so với lịch sử git để xác nhận khớp 100% với bản gốc trước khi coi là xong
