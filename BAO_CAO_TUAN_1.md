# BÁO CÁO TIẾN ĐỘ TUẦN 1 & KẾ HOẠCH PHÁT TRIỂN 8 TUẦN
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking App)

---

## 🎯 1. Kế Hoạch Tổng Thể 8 Tuần (8-Week Master Roadmap)

| Tuần | Tên Giai Đoạn | Nội Dung Công Việc Chi Tiết | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **Tuần 1** | **Khởi Tạo & Khung Ứng Dụng** | • Khởi tạo dự án React Native (Expo SDK)<br>• Cấu hình hệ thống điều hướng (Bottom Tabs & Native Stack)<br>• Xây dựng Lớp Dữ Liệu Mẫu (`mockData.js`) chuẩn hóa<br>• Hoàn thành Giao diện Trang Chủ & Danh Sách Sân cơ bản | 🟢 **ĐÃ HOÀN THÀNH** |
| **Tuần 2** | **Chi Tiết Sân & Chọn Khung Giờ** | • Xây dựng Giao diện Chi Tiết Sân (`CourtDetailScreen`)<br>• Lập trình thuật toán chọn ngày trong tuần tự động<br>• Thiết kế Ma trận chọn Khung giờ (`slots`) 3 trạng thái | ⏳ Tuần tiếp theo |
| **Tuần 3** | **Đặt Sân & Quản Lý Hồ Sơ** | • Xây dựng Form Đặt Sân (`BookingScreen`) & tính toán tổng tiền<br>• Xây dựng Màn hình Hồ Sơ (`ProfileScreen`) & Thống kê cá nhân<br>• Quản lý lịch sử đơn đặt sân mẫu | ⏳ Đã chuẩn bị sẵn UI |
| **Tuần 4** | **Xây Dựng Backend & CSDL** | • Khởi tạo máy chủ Backend (Node.js / Express hoặc Firebase)<br>• Thiết kế Cơ sở dữ liệu (PostgreSQL / MongoDB) lưu danh sách sân | ⏳ Kế hoạch Tuần 4 |
| **Tuần 5** | **Kết Nối Frontend - Backend** | • Viết RESTful APIs cho danh mục, danh sách sân, khung giờ<br>• Kết nối Frontend lấy dữ liệu thực từ Server qua Fetch/Axios | ⏳ Kế hoạch Tuần 5 |
| **Tuần 6** | **Đăng Nhập & Bảo Mật** | • Xây dựng màn hình Đăng Nhập (Login) & Đăng Ký (Register)<br>• Xử lý mã hóa mật khẩu & Quản lý phiên làm việc JWT Token | ⏳ Kế hoạch Tuần 6 |
| **Tuần 7** | **Bản Đồ & Thanh Toán** | • Tích hợp Bản đồ chỉ đường `react-native-maps`<br>• Tích hợp Cổng thanh toán giả lập / thật (MoMo SDK / PayOS) | ⏳ Kế hoạch Tuần 7 |
| **Tuần 8** | **Kiểm Thử & Đóng Gói (Build)** | • Kiểm thử toàn bộ hệ thống (Unit Test & Integration Test)<br>• Tối ưu hiệu năng ứng dụng & Sửa lỗi (Bug fixing)<br>• Đóng gói sản phẩm (Build APK / Web) & Nộp báo cáo cuối kỳ | ⏳ Kế hoạch Tuần 8 |

---

## 📋 2. Báo Cáo Tiến Độ Chi Tiết TUẦN 1

### A. Công Việc Đã Thực Hiện Trong Tuần 1:
1. **Khởi Tạo Dự Án & Kiến Trúc Mã Nguồn**:
   - Sử dụng **React Native** và **Expo SDK** làm nền tảng phát triển đa nền tảng (chạy mượt trên cả Mobile & Web).
   - Tổ chức cấu trúc thư mục sạch sẽ, dễ quản lý:
     - `App.js`: Entry point chính của ứng dụng.
     - `src/navigation/`: Quản lý điều hướng màn hình.
     - `src/data/`: Quản lý dữ liệu mẫu.
     - `src/screens/`: Quản lý các màn hình giao diện.

2. **Cấu Hình Điều Hướng (Navigation Architecture)**:
   - Sử dụng thư viện `React Navigation` chuẩn công nghiệp.
   - Kết hợp **Bottom Tab Navigator** (cho thanh tab dưới cùng: Trang Chủ, Sân Thể Thao, Hồ Sơ) và **Native Stack Navigator** (cho luồng chuyển từ danh sách tới màn chi tiết).

3. **Xây Dựng Cơ Sở Dữ Liệu Mẫu (`mockData.js`)**:
   - Khởi tạo dữ liệu rõ ràng, cấu trúc JSON sạch cho: `SPORTS` (Môn thể thao), `COURTS` (Danh sách sân, địa chỉ, đơn giá, tiện ích, giờ khả dụng), `BOOKINGS` (Lịch đặt mẫu), và `USER_PROFILE`.

4. **Xây Dựng Giao Diện Cơ Bản (Clean & Easy UI)**:
   - Màn hình Trang Chủ (**HomeScreen**): Chứa lời chào, ô tìm kiếm nhanh, banner nổi bật, danh mục môn thể thao và danh sách sân gợi ý.
   - Màn hình Danh Sách Sân (**CourtsScreen**): Chứa ô tìm kiếm thời gian thực, bộ lọc môn thể thao và nút sắp xếp theo Khoảng cách, Giá rẻ, Rating.

---

## 💡 3.Giải Thích Code đã làm được 

### 1. Giải thích `App.js`:
> *"Giải thích file [App.js](file:///d:/MonHoc/DatLichSanTheThao/App.js) là điểm khởi chạy chính của ứng dụng.`SafeAreaProvider` để ứng dụng tự căn chỉnh viền trên iPhone/Android có tai thỏ, `StatusBar` để đặt màu thanh trạng thái sáng, và nhúng bộ điều hướng `AppNavigator`."*

### 2. Giải thích Điều Hướng `src/navigation/AppNavigator.js`:
> *" file [AppNavigator.js](file:///d:/MonHoc/DatLichSanTheThao/src/navigation/AppNavigator.js) dùng thư viện `@react-navigation`. Dùng `createBottomTabNavigator` tạo 3 tab ở đáy màn hình. Trong mỗi tab, dùng `createNativeStackNavigator` để khi người dùng bấm vào một cái sân, ứng dụng sẽ trượt mượt mà sang màn hình chi tiết."*

### 3. Giải thích Dữ Liệu `src/data/mockData.js`:
> *"Tuần 1 tạo [mockData.js](file:///d:/MonHoc/DatLichSanTheThao/src/data/mockData.js) chứa mảng dữ liệu mẫu dạng JSON gồm tên sân, môn thể thao, địa chỉ, bảng giá và các khung giờ. Đến Tuần 4 và Tuần 5 sẽ thay mảng này bằng API lấy từ Server Backend thực tế ."*

### 4. Giải thích Logic Lọc & Sắp Xếp `src/screens/CourtsScreen.js`:
> *"Ở màn hình [CourtsScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/CourtsScreen.js), em dùng hàm `.filter()` để lọc danh sách sân theo từ khóa tìm kiếm và môn thể thao được chọn, sau đó dùng hàm `.sort()` để sắp xếp danh sách theo khoảng cách hoặc giá tiền."*

---
*Tài liệu Báo Cáo Tiến Độ Tuần 1 & Kế Hoạch 8 Tuần.*
