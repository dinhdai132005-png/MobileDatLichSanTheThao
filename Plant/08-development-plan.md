# 08 — KẾ HOẠCH PHÁT TRIỂN (DANH SÁCH TASK CHO AI) VÀ KIỂM THỬ

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI**. Giao **mỗi lần một task** cho công cụ AI (mẫu prompt ở `AGENT.md` mục 14). Task sau chỉ bắt đầu khi task trước đạt tiêu chí nghiệm thu. Chưa có thông tin thời hạn đồ án (**CHƯA ĐỦ DỮ LIỆU**) nên kế hoạch chia theo **mốc**, không gắn số tuần; sắp theo thứ tự phụ thuộc.

## 1. Tổng quan mốc

| Mốc | Nội dung | Kết quả kiểm chứng được |
|---|---|---|
| M0 | Khởi tạo, DB, seed | Backend chạy, kết nối MySQL, có dữ liệu mẫu |
| M1 | Auth + danh mục công khai | Đăng ký/đăng nhập, xem sân qua API |
| M2 | **Lõi đặt sân** | Lịch trống, đặt sân, chống trùng, hết hạn giữ chỗ |
| M3 | Thanh toán, hủy, hoàn tiền, vận hành nhân viên | Toàn bộ vòng đời đơn qua API |
| M4 | Web Admin | Nhân viên/admin vận hành bằng giao diện |
| M5 | Mobile | Khách đặt sân end-to-end trên điện thoại |
| M6 | P1: đánh giá, báo cáo, khách hàng, log | Số liệu + biểu đồ |
| M7 | Hoàn thiện, kiểm thử, tài liệu, bảo vệ | Demo trơn tru |

**Đường găng:** M0 → M1 → **M2** → M3. Hoàn thành M3 là có một hệ thống đúng nghiệp vụ (có thể demo bằng Postman). M4 và M5 có thể làm song song nếu có hai người/công cụ.

## 2. Danh sách task

Ký hiệu **Đọc**: mục tài liệu cần đọc. **Nghiệm thu**: điều kiện xong.

### M0 — Khởi tạo
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T01 | Tạo monorepo, thư mục `backend`, khởi tạo Express + TS, `app.ts`, `server.ts`, `config/env.ts`, `/health` | AGENT §2.1, 07 §3.1 | `GET /health` trả OK; lỗi thiếu env báo rõ |
| T02 | Tạo `database/schema.sql` từ `01-database.md` mục 5 (bỏ 2 bảng P2), chạy được trên MySQL sạch | 01 | Chạy script không lỗi; `SHOW TABLES` đủ 10 bảng |
| T03 | `config/db.ts` (pool, `dateStrings`, `+07:00`), helper `withTransaction`, `ApiError`, `response`, `asyncHandler`, `error.middleware`, `toCamel` | AGENT §4–7, 07 §2 | Truy vấn thử thành công; ném `ApiError` ra đúng JSON lỗi |
| T04 | `database/seed.sql` (khung giờ, loại sân, sân, giá) + script `seed:admin` | 01 §8 | Có dữ liệu mẫu; tạo được tài khoản admin bằng bcrypt |

### M1 — Auth và danh mục
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T05 | Middleware `auth`, `requireRole`, `validate` (zod); util `jwt`, `password` | AGENT §6, 06 §2–3 | Token sai → 401; sai role → 403; tài khoản LOCKED → 401 |
| T06 | API Auth: register, login, me, update me, change-password | 06 §4.1, §5.1–5.2; 04 CUS-01..03 | Test case TC-01..TC-04 |
| T07 | API danh mục công khai: court-types, courts, courts/:id, time-slots, config/public | 06 §4.1; 04 CUS-04 | Trả đúng, sân INACTIVE bị ẩn |

