# 04 — CHI TIẾT CHỨC NĂNG VÀ LUỒNG NGHIỆP VỤ

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2: dịch vụ phát sinh CUS-11..13, STF-11..15, ADM-08; bổ sung ADM-09 đóng đơn có công nợ, thông tin hoàn tiền, tìm khách, lịch trống cho nhân viên, tự làm mới). Mỗi chức năng: Actor, Điều kiện trước, Luồng chính, Luồng lỗi/ngoại lệ, Hậu điều kiện, Dữ liệu, API. Mã BR-xx tham chiếu `03-actors-functions.md`. Endpoint chi tiết ở `06-api.md`.

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
- **Khu sự kiện/tiệc (BR-30):** loại sân có `category = EVENT` được app hiển thị ở mục riêng "Khu sự kiện & tiệc" (kèm `capacity` – sức chứa). Phần đặt giờ dùng đúng luồng CUS-05, CUS-06 như sân thể thao. API lọc: `GET /court-types?category=EVENT`, `GET /courts?category=EVENT`.
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
  8. Tính `court_amount`; `start_time`/`end_time` của đơn.
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
- **Làm mới:** màn hình **tự gọi lại API mỗi 30 giây khi đang mở** (đơn `PENDING`), đồng thời có nút "Kiểm tra trạng thái"; khi trạng thái đổi sang `CONFIRMED`, app báo "Đã xác nhận thanh toán" (không dùng WebSocket).

### CUS-08 Lịch sử và chi tiết đơn
- **API:** `GET /bookings/my?status=&page=&limit=`, `GET /bookings/:id`.
- **Luồng:** 3 tab: **Sắp tới** (`PENDING`, `CONFIRMED`), **Hoàn thành** (`COMPLETED`), **Đã hủy** (`CANCELLED`, `EXPIRED`, `NO_SHOW`). Chi tiết hiển thị sân, ngày, giờ, từng slot, tổng tiền, trạng thái, phương thức, nút Hủy (nếu `canCancel`), nút Đánh giá (nếu hoàn thành và chưa đánh giá), nút **Gọi dịch vụ** (khi `CONFIRMED` và chưa qua giờ kết thúc, CUS-12) và nút **Xem hóa đơn** (CUS-13).
- **Bảo mật:** chỉ trả đơn của chính mình; đơn người khác `404`.

### CUS-09 Hủy đơn
- **API:** `POST /bookings/:id/cancel`. Sequence: mục 3.4.
- **Luồng chính (transaction):** `SELECT ... FOR UPDATE` → đúng chủ đơn → trạng thái `PENDING`/`CONFIRMED` → còn ≥ 6 giờ (BR-09) → chưa có yêu cầu dịch vụ `DELIVERED` (BR-29) → `UPDATE status='CANCELLED', cancelled_at, cancel_reason` (`WHERE status` cũ) → `UPDATE booking_slots SET is_locked=NULL` → các `service_orders` `REQUESTED` của đơn chuyển `CANCELLED` (BR-29) → nếu `payment_status='PAID'`: INSERT `payments` (`REFUND`, `PENDING`, amount = `court_amount`) (BR-10) → INSERT `booking_status_logs`.
- **Lỗi:** `404`, `409 INVALID_STATUS`, `409 HAS_DELIVERED_SERVICES`, `422 CANCEL_DEADLINE_PASSED`, `422 REFUND_INFO_REQUIRED`.
- **Thông tin nhận tiền hoàn (BR-34):** nếu đơn `PAID`, app hiển thị ô **"Thông tin nhận tiền hoàn"** (ngân hàng, STK, chủ TK, hoặc "nhận tiền mặt tại quầy") và gửi `refundInfo`; thiếu thì `422 REFUND_INFO_REQUIRED`. Server lưu vào `payments.note` của dòng `REFUND`.
- **Output:** đơn đã hủy + `refundPending: true/false`. App hiển thị: "Nhân viên sẽ hoàn tiền cho bạn".

### CUS-10 Đánh giá (P1)
- **API:** `POST /bookings/:id/review` (`rating` 1–5, `comment?`). **Bảng:** `reviews`.
- **Điều kiện:** BR-13. **Lỗi:** `422 BOOKING_NOT_COMPLETED`, `409 ALREADY_REVIEWED`, `404`.

