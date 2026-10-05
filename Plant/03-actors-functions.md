# 03 — ACTORS, FUNCTIONS, ROLE/PERMISSION, QUY TẮC NGHIỆP VỤ

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2: dịch vụ phát sinh + khu sự kiện theo góp ý giảng viên; bổ sung đóng đơn có công nợ, thông tin hoàn tiền, đặt lại mật khẩu khách sau khi rà luồng liền mạch Mobile–Web). Đây là file **ưu tiên cao nhất** về nghiệp vụ. Khi file khác mâu thuẫn với file này, file này thắng.

## 1. Mô hình nghiệp vụ

Một đơn vị vận hành **một cơ sở có nhiều sân**, thuộc nhiều loại sân.

1. Cơ sở mở cửa theo các **khung giờ cố định 1 giờ** (mặc định 06:00–22:00).
2. Mỗi **loại sân** có **bảng giá** theo khung giờ và theo ngày thường/cuối tuần.
3. Khách chọn sân + ngày + 1–3 khung giờ liền kề → tạo **đơn đặt sân**.
4. Đơn được **thanh toán** bằng tiền mặt tại sân hoặc chuyển khoản (nhân viên xác nhận).
5. Khách đến chơi → nhân viên đánh dấu **hoàn thành**. Không đến → **no-show**.
6. Khách có thể **hủy** (trong hạn) → nếu đã trả tiền thì được **hoàn**.
7. Khách vãng lai/gọi điện: **nhân viên đặt hộ** tại quầy.
8. **Dịch vụ phát sinh (theo góp ý giảng viên):** khi đơn đã xác nhận, khách gọi **đồ uống, thuê đồ (vợt, giày...) hoặc gói tiệc** ngay trên app; **nhân viên mang ra**; khi khách trả đồ và ra về, các khoản đã giao được **cộng vào hóa đơn** và nhân viên thu tiền.
9. **Khu tổ chức sự kiện/tiệc:** là một loại "sân" đặc biệt (phòng tiệc, khu BBQ) đặt theo giờ như sân thể thao, thu phí thuê khu vực; phần ăn uống tính bằng dịch vụ gói tiệc/đồ uống ở mục 8.

**Hóa đơn của một đơn** = tiền sân (`court_amount`, thu như cũ) + tiền dịch vụ (`service_amount`, chỉ gồm các yêu cầu **đã giao**, thu tại quầy khi kết thúc). Đây là điểm khác so với bản v1.0 (chỉ có tiền sân).

## 2. Actor / Role

| Actor | Role (`users.role`) | Nền tảng | Phạm vi |
|---|---|---|---|
| Khách hàng | `CUSTOMER` | Mobile | Dữ liệu của chính mình + xem danh mục công khai |
| Nhân viên | `STAFF` | Web | Vận hành: mọi đơn, lịch sân, thanh toán, **giao dịch vụ, nhận lại đồ thuê, thu tiền dịch vụ**, khách hàng (chỉ xem) |
| Quản trị viên | `ADMIN` | Web | Toàn bộ quyền STAFF + cấu hình + tài khoản + báo cáo |
| Scheduler | (không có) | Backend | Job tự hết hạn đơn giữ chỗ |

**Vì sao 3 role, không hơn:**
- Hệ thống một cơ sở: các vai "lễ tân, thu ngân, quản lý ca" thực tế do cùng một nhóm người làm → gộp thành STAFF.
- "Chủ sân" và "quản lý hệ thống" trong đồ án là cùng một người → ADMIN.
- Thêm role đồng nghĩa thêm ma trận quyền, màn hình, test, câu hỏi bảo vệ mà không thêm giá trị nghiệp vụ.

**Có thể mở rộng:** thêm role `MANAGER` chỉ cần thêm một giá trị ENUM và một dòng trong ma trận quyền.

## 3. Ma trận quyền (nguồn sự thật cho `requireRole`)

Ký hiệu: ✅ được, ❌ không, 👁 chỉ xem, 🔸 chỉ dữ liệu của chính mình.

