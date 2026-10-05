# AGENT.md — Luật làm việc cho công cụ AI

> Đọc file này **trước khi viết bất kỳ dòng code nào**. Tài liệu trong `docs/` là nguồn sự thật. Nếu code mâu thuẫn tài liệu, **tài liệu thắng**, trừ khi chủ project nói khác.

## 1. Thứ tự đọc

`README.md` → `AGENT.md` (file này) → `03-actors-functions.md` (quy tắc BR-xx) → `01-database.md` → `06-api.md` → `04-function-details-flows.md` → `05-pages-sitemap.md` → `07-architecture.md` → `11-end-to-end-flows.md` (bức tranh liền mạch Mobile–Web) → `08-development-plan.md` (chọn task để làm).

## 2. Mười nguyên tắc vàng

1. **Mỗi lần làm đúng một task** trong `08-development-plan.md`. Không làm trước task sau.
2. **Không tự thêm** bảng, cột, endpoint, role, trạng thái, thư viện lớn ngoài tài liệu. Cần thêm thì **dừng và hỏi** (xem mục 11).
3. **Schema DB chỉ lấy từ `01-database.md`.** Không tự đổi tên cột.
4. **Hợp đồng API chỉ lấy từ `06-api.md`.** Không đổi tên field, đường dẫn, mã lỗi.
5. **Mọi quy tắc nghiệp vụ nằm ở `03-actors-functions.md` (BR-xx).** Code phải có comment `// BR-07` ở chỗ áp dụng.
6. **Kiến trúc 3 lớp cố định:** Route → Controller → Service → DB. Không thêm tầng khác (Repository, UseCase, DTO mapper phức tạp...).
7. **SQL thuần với tham số hóa (`?`).** Không nối chuỗi vào SQL. Không dùng ORM.
8. **Chống trùng lịch dựa vào UNIQUE KEY**, bắt lỗi `ER_DUP_ENTRY` → trả `409 SLOT_TAKEN`. Không thay bằng "SELECT kiểm tra rồi INSERT".
9. **Mọi thao tác ghi nhiều bảng phải nằm trong transaction.**
10. **Đổi code ảnh hưởng nghiệp vụ, DB hay API thì phải cập nhật tài liệu tương ứng trong cùng lần làm.**

## 2.1 Cấu trúc repo (ĐỀ XUẤT, monorepo)

```
sport-booking/
├── docs/                 # bộ tài liệu này
├── database/
│   ├── schema.sql        # copy từ 01-database.md mục 5
│   └── seed.sql          # dữ liệu mẫu (loại sân, sân, khung giờ, giá)
├── backend/              # Node + Express + TS
├── web-admin/            # React + Vite + TS
└── mobile/               # Expo + TS
```

## 3. Quy ước đặt tên

| Phạm vi | Quy ước | Ví dụ |
|---|---|---|
| Bảng/cột DB | `snake_case`, bảng số nhiều | `booking_slots.time_slot_id` |
| JSON API, biến TS | `camelCase` | `bookingDate`, `timeSlotIds` |
| Type/Interface/Component | `PascalCase` | `BookingDetail`, `ScheduleGrid` |
| File backend | `ten.vai-tro.ts` | `booking.service.ts`, `booking.routes.ts` |
| File component | `PascalCase.tsx` | `SlotPicker.tsx` |
| Enum giá trị | `UPPER_SNAKE_CASE` chuỗi | `BANK_TRANSFER`, `NO_SHOW` |
| Đường dẫn API | `kebab-case`, số nhiều | `/court-types`, `/booking-slots` |

Backend chuyển `snake_case` (DB) sang `camelCase` (JSON) trong **service** bằng hàm tiện ích `toCamel()`. Controller không đụng vào dữ liệu thô.

**Định dạng thời gian trao đổi (bắt buộc):**
- Ngày: chuỗi `"YYYY-MM-DD"` (VD `"2026-10-05"`)
- Giờ: chuỗi `"HH:mm"` (VD `"18:00"`)
- Thời điểm: ISO 8601 có offset `+07:00`
- **Không bao giờ** gửi ngày dưới dạng `Date` JS có múi giờ (tránh lệch ngày). Giờ hệ thống: `Asia/Ho_Chi_Minh`.
- MySQL trả cột `TIME` dạng `"17:00:00"`: `toCamel()`/mapper phải **cắt về `"HH:mm"`** trước khi trả ra API (đã kiểm chứng khi chạy thử truy vấn 7.1).

