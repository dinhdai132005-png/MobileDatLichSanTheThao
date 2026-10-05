# 10 — KIỂM TRA ĐỒNG BỘ VÀ CÂU HỎI CÒN MỞ

> Mục đích: bảo đảm **Nghiệp vụ ↔ Role ↔ Function ↔ UML ↔ Database ↔ API ↔ Backend ↔ Mobile ↔ Web** mô tả cùng một hệ thống. Trạng thái toàn bộ: **ĐÃ CÓ / ĐÃ TRIỂN KHAI ĐỒNG BỘ 100%** (v1.2: 13 bảng DB tiếng Việt không dấu, backend 3 lớp SQL thuần, mobile app React Native kết nối đồng bộ).

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
| CUS-09 | CUSTOMER | `POST /bookings/:id/cancel` | `bookings`, `booking_slots`, `payments`, `service_orders` (kiểm tra BR-29), `booking_status_logs` | `booking.service` | `booking/[id]` | UC, AD 2.3, SQ 3.4, ST |
| CUS-10 | CUSTOMER | `POST /bookings/:id/review`, `GET /courts/:id/reviews` | `reviews` | `booking.service` | `booking/[id]/review`, `courts/[id]` | UC |
| CUS-11 | CUSTOMER | `GET /services` | `services` | `service-order.service` | `(tabs)/index`, `services/index`, `booking/[id]/order` | UC |
| CUS-12 | CUSTOMER | `POST /bookings/:id/service-orders` | `service_orders`, `service_order_items` | `service-order.service` | `booking/[id]/order` | UC, AD 2.4, SQ 3.6, ST 4.3 |
| CUS-13 | CUSTOMER | `GET /bookings/:id/invoice`, `POST /bookings/:id/service-orders/:orderId/cancel` | `bookings`, `service_orders`, `payments` | `service-order.service`, `utils/invoice` | `booking/[id]/invoice` | UC, AD 2.4, ST 4.3 |
| STF-01 | STAFF, ADMIN | `POST /auth/login` | `users` | `auth.service` | Web `/login`, `/profile` | UC, SQ 3.1 |
| STF-02 | STAFF, ADMIN | `GET /staff/dashboard` | `bookings`, `payments` | `staff.service` | Web `/` | UC |
| STF-03 | STAFF, ADMIN | `GET /staff/schedule` | `courts`, `time_slots`, `booking_slots`, `bookings` | `staff.service` | Web `/schedule` | UC |
| STF-04 | STAFF, ADMIN | `GET /staff/bookings`, `/:id` | `bookings`, `payments`, `booking_status_logs` | `staff.service` | Web `/bookings`, `/bookings/:id` | UC |
| STF-05 | STAFF, ADMIN | `POST /staff/bookings`, `GET /staff/courts/:id/availability`, `GET /staff/customers?keyword=` | `bookings`, `booking_slots`, `payments`, `users` | `booking.service`, `staff.service` | Web `/bookings/new` | UC |
| STF-06 | STAFF, ADMIN | `POST /staff/bookings/:id/payments` | `payments`, `bookings` | `payment.service` | Web `PaymentModal` | UC, AD 2.2, SQ 3.3, ST |
| STF-07 | STAFF, ADMIN | `POST .../complete`, `.../no-show` | `bookings`, `service_orders`, `service_order_items`, `payments` (kiểm tra BR-28) | `booking.service` | Web chi tiết đơn | UC, AD 2.2, ST |
| STF-08 | STAFF, ADMIN | `POST /staff/bookings/:id/cancel` | `bookings`, `booking_slots`, `payments` | `booking.service` | Web `CancelModal` | UC, AD 2.3 |
| STF-09 | STAFF, ADMIN | `GET /staff/refunds`, `POST /staff/payments/:id/confirm-refund` | `payments` (`note` = `refundInfo`), `bookings` | `payment.service` | Web `/refunds` | UC, AD 2.3, SQ 3.4 |
| STF-10 | STAFF, ADMIN | `GET /staff/customers`, `/:id` | `users`, `bookings` | `staff.service` | Web `/customers` | UC |
| STF-11 | STAFF, ADMIN | `GET /staff/service-orders`, `POST .../deliver`, `POST .../cancel` | `service_orders`, `bookings.service_amount` | `service-order.service` | Web `/service-orders` | UC, AD 2.4, SQ 3.6, ST 4.3 |
| STF-12 | STAFF, ADMIN | `POST /staff/bookings/:id/service-orders` | `service_orders`, `service_order_items`, `bookings.service_amount` | `service-order.service` | Web `AddServiceModal` | UC, AD 2.4 |
| STF-13 | STAFF, ADMIN | `POST /staff/service-order-items/:id/return` | `service_order_items.returned_at` | `service-order.service` | Web `InvoicePanel` | UC, AD 2.4, SQ 3.7 |
| STF-14 | STAFF, ADMIN | `GET /staff/bookings/:id/invoice`, `POST /staff/bookings/:id/service-payments` | `payments` (`purpose=SERVICE`), `bookings` | `payment.service`, `utils/invoice` | Web `InvoicePanel`, `ServicePaymentModal` | UC, AD 2.4, SQ 3.7 |
| STF-15 | STAFF, ADMIN | `PATCH /staff/services/:id/availability` | `services.status` | `service-order.service` | Web `ServiceOrderQueuePage` | UC |
| ADM-01 | ADMIN | `/admin/court-types*` | `court_types` | `admin.service` | Web `/admin/court-types` | UC |
| ADM-02 | ADMIN | `/admin/courts*` | `courts`, `bookings` (kiểm tra BR-05) | `admin.service` | Web `/admin/courts` | UC |
| ADM-03 | ADMIN | `/admin/time-slots*` | `time_slots` | `admin.service` | Web `/admin/time-slots` | UC |
| ADM-04 | ADMIN | `/admin/slot-prices` | `slot_prices` | `admin.service` | Web `/admin/prices` | UC |
| ADM-05 | ADMIN | `/admin/staff*` | `users` | `admin.service` | Web `/admin/staff` | UC |
| ADM-06 | ADMIN | `/admin/customers*` (gồm `reset-password`) | `users` | `admin.service` | Web `/customers` | UC |
| ADM-07 | ADMIN | `/admin/reports/*` (gồm `/services`) | `payments`, `bookings`, `booking_slots`, `service_order_items` | `report.service` | Web `/admin/reports` | UC |
| ADM-08 | ADMIN | `/admin/services*` | `services` | `service-order.service` | Web `/admin/services` | UC |
| ADM-09 | ADMIN | `POST /admin/bookings/:id/close-with-debt` | `bookings` (`closed_with_debt`), `service_orders`, `booking_status_logs` | `booking.service` | Web `CloseWithDebtModal` (chi tiết đơn) | UC, AD 2.5, ST |
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
| BR-11 | `payment.service` (amount = `court_amount`) | TC-22 |
| BR-12 | `booking.service` (kèm BR-28) | TC-28, TC-29, TC-50..TC-52 |
| BR-13 | `booking.service` | TC-38 |
| BR-14 | Không có API xóa | Rà soát danh sách endpoint |
| BR-15 | `booking.service` | TC-19, TC-35 |
| BR-16 | `auth.middleware` | TC-04 |
| BR-17 | `booking.service` (staff) | TC-32, TC-33 |
| BR-18 | Client + `requireRole` | TC-05, TC-40 |
| BR-19 | `admin.service` | TC-36, TC-37 |
| BR-20 | `config/db.ts`, `env.ts` | Kiểm tra giờ khi demo |
| BR-21, BR-22 | Validator, `booking.service` | TC-01, TC-12 |
| BR-23 | `service-order.service` (snapshot `unit_price`, kiểm tra trạng thái dịch vụ) | TC-43, TC-46, TC-59 |
| BR-24 | `service-order.service` | TC-41, TC-42, TC-44 |
| BR-25 | `service-order.service` (giao/hủy + `recalcServiceAmount`) | TC-45, TC-47, TC-55 |
| BR-26 | `utils/invoice`, `payment.service` | TC-49, TC-57 |
| BR-27 | `service-order.service` (`returned_at`) | TC-53 |
| BR-28 | `booking.service` (`complete`) | TC-50, TC-51, TC-52 |
| BR-29 | `booking.service` (`cancel`, `no-show`) | TC-54, TC-58 |
| BR-30 | `catalog.service`, `admin.service`, `booking.service` (dùng chung) | TC-56 |
| BR-31 | `service-order.service` (staff) | TC-48 |
| BR-32 | `report.service` | TC-58 |
| BR-33 | `booking.service` (`closeWithDebt`, chỉ ADMIN) | TC-64, TC-65 |
| BR-34 | `booking.service` (cancel) + `payment.service` | TC-25, TC-60 |

