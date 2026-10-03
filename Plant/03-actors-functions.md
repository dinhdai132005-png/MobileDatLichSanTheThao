# 03 — ACTORS, FUNCTIONS, ROLE/PERMISSION, QUY TẮC NGHIỆP VỤ

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI**. Đây là file **ưu tiên cao nhất** về nghiệp vụ. Khi file khác mâu thuẫn với file này, file này thắng.

## 1. Mô hình nghiệp vụ

Một đơn vị vận hành **một cơ sở có nhiều sân**, thuộc nhiều loại sân.

1. Cơ sở mở cửa theo các **khung giờ cố định 1 giờ** (mặc định 06:00–22:00).
2. Mỗi **loại sân** có **bảng giá** theo khung giờ và theo ngày thường/cuối tuần.
3. Khách chọn sân + ngày + 1–3 khung giờ liền kề → tạo **đơn đặt sân**.
4. Đơn được **thanh toán** bằng tiền mặt tại sân hoặc chuyển khoản (nhân viên xác nhận).
5. Khách đến chơi → nhân viên đánh dấu **hoàn thành**. Không đến → **no-show**.
6. Khách có thể **hủy** (trong hạn) → nếu đã trả tiền thì được **hoàn**.
7. Khách vãng lai/gọi điện: **nhân viên đặt hộ** tại quầy.

## 2. Actor / Role

| Actor | Role (`users.role`) | Nền tảng | Phạm vi |
|---|---|---|---|
| Khách hàng | `CUSTOMER` | Mobile | Dữ liệu của chính mình + xem danh mục công khai |
| Nhân viên | `STAFF` | Web | Vận hành: mọi đơn, lịch sân, thanh toán, khách hàng (chỉ xem) |
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
| Xem khách hàng (tra cứu) | ❌ | 👁 | ✅ |
| Khóa/mở khóa khách hàng | ❌ | ❌ | ✅ |
| CRUD loại sân, sân, khung giờ, bảng giá | ❌ | ❌ | ✅ |
| Quản lý tài khoản nhân viên | ❌ | ❌ | ✅ |
| Báo cáo doanh thu, lấp đầy | ❌ | ❌ | ✅ |
| Dashboard "hôm nay" (số đơn, chờ thanh toán, chờ hoàn) | ❌ | ✅ | ✅ |

## 4. Danh mục chức năng

Mức: **P0** bắt buộc, **P1** nên có, **P2** tùy chọn.

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
| CUS-11 | Thanh toán VNPay sandbox | P2 |
| CUS-12 | Chọn dịch vụ đi kèm | P2 |

### 4.2 Nhân viên (Web)

| Mã | Chức năng | Mức |
|---|---|---|
| STF-01 | Đăng nhập, hồ sơ cá nhân | P0 |
| STF-02 | Dashboard "hôm nay" | P0 |
| STF-03 | Lịch lưới sân theo ngày (sân × khung giờ) | P0 |
| STF-04 | Danh sách đơn có lọc + chi tiết đơn | P0 |
| STF-05 | Đặt sân tại quầy / qua điện thoại | P0 |
| STF-06 | Ghi nhận thanh toán (tiền mặt / chuyển khoản) | P0 |
| STF-07 | Hoàn thành đơn / đánh dấu No-show | P0 |
| STF-08 | Hủy đơn thay khách (có lý do) | P0 |
| STF-09 | Danh sách đơn chờ hoàn tiền và xác nhận đã hoàn | P0 |
| STF-10 | Tra cứu khách hàng và lịch sử đơn của khách | P1 |

### 4.3 Quản trị viên (Web) — gồm mọi chức năng STAFF cộng:

