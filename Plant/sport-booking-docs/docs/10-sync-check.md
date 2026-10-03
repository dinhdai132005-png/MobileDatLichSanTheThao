# 10 — KIỂM TRA ĐỒNG BỘ VÀ CÂU HỎI CÒN MỞ

> Mục đích: bảo đảm **Nghiệp vụ ↔ Role ↔ Function ↔ UML ↔ Database ↔ API ↔ Backend ↔ Mobile ↔ Web** mô tả cùng một hệ thống. Trạng thái toàn bộ: **ĐỀ XUẤT / CHƯA TRIỂN KHAI**.

## 1. Ma trận truy vết chức năng

Cột UML: UC = Use Case, AD = Activity (02 mục 2), SQ = Sequence (02 mục 3), ST = State (02 mục 4).

| FN | Role | API | Bảng DB chính | Backend service | Mobile / Web | UML |
|---|---|---|---|---|---|---|
| CUS-01 | CUSTOMER | `POST /auth/register` | `users` | `auth.service` | `(auth)/register` | UC |
| CUS-02 | CUSTOMER | `POST /auth/login` | `users` | `auth.service` | `(auth)/login` | UC, SQ 3.1 |
| CUS-03 | CUSTOMER | `GET/PUT /auth/me`, `PUT /auth/change-password` | `users` | `auth.service` | `(tabs)/profile`, `profile/*` | UC |
| CUS-04 | CUSTOMER | `GET /court-types`, `/courts` | `court_types`, `courts` | `catalog.service` | `(tabs)/index` | UC |
| CUS-05 | CUSTOMER | `GET /courts/:id`, `/availability` | `courts`, `time_slots`, `slot_prices`, `booking_slots` | `booking.service` | `courts/[id]` | UC, AD 2.1 |
| CUS-06 | CUSTOMER | `POST /bookings` | `bookings`, `booking_slots`, `booking_status_logs` | `booking.service` | `booking/confirm` | UC, AD 2.1, SQ 3.2, ST |
| CUS-07 | CUSTOMER | `GET /bookings/:id` | `bookings` | `booking.service` | `booking/[id]` | AD 2.1 |
| CUS-08 | CUSTOMER | `GET /bookings/my`, `/bookings/:id` | `bookings`, `booking_slots` | `booking.service` | `(tabs)/bookings`, `booking/[id]` | UC |
| CUS-09 | CUSTOMER | `POST /bookings/:id/cancel` | `bookings`, `booking_slots`, `payments`, `booking_status_logs` | `booking.service` | `booking/[id]` | UC, AD 2.3, SQ 3.4, ST |
| CUS-10 | CUSTOMER | `POST /bookings/:id/review`, `GET /courts/:id/reviews` | `reviews` | `booking.service` | `booking/[id]/review`, `courts/[id]` | UC |
| STF-01 | STAFF, ADMIN | `POST /auth/login` | `users` | `auth.service` | Web `/login`, `/profile` | UC, SQ 3.1 |
| STF-02 | STAFF, ADMIN | `GET /staff/dashboard` | `bookings`, `payments` | `staff.service` | Web `/` | UC |
| STF-03 | STAFF, ADMIN | `GET /staff/schedule` | `courts`, `time_slots`, `booking_slots`, `bookings` | `staff.service` | Web `/schedule` | UC |
| STF-04 | STAFF, ADMIN | `GET /staff/bookings`, `/:id` | `bookings`, `payments`, `booking_status_logs` | `staff.service` | Web `/bookings`, `/bookings/:id` | UC |
| STF-05 | STAFF, ADMIN | `POST /staff/bookings` | `bookings`, `booking_slots`, `payments` | `booking.service` | Web `/bookings/new` | UC |
| STF-06 | STAFF, ADMIN | `POST /staff/bookings/:id/payments` | `payments`, `bookings` | `payment.service` | Web `PaymentModal` | UC, AD 2.2, SQ 3.3, ST |
| STF-07 | STAFF, ADMIN | `POST .../complete`, `.../no-show` | `bookings` | `booking.service` | Web chi tiết đơn | UC, AD 2.2, ST |
| STF-08 | STAFF, ADMIN | `POST /staff/bookings/:id/cancel` | `bookings`, `booking_slots`, `payments` | `booking.service` | Web `CancelModal` | UC, AD 2.3 |
| STF-09 | STAFF, ADMIN | `GET /staff/refunds`, `POST /staff/payments/:id/confirm-refund` | `payments`, `bookings` | `payment.service` | Web `/refunds` | UC, AD 2.3, SQ 3.4 |
| STF-10 | STAFF, ADMIN | `GET /staff/customers`, `/:id` | `users`, `bookings` | `staff.service` | Web `/customers` | UC |
| ADM-01 | ADMIN | `/admin/court-types*` | `court_types` | `admin.service` | Web `/admin/court-types` | UC |
| ADM-02 | ADMIN | `/admin/courts*` | `courts`, `bookings` (kiểm tra BR-05) | `admin.service` | Web `/admin/courts` | UC |
| ADM-03 | ADMIN | `/admin/time-slots*` | `time_slots` | `admin.service` | Web `/admin/time-slots` | UC |
| ADM-04 | ADMIN | `/admin/slot-prices` | `slot_prices` | `admin.service` | Web `/admin/prices` | UC |
| ADM-05 | ADMIN | `/admin/staff*` | `users` | `admin.service` | Web `/admin/staff` | UC |
| ADM-06 | ADMIN | `/admin/customers*` | `users` | `admin.service` | Web `/customers` | UC |
| ADM-07 | ADMIN | `/admin/reports/*` | `payments`, `bookings`, `booking_slots` | `report.service` | Web `/admin/reports` | UC |
| SYS-01 | Hệ thống | (không có API) | `bookings`, `booking_slots`, `booking_status_logs` | `jobs/expire-bookings.job` | — | UC, SQ 3.5, ST |
| SYS-02 | Hệ thống | (không có API) | `booking_status_logs` | `utils/logStatusChange` | Web chi tiết đơn | ST |

