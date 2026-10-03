# BÁO CÁO PHÂN TÍCH NGHIỆP VỤ HỆ THỐNG
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking App)

---

## 📌 1. Tổng Quan Về Các Actor Trong Hệ Thống

Hệ thống **Đặt Lịch Sân Thể Thao** phục vụ 2 nhóm người dùng chính (Actor) với các vạt vai và mục tiêu nghiệp vụ khác nhau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HỆ THỐNG ĐẶT LỊCH SÂN THỂ THAO                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│    👤 ACTOR 1: NGƯỜI DÙNG (USER)    │   👨‍💼 ACTOR 2: QUẢN LÝ (MANAGER/ADMIN)│
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Tìm kiếm & lọc sân thể thao        │ • Quản lý danh mục & thông tin sân   │
│ • Xem lịch trống & chọn khung giờ    │ • Thiết lập bảng giá & khung giờ     │
│ • Đặt sân & chọn thanh toán          │ • Tiếp nhận & duyệt đơn đặt sân      │
│ • Quản lý hồ sơ & lịch sử đặt sân    │ • Quản lý doanh thu & báo cáo        │
│ • Đánh giá & phản hồi chất lượng     │ • Phản hồi đánh giá & đối soát        │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 👤 2. Nghiệp Vụ Phía Actor 1: NGƯỜI DÙNG (User / Customer)

### A. Mục Tiêu Của Actor
Người dùng muốn dễ dàng tìm kiếm sân thể thao gần nhất, kiểm tra được chính xác khung giờ còn trống, đặt sân nhanh chóng, chọn hình thức thanh toán thuận tiện và quản lý lịch chơi của bản thân.

### B. Danh Sách Nghiệp Vụ Chi Tiết (Use Cases)

#### 1. Nghiệp Vụ Quản Lý Tài Khoản (Account Management)
- **Đăng ký tài khoản**: Tạo tài khoản mới bằng Email, Số điện thoại và Mật khẩu.
- **Đăng nhập hệ thống**: Đăng nhập bằng tài khoản cá nhân hoặc đăng nhập nhanh qua Google / Apple ID.
- **Quản lý Hồ sơ cá nhân**:
  - Xem và cập nhật Họ tên, Số điện thoại, Email, Avatar.
  - Xem thông tin Cấp độ thành viên (Thành viên Thường, Vàng, Kim Cương) và lịch sử hoạt động.

#### 2. Nghiệp Vụ Tìm Kiếm & Tra Cứu Sân (Search & Discovery)
- **Tìm kiếm theo từ khóa**: Nhập tên sân bóng hoặc khu vực (Quận/Huyện, TP) để tìm kiếm thời gian thực.
- **Lọc theo môn thể thao**: Chọn danh mục môn thể thao quan tâm (Cầu Lông 🏸, Bóng Đá ⚽, Tennis 🎾, Bóng Rổ 🏀, Pickleball 🏓, Bơi Lội 🏊).
- **Sắp xếp danh sách sân**:
  - Sắp xếp theo *Gần nhất* (Khoảng cách GPS).
  - Sắp xếp theo *Giá thấp nhất* (Từ thấp đến cao).
  - Sắp xếp theo *Đánh giá cao nhất* (Số sao Rating).

#### 3. Nghiệp Vụ Xem Chi Tiết Sân & Kiểm Tra Lịch Trống (Court Detail & Slot Checking)
- **Xem thông tin sân**: Xem địa chỉ, hình ảnh thực tế, bảng giá/giờ, giờ mở/đóng cửa, hotline.
- **Xem danh sách tiện ích**: Kiểm tra các tiện ích kèm theo (Đèn chiếu sáng, Phòng thay đồ, Căng-tin, Cho thuê dụng cụ, WiFi, Bãi đỗ xe).
- **Chọn ngày chơi**: Chọn ngày muốn chơi trong danh sách 7 ngày sắp tới.
- **Kiểm tra trạng thái ô giờ (Slot Status)**:
  - *Ô xanh (Khả dụng)*: Khung giờ còn trống, cho phép bấm chọn.
  - *Ô xám (Đã đặt)*: Khung giờ đã có người khác đặt trước hoặc sân đóng cửa (Khóa bấm).
  - *Ô nổi bật (Đang chọn)*: Khung giờ người dùng đang chọn.

