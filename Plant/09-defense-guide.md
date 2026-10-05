# 09 — HƯỚNG DẪN BẢO VỆ

> Trạng thái: **ĐỀ XUẤT** (v1.2: dịch vụ phát sinh, hóa đơn, khu sự kiện, luồng liền mạch Mobile–Web). Đáp án dựa trên thiết kế trong bộ tài liệu này. Nếu bạn thay đổi thiết kế, hãy sửa đáp án tương ứng.

## 1. Bài giới thiệu 2 phút

> "Đề tài là hệ thống quản lý và đặt sân thể thao cho **một cơ sở có nhiều sân**. Có **ba nhóm người dùng**: khách hàng đặt sân qua **ứng dụng di động**; nhân viên và quản trị viên vận hành qua **Web**. Cả hai dùng chung **một backend Node.js + Express** và cơ sở dữ liệu **MySQL**.
> Điểm cốt lõi của hệ thống là **đặt theo khung giờ cố định, giá theo loại sân – khung giờ – ngày thường/cuối tuần**, và **không bao giờ để hai người đặt trùng một giờ**, kể cả khi bấm cùng lúc, nhờ ràng buộc UNIQUE ở cơ sở dữ liệu.
> Mỗi đơn có vòng đời rõ ràng: chờ thanh toán, đã xác nhận, hoàn thành, hủy, hết hạn, vắng mặt. Hệ thống có giữ chỗ 30 phút, chính sách hủy và hoàn tiền, đặt hộ tại quầy cho khách vãng lai, và báo cáo doanh thu.
> Ngoài ra, trong buổi chơi khách có thể **gọi đồ uống, thuê đồ hoặc gói tiệc ngay trên app**; nhân viên mang ra, trả đồ xong thì **cộng vào hóa đơn** và thu tiền. Hệ thống cũng cho đặt **khu tổ chức sự kiện/tiệc** để thu thêm phí."

## 2. Kịch bản demo (16 bước, ~15 phút; bám theo E1, E2, E3, E6, E7 của `11`; rút gọn bước 8–10 nếu thiếu thời gian)

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
| 10 | Web (admin): báo cáo doanh thu (tách tiền sân / dịch vụ), tỷ lệ lấp đầy, dịch vụ bán chạy | Báo cáo |
| 11 | Mobile: với đơn đã xác nhận, **gọi 2 nước + 1 vợt**; thấy yêu cầu "Chờ giao"; hóa đơn chưa tính tiền dịch vụ | Dịch vụ phát sinh, CUS-12 |
| 12 | Web (nhân viên): trang **Yêu cầu dịch vụ** → bấm **Đã giao**; Mobile kéo làm mới → "Đã giao", hóa đơn tăng | Hàng đợi, giá snapshot |
| 13 | Web: thử **Hoàn thành** khi còn vợt chưa trả → bị chặn và nêu lý do; bấm **Đã nhận lại**, **Thu tiền dịch vụ**, rồi Hoàn thành | BR-28, hóa đơn |
| 14 | Mobile/Web: đặt **Phòng tiệc A** vài giờ, gọi **gói tiệc nước 10 người** | Khu sự kiện, thu thêm phí |
| 15 | Mobile: hủy đơn đã trả và nhập thông tin nhận tiền → Web: **Chờ hoàn tiền** hiện đúng thông tin, bấm xác nhận → Mobile thấy "Đã hoàn tiền" | Hoàn tiền liền mạch, BR-34 |
| 16 | Web (admin): đơn đã giao dịch vụ mà khách "bỏ đi" → thử Hoàn thành bị chặn → **Đóng đơn có công nợ** → báo cáo hiện công nợ | Không có đơn kẹt, BR-33 |

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

