# BÁO CÁO TIẾN ĐỘ TUẦN 2 & KẾ HOẠCH PHÁT TRIỂN
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking App)
**Sinh viên thực hiện:** Đinh Ngọc Đại  
**Thời gian báo cáo:** Tuần 2  

---

##  1. Kế Hoạch Tổng Thể 8 Tuần

| Tuần | Tên Giai Đoạn | Nội Dung Công Việc Chi Tiết | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **Tuần 1** | **Khởi Tạo & Khung Ứng Dụng** | • Khởi tạo dự án React Native (Expo SDK)<br>• Cấu hình hệ thống điều hướng (Bottom Tabs & Native Stack)<br>• Xây dựng Lớp Dữ Liệu Mẫu (`mockData.js`) chuẩn hóa<br>• Hoàn thành Giao diện Trang Chủ & Danh Sách Sân cơ bản |  **ĐÃ HOÀN THÀNH** |
| **Tuần 2** | **Chi Tiết Sân & Chọn Khung Giờ** | • Xây dựng Giao diện Chi Tiết Sân (`ChiTietSanScreen`)<br>• Lập trình thuật toán chọn ngày trong tuần tự động (`taoDanhSachNgay`)<br>• Thiết kế Ma trận chọn Khung giờ (`slots`) 3 trạng thái<br>• Xử lý truyền dữ liệu chọn lịch sang Màn Đặt Sân (`DatLichScreen`)<br>• Khắc phục lỗi JSX rendering (`Text strings must be rendered...`) |  **ĐÃ HOÀN THÀNH** |
| **Tuần 3** | **Đặt Sân & Quản Lý Hồ Sơ** | • Xây dựng Form Đặt Sân (`DatLichScreen`) & tính toán tổng tiền tự động<br>• Xây dựng Màn hình Hồ Sơ (`HoSoScreen`) & Thống kê cá nhân<br>• Quản lý lịch sử đơn đặt sân mẫu |  Tuần tiếp theo |
| **Tuần 4** | **Xây Dựng Backend & CSDL** | • Khởi tạo máy chủ Backend (Node.js / Express)<br>• Thiết kế Cơ sở dữ liệu (PostgreSQL / MongoDB) lưu danh sách sân |  Kế hoạch Tuần 4 |
| **Tuần 5** | **Kết Nối Frontend - Backend** | • Viết RESTful APIs cho danh mục, danh sách sân, khung giờ<br>• Kết nối Frontend lấy dữ liệu thực từ Server qua Fetch/Axios |  Kế hoạch Tuần 5 |
| **Tuần 6** | **Đăng Nhập & Bảo Mật** | • Xây dựng màn hình Đăng Nhập (Login) & Đăng Ký (Register)<br>• Xử lý mã hóa mật khẩu & Quản lý phiên làm việc JWT Token |  Kế hoạch Tuần 6 |
| **Tuần 7** | **Bản Đồ & Thanh Toán** | • Tích hợp Bản đồ chỉ đường `react-native-maps`<br>• Tích hợp Cổng thanh toán giả lập / thật (MoMo SDK / PayOS) |  Kế hoạch Tuần 7 |
| **Tuần 8** | **Kiểm Thử & Đóng Gói (Build)** | • Kiểm thử toàn bộ hệ thống (Unit Test & Integration Test)<br>• Tối ưu hiệu năng ứng dụng & Sửa lỗi (Bug fixing)<br>• Đóng gói sản phẩm (Build APK / Web) & Nộp báo cáo cuối kỳ |  Kế hoạch Tuần 8 |

---

##  2. Báo Cáo Tiến Độ Chi Tiết TUẦN 2

### A. Các Công Việc Đã Hoàn Thành Trong Tuần 2:

1. **Xây Dựng Giao Diện Chi Tiết Sân (`ChiTietSanScreen.js`)**:
   - Hiển thị đầy đủ thông tin chi tiết của sân thể thao: Tên sân, Môn thể thao (với Badge màu đặc trưng), Điểm đánh giá (Rating) và Số lượt đánh giá.
   - Thống kê các thông tin địa lý và vận hành: Địa chỉ chính xác, Giờ mở cửa / đóng cửa, Khoảng cách từ vị trí người dùng.
   - Trình bày danh sách **Tiện ích sân** (Đèn chiếu sáng, Phòng thay đồ, Cho thuê thiết bị, Bãi đỗ xe...) bằng các thẻ Chip có biểu tượng tích xanh mượt mà.

2. **Lập Trình Thuật Toán Chọn Ngày Tự Động (`taoDanhSachNgay`)**:
   - Viết thuật toán tự động lấy ngày hiện tại (`new Date()`) và sinh ra danh sách 7 ngày tiếp theo trong tuần.
   - Trích xuất thông tin linh hoạt: Thứ (`DANH_SACH_THU`), Ngày, Tháng, và Chuỗi ngày chuẩn hóa dạng `YYYY-MM-DD`.
   - Thiết kế thanh cuộn chọn ngày dạng danh sách cuộn ngang (`ScrollView horizontal`), làm nổi bật ngày đang được người dùng lựa chọn.

3. **Thiết Kế Ma Trận Chọn Khung Giờ 3 Trạng Thái (`slots`)**:
   - **Trạng thái 1 - Còn trống (`conTrong: true`)**: Hiển thị nút nền trắng, viền xám nhạt, cho phép người dùng click chọn.
   - **Trạng thái 2 - Đang chọn (`gioChon === slot.gio`)**: Nổi bật với màu xanh lá mạ chủ đạo (`#00B884`), chữ trắng.
   - **Trạng thái 3 - Đã hết / Khóa (`conTrong: false`)**: Làm mờ nút (`#F8FAFC`), chữ xám nhạt, bị vô hiệu hóa thao tác bấm (`disabled={true}`).