#### 4. Nghiệp Vụ Đặt Sân & Thanh Toán (Booking & Payment)
- **Chọn thời gian thuê**: Chọn thời lượng thuê (1 giờ, 1.5 giờ, 2 giờ, 3 giờ), hệ thống tự động nhân đơn giá tính ra Tổng tiền.
- **Điền thông tin liên hệ**: Xác nhận Họ tên, Số điện thoại nhận tin SMS và Ghi chú thêm cho chủ sân (VD: mượn 2 cặp vợt, bật sẵn đèn...).
- **Chọn phương thức thanh toán**:
  - *Tiền mặt tại sân*: Thanh toán trực tiếp khi tới sân chơi.
  - *Ví điện tử (MoMo / ZaloPay)*: Quét mã QR thanh toán ứng dụng.
  - *Chuyển khoản ngân hàng (VNPay / PayOS)*: Chuyển khoản qua số tài khoản/QR ngân hàng.
- **Xác nhận đơn**: Kiểm tra lại tóm tắt đơn hàng và bấm "Xác Nhận Đặt Sân" để hoàn tất.

#### 5. Nghiệp Vụ Quản Lý Lịch Đặt & Đánh Giá (Booking History & Reviews)
- **Quản lý đơn đặt**:
  - Xem danh sách *Lịch đặt sắp tới* (kèm đếm ngược giờ).
  - Xem danh sách *Lịch đặt hoàn thành* và *Đơn đã hủy*.
- **Hủy đơn đặt sân**: Được phép gửi yêu cầu hủy đơn trước giờ chơi theo quy định hủy của sân.
- **Đánh giá & Chấm sao**: Viết nhận xét và chấm sao (1 đến 5 sao) cho sân sau khi hoàn tất buổi chơi.

---

## 👨‍💼 3. Nghiệp Vụ Phía Actor 2: QUẢN LÝ / CHỦ SÂN (Manager / Admin)

### A. Mục Tiêu Của Actor
Quản lý (Chủ sân bóng hoặc Quản trị viên hệ thống) muốn quản lý danh sách sân bóng hiệu quả, theo dõi ma trận ô giờ trống, duyệt đơn đặt hàng nhanh chóng, đối soát doanh thu chuẩn xác và tối ưu hóa tỷ lệ lấp đầy sân.

### B. Danh Sách Nghiệp Vụ Chi Tiết (Use Cases)

#### 1. Nghiệp Vụ Quản Lý Danh Sách Sân Vận Động (Court Management)
- **Thêm mới sân bóng**: Đăng tải thông tin sân mới (Tên sân, môn thể thao, địa chỉ, vị trí Google Maps, bảng giá cơ bản, danh sách tiện ích, hình ảnh thực tế).
- **Cập nhật thông tin sân**: Chỉnh sửa địa chỉ, hotline, giờ mở/đóng cửa, cập nhật danh sách tiện ích.
- **Cấu hình bảng giá linh hoạt (Pricing Rules)**:
  - Giá giờ bình thường (Giờ thấp điểm).
  - Giá giờ cao điểm (Peak Hours: VD từ 17:00 - 21:00 các ngày trong tuần hoặc cuối tuần).
- **Quản lý trạng thái sân**: Tạm ngừng hoạt động sân (Bảo trì, sửa chữa, giải đấu riêng).

#### 2. Nghiệp Vụ Quản Lý Lịch Trống & Khung Giờ (Schedule & Slot Management)
- **Xem sơ đồ lịch đặt sân (Calendar View)**: Xem ma trận tất cả các ô giờ của các sân dưới dạng bảng biểu thời gian thực.
- **Khóa / Mở khung giờ thủ công**: Chủ động khóa ô giờ đối với các đơn đặt giữ chỗ qua điện thoại/khách vãng lai, hoặc mở lại ô giờ khi khách hủy.