### CUS-11 Xem danh mục dịch vụ (P1★)
- **API:** `GET /services?type=DRINK|RENTAL|PACKAGE`. Công khai.
- **Luồng:** app hiển thị danh mục nhóm theo loại: **Đồ uống**, **Thuê đồ**, **Gói tiệc & sự kiện**; mỗi mục có tên, ảnh, mô tả, đơn vị, giá. Dịch vụ `OUT_OF_STOCK` hiện nhãn "Tạm hết" và không chọn được; `INACTIVE` bị ẩn (BR-23).
- **Lối vào:** trang chủ (xem thực đơn, chỉ đọc) và màn hình Gọi dịch vụ (CUS-12).

### CUS-12 Gọi dịch vụ cho đơn đang có ⭐ (P1★)
- **Actor:** CUSTOMER. **API:** `POST /bookings/:id/service-orders`. **Bảng:** `service_orders`, `service_order_items`. Sequence: `02-uml-diagrams.md` mục 3.6.
- **Điều kiện trước:** đơn của chính mình, `status = CONFIRMED`, `now < end_time` (BR-24).
- **Input:** `items[]` (mỗi phần tử `serviceId`, `quantity`), `note?` (VD "mang ra sân số 2").
- **Luồng chính (transaction):**
  1. Validate cấu trúc (zod): 1–10 dòng, mỗi dòng số lượng 1–20; dòng trùng `serviceId` được **gộp** số lượng.
  2. `SELECT booking ... FOR UPDATE`; đúng chủ đơn; `CONFIRMED`; chưa qua `end_time` (BR-24).
  3. Mọi `serviceId` tồn tại và `status = 'ACTIVE'` (BR-23).
  4. INSERT `service_orders` (`REQUESTED`, `source='APP'`, `requested_by`).
  5. INSERT từng `service_order_items` với `unit_price` = giá hiện tại của dịch vụ (snapshot).
- **Output:** `201` + yêu cầu dịch vụ (kèm các dòng, `lineAmount`, `orderAmount`). **`service_amount` của đơn chưa đổi** cho tới khi nhân viên giao (BR-25).
- **Lỗi:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `422 BOOKING_NOT_ACTIVE_FOR_SERVICE`, `422 SERVICE_NOT_AVAILABLE`.
- **Hậu điều kiện:** yêu cầu xuất hiện trong hàng đợi của nhân viên (STF-11).

### CUS-13 Xem hóa đơn, theo dõi và hủy yêu cầu dịch vụ (P1★)
- **API:** `GET /bookings/:id/invoice`, `POST /bookings/:id/service-orders/:orderId/cancel`.
- **Hóa đơn gồm:** tiền sân; các yêu cầu dịch vụ kèm trạng thái (**Chờ giao / Đã giao / Đã hủy**) và với đồ thuê: **đã trả / chưa trả**; tiền dịch vụ (**chỉ tính các yêu cầu đã giao**, BR-25); tổng cộng (`grandTotal`), đã thanh toán (`paidAmount`), còn thiếu (`balance`) (BR-26).
- **Ghi chú hiển thị:** "Tiền dịch vụ được thanh toán tại quầy khi bạn trả đồ" (BR-26). Màn hình **tự làm mới mỗi 30 giây khi đang mở** và hỗ trợ kéo để làm mới (không realtime), nên khách thấy yêu cầu chuyển sang "Đã giao" mà không phải thoát ra vào lại.
- **Hủy yêu cầu:** chỉ khi `REQUESTED` và đúng chủ đơn; sau khi `DELIVERED` khách không tự hủy được (liên hệ nhân viên).
- **Lỗi:** `404`, `409 INVALID_STATUS`.

---

## B. NHÂN VIÊN (Web)

### STF-01 Đăng nhập, hồ sơ
Như CUS-02/03. Web chặn `CUSTOMER` (BR-18). Điều hướng theo role sau đăng nhập.

### STF-02 Dashboard "hôm nay"
- **API:** `GET /staff/dashboard`.
- **Trả về:** số đơn hôm nay theo trạng thái; **số đơn chờ thanh toán** (`PENDING`); **số hoàn tiền chờ xử lý** (`REFUND` `PENDING`); danh sách 5 khung giờ sắp tới có đơn; **số yêu cầu dịch vụ đang chờ giao** (`service_orders` `REQUESTED`); **số đơn quá giờ chưa xử lý** (`CONFIRMED` đã qua `end_time`, truy vấn 7.13 — nhắc nhân viên hoàn thành, no-show hoặc đóng đơn). Có liên kết nhanh sang Lịch sân, Đơn chờ thanh toán, Chờ hoàn tiền, **Yêu cầu dịch vụ**.

