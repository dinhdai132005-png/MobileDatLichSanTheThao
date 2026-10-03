# TỔNG QUAN DỰ ÁN ĐẶT LỊCH SÂN THỂ THAO
> **Ứng Dụng Đa Nền Tảng (Mobile & Web)**  
> **Sinh viên thực hiện:** Đinh Ngọc Đại  
> **Công nghệ:** React Native & Expo SDK (Cross-Platform)

---

## 📌 1. ĐÁNH GIÁ TIẾN ĐỘ DỰ ÁN (DỰ ÁN ĐANG LÀM ĐẾN ĐÂU?)

Tính đến thời điểm hiện tại, dự án **Đặt Lịch Sân Thể Thao** đã **hoàn thành 100% Giai đoạn 1 & Giai đoạn 2 (Giao diện người dùng & Logic Frontend)**, đạt tương đương **100% khối lượng công việc của 3 Tuần đầu tiên** trong Kế hoạch 8 Tuần.

### 📊 Bảng Tóm Tắt Tiến Độ Tiến Trình 8 Tuần:
| Tuần | Hạng Mục Công Việc | Trạng Thái Hiện Tại | Chi Tiết Đã Hoàn Thành |
| :---: | :--- | :---: | :--- |
| **Tuần 1** | **Khởi Tạo & Khung Ứng Dụng** | 🟢 **ĐÃ HOÀN THÀNH** | • Khởi tạo Expo project & Polyfills cho Hermes<br>• Cấu hình điều hướng Bottom Tabs + Native Stacks<br>• Chuẩn hóa dữ liệu mẫu (`mockData.js`)<br>• Xây dựng màn Trang Chủ & Danh Sách Sân cơ bản |
| **Tuần 2** | **Chi Tiết Sân & Chọn Lịch Thuê** | 🟢 **ĐÃ HOÀN THÀNH** | • Màn hình Chi Tiết Sân (`ChiTietSanScreen`)<br>• Thuật toán sinh 7 ngày tự động (`taoDanhSachNgay`)<br>• Ma trận chọn khung giờ 3 trạng thái<br>• Khắc phục lỗi Babel JSX rendering |
| **Tuần 3** | **Đặt Sân & Quản Lý Hồ Sơ** | 🟢 **ĐÃ HOÀN THÀNH**<br>*(Phần Frontend)* | • Form Đặt Sân & tự động tính tiền (`DatLichScreen`)<br>• 3 Phương thức thanh toán (Tiền mặt, MoMo, CK)<br>• Màn Hồ Sơ cá nhân & Tab Lịch sử đặt sân (`HoSoScreen`) |
| **Tuần 4** | **Xây Dựng Backend & CSDL** | ⏳ **BẮT ĐẦU TIẾP THEO** | • Khởi tạo Express Server / Node.js<br>• Thiết kế Cơ sở dữ liệu (PostgreSQL / MongoDB) |
| **Tuần 5** | **Kết Nối API Frontend - Backend** | 📋 Kế hoạch | • Viết RESTful APIs cho Sân, Khung giờ, Đơn đặt<br>• Chuyển từ mockData sang Fetch API thực tế |
| **Tuần 6** | **Xác Thực & Đăng Nhập** | 📋 Kế hoạch | • Màn Đăng Nhập / Đăng Ký<br>• Xử lý JWT Token & Bảo mật phiên làm việc |
| **Tuần 7** | **Bản Đồ & Thanh Toán Real** | 📋 Kế hoạch | • Tích hợp `react-native-maps` chỉ đường<br>• Tích hợp SDK Thanh toán (MoMo / PayOS) |
| **Tuần 8** | **Kiểm Thử & Đóng Gói (Build)** | 📋 Kế hoạch | • Kiểm thử toàn hệ thống, tối ưu hiệu năng<br>• Build APK cho Android & Đóng gói Web |

---

## 🧭 2. PHÂN ĐỊNH KIẾN TRÚC: MOBILE & WEB

Dự án được xây dựng theo kiến trúc **Cross-Platform (Đa nền tảng)** bằng **React Native & Expo SDK**, cho phép biên dịch và khởi chạy đồng thời trên **iOS, Android** và **Web Browser**.

