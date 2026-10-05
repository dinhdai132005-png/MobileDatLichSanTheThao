# 11 — LUỒNG LIỀN MẠCH END-TO-END (MOBILE ↔ API ↔ DATABASE ↔ WEB)

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2). File này nối toàn bộ tài liệu thành **các buổi vận hành trọn vẹn**: mỗi bước cho biết ai làm, ở thiết bị nào, gọi API nào, dữ liệu đổi gì, và **bên kia nhìn thấy gì**. Dùng làm **kịch bản nghiệm thu E2E** (`08-development-plan.md` T34) và kịch bản demo (`09-defense-guide.md`).
> Mọi mã BR, FN, API, trạng thái ở đây đã được đối chiếu với `03`, `04`, `06`, `01`, `02`.

## 1. Nguyên tắc đồng bộ giữa hai nền tảng

| # | Nguyên tắc | Hệ quả khi code |
|---|---|---|
| R1 | **Server là nguồn sự thật duy nhất** về giá, tổng tiền, trùng lịch, quyền, trạng thái | Client không tự tính, không tự suy trạng thái |
| R2 | Mobile và Web **đọc cùng một đối tượng API** (Booking, Invoice, ServiceOrder). Không có field riêng cho từng client | Một bộ type TS theo `06-api.md`, hiển thị khác nhau chứ dữ liệu giống nhau |
| R3 | Nhãn và màu trạng thái dùng **một bảng** (`05` mục 4.3) | Hai file `status.ts` (Web, Mobile) sao chép đúng bảng đó |
| R4 | **Không realtime.** Các màn hình theo dõi **tự làm mới mỗi 30 giây khi đang mở**; danh sách tải lại khi màn hình/tab được focus; luôn có nút/kéo làm mới | Hằng số `POLL_INTERVAL_MS = 30000` ở cả hai FE |
| R5 | Lỗi nghiệp vụ hiển thị **`message` tiếng Việt do server trả**; client chỉ xử lý riêng `401` và `409 SLOT_TAKEN` | Không dịch mã lỗi ở client |
| R6 | Mỗi chuyển trạng thái có **đúng một API** và ghi `booking_status_logs` | Không có hai đường làm cùng một việc |
| R7 | `bookings.payment_status` chỉ phản ánh **tiền sân**; tổng tiền, đã trả, còn thiếu **chỉ lấy từ Invoice** | Cả hai nền tảng hiển thị số tiền từ `GET .../invoice` |
| R8 | `401 ACCOUNT_LOCKED`/`UNAUTHORIZED` ở **bất kỳ request nào** → client xóa token, về màn đăng nhập | Interceptor trong `api/client` của cả hai FE |

## 2. Ma trận "bàn giao" giữa Mobile và Web

Một sự kiện xảy ra ở phía này thì phía kia thấy ở đâu, bằng cơ chế nào.