| Chức năng | CUSTOMER | STAFF | ADMIN |
|---|---|---|---|
| Xem loại sân, sân, khung giờ, lịch trống, đánh giá (công khai) | ✅ | ✅ | ✅ |
| Đăng ký tài khoản | ✅ (tự đăng ký) | ❌ | ❌ |
| Đăng nhập, xem/sửa hồ sơ, đổi mật khẩu | 🔸 | 🔸 | 🔸 |
| Đặt sân từ app | ✅ | ❌ | ❌ |
| Xem/hủy đơn của mình | 🔸 | — | — |
| Đánh giá sân | 🔸 | ❌ | ❌ |
| Xem lịch lưới sân theo ngày | ❌ | ✅ | ✅ |
| Xem danh sách và chi tiết **mọi** đơn | ❌ | ✅ | ✅ |
| Đặt sân tại quầy (đặt hộ) | ❌ | ✅ | ✅ |
| Ghi nhận thanh toán | ❌ | ✅ | ✅ |
| Hoàn thành / No-show | ❌ | ✅ | ✅ |
| Hủy đơn thay khách | ❌ | ✅ | ✅ |
| Xác nhận đã hoàn tiền | ❌ | ✅ | ✅ |
| Xem danh mục dịch vụ (đồ uống, thuê đồ, gói tiệc) | ✅ | ✅ | ✅ |
| Gọi dịch vụ cho đơn của mình, xem hóa đơn của mình | 🔸 | ❌ | ❌ |
| Hủy yêu cầu dịch vụ **chưa giao** | 🔸 | ✅ | ✅ |
| Xử lý hàng đợi dịch vụ (giao, hủy), thêm dịch vụ tại quầy, nhận lại đồ thuê | ❌ | ✅ | ✅ |
| Thu tiền dịch vụ, xem hóa đơn mọi đơn | ❌ | ✅ | ✅ |
| Bật/tắt "tạm hết hàng" của dịch vụ | ❌ | ✅ | ✅ |
| CRUD danh mục dịch vụ, ngừng bán dịch vụ | ❌ | ❌ | ✅ |
| Đóng đơn có công nợ (write-off) | ❌ | ❌ | ✅ |
| Đặt lại mật khẩu cho khách hàng | ❌ | ❌ | ✅ |
| Tìm khách theo số điện thoại khi đặt tại quầy | ❌ | ✅ | ✅ |
| Xem khách hàng (tra cứu) | ❌ | 👁 | ✅ |
| Khóa/mở khóa khách hàng | ❌ | ❌ | ✅ |
| CRUD loại sân, sân, khung giờ, bảng giá | ❌ | ❌ | ✅ |
| Quản lý tài khoản nhân viên | ❌ | ❌ | ✅ |
| Báo cáo doanh thu, lấp đầy | ❌ | ❌ | ✅ |
| Dashboard "hôm nay" (số đơn, chờ thanh toán, chờ hoàn) | ❌ | ✅ | ✅ |

## 4. Danh mục chức năng

Mức: **P0** bắt buộc, **P1★** theo góp ý giảng viên (nên làm ngay sau P0, nhóm dịch vụ phát sinh), **P1** nên có, **P2** tùy chọn.

### 4.1 Khách hàng (Mobile)

| Mã | Chức năng | Mức |
|---|---|---|
| CUS-01 | Đăng ký tài khoản | P0 |
| CUS-02 | Đăng nhập / đăng xuất | P0 |
| CUS-03 | Xem và sửa hồ sơ, đổi mật khẩu | P0 |
| CUS-04 | Xem danh sách loại sân và sân | P0 |
| CUS-05 | Xem chi tiết sân, lịch trống theo ngày và giá | P0 |
| CUS-06 | Đặt sân (chọn ngày, 1–3 khung giờ liền kề, phương thức thanh toán) | P0 |
| CUS-07 | Xem hướng dẫn chuyển khoản và đếm ngược giữ chỗ | P0 |
| CUS-08 | Xem lịch sử và chi tiết đơn | P0 |
| CUS-09 | Hủy đơn | P0 |
| CUS-10 | Đánh giá sân sau khi hoàn thành | P1 |
| CUS-11 | Xem danh mục dịch vụ (đồ uống, thuê đồ, gói tiệc) | P1★ |
| CUS-12 | Gọi dịch vụ cho đơn đang hiệu lực (đồ uống, thuê đồ, gói tiệc) | P1★ |
| CUS-13 | Xem hóa đơn, theo dõi và hủy yêu cầu dịch vụ chưa giao | P1★ |
| CUS-14 | Thanh toán VNPay sandbox | P2 |

