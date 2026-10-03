# 09 — HƯỚNG DẪN BẢO VỆ

> Trạng thái: **ĐỀ XUẤT**. Đáp án dựa trên thiết kế trong bộ tài liệu này. Nếu bạn thay đổi thiết kế, hãy sửa đáp án tương ứng.

## 1. Bài giới thiệu 2 phút

> "Đề tài là hệ thống quản lý và đặt sân thể thao cho **một cơ sở có nhiều sân**. Có **ba nhóm người dùng**: khách hàng đặt sân qua **ứng dụng di động**; nhân viên và quản trị viên vận hành qua **Web**. Cả hai dùng chung **một backend Node.js + Express** và cơ sở dữ liệu **MySQL**.
> Điểm cốt lõi của hệ thống là **đặt theo khung giờ cố định, giá theo loại sân – khung giờ – ngày thường/cuối tuần**, và **không bao giờ để hai người đặt trùng một giờ**, kể cả khi bấm cùng lúc, nhờ ràng buộc UNIQUE ở cơ sở dữ liệu.
> Mỗi đơn có vòng đời rõ ràng: chờ thanh toán, đã xác nhận, hoàn thành, hủy, hết hạn, vắng mặt. Hệ thống có giữ chỗ 30 phút, chính sách hủy và hoàn tiền, đặt hộ tại quầy cho khách vãng lai, và báo cáo doanh thu."

## 2. Kịch bản demo (10 bước, ~8 phút)

| # | Việc làm | Thể hiện |
|---|---|---|
| 1 | Mobile: đăng ký/đăng nhập khách A | Auth |
| 2 | Mobile: chọn sân 5A, ngày mai, thấy lịch trống và giá khác nhau giờ cao điểm | Ma trận giá |
| 3 | Mobile: chọn 2 giờ liền kề, thanh toán **chuyển khoản** → thấy đếm ngược và thông tin CK | Giữ chỗ, BR-07 |
| 4 | Web (nhân viên): mở **Lịch sân**, thấy ô vàng "Chờ thanh toán" → ghi nhận thanh toán → chuyển xanh | Vận hành, STF-06 |
| 5 | **Đua đặt chỗ:** mở 2 trình duyệt/thiết bị cùng đặt một slot, bấm gần như đồng thời → một bên báo "Khung giờ vừa có người đặt" | Chống trùng lịch ⭐ |
| 6 | Mobile: khách A hủy đơn đã trả → Web: **Chờ hoàn tiền** → xác nhận | Hủy, hoàn tiền |
| 7 | Web: đặt tại quầy cho khách vãng lai, thu tiền mặt | Đặt hộ, BR-17 |
| 8 | Web: hoàn thành một đơn, đánh dấu no-show một đơn | Vòng đời |
| 9 | Web (admin): đổi giá, thử chuyển sân bảo trì khi còn đơn → bị chặn | Cấu hình, BR-05 |
| 10 | Web (admin): báo cáo doanh thu và tỷ lệ lấp đầy | Báo cáo |

**Chuẩn bị trước:** dữ liệu mẫu có sẵn; một đơn `PENDING` sắp hết hạn để minh họa (tạm chỉnh `HOLD_MINUTES` xuống 1 phút khi demo, nhớ trả lại); mở sẵn Postman cho bước 5 dự phòng (2 request song song).

## 3. Câu hỏi giảng viên thường hỏi và gợi ý trả lời