| # | Sự kiện | Phát sinh ở | Phía kia thấy ở đâu | Cơ chế | Trễ tối đa |
|---|---|---|---|---|---|
| H1 | Khách đặt sân | Mobile | Web: ô màu trên **Lịch sân**, **Danh sách đơn**, widget Dashboard ("chờ thanh toán" nếu `PENDING`) | Tự làm mới Web | ≤ 30 giây |
| H2 | Nhân viên ghi nhận thanh toán tiền sân | Web | Mobile: chi tiết đơn `PENDING → CONFIRMED`, thông báo "Đã xác nhận thanh toán" | Tự làm mới Mobile | ≤ 30 giây |
| H3 | Đơn hết hạn giữ chỗ | Job (server) | Mobile: "Đơn đã hết hạn"; Web: ô trở lại trống | Job 60 giây + tự làm mới | ≤ 90 giây |
| H4 | Khách gọi dịch vụ | Mobile | Web: trang **Yêu cầu dịch vụ**, widget Dashboard | Tự làm mới Web | ≤ 30 giây |
| H5 | Nhân viên bấm **Đã giao** | Web | Mobile: **Hóa đơn** hiện "Đã giao", tiền dịch vụ tăng | Tự làm mới Mobile | ≤ 30 giây |
| H6 | Khách hủy yêu cầu chưa giao | Mobile | Web: yêu cầu biến khỏi hàng đợi | Tự làm mới Web | ≤ 30 giây |
| H7 | Nhân viên nhận lại đồ thuê / thu tiền dịch vụ | Web | Mobile: Hóa đơn "đã trả", "còn thiếu" giảm | Tự làm mới Mobile | ≤ 30 giây |
| H8 | Khách hủy đơn (đã trả) | Mobile | Web: ô trống lại, đơn `CANCELLED`, dòng mới ở **Chờ hoàn tiền** kèm `refundInfo` | Tự làm mới Web | ≤ 30 giây |
| H9 | Nhân viên hủy đơn / xác nhận đã hoàn tiền | Web | Mobile: tab **Đã hủy**, "Đã hoàn tiền" | Tải lại khi focus + tự làm mới | ≤ 30 giây |
| H10 | Hoàn thành / No-show / Đóng đơn có công nợ | Web | Mobile: tab **Hoàn thành**, nút **Đánh giá** (chỉ `COMPLETED`) | Tải lại khi focus | Lần mở kế tiếp |
| H11 | Admin đổi giá, khung giờ, dịch vụ, trạng thái sân | Web | Mobile: lịch trống, giá, thực đơn, nhãn "Tạm hết"/"Bảo trì" | Mỗi lần mở màn hình tải lại (không cache quá 5 phút) | Lần mở kế tiếp |
| H12 | Admin khóa khách | Web | Mobile: request kế tiếp nhận `401 ACCOUNT_LOCKED` → tự đăng xuất | Interceptor (R8) | Ngay request kế tiếp |
| H13 | Nhân viên đặt hộ cho khách có tài khoản | Web | Mobile: đơn xuất hiện trong **Lịch đặt** (`source=STAFF`), khách gọi dịch vụ và xem hóa đơn được | Tải lại khi focus | Lần mở kế tiếp |

## 3. Kịch bản E2E

Ký hiệu: **M** = Mobile (khách), **W** = Web (nhân viên `NV` / quản trị `AD`). Cột "Dữ liệu" chỉ nêu thay đổi quan trọng.

### E1. Một buổi chơi trọn vẹn có dịch vụ (đặt tiền mặt → gọi đồ → trả đồ → thanh toán → hoàn thành)

| # | Ai | Màn hình | API | Dữ liệu | Bên kia thấy |
|---|---|---|---|---|---|
| 1 | M khách | Chi tiết sân | `GET /courts/:id/availability?date=` | (đọc) | — |
| 2 | M khách | Xác nhận đơn | `POST /bookings` (`CASH`, 2 giờ liền kề) | `bookings` `CONFIRMED`/`UNPAID`; 2 `booking_slots` `is_locked=1`; log | W: ô "Đã xác nhận" (H1) |
| 3 | M khách | Chi tiết đơn | `GET /bookings/:id` | `canOrderService = true` | — |
| 4 | M khách | Gọi dịch vụ | `POST /bookings/:id/service-orders` (2 nước, 1 vợt) | `service_orders` `REQUESTED`; `service_order_items` giá snapshot; **`service_amount` vẫn 0** | W: Yêu cầu dịch vụ + Dashboard (H4) |
| 5 | W NV | Yêu cầu dịch vụ | `POST /staff/service-orders/:id/deliver` | `DELIVERED`; `service_amount` = 50.000; vợt "chưa trả" | M: Hóa đơn "Đã giao" (H5) |
| 6 | W NV | Chi tiết đơn | `POST /staff/service-order-items/:id/return` | `returned_at` | M: vợt "đã trả" (H7) |
| 7 | W NV | Chi tiết đơn → Hóa đơn | `GET /staff/bookings/:id/invoice` | (đọc) `grandTotal = tiền sân + 50.000`, `balance` | — |
| 8 | W NV | Thu tiền sân | `POST /staff/bookings/:id/payments` (`CASH`) | `payments` (`PAYMENT`, `COURT`, `SUCCESS`); `payment_status=PAID` | M: "Đã thanh toán tiền sân" (H7) |
| 9 | W NV | Thu tiền dịch vụ | `POST /staff/bookings/:id/service-payments` (`CASH`) | `payments` (`PAYMENT`, `SERVICE`, `SUCCESS`, 50.000) | M: còn thiếu = 0 (H7) |
| 10 | W NV | Hoàn thành | `POST /staff/bookings/:id/complete` | `COMPLETED`; log | M: tab Hoàn thành, nút Đánh giá (H10) |
| 11 | M khách | Đánh giá | `POST /bookings/:id/review` | `reviews` | W: đánh giá hiện ở chi tiết sân |

