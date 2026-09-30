# BÁO CÁO TIẾN ĐỘ TUẦN 3 & KẾ HOẠCH PHÁT TRIỂN
## Dự Án: Ứng Dụng Đặt Lịch Sân Thể Thao (Sports Court Booking App)
**Sinh viên thực hiện:** Đinh Ngọc Đại  
**Thời gian báo cáo:** Tuần 3  

---

## 1. Kế Hoạch Tổng Thể 8 Tuần

| Tuần | Tên Giai Đoạn | Nội Dung Công Việc Chi Tiết | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **Tuần 1** | **Khởi Tạo & Khung Ứng Dụng** | • Khởi tạo dự án React Native (Expo SDK)<br>• Cấu hình hệ thống điều hướng (Bottom Tabs & Native Stack)<br>• Xây dựng Lớp Dữ Liệu Mẫu (`mockData.js`) chuẩn hóa<br>• Hoàn thành Giao diện Trang Chủ & Danh Sách Sân cơ bản |  **ĐÃ HOÀN THÀNH** |
| **Tuần 2** | **Chi Tiết Sân & Chọn Khung Giờ** | • Xây dựng Giao diện Chi Tiết Sân (`ChiTietSanScreen`)<br>• Lập trình thuật toán chọn ngày trong tuần tự động (`taoDanhSachNgay`)<br>• Thiết kế Ma trận chọn Khung giờ (`slots`) 3 trạng thái<br>• Xử lý truyền dữ liệu chọn lịch sang Màn Đặt Sân (`DatLichScreen`)<br>• Khắc phục lỗi JSX rendering (`Text strings must be rendered...`) |  **ĐÃ HOÀN THÀNH** |
| **Tuần 3** | **Đặt Sân, Thanh Toán VietQR & Hồ Sơ** | • Hoàn thiện Form Đặt Sân (`DatLichScreen.tsx`) tính tổng tiền tự động<br>• Xây dựng Module VietQR Napas247 (`vietqr.ts` + `VietQRCodeModal.tsx`)<br>• Hoàn thiện Màn hình Hồ Sơ (`HoSoScreen.tsx`) & lịch sử đơn đặt<br>• Xây dựng tầng Service: `donDatService`, `authService`, `socketService`, `apiClient`<br>• Chuẩn hóa toàn bộ mã nguồn sang **TypeScript 100%** & định nghĩa `types/index.ts` |  **ĐÃ HOÀN THÀNH** |
| **Tuần 4** | **Xây Dựng Backend & CSDL MySQL** | • Khởi tạo Server Node.js/Express + Socket.io (`server.ts`, `app.ts`, `socket.ts`)<br>• Thiết kế CSDL MySQL 13 bảng với Prisma ORM (`schema.prisma`) — Enum 6 trạng thái đơn<br>• JWT Auth (`bcryptjs` + `jsonwebtoken`), middleware phân quyền CUSTOMER/STAFF/ADMIN<br>• RESTful APIs: `auth`, `san`, `don-dat`, `do-uong`, `danh-gia` routes<br>• Logic chống Double-Booking bằng Prisma Transaction + Giữ slot 5 phút | **ĐÃ HOÀN THÀNH** |
| **Tuần 5** | **Kết Nối REST API Mobile ↔ Backend** | • Nâng cấp `apiClient.ts` — Axios interceptor tự gắn JWT Bearer Token<br>• Nâng cấp `donDatService.ts` — hàm `mapBackendDonDatToMobile()` chuyển đổi schema MySQL → Mobile type<br>• Nâng cấp `sanService.ts`, `authService.ts` — kết nối API thực, tự login tài khoản test khi chưa có token<br>• `socketService.ts` — kết nối Socket.io Server, lắng nghe `slot_updated` real-time<br>• Duy trì `executeWithFallback<T>` — Graceful Fallback về Mock Data nếu Backend offline | **ĐÃ HOÀN THÀNH** |
| **Tuần 6** | **Đăng Nhập & Bảo Mật** | • Màn hình Đăng Nhập / Đăng Ký<br>• Xử lý mã hóa mật khẩu & quản lý JWT Token |  *Kế hoạch Tuần 6* |
| **Tuần 7** | **Bản Đồ & Thanh Toán Nâng Cao** | • Tích hợp `react-native-maps`<br>• SDK thanh toán MoMo/PayOS, Push Notification |  *Kế hoạch Tuần 7* |
| **Tuần 8** | **Kiểm Thử & Đóng Gói (Build)** | • Vitest, Supertest — Unit & Integration Test<br>• Tối ưu hiệu năng, đóng gói APK Android & nộp báo cáo cuối kỳ |  *Kế hoạch Tuần 8* |

