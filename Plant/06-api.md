# 06 — ĐẶC TẢ REST API

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI**. Đây là **hợp đồng** giữa Backend và hai Frontend. Không đổi tên field, đường dẫn, mã lỗi nếu chưa cập nhật tài liệu này.

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
| Công khai | `/auth/register`, `/auth/login`, `/court-types`, `/courts`, `/time-slots`, `/config/public` | Không cần token |
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
| 409 | `ALREADY_PAID`, `ALREADY_REVIEWED` | Thao tác lặp |
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
| GET | `/config/public` | Public | Quy tắc hiển thị cho app (xem 5.9) | CUS-06 |

### 4.2 Khách hàng

| Method | Đường dẫn | Mô tả | FN |
|---|---|---|---|
| POST | `/bookings` | Tạo đơn | CUS-06 |
| GET | `/bookings/my` | Đơn của tôi (`?status=` nhiều giá trị cách nhau dấu phẩy) | CUS-08 |
| GET | `/bookings/:id` | Chi tiết đơn của tôi | CUS-07, CUS-08 |
| POST | `/bookings/:id/cancel` | Hủy đơn | CUS-09 |
| POST | `/bookings/:id/review` | Đánh giá | CUS-10 |

### 4.3 Nhân viên (`STAFF`, `ADMIN`)

| Method | Đường dẫn | Mô tả | FN |
|---|---|---|---|
| GET | `/staff/dashboard` | Số liệu hôm nay | STF-02 |
| GET | `/staff/schedule?date=` | Lịch lưới sân | STF-03 |
| GET | `/staff/bookings` | Danh sách đơn, lọc | STF-04 |
| GET | `/staff/bookings/:id` | Chi tiết đơn | STF-04 |
| POST | `/staff/bookings` | Đặt tại quầy | STF-05 |
| POST | `/staff/bookings/:id/payments` | Ghi nhận thanh toán | STF-06 |
| POST | `/staff/bookings/:id/complete` | Hoàn thành | STF-07 |
| POST | `/staff/bookings/:id/no-show` | No-show | STF-07 |
| POST | `/staff/bookings/:id/cancel` | Hủy thay khách | STF-08 |
| GET | `/staff/refunds?status=` | Danh sách hoàn tiền | STF-09 |
| POST | `/staff/payments/:id/confirm-refund` | Xác nhận đã hoàn | STF-09 |
| GET | `/staff/customers` | Tra cứu khách (`?keyword=`) | STF-10 |
| GET | `/staff/customers/:id` | Khách và đơn gần nhất | STF-10 |

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
| GET | `/admin/reports/summary` | Tổng quan | ADM-07 |
| GET | `/admin/reports/revenue` | Doanh thu theo ngày/tháng | ADM-07 |
| GET | `/admin/reports/court-usage` | Sử dụng sân | ADM-07 |

P2 (chỉ khi làm): `/admin/services` (CRUD), `GET /services` (công khai), `POST /bookings/:id/vnpay-url`, `GET /payments/vnpay-return`, `POST /payments/vnpay-ipn`.

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
  "totalAmount": 600000, "status": "PENDING", "paymentMethod": "BANK_TRANSFER",
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

**Đối tượng Booking chuẩn** (dùng chung cho 5.4, `GET /bookings/:id`, `/bookings/my` rút gọn, `/staff/bookings/:id`): các field như trên. `canCancel` do server tính (đơn `PENDING`/`CONFIRMED` và còn ≥ 6 giờ), chỉ ý nghĩa với khách. `/bookings/my` và `/staff/bookings` trả bản rút gọn (không có `slots`, `paymentInfo`).

### 5.5 `POST /bookings/:id/cancel` (CUSTOMER) và `POST /staff/bookings/:id/cancel`
Request: khách `{ "reason": "Bận việc" }` (tùy chọn); nhân viên `{ "reason": "Khách gọi hủy" }` (bắt buộc).
Response `200`: `data` = booking đã cập nhật + `"refundPending": true|false`.

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
{ "data": { "totalRevenue": 18450000,
            "items": [ { "date": "2026-10-01", "paid": 2100000, "refunded": 300000, "revenue": 1800000 } ] } }
```

### 5.12 `PATCH /admin/courts/:id/status`
Request: `{ "status": "MAINTENANCE" }`. Lỗi `409 COURT_HAS_FUTURE_BOOKINGS` kèm `"data": { "futureBookings": 3 }`.

## 6. Ghi chú cài đặt (cho AI)

- Mọi endpoint có validate bằng `zod` ở middleware `validate`; sai → `400 VALIDATION_ERROR`.
- Mọi endpoint ghi đa bảng chạy trong `withTransaction`.
- Chuyển trạng thái đơn: `UPDATE ... WHERE id=? AND status=?` rồi kiểm tra `affectedRows` (xem `AGENT.md` mục 7).
- Không trả `password_hash`, không trả thông tin khách khác cho `CUSTOMER`.
- Danh sách trả `items` đã `camelCase`; trường ngày/giờ đã được format theo mục 1.
