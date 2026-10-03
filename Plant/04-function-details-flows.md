# 04 — CHI TIẾT CHỨC NĂNG VÀ LUỒNG NGHIỆP VỤ

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI**. Mỗi chức năng: Actor, Điều kiện trước, Luồng chính, Luồng lỗi/ngoại lệ, Hậu điều kiện, Dữ liệu, API. Mã BR-xx tham chiếu `03-actors-functions.md`. Endpoint chi tiết ở `06-api.md`.

---

## A. KHÁCH HÀNG (Mobile)

### CUS-01 Đăng ký
- **Actor:** Khách chưa có tài khoản. **API:** `POST /auth/register`. **Bảng:** `users`.
- **Luồng chính:** nhập họ tên, số điện thoại, mật khẩu (email tùy chọn) → server validate (BR-21) → kiểm tra trùng số điện thoại → băm mật khẩu bằng bcrypt → INSERT `users` (`role='CUSTOMER'`, `status='ACTIVE'`) → trả token + user (đăng nhập luôn).
- **Lỗi:** `400 VALIDATION_ERROR`; `409 PHONE_EXISTS`; `409 EMAIL_EXISTS`.
- **Hậu điều kiện:** có bản ghi `users` mới, role luôn là `CUSTOMER` (BR-19).

### CUS-02 Đăng nhập / đăng xuất
- **API:** `POST /auth/login`. Sequence: `02-uml-diagrams.md` mục 3.1.
- **Luồng chính:** nhập số điện thoại + mật khẩu → so khớp bcrypt → ký JWT → app lưu token (secure-store) → vào màn hình chính.
- **Lỗi:** `401 INVALID_CREDENTIALS` (không nói rõ sai số hay sai mật khẩu); `401 ACCOUNT_LOCKED` (BR-16). Nếu `role ≠ CUSTOMER` thì app từ chối: "Vui lòng dùng Web quản trị" (BR-18).
- **Đăng xuất:** xóa token ở client. Không có API.

### CUS-03 Hồ sơ, đổi mật khẩu
- **API:** `GET /auth/me`, `PUT /auth/me` (fullName, email), `PUT /auth/change-password` (currentPassword, newPassword).
- **Lỗi:** `400 VALIDATION_ERROR`; `401 INVALID_CREDENTIALS` (sai mật khẩu hiện tại); `409 EMAIL_EXISTS`. Không cho đổi số điện thoại (là tài khoản đăng nhập).

### CUS-04 Xem loại sân và sân
- **API:** `GET /court-types`, `GET /courts?courtTypeId=`. Công khai (không cần đăng nhập).
- **Luồng:** màn hình chính hiển thị các loại sân; chọn loại → danh sách sân đang `ACTIVE`/`MAINTENANCE` (sân `INACTIVE` bị ẩn; sân `MAINTENANCE` hiển thị nhãn "Đang bảo trì", không đặt được).
- **Dữ liệu:** `court_types`, `courts`; kèm điểm đánh giá trung bình và số đánh giá (P1).

### CUS-05 Chi tiết sân, lịch trống, giá
- **API:** `GET /courts/:id`, `GET /courts/:id/availability?date=YYYY-MM-DD`.
- **Luồng chính:** chọn ngày trong dải 15 ngày (hôm nay + 14, BR-03) → server trả danh sách khung giờ với `price` và `status`.
- **Trạng thái slot:** `AVAILABLE` (đặt được), `BOOKED` (đã có người), `PAST` (đã qua hoặc trong 30 phút tới, BR-03), `MAINTENANCE` (sân bảo trì), `NO_PRICE` (chưa cấu hình giá).
- **Tính toán:** `dayType` theo BR-01; tra `slot_prices`; đánh dấu `BOOKED` nếu có `booking_slots.is_locked = 1` (truy vấn mục 7.1 `01-database.md`).
- **Lỗi:** `404 NOT_FOUND` (sân không tồn tại/INACTIVE); `400 VALIDATION_ERROR` (ngày ngoài dải).