---

## 2. Báo Cáo Tiến Độ Chi Tiết TUẦN 3

### A. Các Công Việc Đã Hoàn Thành Trong Tuần 3:

---

#### 1. Hoàn Thiện Màn Hình Đặt Sân & Thanh Toán ([src/screens/DatLichScreen.tsx](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.tsx))

Đây là màn hình trọng tâm của tuần 3 — nơi khách hàng xác nhận đơn đặt và thực hiện thanh toán.

- **Form đặt sân đầy đủ**: Thu thập thông tin Họ tên (`hoTen`), Số điện thoại (`soDT`) và Ghi chú tùy chọn cho chủ sân. Kiểm tra validation bắt buộc trước khi cho phép gửi đơn.
- **Chọn số giờ thuê linh hoạt**: 4 nút chọn nhanh (1h, 1.5h, 2h, 3h) — mỗi nút hiển thị thêm tổng chi phí tương ứng theo thời gian (`san.giaTien × soGio`).
- **Tự động tính tổng tiền**: Công thức `tongTien = san.giaTien * soGio` tính theo đơn vị VND, hiển thị real-time ở Footer khi người dùng đổi lựa chọn số giờ.
- **Phân nhánh thanh toán 3 phương thức**:
  - `tienMat`: Xác nhận đặt sân ngay lập tức.
  - `chuyenKhoan` / `momo`: Mở `VietQRCodeModal` để người dùng quét mã trước, sau đó bấm "Tôi đã chuyển khoản" mới kích hoạt gửi đơn.
- **Nút xem trước VietQR**: Khi chọn Chuyển khoản hoặc MoMo, xuất hiện nút "Xem trước Mã VietQR Quét Ngay" để mở modal kiểm tra thông tin chuyển khoản trước khi đặt.
- **Gửi đơn qua Axios API** (`donDatService.taoDonDatSan`) và **phát sự kiện Socket.io** (`socketService.emitSlotUpdate`) để khóa ngay ô giờ trên các thiết bị khác.
- **Thông báo hoàn tất** (`Alert.alert`) hiển thị mã đơn, tên sân, giờ chơi, tổng tiền và SĐT xác nhận; sau đó tự động điều hướng về Trang Chủ.

---

#### 2. Xây Dựng Module Thanh Toán VietQR Chuẩn Napas247

##### 2a. Service sinh mã QR ([src/services/vietqr.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/vietqr.ts))

- **Danh sách ngân hàng Việt Nam** (`DANH_SACH_NGAN_HANG`): Khai báo 7 ngân hàng phổ biến kèm mã BIN quốc tế chuẩn: *MBBank (970422), Vietcombank (970436), VietinBank (970415), Techcombank (970407), ACB (970416), BIDV (970418), VPBank (970432)*.
- **`generateVietQRQuickLink()`**: Sinh URL ảnh QR trực tuyến dạng `https://img.vietqr.io/image/{bank}-{stk}-{template}.png?amount=...&addInfo=...` phục vụ fallback hiển thị ảnh.
- **`generateVietQRPayloadString()`**: Sinh chuỗi Payload URL chuẩn `https://qr.vietqr.io/{BIN}/{STK}?amount=...&note=...` để thư viện `react-native-qrcode-svg` vẽ mã QR vector trực tiếp. Sử dụng `encodeURIComponent()` để mã hóa ký tự có dấu trong nội dung chuyển khoản.