## 4. Chuẩn response

Thành công:
```json
{ "success": true, "message": "OK", "data": { } }
```
Danh sách có phân trang:
```json
{ "success": true, "message": "OK",
  "data": { "items": [ ], "page": 1, "limit": 20, "total": 57 } }
```
Lỗi:
```json
{ "success": false, "message": "Khung giờ đã có người đặt",
  "errorCode": "SLOT_TAKEN", "errors": null }
```
`errors` chỉ có khi lỗi validate: `[{ "field": "phone", "message": "Số điện thoại không hợp lệ" }]`.

Bảng mã lỗi nằm ở `06-api.md` mục 3. `message` hiển thị cho người dùng bằng **tiếng Việt**.

## 5. Mẫu 3 lớp (bắt buộc làm theo)

```ts
// routes/booking.routes.ts — chỉ khai báo đường dẫn + middleware
router.post('/', auth, requireRole('CUSTOMER'), validate(createBookingSchema), bookingController.create);

// controllers/booking.controller.ts — đọc request, gọi service, trả response. KHÔNG có SQL, KHÔNG có logic nghiệp vụ
export const create = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.user!, req.body);
  return created(res, data);
});

// services/booking.service.ts — logic nghiệp vụ + SQL + transaction. Ném ApiError khi vi phạm quy tắc
export async function createBooking(user: AuthUser, input: CreateBookingInput) {
  return withTransaction(async (conn) => {
    // ... kiểm tra BR-02, BR-03, BR-08 ...
    // ... INSERT bookings, INSERT booking_slots (bắt ER_DUP_ENTRY → ApiError.conflict('SLOT_TAKEN')) ...
  });
}
```

Quy tắc phân vai:

| Lớp | Được làm | Không được làm |
|---|---|---|
| Route | Gắn middleware, map URL → controller | Logic, SQL |
| Controller | Lấy `req.params/query/body/user`, gọi 1 hàm service, format response | SQL, if nghiệp vụ |
| Service | Nghiệp vụ, SQL, transaction, ném `ApiError` | Đụng `req`/`res` |
| Middleware | Xác thực, phân quyền, validate, bắt lỗi | Nghiệp vụ |

## 6. Xác thực và phân quyền

- Header: `Authorization: Bearer <jwt>`. Payload JWT: `{ sub: userId, role }`, hạn `JWT_EXPIRES_IN` (mặc định `1d`). Không làm refresh token.
- Middleware `auth`: verify JWT → **truy vấn lại DB** lấy user → nếu không tồn tại hoặc `status='LOCKED'` thì `401 ACCOUNT_LOCKED` (BR-16).
- Middleware `requireRole(...roles)`: sai role thì `403 FORBIDDEN`.
- `ADMIN` phải được liệt kê rõ ở các route của STAFF: `requireRole('STAFF','ADMIN')`.
- Khách chỉ đọc/sửa **đơn của chính mình**. Truy cập đơn người khác thì `404 NOT_FOUND` (không lộ sự tồn tại).
- Mật khẩu: `bcryptjs` (cost 10). Không bao giờ trả `password_hash` ra API.

## 7. Transaction và đồng thời

- Dùng helper `withTransaction(fn)` (lấy connection từ pool → BEGIN → fn → COMMIT / ROLLBACK).
- Đặt sân: INSERT `bookings` → INSERT `booking_slots`. Nếu `ER_DUP_ENTRY` ở `uq_slot_active` thì ROLLBACK và `409 SLOT_TAKEN`.
- Giao/hủy yêu cầu dịch vụ, nhập hộ dịch vụ, thu tiền dịch vụ: `SELECT ... FOR UPDATE` dòng `bookings` → thay đổi `service_orders`/`payments` → gọi `recalcServiceAmount()` (cache `bookings.service_amount`) → COMMIT. Hủy đơn sân, no-show, hoàn thành phải kiểm tra điều kiện dịch vụ (BR-12, BR-28, BR-29).
- Hủy/hết hạn: UPDATE `bookings.status` **và** `booking_slots.is_locked = NULL` **và** INSERT `booking_status_logs` trong cùng transaction.
- Mọi chuyển trạng thái booking phải: (1) kiểm tra trạng thái hiện tại hợp lệ theo `02-uml-diagrams.md` mục State, (2) `UPDATE ... WHERE id=? AND status=?` rồi kiểm tra `affectedRows = 1` (chống thao tác chồng), (3) ghi `booking_status_logs`.