### Dịch vụ phát sinh, hóa đơn và khu sự kiện
31. **Vì sao dịch vụ phải gắn với đơn sân?** Để biết giao cho khách nào, ở sân nào, và tính đúng vào hóa đơn của buổi chơi đó. Khách chỉ gọi được khi đơn đã `CONFIRMED` và chưa quá giờ kết thúc (BR-24).
32. **Khách gọi đồ rồi, tiền được tính lúc nào?** Chỉ khi nhân viên bấm **Đã giao** (BR-25). Yêu cầu chờ giao hoặc đã hủy không tính tiền, tránh thu tiền món chưa mang ra.
33. **Hóa đơn lưu ở đâu?** Không có bảng hóa đơn. `grandTotal = court_amount + service_amount`, tính khi đọc từ `bookings`, `service_orders`, `payments`; nhờ vậy luôn khớp với tiền đã thu và không phải đồng bộ hai nơi (D15).
34. **Khách trả tiền sân rồi, gọi thêm đồ thì thu thế nào?** Tiền sân thu như cũ. Tiền dịch vụ thu riêng bằng "Thu tiền dịch vụ", số tiền bằng phần còn thiếu, **có thể thu nhiều lần** (BR-26). Vì vậy quy tắc "trả toàn phần một lần" chỉ áp dụng cho tiền sân (BR-11).
35. **Thuê vợt tính tiền thế nào, mất vợt thì sao?** Tính **một lần theo buổi** bằng giá dịch vụ, không tính theo giờ; nhân viên đánh dấu "đã nhận lại" và không cho hoàn thành đơn khi còn đồ chưa trả (BR-27, BR-28). Đền bù mất/hỏng ngoài phạm vi, xử lý ngoài hệ thống. Hướng mở rộng: thêm phụ thu tùy chỉnh.
36. **Giá đổi sau khi khách đã gọi thì sao?** Không ảnh hưởng, vì `unit_price` được snapshot lúc gọi (BR-23), giống giá sân.
37. **Có quản lý tồn kho không?** Không. Chỉ có trạng thái `ACTIVE` / `OUT_OF_STOCK` do nhân viên bật tắt. Kiểm kê nhập xuất kho là một hệ thống khác, không thuộc đồ án này.
38. **Khu sự kiện/tiệc thiết kế thế nào, sao không làm module riêng?** Là một loại sân có `category = EVENT` (phòng tiệc, khu BBQ, có sức chứa). Nhờ đó dùng lại nguyên khung giờ, bảng giá, chống trùng lịch, thanh toán, hủy/hoàn tiền; thu thêm phí bằng giá thuê khu vực cộng gói tiệc, đồ uống. Làm module riêng sẽ nhân đôi logic mà không thêm giá trị nghiệp vụ (D17).
39. **Hủy đơn sân khi đã giao dịch vụ thì sao?** Bị chặn (BR-29): khách đã dùng dịch vụ tức là đã sử dụng sân, nên không cho hoàn tiền sân. Các yêu cầu chưa giao thì tự hủy theo đơn.
40. **Hai nhân viên cùng bấm giao một yêu cầu thì sao?** Mỗi thao tác khóa dòng đơn sân (`SELECT ... FOR UPDATE`) và cập nhật có điều kiện trạng thái; người thứ hai nhận `409 INVALID_STATUS`.

### Luồng liền mạch Mobile ↔ Web, công nợ và hoàn tiền
41. **Mobile và Web đồng bộ với nhau thế nào, có realtime không?** Không dùng realtime. Server là nguồn sự thật; các màn hình theo dõi tự làm mới mỗi 30 giây khi đang mở, danh sách tải lại khi focus, và có nút làm mới. Độ trễ tối đa 30 giây (`11` mục 2) là đủ cho nghiệp vụ sân; WebSocket chỉ thêm độ phức tạp.
42. **Khách dùng dịch vụ rồi bỏ đi không trả tiền thì xử lý sao?** ADMIN dùng "Đóng đơn có công nợ" (BR-33): đơn thành `COMPLETED`, đánh dấu `closed_with_debt`, ghi lý do và số nợ vào nhật ký, **không** tạo giao dịch giả nên doanh thu thật không đổi; công nợ hiện trong báo cáo. Nếu không có chức năng này, đơn không thể hoàn thành, hủy hay no-show và sẽ kẹt mãi — chúng em phát hiện bằng cách mô phỏng hành trình người dùng (`11` mục 6).
43. **Hoàn tiền thì chuyển vào đâu?** Khi hủy đơn đã trả, khách nhập thông tin nhận tiền (`refundInfo`, bắt buộc), lưu cùng dòng hoàn tiền; nhân viên nhìn thấy ở màn Chờ hoàn tiền, chuyển xong bấm xác nhận (BR-34).
44. **Khách quên mật khẩu thì sao?** Không có email quên mật khẩu (giới hạn phạm vi); khách liên hệ nhân viên, ADMIN đặt mật khẩu tạm, khách đăng nhập rồi đổi lại.
45. **Làm sao chắc cả hệ thống chạy liền mạch?** Có 9 kịch bản E2E chạy từ Mobile sang Web và ngược lại (`11` mục 3), đối chiếu tự động API với màn hình, mô phỏng các hành trình để tìm chỗ bế tắc, chạy thử DDL và các truy vấn chính, và kiểm tra cú pháp toàn bộ sơ đồ.