##### 2b. Component Modal VietQR ([src/components/VietQRCodeModal.tsx](file:///d:/MonHoc/DatLichSanTheThao/src/components/VietQRCodeModal.tsx))

- **Vẽ mã QR Vector SVG** bằng `react-native-qrcode-svg` (kích thước 200×200, sắc nét mọi độ phân giải).
- **Cơ chế Fallback hình ảnh**: Thuộc tính `onError={() => setRenderError(true)}` tự động chuyển sang tải ảnh QR từ `img.vietqr.io` nếu thiết bị không hỗ trợ SVG.
- **Thông tin chuyển khoản rõ ràng**: Hiển thị Ngân hàng (logo emoji + tên đầy đủ), Chủ tài khoản, Số tài khoản, Số tiền thanh toán (định dạng `vi-VN`), Nội dung chuyển khoản.
- **Sao chép 1 chạm**: Nút copy nhanh Số tài khoản và Nội dung chuyển tiền (hiển thị xác nhận qua `Alert.alert`).
- **Nút "Tôi đã chuyển khoản thành công"**: Gọi callback `onConfirmPayment()` để kích hoạt luồng tạo đơn trong `DatLichScreen`.

---

#### 3. Hoàn Thiện Màn Hình Hồ Sơ & Lịch Sử ([src/screens/HoSoScreen.tsx](file:///d:/MonHoc/DatLichSanTheThao/src/screens/HoSoScreen.tsx))

- **Tải dữ liệu song song** với `Promise.all([authService.getThongTinNguoiDung(), donDatService.getLichSuDatSan()])` — tối ưu thời gian chờ, hiển thị `ActivityIndicator` khi đang tải.
- **Header Profile**: Avatar sinh tự động từ chữ cái đầu tên người dùng, hiển thị email và Badge "Thành Viên Vàng" với icon ngôi sao vàng.
- **Tab Switcher 2 chế độ**:
  - **Tab 0 — Thông tin cá nhân**: Họ tên, Email, Số điện thoại, Ngày tham gia, Môn thể thao yêu thích, Tổng lượt đặt sân.
  - **Tab 1 — Lịch sử đặt sân**: Danh sách đơn với Badge trạng thái màu sắc trực quan:
    -  `hoanThanh` → Nền xanh lá `#DCFCE7`
    -  `sapToi` → Nền vàng cam `#FEF3C7`
    -  `daHuy` → Nền đỏ nhạt `#FEE2E2`
  - Mỗi đơn hiển thị: Emoji sân, Tên sân, Môn thể thao, Ngày & Giờ & Số giờ thuê, Tổng tiền (định dạng VND).

---

#### 4. Xây Dựng Tầng Service Toàn Diện (Services Layer)

##### 4a. `apiClient.ts` — HTTP Client Trung Tâm ([src/services/apiClient.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/apiClient.ts))

- Cấu hình `axios.create` với Gateway `http://10.0.2.2:5000/api` (IP loopback Android Emulator → `localhost` máy tính lập trình viên), timeout 10 giây.
- **Request Interceptor**: Tự động gắn `Authorization: Bearer <token>` vào mọi request.
- **`executeWithFallback<T>(apiCall, mockFallback)`**: Hàm bảo vệ cốt lõi — nếu Backend chưa bật hoặc mất mạng, ứng dụng tự động trả về Mock Data local, đảm bảo **không bao giờ crash trắng màn hình** (kiến trúc Offline-First).

##### 4b. `donDatService.ts` — Service Quản Lý Đơn Đặt ([src/services/donDatService.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/donDatService.ts))

