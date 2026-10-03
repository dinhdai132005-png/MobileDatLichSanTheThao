# HƯỚNG DẪN KIẾN TRÚC & PATTERN API DỰ ÁN
## ĐẶT LỊCH SÂN THỂ THAO ĐA CƠ SỞ

> **Tài liệu chuẩn hóa sau khi refactor toàn diện**  
> **Trạng thái:** Mã nguồn thực tế đã được chuẩn hóa theo pattern thống nhất 100%.

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG THỂ (3-LAYER ARCHITECTURE)

Hệ thống tuân thủ nghiêm ngặt mô hình 3 lớp phân tách trách nhiệm (Separation of Concerns):

```text
HTTP Request (Mobile App / Web Admin)
      ↓
[ Route ]           (routes/*.routes.ts)     — Chỉ định nghĩa Method, Path, Auth Middleware
      ↓
[ Controller ]      (controllers/*.controller.ts) — Validate input (Zod), gọi Service, format JSON
      ↓
[ Service ]         (services/*.service.ts)   — Logic nghiệp vụ thuần, Prisma Transaction, Socket.io
      ↓
[ Database ]        (MySQL qua Prisma ORM)    — Truy vấn dữ liệu thực tế
      ↓
[ JSON Response ]   (utils/response.ts)       — Format chuẩn hóa { success, message, data }
```

### Ưu điểm vượt trội khi bảo vệ đồ án:
1. **Dễ hiểu, dễ giải thích:** Khi thầy cô hỏi "Code xử lý transaction hoặc logic đặt sân nằm ở đâu?", bạn chỉ ngay vào `DonDatService.taoDonDat` mà không bị lẫn lộn giữa route và database.
2. **Type-safe 100%:** Toàn bộ dữ liệu từ DTO đến Prisma Model đều có TypeScript kiểm soát nghiêm ngặt.
3. **Dùng chung Backend:** Cả **Mobile App (React Native)** và **Web Admin** đều gọi chung một hệ thống REST API và nhận định dạng JSON đồng nhất.

---

## 2. QUY TẮC CHUẨN HÓA RESPONSE (RESPONSE STANDARD)