#### 3. Nghiệp Vụ Quản Lý & Duyệt Đơn Đặt Sân (Booking Operations)
- **Tiếp nhận thông báo đơn mới**: Nhận thông báo tức thì khi có người dùng gửi đơn đặt sân mới trên ứng dụng.
- **Xử lý đơn đặt sân**:
  - *Duyệt đơn*: Xác nhận đơn hàng (Dành cho đơn chuyển khoản/ví điện tử đã nhận tiền).
  - *Từ chối / Hủy đơn*: Từ chối đơn trong trường hợp sự cố đột xuất và ghi rõ lý do.
- **Tạo đơn đặt trực tiếp (Manual Booking)**: Đặt ô giờ trực tiếp cho khách hàng gọi điện thoại đặt sân hoặc đến sân vãng lai.

#### 4. Nghiệp Vụ Quản Lý Tài Chính & Đối Soát Thanh Toán (Financial Management)
- **Đối soát thanh toán trực tuyến**: Kiểm tra các giao dịch thanh toán thành công qua MoMo / Ngân hàng.
- **Xác nhận thanh toán tiền mặt**: Đánh dấu "Đã thu tiền mặt" khi khách hàng hoàn tất buổi chơi và trả tiền tại quầy.
- **Quản lý hoàn tiền**: Xử lý hoàn tiền cho người dùng hủy đơn đúng quy định.

#### 5. Nghiệp Vụ Báo Cáo & Thống Kê Doanh Thu (Analytics & Reports)
- **Báo cáo doanh thu**: Theo dõi biểu đồ doanh thu theo Ngày, Tuần, Tháng, Năm.
- **Thống kê tỷ lệ lấp đầy (Occupancy Rate)**: Phân tích khung giờ nào đông khách nhất, khung giờ nào vắng khách để đưa ra chương trình khuyến mãi kích cầu.
- **Thống kê khách hàng**: Danh sách khách hàng đặt nhiều nhất (Khách hàng thân thiết).

#### 6. Nghiệp Vụ Quản Lý Phản Hồi & Đánh Giá (Feedback & Customer Care)
- **Quản lý bình luận**: Xem danh sách đánh giá sao và nhận xét của khách hàng.
- **Phản hồi đánh giá**: Trả lời bình luận của người dùng để nâng cao uy tín và chất lượng dịch vụ của sân.

---

## 📊 4. Ma Trận Bảng So Sánh Quyền Hạn Nghiệp Vụ (Permission Matrix)

| Chức Năng Nghiệp Vụ | Actor: NGƯỜI DÙNG (User) | Actor: QUẢN LÝ (Manager/Admin) |
| :--- | :---: | :---: |
| **Tìm kiếm & Lọc sân** | ✅ Xem & Tìm kiếm | ✅ Xem danh sách sân |
| **Xem bảng giá & Khung giờ trống** | ✅ Xem thời gian thực | ✅ Xem & Cấu hình chỉnh sửa |
| **Đặt sân & Chọn giờ** | ✅ Thực hiện đặt | ❌ Không (Tạo đơn qua Admin) |
| **Tạo đơn thủ công cho khách vãng lai** | ❌ Không có quyền | ✅ Tạo & Giữ ô giờ trực tiếp |
| **Duyệt / Từ chối đơn đặt sân** | ❌ Không có quyền | ✅ Toàn quyền xử lý |
| **Hủy đơn đã đặt** | ✅ Yêu cầu hủy theo chính sách | ✅ Hủy & Xử lý hoàn tiền |
| **Thanh toán tiền mặt / Chuyển khoản** | ✅ Chọn & Thanh toán | ✅ Đối soát & Xác nhận đã thu |
| **Thêm / Sửa / Xóa thông tin sân** | ❌ Không có quyền | ✅ Toàn quyền quản lý |
| **Xem Báo cáo Doanh thu & Thống kê** | ❌ Không có quyền | ✅ Xem chi tiết biểu đồ |
| **Viết đánh giá & Chấm sao** | ✅ Đánh giá sau khi chơi | 💬 Phản hồi bình luận khách |

---
*Tài liệu Báo Cáo Phân Tích Nghiệp Vụ Dự Án Đặt Lịch Sân Thể Thao.*