Ghi chú: **đặt khu sự kiện/tiệc** dùng lại CUS-04 → CUS-09 (loại sân `category = EVENT`), không có mã chức năng riêng (BR-30).

### 4.2 Nhân viên (Web)

| Mã | Chức năng | Mức |
|---|---|---|
| STF-01 | Đăng nhập, hồ sơ cá nhân | P0 |
| STF-02 | Dashboard "hôm nay" (kèm số **đơn quá giờ chưa xử lý**) | P0 |
| STF-03 | Lịch lưới sân theo ngày (sân × khung giờ) | P0 |
| STF-04 | Danh sách đơn có lọc + chi tiết đơn | P0 |
| STF-05 | Đặt sân tại quầy / qua điện thoại (kèm **tìm khách có tài khoản theo số điện thoại** để chọn `customerId`) | P0 |
| STF-06 | Ghi nhận thanh toán (tiền mặt / chuyển khoản) | P0 |
| STF-07 | Hoàn thành đơn / đánh dấu No-show | P0 |
| STF-08 | Hủy đơn thay khách (có lý do) | P0 |
| STF-09 | Danh sách đơn chờ hoàn tiền và xác nhận đã hoàn | P0 |
| STF-10 | Xem chi tiết khách hàng và lịch sử đơn của khách (phần **tìm theo SĐT** thuộc STF-05, P0) | P1 |
| STF-11 | Hàng đợi yêu cầu dịch vụ: xem, xác nhận **đã giao**, hủy | P1★ |
| STF-12 | Thêm dịch vụ cho đơn tại quầy (khách gọi trực tiếp) | P1★ |
| STF-13 | Đánh dấu **đã nhận lại đồ thuê** | P1★ |
| STF-14 | Xem hóa đơn và **thu tiền dịch vụ** | P1★ |
| STF-15 | Bật/tắt "tạm hết hàng" cho dịch vụ | P1★ |

### 4.3 Quản trị viên (Web) — gồm mọi chức năng STAFF cộng:

| Mã | Chức năng | Mức |
|---|---|---|
| ADM-01 | Quản lý loại sân | P0 |
| ADM-02 | Quản lý sân (kể cả trạng thái bảo trì) | P0 |
| ADM-03 | Quản lý khung giờ | P0 |
| ADM-04 | Quản lý bảng giá (ma trận) | P0 |
| ADM-05 | Quản lý tài khoản nhân viên | P0 |
| ADM-06 | Quản lý khách hàng (xem, khóa/mở, **đặt lại mật khẩu**) | P1 |
| ADM-07 | Báo cáo: doanh thu (tách tiền sân / dịch vụ), số đơn theo trạng thái, tỷ lệ lấp đầy, dịch vụ bán chạy | P1 |
| ADM-08 | Quản lý danh mục dịch vụ (đồ uống, thuê đồ, gói tiệc) | P1★ |
| ADM-09 | **Đóng đơn có công nợ** (khách dùng dịch vụ/sân rồi bỏ đi không thanh toán hoặc không trả đồ) | P1★ |

### 4.4 Hệ thống

| Mã | Chức năng | Mức |
|---|---|---|
| SYS-01 | Job tự hết hạn đơn `PENDING` quá `expires_at`, nhả slot (BR-07) | P0 |
| SYS-02 | Ghi `booking_status_logs` mỗi lần đổi trạng thái | P1 |

## 5. Quy tắc nghiệp vụ (BR)