### M2 — Lõi đặt sân (quan trọng nhất)
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T08 | `GET /courts/:id/availability` (dayType, giá, BOOKED/PAST/MAINTENANCE/NO_PRICE) | 06 §5.3; 04 CUS-05; 01 §7.1; BR-01,03,05 | TC-10, TC-11 |
| T09 | `POST /bookings` (CASH và BANK_TRANSFER), giá snapshot, bắt `ER_DUP_ENTRY`, ghi log trạng thái | 06 §5.4; 04 CUS-06; BR-02..08,15,22 | TC-12..TC-19, **TC-20 (đồng thời)** |
| T10 | Job hết hạn giữ chỗ (`setInterval`) | 04 SYS-01; 01 §7.2; BR-07 | TC-21 |
| T11 | `GET /bookings/my`, `GET /bookings/:id` (kèm `canCancel`, `paymentInfo`) | 06 §4.2; 04 CUS-07,08 | Khách không xem được đơn người khác (404) |

### M3 — Thanh toán, hủy, hoàn tiền, vận hành
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T12 | `POST /staff/bookings/:id/payments` | 06 §5.7; 04 STF-06; BR-06,11 | TC-22, TC-23 |
| T13 | `POST /bookings/:id/cancel` (khách) + tạo REFUND PENDING | 06 §5.5; 04 CUS-09; BR-09,10 | TC-24..TC-26 |
| T14 | `POST /staff/bookings/:id/cancel`, `.../complete`, `.../no-show` | 04 STF-07,08; BR-09,12 | TC-27..TC-30 |
| T15 | `GET /staff/refunds`, `POST /staff/payments/:id/confirm-refund` | 04 STF-09 | TC-31 |
| T16 | `POST /staff/bookings` (đặt tại quầy) | 06 §5.6; 04 STF-05; BR-03,17 | TC-32, TC-33 |
| T17 | `GET /staff/schedule`, `GET /staff/bookings` (lọc, phân trang, keyword), `GET /staff/bookings/:id`, `GET /staff/dashboard` | 06 §5.8; 04 STF-02..04 | Lưới đúng dữ liệu; lọc hoạt động |
| T18 | API admin cấu hình: court-types, courts (kèm BR-05), time-slots, slot-prices, staff | 06 §4.4; 04 ADM-01..05 | TC-34..TC-37 |

### M4 — Web Admin
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T19 | Khởi tạo web (Vite+TS), `api/client`, `AuthContext`, `RequireRole`, `AppLayout`, trang Login (chặn CUSTOMER) | 05 §2,§4; AGENT §8 | Đăng nhập staff/admin; điều hướng theo role |
| T20 | Component chung: `DataTable`, `StatusBadge`, `Money`, `FormModal`, `ConfirmDialog`, `Toast` | 05 §4 | Dùng lại được ở mọi trang |
| T21 | Trang Lịch sân (`/schedule`) + Dashboard | 05 §2; 04 STF-02,03 | Hiển thị đúng lưới, nhấp ô mở đúng trang |
| T22 | Trang Danh sách đơn + Chi tiết đơn + modal thanh toán/hủy/hoàn thành/no-show | 05 §3; 04 STF-04..08 | Nút hiển thị đúng theo trạng thái (05 §3) |
| T23 | Trang Đặt tại quầy + Chờ hoàn tiền | 04 STF-05,09 | Tạo đơn thành công; xác nhận hoàn tiền được |
| T24 | Trang admin: Loại sân, Sân, Khung giờ, Bảng giá (ma trận), Nhân viên | 04 ADM-01..05 | CRUD chạy; lỗi BR-05 hiển thị rõ |

### M5 — Mobile
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T25 | Khởi tạo Expo + TS + Expo Router, `api/client`, `AuthContext` (secure-store), Login/Register (chặn STAFF/ADMIN) | 05 §1; 07 §3.3 | Đăng ký/đăng nhập trên máy thật |
| T26 | Trang chủ (loại sân, sân) + Chi tiết sân (DateStrip, SlotChip, chọn ≤ 3 giờ liền kề) | 05 §1 wireframe; 04 CUS-04,05 | Chọn giờ đúng quy tắc; tải lại khi đổi ngày |
| T27 | Xác nhận đơn + Chi tiết đơn (đếm ngược, thông tin chuyển khoản, hủy) | 04 CUS-06..09 | Đặt CASH và BANK_TRANSFER; xử lý 409 SLOT_TAKEN |
| T28 | Tab Lịch đặt (3 tab), Hồ sơ, đổi mật khẩu | 04 CUS-03,08 | Hiển thị đúng theo trạng thái |