### STF-03 Lịch lưới sân theo ngày ⭐
- **API:** `GET /staff/schedule?date=YYYY-MM-DD`.
- **Giao diện:** bảng hàng = khung giờ, cột = sân (đang `ACTIVE`/`MAINTENANCE`). Mỗi ô: trống (nhấp để đặt tại quầy) hoặc có đơn (tên khách, màu theo trạng thái; nhấp mở chi tiết). Sân bảo trì tô xám.
- **Dữ liệu:** `courts`, `time_slots`, `booking_slots` + `bookings` (+ `users` lấy tên khách).
- **Cập nhật:** nút "Tải lại" và tự gọi lại mỗi 30 giây (không realtime).

### STF-04 Danh sách đơn và chi tiết
- **API:** `GET /staff/bookings?date=&courtId=&status=&paymentStatus=&keyword=&page=&limit=`, `GET /staff/bookings/:id`.
- **keyword:** khớp `booking_code`, tên khách, số điện thoại (cả khách vãng lai).
- **overdue=true:** chỉ đơn `CONFIRMED` đã qua `end_time` (mở từ widget "Đơn quá giờ" ở Dashboard).
- **Chi tiết:** thông tin đơn, các slot, danh sách `payments`, `booking_status_logs` (P1), **khối "Dịch vụ & hóa đơn"** (các yêu cầu dịch vụ, đồ thuê chưa trả, tổng tiền sân + dịch vụ, còn thiếu — xem STF-11..14), các nút hành động hợp lệ theo trạng thái.

### STF-05 Đặt sân tại quầy ⭐
- **API:** `POST /staff/bookings`; lịch trống lấy từ **`GET /staff/courts/:id/availability?date=`** (áp quy tắc nhân viên của BR-03, cho phép chọn khung giờ đang diễn ra — endpoint công khai sẽ báo `PAST` nên **không dùng** cho màn hình này); tìm khách có tài khoản bằng `GET /staff/customers?keyword=<số điện thoại>`. **Bảng:** như CUS-06 + `created_by`.
- **Input:** `courtId`, `bookingDate`, `timeSlotIds[]`, khách (`customerId` **hoặc** `guestName`+`guestPhone`, BR-17), `payNow` (bool), `paymentMethod` (`CASH`|`BANK_TRANSFER`, bắt buộc khi `payNow=true`), `note?`.
- **Khác CUS-06:** `source='STAFF'`; áp BR-03 phiên bản nhân viên (cho phép giờ đang diễn ra); **không** áp BR-08; không giữ chỗ — đơn tạo ra là `CONFIRMED` ngay.
  - `payNow=true` → INSERT `payments` (`PAYMENT`, `SUCCESS`, `processed_by`) và `payment_status='PAID'`.
  - `payNow=false` → `payment_status='UNPAID'`, `payment_method='CASH'` (đặt qua điện thoại, trả sau tại sân).
- **Lỗi:** như CUS-06 và `400 VALIDATION_ERROR` khi thiếu thông tin khách.

### STF-06 Ghi nhận thanh toán tiền sân ⭐
- **API:** `POST /staff/bookings/:id/payments` (`method`, `transactionRef?`). Sequence: mục 3.3.
- **Luồng (transaction):** khóa đơn → đơn phải `PENDING` hoặc `CONFIRMED` và `payment_status='UNPAID'` → với `PENDING`: còn hạn `expires_at` → INSERT `payments` (`PAYMENT`, `SUCCESS`, `amount=court_amount`, `processed_by`, `processed_at`) → `UPDATE bookings SET payment_status='PAID', payment_method=?` và nếu `PENDING` thì `status='CONFIRMED'`, `expires_at=NULL` → log trạng thái.
- **Lỗi:** `409 INVALID_STATUS`, `409 ALREADY_PAID`, `422 BOOKING_EXPIRED` (đơn đã `EXPIRED`: khách phải đặt lại, nhân viên có thể tạo đơn mới bằng STF-05).

