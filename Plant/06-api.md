# 06 — ĐẶC TẢ REST API

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2: dịch vụ phát sinh, hóa đơn, khu sự kiện; bổ sung đóng đơn có công nợ, thông tin hoàn tiền, lịch trống cho nhân viên, đặt lại mật khẩu khách). Đây là **hợp đồng** giữa Backend và hai Frontend. Không đổi tên field, đường dẫn, mã lỗi nếu chưa cập nhật tài liệu này.

## 1. Quy ước chung

- **Base URL:** `/api/v1`. Định dạng JSON, `Content-Type: application/json`.
- **Xác thực:** `Authorization: Bearer <jwt>` (trừ endpoint nhóm Công khai).
- **Naming:** đường dẫn `kebab-case` số nhiều; JSON `camelCase`; enum `UPPER_SNAKE_CASE`.
- **Thời gian:** ngày `"YYYY-MM-DD"`, giờ `"HH:mm"`, thời điểm ISO 8601 `+07:00`.
- **Tiền:** số nguyên VND.
- **Phân trang:** `?page=1&limit=20` (mặc định 1/20, tối đa limit 100). Phản hồi dạng `{ items, page, limit, total }`.
- **Format response:** xem `AGENT.md` mục 4.

## 2. Phân nhóm và quyền

| Nhóm | Tiền tố | Quyền |
|---|---|---|
| Công khai | `/auth/register`, `/auth/login`, `/court-types`, `/courts`, `/time-slots`, `/services`, `/config/public` | Không cần token |
| Đã đăng nhập | `/auth/me`, `/auth/change-password` | Mọi role |
| Khách hàng | `/bookings/*` | `CUSTOMER` |
| Nhân viên | `/staff/*` | `STAFF`, `ADMIN` |
| Quản trị | `/admin/*` | `ADMIN` |

## 3. Mã lỗi

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Sai định dạng đầu vào (kèm `errors[]`) |
| 401 | `UNAUTHORIZED` | Thiếu/sai/hết hạn token |
| 401 | `INVALID_CREDENTIALS` | Sai số điện thoại hoặc mật khẩu |
| 401 | `ACCOUNT_LOCKED` | Tài khoản bị khóa (BR-16) |
| 403 | `FORBIDDEN` | Sai role |
| 404 | `NOT_FOUND` | Không có tài nguyên (hoặc không thuộc quyền xem) |
| 409 | `PHONE_EXISTS`, `EMAIL_EXISTS` | Trùng số điện thoại/email |
| 409 | `SLOT_TAKEN` | Khung giờ đã có người đặt (BR-04) |
| 409 | `INVALID_STATUS` | Chuyển trạng thái không hợp lệ |
| 409 | `ALREADY_PAID`, `ALREADY_REVIEWED`, `ALREADY_RETURNED` | Thao tác lặp |
| 409 | `HAS_DELIVERED_SERVICES` | Hủy/no-show đơn sân khi đã có dịch vụ đã giao (BR-29, BR-12) |
| 409 | `SERVICE_ALREADY_PAID` | Hủy yêu cầu đã giao khiến tiền dịch vụ đã thu vượt tổng mới (BR-25) |
| 409 | `COURT_HAS_FUTURE_BOOKINGS`, `SLOT_IN_USE`, `IN_USE` | Vi phạm BR-05, quy tắc ADM |
| 409 | `LAST_ADMIN`, `CANNOT_LOCK_SELF` | BR-19 |
| 422 | `COURT_NOT_BOOKABLE` | Sân không `ACTIVE` |
| 422 | `BOOKING_DATE_INVALID` | Ngoài dải ngày cho phép (BR-03) |
| 422 | `SLOT_IN_PAST` | Khung giờ quá gần/đã qua (BR-03) |
| 422 | `SLOTS_NOT_CONSECUTIVE` | Khung giờ không liền kề/quá 3 (BR-02) |
| 422 | `TOO_MANY_ACTIVE_BOOKINGS` | Quá 3 đơn hoạt động (BR-08) |
| 422 | `PRICE_NOT_CONFIGURED` | Thiếu giá (BR-15) |
| 422 | `CANCEL_DEADLINE_PASSED` | Quá hạn hủy (BR-09) |
| 422 | `BOOKING_EXPIRED` | Đơn đã hết hạn giữ chỗ |
| 422 | `NOT_PAID`, `TOO_EARLY`, `BOOKING_NOT_COMPLETED` | Vi phạm BR-12/BR-13 |
| 422 | `REFUND_INFO_REQUIRED` | Khách hủy đơn đã trả mà không nhập thông tin nhận tiền hoàn (BR-34) |
| 422 | `BOOKING_NOT_ACTIVE_FOR_SERVICE` | Đơn không `CONFIRMED` hoặc đã qua giờ kết thúc khi khách gọi dịch vụ (BR-24) |
| 422 | `SERVICE_NOT_AVAILABLE` | Dịch vụ `OUT_OF_STOCK`/`INACTIVE` (BR-23) |
| 422 | `HAS_PENDING_SERVICE_ORDERS`, `RENTALS_NOT_RETURNED`, `SERVICE_BALANCE_DUE` | Không đủ điều kiện hoàn thành đơn (BR-28) |
| 422 | `NOTHING_TO_PAY`, `NOT_RENTAL_ITEM` | Không còn tiền dịch vụ cần thu / dòng không phải đồ thuê |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước (không lộ chi tiết) |