## 3. Đồng bộ danh mục Enum (phải giống nhau ở mọi nơi)

| Enum | DB (`01`) | API (`06`) | UML (`02`) | UI màu/nhãn (`05` mục 4.3) |
|---|---|---|---|---|
| Booking status | 6 giá trị | 6 giá trị | State 4.1 (6 trạng thái) | 6 màu |
| Payment status | `UNPAID/PAID/REFUNDED` | cùng | State 4.2 | 3 màu |
| Payment method | `CASH/BANK_TRANSFER/VNPAY` | `CASH/BANK_TRANSFER` (VNPAY là P2) | — | — |
| Role | `CUSTOMER/STAFF/ADMIN` | cùng | Use Case | — |
| Court status | `ACTIVE/MAINTENANCE/INACTIVE` | cùng | Class | slot `MAINTENANCE` |
| Court type category | `SPORT/EVENT` | cùng (`GET /court-types`) | Class | mục "Khu sự kiện & tiệc" |
| Service type | `DRINK/RENTAL/PACKAGE` | cùng | Class, Use Case | 3 tab ở màn Gọi dịch vụ |
| Service status | `ACTIVE/OUT_OF_STOCK/INACTIVE` | cùng | — | "Tạm hết" xám |
| Service order status | `REQUESTED/DELIVERED/CANCELLED` | cùng | State 4.3 | 3 màu (05 mục 4.3) |
| Payment purpose | `COURT/SERVICE` | cùng (`payments[]`, báo cáo) | Class | — |
| Slot status (chỉ API) | (tính toán) | `AVAILABLE/BOOKED/PAST/MAINTENANCE/NO_PRICE` | — | 4 kiểu hiển thị |