**Kết quả cuối:** đơn `COMPLETED`, `balance = 0`. Báo cáo cùng ngày: `courtRevenue` + `serviceRevenue` đúng bằng hai dòng `payments`. Nếu NV bấm **Hoàn thành** ở bước 7 (trước khi trả đồ và thu tiền) thì bị chặn `422 RENTALS_NOT_RETURNED` / `SERVICE_BALANCE_DUE` và nút hiện lý do (BR-28).

### E2. Đặt sân chuyển khoản (có nhánh hết hạn)

| # | Ai | Màn hình | API | Dữ liệu | Bên kia thấy |
|---|---|---|---|---|---|
| 1 | M khách | Xác nhận đơn | `POST /bookings` (`BANK_TRANSFER`) | `PENDING`, `expires_at = +30'`; `paymentInfo` (STK, số tiền, nội dung = `bookingCode`) | W: ô vàng "Chờ thanh toán", widget Dashboard (H1) |
| 2 | M khách | Chi tiết đơn | `GET /bookings/:id` (tự làm mới 30 giây) | Đếm ngược theo `expiresAt` | — |
| 3 | Khách | (ngân hàng) | — | Chuyển khoản, nội dung `bookingCode` | — |
| 4a | W NV | Danh sách đơn `status=PENDING` | `GET /staff/bookings?status=PENDING` | Đối chiếu sao kê theo `bookingCode` | — |
| 5a | W NV | Chi tiết đơn | `POST /staff/bookings/:id/payments` (`BANK_TRANSFER`, `transactionRef`) | `CONFIRMED`/`PAID`, `expires_at = NULL` | M: "Đã xác nhận thanh toán" (H2) |
| 4b | Job | — | (nội bộ, mỗi 60 giây) | Không ai xác nhận kịp → `EXPIRED`, `is_locked = NULL`, log (`changed_by` null) | M: "Đơn đã hết hạn"; W: ô trống (H3) |
| 5b | W NV | Chi tiết đơn (đơn đã `EXPIRED`) | `POST .../payments` | `422 BOOKING_EXPIRED` | NV tạo đơn mới bằng **Đặt tại quầy** (E4) nếu slot còn trống |

### E3. Khách hủy đơn đã thanh toán và hoàn tiền

| # | Ai | Màn hình | API | Dữ liệu | Bên kia thấy |
|---|---|---|---|---|---|
| 1 | M khách | Chi tiết đơn | `canCancel = true` (còn ≥ 6 giờ, chưa có dịch vụ đã giao) | — | — |
| 2 | M khách | Hộp thoại Hủy: nhập **thông tin nhận tiền hoàn** | `POST /bookings/:id/cancel` (`refundInfo`) | `CANCELLED`; `is_locked = NULL`; `payments` (`REFUND`, `COURT`, `PENDING`, `note = refundInfo`); log | W: ô trống lại; dòng mới ở **Chờ hoàn tiền** kèm `refundInfo` (H8) |
| 3 | W NV | Chờ hoàn tiền | `GET /staff/refunds?status=PENDING` | (đọc) | — |
| 4 | NV | (ngân hàng) | — | Chuyển khoản hoàn theo `refundInfo` | — |
| 5 | W NV | Chờ hoàn tiền | `POST /staff/payments/:id/confirm-refund` (`transactionRef`) | `REFUND SUCCESS`; `payment_status=REFUNDED` | M: "Đã hoàn tiền" (H9) |