### CUS-06 Đặt sân ⭐ (luồng cốt lõi)
- **Actor:** CUSTOMER. **API:** `POST /bookings`. **Bảng:** `bookings`, `booking_slots`, `booking_status_logs`. Sequence: mục 3.2 UML.
- **Điều kiện trước:** đã đăng nhập, tài khoản `ACTIVE`.
- **Input:** `courtId`, `bookingDate`, `timeSlotIds[]` (1–3), `paymentMethod` (`CASH` | `BANK_TRANSFER`), `note?`.
- **Luồng chính (trong 1 transaction):**
  1. Validate cấu trúc (zod).
  2. Sân tồn tại, `status='ACTIVE'` (BR-05).
  3. `bookingDate` trong [hôm nay, +14 ngày] (BR-03).
  4. Các `timeSlotId` tồn tại, `is_active`, **liền kề** (sắp theo `start_time`), số lượng ≤ 3 (BR-02).
  5. Khung giờ đầu cách hiện tại ≥ 30 phút (BR-03).
  6. Khách chưa vượt 3 đơn hoạt động (BR-08).
  7. Tra `slot_prices` theo `court_type_id`, `time_slot_id`, `dayType` → thiếu giá thì `422 PRICE_NOT_CONFIGURED` (BR-15).
  8. Tính `total_amount`; `start_time`/`end_time` của đơn.
  9. Sinh `booking_code` (BR-22).
  10. Xác định trạng thái khởi tạo (BR-06): `CASH` → `CONFIRMED`; `BANK_TRANSFER` → `PENDING` + `expires_at = now + 30 phút` (BR-07).
  11. INSERT `bookings` (`source='APP'`, `user_id` = người đăng nhập); INSERT từng `booking_slots` (`is_locked = 1`, giá snapshot).
  12. Bắt `ER_DUP_ENTRY` → ROLLBACK, `409 SLOT_TAKEN` (BR-04).
  13. INSERT `booking_status_logs` (`from_status = NULL`, `to_status`).
- **Output:** `201` + booking; nếu `BANK_TRANSFER` kèm `paymentInfo` (ngân hàng, STK, chủ TK, số tiền, nội dung = `bookingCode`).
- **Lỗi:** `400 VALIDATION_ERROR`, `404 NOT_FOUND` (sân), `409 SLOT_TAKEN`, `422 COURT_NOT_BOOKABLE`, `422 BOOKING_DATE_INVALID`, `422 SLOTS_NOT_CONSECUTIVE`, `422 SLOT_IN_PAST`, `422 TOO_MANY_ACTIVE_BOOKINGS`, `422 PRICE_NOT_CONFIGURED`.
- **Hậu điều kiện:** các slot bị khóa cho tới khi đơn kết thúc/hủy/hết hạn.

### CUS-07 Hướng dẫn chuyển khoản và đếm ngược
- **API:** `GET /bookings/:id` (trả `paymentInfo` khi `PENDING` + `BANK_TRANSFER`).
- **Luồng:** sau khi đặt, hiển thị STK, số tiền, nội dung chuyển khoản = `bookingCode`, đếm ngược theo `expiresAt`. Khi hết giờ: app gọi lại API, thấy `EXPIRED` → hiển thị "Đơn đã hết hạn, vui lòng đặt lại". Khách **không** tự xác nhận đã chuyển; nhân viên xác nhận (STF-06).
- **Làm mới:** nút "Kiểm tra trạng thái" (không dùng WebSocket).

### CUS-08 Lịch sử và chi tiết đơn
- **API:** `GET /bookings/my?status=&page=&limit=`, `GET /bookings/:id`.
- **Luồng:** 3 tab: **Sắp tới** (`PENDING`, `CONFIRMED`), **Hoàn thành** (`COMPLETED`), **Đã hủy** (`CANCELLED`, `EXPIRED`, `NO_SHOW`). Chi tiết hiển thị sân, ngày, giờ, từng slot, tổng tiền, trạng thái, phương thức, nút Hủy (nếu `canCancel`), nút Đánh giá (nếu hoàn thành và chưa đánh giá).
- **Bảo mật:** chỉ trả đơn của chính mình; đơn người khác `404`.