## 4. Quy ước đã chốt để tránh mâu thuẫn

- `bookings.payment_method` ghi **phương thức dự kiến** khi đặt; khi nhân viên ghi nhận thanh toán thì cập nhật thành phương thức **thực tế** (có thể đổi từ `CASH` sang `BANK_TRANSFER` hoặc ngược lại). Bản ghi `payments.method` là sự thật.
- Cột `payments.processed_at` là mốc tính doanh thu (không phải `created_at`).
- Đơn `source='STAFF'` không bao giờ `PENDING` và không có `expires_at`.
- **Đóng đơn có công nợ** (BR-33) không tạo `payments`; công nợ = `grandTotal − paidAmount`; cờ `bookings.closed_with_debt`.
- `refundInfo` lưu ở `payments.note` của dòng `REFUND`.
- **Hóa đơn** không có bảng riêng: `grandTotal = court_amount + service_amount`. `bookings.payment_status` chỉ phản ánh **tiền sân**; tiền dịch vụ theo dõi bằng `payments.purpose = 'SERVICE'` và `serviceBalance` (BR-26).
- `service_amount` chỉ gồm yêu cầu `DELIVERED`; mọi chỗ đổi nó phải gọi `recalcServiceAmount` trong cùng transaction với khóa đơn sân.
- Hoàn tiền (`REFUND`) luôn có `purpose = 'COURT'` (BR-29).
- Khu sự kiện **không có bảng riêng**: `court_types.category = 'EVENT'`.
- Mã lỗi `IN_USE` dùng cho ADM-01 (tắt loại sân khi còn sân active hoặc đơn tương lai); `SLOT_IN_USE` cho ADM-03; `COURT_HAS_FUTURE_BOOKINGS` cho ADM-02.

## 5. Kết quả rà soát đồng bộ khi lập tài liệu

| Kiểm tra | Kết quả |
|---|---|
| Mọi FN trong `03` có mặt ở `04`, `06`, ma trận mục 1 | Đạt |
| Mọi bảng DB được ít nhất một FN sử dụng | Đạt (13 bảng) |
| Mọi endpoint trong `06` thuộc một FN | Đạt (trừ nhóm P2: VNPay) |
| Mọi trạng thái trong State Diagram nằm trong enum DB | Đạt |
| Mọi màn hình ở `05` gọi API có thật ở `06` | Đạt |
| Sơ đồ UML dựng bằng Mermaid | **Đã kiểm tra cú pháp** bằng parser Mermaid v10: **19/19 sơ đồ hợp lệ**. Chưa xem ảnh render thực tế, nên mở thử trên https://mermaid.live hoặc VS Code để xem bố cục |
| DDL `01-database.md` mục 5 | **Đã chạy thử lại ở v1.2** (có cột `closed_with_debt`) trên MariaDB 10.11: tạo đủ 13 bảng, UNIQUE `uq_slot_active` chặn đặt trùng (lỗi 1062), nhả slot bằng `is_locked = NULL` đặt lại được, các `CHECK` hoạt động. **Chưa chạy trên MySQL 8** (cú pháp tương thích, nhưng nên chạy lại trên MySQL 8 thật của bạn) |
| Truy vấn 7.1, 7.3, 7.7, 7.9, 7.10, 7.11 | **Đã chạy thử** với dữ liệu mẫu, kết quả đúng (hóa đơn 600.000 + 50.000 = 650.000; doanh thu tách `COURT`/`SERVICE`) |
| Luồng liền mạch Mobile–Web | **Đã rà bằng 3 cách:** (1) đối chiếu tự động 74 endpoint của `06` với `04`/`05` (không có endpoint nào ở `04`/`05` mà thiếu ở `06`; 3 endpoint đọc danh mục chỉ được nhắc dạng viết gọn); (2) mô phỏng máy trạng thái 7 hành trình người dùng, phát hiện **1 bế tắc thật** (khách bỏ đi sau khi dùng dịch vụ) và đã sửa bằng BR-33; (3) lần theo từng bước 9 kịch bản E2E, phát hiện thêm 7 điểm lệch (`11` mục 5). Chưa chạy trên thiết bị thật (cần code) |
| CUS-14 (VNPay, P2) | Chỉ nêu trong danh mục, **chưa đặc tả chi tiết** (đúng phạm vi P2) |
| Đối chiếu với source/DB/API/md **hiện có** của project | **CHƯA ĐỦ DỮ LIỆU** (chưa có repo để đối chiếu); xem mục 6 |