### Quy trình và đồ án
27. **Hệ thống chưa làm gì?** Thanh toán thật qua cổng (VNPay là P2), ngày lễ, đặt cọc (kể cả cọc sự kiện), đặt định kỳ, thông báo đẩy, đa chi nhánh, realtime, tồn kho dịch vụ, đền bù mất/hỏng, thanh toán dịch vụ online trong app, báo giá/duyệt riêng cho sự kiện. Nêu thẳng rồi chỉ ra hướng mở rộng — điều này cho thấy hiểu phạm vi.
28. **Kiểm thử thế nào?** Bộ hơn 60 test case thủ công (`08-development-plan.md` mục 4), trong đó TC-20 kiểm tra đặt đồng thời.
29. **UML có khớp với cài đặt không?** Có; `10-sync-check.md` là ma trận truy vết chức năng → API → bảng → màn hình → sơ đồ.
30. **Nếu có thêm thời gian sẽ làm gì?** Thứ tự: VNPay sandbox (kể cả thanh toán dịch vụ trong app) → ngày lễ → phụ thu/đền bù đồ thuê → thông báo đẩy khi yêu cầu được giao → đặt cọc và báo giá cho sự kiện → đa chi nhánh.

## 4. Điểm mạnh nên nhấn mạnh
- Chống trùng lịch ở **tầng DB**, có demo và test đồng thời.
- Vòng đời đơn bằng **State Diagram** rõ ràng, có bảng chuyển trạng thái và nhật ký.
- Giá snapshot, hoàn tiền, đặt hộ, **dịch vụ phát sinh và hóa đơn**: **sát thực tế vận hành** (đúng góp ý của giảng viên).
- Phạm vi chọn lọc có lý do; mọi thứ bỏ đều có phương án mở rộng.
- Tài liệu đồng bộ (UML, DB, API, màn hình).

## 5. Giới hạn đã biết (nói trước, đừng để bị hỏi)
Không phân biệt ngày lễ; thanh toán chuyển khoản xác nhận thủ công; dịch vụ chỉ thu tại quầy (không thanh toán trong app), không tồn kho, thuê đồ tính theo buổi; khu sự kiện đặt tức thì, không duyệt/đặt cọc; không hoàn tiền dịch vụ đã thu, không đổi giờ đơn (hủy và đặt lại), không quên mật khẩu qua email, độ trễ đồng bộ Mobile–Web tối đa 30 giây; không realtime (làm mới 30 giây); một cơ sở; không thông báo đẩy; hết hạn giữ chỗ lệch tối đa 60 giây.

## 6. Mẹo trình bày
- Mở đầu bằng sơ đồ **kiến trúc** (07 mục 1), sau đó **ER** (01 mục 2), **State đơn** (02 mục 4.1) và **Sequence dịch vụ** (02 mục 3.6–3.7).
- Khi bị hỏi sâu về đặt trùng: mở `schema.sql`, chỉ vào `uq_slot_active`.
- Không nói "em chưa biết"; nói "đây là giới hạn của phạm vi hiện tại, hướng xử lý là…".