### CUS-09 Hủy đơn
- **API:** `POST /bookings/:id/cancel`. Sequence: mục 3.4.
- **Luồng chính (transaction):** `SELECT ... FOR UPDATE` → đúng chủ đơn → trạng thái `PENDING`/`CONFIRMED` → còn ≥ 6 giờ (BR-09) → `UPDATE status='CANCELLED', cancelled_at, cancel_reason` (`WHERE status` cũ) → `UPDATE booking_slots SET is_locked=NULL` → nếu `payment_status='PAID'`: INSERT `payments` (`REFUND`, `PENDING`, amount = `total_amount`) (BR-10) → INSERT `booking_status_logs`.
- **Lỗi:** `404`, `409 INVALID_STATUS`, `422 CANCEL_DEADLINE_PASSED`.
- **Output:** đơn đã hủy + `refundPending: true/false`. App hiển thị: "Nhân viên sẽ hoàn tiền cho bạn".

### CUS-10 Đánh giá (P1)
- **API:** `POST /bookings/:id/review` (`rating` 1–5, `comment?`). **Bảng:** `reviews`.
- **Điều kiện:** BR-13. **Lỗi:** `422 BOOKING_NOT_COMPLETED`, `409 ALREADY_REVIEWED`, `404`.

---

## B. NHÂN VIÊN (Web)

### STF-01 Đăng nhập, hồ sơ
Như CUS-02/03. Web chặn `CUSTOMER` (BR-18). Điều hướng theo role sau đăng nhập.

### STF-02 Dashboard "hôm nay"
- **API:** `GET /staff/dashboard`.
- **Trả về:** số đơn hôm nay theo trạng thái; **số đơn chờ thanh toán** (`PENDING`); **số hoàn tiền chờ xử lý** (`REFUND` `PENDING`); danh sách 5 khung giờ sắp tới có đơn. Có liên kết nhanh sang Lịch sân, Đơn chờ thanh toán, Chờ hoàn tiền.

### STF-03 Lịch lưới sân theo ngày ⭐
- **API:** `GET /staff/schedule?date=YYYY-MM-DD`.
- **Giao diện:** bảng hàng = khung giờ, cột = sân (đang `ACTIVE`/`MAINTENANCE`). Mỗi ô: trống (nhấp để đặt tại quầy) hoặc có đơn (tên khách, màu theo trạng thái; nhấp mở chi tiết). Sân bảo trì tô xám.
- **Dữ liệu:** `courts`, `time_slots`, `booking_slots` + `bookings` (+ `users` lấy tên khách).
- **Cập nhật:** nút "Tải lại" và tự gọi lại mỗi 30 giây (không realtime).

### STF-04 Danh sách đơn và chi tiết
- **API:** `GET /staff/bookings?date=&courtId=&status=&paymentStatus=&keyword=&page=&limit=`, `GET /staff/bookings/:id`.
- **keyword:** khớp `booking_code`, tên khách, số điện thoại (cả khách vãng lai).
- **Chi tiết:** thông tin đơn, các slot, danh sách `payments`, `booking_status_logs` (P1), các nút hành động hợp lệ theo trạng thái.

### STF-05 Đặt sân tại quầy ⭐
- **API:** `POST /staff/bookings`. **Bảng:** như CUS-06 + `created_by`.
- **Input:** `courtId`, `bookingDate`, `timeSlotIds[]`, khách (`customerId` **hoặc** `guestName`+`guestPhone`, BR-17), `payNow` (bool), `paymentMethod` (`CASH`|`BANK_TRANSFER`, bắt buộc khi `payNow=true`), `note?`.
- **Khác CUS-06:** `source='STAFF'`; áp BR-03 phiên bản nhân viên (cho phép giờ đang diễn ra); **không** áp BR-08; không giữ chỗ — đơn tạo ra là `CONFIRMED` ngay.
  - `payNow=true` → INSERT `payments` (`PAYMENT`, `SUCCESS`, `processed_by`) và `payment_status='PAID'`.
  - `payNow=false` → `payment_status='UNPAID'`, `payment_method='CASH'` (đặt qua điện thoại, trả sau tại sân).