Nhánh lỗi: thiếu `refundInfo` → `422 REFUND_INFO_REQUIRED`; còn < 6 giờ → `422 CANCEL_DEADLINE_PASSED`, khách liên hệ, NV dùng `POST /staff/bookings/:id/cancel` (lý do bắt buộc); đã có dịch vụ giao → `409 HAS_DELIVERED_SERVICES`.

### E4. Khách vãng lai/gọi điện: đặt tại quầy, có thêm dịch vụ

| # | Ai | Màn hình | API | Dữ liệu | Bên kia thấy |
|---|---|---|---|---|---|
| 1 | W NV | Lịch sân → nhấp ô trống (đang 18:20, slot 18:00–19:00 đang diễn ra) | `GET /staff/courts/:id/availability?date=` | Slot đang diễn ra là `AVAILABLE` (**quy tắc nhân viên**, BR-03) | — |
| 2 | W NV | Đặt tại quầy: nhập `guestName`/`guestPhone`, **hoặc** tìm khách | `GET /staff/customers?keyword=<SĐT>` | (đọc) chọn `customerId` | — |
| 3 | W NV | Đặt tại quầy | `POST /staff/bookings` (`payNow=true`, `CASH`) | `CONFIRMED`/`PAID`, `source=STAFF`, `created_by`; `payments` `COURT` | Nếu chọn khách có tài khoản: M thấy đơn trong **Lịch đặt** (H13) |
| 4 | W NV | Chi tiết đơn → Thêm dịch vụ | `POST /staff/bookings/:id/service-orders` | Yêu cầu vào thẳng `DELIVERED` (BR-31); `service_amount` tăng | M (nếu có tài khoản): Hóa đơn |
| 5 | W NV | Thu tiền dịch vụ → Hoàn thành | `POST .../service-payments` → `POST .../complete` | `payments` `SERVICE`; `COMPLETED` | — |

### E5. Khu sự kiện/tiệc có gói tiệc

| # | Ai | Màn hình | API | Dữ liệu | Bên kia thấy |
|---|---|---|---|---|---|
| 1 | M khách | Trang chủ → mục **Khu sự kiện & tiệc** (hiện `capacity`) | `GET /courts?category=EVENT` | (đọc) | — |
| 2 | M khách | Chi tiết sân → chọn 3 giờ | `GET .../availability` → `POST /bookings` | Như E1/E2 (cùng cơ chế, BR-30) | W: ô trên Lịch sân |
| 3 | M khách | Gọi dịch vụ (sau khi đơn `CONFIRMED`, **có thể gọi trước giờ**) | `POST /bookings/:id/service-orders` (Gói tiệc nước 10 người + đồ uống) | `REQUESTED` | W: hàng đợi, NV chuẩn bị theo giờ sự kiện (H4) |
| 4 | W NV | Yêu cầu dịch vụ | `POST .../deliver` đúng giờ sự kiện | `service_amount` tăng | M: Hóa đơn |
| 5 | W NV | Thu tiền, hoàn thành | như E1 bước 8–10 | Hóa đơn = tiền thuê khu vực + gói tiệc + đồ uống | — |

### E6. Hai người đặt cùng một khung giờ (cũng áp dụng cho khu sự kiện)

| # | Ai | API | Kết quả |
|---|---|---|---|
| 1 | M khách A và M khách B cùng mở lịch trống, cùng chọn slot 18:00 | `GET .../availability` | Cả hai thấy `AVAILABLE` |
| 2 | Cùng bấm Đặt | `POST /bookings` song song | **Đúng 1** nhận `201`; người còn lại `409 SLOT_TAKEN` (UNIQUE `uq_slot_active`) |
| 3 | M người thua | Màn hình xác nhận | Báo "Khung giờ vừa có người đặt", tự tải lại lịch, bỏ chọn |
| 4 | W NV | Lịch sân | Chỉ có **một** đơn ở slot đó |