## 4. Danh sách endpoint

### 4.1 Công khai và Auth

| Method | Đường dẫn | Quyền | Mô tả | FN |
|---|---|---|---|---|
| POST | `/auth/register` | Public | Đăng ký khách (role CUSTOMER) | CUS-01 |
| POST | `/auth/login` | Public | Đăng nhập, nhận JWT | CUS-02, STF-01 |
| GET | `/auth/me` | Đăng nhập | Thông tin tài khoản | CUS-03 |
| PUT | `/auth/me` | Đăng nhập | Sửa họ tên, email | CUS-03 |
| PUT | `/auth/change-password` | Đăng nhập | Đổi mật khẩu | CUS-03 |
| GET | `/court-types` | Public | Loại sân đang active | CUS-04 |
| GET | `/courts` | Public | Sân (lọc `courtTypeId`) | CUS-04 |
| GET | `/courts/:id` | Public | Chi tiết sân | CUS-05 |
| GET | `/courts/:id/availability?date=` | Public | Lịch trống và giá | CUS-05 |
| GET | `/courts/:id/reviews` | Public | Đánh giá của sân (phân trang) | CUS-10 |
| GET | `/time-slots` | Public | Khung giờ active | CUS-05 |
| GET | `/services` | Public | Danh mục dịch vụ (`?type=`), gồm cả `OUT_OF_STOCK` | CUS-11 |
| GET | `/config/public` | Public | Quy tắc hiển thị cho app (xem 5.9) | CUS-06 |

### 4.2 Khách hàng

| Method | Đường dẫn | Mô tả | FN |
|---|---|---|---|
| POST | `/bookings` | Tạo đơn | CUS-06 |
| GET | `/bookings/my` | Đơn của tôi (`?status=` nhiều giá trị cách nhau dấu phẩy) | CUS-08 |
| GET | `/bookings/:id` | Chi tiết đơn của tôi | CUS-07, CUS-08 |
| POST | `/bookings/:id/cancel` | Hủy đơn | CUS-09 |
| POST | `/bookings/:id/review` | Đánh giá | CUS-10 |
| POST | `/bookings/:id/service-orders` | Gọi dịch vụ cho đơn của tôi | CUS-12 |
| GET | `/bookings/:id/invoice` | Hóa đơn của đơn của tôi | CUS-13 |
| POST | `/bookings/:id/service-orders/:orderId/cancel` | Hủy yêu cầu dịch vụ chưa giao | CUS-13 |

### 4.3 Nhân viên (`STAFF`, `ADMIN`)