## 8. Quy tắc frontend (Web và Mobile)

- Gọi API qua **một** module `api/client.ts` (axios): tự gắn Bearer token, tự xử lý `401` (xóa token, về màn đăng nhập).
- Token: Web lưu `localStorage`. Mobile lưu bằng `expo-secure-store`.
- **Role guard:** Web chặn role `CUSTOMER` đăng nhập (BR-18). Mobile chặn `STAFF`/`ADMIN` (hiện "Vui lòng dùng Web quản trị").
- Mỗi màn hình có đủ 3 trạng thái: **loading**, **lỗi (có nút thử lại)**, **rỗng**.
- Hiển thị: tiền `150.000 ₫` (`Intl.NumberFormat('vi-VN')`), ngày `dd/MM/yyyy`, giờ `HH:mm`.
- Không tính giá hoặc kiểm tra trùng lịch ở client. **Server là nguồn sự thật**; client chỉ hiển thị.
- Màu trạng thái và quy ước UI: `05-pages-sitemap.md` mục 4.
- **Đồng bộ hai nền tảng (bắt buộc, xem `11` mục 1):** hằng số `POLL_INTERVAL_MS = 30000` dùng chung cho mọi màn hình theo dõi (tự gọi lại API khi màn hình đang mở, dừng khi rời màn hình/ở nền); danh sách tải lại khi tab/màn hình được focus; interceptor xử lý `401` (kể cả `ACCOUNT_LOCKED`) bằng cách xóa token và về màn đăng nhập.
- Số tiền tổng/đã trả/còn thiếu **chỉ** lấy từ `GET .../invoice`; `paymentStatus` của booking chỉ là tiền sân.
- Màn **Đặt tại quầy** dùng `GET /staff/courts/:id/availability` (không dùng endpoint công khai).

## 9. Definition of Done (mỗi task)

- [ ] Chạy được (backend: gọi bằng curl hoặc REST client, FE: chạy trên máy).
- [ ] Đúng `06-api.md` (đường dẫn, field, mã lỗi) và đúng quy tắc BR-xx.
- [ ] Có xử lý lỗi và validate đầu vào (dùng `zod`).
- [ ] Không có `console.log` debug, không có secret trong code.
- [ ] Đã chạy các test case liên quan trong `08-development-plan.md` mục 4.
- [ ] Cập nhật tài liệu nếu có thay đổi (nguyên tắc 10).
- [ ] Báo cáo ngắn: làm gì, file nào đổi, cách kiểm tra, điều gì chưa làm.

## 10. Danh sách KHÔNG ĐƯỢC LÀM

- ❌ Không thêm ORM (Prisma/Sequelize/TypeORM), Redux, GraphQL, WebSocket/Socket.IO, Docker bắt buộc, microservice, queue (Bull/Redis).
- ❌ Không tạo hai backend. Web và Mobile dùng chung `/api/v1`.
- ❌ Không xóa cứng `courts`, `court_types`, `time_slots`, `users`, `bookings`.
- ❌ Không để role-check chỉ ở frontend.
- ❌ Không tin giá hoặc tổng tiền từ client. Server tự tính từ `slot_prices` (tiền sân) và `services.price` (dịch vụ).
- ❌ Không tạo bảng `invoices`; hóa đơn tính khi đọc (`utils/invoice.ts`).
- ❌ Không quản lý tồn kho dịch vụ, không tính phí thuê theo giờ/quá giờ, không cho khách thanh toán dịch vụ trong app.
- ❌ Không tính `service_amount` từ yêu cầu `REQUESTED` hay `CANCELLED`; chỉ yêu cầu `DELIVERED`.
- ❌ Không "xóa nợ" bằng cách tạo `payments` giả; dùng `close-with-debt` (chỉ ADMIN, BR-33).
- ❌ Không bỏ `refundInfo` khi khách hủy đơn đã `PAID` (BR-34).
- ❌ Không dùng `SELECT` rồi `INSERT` thay cho UNIQUE KEY để chống trùng.
- ❌ Không thêm tính năng ngoài danh mục (voucher, ghép đội, đặt định kỳ, chat, đa chi nhánh...). Xem `00-analysis-review.md` mục "Nên bỏ".
- ❌ Không commit file `.env` thật.
- ❌ Không "tiện tay" refactor code của task khác.

