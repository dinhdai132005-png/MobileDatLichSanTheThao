# TỔNG QUAN DỰ ÁN ĐẶT LỊCH SÂN THỂ THAO
## Phân Định Mobile - Web & Giải Thích Chi Tiết Từng File

---

## 🧭 1. Phân Định Kiến Trúc: Phần Nào Thuộc Mobile, Phần Nào Thuộc Web?

Dự án **Đặt Lịch Sân Thể Thao** được phát triển trên nền tảng **React Native & Expo Framework**. Đây là kiến trúc **Cross-Platform (Đa nền tảng)** cho phép viết mã nguồn 1 lần (dùng JavaScript/JSX) và chạy trên cả thiết bị di động (**iOS & Android**) cũng như trình duyệt (**Web Browser**).

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
     │ • Render Native Components    │                 │ • Render HTML5 DOM            │
     │ • Native Navigation Stack     │                 │ • Responsive trên Laptop/PC   │
     │ • StatusBar & SafeArea (Notch)│                 │ • Chạy qua React Native Web   │
     │ • Native Alerts & Gestures    │                 │ • Tùy biến URL / Routing      │
     └───────────────────────────────┘                 └───────────────────────────────┘
```

### A. Các Phần Đặc Thù Dành Cho MOBILE (Mobile-Specific Features)

1. **Quản Lý Vùng An Toàn Màn Hình (`SafeAreaView` / `SafeAreaProvider`)**:
   - **Mobile**: Xử lý thụt lề chuẩn xác cho các thiết bị di động có màn hình "tai thỏ" (Notch trên iPhone), camera đục lỗ, hoặc thanh điều hướng cảm ứng viền dưới Android.
   - **Web**: Hoạt động như một thẻ `div` bao ngoài tự động căn chỉnh.

2. **Thanh Trạng Thái Hệ Điều Hành (`StatusBar`)**:
   - **Mobile**: Tùy chỉnh màu chữ/icon (pin, sóng wifi, giờ) trên đỉnh màn hình điện thoại.
   - **Web**: Không xuất hiện vì trình duyệt có thanh địa chỉ riêng.

3. **Cơ Chế Điều Hướng Native (`@react-navigation/native-stack`)**:
   - **Mobile**: Mang lại hiệu ứng trượt màn hình mượt mà và cử chỉ vuốt tay quay lại (Swipe Back).
   - **Web**: Chuyển đổi view giao diện trên HTML DOM.

4. **Hộp Thoại Xác Nhận Native (`Alert.alert`)**:
   - **Mobile**: Bật Popup thông báo của hệ điều hành iOS/Android khi nhấn "Xác Nhận Đặt Sân".
   - **Web**: Biên dịch sang `window.alert()` trên trình duyệt.

---

### B. Các Phần Vận Hành Trên WEB (Web-Compatible Features)

1. **Biên Dịch Thẻ Native Sang HTML DOM (`react-native-web`)**:
   - Các component `<View>`, `<Text>`, `<ScrollView>`, `<TextInput>`, `<FlatList>` tự động biên dịch thành `<div>`, `<span>`, `<input>` khi khởi chạy Web với lệnh `npx expo start --web`.

2. **Layout Tự Co Giãn (Responsive Design)**:
   - Co giãn linh hoạt theo kích thước cửa sổ trình duyệt Web trên Laptop / PC.

---

### C. Các Phần Dùng Chung (Shared Logic - Cross-Platform)

1. **Logic Nghiệp Vụ JavaScript**: State `useState`, tính tổng tiền, thuật toán `.filter()` tìm kiếm và `.sort()` sắp xếp.
2. **Lớp Dữ Liệu (`mockData.js`)**: Mảng dữ liệu mẫu tiếng Việt dùng chung 100% cho cả Mobile và Web.

---

## 📄 2. Cấu Trúc Mã Nguồn

```
DatLichSanTheThao/
├── App.js                      (1. Entry point chính của ứng dụng)
├── app.json                    (2. Cấu hình ứng dụng Expo)
├── babel.config.js             (3. Cấu hình biên dịch Babel)
├── package.json                (4. Quản lý thư viện & scripts)
├── BAO_CAO_TUAN_1.md            (5. File báo cáo tiến độ & Kế hoạch 8 tuần)
├── TONG_QUAN_DU_AN.md          (6. File phân định Mobile/Web & Chi tiết từng file)
└── src/
    ├── data/
    │   └── mockData.js         (7. Kho dữ liệu mẫu tiếng Việt)
    ├── navigation/
    │   └── AppDieuHuong.js     (8. Bộ điều hướng Bottom Tabs & Native Stacks)
    └── screens/
        ├── TrangChuScreen.js   (9. Màn hình Trang Chủ)
        ├── DanhSachSanScreen.js(10. Màn hình Danh sách & Tìm kiếm sân)
        ├── ChiTietSanScreen.js (11. Màn hình Chi tiết sân & Chọn giờ)
        ├── DatLichScreen.js    (12. Màn hình Xác nhận thanh toán & Đặt sân)
        └── HoSoScreen.js       (13. Màn hình Hồ sơ & Lịch sử đặt sân)
```

---

### 🟢 Giải Thích Chi Tiết Từng File Trong `src/`:

1. **[App.js](file:///d:/MonHoc/DatLichSanTheThao/App.js)**: Entry point chính, nhúng `SafeAreaProvider`, `StatusBar` và `AppDieuHuong`.
2. **[src/navigation/AppDieuHuong.js](file:///d:/MonHoc/DatLichSanTheThao/src/navigation/AppDieuHuong.js)**: Tạo Bottom Tab Bar (Trang Chủ, Sân Thể Thao, Hồ Sơ) kết hợp Stack Navigator cho màn Chi Tiết Sân và Đặt Sân.
3. **[src/data/mockData.js](file:///d:/MonHoc/DatLichSanTheThao/src/data/mockData.js)**: Lưu trữ mảng `DANH_SACH_MON_THE_THAO`, `DANH_SACH_SAN`, `LICH_SU_DAT_SAN`, `THONG_TIN_NGUOI_DUNG`.
4. **[src/screens/TrangChuScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/TrangChuScreen.js)**: Màn hình Trang chủ với lời chào, ô tìm kiếm nhanh, banner khuyến mãi, danh mục thể thao và danh sách sân nổi bật.
5. **[src/screens/DanhSachSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DanhSachSanScreen.js)**: Ô tìm kiếm real-time, bộ lọc chip môn thể thao và sắp xếp theo Khoảng cách, Giá rẻ, Rating.
6. **[src/screens/ChiTietSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/ChiTietSanScreen.js)**: Thông tin sân, tiện ích, bộ chọn ngày 7 ngày tới và ma trận chọn khung giờ 3 màu (Còn trống, Đã đặt, Đã chọn).
7. **[src/screens/DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js)**: Chọn số giờ thuê (1h-3h), form thông tin khách hàng, phương thức thanh toán và nút xác nhận phát Alert thành công.
8. **[src/screens/HoSoScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/HoSoScreen.js)**: Avatar, thông tin cá nhân, khối nhắc lịch sắp tới và 2 tab Tổng quan / Lịch sử đơn đặt sân.

---
*Tài liệu Tổng Quan Dự Án & Phân Định Mobile - Web.