| Method | Đường dẫn | Mô tả | FN |
|---|---|---|---|
| GET | `/staff/dashboard` | Số liệu hôm nay | STF-02 |
| GET | `/staff/schedule?date=` | Lịch lưới sân | STF-03 |
| GET | `/staff/courts/:id/availability?date=` | Lịch trống của sân **theo quy tắc nhân viên** (cho phép giờ đang diễn ra) dùng ở màn Đặt tại quầy | STF-05 |
| GET | `/staff/bookings` | Danh sách đơn, lọc (`date`, `courtId`, `status`, `paymentStatus`, `keyword`, `overdue=true`) | STF-04 |
| GET | `/staff/bookings/:id` | Chi tiết đơn | STF-04 |
| POST | `/staff/bookings` | Đặt tại quầy | STF-05 |
| POST | `/staff/bookings/:id/payments` | Ghi nhận thanh toán | STF-06 |
| POST | `/staff/bookings/:id/complete` | Hoàn thành | STF-07 |
| POST | `/staff/bookings/:id/no-show` | No-show | STF-07 |
| POST | `/staff/bookings/:id/cancel` | Hủy thay khách | STF-08 |
| GET | `/staff/refunds?status=` | Danh sách hoàn tiền | STF-09 |
| POST | `/staff/payments/:id/confirm-refund` | Xác nhận đã hoàn | STF-09 |
| GET | `/staff/customers` | Tìm khách theo tên/SĐT (`?keyword=`), **dùng cho STF-05 nên thuộc P0** | STF-05, STF-10 |
| GET | `/staff/customers/:id` | Khách và đơn gần nhất | STF-10 |
| GET | `/staff/service-orders` | Hàng đợi yêu cầu dịch vụ (`?status=&date=`) | STF-11 |
| POST | `/staff/service-orders/:id/deliver` | Xác nhận đã giao | STF-11 |
| POST | `/staff/service-orders/:id/cancel` | Hủy yêu cầu (có lý do) | STF-11 |
| POST | `/staff/bookings/:id/service-orders` | Thêm dịch vụ tại quầy (vào thẳng đã giao) | STF-12 |
| POST | `/staff/service-order-items/:id/return` | Nhận lại đồ thuê | STF-13 |
| GET | `/staff/bookings/:id/invoice` | Hóa đơn của một đơn bất kỳ | STF-14 |
| POST | `/staff/bookings/:id/service-payments` | Thu tiền dịch vụ | STF-14 |
| PATCH | `/staff/services/:id/availability` | Bật/tắt tạm hết hàng | STF-15 |

### 4.4 Quản trị (`ADMIN`)

| Method | Đường dẫn | Mô tả | FN |
|---|---|---|---|
| GET, POST | `/admin/court-types` | Danh sách (cả inactive) / tạo | ADM-01 |
| PUT | `/admin/court-types/:id` | Sửa | ADM-01 |
| PATCH | `/admin/court-types/:id/active` | Bật/tắt | ADM-01 |
| GET, POST | `/admin/courts` | Danh sách (cả inactive) / tạo | ADM-02 |
| PUT | `/admin/courts/:id` | Sửa thông tin | ADM-02 |
| PATCH | `/admin/courts/:id/status` | Đổi trạng thái | ADM-02 |
| GET, POST | `/admin/time-slots` | Danh sách (cả inactive) / tạo | ADM-03 |
| PUT | `/admin/time-slots/:id` | Sửa | ADM-03 |
| PATCH | `/admin/time-slots/:id/active` | Bật/tắt | ADM-03 |
| GET | `/admin/slot-prices?courtTypeId=` | Ma trận giá | ADM-04 |
| PUT | `/admin/slot-prices` | Cập nhật hàng loạt | ADM-04 |
| GET, POST | `/admin/staff` | Danh sách / tạo nhân viên | ADM-05 |
| PUT | `/admin/staff/:id` | Sửa họ tên, email | ADM-05 |
| PATCH | `/admin/staff/:id/status` | Khóa/mở | ADM-05 |
| POST | `/admin/staff/:id/reset-password` | Đặt lại mật khẩu | ADM-05 |
| GET | `/admin/customers` | Danh sách khách | ADM-06 |
| PATCH | `/admin/customers/:id/status` | Khóa/mở khách | ADM-06 |
| POST | `/admin/customers/:id/reset-password` | Đặt lại mật khẩu cho khách | ADM-06 |
| POST | `/admin/bookings/:id/close-with-debt` | Đóng đơn có công nợ (lý do bắt buộc) | ADM-09 |
| GET | `/admin/reports/summary` | Tổng quan | ADM-07 |
| GET | `/admin/reports/revenue` | Doanh thu theo ngày/tháng | ADM-07 |
| GET | `/admin/reports/court-usage` | Sử dụng sân | ADM-07 |
| GET | `/admin/reports/services` | Dịch vụ bán chạy, doanh số theo loại | ADM-07 |
| GET, POST | `/admin/services` | Danh sách (cả `INACTIVE`) / tạo dịch vụ | ADM-08 |
| PUT | `/admin/services/:id` | Sửa dịch vụ | ADM-08 |
| PATCH | `/admin/services/:id/status` | Đổi trạng thái dịch vụ | ADM-08 |