## 2. Đồng bộ quy tắc nghiệp vụ → nơi thực thi

| BR | Thực thi ở | Kiểm chứng bằng |
|---|---|---|
| BR-01 | `booking.service` (tính `dayType`) | TC-11 |
| BR-02 | Validator + `booking.service` | TC-14, TC-15 |
| BR-03 | `booking.service` (2 phiên bản APP/STAFF) | TC-10, TC-16 |
| BR-04 | **UNIQUE `uq_slot_active`** + bắt `ER_DUP_ENTRY` | TC-20 |
| BR-05 | `booking.service`, `admin.service` | TC-17, TC-34 |
| BR-06 | `booking.service`, `payment.service` | TC-12, TC-13, TC-32 |
| BR-07 | `jobs/expire-bookings.job` | TC-21 |
| BR-08 | `booking.service` (chỉ APP) | TC-18 |
| BR-09 | `booking.service` | TC-24, TC-26, TC-27 |
| BR-10 | `booking.service`, `payment.service` | TC-25, TC-30, TC-31 |
| BR-11 | `payment.service` (amount = `total_amount`) | TC-22 |
| BR-12 | `booking.service` | TC-28, TC-29 |
| BR-13 | `booking.service` | TC-38 |
| BR-14 | Không có API xóa | Rà soát danh sách endpoint |
| BR-15 | `booking.service` | TC-19, TC-35 |
| BR-16 | `auth.middleware` | TC-04 |
| BR-17 | `booking.service` (staff) | TC-32, TC-33 |
| BR-18 | Client + `requireRole` | TC-05, TC-40 |
| BR-19 | `admin.service` | TC-36, TC-37 |
| BR-20 | `config/db.ts`, `env.ts` | Kiểm tra giờ khi demo |
| BR-21, BR-22 | Validator, `booking.service` | TC-01, TC-12 |