- **Lỗi:** như CUS-06 và `400 VALIDATION_ERROR` khi thiếu thông tin khách.

### STF-06 Ghi nhận thanh toán ⭐
- **API:** `POST /staff/bookings/:id/payments` (`method`, `transactionRef?`). Sequence: mục 3.3.
- **Luồng (transaction):** khóa đơn → đơn phải `PENDING` hoặc `CONFIRMED` và `payment_status='UNPAID'` → với `PENDING`: còn hạn `expires_at` → INSERT `payments` (`PAYMENT`, `SUCCESS`, `amount=total_amount`, `processed_by`, `processed_at`) → `UPDATE bookings SET payment_status='PAID', payment_method=?` và nếu `PENDING` thì `status='CONFIRMED'`, `expires_at=NULL` → log trạng thái.
- **Lỗi:** `409 INVALID_STATUS`, `409 ALREADY_PAID`, `422 BOOKING_EXPIRED` (đơn đã `EXPIRED`: khách phải đặt lại, nhân viên có thể tạo đơn mới bằng STF-05).

### STF-07 Hoàn thành / No-show
- **API:** `POST /staff/bookings/:id/complete`, `POST /staff/bookings/:id/no-show`.
- **Điều kiện:** BR-12. `UPDATE ... WHERE status='CONFIRMED'` → log.
- **Lỗi:** `409 INVALID_STATUS`, `422 NOT_PAID` (chưa PAID khi hoàn thành), `422 TOO_EARLY` (chưa đến giờ bắt đầu).

### STF-08 Hủy đơn thay khách
- **API:** `POST /staff/bookings/:id/cancel` (`reason` bắt buộc).
- **Luồng:** như CUS-09 nhưng không giới hạn 6 giờ và không kiểm tra chủ đơn; vẫn tạo `REFUND PENDING` nếu `PAID`.

### STF-09 Xác nhận hoàn tiền
- **API:** `GET /staff/refunds?status=PENDING`, `POST /staff/payments/:id/confirm-refund` (`transactionRef?`, `note?`).
- **Luồng (transaction):** `payments` phải là `REFUND` + `PENDING` → UPDATE `SUCCESS`, `processed_by`, `processed_at` → `bookings.payment_status='REFUNDED'`.
- **Lỗi:** `404`, `409 INVALID_STATUS`.

### STF-10 Tra cứu khách hàng (P1)
- **API:** `GET /staff/customers?keyword=`, `GET /staff/customers/:id` (thông tin + 20 đơn gần nhất). Nhân viên chỉ xem, không sửa/khóa.

---

## C. QUẢN TRỊ VIÊN (Web)

### ADM-01 Quản lý loại sân
- **API:** `GET/POST /admin/court-types`, `PUT /admin/court-types/:id`, `PATCH /admin/court-types/:id/active`.
- **Quy tắc:** tên duy nhất. Tắt loại sân (`is_active=0`) bị chặn nếu còn sân `ACTIVE` thuộc loại đó **hoặc** còn đơn tương lai (BR-05) → `409 IN_USE`. Không xóa (BR-14).

### ADM-02 Quản lý sân
- **API:** `GET/POST /admin/courts`, `PUT /admin/courts/:id`, `PATCH /admin/courts/:id/status`.
- **Quy tắc:** chuyển `MAINTENANCE`/`INACTIVE` bị chặn nếu còn đơn `PENDING/CONFIRMED` tương lai (`409 COURT_HAS_FUTURE_BOOKINGS`, trả kèm số đơn) (BR-05). Đưa sân về `ACTIVE` luôn được.
- **Ảnh sân:** nhập URL ảnh (`image_url`). Không làm upload file (giảm phức tạp).