**Ghi chú:** `GET /court-types` và `GET /courts` nhận thêm `?category=SPORT|EVENT`; mỗi loại sân trả thêm `category`, mỗi sân trả thêm `capacity`.

P2 (chỉ khi làm): `POST /bookings/:id/vnpay-url`, `GET /payments/vnpay-return`, `POST /payments/vnpay-ipn`.

## 5. Đặc tả chi tiết các endpoint trọng yếu

### 5.1 `POST /auth/register`
Request:
```json
{ "fullName": "Nguyễn Văn A", "phone": "0912345678", "password": "123456", "email": "a@gmail.com" }
```
Response `201`:
```json
{ "success": true, "message": "Đăng ký thành công",
  "data": { "token": "<jwt>",
            "user": { "id": 12, "fullName": "Nguyễn Văn A", "phone": "0912345678",
                      "email": "a@gmail.com", "role": "CUSTOMER", "status": "ACTIVE" } } }
```

### 5.2 `POST /auth/login`
Request: `{ "phone": "0912345678", "password": "123456" }`
Response `200`: giống 5.1 (`data.token`, `data.user`).

### 5.3 `GET /courts/:id/availability?date=2026-10-05`
Response `200`:
```json
{ "success": true, "message": "OK", "data": {
  "courtId": 3, "courtName": "Sân 5A", "courtTypeName": "Bóng đá mini 5 người",
  "courtStatus": "ACTIVE", "date": "2026-10-05", "dayType": "WEEKDAY",
  "slots": [
    { "timeSlotId": 1,  "startTime": "06:00", "endTime": "07:00", "price": 150000, "status": "AVAILABLE" },
    { "timeSlotId": 12, "startTime": "17:00", "endTime": "18:00", "price": 300000, "status": "BOOKED" },
    { "timeSlotId": 13, "startTime": "18:00", "endTime": "19:00", "price": null,   "status": "NO_PRICE" }
  ] } }
```
`status` ∈ `AVAILABLE | BOOKED | PAST | MAINTENANCE | NO_PRICE`. Lỗi: `400` (ngày sai định dạng/ngoài dải), `404`.

`GET /staff/courts/:id/availability?date=` (STAFF, ADMIN) trả **cùng cấu trúc**, chỉ khác quy tắc `PAST`: slot chỉ là `PAST` khi **đã kết thúc** (`end_time ≤ now`), không áp mốc 30 phút (BR-03 phiên bản nhân viên). Dùng cho màn Đặt tại quầy để nhân viên chọn được khung giờ đang diễn ra.