```
                          ┌─────────────────────────────────────────┐
                          │         Mã Nguồn Chung (Shared)         │
                          │   Logic JS, State, mockData.js, CSS...  │
                          └───────────────────┬─────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
     ┌───────────────────────────────┐                 ┌───────────────────────────────┐
     │      NỀN TẢNG MOBILE          │                 │        NỀN TẢNG WEB           │
     │     (iOS & Android App)       │                 │     (Web App / Browser)       │
     ├───────────────────────────────┤                 ├───────────────────────────────┤
     │ • Render Native Components    │                 │ • Render HTML5 DOM (div/span) │
     │ • Native Navigation Stack     │                 │ • Responsive Laptop / PC      │
     │ • StatusBar & SafeArea (Notch)│                 │ • Chạy qua React Native Web   │
     │ • Native Alerts & Gestures    │                 │ • Tùy biến URL / Browser Dom  │
     └───────────────────────────────┘                 └───────────────────────────────┘
```

### A. Các Tính Năng Đặc Thù Cho MOBILE (Mobile-Specific)
1. **Quản Lý Vùng An Toàn Màn Hình (`SafeAreaProvider` & `SafeAreaView`)**:
   - Tự động thụt lề chuẩn xác cho các thiết bị di động có màn hình "tai thỏ" (Notch trên iPhone) hoặc thanh điều hướng viền dưới Android.
2. **Thanh Trạng Thái Hệ Điều Hành (`StatusBar`)**:
   - Tùy chỉnh màu chữ/icon (pin, wifi, giờ) trên đỉnh màn hình điện thoại với `style="dark-content"` hoặc `"light"`.
3. **Bộ Điều Hướng Native (`@react-navigation/native-stack`)**:
   - Mang lại hiệu ứng chuyển cảnh trượt màn hình mượt mà đặc trưng của ứng dụng di động native.
4. **Hộp Thoại Alert Native (`Alert.alert`)**:
   - Kích hoạt Popup thông báo native của hệ điều hành Android/iOS khi hoàn tất đặt sân.

### B. Các Tính Năng Cho WEB (Web-Compatible)
1. **Biên Dịch Thẻ Native Sang HTML DOM (`react-native-web`)**:
   - Các thẻ `<View>`, `<Text>`, `<ScrollView>`, `<TextInput>`, `<FlatList>` tự động biên dịch thành `<div>`, `<span>`, `<input>` trên giao diện web.
2. **Layout Tự Co Giãn (Responsive Design)**:
   - Tự động co giãn phù hợp với cửa sổ trình duyệt Web trên PC/Laptop khi chạy `npx expo start --web`.

### C. Phần Mã Nguồn Dùng Chung (Cross-Platform Shared)
- **100% Logic JS**: Các Hook (`useState`), thuật toán xử lý dữ liệu (`.filter()`, `.sort()`, `.map()`, `.slice()`).
- **Lớp Dữ Liệu (`mockData.js`)**: Kho dữ liệu JSON mẫu dùng chung hoàn toàn cho cả 2 nền tảng.

---

## 📄 3. CẤU TRÚC MÃ NGUỒN VÀ MÔ TẢ CHI TIẾT TỪNG FILE / TỪNG PHẦN ĐÃ LÀM

```
DatLichSanTheThao/
├── App.js                      (Entry point chính, cài đặt Polyfill & Navigation container)
├── app.json                    (Cấu hình dự án Expo Framework)
├── babel.config.js             (Cấu hình biên dịch Babel JavaScript)
├── package.json                (Quản lý dependencies & npm scripts)
├── TONG_QUAN_DU_AN.md          (Tài liệu Tổng quan kiến trúc & Tiến độ chi tiết)
├── BAO_CAO_TUAN_1.md            (Báo cáo tiến độ Tuần 1 & Roadmap 8 tuần)
├── BAO_CAO_TUAN_2.md            (Báo cáo tiến độ Tuần 2 & Kế hoạch phát triển)
└── src/
    ├── data/
    │   └── mockData.js         (Kho dữ liệu mẫu JSON Tiếng Việt)
    ├── navigation/
    │   └── AppDieuHuong.js     (Cấu hình Bottom Tabs Navigator & Native Stacks)
    └── screens/
        ├── TrangChuScreen.js   (Màn hình Trang Chủ & Top sân nổi bật)
        ├── DanhSachSanScreen.js(Màn hình Danh Sách, Tìm kiếm real-time & Lọc sân)
        ├── ChiTietSanScreen.js (Màn hình Chi Tiết Sân, Chọn ngày 7 ngày & Chọn khung giờ)
        ├── DatLichScreen.js    (Màn hình Form Đặt Sân, Tính tiền & Phương thức thanh toán)
        └── HoSoScreen.js       (Màn hình Hồ Sơ cá nhân & Tab Lịch sử đơn đặt sân)
```

---

### 🔍 MÔ TẢ CHI TIẾT TỪNG TỆP TIN VÀ CÁC BƯỚC ĐÃ THỰC HIỆN:

#### 1. [App.js](file:///d:/MonHoc/DatLichSanTheThao/App.js) – Entry Point Và Polyfill Hệ Thống
- **Chức năng**: Khởi chạy ứng dụng, thiết lập môi trường và bọc các Context Provider.
- **Chi tiết đã làm**:
  - Tích hợp `react-native-url-polyfill/auto` nhằm khắc phục triệt để lỗi Hermes Engine trên React Native 0.86+ (`Cannot assign to property 'protocol' which has only a getter`).
  - Viết Polyfill tùy chỉnh cho `global.DOMRect` nhằm giải quyết lỗi tương thích với `react-native-screens v4+` trên Expo Go.
  - Bọc toàn bộ ứng dụng trong `<SafeAreaProvider>` và thiết lập màu sắc cho `<StatusBar>`.

#### 2. [src/navigation/AppDieuHuong.js](file:///d:/MonHoc/DatLichSanTheThao/src/navigation/AppDieuHuong.js) – Bộ Điều Hướng Đa Tầng
- **Chức năng**: Xây dựng cấu trúc điều hướng toàn ứng dụng.
- **Chi tiết đã làm**:
  - Tạo **Bottom Tab Bar** cố định ở đáy gồm 3 tab chính: *Trang Chủ, Sân Thể Thao, Hồ Sơ*.
  - Nhúng **Native Stack Navigator** (`LuongTrangChu` và `LuongDanhSachSan`) vào từng Tab để cho phép trượt màn hình mượt mà tới `ChiTietSanScreen` và `DatLichScreen`.
  - Tùy chỉnh màu sắc nhận diện thương hiệu (`#00B884`), icon Ionicons thay đổi trạng thái khi active/inactive.

#### 3. [src/data/mockData.js](file:///d:/MonHoc/DatLichSanTheThao/src/data/mockData.js) – Lớp Dữ Liệu Mẫu Tiếng Việt
- **Chức năng**: Cung cấp dữ liệu mẫu phục vụ hiển thị và thử nghiệm logic ứng dụng.
- **Chi tiết đã làm**:
  - `DANH_SACH_MON_THE_THAO`: Danh sách 6 môn thể thao (Cầu Lông, Bóng Đá, Tennis, Bóng Rổ, Pickleball, Bơi Lội) kèm Emoji và mã màu nhận diện.
  - `DANH_SACH_SAN`: Danh sách 5 sân thể thao thực tế với đầy đủ thuộc tính: tên sân, môn, địa chỉ, khoảng cách, đơn giá, đánh giá sao, số lượt đánh giá, danh sách tiện ích, giờ mở/đóng cửa và mảng trạng thái khung giờ (`danhSachKhungGio`).
  - `LICH_SU_DAT_SAN`: Mảng dữ liệu lịch sử đặt sân mẫu với các trạng thái (`hoanThanh`, `sapToi`, `daHuy`).
  - `THONG_TIN_NGUOI_DUNG`: Thông tin tài khoản người dùng cá nhân (Đinh Ngọc Đại).

#### 4. [src/screens/TrangChuScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/TrangChuScreen.js) – Giao Diện Trang Chủ
- **Chức năng**: Màn hình đón người dùng khi mở ứng dụng.
- **Chi tiết đã làm**:
  - **Header**: Tên app, lời chào và nút shortcut "Tìm sân" chuyển nhanh sang Tab Danh sách.
  - **Danh mục môn thể thao**: Thanh cuộn ngang (`ScrollView horizontal`) hiển thị các thẻ môn thể thao với emoji và hiệu ứng màu sắc.
  - **Sân còn trống hôm nay**: Lọc ra 3 sân nổi bật còn trống bằng thuật toán `.filter(san => san.conSan).slice(0, 3)`.

#### 5. [src/screens/DanhSachSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DanhSachSanScreen.js) – Tìm Kiếm & Lọc Sân
- **Chức năng**: Cho phép người dùng tra cứu, tìm kiếm và lọc danh sách sân thể thao.
- **Chi tiết đã làm**:
  - **Ô tìm kiếm real-time**: Nhập từ khóa tìm kiếm tên sân không phân biệt chữ hoa/thường, hỗ trợ nút xóa từ khóa nhanh.
  - **Bộ lọc dạng Chip**: Chọn môn thể thao (*Tất cả, Cầu Lông, Bóng Đá, Tennis, Bóng Rổ, Pickleball*).
  - **Sắp xếp linh hoạt**: Sắp xếp theo 3 tiêu chí: *Gần nhất (khoảng cách), Giá thấp nhất, Đánh giá cao nhất*.
  - **Danh sách tối ưu (`FlatList`)**: Hiển thị thẻ sân dạng card kèm badge "Còn sân" / "Hết sân" và giao diện báo rỗng khi không có kết quả (`ListEmptyComponent`).