### E7. Khách dùng dịch vụ rồi bỏ đi không thanh toán (lối thoát công nợ)

| # | Ai | Màn hình | API | Dữ liệu | Ghi chú |
|---|---|---|---|---|---|
| 1 | — | — | Đơn `CONFIRMED`, đã `DELIVERED` dịch vụ + 1 vợt chưa trả, khách rời đi, chưa trả tiền | — | Sau giờ kết thúc |
| 2 | W NV | Dashboard: widget **Đơn quá giờ** | `GET /staff/dashboard`, `GET /staff/bookings?overdue=true` | (đọc) | Nhắc xử lý |
| 3 | W NV | Chi tiết đơn | `POST .../complete` | `422 NOT_PAID` / `RENTALS_NOT_RETURNED` / `SERVICE_BALANCE_DUE` | Nút Hoàn thành bị chặn, hiện lý do |
| 4 | W NV | Chi tiết đơn | `POST .../no-show` hoặc `.../cancel` | `409 HAS_DELIVERED_SERVICES` | Đã dùng dịch vụ nên không coi là vắng mặt/hủy |
| 5 | W **AD** | Chi tiết đơn → **Đóng đơn có công nợ** (nhập lý do) | `POST /admin/bookings/:id/close-with-debt` | `COMPLETED`, `closed_with_debt=1`, **không tạo `payments`**, log ghi số nợ và đồ chưa trả | Chỉ ADMIN (BR-33) |
| 6 | W AD | Báo cáo | `GET /admin/reports/summary` | `debtClosed = { count, amount }` | Doanh thu thực không đổi |

### E8. Cấu hình ảnh hưởng thế nào đến Mobile

| # | Ai | API | Hiệu lực |
|---|---|---|---|
| 1 | W AD đổi giá | `PUT /admin/slot-prices` | Đơn **mới** dùng giá mới; đơn cũ giữ giá snapshot (BR-15). M thấy giá mới khi mở lại lịch trống (H11) |
| 2 | W AD đặt sân bảo trì khi còn đơn tương lai | `PATCH /admin/courts/:id/status` | `409 COURT_HAS_FUTURE_BOOKINGS` kèm số đơn. AD (hoặc NV) hủy từng đơn qua `POST /staff/bookings/:id/cancel` (hoàn tiền nếu đã trả) rồi đặt lại |
| 3 | W AD/NV đặt dịch vụ "Tạm hết" | `PATCH /staff/services/:id/availability` hoặc `PATCH /admin/services/:id/status` | M: màn Gọi dịch vụ hiện "Tạm hết", không chọn được; yêu cầu đã gọi không đổi |
| 4 | W AD tắt khung giờ | `PATCH /admin/time-slots/:id/active` | Chặn nếu còn đơn tương lai dùng slot; sau đó M không thấy slot đó |

### E9. Tài khoản và quyền

| # | Ai | API | Kết quả |
|---|---|---|---|
| 1 | W AD tạo nhân viên | `POST /admin/staff` | NV đăng nhập Web; đăng nhập Mobile bị app chặn (BR-18) |
| 2 | Khách đăng nhập Web | `POST /auth/login` | Web chặn role `CUSTOMER` (BR-18); gọi thẳng `/staff/*` bằng token khách → `403 FORBIDDEN` |
| 3 | Khách quên mật khẩu | liên hệ NV/AD | W AD `POST /admin/customers/:id/reset-password` → khách đăng nhập bằng mật khẩu tạm → `PUT /auth/change-password` |
| 4 | W AD khóa khách | `PATCH /admin/customers/:id/status` | M: request kế tiếp `401 ACCOUNT_LOCKED` → đăng xuất ngay (H12, R8); đơn đã đặt **không** tự hủy |

## 4. Trạng thái nhìn từ hai phía