### 5.4 `POST /bookings` (quyền `CUSTOMER`)
Request:
```json
{ "courtId": 3, "bookingDate": "2026-10-05", "timeSlotIds": [12, 13],
  "paymentMethod": "BANK_TRANSFER", "note": "Đá giao hữu" }
```
Response `201`:
```json
{ "success": true, "message": "Đặt sân thành công", "data": {
  "id": 101, "bookingCode": "BK7F3KQ9ZA",
  "court": { "id": 3, "name": "Sân 5A", "courtTypeName": "Bóng đá mini 5 người" },
  "bookingDate": "2026-10-05", "startTime": "17:00", "endTime": "19:00",
  "slots": [ { "timeSlotId": 12, "startTime": "17:00", "endTime": "18:00", "price": 300000 },
             { "timeSlotId": 13, "startTime": "18:00", "endTime": "19:00", "price": 300000 } ],
  "courtAmount": 600000, "serviceAmount": 0, "grandTotal": 600000,
  "status": "PENDING", "paymentMethod": "BANK_TRANSFER",
  "paymentStatus": "UNPAID", "source": "APP",
  "expiresAt": "2026-10-03T10:45:00+07:00", "note": "Đá giao hữu",
  "customer": { "id": 12, "name": "Nguyễn Văn A", "phone": "0912345678" },
  "canCancel": true, "createdAt": "2026-10-03T10:15:00+07:00",
  "paymentInfo": { "bankName": "Vietcombank", "accountNo": "0123456789",
                   "accountName": "TEN CHU TAI KHOAN", "amount": 600000,
                   "transferContent": "BK7F3KQ9ZA" } } }
```
- `paymentInfo` chỉ có khi `PENDING` + `BANK_TRANSFER`, ngược lại là `null`.
- Lỗi: xem mã lỗi trong `04-function-details-flows.md` CUS-06.

**Đối tượng Booking chuẩn** (dùng chung cho 5.4, `GET /bookings/:id`, `/bookings/my` rút gọn, `/staff/bookings/:id`): các field như trên. `canCancel` do server tính (đơn `PENDING`/`CONFIRMED`, còn ≥ 6 giờ và chưa có dịch vụ đã giao), chỉ ý nghĩa với khách. `paymentStatus` chỉ phản ánh thanh toán **tiền sân**; chi tiết thanh toán dịch vụ xem hóa đơn (5.14). Có thêm `canOrderService` (đơn `CONFIRMED` và chưa qua giờ kết thúc) và `closedWithDebt` (`true` nếu ADMIN đã đóng đơn có công nợ, BR-33). `/bookings/my` và `/staff/bookings` trả bản rút gọn (không có `slots`, `paymentInfo`).

### 5.5 `POST /bookings/:id/cancel` (CUSTOMER) và `POST /staff/bookings/:id/cancel`
Request: khách `{ "reason": "Bận việc", "refundInfo": "Vietcombank 0123456789 NGUYEN VAN A" }` (`reason` tùy chọn; **`refundInfo` bắt buộc khi đơn đã `PAID`**, tối đa 300 ký tự, có thể là "Nhận tiền mặt tại quầy"); nhân viên `{ "reason": "Khách gọi hủy", "refundInfo": "Hoàn tiền mặt tại quầy" }` (`reason` bắt buộc, `refundInfo` tùy chọn).
Response `200`: `data` = booking đã cập nhật + `"refundPending": true|false`. `refundInfo` được lưu vào `payments.note` của dòng `REFUND` (BR-34). Lỗi riêng: `422 REFUND_INFO_REQUIRED`.

### 5.6 `POST /staff/bookings` (đặt tại quầy)
Request (khách vãng lai):
```json
{ "courtId": 3, "bookingDate": "2026-10-03", "timeSlotIds": [14],
  "guestName": "Anh Tuấn", "guestPhone": "0987654321",
  "payNow": true, "paymentMethod": "CASH", "note": "" }
```
Hoặc khách có tài khoản: thay `guestName`/`guestPhone` bằng `"customerId": 12`.
Response `201`: booking `status="CONFIRMED"`, `source="STAFF"`, `paymentStatus` = `PAID` nếu `payNow` ngược lại `UNPAID`.

### 5.7 `POST /staff/bookings/:id/payments`
Request: `{ "method": "BANK_TRANSFER", "transactionRef": "FT26100312345" }` (`method` ∈ `CASH|BANK_TRANSFER`).
Response `200`: booking đã cập nhật (`paymentStatus="PAID"`, `status="CONFIRMED"`) kèm `payments[]`.