Tất cả các API trong toàn bộ hệ thống đều tuân thủ duy nhất 1 cấu trúc chuẩn được điều khiển bởi [backend/src/utils/response.ts](file:///d:/MonHoc/DatLichSanTheThao/backend/src/utils/response.ts):

### Khi thành công (`sendSuccess`):
```json
{
  "success": true,
  "message": "Thông điệp thành công cụ thể",
  "data": { ... } // hoặc mảng [ ... ]
}
```

### Khi thất bại (`sendError`):
```json
{
  "success": false,
  "message": "Mô tả nguyên nhân lỗi cụ thể",
  "data": null
}
```

Ngay cả Route 404 và Global Error Handler (500) tại [app.ts](file:///d:/MonHoc/DatLichSanTheThao/backend/src/app.ts) cũng tuân thủ cấu trúc này.

---

## 3. DANH SÁCH API ĐÃ CHUẨN HÓA

### 3.1. Xác thực người dùng (Auth) — Prefix: `/api/auth`
| Method | Endpoint | Quyền | Controller / Service | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `AuthController.register` | Đăng ký tài khoản (họ tên, email, SĐT, mật khẩu) |
| `POST` | `/api/auth/login` | Public | `AuthController.login` | Đăng nhập (email/SĐT + mật khẩu), trả về JWT token |
| `GET` | `/api/auth/me` | JWT | `AuthController.getMe` | Lấy thông tin người dùng đang đăng nhập |

### 3.2. Sân thể thao (San) — Prefix: `/api/san`
| Method | Endpoint | Quyền | Controller / Service | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/san/loai-san` | Public | `SanController.getLoaiSan` | Lấy danh mục môn thể thao / loại sân |
| `GET` | `/api/san` | Public | `SanController.getAll` | Lấy danh sách sân (lọc `monTheThao`, `sapXep`, `tuKhoa`) |
| `GET` | `/api/san/:id` | Public | `SanController.getById` | Chi tiết 1 sân kèm ảnh, bảng giá, đánh giá |
| `GET` | `/api/san/:id/slots` | Public | `SanController.getSlots` | Tính toán slot trống theo ngày (Peak/Off-peak pricing) |
| `POST` | `/api/san` | ADMIN | `SanController.create` | Tạo sân mới |
| `PUT` | `/api/san/:id` | ADMIN | `SanController.update` | Cập nhật thông tin sân |

### 3.3. Đơn đặt sân (DonDat) — Prefix: `/api/don-dat`
| Method | Endpoint | Quyền | Controller / Service | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/don-dat` | User | `DonDatController.create` | **Tạo đơn đặt** (Prisma Transaction chống double-booking, giữ chỗ 5p, phát Socket.io) |
| `GET` | `/api/don-dat` | STAFF, ADMIN | `DonDatController.getAll` | Lấy danh sách toàn bộ đơn đặt (phục vụ Web Admin duyệt đơn) |
| `GET` | `/api/don-dat/cua-toi` | User | `DonDatController.getCuaToi` | Lịch sử đặt sân của người dùng đang đăng nhập |
| `GET` | `/api/don-dat/:id` | Owner/Staff | `DonDatController.getById` | Xem chi tiết đơn đặt |
| `PATCH`| `/api/don-dat/:id/xac-nhan` | STAFF, ADMIN | `DonDatController.xacNhan` | Staff duyệt đơn, chuyển trạng thái `DA_XAC_NHAN` |
| `PATCH`| `/api/don-dat/:id/tu-choi` | STAFF, ADMIN | `DonDatController.tuChoi` | Staff từ chối đơn kèm lý do, trả slot về `TRONG` |
| `PATCH`| `/api/don-dat/:id/check-in` | STAFF, ADMIN | `DonDatController.checkIn` | Check-in khi khách tới sân (`DANG_CHOI`) |
| `PATCH`| `/api/don-dat/:id/huy` | User (Owner) | `DonDatController.huy` | Khách yêu cầu hủy đơn đặt của mình |

### 3.4. Đồ uống & Kho (DoUong) — Prefix: `/api/do-uong`
| Method | Endpoint | Quyền | Controller / Service | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/do-uong` | Public | `DoUongController.getAll` | Danh sách đồ uống đang kinh doanh |
| `POST` | `/api/do-uong` | ADMIN | `DoUongController.create` | Thêm mặt hàng đồ uống |
| `PUT` | `/api/do-uong/:id` | ADMIN | `DoUongController.update` | Cập nhật giá / thông tin đồ uống |
| `POST` | `/api/do-uong/:id/nhap-kho`| ADMIN | `DoUongController.nhapKho` | Nhập thêm số lượng tồn kho |

### 3.5. Đánh giá sân (DanhGia) — Prefix: `/api/danh-gia`
| Method | Endpoint | Quyền | Controller / Service | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/danh-gia` | CUSTOMER | `DanhGiaController.create` | Viết đánh giá sau khi hoàn thành đơn, tự cập nhật điểm sao trung bình của sân |
| `PATCH`| `/api/danh-gia/:id/phan-hoi`| ADMIN | `DanhGiaController.phanHoi`| Quản trị viên phản hồi đánh giá |
| `PATCH`| `/api/danh-gia/:id/an` | ADMIN | `DanhGiaController.an` | Ẩn đánh giá vi phạm quy chuẩn |

---

## 4. CẤU HÌNH MẠNG DÙNG CHUNG (CENTRALIZED NETWORK CONFIG)

Địa chỉ IP máy chủ và URL được quản lý tại một file duy nhất: [src/services/config.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/config.ts):

```typescript
export const DEFAULT_DEV_HOST = '10.254.189.192';
export const SERVER_PORT = 5000;
export const SERVER_HOST = Platform.OS === 'web' ? 'localhost' : DEFAULT_DEV_HOST;
export const SERVER_BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;
```

- Không còn tình trạng hardcode `localhost:5000` hoặc IP rải rác nhiều nơi.
- Cả [apiClient.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/apiClient.ts) và [socketService.ts](file:///d:/MonHoc/DatLichSanTheThao/src/services/socketService.ts) đều import biến cấu hình từ đây.

---

## 5. CÁCH MOBILE GỌI API (REACT NATIVE / EXPO)

Mobile gọi API theo quy trình ngắn gọn, chuẩn mực qua các tầng Service:

```text
Screen UI (TrangChuScreen, DatLichScreen...)
      ↓ gọi hàm nghiệp vụ
Service (sanService, donDatService, authService)
      ↓ thực hiện HTTP Request qua
ApiClient (Axios instance + JWT Bearer Interceptor)
      ↓ nhận ApiResponse<T>
Unwrap data & trả về dữ liệu chuẩn
      ↓
setState() cập nhật giao diện
```

### Ví dụ code thực tế tại màn hình Mobile:
```typescript
// Trong TrangChuScreen.tsx:
useEffect(() => {
  async function taiDuLieu() {
    setDangTai(true);
    try {
      const [dsMon, dsSan] = await Promise.all([
        sanService.getDanhSachMonTheThao(),
        sanService.getDanhSachSan(),
      ]);
      setDanhSachMon(dsMon);
      setDanhSachSan(dsSan);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể kết nối máy chủ');
    } finally {
      setDangTai(false);
    }
  }
  taiDuLieu();
}, []);
```

---

## 6. CÁCH WEB ADMIN GỌI API (VANILLA JS / FETCH)

Web Admin được phục vụ trực tiếp từ Backend tại địa chỉ:
👉 **`http://localhost:5000/admin`**

Web Admin sử dụng Fetch API chuẩn với token xác thực Admin/Staff:

```javascript
// Ví dụ duyệt đơn đặt sân trên Web Admin:
async function xacNhanDon(id) {
  const res = await fetch(`/api/don-dat/${id}/xac-nhan`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    }
  });
  const json = await res.json();
  if (json.success) {
    showToast('✅ Đã duyệt đơn đặt sân thành công!');
    loadDonDat(); // Tải lại danh sách
  }
}
```

Đồng thời kết nối Socket.io client để nhận thông báo real-time khi có đơn mới:
```javascript
const socket = io();
socket.on('new_booking', (data) => {
  showToast(`🔔 Có đơn đặt mới từ khách: ${data.tenKhach}`);
  loadDonDat();
});
```