### STF-07 Hoàn thành / No-show
- **API:** `POST /staff/bookings/:id/complete`, `POST /staff/bookings/:id/no-show`.
- **Điều kiện:** BR-12 và BR-28. `UPDATE ... WHERE status='CONFIRMED'` → log.
- **Hoàn thành (`complete`)** kiểm tra theo thứ tự: tiền sân đã `PAID` → đã đến giờ bắt đầu → không còn yêu cầu dịch vụ `REQUESTED` → mọi đồ thuê đã nhận lại → tiền dịch vụ đã thu đủ.
- **No-show:** không cho khi đã có yêu cầu `DELIVERED`; các yêu cầu `REQUESTED` tự `CANCELLED` (BR-12).
- **Lỗi:** `409 INVALID_STATUS`, `422 NOT_PAID` (chưa PAID tiền sân), `422 TOO_EARLY` (chưa đến giờ bắt đầu), `422 HAS_PENDING_SERVICE_ORDERS`, `422 RENTALS_NOT_RETURNED`, `422 SERVICE_BALANCE_DUE`, `409 HAS_DELIVERED_SERVICES` (no-show).

### STF-08 Hủy đơn thay khách
- **API:** `POST /staff/bookings/:id/cancel` (`reason` bắt buộc).
- **Luồng:** như CUS-09 nhưng không giới hạn 6 giờ và không kiểm tra chủ đơn; `refundInfo` tùy chọn (nhân viên có thể ghi "hoàn tiền mặt tại quầy"); vẫn tạo `REFUND PENDING` (`purpose='COURT'`, `payments.note = refundInfo`) nếu `PAID`; vẫn chặn khi có dịch vụ `DELIVERED` (BR-29).

### STF-09 Xác nhận hoàn tiền
- **API:** `GET /staff/refunds?status=PENDING`, `POST /staff/payments/:id/confirm-refund` (`transactionRef?`, `note?`).
- **Giao diện:** danh sách hiển thị mã đơn, tên và SĐT khách, **số tiền hoàn** và **thông tin nhận tiền hoàn** (`refundInfo`, BR-34) để nhân viên chuyển khoản đúng nơi; sau khi chuyển bấm **Xác nhận đã hoàn** và nhập mã giao dịch.
- **Luồng (transaction):** `payments` phải là `REFUND` + `PENDING` → UPDATE `SUCCESS`, `processed_by`, `processed_at` → `bookings.payment_status='REFUNDED'`.
- **Lỗi:** `404`, `409 INVALID_STATUS`.

### STF-10 Chi tiết khách hàng (P1)
- **API:** `GET /staff/customers?keyword=` (tìm theo tên/SĐT; **đã phải có từ P0** vì STF-05 dùng), `GET /staff/customers/:id` (thông tin + 20 đơn gần nhất). Nhân viên chỉ xem, không sửa/khóa.

### STF-11 Hàng đợi yêu cầu dịch vụ (P1★) ⭐
- **API:** `GET /staff/service-orders?status=REQUESTED&date=`, `POST /staff/service-orders/:id/deliver`, `POST /staff/service-orders/:id/cancel` (`reason`).
- **Giao diện:** trang **Yêu cầu dịch vụ** liệt kê theo thời gian gọi (cũ nhất trước): mã đơn, sân, khung giờ, tên khách, các dòng (tên × số lượng), ghi chú; nút **Đã giao** và **Hủy**. Tự làm mới 30 giây (không realtime). Truy vấn: mục 7.8 `01-database.md`.
- **Giao (transaction):** khóa đơn sân và yêu cầu (`FOR UPDATE`) → yêu cầu đang `REQUESTED` → đơn sân vẫn `CONFIRMED` → UPDATE `DELIVERED`, `delivered_by`, `delivered_at` → cập nhật `bookings.service_amount` (mục 7.10) → yêu cầu có đồ thuê thì từ lúc này đồ thuê ở trạng thái "chưa trả".
- **Hủy:** yêu cầu `REQUESTED` hủy được với lý do; yêu cầu `DELIVERED` hủy theo BR-25 (cập nhật lại `service_amount`).
- **Lỗi:** `404`, `409 INVALID_STATUS`, `422 BOOKING_NOT_ACTIVE_FOR_SERVICE`, `409 SERVICE_ALREADY_PAID`, `400 VALIDATION_ERROR` (thiếu lý do khi hủy).