- **`getLichSuDatSan()`**: Gọi `GET /don-dat-san`, fallback về mảng `LICH_SU_DAT_SAN` mock.
- **`taoDonDatSan(donDatData)`**: Gọi `POST /don-dat-san`, sinh mã đơn tự động `BK${random 100-999}`, khởi tạo `trangThai: 'sapToi'`. Fallback dùng `.unshift()` đẩy đơn mới lên đầu danh sách mock.
- **`huyDonDat(donDatId)`**: Gọi `PATCH /don-dat-san/:id/huy`, fallback dùng `.find()` + đổi `trangThai = 'daHuy'`.

##### 4c. `authService.ts` — Service Xác Thực & Tài Khoản ([src/services/authService.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/authService.ts))

- **`getThongTinNguoiDung()`**: Trả về profile người dùng (Đinh Ngọc Đại) — gọi API thực hoặc fallback mock.
- **`dangNhap(soDienThoai)`**: Mô phỏng quy trình cấp JWT Bearer Token và lưu vào bộ nhớ phiên làm việc.

##### 4d. `socketService.ts` — Real-time Đồng Bộ Khung Giờ ([src/services/socketService.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/socketService.ts))

- Khởi tạo kết nối `socket.io-client`, quản lý Publish/Subscribe sự kiện `slot_updated`.
- **`onSlotUpdate(callback)`**: Đăng ký lắng nghe cập nhật ô giờ, trả về hàm cleanup tránh Memory Leak khi unmount.
- **`emitSlotUpdate(sanId, gio, conTrong)`**: Phát sự kiện khi vừa đặt sân xong → khóa ô giờ trên toàn bộ thiết bị khác.
- **`simulateIncomingSlotUpdate()`**: **Giả lập sự kiện real-time** — demo tính năng đồng bộ trên 1 thiết bị duy nhất, hữu ích khi báo cáo trước hội đồng.

---

#### 5. Chuẩn Hóa TypeScript 100% & Hệ Thống Kiểu Dữ Liệu ([src/types/index.ts](file:///d:/MonHoc/DatLichSanTheThao/src/types/index.ts))

Toàn bộ codebase đã được chuyển đổi từ JavaScript thuần sang **TypeScript Strict Mode**:

| Interface / Type | Mô tả |
| :--- | :--- |
| `RootStackParamList` | Định nghĩa các Route Navigation và tham số truyền giữa màn hình |
| `San`, `KhungGio`, `MonTheThao` | Cấu trúc thực thể sân, khung giờ, môn thể thao (tiền tệ VND kiểu `number`) |
| `DonDat` | Cấu trúc đơn đặt sân đầy đủ |
| `TrangThaiDonDat` | Union type: `'sapToi' \| 'hoanThanh' \| 'daHuy'` |
| `PhuongThucThanhToan` | Union type: `'tienMat' \| 'momo' \| 'chuyenKhoan'` |
| `NguoiDung` | Thông tin tài khoản người dùng |
| `VietQRConfig`, `VietQRBankInfo` | Cấu hình sinh mã QR & thông tin ngân hàng |
| `SocketSlotUpdatePayload` | Payload sự kiện Socket.io cập nhật khung giờ real-time |
| `ApiResponse<T>` | Chuẩn Response API chung toàn dự án |

---

## 3. Giải Thích Mã Nguồn Chi Tiết (Code Walkthrough)

### 1. Luồng Tính Tổng Tiền & Phân Nhánh Thanh Toán trong [DatLichScreen.tsx](file:///d:/MonHoc/DatLichSanTheThao/src/screens/DatLichScreen.tsx)

> *"Hàm `handleBookingSubmit()` kiểm tra validation form trước. Nếu chọn `chuyenKhoan` hoặc `momo`, mở `VietQRCodeModal` cho người dùng quét mã. Nếu là `tienMat`, gọi thẳng `executeCreateBooking()`. Sau khi xác nhận, gọi cả `donDatService.taoDonDatSan()` lẫn `socketService.emitSlotUpdate()` cùng lúc."*