## 11. Khi thiếu thông tin hoặc tài liệu mâu thuẫn

1. Tìm trong `10-sync-check.md` mục 7 (câu hỏi mở). Nếu đã có **giá trị mặc định** thì dùng mặc định và ghi chú.
2. Nếu mâu thuẫn giữa hai file: ưu tiên theo thứ tự `03` (nghiệp vụ) > `01` (DB) > `06` (API) > `04` > `05` > còn lại. Ghi lại mâu thuẫn trong báo cáo.
3. Nếu vẫn không chốt được: **dừng, nêu rõ câu hỏi và phương án đề xuất**, không tự đoán.

## 12. Biến môi trường (backend `.env.example`)

```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sport_booking
JWT_SECRET=doi-thanh-chuoi-bi-mat-dai
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
TZ=Asia/Ho_Chi_Minh
BANK_NAME=Vietcombank
BANK_ACCOUNT_NO=0123456789
BANK_ACCOUNT_NAME=TEN CHU TAI KHOAN
ADMIN_PHONE=0900000001
ADMIN_PASSWORD=doi-mat-khau-nay
```

## 13. Hằng số nghiệp vụ (`backend/src/config/business.ts`)

```ts
export const BUSINESS = {
  BOOKING_ADVANCE_DAYS: 14,         // BR-03
  MIN_LEAD_MINUTES: 30,             // BR-03 (chỉ áp dụng cho đơn từ APP)
  MAX_SLOTS_PER_BOOKING: 3,         // BR-02
  HOLD_MINUTES_BANK_TRANSFER: 30,   // BR-07
  CANCEL_DEADLINE_HOURS: 6,         // BR-09
  MAX_ACTIVE_BOOKINGS_PER_CUSTOMER: 3, // BR-08
  WEEKEND_DAYS: [0, 6],             // Chủ nhật = 0, Thứ bảy = 6 (BR-01)
  EXPIRE_JOB_INTERVAL_MS: 60_000,   // BR-07
  MAX_ITEMS_PER_SERVICE_ORDER: 10,  // BR-24
  MAX_QUANTITY_PER_ITEM: 20,        // BR-24
  REFUND_INFO_MAX_LENGTH: 300,      // BR-34
} as const;
```

## 13b. Quy tắc tính tiền (tiền sân, dịch vụ, hóa đơn)

| Đại lượng | Công thức | Ghi chú |
|---|---|---|
| `court_amount` | Σ `booking_slots.price` | Snapshot lúc đặt (BR-15) |
| `service_amount` | Σ `quantity × unit_price` của yêu cầu **`DELIVERED`** | Cache trong `bookings`; tính lại bằng `recalcServiceAmount` |
| `grandTotal` | `court_amount + service_amount` | Không lưu, tính khi đọc |
| `paidAmount` | Σ `payments` (`PAYMENT`, `SUCCESS`) | Cả `COURT` và `SERVICE` |
| `servicePaid` | Σ `payments` (`PAYMENT`, `SUCCESS`, `SERVICE`) | |
| `serviceBalance` | `service_amount − servicePaid` | Số tiền thu ở "Thu tiền dịch vụ" (BR-26) |
| `balance` | `grandTotal − paidAmount` | Hiển thị cho khách và nhân viên |

`bookings.payment_status` chỉ phản ánh **tiền sân**. Hoàn tiền (`REFUND`) luôn là `purpose = 'COURT'` (BR-29).

## 14. Mẫu prompt giao task cho AI

```
Bạn là lập trình viên của project này. Đọc docs/AGENT.md và các file được nêu.
TASK: <mã task, VD T09 — API tạo booking; hoặc T18C — khách gọi dịch vụ>
Tham chiếu: 06-api.md mục 5.4, 04-function-details-flows.md FN CUS-06, 03 (BR-02,03,04,06,07,08,15), 01 (bookings, booking_slots).
Chỉ làm task này. Khi xong báo cáo theo "Definition of Done".
```