### 5.8 `GET /staff/schedule?date=2026-10-03`
```json
{ "success": true, "message": "OK", "data": {
  "date": "2026-10-03",
  "timeSlots": [ { "id": 1, "startTime": "06:00", "endTime": "07:00" } ],
  "courts": [ {
    "courtId": 3, "courtName": "Sân 5A", "courtTypeName": "Bóng đá mini 5 người", "status": "ACTIVE",
    "slots": [ { "timeSlotId": 1, "booking": null },
               { "timeSlotId": 14, "booking": { "id": 101, "bookingCode": "BK7F3KQ9ZA",
                  "customerName": "Anh Tuấn", "customerPhone": "0987654321",
                  "status": "CONFIRMED", "paymentStatus": "PAID" } } ] } ] } }
```

### 5.9 `GET /config/public`
```json
{ "data": { "bookingAdvanceDays": 14, "holdMinutes": 30, "cancelDeadlineHours": 6,
            "maxSlotsPerBooking": 3, "maxActiveBookingsPerCustomer": 3,
            "paymentMethods": ["CASH", "BANK_TRANSFER"] } }
```

### 5.10 `PUT /admin/slot-prices`
```json
{ "courtTypeId": 1,
  "prices": [ { "timeSlotId": 1, "dayType": "WEEKDAY", "price": 150000 },
              { "timeSlotId": 1, "dayType": "WEEKEND", "price": 200000 } ] }
```
Response `200`: số dòng được ghi.

### 5.11 `GET /admin/reports/revenue?from=2026-10-01&to=2026-10-31&groupBy=day`
```json
{ "data": { "totalRevenue": 18450000, "courtRevenue": 16200000, "serviceRevenue": 2250000,
            "items": [ { "date": "2026-10-01",
                         "court":   { "paid": 2100000, "refunded": 300000, "revenue": 1800000 },
                         "service": { "paid": 350000,  "refunded": 0,      "revenue": 350000 },
                         "revenue": 2150000 } ] } }
```

### 5.12 `PATCH /admin/courts/:id/status`
Request: `{ "status": "MAINTENANCE" }`. Lỗi `409 COURT_HAS_FUTURE_BOOKINGS` kèm `"data": { "futureBookings": 3 }`.

### 5.13 `POST /bookings/:id/service-orders` (CUSTOMER) và `POST /staff/bookings/:id/service-orders` (nhân viên)
Request:
```json
{ "items": [ { "serviceId": 4, "quantity": 2 }, { "serviceId": 9, "quantity": 1 } ],
  "note": "Mang ra sân số 2" }
```
Response `201`:
```json
{ "success": true, "message": "Đã gửi yêu cầu", "data": {
  "id": 55, "bookingId": 101, "status": "REQUESTED", "source": "APP", "note": "Mang ra sân số 2",
  "items": [ { "id": 201, "serviceId": 4, "name": "Nước suối", "type": "DRINK",
               "quantity": 2, "unitPrice": 10000, "lineAmount": 20000, "returnedAt": null },
             { "id": 202, "serviceId": 9, "name": "Thuê vợt cầu lông", "type": "RENTAL",
               "quantity": 1, "unitPrice": 30000, "lineAmount": 30000, "returnedAt": null } ],
  "orderAmount": 50000, "createdAt": "2026-10-05T18:10:00+07:00", "deliveredAt": null } }
```
- Với nhân viên: `status = "DELIVERED"`, `source = "STAFF"`, có `deliveredAt`; `serviceAmount` của đơn đã cộng ngay (BR-31).
- Lỗi: `400`, `404`, `422 BOOKING_NOT_ACTIVE_FOR_SERVICE`, `422 SERVICE_NOT_AVAILABLE`.