| Mã | Quy tắc |
|---|---|
| **BR-01** | Ngày cuối tuần = Thứ 7, Chủ nhật. Còn lại là ngày thường. **Không phân biệt ngày lễ** (giới hạn đã biết). Giá tra theo `day_type` của `booking_date`. |
| **BR-02** | Khung giờ cố định lấy từ `time_slots` (đang `is_active`). Một đơn gồm **1 đến 3 khung giờ liền kề** (`end_time` slot trước = `start_time` slot sau), **cùng một sân, cùng một ngày**. |
| **BR-03** | Chỉ đặt từ hôm nay đến hôm nay + 14 ngày. Đơn từ **APP**: khung giờ đầu phải bắt đầu **sau hiện tại ≥ 30 phút**. Đơn từ **STAFF**: khung giờ cuối chưa kết thúc (cho phép đặt giờ đang diễn ra); để giao diện nhân viên thấy đúng, Web dùng endpoint riêng `GET /staff/courts/:id/availability` áp dụng quy tắc này (endpoint công khai `/courts/:id/availability` luôn áp quy tắc khách). |
| **BR-04** | Một (sân, ngày, khung giờ) chỉ thuộc **một đơn còn hiệu lực** (cơ chế UNIQUE ở `01-database.md` mục 3). Vi phạm → `409 SLOT_TAKEN`. |
| **BR-05** | Sân `MAINTENANCE`/`INACTIVE` không đặt được. Khi sân có đơn `PENDING/CONFIRMED` trong tương lai thì **không** được chuyển sang `MAINTENANCE/INACTIVE` (`409 COURT_HAS_FUTURE_BOOKINGS`); admin phải xử lý đơn trước. Loại sân/khung giờ không còn active cũng tương tự: không cho tắt nếu còn đơn tương lai liên quan. |
| **BR-06** | Phương thức thanh toán và trạng thái khởi tạo: **`CASH`** → đơn `CONFIRMED`, `UNPAID`, trả tại sân. **`BANK_TRANSFER`** → đơn `PENDING`, `UNPAID`, có `expires_at`. **`VNPAY`** (P2) → `PENDING`, chờ callback. Đơn do nhân viên tạo và đã thu tiền → `CONFIRMED`, `PAID` ngay. |
| **BR-07** | Đơn `PENDING` giữ chỗ **30 phút** (`expires_at = now + 30'`). Quá hạn → job chuyển `EXPIRED`, nhả slot, ghi log. |
| **BR-08** | Mỗi khách có tối đa **3 đơn đang hoạt động** (`PENDING`/`CONFIRMED` chưa kết thúc). Vượt → `422 TOO_MANY_ACTIVE_BOOKINGS`. |
| **BR-09** | **Khách** hủy được khi đơn `PENDING`/`CONFIRMED` **và** còn ≥ 6 giờ tới giờ bắt đầu. Quá hạn → `422 CANCEL_DEADLINE_PASSED` (liên hệ nhân viên). **Nhân viên** hủy được đơn `PENDING`/`CONFIRMED` bất kỳ lúc nào, **bắt buộc có lý do**. |
| **BR-10** | Hủy đơn đã `PAID`: hoàn **100%**. Hệ thống tạo `payments` loại `REFUND` trạng thái `PENDING`; nhân viên chuyển tiền rồi bấm xác nhận → `SUCCESS`, `payment_status = REFUNDED`. Đơn `NO_SHOW` **không hoàn**. Đơn chưa trả thì không có hoàn tiền. (Nơi nhận tiền hoàn xem BR-34.) |
| **BR-11** | **Tiền sân** thanh toán **toàn phần** một lần (số tiền = `court_amount`). Không đặt cọc, không trả từng phần. Tiền dịch vụ tính riêng theo BR-26. |
| **BR-12** | `COMPLETED` chỉ khi đơn `CONFIRMED`, `payment_status = PAID` (tiền sân), đã đến giờ bắt đầu **và thỏa BR-28** (không còn yêu cầu dịch vụ chờ giao, đã nhận lại đồ thuê, đã thu đủ tiền dịch vụ). `NO_SHOW` chỉ khi đơn `CONFIRMED`, đã đến giờ bắt đầu và **chưa có dịch vụ đã giao**; các yêu cầu dịch vụ đang chờ giao tự `CANCELLED`. (Đơn trả tại sân: nhân viên ghi nhận tiền mặt trước, rồi hoàn thành.) |
| **BR-13** | Đánh giá chỉ khi đơn `COMPLETED`, đúng chủ đơn, **một lần/đơn**, 1–5 sao, bình luận ≤ 1000 ký tự. |
| **BR-14** | Không xóa cứng `users`, `court_types`, `courts`, `time_slots`, `bookings`, `payments`, `services`, `service_orders`. Vô hiệu hóa bằng `is_active`/`status`. |
| **BR-15** | **Giá snapshot:** khi đặt, server tra `slot_prices` rồi lưu vào `booking_slots.price` (giá dịch vụ: xem BR-23). Sửa bảng giá sau không đổi đơn cũ. Thiếu giá → `422 PRICE_NOT_CONFIGURED`. Client **không** gửi giá. |
| **BR-16** | Tài khoản `LOCKED` không đăng nhập được; token đang có bị từ chối ngay (middleware kiểm tra `status` trong DB mỗi request). |
| **BR-17** | Khách vãng lai không cần tài khoản: nhân viên nhập `guestName` + `guestPhone`, hoặc chọn một khách có sẵn (`customerId`). |
| **BR-18** | Mobile dành cho `CUSTOMER`; Web dành cho `STAFF`/`ADMIN`. Server vẫn cho đăng nhập cả hai, **client** chặn sai role; quyền thật được chặn ở server bằng `requireRole`. |
| **BR-19** | Admin không tự khóa tài khoản của mình; hệ thống luôn còn ≥ 1 ADMIN `ACTIVE`. Không đổi role qua API (STAFF tạo bởi admin, CUSTOMER tự đăng ký). |
| **BR-20** | Múi giờ hệ thống `Asia/Ho_Chi_Minh` (+07:00) cho mọi so sánh thời gian. |
| **BR-21** | Số điện thoại hợp lệ: `^0\d{9}$`. Mật khẩu ≥ 6 ký tự. Họ tên 2–100 ký tự. |
| **BR-22** | Đơn từ APP luôn gắn `user_id` của người đăng nhập. Mã đơn `booking_code` gồm `BK` + 8 ký tự `A–Z0–9` ngẫu nhiên, duy nhất. |
| **BR-23** | **Danh mục dịch vụ** có 3 loại: `DRINK` (đồ uống, đồ ăn nhẹ), `RENTAL` (thuê đồ: vợt, giày, bóng, áo bib), `PACKAGE` (gói tiệc, sự kiện). Giá **cố định** theo từng dịch vụ, **snapshot** vào `service_order_items.unit_price` lúc gọi. **Không quản lý tồn kho**; trạng thái `ACTIVE` / `OUT_OF_STOCK` (nhân viên bật tắt) / `INACTIVE` (admin). Chỉ dịch vụ `ACTIVE` mới gọi được (`422 SERVICE_NOT_AVAILABLE`). |
| **BR-24** | Khách chỉ gọi dịch vụ cho **đơn của mình đang `CONFIRMED` và chưa qua giờ kết thúc** (`now < end_time`). Mỗi yêu cầu có 1–10 dòng, mỗi dòng số lượng 1–20. Gọi dịch vụ cho đơn không hợp lệ → `422 BOOKING_NOT_ACTIVE_FOR_SERVICE`. Có thể gọi trước giờ chơi (đặc biệt gói tiệc) và nhân viên thấy trong hàng đợi. |
| **BR-25** | Vòng đời yêu cầu dịch vụ: `REQUESTED` → `DELIVERED` hoặc `CANCELLED`. **Chỉ yêu cầu `DELIVERED` mới được tính vào hóa đơn.** Hủy yêu cầu `REQUESTED`: khách hoặc nhân viên. Hủy yêu cầu `DELIVERED`: chỉ nhân viên và chỉ khi sau khi hủy, `service_amount` vẫn ≥ số tiền dịch vụ đã thu (`409 SERVICE_ALREADY_PAID` nếu không). |
| **BR-26** | **Hóa đơn:** `grandTotal = court_amount + service_amount`; `paidAmount` = tổng `payments` loại `PAYMENT`, `SUCCESS`; `balance = grandTotal − paidAmount`. **Tiền dịch vụ** thu tại quầy khi nhân viên bấm "Thu tiền dịch vụ": số tiền = `service_amount − đã thu dịch vụ` (toàn bộ phần còn thiếu), **có thể thu nhiều lần** nếu khách gọi thêm sau khi đã thu. Khách **không** thanh toán dịch vụ trong app. |
| **BR-27** | **Đồ thuê (`RENTAL`)** tính phí **một lần theo buổi** bằng giá dịch vụ, **không** tính theo thời gian/quá giờ. Nhân viên đánh dấu **đã nhận lại** (`returned_at`). Đền bù mất/hỏng **ngoài phạm vi** (nhân viên xử lý ngoài hệ thống). |
| **BR-28** | Điều kiện bổ sung để `COMPLETED`: (1) không còn yêu cầu `REQUESTED` của đơn (`422 HAS_PENDING_SERVICE_ORDERS`); (2) mọi đồ thuê đã giao đều đã nhận lại (`422 RENTALS_NOT_RETURNED`); (3) đã thu đủ tiền dịch vụ (`422 SERVICE_BALANCE_DUE`). |
| **BR-29** | Hủy **đơn sân**: không cho phép nếu đã có yêu cầu dịch vụ `DELIVERED` (`409 HAS_DELIVERED_SERVICES`); các yêu cầu `REQUESTED` tự chuyển `CANCELLED`. Hoàn tiền (BR-10) chỉ áp dụng cho **tiền sân** (`payments.purpose = 'COURT'`). |
| **BR-30** | **Khu sự kiện/tiệc** = `court_types.category = 'EVENT'`; các "sân" thuộc loại đó (phòng tiệc, khu BBQ) có `capacity`. Đặt, thanh toán, giữ chỗ, chống trùng, hủy, hoàn tiền áp dụng **y hệt sân thể thao** (BR-01..BR-12). Không có duyệt đơn riêng, không đặt cọc (giới hạn đã biết). |
| **BR-31** | Nhân viên có thể **nhập hộ dịch vụ** cho đơn `CONFIRMED` (khách gọi trực tiếp tại quầy/tại sân). Yêu cầu loại này có `source = 'STAFF'` và **vào thẳng `DELIVERED`**. |
| **BR-32** | Báo cáo doanh thu **tách tiền sân và tiền dịch vụ** (theo `payments.purpose`) và có thống kê dịch vụ bán chạy (theo các yêu cầu `DELIVERED`). |
| **BR-33** | **Đóng đơn có công nợ (chỉ ADMIN):** khi khách đã dùng sân/dịch vụ nhưng bỏ đi không thanh toán đủ hoặc không trả đồ thuê, ADMIN đóng đơn `CONFIRMED` **đã đến giờ bắt đầu** thành `COMPLETED` với **lý do bắt buộc**. Bỏ qua điều kiện đã `PAID` (BR-12) và BR-28 (đồ thuê, tiền dịch vụ); yêu cầu `REQUESTED` tự `CANCELLED`; đặt `closed_with_debt = 1`; **không tạo `payments`** (công nợ = `grandTotal − paidAmount`, hiện trong hóa đơn và báo cáo); ghi `booking_status_logs` kèm số tiền còn nợ và đồ chưa trả. Lý do tồn tại: nếu không có lối này, đơn đã giao dịch vụ mà khách bỏ đi sẽ **không thể hoàn thành, hủy hay no-show** (BR-12, BR-29) và kẹt mãi ở `CONFIRMED`. |
| **BR-34** | **Thông tin nhận tiền hoàn:** khi hủy đơn đã `PAID`, người hủy nhập `refundInfo` (≤ 300 ký tự: ngân hàng, STK, chủ TK, hoặc "nhận tiền mặt tại quầy"). **Khách bắt buộc** (`422 REFUND_INFO_REQUIRED`), nhân viên tùy chọn. Lưu vào `payments.note` của dòng `REFUND` để nhân viên chuyển tiền đúng nơi (STF-09). |

## 6. Ngoài phạm vi (cố ý không làm)

Voucher/khuyến mãi, đặt định kỳ, ghép đội, giải đấu, chat, đa chi nhánh, đặt cọc/trả góp, realtime, quên mật khẩu qua email, refresh token, chặn bảo trì theo giờ, **tồn kho dịch vụ, tính phí thuê theo giờ/quá giờ, đền bù mất hỏng, thanh toán dịch vụ online trong app, báo giá/duyệt riêng cho đơn sự kiện, thực đơn tùy biến theo từng sự kiện, hoàn tiền dịch vụ đã thu, đổi giờ/dời lịch đơn (khách hủy và đặt lại), gộp đơn của khách vãng lai vào tài khoản đăng ký sau, đổi số điện thoại tài khoản**. Lý do: `00-analysis-review.md` mục 11.