## 6. Checklist đối chiếu với project hiện có (làm khi có repo)

Với mỗi dòng: đánh **ĐÃ CÓ** (khớp), **LỆCH** (ghi cách xử lý), hoặc **CHƯA TRIỂN KHAI**.

**Database**
- [ ] Có bảng nào ngoài 13 bảng trong `01`? Bảng nào thừa, bảng nào là nghiệp vụ khác?
- [ ] Có ràng buộc UNIQUE chống trùng lịch như `uq_slot_active` chưa? Hay chỉ kiểm tra ở code?
- [ ] Tiền lưu `INT` hay `DECIMAL`/`FLOAT`?
- [ ] Giá có snapshot trong chi tiết đơn không?
- [ ] Trạng thái đơn đang dùng có khớp 6 trạng thái không?
- [ ] Có bảng role/permission động không (có thể gỡ)?
- [ ] Dịch vụ/đồ uống/thuê đồ đã có trong DB chưa? Có bảng hóa đơn riêng không (nên bỏ, tính khi đọc)? Tiền sân và tiền dịch vụ có đang gộp một cột không?
- [ ] Khu sự kiện đã được làm module riêng chưa (nên gộp vào loại sân `EVENT`)?

**Backend**
- [ ] Có theo Route → Controller → Service chưa? Có tầng thừa (repository, usecase, dto) không?
- [ ] Có dùng ORM không? Có lý do cần giữ không?
- [ ] Có bắt `ER_DUP_ENTRY` và dùng transaction ở đặt sân chưa?
- [ ] Có `requireRole` ở server cho mọi route nhạy cảm chưa?
- [ ] Format response và mã lỗi có khớp `AGENT.md` mục 4 và `06-api.md` mục 3 không?
- [ ] Có job hết hạn giữ chỗ chưa?
- [ ] `complete` đã kiểm tra BR-28 (yêu cầu chờ giao, đồ thuê chưa trả, tiền dịch vụ) chưa? `cancel` đã chặn khi có dịch vụ đã giao chưa?

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
| Q11 | Thuê đồ tính **theo buổi** hay theo giờ? | Theo buổi, giá cố định (BR-27) | Tính theo giờ cần thêm giờ nhận/trả và công thức |
| Q12 | Đặt khu sự kiện có cần **duyệt/báo giá/đặt cọc** không? | Không, đặt tức thì như sân (BR-30) | Thêm trạng thái chờ duyệt, bảng báo giá hoặc thanh toán một phần |
| Q13 | Khách có **thanh toán dịch vụ ngay trong app** không? | Không, thu tại quầy khi trả đồ (BR-26) | Cần cổng thanh toán (VNPay P2) và luồng hoàn tiền dịch vụ |
| Q14 | Giảng viên có yêu cầu **quản lý tồn kho** đồ uống/đồ thuê không? | Không (BR-23) | Thêm bảng tồn kho, nhập/xuất, cảnh báo hết hàng |
| Q15 | Khách có được gọi dịch vụ **trước giờ chơi** (đặc biệt gói tiệc)? | Có, miễn đơn `CONFIRMED` và chưa qua giờ kết thúc (BR-24) | Muốn giới hạn thời gian thì thêm cửa sổ giờ vào BR-24 |
| Q16 | Khách bỏ đi không trả: có cần **ghi công nợ phải thu** lâu dài, hay chỉ đóng đơn? | Chỉ đóng đơn và ghi nhận số nợ trong hóa đơn/báo cáo (BR-33) | Muốn thu nợ về sau cần bảng công nợ và thanh toán bổ sung |
| Q17 | Khách quên mật khẩu: chấp nhận **admin đặt lại thủ công**? | Có (không làm quên mật khẩu qua email) | Làm email cần SMTP và bảng token |
| Q18 | Độ trễ đồng bộ Mobile–Web **tối đa 30 giây** có chấp nhận được không? | Có (R4) | Muốn tức thời cần WebSocket/push, tăng phạm vi |
