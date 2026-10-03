# BÁO CÁO TIẾN ĐỘ TUẦN 1 & KẾ HOẠCH PHÁT TRIỂN 8 TUẦN
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking App)
**Sinh viên thực hiện:** Đinh Ngọc Đại  
**Thời gian báo cáo:** Tuần 1  

---

## 1. Kế Hoạch Tổng Thể 8 Tuần (8-Week Master Roadmap)

| Tuần | Tên Giai Đoạn | Nội Dung Công Việc Chi Tiết | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **Tuần 1** | **Khởi Tạo & Khung Ứng Dụng** | • Khởi tạo dự án React Native (Expo SDK)<br>• Cấu hình hệ thống điều hướng (Bottom Tabs & Native Stack)<br>• Xây dựng Lớp Dữ Liệu Mẫu (`mockData.js`) chuẩn hóa<br>• Hoàn thành Giao diện Trang Chủ & Danh Sách Sân cơ bản | **ĐÃ HOÀN THÀNH** |
| **Tuần 2** | **Chi Tiết Sân & Chọn Khung Giờ** | • Xây dựng Giao diện Chi Tiết Sân (`ChiTietSanScreen`)<br>• Lập trình thuật toán chọn ngày trong tuần tự động (`taoDanhSachNgay`)<br>• Thiết kế Ma trận chọn Khung giờ (`slots`) 3 trạng thái<br>• Xử lý truyền dữ liệu chọn lịch sang Màn Đặt Sân (`DatLichScreen`)<br>• Khắc phục lỗi JSX rendering (`Text strings must be rendered...`) | **ĐÃ HOÀN THÀNH** |
| **Tuần 3** | **Đặt Sân & Quản Lý Hồ Sơ** | • Xây dựng Form Đặt Sân (`DatLichScreen`) & tính toán tổng tiền tự động<br>• Xây dựng Màn hình Hồ Sơ (`HoSoScreen`) & Thống kê cá nhân<br>• Quản lý lịch sử đơn đặt sân mẫu | Tuần tiếp theo |
| **Tuần 4** | **Xây Dựng Backend & CSDL** | • Khởi tạo máy chủ Backend (Node.js / Express)<br>• Thiết kế Cơ sở dữ liệu (PostgreSQL / MongoDB) lưu danh sách sân | Kế hoạch Tuần 4 |
| **Tuần 5** | **Kết Nối Frontend - Backend** | • Viết RESTful APIs cho danh mục, danh sách sân, khung giờ<br>• Kết nối Frontend lấy dữ liệu thực từ Server qua Fetch/Axios | Kế hoạch Tuần 5 |
| **Tuần 6** | **Đăng Nhập & Bảo Mật** | • Xây dựng màn hình Đăng Nhập (Login) & Đăng Ký (Register)<br>• Xử lý mã hóa mật khẩu & Quản lý phiên làm việc JWT Token | Kế hoạch Tuần 6 |
| **Tuần 7** | **Bản Đồ & Thanh Toán** | • Tích hợp Bản đồ chỉ đường `react-native-maps`<br>• Tích hợp Cổng thanh toán giả lập / thật (MoMo SDK / PayOS) | Kế hoạch Tuần 7 |
| **Tuần 8** | **Kiểm Thử & Đóng Gói (Build)** | • Kiểm thử toàn bộ hệ thống (Unit Test & Integration Test)<br>• Tối ưu hiệu năng ứng dụng & Sửa lỗi (Bug fixing)<br>• Đóng gói sản phẩm (Build APK / Web) & Nộp báo cáo cuối kỳ | Kế hoạch Tuần 8 |

---

## 2. Báo Cáo Tiến Độ Chi Tiết TUẦN 1

### A. Các Công Việc Đã Hoàn Thành Trong Tuần 1:

1. **Khởi Tạo Dự Án & Kiến Trúc Mã Nguồn**:
   - Khởi tạo dự án bằng **React Native** và **Expo SDK** làm nền tảng phát triển đa nền tảng (chạy trên cả iOS, Android và Web).
   - Tổ chức cấu trúc thư mục sạch sẽ, phân chia rõ ràng:
     - [App.js](file:///d:/MonHoc/DatLichSanTheThao/App.js): Entry point chính của ứng dụng.
     - `src/navigation/`: Bộ điều hướng các màn hình.
     - `src/data/`: Quản lý kho dữ liệu mẫu.
     - `src/screens/`: Quản lý các màn hình giao diện.

2. **Cấu Hình Bộ Điều Hướng (`AppDieuHuong.js`)**:
   - Sử dụng thư viện `@react-navigation/bottom-tabs` kết hợp `@react-navigation/native-stack`.
   - Tạo **Bottom Tab Bar** gồm 3 Tab chính ở đáy màn hình: *Trang Chủ, Sân Thể Thao, Hồ Sơ*.
   - Nhúng **Stack Navigator** trong từng Tab để khi người dùng bấm chọn sân, ứng dụng sẽ trượt mở màn chi tiết một cách mượt mà.

3. **Xây Dựng Cơ Sở Dữ Liệu Mẫu (`mockData.js`)**:
   - Xây dựng mảng dữ liệu JSON chuẩn tiếng Việt gồm: `DANH_SACH_MON_THE_THAO` (Môn thể thao, emoji, màu sắc), `DANH_SACH_SAN` (Danh sách sân, địa chỉ, đơn giá, rating, các khung giờ khả dụng), `LICH_SU_DAT_SAN` và `THONG_TIN_NGUOI_DUNG`.

4. **Xây Dựng Màn Hình Trang Chủ (`TrangChuScreen.js`)**:
   - Giao diện thân thiện: Lời chào người dùng, ô tìm kiếm nhanh.
   - Danh mục môn thể thao dạng cuộn ngang (`ScrollView horizontal`) hiển thị icon emoji và màu sắc nhận diện.
   - Danh sách 3 sân nổi bật đang còn trống hôm nay (`sanConTrong`).

5. **Xây Dựng Màn Hình Danh Sách Sân & Tìm Kiếm (`DanhSachSanScreen.js`)**:
   - Tích hợp ô tìm kiếm real-time theo tên sân.
   - Thanh bộ lọc nút chip theo từng môn thể thao (*Cầu Lông, Bóng Đá, Tennis, Bóng Rổ, Pickleball*).
   - Thanh sắp xếp danh sách linh hoạt theo *Gần nhất, Giá thấp nhất, Đánh giá cao nhất*.

---

## 3. Giải Thích Mã Nguồn Chi Tiết (Code Walkthrough)

### 1. Cấu hình Bộ Điều Hướng Trong [src/navigation/AppDieuHuong.js](file:///d:/MonHoc/DatLichSanTheThao/src/navigation/AppDieuHuong.js):
> *"File `AppDieuHuong.js` sử dụng `createBottomTabNavigator` để tạo thanh điều hướng 3 tab dưới đáy ứng dụng. Trong mỗi tab, hàm `createNativeStackNavigator` được nhúng vào để quản lý luồng chuyển hướng trượt màn hình sang màn Chi Tiết Sân và Đặt Sân."*

```javascript
// Tạo 3 Tab chính ở đáy ứng dụng
export default function AppDieuHuong() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.thanhTab }}>
        <Tab.Screen name="TrangChuTab" component={LuongTrangChu} options={{ title: 'Trang Chủ' }} />
        <Tab.Screen name="DanhSachSanTab" component={LuongDanhSachSan} options={{ title: 'Sân Thể Thao' }} />
        <Tab.Screen name="HoSoTab" component={HoSoScreen} options={{ title: 'Hồ Sơ' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### 2. Logic Lọc 3 Sân Nổi Bật Còn Trống Trong [src/screens/TrangChuScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/TrangChuScreen.js):
> *"Tại màn hình `TrangChuScreen.js`, em sử dụng hàm `.filter()` để chọn ra các sân có trạng thái `conSan === true`, sau đó dùng `.slice(0, 3)` để cắt lấy đúng 3 sân đầu tiên hiển thị lên mục 'Sân còn trống hôm nay'."*

```javascript
export default function TrangChuScreen({ navigation }) {
  // Lọc ra 3 sân đang còn trống để hiển thị nổi bật trên Trang Chủ
  const sanConTrong = DANH_SACH_SAN.filter((san) => san.conSan).slice(0, 3);

  return (
    // Render danh sách 3 sân nổi bật
  );
}
```

### 3. Logic Tìm Kiếm Real-Time & Sắp Xếp Trong [src/screens/DanhSachSanScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DanhSachSanScreen.js):
> *"Ở màn hình `DanhSachSanScreen.js`, hàm `.filter()` kết hợp `.toLowerCase()` và `.includes()` giúp tìm kiếm tên sân không phân biệt chữ hoa chữ thường. Tiếp đó, hàm `.sort()` sẽ sắp xếp danh sách theo tiêu chí người dùng chọn (Giá tiền, Đánh giá sao hoặc Khoảng cách)."*

```javascript
// 1. Lọc danh sách theo từ khóa nhập vào & môn thể thao chọn
const danhSachDaLoc = DANH_SACH_SAN.filter((san) => {
  const khopTen = san.tenSan.toLowerCase().includes(tuKhoa.toLowerCase());
  const khopMon = monChon === 'Tất cả' || san.monTheThao === monChon;
  return khopTen && khopMon;
});

// 2. Sắp xếp danh sách đã lọc theo tiêu chí (Giá rẻ, Đánh giá, Khoảng cách)
const danhSachHienThi = [...danhSachDaLoc].sort((a, b) => {
  if (sapXep === 'giaTien') return a.giaTien - b.giaTien;
  if (sapXep === 'danhGia') return b.danhGia - a.danhGia;
  return parseFloat(a.khoangCach) - parseFloat(b.khoangCach);
});
```

### 4. Cấu Trúc Khai Báo Dữ Liệu Mẫu Trong [src/data/mockData.js](file:///d:/MonHoc/DatLichSanTheThao/src/data/mockData.js):
> *"File `mockData.js` đóng vai trò kho lưu trữ dữ liệu JSON mẫu tiếng Việt. Mảng `DANH_SACH_SAN` chứa đầy đủ các thuộc tính của một sân thể thao thực tế bao gồm tên, địa chỉ, đơn giá, điểm đánh giá và mảng các khung giờ khả dụng."*

```javascript
export const DANH_SACH_SAN = [
  {
    id: '1',
    tenSan: 'Sân Cầu Lông Phú Thọ',
    monTheThao: 'Cầu Lông',
    emoji: '🏸',
    diaChi: '112 Lý Thường Kiệt, Q.10, TP.HCM',
    khoangCach: '1.2 km',
    giaTien: 80000,
    danhGia: 4.8,
    soLuotDanhGia: 128,
    conSan: true,
    mauSac: '#00C896',
    tienIch: ['Đèn chiếu sáng', 'Phòng thay đồ', 'Cho thuê vợt', 'Bãi đỗ xe'],
    gioMoCua: '06:00',
    gioDongCua: '22:00',
    danhSachKhungGio: [ ... ],
  },
  // ... các sân khác
];
```

---

## 4. Kế Hoạch Thực Hiện Cho TUẦN 2

Trong **Tuần 2**, dự án tiếp tục triển khai các hạng mục:
1. **Màn Hình Chi Tiết Sân (`ChiTietSanScreen.js`)**: Hiển thị thông tin tổng quan, tiện ích, khoảng cách, giờ mở cửa.
2. **Thuật Toán Sinh 7 Ngày Tự Động (`taoDanhSachNgay`)**: Sinh danh sách ngày cuộn ngang.
3. **Ma Trận Khung Giờ 3 Trạng Thái**: Thiết kế chọn slot giờ (*Còn trống, Đang chọn, Đã hết*).
4. **Kết Nối Luồng Đặt Sân**: Truyền dữ liệu sang màn hình xác nhận đặt sân [DatLichScreen.js](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.js).

---
*Tài liệu Báo Cáo Tiến Độ Tuần 1 & Kế Hoạch 8 Tuần.*