### STF-12 Thêm dịch vụ cho đơn tại quầy (P1★)
- **API:** `POST /staff/bookings/:id/service-orders` (`items[]`, `note?`).
- **Khác CUS-12:** `source = 'STAFF'`, `requested_by` = nhân viên; yêu cầu vào thẳng `DELIVERED` (BR-31) và cập nhật `service_amount` ngay; không giới hạn "trước giờ kết thúc" (nhân viên được thêm cho đơn `CONFIRMED` bất kỳ lúc nào, kể cả khách ở lại quá giờ).
- **Lỗi:** `422 BOOKING_NOT_ACTIVE_FOR_SERVICE` (đơn không `CONFIRMED`), `422 SERVICE_NOT_AVAILABLE`, `400`.

### STF-13 Nhận lại đồ thuê (P1★)
- **API:** `POST /staff/service-order-items/:id/return`.
- **Điều kiện:** dòng thuộc yêu cầu `DELIVERED`, dịch vụ `type = 'RENTAL'`, `returned_at` còn `NULL`. Ghi `returned_at`, `returned_by`.
- **Lỗi:** `404`, `422 NOT_RENTAL_ITEM`, `409 ALREADY_RETURNED`, `409 INVALID_STATUS`.
- **Ý nghĩa:** theo dõi đồ chưa thu hồi; `complete` bị chặn nếu còn đồ chưa trả (BR-28).

### STF-14 Hóa đơn và thu tiền dịch vụ (P1★) ⭐
- **API:** `GET /staff/bookings/:id/invoice`, `POST /staff/bookings/:id/service-payments` (`method` `CASH|BANK_TRANSFER`, `transactionRef?`). Sequence: mục 3.7.
- **Thu tiền dịch vụ (transaction):** khóa đơn → đơn `CONFIRMED` → `serviceBalance = service_amount − tổng payments (SERVICE, PAYMENT, SUCCESS)`; nếu `≤ 0` thì `422 NOTHING_TO_PAY` → INSERT `payments` (`PAYMENT`, `purpose='SERVICE'`, `SUCCESS`, `amount = serviceBalance`, `processed_by`, `processed_at`). **Không đổi trạng thái đơn.** Có thể thu nhiều lần nếu khách gọi thêm sau đó (BR-26).
- **Quy trình trả đồ và ra về (gợi ý cho nhân viên):** (1) STF-13 nhận lại đồ thuê → (2) xem hóa đơn → (3) thu tiền sân nếu còn `UNPAID` (STF-06) và thu tiền dịch vụ (STF-14) → (4) bấm **Hoàn thành** (STF-07).
- **Lỗi:** `404`, `409 INVALID_STATUS`, `422 NOTHING_TO_PAY`.

### STF-15 Bật/tắt "tạm hết hàng" (P1★)
- **API:** `PATCH /staff/services/:id/availability` (`status` ∈ `ACTIVE` | `OUT_OF_STOCK`).
- **Quy tắc:** chỉ chuyển qua lại giữa hai trạng thái này; dịch vụ `INACTIVE` (admin tắt) thì nhân viên không đổi được (`409 INVALID_STATUS`). Gửi `INACTIVE` → `400 VALIDATION_ERROR`. Không ảnh hưởng yêu cầu đã gọi.

---

## C. QUẢN TRỊ VIÊN (Web)

### ADM-01 Quản lý loại sân
- **API:** `GET/POST /admin/court-types`, `PUT /admin/court-types/:id`, `PATCH /admin/court-types/:id/active`.
- **Loại `category`:** `SPORT` (sân thể thao) hoặc `EVENT` (khu sự kiện/tiệc, BR-30). Không đổi `category` khi loại đã có sân có đơn.
- **Quy tắc:** tên duy nhất. Tắt loại sân (`is_active=0`) bị chặn nếu còn sân `ACTIVE` thuộc loại đó **hoặc** còn đơn tương lai (BR-05) → `409 IN_USE`. Không xóa (BR-14).