| `bookings.status` | Mobile (khách) hiển thị / làm được | Web (NV/AD) hiển thị / làm được |
|---|---|---|
| `PENDING` | "Chờ thanh toán" + đếm ngược + thông tin CK; Hủy (nếu `canCancel`) | Vàng; Ghi nhận thanh toán, Hủy |
| `CONFIRMED` | "Đã xác nhận"; Gọi dịch vụ (nếu chưa qua giờ kết thúc), Hóa đơn, Hủy (nếu `canCancel`) | Xanh dương; thu tiền sân/dịch vụ, giao dịch vụ, nhận lại đồ, Hoàn thành/No-show (khi đủ điều kiện), Hủy; **AD:** Đóng đơn có công nợ |
| `COMPLETED` | Tab Hoàn thành; Đánh giá (1 lần); Hóa đơn (chỉ xem) | Xanh lá; chỉ xem (cờ "Đã đóng có công nợ" nếu `closedWithDebt`) |
| `CANCELLED` / `EXPIRED` | Tab Đã hủy; nếu đã trả thì "Chờ hoàn tiền / Đã hoàn tiền" | Xám; xem; liên kết sang Chờ hoàn tiền nếu `PAID` |
| `NO_SHOW` | Tab Đã hủy (nhãn "Vắng mặt") | Đỏ; chỉ xem |

| `service_orders.status` | Mobile | Web |
|---|---|---|
| `REQUESTED` | "Chờ giao" (chưa tính tiền); Hủy yêu cầu | Trong hàng đợi: Đã giao / Hủy |
| `DELIVERED` | "Đã giao" (đã tính tiền); đồ thuê "chưa trả/đã trả" | Nhận lại đồ thuê; (hủy theo BR-25) |
| `CANCELLED` | "Đã hủy" | Ẩn khỏi hàng đợi, vẫn ở chi tiết đơn |

## 5. Các điểm lệch đã phát hiện khi rà luồng liền mạch (và đã sửa ở v1.2)

| # | Phát hiện | Hậu quả nếu không sửa | Đã sửa bằng |
|---|---|---|---|
| 1 | **Bế tắc công nợ:** đơn đã giao dịch vụ mà khách bỏ đi không trả — không `COMPLETED` (thiếu tiền/đồ), không `CANCELLED`, không `NO_SHOW` (đã dùng dịch vụ) | Đơn kẹt `CONFIRMED` vĩnh viễn, báo cáo sai | **ADM-09 / BR-33** `close-with-debt` (xác nhận bằng mô phỏng, mục 6) |
| 2 | Màn **Đặt tại quầy** dùng lịch trống công khai, mà endpoint đó áp quy tắc khách (30 phút) → nhân viên **không chọn được slot đang diễn ra** dù BR-03 cho phép | Khách đến giữa giờ không đặt được tại quầy | `GET /staff/courts/:id/availability` (quy tắc nhân viên) |
| 3 | STF-05 (P0) cần **tìm khách theo SĐT** nhưng endpoint đó nằm ở STF-10 (P1) | P0 không chạy được nhánh `customerId` | Chuyển phần tìm khách vào P0 (T16) |
| 4 | **Hoàn tiền không có nơi nhận:** khách hủy đơn đã trả nhưng không ai biết chuyển hoàn vào đâu | Nhân viên phải gọi hỏi từng khách | `refundInfo` (BR-34) lưu `payments.note`, hiện ở Chờ hoàn tiền |
| 5 | Khách **mất mật khẩu** không có lối vào lại (không có email quên mật khẩu) | Khách bị khóa ngoài tài khoản | `POST /admin/customers/:id/reset-password` |
| 6 | Đơn `CONFIRMED` đã qua giờ mà nhân viên quên xử lý nằm im | Đơn mồ côi, báo cáo trạng thái lệch | Widget **Đơn quá giờ** + bộ lọc `overdue=true` |
| 7 | Mobile chỉ "kéo làm mới" nên khách không thấy trạng thái đổi khi đang ở màn hình | Trải nghiệm không liền mạch với thao tác của nhân viên | Tự làm mới 30 giây khi màn hình mở (R4) |
| 8 | Seed (T04) chưa có dịch vụ và khu sự kiện | Demo E1, E5 không chạy được ngay | T04 bổ sung seed dịch vụ, loại `EVENT`, phòng tiệc |