## 3. Đồng bộ danh mục Enum (phải giống nhau ở mọi nơi)

| Enum | DB (`01`) | API (`06`) | UML (`02`) | UI màu/nhãn (`05` mục 4.3) |
|---|---|---|---|---|
| Booking status | 6 giá trị | 6 giá trị | State 4.1 (6 trạng thái) | 6 màu |
| Payment status | `UNPAID/PAID/REFUNDED` | cùng | State 4.2 | 3 màu |
| Payment method | `CASH/BANK_TRANSFER/VNPAY` | `CASH/BANK_TRANSFER` (VNPAY là P2) | — | — |
| Role | `CUSTOMER/STAFF/ADMIN` | cùng | Use Case | — |
| Court status | `ACTIVE/MAINTENANCE/INACTIVE` | cùng | Class | slot `MAINTENANCE` |
| Slot status (chỉ API) | (tính toán) | `AVAILABLE/BOOKED/PAST/MAINTENANCE/NO_PRICE` | — | 4 kiểu hiển thị |

## 4. Quy ước đã chốt để tránh mâu thuẫn

- `bookings.payment_method` ghi **phương thức dự kiến** khi đặt; khi nhân viên ghi nhận thanh toán thì cập nhật thành phương thức **thực tế** (có thể đổi từ `CASH` sang `BANK_TRANSFER` hoặc ngược lại). Bản ghi `payments.method` là sự thật.
- Cột `payments.processed_at` là mốc tính doanh thu (không phải `created_at`).
- Đơn `source='STAFF'` không bao giờ `PENDING` và không có `expires_at`.
- Mã lỗi `IN_USE` dùng cho ADM-01 (tắt loại sân khi còn sân active hoặc đơn tương lai); `SLOT_IN_USE` cho ADM-03; `COURT_HAS_FUTURE_BOOKINGS` cho ADM-02.

## 5. Kết quả rà soát đồng bộ khi lập tài liệu

| Kiểm tra | Kết quả |
|---|---|
| Mọi FN trong `03` có mặt ở `04`, `06`, ma trận mục 1 | Đạt |
| Mọi bảng DB được ít nhất một FN sử dụng | Đạt (`services`, `booking_services` chỉ P2) |
| Mọi endpoint trong `06` thuộc một FN | Đạt (trừ nhóm P2) |
| Mọi trạng thái trong State Diagram nằm trong enum DB | Đạt |
| Mọi màn hình ở `05` gọi API có thật ở `06` | Đạt |
| Sơ đồ UML dựng bằng Mermaid | **Chưa kiểm tra render thực tế**: cần mở thử trên https://mermaid.live hoặc VS Code và sửa nếu trình xem báo lỗi cú pháp |
| Đối chiếu với source/DB/API/md **hiện có** của project | **CHƯA ĐỦ DỮ LIỆU** (chưa có repo để đối chiếu); xem mục 6 |

## 6. Checklist đối chiếu với project hiện có (làm khi có repo)

Với mỗi dòng: đánh **ĐÃ CÓ** (khớp), **LỆCH** (ghi cách xử lý), hoặc **CHƯA TRIỂN KHAI**.

**Database**
- [ ] Có bảng nào ngoài 12 bảng trong `01`? Bảng nào thừa, bảng nào là nghiệp vụ khác?
- [ ] Có ràng buộc UNIQUE chống trùng lịch như `uq_slot_active` chưa? Hay chỉ kiểm tra ở code?
- [ ] Tiền lưu `INT` hay `DECIMAL`/`FLOAT`?
- [ ] Giá có snapshot trong chi tiết đơn không?
- [ ] Trạng thái đơn đang dùng có khớp 6 trạng thái không?
- [ ] Có bảng role/permission động không (có thể gỡ)?