### Nghiệp vụ
1. **Vì sao chỉ 3 role?** Hệ thống một cơ sở; lễ tân/thu ngân/quản lý ca là cùng một nhóm → STAFF; chủ sân và quản trị hệ thống → ADMIN. Thêm role chỉ thêm giá trị ENUM và dòng ma trận quyền nên mở rộng dễ.
2. **Vì sao không làm marketplace nhiều chủ sân?** Kéo theo duyệt chủ sân, hoa hồng, đối soát, phân quyền theo cơ sở; ngoài phạm vi đồ án. Là hướng mở rộng (thêm bảng `venues`, khóa ngoại ở `courts`).
3. **Vì sao khung giờ cố định 1 giờ?** Chống trùng bằng UNIQUE đơn giản và chắc chắn; bảng giá dạng ma trận dễ cấu hình; thực tế sân thường cho thuê theo giờ.
4. **Khách đặt rồi không đến thì sao?** Nhân viên đánh dấu `NO_SHOW`, không hoàn tiền (BR-10); số liệu được thống kê. Đơn trả tại sân bị giới hạn 3 đơn hoạt động/khách (BR-08) để hạn chế chiếm chỗ ảo.
5. **Chính sách hủy và hoàn tiền là gì?** Khách hủy trước ≥ 6 giờ; đã trả thì hoàn 100% qua bước nhân viên xác nhận. Nhân viên hủy bất kỳ lúc nào kèm lý do. Hằng số nằm một chỗ nên dễ đổi.
6. **Nếu khách chuyển khoản nhưng quá 30 phút?** Đơn hết hạn, slot được nhả. Nhân viên tạo đơn mới bằng đặt tại quầy (nếu slot còn trống) và xử lý tiền thủ công. Giới hạn đã biết; VNPay (P2) sẽ giải quyết tự động.
7. **Sân bảo trì thì các đơn đã đặt sao?** Hệ thống không cho chuyển sang bảo trì khi còn đơn tương lai (BR-05); admin phải xử lý đơn trước, tránh đơn mồ côi.
8. **Ngày lễ có giá riêng không?** Chưa. Giá chỉ phân ngày thường và cuối tuần (BR-01). Mở rộng: thêm bảng `holidays` và `day_type = HOLIDAY`.
9. **Đổi giá có ảnh hưởng đơn cũ không?** Không, vì giá được snapshot vào `booking_slots.price` (BR-15).
10. **Vì sao nhân viên đặt hộ không cần tài khoản?** Khách vãng lai/gọi điện rất phổ biến; lưu `guest_name`, `guest_phone` đủ để liên hệ.

### Kỹ thuật và dữ liệu
11. **Làm sao không bị trùng lịch khi hai người đặt cùng lúc?** Bảng `booking_slots` có UNIQUE `(court_id, slot_date, time_slot_id, is_locked)`. Đơn hiệu lực có `is_locked=1`; hai INSERT cùng lúc thì DB chỉ cho một cái thành công, cái kia bị `ER_DUP_ENTRY` → trả 409. Dù có kiểm tra ở code, ràng buộc DB mới là lớp bảo vệ cuối cùng.
12. **Hủy xong slot được giải phóng thế nào?** Đặt `is_locked = NULL`. MySQL cho phép nhiều NULL trong UNIQUE index, nên slot đặt lại được nhưng dòng lịch sử vẫn còn.
13. **Vì sao tách `bookings` và `booking_slots`?** Một đơn gồm 1–3 giờ, mỗi giờ có giá snapshot và khóa riêng; tách bảng là chuẩn hóa dữ liệu một–nhiều.
14. **Vì sao có `bookings.payment_status` khi đã có `payments`?** Là cột cache để lọc và hiển thị nhanh; luôn cập nhật cùng transaction với `payments`.
15. **Vì sao dùng nhiều dòng `payments` (PAYMENT/REFUND)?** Giữ lịch sử đầy đủ từng giao dịch; một đơn có thể có một lần thu và một lần hoàn; doanh thu thực = thu − hoàn.
16. **Vì sao không xóa cứng?** Giữ lịch sử, báo cáo và toàn vẹn khóa ngoại (BR-14).
17. **Transaction dùng ở đâu?** Mọi thao tác ghi nhiều bảng: đặt sân, hủy, thanh toán, hoàn tiền, hết hạn. Nếu lỗi giữa chừng thì ROLLBACK, không để đơn có mà không có slot.
18. **Vì sao hết hạn giữ chỗ dùng `setInterval` mà không dùng cron/queue?** Một tiến trình, một tác vụ đơn giản; sai lệch tối đa 60 giây chấp nhận được; tránh thêm hạ tầng. Nếu scale nhiều instance sẽ chuyển sang job riêng hoặc khóa phân tán.
19. **Vì sao tiền dùng INT chứ không DECIMAL?** VND không có phần lẻ; tránh `DECIMAL` bị trả về string ở `mysql2` gây lỗi tính toán.
20. **Vì sao không dùng ORM?** SQL thuần giúp kiểm soát câu truy vấn, transaction và UNIQUE một cách minh bạch; quy mô nhỏ nên ORM không đem lại nhiều lợi ích mà thêm lớp trừu tượng khó giải thích.