| Mã | Chức năng | Mức |
|---|---|---|
| ADM-01 | Quản lý loại sân | P0 |
| ADM-02 | Quản lý sân (kể cả trạng thái bảo trì) | P0 |
| ADM-03 | Quản lý khung giờ | P0 |
| ADM-04 | Quản lý bảng giá (ma trận) | P0 |
| ADM-05 | Quản lý tài khoản nhân viên | P0 |
| ADM-06 | Quản lý khách hàng (xem, khóa/mở) | P1 |
| ADM-07 | Báo cáo: doanh thu, số đơn theo trạng thái, tỷ lệ lấp đầy | P1 |
| ADM-08 | Quản lý dịch vụ đi kèm | P2 |

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
| **BR-03** | Chỉ đặt từ hôm nay đến hôm nay + 14 ngày. Đơn từ **APP**: khung giờ đầu phải bắt đầu **sau hiện tại ≥ 30 phút**. Đơn từ **STAFF**: khung giờ cuối chưa kết thúc (cho phép đặt giờ đang diễn ra). |
| **BR-04** | Một (sân, ngày, khung giờ) chỉ thuộc **một đơn còn hiệu lực** (cơ chế UNIQUE ở `01-database.md` mục 3). Vi phạm → `409 SLOT_TAKEN`. |
| **BR-05** | Sân `MAINTENANCE`/`INACTIVE` không đặt được. Khi sân có đơn `PENDING/CONFIRMED` trong tương lai thì **không** được chuyển sang `MAINTENANCE/INACTIVE` (`409 COURT_HAS_FUTURE_BOOKINGS`); admin phải xử lý đơn trước. Loại sân/khung giờ không còn active cũng tương tự: không cho tắt nếu còn đơn tương lai liên quan. |
| **BR-06** | Phương thức thanh toán và trạng thái khởi tạo: **`CASH`** → đơn `CONFIRMED`, `UNPAID`, trả tại sân. **`BANK_TRANSFER`** → đơn `PENDING`, `UNPAID`, có `expires_at`. **`VNPAY`** (P2) → `PENDING`, chờ callback. Đơn do nhân viên tạo và đã thu tiền → `CONFIRMED`, `PAID` ngay. |
| **BR-07** | Đơn `PENDING` giữ chỗ **30 phút** (`expires_at = now + 30'`). Quá hạn → job chuyển `EXPIRED`, nhả slot, ghi log. |
| **BR-08** | Mỗi khách có tối đa **3 đơn đang hoạt động** (`PENDING`/`CONFIRMED` chưa kết thúc). Vượt → `422 TOO_MANY_ACTIVE_BOOKINGS`. |
| **BR-09** | **Khách** hủy được khi đơn `PENDING`/`CONFIRMED` **và** còn ≥ 6 giờ tới giờ bắt đầu. Quá hạn → `422 CANCEL_DEADLINE_PASSED` (liên hệ nhân viên). **Nhân viên** hủy được đơn `PENDING`/`CONFIRMED` bất kỳ lúc nào, **bắt buộc có lý do**. |
| **BR-10** | Hủy đơn đã `PAID`: hoàn **100%**. Hệ thống tạo `payments` loại `REFUND` trạng thái `PENDING`; nhân viên chuyển tiền rồi bấm xác nhận → `SUCCESS`, `payment_status = REFUNDED`. Đơn `NO_SHOW` **không hoàn**. Đơn chưa trả thì không có hoàn tiền. |
| **BR-11** | Thanh toán **toàn phần** một lần (số tiền = `total_amount`). Không đặt cọc, không trả từng phần. |
| **BR-12** | `COMPLETED` chỉ khi đơn `CONFIRMED`, `payment_status = PAID` và đã đến giờ bắt đầu. `NO_SHOW` chỉ khi đơn `CONFIRMED` và đã đến giờ bắt đầu. (Đơn trả tại sân: nhân viên ghi nhận tiền mặt trước, rồi hoàn thành.) |
| **BR-13** | Đánh giá chỉ khi đơn `COMPLETED`, đúng chủ đơn, **một lần/đơn**, 1–5 sao, bình luận ≤ 1000 ký tự. |
| **BR-14** | Không xóa cứng `users`, `court_types`, `courts`, `time_slots`, `bookings`, `payments`. Vô hiệu hóa bằng `is_active`/`status`. |
| **BR-15** | **Giá snapshot:** khi đặt, server tra `slot_prices` rồi lưu vào `booking_slots.price`. Sửa bảng giá sau không đổi đơn cũ. Thiếu giá → `422 PRICE_NOT_CONFIGURED`. Client **không** gửi giá. |
| **BR-16** | Tài khoản `LOCKED` không đăng nhập được; token đang có bị từ chối ngay (middleware kiểm tra `status` trong DB mỗi request). |
| **BR-17** | Khách vãng lai không cần tài khoản: nhân viên nhập `guestName` + `guestPhone`, hoặc chọn một khách có sẵn (`customerId`). |
| **BR-18** | Mobile dành cho `CUSTOMER`; Web dành cho `STAFF`/`ADMIN`. Server vẫn cho đăng nhập cả hai, **client** chặn sai role; quyền thật được chặn ở server bằng `requireRole`. |
| **BR-19** | Admin không tự khóa tài khoản của mình; hệ thống luôn còn ≥ 1 ADMIN `ACTIVE`. Không đổi role qua API (STAFF tạo bởi admin, CUSTOMER tự đăng ký). |
| **BR-20** | Múi giờ hệ thống `Asia/Ho_Chi_Minh` (+07:00) cho mọi so sánh thời gian. |
| **BR-21** | Số điện thoại hợp lệ: `^0\d{9}$`. Mật khẩu ≥ 6 ký tự. Họ tên 2–100 ký tự. |
| **BR-22** | Đơn từ APP luôn gắn `user_id` của người đăng nhập. Mã đơn `booking_code` gồm `BK` + 8 ký tự `A–Z0–9` ngẫu nhiên, duy nhất. |

## 6. Ngoài phạm vi (cố ý không làm)

Voucher/khuyến mãi, đặt định kỳ, ghép đội, giải đấu, chat, đa chi nhánh, đặt cọc/trả góp, realtime, quên mật khẩu qua email, refresh token, chặn bảo trì theo giờ, tồn kho dịch vụ. Lý do: `00-analysis-review.md` mục 11.