#### 6. [src/screens/ChiTietSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/ChiTietSanScreen.js) – Thông Tin Chi Tiết & Chọn Khung Giờ
- **Chức năng**: Hiển thị thông tin sân, chọn ngày thuê và chọn khung giờ.
- **Chi tiết đã làm**:
  - **Hero Header**: Banner Emoji đại diện kích thước lớn kèm Tag môn thể thao.
  - **Thông tin & Tiện ích**: Địa chỉ, giờ vận hành, khoảng cách, điểm rating và danh sách tiện ích sân với icon tích xanh.
  - **Thuật toán sinh 7 ngày tự động (`taoDanhSachNgay`)**: Tự động tính toán mốc `new Date()` để sinh ra 7 ngày tiếp theo trong tuần (Thứ, Ngày, Tháng, YYYY-MM-DD) dưới dạng danh sách cuộn ngang.
  - **Ma trận chọn khung giờ 3 trạng thái**:
    - *Còn trống*: Nút trắng viền xám, cho phép click.
    - *Đang chọn*: Nút chuyển sang màu xanh chủ đạo (`#00B884`), chữ trắng.
    - *Đã hết/Khóa*: Nút mờ xám (`disabled={true}`), không thể thao tác.
  - **Footer cố định**: Hiển thị giờ đã chọn và nút "Đặt sân ngay" (tự động khóa `opacity: 0.4` khi chưa chọn giờ).

#### 7. [src/screens/DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js) – Xác Nhận Đặt Sân & Thanh Toán
- **Chức năng**: Xác nhận đơn đặt sân, nhập thông tin khách hàng và chọn cách thanh toán.
- **Chi tiết đã làm**:
  - **Nhận dữ liệu truyền từ Chi Tiết Sân**: Tóm tắt tên sân, ngày thuê, giờ bắt đầu.
  - **Chọn thời gian thuê**: Nút chọn nhanh số giờ thuê (1h, 1.5h, 2h, 3h), tự động nhân tính tổng tiền (`san.giaTien * soGio`).
  - **Form thông tin liên hệ**: Nhập Họ tên, Số điện thoại và Ghi chú thêm.
  - **Phương thức thanh toán**: Tùy chọn 3 hình thức (*Tiền mặt tại sân, Ví MoMo, Chuyển khoản ngân hàng*) với custom Radio Button.
  - **Xác nhận đặt sân**: Kiểm tra tính hợp lệ dữ liệu nhập (Validation), bật Popup `Alert.alert` thông báo thành công và chuyển về Trang chủ.

#### 8. [src/screens/HoSoScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/HoSoScreen.js) – Quản Lý Hồ Sơ & Lịch Sử
- **Chức năng**: Quản lý thông tin tài khoản cá nhân và lịch sử các đơn đặt sân.
- **Chi tiết đã làm**:
  - **Header Profile**: Avatar thiết kế bằng chữ cái đầu của tên, hiển thị email và Badge cấp độ "Thành Viên Vàng".
  - **Tab Switcher**: Chuyển đổi mượt mà giữa 2 Tab nội dung:
    - **Tab 0 - Thông tin cá nhân**: Hiển thị Họ tên, Email, SĐT, Ngày tham gia, Môn yêu thích, Tổng lượt đặt.
    - **Tab 1 - Lịch sử đặt sân**: Danh sách lịch sử đơn đặt sân kèm Badge phân loại màu trực quan (*Hoàn thành - Xanh lá, Sắp tới - Vàng cam, Đã hủy - Đỏ*).

---

## 🛠️ 4. TỔNG KẾT KỸ THUẬT & CÁC NÚT THẮC ĐÃ GIẢI QUYẾT

1. **Khắc phục lỗi rendering Babel JSX**: Xử lý triệt để lỗi console `Text strings must be rendered within a <Text> component` bằng cách tách toàn bộ comment chú thích JSX `{/* comment */}` ra dòng riêng phía trên các thẻ tự đóng.
2. **Khắc phục lỗi Polyfill Hermes trên React Native**: Tích hợp `react-native-url-polyfill` và định nghĩa custom class `DOMRect` trên đối tượng `global` để tương thích hoàn toàn với Hermes Engine.
3. **Truyền dữ liệu giữa các màn hình (Navigation Params)**: Tổ chức luồng dữ liệu chặt chẽ từ `TrangChuScreen`/`DanhSachSanScreen` ➔ `ChiTietSanScreen` ➔ `DatLichScreen` ➔ `TrangChuTab`.

---
*Tài liệu Tổng Quan Dự Án & Tiến Độ Chi Tiết - Cập nhật liên tục.*