**Backend**
- [ ] Có theo Route → Controller → Service chưa? Có tầng thừa (repository, usecase, dto) không?
- [ ] Có dùng ORM không? Có lý do cần giữ không?
- [ ] Có bắt `ER_DUP_ENTRY` và dùng transaction ở đặt sân chưa?
- [ ] Có `requireRole` ở server cho mọi route nhạy cảm chưa?
- [ ] Format response và mã lỗi có khớp `AGENT.md` mục 4 và `06-api.md` mục 3 không?
- [ ] Có job hết hạn giữ chỗ chưa?

**Frontend**
- [ ] Mobile dùng Expo + TypeScript + điều hướng nào? (Expo Router hay React Navigation: nếu đã dùng React Navigation thì **giữ**, chỉ chỉnh lại đường dẫn ở `05`.)
- [ ] Web có phân quyền giao diện theo role chưa?
- [ ] Có tính giá hoặc kiểm tra trùng lịch ở client không (nên bỏ)?
- [ ] Thư viện nào đã cài mà thuộc nhóm KHÔNG DÙNG (`07` mục 4)? Đánh giá có gỡ được không.

**Tài liệu cũ**
- [ ] Mỗi file `.md` cũ: giữ, hợp nhất vào file mới, hay bỏ? (Gợi ý ánh xạ: `01-database.md` → `01`; `02-class-diagram.md` → `02`; `03-actors-functions.md` → `03`; `04-function-details-flows.md` → `04`; `05-pages-sitemap.md` → `05`; `06-css-rules.md` → `05` mục 4.)

## 7. Câu hỏi còn mở (**CHƯA ĐỦ DỮ LIỆU**) và giá trị mặc định đã dùng

AI cứ dùng **mặc định** để code; nếu chủ project chọn khác thì sửa tài liệu rồi mới đổi code.

| # | Câu hỏi | Mặc định đã dùng | Ảnh hưởng nếu đổi |
|---|---|---|---|
| Q1 | Đồ án mô phỏng **một** cơ sở hay nhiều chi nhánh? | Một cơ sở | Thêm bảng `venues` + `venue_id` ở `courts`, `staff` (lớn) |
| Q2 | Thanh toán: có bắt buộc tích hợp cổng (VNPay/MoMo) không? | Không; tiền mặt + chuyển khoản xác nhận. VNPay là P2 | Thêm callback/IPN, bảng/field giao dịch |
| Q3 | Giảng viên/đề bài có quy định **bắt buộc số role** hoặc chức năng cụ thể không? | Không có ràng buộc; dùng 3 role | Điều chỉnh `03` |
| Q4 | Các loại sân cần hỗ trợ? | Bóng đá mini, cầu lông, tennis, pickleball (dữ liệu seed) | Chỉ đổi seed, không đổi code |
| Q5 | Giờ mở cửa và độ dài khung giờ? | 06:00–22:00, 1 giờ | Đổi seed `time_slots`; nếu khung 30 phút phải rà BR-02 (tối đa 3 slot) |
| Q6 | Chính sách hủy mong muốn? | Trước ≥ 6 giờ, hoàn 100% | Đổi `CANCEL_DEADLINE_HOURS`; hoàn theo bậc cần thêm logic |
| Q7 | Mobile có cần hỗ trợ nhân viên không? | Không (chỉ khách) | Thêm bộ màn hình staff trên mobile |
| Q8 | Có yêu cầu ngôn ngữ giao diện (VN/EN)? | Chỉ tiếng Việt | Thêm i18n |
| Q9 | Hạn chót đồ án và số người thực hiện? | Chưa biết; kế hoạch chia theo mốc | Quyết định cắt P1/P2 (`08` mục 3) |
| Q10 | Project hiện có đã code theo hướng nào? | Chưa biết; coi như làm mới | Làm checklist mục 6 rồi quyết định giữ/chuyển |