```typescript
const tongTien = san.giaTien * soGio; // Tự động tính real-time

const handleBookingSubmit = async () => {
  if (!hoTen.trim() || !soDT.trim()) {
    Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
    return;
  }
  if (thanhToan === 'chuyenKhoan' || thanhToan === 'momo') {
    setShowVietQRModal(true); // Mở Modal VietQR trước
    return;
  }
  await executeCreateBooking(); // Tiền mặt → đặt ngay
};

const executeCreateBooking = async () => {
  setIsSubmitting(true);
  // 1. Tạo đơn qua Axios API (có Graceful Fallback)
  const donDat = await donDatService.taoDonDatSan({ ...thongTinDon });
  // 2. Phát sự kiện Socket.io khóa ô giờ real-time trên toàn thiết bị
  socketService.emitSlotUpdate(san.id, gio, false);
  setShowVietQRModal(false);
  // 3. Thông báo thành công → về Trang Chủ
  Alert.alert('Đặt sân thành công! 🎉', `Mã đơn: ${donDat.id}...`);
};
```

---

### 2. Thuật Toán Sinh Mã VietQR Payload trong [vietqr.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/vietqr.ts)

> *"Hàm `generateVietQRPayloadString()` tra cứu mã BIN ngân hàng, dùng `encodeURIComponent()` mã hóa nội dung chuyển khoản có dấu tiếng Việt, ghép thành URL QuickLink chuẩn Napas247 truyền vào `react-native-qrcode-svg` để vẽ QR vector."*