### ADM-02 Quản lý sân
- **API:** `GET/POST /admin/courts`, `PUT /admin/courts/:id`, `PATCH /admin/courts/:id/status`.
- **Quy tắc:** chuyển `MAINTENANCE`/`INACTIVE` bị chặn nếu còn đơn `PENDING/CONFIRMED` tương lai (`409 COURT_HAS_FUTURE_BOOKINGS`, trả kèm số đơn) (BR-05). Đưa sân về `ACTIVE` luôn được.
- **Ảnh sân:** nhập URL ảnh (`image_url`). Không làm upload file (giảm phức tạp).
- **Sức chứa:** nhập `capacity` (người), bắt buộc với sân thuộc loại `EVENT`, tùy chọn với `SPORT`.

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
- **Đặt lại mật khẩu:** `POST /admin/customers/:id/reset-password` (`newPassword` ≥ 6 ký tự). Vì hệ thống **không có quên mật khẩu qua email**, đây là cách duy nhất để khách bị mất mật khẩu vào lại tài khoản (khách liên hệ nhân viên/admin, admin đặt mật khẩu tạm và báo khách đổi lại ở CUS-03).
- **Hiệu lực:** khóa → không đăng nhập được và token cũ bị từ chối (BR-16). Đơn đã đặt **không** tự hủy; nhân viên xử lý thủ công nếu cần.

### ADM-07 Báo cáo (P1)
- **API:** `GET /admin/reports/summary?from=&to=`, `GET /admin/reports/revenue?from=&to=&groupBy=day|month`, `GET /admin/reports/court-usage?from=&to=`, `GET /admin/reports/services?from=&to=`.
- **Nội dung:**
  - *Tổng quan:* tổng doanh thu thực (thu − hoàn), số đơn theo trạng thái, số khách mới.
  - *Doanh thu:* theo ngày/tháng, **tách tiền sân và tiền dịch vụ** (mục 7.3 `01-database.md`, BR-32).
  - *Dịch vụ:* top 10 dịch vụ bán chạy (số lượng, doanh số) và doanh số theo loại `DRINK`/`RENTAL`/`PACKAGE` (mục 7.11).
  - *Sử dụng sân:* mỗi sân gồm số slot đã đặt, tỷ lệ lấp đầy (mục 7.4).
- **Giới hạn:** khoảng thời gian tối đa 366 ngày. Hiển thị bảng và một biểu đồ cột (Recharts), không làm thêm.

### ADM-08 Quản lý danh mục dịch vụ (P1★)
- **API:** `GET/POST /admin/services`, `PUT /admin/services/:id`, `PATCH /admin/services/:id/status` (`ACTIVE` | `OUT_OF_STOCK` | `INACTIVE`).
- **Dữ liệu:** `name` (duy nhất), `type` (`DRINK` | `RENTAL` | `PACKAGE`), `unit`, `price` (số nguyên ≥ 0), `description`, `image_url`.
- **Quy tắc:** đổi giá **không** ảnh hưởng yêu cầu cũ (snapshot, BR-23). `INACTIVE` ẩn khỏi app; các yêu cầu `REQUESTED` đã gọi vẫn giao được. Không xóa cứng (BR-14). Không quản lý tồn kho.

### ADM-09 Đóng đơn có công nợ (P1★)
- **Actor:** chỉ ADMIN. **API:** `POST /admin/bookings/:id/close-with-debt` (`reason` bắt buộc). Activity: `02-uml-diagrams.md` mục 2.5.
- **Khi nào dùng:** khách đã dùng sân/dịch vụ nhưng **bỏ đi không thanh toán đủ** hoặc **không trả đồ thuê**. Không có chức năng này thì đơn không thể `COMPLETED` (thiếu tiền/đồ, BR-12/BR-28), không thể `CANCELLED` hay `NO_SHOW` (đã có dịch vụ giao, BR-29) và sẽ kẹt mãi ở `CONFIRMED`.
- **Luồng (transaction):** `SELECT booking ... FOR UPDATE` → đơn `CONFIRMED` và đã đến giờ bắt đầu → các `service_orders` `REQUESTED` chuyển `CANCELLED` → `UPDATE bookings SET status='COMPLETED', closed_with_debt=1 WHERE status='CONFIRMED'` → `booking_status_logs` ghi `note` gồm lý do, tiền còn nợ (sân, dịch vụ) và đồ thuê chưa trả.
- **Không tạo `payments`:** công nợ vẫn tính được = `grandTotal − paidAmount`; doanh thu thực không đổi (BR-33). Hóa đơn hiển thị cờ `closedWithDebt` và số còn nợ.
- **Báo cáo:** `GET /admin/reports/summary` trả thêm số đơn đóng có công nợ và tổng công nợ (truy vấn 7.12).
- **Lỗi:** `404`, `409 INVALID_STATUS`, `422 TOO_EARLY`, `400 VALIDATION_ERROR` (thiếu lý do).

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