**Giới hạn còn lại (đã chấp nhận, nêu khi bảo vệ):** không hoàn tiền dịch vụ đã thu (giao nhầm đã thu tiền thì không hủy được, `409 SERVICE_ALREADY_PAID`); không đổi giờ đơn (khách hủy và đặt lại); khách vãng lai đăng ký sau không gộp được đơn cũ; không đổi số điện thoại tài khoản; không thông báo đẩy (độ trễ tối đa 30 giây).

## 6. Kết quả mô phỏng hành trình (kiểm chứng logic quy tắc nghiệp vụ)

Đã mô phỏng máy trạng thái của đơn và yêu cầu dịch vụ theo đúng `03` (BR-12, BR-25, BR-28, BR-29, BR-33) và chạy các hành trình:

| Hành trình | Trước khi sửa (v1.1) | Sau khi sửa (v1.2) |
|---|---|---|
| J1 Đặt tiền mặt → gọi đồ → giao → trả đồ → thu tiền → hoàn thành | Hoàn thành | Hoàn thành |
| J2 Chuyển khoản `PENDING` → xác nhận → hoàn thành | Hoàn thành | Hoàn thành |
| J4 Hủy đơn đã trả → chờ hoàn tiền | Đúng | Đúng |
| J5 Đặt tại quầy đã trả, thêm dịch vụ, thu tiền, hoàn thành | Hoàn thành | Hoàn thành |
| J7 Khách gọi đồ rồi đơn bị hủy: yêu cầu chờ giao tự hủy | Đúng | Đúng |
| J8 Khách vắng, chưa trả: no-show | Đúng | Đúng |
| **J9 Khách dùng dịch vụ + thuê vợt rồi bỏ đi, chưa trả gì** | **Bế tắc: không có đường tới trạng thái cuối** | Thoát được (ADMIN đóng đơn, `COMPLETED`) |

Mô phỏng chỉ kiểm chứng **logic quy tắc**, không thay cho việc chạy thật ở T34. Mô phỏng và DDL đã chạy thử được ghi ở `10-sync-check.md` mục 5.

## 7. Tiêu chí "liền mạch" (checklist nghiệm thu)

- [ ] E1–E9 chạy từ đầu đến cuối với **hai thiết bị thật** (một Mobile, một Web) mà không phải sửa dữ liệu bằng tay.
- [ ] Mọi thay đổi ở Web xuất hiện trên Mobile trong ≤ 30 giây (hoặc ở lần mở màn hình kế tiếp) và ngược lại, theo ma trận mục 2.
- [ ] Không có đơn nào kẹt không thể đưa về trạng thái cuối bằng các thao tác có trên giao diện.
- [ ] Số tiền ở Mobile, Web, báo cáo **khớp nhau** (mọi nơi lấy từ Invoice/`payments`).
- [ ] Nhãn và màu trạng thái giống nhau ở hai nền tảng.
- [ ] Mọi lỗi nghiệp vụ hiển thị thông điệp tiếng Việt cụ thể, không có màn hình trắng hay lỗi chung chung.
- [ ] E6 (đặt đồng thời) luôn đúng 1 người thành công, kể cả với khu sự kiện.
- [ ] Hoàn tiền: nhân viên nhìn thấy `refundInfo` ở mọi dòng chờ hoàn tiền của khách đã hủy.
- [ ] Khách bị khóa bị đăng xuất ở request kế tiếp; nhân viên không dùng được Mobile, khách không dùng được Web.
- [ ] Báo cáo cuối ngày: doanh thu sân + dịch vụ khớp tổng `payments`; công nợ đã đóng hiện đúng.