### M6 — P1
| Task | Việc | Đọc | Nghiệm thu |
|---|---|---|---|
| T29 | Đánh giá: API + màn hình Mobile + hiển thị ở chi tiết sân | 04 CUS-10; BR-13 | TC-38 |
| T30 | Báo cáo: API 3 endpoint + trang Web (bảng + 1 biểu đồ) | 04 ADM-07; 01 §7.3–7.4 | Số liệu khớp truy vấn tay |
| T31 | Quản lý khách (admin) + tra cứu khách (staff) | 04 STF-10, ADM-06 | Khóa khách → đăng nhập bị chặn (TC-04) |
| T32 | Hiển thị `booking_status_logs` trong chi tiết đơn Web | 04 SYS-02 | Có lịch sử đúng thứ tự |

### M7 — Hoàn thiện
| Task | Việc | Nghiệm thu |
|---|---|---|
| T33 | Rà soát đồng bộ tài liệu ↔ code (`10-sync-check.md`), cập nhật nhãn ĐÃ CÓ | Checklist mục 6 tất cả tick |
| T34 | Chạy toàn bộ test case mục 4, sửa lỗi | Bảng test case đạt hết |
| T35 | Chuẩn bị dữ liệu demo + kịch bản demo (`09-defense-guide.md` mục 2) | Chạy trơn tru 2 lần liên tiếp |
| T36 | (P2, tùy chọn) VNPay sandbox hoặc dịch vụ đi kèm | Chỉ làm khi T01–T35 xong |

## 3. Thứ tự ưu tiên khi thiếu thời gian

1. **Không được cắt:** M0–M3 (backend lõi) và T19–T23, T25–T28 (giao diện vận hành và đặt sân).
2. **Cắt trước tiên:** T36 (P2) → T32 → T30 (chỉ giữ bảng, bỏ biểu đồ) → T31.
3. **Không cắt dù thiếu thời gian:** cơ chế chống trùng lịch và test TC-20, vì đây là câu hỏi bảo vệ chắc chắn xuất hiện.

## 4. Test case (kiểm thử thủ công, dùng Postman/REST Client rồi UI)

Dữ liệu nền: seed mặc định; khách A (`0911111111`), khách B (`0922222222`), nhân viên, admin.

| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| TC-01 | Đăng ký hợp lệ | 201, `role=CUSTOMER`, có token |
| TC-02 | Đăng ký trùng số điện thoại | 409 `PHONE_EXISTS` |
| TC-03 | Đăng nhập sai mật khẩu | 401 `INVALID_CREDENTIALS` |
| TC-04 | Admin khóa khách, khách dùng token cũ gọi `/auth/me` | 401 `ACCOUNT_LOCKED` ngay |
| TC-05 | Khách gọi `/admin/courts` | 403 `FORBIDDEN` |
| TC-06 | Không token gọi `/bookings/my` | 401 `UNAUTHORIZED` |
| TC-10 | Availability hôm nay: giờ đã qua / trong 30 phút tới | `PAST` |
| TC-11 | Availability: ngày thường và cuối tuần cùng sân | Giá khác nhau đúng `day_type`; sân bảo trì → `MAINTENANCE`; slot chưa có giá → `NO_PRICE` |
| TC-12 | Đặt 1 giờ `CASH` hợp lệ | 201, `CONFIRMED`, `UNPAID`, `booking_slots.is_locked=1`, có log |
| TC-13 | Đặt 2 giờ liền kề `BANK_TRANSFER` | 201, `PENDING`, `expiresAt` = +30 phút, có `paymentInfo`, `totalAmount` = tổng giá |
| TC-14 | Đặt 2 giờ **không** liền kề | 422 `SLOTS_NOT_CONSECUTIVE` |
| TC-15 | Đặt 4 giờ | 422 `SLOTS_NOT_CONSECUTIVE` (vượt tối đa 3) |
| TC-16 | Đặt ngày quá +14 ngày hoặc ngày đã qua | 422 `BOOKING_DATE_INVALID` |
| TC-17 | Đặt sân đang `MAINTENANCE` | 422 `COURT_NOT_BOOKABLE` |
| TC-18 | Khách đặt đơn thứ 4 khi đang có 3 đơn hoạt động | 422 `TOO_MANY_ACTIVE_BOOKINGS` |
| TC-19 | Đặt khung giờ chưa có giá | 422 `PRICE_NOT_CONFIGURED` |
| **TC-20** | **Hai khách gửi đồng thời đặt cùng sân/ngày/giờ** (chạy 2 request song song) | **Đúng 1 thành công (201), 1 nhận 409 `SLOT_TAKEN`; DB chỉ có 1 dòng khóa** |
| TC-21 | Đơn `PENDING` quá `expires_at` | Sau ≤ 60 giây: `EXPIRED`, `is_locked=NULL`, slot đặt lại được, có log (changed_by null) |
| TC-22 | Nhân viên ghi nhận thanh toán đơn `PENDING` còn hạn | `CONFIRMED`, `PAID`, có `payments` SUCCESS, `expires_at=NULL` |
| TC-23 | Ghi nhận thanh toán đơn đã `EXPIRED` | 422 `BOOKING_EXPIRED` |
| TC-24 | Khách hủy đơn `CONFIRMED` còn > 6 giờ, chưa trả | `CANCELLED`, slot nhả, **không** có REFUND |
| TC-25 | Khách hủy đơn đã `PAID` còn > 6 giờ | `CANCELLED`, có `payments` REFUND `PENDING`, `refundPending=true` |
| TC-26 | Khách hủy đơn còn < 6 giờ | 422 `CANCEL_DEADLINE_PASSED` |
| TC-27 | Nhân viên hủy đơn không có `reason` | 400 `VALIDATION_ERROR` |
| TC-28 | Hoàn thành đơn chưa `PAID` | 422 `NOT_PAID` |
| TC-29 | Hoàn thành đơn trước giờ bắt đầu | 422 `TOO_EARLY` |
| TC-30 | No-show đơn đã `PAID` | `NO_SHOW`, **không** tạo REFUND |
| TC-31 | Xác nhận hoàn tiền | REFUND `SUCCESS`, `payment_status=REFUNDED`; xác nhận lần 2 → 409 |
| TC-32 | Đặt tại quầy khách vãng lai, `payNow=true` | 201, `CONFIRMED`, `PAID`, `source=STAFF`, `created_by` đúng |
| TC-33 | Đặt tại quầy thiếu cả `customerId` và `guestPhone` | 400 `VALIDATION_ERROR` |
| TC-34 | Admin chuyển sân sang bảo trì khi còn đơn tương lai | 409 `COURT_HAS_FUTURE_BOOKINGS` kèm số đơn |
| TC-35 | Admin đổi giá, đơn cũ | Đơn cũ giữ nguyên `price` snapshot; đơn mới dùng giá mới |
| TC-36 | Admin tự khóa mình / khóa admin cuối | 409 `CANNOT_LOCK_SELF` / `LAST_ADMIN` |
| TC-37 | Tạo nhân viên: role luôn `STAFF` dù client gửi `role` | `STAFF` |
| TC-38 | Đánh giá đơn chưa `COMPLETED` / đánh giá lần 2 / đơn người khác | 422 / 409 / 404 |
| TC-39 | Khách xem đơn của khách khác | 404 |
| TC-40 | Khách truy cập `/staff/*` | 403 |

## 5. Quy trình làm việc với AI

1. Mỗi task: giao prompt theo mẫu `AGENT.md` mục 14.
2. AI báo cáo theo Definition of Done; người review chạy test case tương ứng.
3. Đạt → commit (`feat(T09): create booking with slot locking`). Không đạt → trả lại kèm test case lỗi.
4. Cuối mỗi mốc: rà `10-sync-check.md` mục 6 các dòng liên quan.