### 5.14 `GET /bookings/:id/invoice` (CUSTOMER, đơn của mình) và `GET /staff/bookings/:id/invoice`
Response `200`:
```json
{ "success": true, "message": "OK", "data": {
  "bookingId": 101, "bookingCode": "BK7F3KQ9ZA", "status": "CONFIRMED",
  "court": { "id": 3, "name": "Sân 5A" }, "bookingDate": "2026-10-05",
  "startTime": "17:00", "endTime": "19:00",
  "courtAmount": 600000,
  "orders": [ { "id": 55, "status": "DELIVERED", "orderAmount": 50000, "deliveredAt": "2026-10-05T18:15:00+07:00",
                "items": [ { "id": 201, "name": "Nước suối", "type": "DRINK", "quantity": 2,
                             "unitPrice": 10000, "lineAmount": 20000, "returnedAt": null },
                           { "id": 202, "name": "Thuê vợt cầu lông", "type": "RENTAL", "quantity": 1,
                             "unitPrice": 30000, "lineAmount": 30000, "returnedAt": null } ] },
              { "id": 56, "status": "REQUESTED", "orderAmount": 15000, "items": [ ] } ],
  "serviceAmount": 50000,
  "grandTotal": 650000,
  "paidAmount": 600000, "servicePaid": 0,
  "balance": 50000, "serviceBalance": 50000,
  "unreturnedRentals": [ { "itemId": 202, "name": "Thuê vợt cầu lông", "quantity": 1 } ],
  "payments": [ { "id": 301, "type": "PAYMENT", "purpose": "COURT", "method": "BANK_TRANSFER",
                  "amount": 600000, "status": "SUCCESS", "processedAt": "2026-10-03T10:30:00+07:00" } ] } }
```
- `serviceAmount` chỉ gồm các yêu cầu `DELIVERED` (BR-25). Yêu cầu `REQUESTED` hiển thị nhưng **chưa tính tiền**.
- `grandTotal = courtAmount + serviceAmount`; `balance = grandTotal − paidAmount`; `serviceBalance = serviceAmount − (đã thu purpose SERVICE)` (BR-26).
- `servicePaid` = tổng tiền dịch vụ đã thu (`payments` có `purpose = SERVICE`).

### 5.15 `POST /staff/bookings/:id/service-payments`
Request: `{ "method": "CASH", "transactionRef": null }`.
Response `200`: hóa đơn (cấu trúc 5.14) sau khi cập nhật; `payments` có thêm dòng `purpose = "SERVICE"`, `amount = serviceBalance` trước khi thu. Lỗi: `422 NOTHING_TO_PAY`, `409 INVALID_STATUS`.

### 5.16 Hàng đợi và xử lý yêu cầu dịch vụ (nhân viên)
`GET /staff/service-orders?status=REQUESTED&date=2026-10-05`
```json
{ "data": { "items": [ { "id": 55, "status": "REQUESTED", "createdAt": "2026-10-05T18:10:00+07:00",
    "note": "Mang ra sân số 2",
    "booking": { "id": 101, "bookingCode": "BK7F3KQ9ZA", "courtName": "Sân 5A",
                 "startTime": "17:00", "endTime": "19:00", "customerName": "Nguyễn Văn A", "customerPhone": "0912345678" },
    "items": [ { "id": 201, "name": "Nước suối", "type": "DRINK", "quantity": 2, "unitPrice": 10000 } ],
    "orderAmount": 20000 } ], "page": 1, "limit": 20, "total": 1 } }
```
- `POST /staff/service-orders/:id/deliver` (không body) → `200`, yêu cầu `DELIVERED`, kèm `serviceAmount` mới của đơn.
- `POST /staff/service-orders/:id/cancel` body `{ "reason": "Hết hàng" }` (bắt buộc) → `200`.
- `POST /staff/service-order-items/:id/return` (không body) → `200`, dòng có `returnedAt`.
- `PATCH /staff/services/:id/availability` body `{ "status": "OUT_OF_STOCK" }` → `200`.

### 5.17 `POST /bookings/:id/service-orders/:orderId/cancel` (CUSTOMER)
Body tùy chọn `{ "reason": "Đổi ý" }`. Chỉ yêu cầu `REQUESTED` của đơn mình. Lỗi `409 INVALID_STATUS` nếu đã `DELIVERED` hoặc `CANCELLED`.