### ADM-03 Quản lý khung giờ
- **API:** `GET/POST /admin/time-slots`, `PUT /admin/time-slots/:id`, `PATCH /admin/time-slots/:id/active`.
- **Quy tắc:** `end_time > start_time`, không trùng `start_time`. Khuyến nghị giữ độ dài 1 giờ và nối tiếp nhau. Không sửa giờ của slot đã có đơn (`409 SLOT_IN_USE`); chỉ được tắt `is_active` khi không còn đơn tương lai dùng slot đó.

### ADM-04 Quản lý bảng giá
- **API:** `GET /admin/slot-prices?courtTypeId=` (ma trận), `PUT /admin/slot-prices` (cập nhật hàng loạt).
- **Giao diện:** bảng hàng = khung giờ, cột = `Ngày thường | Cuối tuần`, chọn loại sân ở trên. Nút "Sao chép giá ngày thường sang cuối tuần".
- **Quy tắc:** giá ≥ 0, số nguyên. Dùng `INSERT ... ON DUPLICATE KEY UPDATE`. Đổi giá **không** ảnh hưởng đơn cũ (BR-15).

### ADM-05 Quản lý tài khoản nhân viên
- **API:** `GET /admin/staff`, `POST /admin/staff` (fullName, phone, password), `PUT /admin/staff/:id`, `PATCH /admin/staff/:id/status`, `POST /admin/staff/:id/reset-password` (newPassword).
- **Quy tắc:** role luôn là `STAFF` (BR-19); admin không tự khóa mình; luôn còn ≥ 1 `ADMIN` `ACTIVE`.

### ADM-06 Quản lý khách hàng (P1)
- **API:** `GET /admin/customers?keyword=&status=`, `PATCH /admin/customers/:id/status` (`ACTIVE`|`LOCKED`).
- **Hiệu lực:** khóa → không đăng nhập được và token cũ bị từ chối (BR-16). Đơn đã đặt **không** tự hủy; nhân viên xử lý thủ công nếu cần.

### ADM-07 Báo cáo (P1)
- **API:** `GET /admin/reports/summary?from=&to=`, `GET /admin/reports/revenue?from=&to=&groupBy=day|month`, `GET /admin/reports/court-usage?from=&to=`.
- **Nội dung:**
  - *Tổng quan:* tổng doanh thu thực (thu − hoàn), số đơn theo trạng thái, số khách mới.
  - *Doanh thu:* theo ngày/tháng (mục 7.3 `01-database.md`).
  - *Sử dụng sân:* mỗi sân gồm số slot đã đặt, tỷ lệ lấp đầy (mục 7.4).
- **Giới hạn:** khoảng thời gian tối đa 366 ngày. Hiển thị bảng và một biểu đồ cột (Recharts), không làm thêm.

---

## D. HỆ THỐNG

### SYS-01 Hết hạn đơn giữ chỗ
- **Cơ chế:** `setInterval` mỗi 60 giây trong tiến trình Express (khởi động cùng `server.ts`). Không dùng cron/queue ngoài.
- **Luồng:** mục 7.2 `01-database.md`.
- **Phụ trợ (lazy):** khi đọc `availability`, các đơn `PENDING` quá hạn chưa kịp xử lý vẫn coi là còn khóa tới khi job chạy (sai lệch tối đa 60 giây, chấp nhận được).

### SYS-02 Nhật ký trạng thái (P1)
Mọi nơi đổi `bookings.status` đều gọi hàm chung `logStatusChange(conn, bookingId, from, to, userId|null, note)`.

---

## E. BẢNG TỔNG HỢP LỖI NGHIỆP VỤ THEO CHỨC NĂNG

Xem bảng mã lỗi đầy đủ ở `06-api.md` mục 3.