4. **Kết Nối Điều Hướng & Truyền Dữ Liệu (`Navigation Flow`)**:
   - Tích hợp thanh Footer cố định ở đáy màn hình hiển thị trực quan khung giờ đã chọn (`--:--` nếu chưa chọn).
   - Thiết kế nút **"Đặt sân ngay"** tự động mờ (`opacity: 0.4`) và bị vô hiệu hóa khi người dùng chưa chọn giờ.
   - Khi đã chọn giờ, bấm nút sẽ chuyển hướng mượt mà sang [DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js) kèm bộ dữ liệu: `{ san, ngay: ngayChon, gio: gioChon }`.

5. **Khắc Phục Lỗi Hệ Thống & Tối Ưu JSX (Bug Fixing)**:
   - Phát hiện và giải quyết triệt để lỗi console `Text strings must be rendered within a <Text> component`.
   - **Phân tích nguyên nhân**: Khi viết chú thích JSX `{/* comment */}` trên cùng dòng sau thẻ tự đóng `<View ... />`, trình biên dịch Babel tự động inject một ký tự khoảng trắng `" "` làm phần tử con của container (`SafeAreaView`/`View`), gây lỗi crash ứng dụng.
   - **Xử lý**: Tách toàn bộ các comment chú thích ra dòng riêng phía trên thẻ JSX tại [ChiTietSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/ChiTietSanScreen.js) và [DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js).

---

##  3. Giải Thích Mã Nguồn Chi Tiết (Code Walkthrough)

### 1. Giải thích Thuật toán sinh 7 ngày tiếp theo trong [ChiTietSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/ChiTietSanScreen.js):
> *"Hàm `taoDanhSachNgay()` lấy mốc thời gian `new Date()`, dùng vòng lặp `for` chạy 7 bước để cộng thêm từng ngày. Với mỗi ngày, hàm trích xuất Thứ (T2-CN), Ngày, Tháng và định dạng `YYYY-MM-DD` để quản lý state `ngayChon`."*

```javascript
function taoDanhSachNgay() {
  const ds = [];
  const homNay = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(homNay);
    d.setDate(homNay.getDate() + i);
    ds.push({
      thu: DANH_SACH_THU[d.getDay()],
      ngay: d.getDate(),
      thang: d.getMonth() + 1,
      ngayDayDu: d.toISOString().split('T')[0],
    });
  }
  return ds;
}
```

### 2. Giải thích Logic Render 3 Trạng Thái Khung Giờ:
> *"Trong file [ChiTietSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/ChiTietSanScreen.js), mảng `danhSachKhungGio` được duyệt qua hàm `.map()`. Nút chọn giờ áp dụng mảng style linh hoạt: dùng `!slot.conTrong` để làm xám khung giờ đã kín lịch, và dùng `gioChon === slot.gio` để đổi sang màu xanh lá chủ đạo khi người dùng bấm chọn."*

```javascript
{san.danhSachKhungGio.map((slot, i) => (
  <TouchableOpacity
    key={i}
    disabled={!slot.conTrong} // Khóa thao tác nếu đã hết sân
    onPress={() => setGioChon(slot.gio)}
    style={[
      styles.nutGio,
      !slot.conTrong && styles.nutGioHet,        // Trạng thái 3: Đã kín lịch (Xám)
      gioChon === slot.gio && styles.nutGioChon, // Trạng thái 2: Đang được chọn (Xanh)
    ]}
  >
    <Text style={[
      styles.chuGio,
      !slot.conTrong && { color: '#CBD5E1' },
      gioChon === slot.gio && { color: '#fff' },
    ]}>
      {slot.gio}
    </Text>
  </TouchableOpacity>
))}
```

### 3. Giải thích Chuyển Màn Hướng và Truyền Data sang [DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js):
> *"Thẻ `<TouchableOpacity>` ở Footer sử dụng `navigation.navigate('DatLich', { san, ngay: ngayChon, gio: gioChon })` để đóng gói toàn bộ đối tượng sân, ngày thuê và giờ thuê đã chọn gửi sang màn hình xác nhận đặt lịch."*

```javascript
<TouchableOpacity
  style={[styles.nutDat, (!gioChon || !san.conSan) && { opacity: 0.4 }]}
  disabled={!gioChon || !san.conSan}
  onPress={() => navigation.navigate('DatLich', { san, ngay: ngayChon, gio: gioChon })}
>
  <Text style={styles.chuNutDat}>Đặt sân ngay</Text>
  <Ionicons name="arrow-forward" size={16} color="#fff" />
</TouchableOpacity>
```

---

##  4. Kế Hoạch Thực Hiện Cho TUẦN 3

Trong **Tuần 3** tới, dự án sẽ tiếp tục phát triển các tính năng:
1. **Hoàn thiện Màn Hình Đặt Sân (`DatLichScreen.js`)**: Cho phép chọn số giờ thuê (1h, 1.5h, 2h, 3h), tự động nhân tính tổng tiền, hoàn thiện Form nhập thông tin khách hàng và chọn phương thức thanh toán (*Tiền mặt, MoMo, Chuyển khoản*).
2. **Màn Hình Hồ Sơ & Lịch Sử (`HoSoScreen.js`)**: Quản lý thông tin tài khoản cá nhân, tab thống kê và danh sách lịch sử các đơn đặt sân (*Hoàn thành, Sắp tới, Đã hủy*).

---
*Tài liệu Báo Cáo Tiến Độ Tuần 2 & Kế Hoạch Thực Hiện Tuần 3.*