### 5.18 `GET /services` và `/admin/services`
`GET /services?type=DRINK` → `{ "data": [ { "id": 4, "name": "Nước suối", "type": "DRINK", "unit": "chai", "price": 10000, "description": "500ml", "imageUrl": null, "status": "ACTIVE" } ] }`.
Admin: `POST /admin/services` body `{ "name", "type", "unit", "price", "description?", "imageUrl?" }`; `PATCH /admin/services/:id/status` body `{ "status": "INACTIVE" }`.

### 5.19 `GET /admin/reports/services?from=&to=`
```json
{ "data": { "byType": [ { "type": "DRINK", "qty": 320, "amount": 3200000 },
                        { "type": "RENTAL", "qty": 85, "amount": 2550000 },
                        { "type": "PACKAGE", "qty": 6, "amount": 4800000 } ],
            "topServices": [ { "serviceId": 4, "name": "Nước suối", "type": "DRINK", "qty": 210, "amount": 2100000 } ] } }
```

### 5.20 `GET /staff/refunds?status=PENDING`
```json
{ "data": { "items": [ { "paymentId": 410, "amount": 600000, "status": "PENDING",
    "refundInfo": "Vietcombank 0123456789 NGUYEN VAN A", "createdAt": "2026-10-03T11:00:00+07:00",
    "booking": { "id": 101, "bookingCode": "BK7F3KQ9ZA", "courtName": "Sân 5A", "bookingDate": "2026-10-05",
                 "customerName": "Nguyễn Văn A", "customerPhone": "0912345678" } } ],
    "page": 1, "limit": 20, "total": 1 } }
```
`POST /staff/payments/:id/confirm-refund` body `{ "transactionRef": "FT26100399999", "note": "" }` → `200`, dòng `SUCCESS`, đơn `paymentStatus = "REFUNDED"`.

### 5.21 `POST /admin/bookings/:id/close-with-debt` (ADMIN)
Request: `{ "reason": "Khách bỏ về, chưa trả tiền dịch vụ và vợt" }` (bắt buộc).
Response `200`: hóa đơn (cấu trúc 5.14) với `status = "COMPLETED"`, `closedWithDebt = true`, `balance` > 0 giữ nguyên (không tạo `payments`). Lỗi: `409 INVALID_STATUS`, `422 TOO_EARLY`, `400`.
`GET /admin/reports/summary` bổ sung `"debtClosed": { "count": 1, "amount": 50000 }`.

### 5.22 `POST /admin/customers/:id/reset-password` (ADMIN)
Request: `{ "newPassword": "matkhautam1" }` → `200`. Không trả lại mật khẩu. Khách dùng mật khẩu tạm rồi đổi ở `PUT /auth/change-password`.

### 5.23 `GET /staff/customers?keyword=0912`
`{ "data": { "items": [ { "id": 12, "fullName": "Nguyễn Văn A", "phone": "0912345678", "status": "ACTIVE" } ], "page": 1, "limit": 20, "total": 1 } }` — chỉ khách `CUSTOMER`, tối đa 20 dòng, dùng để chọn `customerId` khi đặt tại quầy.

## 6. Ghi chú cài đặt (cho AI)

- Mọi endpoint có validate bằng `zod` ở middleware `validate`; sai → `400 VALIDATION_ERROR`.
- Mọi endpoint ghi đa bảng chạy trong `withTransaction`.
- Chuyển trạng thái đơn: `UPDATE ... WHERE id=? AND status=?` rồi kiểm tra `affectedRows` (xem `AGENT.md` mục 7).
- Không trả `password_hash`, không trả thông tin khách khác cho `CUSTOMER`.
- Giao/hủy yêu cầu dịch vụ và thu tiền dịch vụ: khóa dòng `bookings` bằng `SELECT ... FOR UPDATE` trước khi tính lại `service_amount`/`serviceBalance` (tránh hai nhân viên thao tác chồng).
- Server tự tính mọi số tiền dịch vụ và hóa đơn; client không gửi giá.
- Danh sách trả `items` đã `camelCase`; trường ngày/giờ đã được format theo mục 1.