```typescript
export function generateVietQRPayloadString(config: Partial<VietQRConfig>): string {
  const bankId = config.bankId || VIETQR_MAC_DINH.bankId;
  // Tra cứu mã BIN ngân hàng (ví dụ: MBBank → '970422')
  const bank = DANH_SACH_NGAN_HANG.find((b) => b.id === bankId) || DANH_SACH_NGAN_HANG[0];
  const stk = config.accountNo || VIETQR_MAC_DINH.accountNo;
  const amount = config.amount || 0;
  const addInfo = config.addInfo || VIETQR_MAC_DINH.addInfo;

  // URL QuickLink Napas247 chuẩn — truyền thẳng vào react-native-qrcode-svg
  return `https://qr.vietqr.io/${bank.bin}/${stk}?amount=${amount}&note=${encodeURIComponent(addInfo)}`;
}
```

---

### 3. Hàm `executeWithFallback` Bảo Vệ Khỏi Crash trong [apiClient.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/apiClient.ts)

> *"Hàm `executeWithFallback<T>` nhận 2 closure: `apiCall` (gọi API thực) và `mockFallback` (trả về dữ liệu mock). Khối `try...catch` bắt mọi lỗi mạng (ECONNREFUSED, timeout). Khi Backend chưa khởi động, ứng dụng vẫn hoạt động hoàn hảo — kiến trúc Offline-First."*

```typescript
export async function executeWithFallback<T>(
  apiCall: () => Promise<AxiosResponse<T> | T>,
  mockFallback: () => T
): Promise<T> {
  try {
    const res = await apiCall();
    if (res && typeof res === 'object' && 'data' in res && 'status' in res) {
      return (res as AxiosResponse<T>).data;
    }
    return res as T;
  } catch (error) {
    console.log('🔄 Backend chưa sẵn sàng → Tự động chuyển sang Mock Data.');
    return mockFallback();
  }
}
```

---

### 4. Tải Song Song Dữ Liệu Hồ Sơ trong [HoSoScreen.tsx](file:///d:/MonHoc/DatLichSanTheThao/src/screens/HoSoScreen.tsx)

> *"Dùng `Promise.all([...])` để gọi 2 API cùng lúc — giảm thời gian chờ xuống còn bằng thời gian của request chậm nhất, thay vì cộng dồn tuần tự."*

```typescript
useEffect(() => {
  async function loadProfile() {
    try {
      setLoading(true);
      // Gọi song song 2 API: Profile + Lịch sử đặt sân
      const [user, bookings] = await Promise.all([
        authService.getThongTinNguoiDung(),
        donDatService.getLichSuDatSan(),
      ]);
      setNguoiDung(user);
      setLichSu(bookings);
    } catch (err) {
      console.error('Lỗi tải thông tin profile:', err);
    } finally {
      setLoading(false);
    }
  }
  loadProfile();
}, []);
```

---

## 4. Kết Quả Đạt Được & Điểm Sáng Kỹ Thuật

| # | Điểm Sáng Kỹ Thuật | Chi Tiết |
| :---: | :--- | :--- |
| 1 | **VietQR Napas247 tích hợp hoàn chỉnh** | Sinh mã QR vector SVG chuẩn EMVCo, fallback ảnh QuickLink, hỗ trợ 7 ngân hàng |
| 2 | **Kiến trúc Offline-First** | `executeWithFallback<T>` đảm bảo app không bao giờ crash khi Backend chưa bật |
| 3 | **TypeScript Strict 100%** | Toàn bộ screens, services, components đã có kiểu dữ liệu chặt chẽ |
| 4 | **Socket.io Simulation** | `simulateIncomingSlotUpdate()` cho phép demo real-time trên 1 thiết bị duy nhất |
| 5 | **Promise.all tối ưu** | Tải dữ liệu Profile + Lịch sử đặt sân song song, giảm thời gian chờ tối đa |
| 6 | **Sao chép 1 chạm** | Copy STK & nội dung chuyển khoản ngay trong Modal VietQR |

---

## 5. Bài Học Kinh Nghiệm & Quy Tắc Phòng Ngừa Lỗi

**Vấn đề 1: State Modal VietQR không đóng sau khi đặt sân thành công**
- **Nguyên nhân**: Sau khi `executeCreateBooking()` hoàn tất, quên gọi `setShowVietQRModal(false)`.
- **Giải pháp**: Thêm `setShowVietQRModal(false)` ngay sau khi socket emit thành công, trước khi gọi `Alert.alert`.
- **Phòng ngừa**: Luôn dọn dẹp state Modal trước khi hiển thị thông báo kết quả cuối cùng.

**Vấn đề 2: Ký tự tiếng Việt bị lỗi trong URL QR**
- **Nguyên nhân**: Tên sân tiếng Việt (ví dụ: "Sân Phú Thọ") khi ghép vào URL VietQR bị lỗi mã hóa.
- **Giải pháp**: Áp dụng `encodeURIComponent(addInfo)` cho cả `generateVietQRQuickLink` và `generateVietQRPayloadString`.
- **Phòng ngừa**: Mọi dữ liệu người dùng nhập vào URL phải qua `encodeURIComponent` trước khi ghép chuỗi.

---

## 6. Kế Hoạch Thực Hiện Cho TUẦN 4

Trong **Tuần 4**, dự án sẽ khởi động giai đoạn **Backend & Cơ sở dữ liệu**:

1. **Khởi tạo Server Node.js/Express**: Cấu hình middleware, CORS, error handler và routing chuẩn RESTful.
2. **Thiết kế CSDL MySQL với Prisma ORM**: Xây dựng schema các bảng: `User`, `San`, `KhungGio`, `DonDat`, quan hệ khóa ngoại và migration script.
3. **JWT Authentication**: Middleware xác thực Bearer Token, bảo vệ các route cần đăng nhập.
4. **Socket.io Server**: Xử lý sự kiện `slot_updated`, broadcast real-time đến tất cả client kết nối.
5. **Seed dữ liệu mẫu**: Script seed dữ liệu 5 sân, lịch sử đặt và tài khoản mẫu phục vụ kiểm thử.

---

*Tài liệu Báo Cáo Tiến Độ Tuần 3 — Đặt Sân, Thanh Toán VietQR & Hồ Sơ.*
