# 📖 CẨM NANG CHỨC NĂNG HỆ THỐNG
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking System)

> **Mục đích tài liệu**: Đây là tài liệu **chuẩn định nghĩa chức năng (Functional Specification)** duy nhất cho toàn bộ dự án.  
> Agent phải **bám chặt vào tài liệu này** khi xây dựng, kiểm thử, và đánh giá bất kỳ chức năng nào.  
> Mọi thay đổi nghiệp vụ **phải cập nhật tài liệu này trước** rồi mới được code.

> **Tham chiếu bổ sung**: [`BAO_CAO_NGHIEP_VU.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_NGHIEP_VU.md) · [`AGENTS.md`](file:///d:/MonHoc/DatLichSanTheThao/AGENTS.md)

---

## 🗺️ TỔNG QUAN KIẾN TRÚC 3 NỀN TẢNG

```
┌─────────────────────────────────────────────────────────────────────┐
│              HỆ THỐNG ĐẶT LỊCH SÂN THỂ THAO                        │
├─────────────────┬─────────────────────┬─────────────────────────────┤
│  🖥️ ADMIN WEB   │  🖥️ OPERATIONS WEB  │    📱 MOBILE APP             │
│  (Quản trị hệ  │  (Quầy vận hành /   │  (Khách hàng tự phục vụ)    │
│   thống)       │   POS tại sân)      │                              │
├─────────────────┼─────────────────────┼─────────────────────────────┤
│ • Quản lý sân  │ • Đặt sân trực tiếp │ • Tìm kiếm & đặt sân        │
│ • Quản lý nhân │ • Bán đồ uống       │ • Đặt đồ uống               │
│   viên         │ • Cho thuê vợt/DC   │ • Thuê vợt / dụng cụ        │
│ • Báo cáo DT   │ • Thu tiền mặt      │ • Thanh toán QR/Ví          │
│ • Cấu hình giá │ • Quản lý ca trực   │ • Lịch sử & đánh giá        │
└─────────────────┴─────────────────────┴─────────────────────────────┘
                        │ Node.js / Express.js Backend │
                        │ MySQL / PostgreSQL + Prisma   │
                        │ Socket.io Real-time          │
```

---

## 🎭 MA TRẬN ACTOR & QUYỀN HẠN

| Chức Năng | 👤 Khách (Mobile) | 🏪 Nhân Viên (Ops Web) | 👨‍💼 Admin (Admin Web) |
| :--- | :---: | :---: | :---: |
| Tìm kiếm & xem sân | ✅ | ✅ | ✅ |
| Đặt sân (tự đặt online) | ✅ | ❌ | ❌ |
| Đặt sân trực tiếp (POS) | ❌ | ✅ | ❌ |
| Mua đồ uống (self-order) | ✅ | ✅ | ❌ |
| Thuê vợt / dụng cụ | ✅ | ✅ | ❌ |
| Duyệt / từ chối đơn | ❌ | ✅ | ✅ |
| Thu tiền & đối soát | ❌ | ✅ | ✅ |
| Quản lý tồn kho đồ uống | ❌ | 👁️ Xem | ✅ |
| Quản lý kho dụng cụ | ❌ | 👁️ Xem | ✅ |
| Thêm / sửa / xóa sân | ❌ | ❌ | ✅ |
| Cấu hình bảng giá | ❌ | ❌ | ✅ |
| Quản lý nhân viên | ❌ | ❌ | ✅ |
| Xem báo cáo doanh thu | ❌ | 📊 Ngày | ✅ Đầy đủ |
| Xử lý hoàn tiền | ❌ | ✅ | ✅ |
| Viết đánh giá sao | ✅ | ❌ | 💬 Phản hồi |
| Quản lý khuyến mãi | ❌ | ❌ | ✅ |
| Nhận thông báo push | ✅ | ✅ | ✅ |

---

## 📱 PHẦN I: MOBILE APP — ỨNG DỤNG KHÁCH HÀNG

### M-1. Quản Lý Tài Khoản (Authentication & Profile)

#### M-1.1 Đăng Ký & Đăng Nhập
| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-1.1.1 | Đăng ký tài khoản | Nhập Họ tên, SĐT, Email, Mật khẩu (≥8 ký tự, có chữ hoa + số). OTP xác thực qua SMS. | SĐT là định danh duy nhất. Không được trùng số đã đăng ký. |
| M-1.1.2 | Đăng nhập bằng Email/SĐT | Nhập tài khoản + mật khẩu, nhận JWT Token. | Sai mật khẩu 5 lần liên tiếp → khóa 15 phút. |
| M-1.1.3 | Đăng nhập Google / Apple | OAuth2 SSO, tự động tạo profile nếu lần đầu. | Nếu email Google trùng tài khoản cũ → hỏi merge. |
| M-1.1.4 | Quên mật khẩu | Gửi OTP 6 chữ số qua SMS/Email, hết hạn sau 5 phút. | OTP chỉ dùng 1 lần. |
| M-1.1.5 | Đăng xuất | Xóa JWT Token khỏi SecureStorage, navigate về màn Login. | — |

#### M-1.2 Hồ Sơ Cá Nhân
| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-1.2.1 | Xem & cập nhật hồ sơ | Họ tên, Avatar (chụp/thư viện), SĐT, Email. | Email và SĐT yêu cầu xác thực OTP khi đổi. |
| M-1.2.2 | Cấp độ thành viên | Tự động tính: Thường (0–9 lần đặt), Bạc (10–29), Vàng (30–59), Kim Cương (60+). | Hiển thị badge trên profile. Vàng/Kim Cương được ưu tiên đặt sân giờ cao điểm. |
| M-1.2.3 | Điểm tích lũy (Loyalty Points) | Mỗi 10.000 VND chi tiêu = 1 điểm. 100 điểm đổi được 10.000 VND giảm giá. | Điểm có hạn sử dụng 12 tháng kể từ ngày tích. |
| M-1.2.4 | Đổi mật khẩu | Nhập mật khẩu cũ → mật khẩu mới → xác nhận. | Mật khẩu mới không được trùng 3 mật khẩu gần nhất. |
| M-1.2.5 | Danh sách địa chỉ yêu thích | Lưu các sân đã thêm vào Yêu Thích để truy cập nhanh. | Tối đa 10 sân yêu thích. |

---

### M-2. Tìm Kiếm & Khám Phá Sân (Search & Discovery)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-2.1 | Tìm kiếm theo từ khóa | Tìm tên sân, khu vực, quận/huyện theo real-time (debounce 300ms). | Tối thiểu 2 ký tự mới kích hoạt tìm kiếm. |
| M-2.2 | Lọc theo môn thể thao | Cầu Lông 🏸, Bóng Đá ⚽, Tennis 🎾, Bóng Rổ 🏀, Pickleball 🏓, Bơi Lội 🏊, Bóng Chuyền 🏐. | Cho phép chọn đồng thời nhiều môn. |
| M-2.3 | Lọc theo khoảng giá | Slider kéo khoảng giá theo giờ (VND). Lọc theo giá giờ thấp điểm. | — |
| M-2.4 | Lọc theo tiện ích | Đèn chiếu sáng, Phòng thay đồ, Căng-tin, Cho thuê dụng cụ, WiFi, Bãi đỗ xe, Máy lạnh. | — |
| M-2.5 | Sắp xếp danh sách | Gần nhất (GPS), Giá thấp nhất, Đánh giá cao nhất, Mới nhất. | Sắp xếp theo GPS yêu cầu quyền Location. |
| M-2.6 | Xem bản đồ Google Maps | Hiển thị pin vị trí sân trên bản đồ, bấm vào pin xem thông tin nhanh. | Fallback sang danh sách nếu không có Maps API key. |
| M-2.7 | Sân gợi ý (Recommended) | Gợi ý dựa trên lịch sử đặt sân, cùng khu vực, cùng môn thể thao. | — |

---

### M-3. Chi Tiết Sân & Kiểm Tra Lịch Trống (Court Detail & Slot Checking)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-3.1 | Thông tin tổng quan sân | Tên, địa chỉ, hotline, giờ mở cửa, đánh giá sao trung bình, số lượt đặt. | — |
| M-3.2 | Thư viện ảnh thực tế | Carousel ảnh sân chụp thực tế. Bấm xem toàn màn hình. | Tối thiểu 3 ảnh. Tối đa 20 ảnh. |
| M-3.3 | Bảng giá theo giờ | Hiển thị rõ Giá thấp điểm và Giá cao điểm (Peak Hours) theo từng khung giờ. | Peak Hours: 17:00–21:00 các ngày trong tuần; 06:00–21:00 Thứ 7, CN. |
| M-3.4 | Danh sách tiện ích | Icon + nhãn từng tiện ích (xanh = có, xám = không có). | — |
| M-3.5 | Chọn ngày & kiểm tra ô giờ | Calendar strip 14 ngày tới. Bấm ngày → hiển thị bảng slot. | Không cho chọn ngày đã qua. |
| M-3.6 | Trạng thái ô giờ real-time | 🟢 Trống, 🔴 Đã đặt, 🟡 Đang giữ chỗ (5 phút), ⬛ Sân đóng/Bảo trì. | Cập nhật qua Socket.io. Slot bị giữ chỗ 5 phút nếu không thanh toán → tự động giải phóng. |
| M-3.7 | Chọn nhiều ô giờ liên tiếp | Cho phép chọn 2–4 slot liên tiếp để thuê nhiều giờ. | Các slot phải liền kề nhau, không được có slot đã đặt ở giữa. |
| M-3.8 | Xem đánh giá khách hàng | Danh sách đánh giá gồm sao, nhận xét, ngày đặt, môn thể thao. Sắp xếp mới nhất. | Hiển thị tối đa 20 đánh giá, load thêm khi cuộn. |

---

### M-4. Đặt Sân & Thanh Toán (Booking & Payment)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-4.1 | Màn xác nhận đặt sân | Hiển thị: Tên sân, ngày giờ, thời lượng, tổng tiền (đã tính Peak/Off-peak), phương thức thanh toán. | Hiển thị đếm ngược 5 phút giữ chỗ. Hết thời gian → hủy đơn tự động. |
| M-4.2 | Thêm đồ uống vào đơn | Trước khi xác nhận, có thể thêm đồ uống từ menu sân vào cùng đơn đặt. | Chỉ hiển thị đồ uống còn tồn kho. |
| M-4.3 | Thêm thuê dụng cụ vào đơn | Chọn dụng cụ cần thuê (vợt, bóng…) và số lượng. Phí thuê tính theo buổi. | Không vượt quá số lượng dụng cụ còn khả dụng tại sân. |
| M-4.4 | Áp dụng mã giảm giá (Voucher) | Nhập mã voucher → hệ thống kiểm tra hợp lệ, hiển thị số tiền được giảm. | Mỗi đơn chỉ áp 1 voucher. Voucher không áp dụng cho đồ uống. |
| M-4.5 | Dùng điểm tích lũy | Bật/tắt nút "Dùng điểm". Tự động tính số điểm tối đa có thể dùng (≤50% tổng đơn). | — |
| M-4.6 | Chọn phương thức thanh toán | Tiền mặt tại sân / MoMo / ZaloPay / VNPay / PayOS / Chuyển khoản ngân hàng. | Thanh toán online → sinh QR VietQR động. Tiền mặt → chờ xác nhận tại sân. |
| M-4.7 | Xác nhận & gửi đơn | Bấm "Xác Nhận Đặt Sân" → backend tạo đơn, gửi Push Notification cho Admin. | Backend dùng transaction DB để chống race condition double-booking. |
| M-4.8 | Màn xác nhận thành công | Hiển thị mã đơn (QR code), thông tin buổi chơi, hướng dẫn check-in. Tùy chọn chia sẻ hoặc lưu hóa đơn PDF. | — |

---

### M-5. Đặt Đồ Uống & Thuê Dụng Cụ (F&B + Equipment Rental)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-5.1 | Menu đồ uống của sân | Danh sách đồ uống có ảnh, tên, giá, số lượng còn lại. Phân danh mục (Nước ngọt, Nước suối, Thể thao, Cà phê). | Ẩn mục hết hàng (hiển thị nhãn "Hết hàng" thay vì xóa). |
| M-5.2 | Thêm vào giỏ (F&B Cart) | Bấm "+" "-" chọn số lượng, giỏ hàng hiện ở bottom bar. | Tối đa 10 đơn vị / 1 loại đồ uống. |
| M-5.3 | Đặt đồ uống độc lập | Cho phép đặt đồ uống mà không cần đặt sân (khách đến sân mua thêm). | Yêu cầu chọn sân để xác định điểm giao. |
| M-5.4 | Danh sách dụng cụ cho thuê | Vợt cầu lông, Vợt tennis, Bóng đá, Bóng rổ, Bóng chuyền, Kính bơi, Giày (theo size). Hiển thị phí thuê/buổi và số lượng còn khả dụng. | — |
| M-5.5 | Đặt thuê dụng cụ | Chọn dụng cụ + số lượng. Thời gian thuê = thời lượng đặt sân. | Không cho thuê dụng cụ nếu chưa đặt sân cùng khung giờ. |
| M-5.6 | Thanh toán giỏ F&B | Thanh toán riêng hoặc gộp vào đơn đặt sân. | — |
| M-5.7 | Nhận hàng / Check-in tại sân | Sau khi đặt online, nhân viên quét QR đơn để xác nhận giao hàng. | — |

---

### M-6. Quản Lý Lịch Đặt (Booking Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-6.1 | Danh sách đơn sắp tới | Hiển thị các đơn có trạng thái `Đã xác nhận` với đếm ngược thời gian còn lại đến giờ chơi. | — |
| M-6.2 | Danh sách lịch sử | Lịch đặt `Hoàn thành`, `Đã hủy`, `Chờ xác nhận`. Lọc theo trạng thái & khoảng thời gian. | — |
| M-6.3 | Chi tiết đơn đặt | Mã đơn, sân, khung giờ, đồ uống, dụng cụ, tổng tiền, phương thức TT, trạng thái. Nút tải hóa đơn PDF. | — |
| M-6.4 | Yêu cầu hủy đơn | Gửi yêu cầu hủy kèm lý do. Admin duyệt hủy và xử lý hoàn tiền. | Chính sách hủy: Trước 24h → hoàn 100%. Trước 2–24h → hoàn 50%. Dưới 2h → không hoàn tiền. |
| M-6.5 | Đặt lại (Re-book) | Từ đơn đã hoàn thành, bấm "Đặt lại" → pre-fill thông tin sân + điền ngày/giờ mới. | — |
| M-6.6 | Thêm vào lịch điện thoại | Xuất sự kiện `.ics` vào Google Calendar / Apple Calendar sau khi đặt thành công. | — |

---

### M-7. Đánh Giá & Phản Hồi (Reviews & Feedback)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| M-7.1 | Viết đánh giá sau buổi chơi | Sau khi đơn chuyển trạng thái `Hoàn thành`, hiển thị prompt đánh giá. Chấm 1–5 sao + nhận xét văn bản + ảnh (tùy chọn). | Chỉ được đánh giá 1 lần / 1 đơn. Thời hạn 7 ngày sau buổi chơi. |
| M-7.2 | Đánh giá đồ uống & dụng cụ | Sau khi nhận hàng, đánh giá riêng chất lượng đồ uống / dụng cụ thuê. | — |
| M-7.3 | Báo cáo vấn đề | Gửi report về vấn đề: sân bẩn, dụng cụ hỏng, nhân viên thiếu chuyên nghiệp. Kèm ảnh chụp. | Admin nhận notification ngay lập tức. |

---

### M-8. Thông Báo & Nhắc Nhở (Notifications)

| ID | Chức Năng | Mô Tả Chi Tiết |
| :--- | :--- | :--- |
| M-8.1 | Push: Đơn được xác nhận | Gửi ngay khi Admin duyệt đơn. Kèm thông tin sân và khung giờ. |
| M-8.2 | Push: Nhắc lịch chơi | Nhắc trước 2 giờ và 30 phút khi đến giờ chơi. |
| M-8.3 | Push: Đơn bị từ chối / hủy | Gửi khi Admin từ chối, kèm lý do. |
| M-8.4 | Push: Hoàn tiền thành công | Gửi khi tiền được hoàn về ví/TK ngân hàng. |
| M-8.5 | Push: Khuyến mãi / Flash Sale | Admin broadcast cho nhóm khách hàng được chọn. |
| M-8.6 | In-app Notification Center | Tất cả thông báo được lưu trong Notification Center, đọc/xóa được. |

---

## 🖥️ PHẦN II: OPERATIONS WEB — QUẦY VẬN HÀNH TẠI SÂN (POS)

> Nhân viên tại quầy sử dụng trên **máy tính bảng hoặc laptop**, không cần cài app.  
> Mục tiêu: Xử lý nhanh khách vãng lai, quản lý đơn online, thu tiền và điều phối sân.

### O-1. Dashboard Quầy Vận Hành

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| O-1.1 | Sơ đồ sân thời gian thực | Hiển thị toàn bộ sân dạng bảng (ma trận giờ × sân), cập nhật real-time qua Socket.io. Màu sắc: 🟢 Trống / 🔴 Đặt online / 🟠 Đặt tại quầy / ⬛ Bảo trì. | Làm mới tự động mỗi 30 giây nếu Socket.io ngắt kết nối. |
| O-1.2 | Tóm tắt ca trực | Số đơn đã xử lý, doanh thu tạm tính ca hiện tại, số sân đang hoạt động. | — |
| O-1.3 | Danh sách đơn online chờ xử lý | Hiển thị đơn từ Mobile App đang chờ xác nhận, sắp xếp theo thứ tự đặt. Badge đếm số đơn mới. | — |

---

### O-2. Đặt Sân Trực Tiếp (Walk-in Booking / Manual Booking)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| O-2.1 | Tạo đơn đặt sân tại quầy | Chọn sân → chọn ngày/giờ → chọn thời lượng → nhập SĐT khách (tùy chọn). Hệ thống tự tính tiền. | Slot đặt tại quầy được đánh dấu màu 🟠 trên sơ đồ. |
| O-2.2 | Tìm kiếm khách hàng | Tìm theo SĐT hoặc tên → tự động điền thông tin nếu đã có tài khoản. | Nếu khách chưa có tài khoản → vẫn tạo được đơn với thông tin tối thiểu (SĐT + Họ tên). |
| O-2.3 | Chọn sân từ sơ đồ | Bấm trực tiếp vào ô trống trên sơ đồ sân để chọn. | — |
| O-2.4 | Thêm đồ uống & dụng cụ vào đơn | Tương tự Mobile nhưng giao diện POS tối ưu cho thao tác nhanh bằng cảm ứng. | — |
| O-2.5 | Thu tiền & chốt đơn | Chọn phương thức: Tiền mặt / QR VietQR / Quẹt thẻ POS. Nhập số tiền khách đưa → hiện tiền thối. | — |
| O-2.6 | In phiếu đặt sân | In ra phiếu xác nhận (tích hợp máy in nhiệt Bluetooth/USB). | Phiếu gồm: Mã đơn QR, sân, giờ, tổng tiền, chữ ký nhân viên. |
| O-2.7 | Đặt sân định kỳ (Recurring) | Đặt cùng khung giờ cho nhiều ngày liên tiếp (VD: Thứ 2, 4, 6 hàng tuần trong 1 tháng). | Tạo nhiều đơn riêng lẻ, mỗi đơn 1 ngày. Xung đột → cảnh báo từng đơn cụ thể. |

---

### O-3. Xử Lý Đơn Online (Order Processing)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| O-3.1 | Xem chi tiết đơn online | Xem đầy đủ thông tin đơn từ Mobile App: khách hàng, sân, giờ, đồ uống, dụng cụ, phương thức TT. | — |
| O-3.2 | Duyệt đơn | Bấm "Xác Nhận" → gửi Push Notification cho khách. Slot chuyển 🔴 trên sơ đồ. | Bắt buộc duyệt trong 15 phút kể từ khi nhận đơn. Quá hạn → hệ thống tự nhắc. |
| O-3.3 | Từ chối đơn | Bấm "Từ Chối" → chọn lý do (Sân bận, Sai thông tin, Sự cố đột xuất…) → gửi Push cho khách. | Từ chối → slot tự động giải phóng. Nếu khách đã TT online → bắt buộc hoàn tiền trong 24h. |
| O-3.4 | Xác nhận check-in | Khi khách đến sân, nhân viên quét QR mã đơn để check-in. Trạng thái → `Đang chơi`. | — |
| O-3.5 | Xác nhận thanh toán tiền mặt | Đối với đơn chọn "Tiền mặt tại sân", nhân viên bấm "Đã Thu Tiền" sau khi khách trả. | — |
| O-3.6 | Xử lý hủy đơn | Nhận yêu cầu hủy từ khách → kiểm tra chính sách hoàn tiền → duyệt hoặc thương lượng. | — |

---

### O-4. Bán Đồ Uống & Cho Thuê Dụng Cụ Tại Quầy (POS F&B & Rental)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| O-4.1 | Màn hình POS bán đồ uống | Giao diện grid sản phẩm có ảnh to, dễ bấm. Bấm → thêm vào giỏ. | — |
| O-4.2 | Tính tiền & thu ngân | Hiển thị giỏ, tổng tiền, chọn phương thức TT, nhập tiền nhận → tính tiền thối. | — |
| O-4.3 | In hoặc gửi hóa đơn | In hóa đơn nhiệt hoặc gửi QR hóa đơn vào SMS/Zalo khách. | — |
| O-4.4 | Cho thuê dụng cụ tại quầy | Chọn dụng cụ → nhập tên/SĐT khách → ghi nhận thời gian cho mượn → cập nhật tồn kho. | Hệ thống đánh dấu dụng cụ là "Đang cho mượn", nhân viên nhập lại khi thu về. |
| O-4.5 | Thu hồi dụng cụ | Nhân viên quét mã dụng cụ hoặc tìm theo đơn → xác nhận đã thu hồi → tồn kho +1. | Ghi nhận tình trạng khi trả: Tốt / Bị hỏng. Nếu hỏng → ghi nợ phí bồi thường. |
| O-4.6 | Cảnh báo tồn kho thấp | Khi số lượng đồ uống hoặc dụng cụ < ngưỡng tối thiểu (cấu hình bởi Admin) → hiển thị cảnh báo đỏ. | — |

---

### O-5. Quản Lý Ca Trực (Shift Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| O-5.1 | Bắt đầu ca | Nhân viên đăng nhập → bấm "Bắt đầu ca" → nhập số tiền đầu ca (tiền lẻ trong két). | — |
| O-5.2 | Kết thúc ca & chốt tiền | Nhân viên bấm "Kết thúc ca" → nhập tổng tiền mặt thực đếm → hệ thống đối soát với giao dịch ghi nhận. | Hiển thị chênh lệch (thừa/thiếu). Lưu báo cáo ca cho Admin kiểm tra. |
| O-5.3 | Nhật ký ca trực | Mọi giao dịch trong ca được log đầy đủ: thời gian, loại GD, nhân viên thực hiện, số tiền. | — |

---

## 🖥️ PHẦN III: ADMIN WEB — TRANG QUẢN TRỊ HỆ THỐNG

### A-1. Dashboard Tổng Quan

| ID | Chức Năng | Mô Tả Chi Tiết |
| :--- | :--- | :--- |
| A-1.1 | KPI tổng quan | Doanh thu hôm nay / tuần / tháng. Số đơn mới, đang chờ, đã hoàn thành. Tỷ lệ lấp đầy sân (Occupancy Rate). |
| A-1.2 | Biểu đồ doanh thu | Line chart doanh thu 30 ngày. Bar chart so sánh tháng này vs tháng trước. |
| A-1.3 | Top sân / Top khách | Top 5 sân được đặt nhiều nhất. Top 10 khách hàng VIP (theo doanh thu). |
| A-1.4 | Cảnh báo hệ thống | Đơn chờ duyệt quá 15 phút, tồn kho dưới ngưỡng, dụng cụ đang hỏng, chênh lệch ca trực. |

---

### A-2. Quản Lý Sân (Court Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-2.1 | Danh sách sân | Hiển thị tất cả sân với trạng thái hoạt động / bảo trì, đánh giá sao, số đơn trong tháng. | — |
| A-2.2 | Thêm sân mới | Form: Tên sân, Loại sân (môn thể thao), Địa chỉ, Tọa độ GPS, Giờ mở/đóng cửa, Mô tả, Tiện ích. Upload ảnh (tối đa 20 ảnh). | — |
| A-2.3 | Chỉnh sửa thông tin sân | Cập nhật địa chỉ, hotline, giờ hoạt động, danh sách tiện ích. | — |
| A-2.4 | Cấu hình bảng giá | Thiết lập giá thấp điểm, giá cao điểm, định nghĩa khung giờ cao điểm theo ngày trong tuần / cuối tuần. Hỗ trợ giá đặc biệt theo ngày lễ. | Giá lưu kiểu `Int` (VND). Không dùng `Float` để tránh sai số. |
| A-2.5 | Cấu hình khoảng thời gian slot | Định nghĩa đơn vị slot: 30 phút, 60 phút. Giờ bắt đầu và kết thúc hoạt động của sân. | — |
| A-2.6 | Khóa / Mở khung giờ thủ công | Admin chủ động khóa ô giờ (bảo trì, giải đấu riêng) hoặc mở lại ô giờ đã khóa. Nhập lý do. | Slot bị khóa hiển thị ⬛ với tooltip lý do. |
| A-2.7 | Vô hiệu hóa sân | Tắt toàn bộ hoạt động sân (Bảo trì dài hạn). Các đơn sắp tới bị ảnh hưởng → hệ thống tự thông báo khách và đề xuất hoàn tiền. | — |
| A-2.8 | Xóa sân | Chỉ xóa được sân không có đơn đặt nào trong tương lai. | Soft-delete: chỉ ẩn, không xóa CSDL. |

---

### A-3. Quản Lý Đơn Đặt (Booking Administration)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-3.1 | Danh sách tất cả đơn | Bảng đầy đủ với filter: Trạng thái, Ngày, Sân, Phương thức TT, Khách hàng. Xuất CSV/Excel. | — |
| A-3.2 | Tìm kiếm đơn | Tìm theo Mã đơn, SĐT khách, tên khách. | — |
| A-3.3 | Chi tiết & chỉnh sửa đơn | Xem chi tiết đơn và chỉnh sửa khung giờ (nếu cần điều chỉnh) với sự đồng ý của khách. | Ghi log lý do thay đổi. |
| A-3.4 | Hủy đơn bởi Admin | Hủy đơn kèm lý do → tự động kích hoạt hoàn tiền nếu đã TT online. | — |
| A-3.5 | Lịch sử thay đổi đơn | Audit log mọi thao tác trên đơn: ai thay đổi gì, lúc nào. | — |

---

### A-4. Quản Lý Tài Chính & Hoàn Tiền (Financial Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-4.1 | Sổ thu chi tổng hợp | Danh sách tất cả giao dịch: Thu (đặt sân, F&B, dụng cụ) và Chi (hoàn tiền). Filter theo ngày, phương thức TT, loại giao dịch. | — |
| A-4.2 | Đối soát thanh toán online | Danh sách giao dịch từ MoMo / ZaloPay / VNPay / PayOS, so khớp với đơn đặt trong hệ thống. | — |
| A-4.3 | Xử lý hoàn tiền | Duyệt yêu cầu hoàn tiền → chọn phương thức hoàn (Ví gốc / Chuyển khoản) → xác nhận → ghi nhận. | Hoàn tiền phải có chữ ký Admin. Lưu ảnh chụp xác nhận giao dịch hoàn. |
| A-4.4 | Báo cáo ca trực nhân viên | Xem báo cáo chốt ca của từng nhân viên: doanh thu, số đơn, chênh lệch tiền mặt. | — |
| A-4.5 | Quản lý phí bồi thường dụng cụ hỏng | Danh sách trường hợp khách làm hỏng dụng cụ, số tiền bồi thường, trạng thái thu. | — |

---

### A-5. Quản Lý Kho (Inventory Management)

#### A-5.1 Kho Đồ Uống
| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-5.1.1 | Danh sách sản phẩm | Tên, ảnh, danh mục, giá bán, giá vốn, tồn kho hiện tại, ngưỡng cảnh báo. | — |
| A-5.1.2 | Thêm / sửa sản phẩm | Thêm đồ uống mới hoặc chỉnh sửa giá, mô tả, ảnh. | — |
| A-5.1.3 | Nhập kho | Ghi nhận lô hàng nhập: ngày nhập, số lượng, nhà cung cấp, giá vốn. Tồn kho tự động cộng thêm. | — |
| A-5.1.4 | Kiểm kê kho | Admin nhập số lượng thực tế → hệ thống tính sai lệch với sổ sách. | — |

#### A-5.2 Kho Dụng Cụ Cho Thuê
| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-5.2.1 | Danh sách dụng cụ | Loại, mã định danh (QR), trạng thái: Sẵn sàng / Đang cho mượn / Hỏng / Bảo trì. | Mỗi dụng cụ có mã QR riêng để quét khi cho mượn/thu hồi. |
| A-5.2.2 | Thêm / sửa dụng cụ | Thêm dụng cụ mới, cấu hình phí thuê/buổi, phí bồi thường nếu hỏng. | — |
| A-5.2.3 | Lịch sử cho mượn | Xem ai đã mượn, thời gian, tình trạng khi trả. | — |
| A-5.2.4 | Đánh dấu dụng cụ hỏng | Admin đánh dấu dụng cụ `Hỏng / Cần bảo trì` → ẩn khỏi danh sách cho thuê. | — |

---

### A-6. Quản Lý Nhân Viên (Staff Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-6.1 | Danh sách nhân viên | Tên, ảnh, SĐT, Email, vai trò (Nhân viên quầy / Ca trưởng), trạng thái (Active / Nghỉ việc). | — |
| A-6.2 | Thêm / sửa nhân viên | Tạo tài khoản Ops Web cho nhân viên mới, phân vai trò. | — |
| A-6.3 | Phân ca làm việc | Lịch ca trực hàng tuần dạng bảng, assign nhân viên vào ca. | — |
| A-6.4 | Xem lịch sử ca trực | Xem lại tất cả ca của từng nhân viên kèm doanh thu ca. | — |
| A-6.5 | Đặt lại mật khẩu nhân viên | Admin reset mật khẩu tài khoản Ops Web của nhân viên. | — |

---

### A-7. Quản Lý Khuyến Mãi & Voucher (Promotions)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-7.1 | Tạo mã Voucher | Tạo mã giảm giá: Cố định (50.000đ) hoặc Phần trăm (10%). Cấu hình ngày hiệu lực, số lần dùng tối đa, giá trị đơn tối thiểu. | — |
| A-7.2 | Phân phối Voucher | Gửi voucher cho nhóm khách hàng cụ thể (VIP, sinh nhật, khiếu nại) qua Push Notification / SMS. | — |
| A-7.3 | Flash Sale khung giờ | Giảm giá X% cho khung giờ thấp điểm vắng khách trong khoảng thời gian nhất định. | Giá flash sale không thấp hơn giá vốn. |
| A-7.4 | Chương trình thành viên | Cấu hình quy tắc tích điểm, quy đổi điểm, cấp độ thành viên và ưu đãi theo cấp. | — |
| A-7.5 | Thống kê hiệu quả khuyến mãi | Xem số lượt dùng voucher, doanh thu phát sinh, chi phí giảm giá. | — |

---

### A-8. Báo Cáo & Phân Tích (Analytics & Reports)

| ID | Chức Năng | Mô Tả Chi Tiết |
| :--- | :--- | :--- |
| A-8.1 | Báo cáo doanh thu | Doanh thu theo Ngày / Tuần / Tháng / Năm. Phân tích theo nguồn: Đặt sân, F&B, Dụng cụ. Xuất PDF / Excel. |
| A-8.2 | Phân tích tỷ lệ lấp đầy | Occupancy Rate theo sân, theo khung giờ, theo ngày trong tuần. Heatmap trực quan. |
| A-8.3 | Phân tích khách hàng | Tổng số KH, KH mới, KH quay lại, KH rời đi. Phân tích theo cấp độ thành viên. |
| A-8.4 | Báo cáo F&B | Doanh thu đồ uống, sản phẩm bán chạy nhất, tồn kho theo ngày. |
| A-8.5 | Báo cáo dụng cụ | Tần suất cho thuê, doanh thu thuê, tỷ lệ hỏng hóc theo từng loại dụng cụ. |
| A-8.6 | Báo cáo đánh giá | Điểm đánh giá trung bình theo sân, xu hướng đánh giá theo thời gian. Danh sách đánh giá tiêu cực cần xử lý. |

---

### A-9. Quản Lý Đánh Giá & Phản Hồi (Review Management)

| ID | Chức Năng | Mô Tả Chi Tiết | Rule Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| A-9.1 | Danh sách đánh giá | Tất cả đánh giá từ khách hàng, filter theo sân / số sao / thời gian. | — |
| A-9.2 | Phản hồi đánh giá | Admin viết phản hồi công khai dưới đánh giá của khách. | 1 đánh giá chỉ được phản hồi 1 lần. |
| A-9.3 | Ẩn / Xóa đánh giá vi phạm | Ẩn đánh giá chứa nội dung xúc phạm, vi phạm chính sách. Ghi lý do. | — |
| A-9.4 | Xử lý báo cáo vấn đề | Xem báo cáo vấn đề từ khách (sân bẩn, dụng cụ hỏng...), gán nhân viên xử lý, đánh dấu hoàn thành. | — |

---

### A-10. Cài Đặt Hệ Thống (System Configuration)

| ID | Chức Năng | Mô Tả Chi Tiết |
| :--- | :--- | :--- |
| A-10.1 | Cấu hình chính sách hủy đặt sân | Thiết lập mốc thời gian và % hoàn tiền tương ứng. |
| A-10.2 | Cấu hình ngưỡng tồn kho cảnh báo | Đặt ngưỡng số lượng tối thiểu cho từng loại sản phẩm / dụng cụ. |
| A-10.3 | Cấu hình Push Notification | Bật/tắt từng loại thông báo, cấu hình template nội dung thông báo. |
| A-10.4 | Tích hợp cổng thanh toán | Quản lý API keys cho MoMo / ZaloPay / VNPay / PayOS. Test kết nối. |
| A-10.5 | Cấu hình SMS Gateway | Thiết lập nhà cung cấp SMS (ESMS / Twilio) và template SMS OTP / nhắc lịch. |
| A-10.6 | Backup dữ liệu | Lên lịch backup tự động hàng ngày. Tải xuống file backup thủ công. |

---

## 🔒 PHẦN IV: QUY TẮC NGHIỆP VỤ CỐT LÕI (Core Business Rules)

> Agent **BẮT BUỘC** đọc và tuân thủ mục này trước khi code bất kỳ logic nghiệp vụ nào.

### BR-1. Chống Double-Booking (Anti-Collision)
- Backend phải dùng **DB Transaction + Row-level Lock** khi tạo đơn đặt sân.
- Kiểm tra slot còn trống phải thực hiện **bên trong transaction**, không được query rồi mới insert (TOCTOU race condition).
- API `POST /bookings` phải trả `409 Conflict` nếu slot đã bị đặt.

### BR-2. Slot Locking (Giữ Chỗ Tạm Thời)
- Khi khách bấm "Xác Nhận Đặt Sân", slot được khóa **5 phút** (trạng thái `PENDING`).
- Nếu sau 5 phút không có giao dịch thanh toán thành công → backend tự động giải phóng slot (cron job hoặc delayed job).
- Slot đang `PENDING` hiển thị 🟡 "Đang giữ chỗ" cho khách khác.

### BR-3. Tính Tiền Theo Giờ & Peak Pricing
- Giá = `Số giờ × Đơn giá theo khung giờ`.
- Nếu đơn đặt span qua cả giờ thấp điểm và cao điểm → tính theo từng khoảng thời gian riêng, cộng lại.
- Đơn giá lưu kiểu `Int` (VND), không dùng `Float`.

### BR-4. Chính Sách Hủy & Hoàn Tiền (mặc định, Admin có thể cấu hình)
| Thời điểm hủy | % Hoàn tiền |
| :--- | :---: |
| Trước giờ chơi ≥ 24 giờ | 100% |
| Trước giờ chơi 2 – 24 giờ | 50% |
| Trước giờ chơi < 2 giờ | 0% |
| Admin hủy vì lý do sự cố sân | 100% (không phụ thuộc thời gian) |

### BR-5. Phân Quyền Truy Cập
- `CUSTOMER` (Mobile App): Chỉ thao tác trên đơn của chính họ.
- `STAFF` (Ops Web): Thao tác trên đơn của sân được phân công, không truy cập Admin Web.
- `ADMIN` (Admin Web): Toàn quyền hệ thống.
- JWT Token phải mang `role` claim, middleware phải kiểm tra role trước mọi API có bảo vệ.

### BR-6. Tính Toàn Vẹn Tồn Kho
- Trừ tồn kho đồ uống ngay khi đơn được duyệt (trạng thái `CONFIRMED`).
- Nếu đơn bị hủy → cộng lại tồn kho.
- Tồn kho dụng cụ chỉ giảm khi nhân viên **xác nhận đã giao** (check-in thực tế), không giảm khi đặt online.

### BR-7. Tiền Tệ
- Toàn bộ giá trị tiền lưu dạng `Int` (VND, đơn vị đồng).
- Không bao giờ sử dụng `Float` hay `Decimal` cho cột tiền tệ trong DB.
- Khi hiển thị: format `xxx.xxx đ` (dấu chấm nghìn, không có đơn vị lẻ).

---

## 📌 PHẦN V: NGHIỆP VỤ THỰC TẾ ĐỀ XUẤT BỔ SUNG

> Các nghiệp vụ dưới đây chưa có trong hệ thống ban đầu nhưng **chuẩn thực tế** tại các chuỗi sân thể thao hiện đại.  
> Agent cần xác nhận với người dùng trước khi triển khai.

| Mã | Nghiệp Vụ | Mô Tả | Độ Ưu Tiên |
| :--- | :--- | :--- | :---: |
| **P-01** | **Đặt sân định kỳ (Season Pass)** | Cho phép khách đặt cùng khung giờ suốt 1 tháng / 3 tháng với giá ưu đãi. Tạo nhiều đơn con, hủy 1 đơn không ảnh hưởng các đơn còn lại. | ⭐⭐⭐ |
| **P-02** | **Tổ chức giải đấu tại sân** | Admin tạo sự kiện giải đấu, Block toàn bộ sân trong ngày, quản lý bảng đấu (bracket), thu phí tham dự. | ⭐⭐ |
| **P-03** | **Chờ hủy / Waitlist** | Khi sân hết chỗ, khách đăng ký danh sách chờ. Khi có người hủy → hệ thống tự động thông báo người chờ đầu tiên trong 10 phút để xác nhận. | ⭐⭐⭐ |
| **P-04** | **Thuê sân theo gói (Bulk Booking)** | Các câu lạc bộ, công ty thuê trọn gói nhiều sân trong nhiều giờ, được chiết khấu theo bậc: 5–10h (-5%), 10h+ (-10%). | ⭐⭐ |
| **P-05** | **QR Check-in không cần nhân viên** | Khách tự quét QR tại cổng sân, hệ thống tự mở cổng (tích hợp IoT) hoặc hiển thị mã xác nhận. | ⭐ |
| **P-06** | **Thống kê phong trào (Sports Analytics)** | Thống kê môn nào được chơi nhiều nhất theo giờ/tuần/tháng giúp Admin quyết định đầu tư sân mới. | ⭐⭐ |
| **P-07** | **Ghi điểm & Bảng xếp hạng (Gamification)** | Leaderboard khách hàng chơi nhiều nhất trong tháng, huy hiệu thành tích (100 buổi, 50 buổi...). Tăng retention. | ⭐⭐ |
| **P-08** | **Combo ưu đãi (Bundle Deal)** | Combo: Đặt sân 2h + 2 chai nước + 1 vợt thuê với giá combo rẻ hơn mua riêng 15%. | ⭐⭐⭐ |
| **P-09** | **Tích hợp Zalo OA / Chatbot** | Khách nhắn tin Zalo để đặt sân, hỏi lịch trống. Chatbot trả lời tự động các câu hỏi thường gặp. | ⭐⭐ |
| **P-10** | **Camera & Live Streaming sân** | Nhúng live stream camera sân để khách xem tình trạng thực tế trước khi đặt. | ⭐ |
| **P-11** | **Đặt cọc & Thu hộ** | Yêu cầu đặt cọc 30–50% trước với các đơn giá trị cao (> 500.000 VND). Số tiền còn lại thu tại sân. | ⭐⭐⭐ |
| **P-12** | **Dịch vụ huấn luyện viên (Coach Booking)** | Khách đặt kèm HLV theo giờ. HLV có hồ sơ riêng với chứng chỉ, giá/giờ, lịch rảnh. | ⭐⭐ |

---

*Tài liệu này là nguồn sự thật duy nhất (Single Source of Truth) cho chức năng hệ thống. Cập nhật lần cuối: 24/09/2026.*