### Kiến trúc và bảo mật
21. **Vì sao một backend cho cả Web và Mobile?** Nghiệp vụ nằm một chỗ, tránh lệch logic; hai client chỉ khác giao diện. Phân quyền theo role ở server.
22. **Route → Controller → Service để làm gì?** Route lo URL/middleware, Controller lo request/response, Service lo nghiệp vụ + SQL. Đủ tách lớp để dễ kiểm thử/debug mà không rườm rà.
23. **Bảo mật xác thực thế nào?** JWT có hạn, mật khẩu băm bcrypt, middleware kiểm tra DB mỗi request nên khóa tài khoản có hiệu lực ngay. Phân quyền ở server, không chỉ ẩn nút ở giao diện.
24. **Chống SQL injection?** Toàn bộ truy vấn tham số hóa (`?`), không nối chuỗi.
25. **Vì sao không dùng refresh token?** Phạm vi đồ án; token hạn 1 ngày là đủ. Mở rộng: thêm refresh token và bảng lưu phiên.
26. **Giá có thể bị client sửa không?** Không. Client chỉ gửi `courtId`, ngày, danh sách khung giờ; server tự tra giá và tính tổng (BR-15).

### Quy trình và đồ án
27. **Hệ thống chưa làm gì?** Thanh toán thật qua cổng (VNPay là P2), ngày lễ, đặt cọc, đặt định kỳ, thông báo đẩy, đa chi nhánh, realtime. Nêu thẳng rồi chỉ ra hướng mở rộng — điều này cho thấy hiểu phạm vi.
28. **Kiểm thử thế nào?** Bộ 40 test case thủ công (`08-development-plan.md` mục 4), trong đó TC-20 kiểm tra đặt đồng thời.
29. **UML có khớp với cài đặt không?** Có; `10-sync-check.md` là ma trận truy vết chức năng → API → bảng → màn hình → sơ đồ.
30. **Nếu có thêm thời gian sẽ làm gì?** Thứ tự: VNPay sandbox → ngày lễ → dịch vụ đi kèm → thông báo đẩy → đa chi nhánh.

## 4. Điểm mạnh nên nhấn mạnh
- Chống trùng lịch ở **tầng DB**, có demo và test đồng thời.
- Vòng đời đơn bằng **State Diagram** rõ ràng, có bảng chuyển trạng thái và nhật ký.
- Giá snapshot, hoàn tiền, đặt hộ: **sát thực tế vận hành**.
- Phạm vi chọn lọc có lý do; mọi thứ bỏ đều có phương án mở rộng.
- Tài liệu đồng bộ (UML, DB, API, màn hình).

## 5. Giới hạn đã biết (nói trước, đừng để bị hỏi)
Không phân biệt ngày lễ; thanh toán chuyển khoản xác nhận thủ công; không realtime (làm mới 30 giây); một cơ sở; không thông báo đẩy; hết hạn giữ chỗ lệch tối đa 60 giây.

## 6. Mẹo trình bày
- Mở đầu bằng sơ đồ **kiến trúc** (07 mục 1), sau đó **ER** (01 mục 2) và **State đơn** (02 mục 4.1).
- Khi bị hỏi sâu về đặt trùng: mở `schema.sql`, chỉ vào `uq_slot_active`.
- Không nói "em chưa biết"; nói "đây là giới hạn của phạm vi hiện tại, hướng xử lý là…".
