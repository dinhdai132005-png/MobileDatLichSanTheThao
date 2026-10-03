# PROJECT GUIDE — TÀI LIỆU GIẢI THÍCH TOÀN BỘ DỰ ÁN
## Hệ Thống Đặt Lịch Sân Thể Thao
> **Dành cho:** Đinh Ngọc Đại — để hiểu project và trả lời câu hỏi giáo viên
> **Nguyên tắc:** Viết dựa trên code THỰC TẾ, không tự bịa, không quảng cáo

---

## MỤC LỤC

1. [Tổng quan project là gì](#1-tổng-quan)
2. [Kiến trúc — các phần của project](#2-kiến-trúc)
3. [Công nghệ sử dụng](#3-công-nghệ)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Database — bảng dữ liệu](#5-database)
6. [Luồng dữ liệu — từ màn hình đến database](#6-luồng-dữ-liệu)
7. [Từng màn hình Mobile](#7-màn-hình-mobile)
8. [Từng file Service trên Mobile](#8-services-mobile)
9. [Từng API trên Backend](#9-backend-api)
10. [Luồng nghiệp vụ đặt sân](#10-nghiệp-vụ-đặt-sân)
11. [Chống đặt trùng — Double Booking](#11-chống-double-booking)
12. [Thanh toán VietQR](#12-thanh-toán-vietqr)
13. [Real-time — Socket.io](#13-real-time-socketio)
14. [Đã làm — Đang làm — Chưa làm](#14-tiến-độ)
15. [Câu hỏi giáo viên hay hỏi](#15-câu-hỏi-thường-gặp)

---

## 1. Tổng Quan

### Project này là gì?

Đây là **ứng dụng di động** cho phép khách hàng đặt sân thể thao qua điện thoại. Khách hàng chọn sân, chọn ngày, chọn giờ, xác nhận và thanh toán.

**Mô hình nghiệp vụ (business model):** Một công ty (hoặc chuỗi) sở hữu nhiều sân thể thao. Khách hàng dùng app Mobile để đặt. Nhân viên dùng hệ thống để xác nhận, check-in.

**Điểm khác biệt so với marketplace:** Đây KHÔNG phải sàn giao dịch kết nối nhiều chủ sân. Đây là hệ thống của **1 công ty** quản lý sân của chính họ.

### Project gồm mấy phần?

Hiện tại project có **2 phần đã xây dựng**:

```
📱 Mobile App (React Native + Expo)  — Khách hàng dùng trên điện thoại
🖥️ Backend Server (Node.js + Express) — Máy chủ xử lý API + database
```

Và **1 phần chưa làm**:
```
🌐 Web Admin (ReactJS) — Nhân viên/Admin dùng trên máy tính
                         ⚠️ CHƯA CÓ trong project hiện tại
```

---

## 2. Kiến Trúc

### Kiến trúc thực tế của project hiện tại:

```
┌─────────────────────────────────────┐
│         📱 MOBILE APP               │
│      React Native + Expo            │
│   (Khách hàng dùng trên điện thoại) │
└──────────────┬──────────────────────┘
               │  Gọi REST API (HTTP)
               │  http://10.254.189.192:5000/api
               ▼
┌─────────────────────────────────────┐
│         🖥️ BACKEND SERVER           │
│       Node.js + Express             │
│    (Máy chủ xử lý mọi yêu cầu)     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Middleware JWT Auth        │    │
│  │  Kiểm tra token trước khi  │    │
│  │  vào xử lý nghiệp vụ       │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │  Routes (API Endpoints)     │    │
│  │  /api/auth  /api/san        │    │
│  │  /api/don-dat /api/do-uong  │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │     Prisma ORM              │    │
│  │  (Kết nối code với MySQL)   │    │
│  └──────────────┬──────────────┘    │
└─────────────────┼───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│           🗄️ MySQL Database         │
│    (Lưu toàn bộ dữ liệu lâu dài)   │
│    localhost:3306                   │
│    dat_lich_san_the_thao            │
└─────────────────────────────────────┘
```

Ngoài REST API, còn có kết nối **Socket.io** để cập nhật khung giờ real-time:

```
Mobile App ←── Socket.io ──→ Backend Server
(Nhận slot_updated event ngay khi có người đặt xong)
```

### So sánh với kiến trúc mục tiêu:

| Thành phần | Mục tiêu | Thực tế | Nhận xét |
|-----------|----------|---------|----------|
| Mobile App | React Native + Expo | ✅ Đúng | Đã xây dựng đầy đủ |
| Backend API | Node.js + Express | ✅ Đúng | Đã xây dựng đầy đủ |
| Database | MySQL + Prisma | ✅ Đúng | Schema 13 bảng |
| Web Admin | ReactJS | ❌ Chưa có | Chưa triển khai |
| Staff/Manager | Web Admin | ❌ Chưa có | Backend đã chuẩn bị sẵn route |

---

## 3. Công Nghệ

### 3.1 React Native — Giao diện Mobile

**Là gì?**
React Native là công cụ xây dựng ứng dụng điện thoại bằng ngôn ngữ JavaScript/TypeScript. Thay vì viết 2 lần (một cho Android, một cho iOS), bạn chỉ viết một lần, React Native sẽ tự chuyển thành app chạy được trên cả hai.

**Trong project này dùng để làm gì?**
Xây dựng tất cả màn hình mà khách hàng nhìn thấy: Trang chủ, Danh sách sân, Chi tiết sân, Đặt lịch, Hồ sơ.

**File liên quan:** `src/screens/*.tsx`

---

### 3.2 Expo — Nền tảng phát triển Mobile

**Là gì?**
Expo là bộ công cụ đặt trên React Native giúp quá trình phát triển dễ hơn. Ví dụ: bạn scan QR code bằng điện thoại thật để xem app ngay mà không cần cài Android Studio.

**Trong project này dùng để làm gì?**
- Chạy app: `npx expo start`
- Cung cấp các thư viện sẵn có như `expo-linear-gradient`, `expo-font`
- Thư viện icon: `@expo/vector-icons`

**File liên quan:** `app.json`, `package.json`

---

### 3.3 TypeScript — Ngôn ngữ lập trình

**Là gì?**
TypeScript là phiên bản nâng cấp của JavaScript, cho phép khai báo kiểu dữ liệu rõ ràng.

**Ví dụ dễ hiểu:**
```typescript
// JavaScript thường — không biết giaTien là số hay chữ
const san = { giaTien: 80000 }

// TypeScript — khai báo rõ: giaTien PHẢI là số nguyên
interface San {
  giaTien: number;   // số
  tenSan: string;    // chữ
  conSan: boolean;   // đúng/sai
}
```

**Trong project này:**
- Toàn bộ Mobile (`src/**/*.tsx`) viết bằng TypeScript
- Toàn bộ Backend (`backend/src/**/*.ts`) viết bằng TypeScript
- File định nghĩa kiểu: `src/types/index.ts`

---

### 3.4 Node.js — Môi trường chạy Backend

**Là gì?**
Node.js cho phép chạy JavaScript ở phía server (máy chủ). Bình thường JavaScript chỉ chạy trong trình duyệt, Node.js đưa nó ra ngoài để làm server.

**Trong project này:**
Chạy Backend Server tại `localhost:5000`.

---

### 3.5 Express — Framework API

**Là gì?**
Express chạy trên Node.js, giúp tạo các địa chỉ API (gọi là endpoint) mà Mobile sẽ gọi đến.

**Ví dụ thực tế:**
```
Mobile gọi: GET http://localhost:5000/api/san
Express nhận → Xử lý → Trả về danh sách sân dạng JSON
```

**File liên quan:** `backend/src/app.ts`, `backend/src/routes/*.ts`

---

### 3.6 REST API — Cách giao tiếp

**Là gì?**
REST API là quy ước giao tiếp giữa Mobile và Backend thông qua HTTP. Mỗi yêu cầu dùng một "động từ":

```
GET    — Lấy dữ liệu    (xem sân, xem lịch sử)
POST   — Tạo mới        (đặt sân, đăng ký)
PATCH  — Cập nhật một phần (hủy đơn, xác nhận)
PUT    — Cập nhật toàn bộ (sửa thông tin sân)
DELETE — Xóa
```

**Ví dụ trong project:**
```
POST   /api/auth/login       → Đăng nhập, nhận JWT Token
GET    /api/san               → Lấy danh sách sân
GET    /api/san/:id/slots     → Lấy khung giờ trống của sân
POST   /api/don-dat           → Tạo đơn đặt sân
PATCH  /api/don-dat/:id/huy  → Hủy đơn
```

---

### 3.7 Prisma ORM — Làm việc với Database

**Là gì?**
Prisma là công cụ trung gian giúp backend code TypeScript nói chuyện với MySQL mà không cần viết câu lệnh SQL thủ công.

**Không có Prisma — phải viết SQL thủ công:**
```sql
SELECT * FROM don_dat WHERE san_id = 'abc' AND ngay_dat = '2026-09-30'
  AND trang_thai IN ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI');
```

**Có Prisma — viết bằng TypeScript:**
```typescript
await prisma.donDat.findMany({
  where: {
    sanId: 'abc',
    ngayDat: new Date('2026-09-30'),
    trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI'] }
  }
});
```

**File liên quan:** `backend/prisma/schema.prisma`

---

### 3.8 MySQL — Cơ sở dữ liệu

**Là gì?**
MySQL là nơi lưu tất cả dữ liệu lâu dài: danh sách sân, tài khoản người dùng, lịch sử đặt chỗ, đồ uống,...

**Trong project:**
- Tên database: `dat_lich_san_the_thao`
- Chạy qua XAMPP tại `localhost:3306`
- Có 13 bảng (table)

---

### 3.9 JWT — Xác thực người dùng

**Là gì?**
JWT (JSON Web Token) là một chuỗi mã hóa, đóng vai trò như "thẻ thành viên". Sau khi đăng nhập thành công, server cấp một chuỗi JWT. Mỗi lần gọi API kế tiếp, Mobile đính kèm chuỗi này để server biết "đây là ai".

**Ví dụ thực tế:**
```
1. Mobile gọi POST /api/auth/login  (gửi email + mật khẩu)
2. Backend kiểm tra → tạo JWT Token
3. Mobile nhận Token, lưu vào bộ nhớ
4. Mỗi lần đặt sân: gửi kèm "Authorization: Bearer eyJhbGci..."
5. Backend giải mã JWT → biết userId và vaiTro (CUSTOMER/STAFF/ADMIN)
```

**File liên quan:** `backend/src/middleware/auth.middleware.ts`

---

### 3.10 Socket.io — Cập nhật Real-time

**Là gì?**
Bình thường HTTP chỉ giao tiếp theo kiểu "hỏi - trả lời". Socket.io cho phép server **tự chủ động gửi thông báo** đến Mobile mà không cần Mobile hỏi.

**Dùng để làm gì trong project?**
Khi khách A vừa đặt xong khung giờ 18:00, backend phát sự kiện `slot_updated` → Tất cả điện thoại đang xem màn hình sân đó sẽ thấy ô 18:00 chuyển từ trống → đã đặt ngay lập tức.

**File liên quan:** `backend/src/socket.ts`, `src/services/socketService.ts`

---

### 3.11 VietQR — Thanh toán QR Code

**Là gì?**
VietQR là chuẩn mã QR của Napas (tổ chức thanh toán Việt Nam), tương thích với hầu hết ứng dụng ngân hàng Việt Nam.

**Trong project:**
- Sinh mã QR bằng thư viện `react-native-qrcode-svg`
- URL theo chuẩn: `https://qr.vietqr.io/{BIN}/{STK}?amount=...&note=...`
- Hỗ trợ 7 ngân hàng: MBBank, Vietcombank, VietinBank, Techcombank, ACB, BIDV, VPBank

**File liên quan:** `src/services/vietqr.ts`, `src/components/VietQRCodeModal.tsx`

---

### 3.12 Axios — Gửi HTTP Request từ Mobile

**Là gì?**
Axios là thư viện giúp Mobile gửi các yêu cầu HTTP đến Backend một cách dễ dàng, tự động chuyển JSON, xử lý lỗi.

**Trong project có thêm tính năng Graceful Fallback:**
```typescript
// Nếu Backend chưa bật hoặc mạng lỗi → tự động dùng dữ liệu mẫu (mockData)
// App KHÔNG bao giờ crash trắng màn hình
executeWithFallback(
  () => apiClient.get('/san'),    // Thử gọi API thật
  () => DANH_SACH_SAN            // Nếu thất bại → dùng data giả
)
```

**File liên quan:** `src/services/apiClient.ts`

---

## 4. Cấu Trúc Thư Mục

### Toàn bộ project:
```
DatLichSanTheThao/          ← Thư mục gốc
│
├── App.tsx                  ← Điểm khởi động toàn bộ Mobile App
├── index.js                 ← Đăng ký App với Expo
├── app.json                 ← Cấu hình Expo (tên app, icon,...)
├── package.json             ← Thư viện Mobile
├── tsconfig.json            ← Cấu hình TypeScript Mobile
│
├── src/                     ← Toàn bộ code Mobile
│   ├── navigation/          ← Cấu hình điều hướng màn hình
│   ├── screens/             ← Các màn hình giao diện
│   ├── components/          ← Các component dùng chung
│   ├── services/            ← Giao tiếp với Backend API
│   ├── types/               ← Định nghĩa kiểu dữ liệu TypeScript
│   └── data/                ← Dữ liệu mẫu fallback (mockData)
│
├── backend/                 ← Toàn bộ code Backend Server
│   ├── src/
│   │   ├── server.ts        ← Điểm khởi động Backend
│   │   ├── app.ts           ← Cấu hình Express + Routes
│   │   ├── socket.ts        ← Socket.io Server
│   │   ├── middleware/      ← JWT Auth Middleware
│   │   ├── routes/          ← Các API Endpoints
│   │   ├── lib/             ← Prisma client
│   │   └── utils/           ← Tính giá cao điểm/thấp điểm
│   ├── prisma/
│   │   ├── schema.prisma    ← Thiết kế database (13 bảng)
│   │   └── seed.ts          ← Script tạo dữ liệu mẫu ban đầu
│   ├── .env                 ← Biến môi trường (DATABASE_URL, JWT_SECRET)
│   └── package.json         ← Thư viện Backend
│
├── BAO_CAO_TUAN_*.md        ← Báo cáo tiến độ từng tuần
└── PROJECT_GUIDE.md         ← File này
```

### Chi tiết thư mục `src/`:

```
src/
│
├── navigation/
│   └── AppDieuHuong.tsx     ← Cấu hình điều hướng Bottom Tab + Stack
│                               Khai báo: Tab(Trang Chủ, Danh Sách Sân, Hồ Sơ)
│                               Stack: Trang Chủ → Chi Tiết → Đặt Lịch
│
├── screens/                 ← 5 màn hình giao diện
│   ├── TrangChuScreen.tsx   ← Màn hình chủ: môn thể thao + sân nổi bật
│   ├── DanhSachSanScreen.tsx← Danh sách sân + filter + tìm kiếm
│   ├── ChiTietSanScreen.tsx ← Chi tiết sân + chọn ngày + chọn giờ
│   ├── DatLichScreen.tsx    ← Form đặt sân + chọn thanh toán + gửi đơn
│   └── HoSoScreen.tsx       ← Hồ sơ cá nhân + lịch sử đặt sân
│
├── components/              ← 1 component dùng lại
│   └── VietQRCodeModal.tsx  ← Modal hiện mã QR chuyển khoản
│
├── services/                ← 6 file kết nối Backend
│   ├── apiClient.ts         ← Cấu hình Axios + executeWithFallback
│   ├── sanService.ts        ← Gọi API sân thể thao
│   ├── donDatService.ts     ← Gọi API đặt sân / hủy đơn
│   ├── authService.ts       ← Gọi API đăng nhập / lấy profile
│   ├── socketService.ts     ← Kết nối Socket.io real-time
│   └── vietqr.ts            ← Sinh URL mã QR VietQR
│
├── types/
│   └── index.ts             ← Tất cả Interface TypeScript của project
│
└── data/
    └── mockData.js          ← Dữ liệu mẫu sân, đơn đặt (dùng khi Backend offline)
```

### Chi tiết thư mục `backend/src/routes/`:

```
routes/
├── auth.routes.ts           ← POST /login, POST /register, GET /me
├── san.routes.ts            ← GET /san, GET /san/:id, GET /san/:id/slots
├── donDat.routes.ts         ← POST /don-dat, GET /don-dat/cua-toi, PATCH hủy/xác nhận
├── doUong.routes.ts         ← GET /do-uong (danh sách đồ uống bán tại sân)
└── danhGia.routes.ts        ← POST /danh-gia (viết review sau khi chơi)
```

---

## 5. Database

### 13 Bảng trong database:

```
nguoi_dung          ← Tài khoản (CUSTOMER / STAFF / ADMIN)
loai_san            ← Loại môn thể thao (Cầu Lông, Bóng Đá,...)
san                 ← Thông tin sân (tên, địa chỉ, giá, giờ mở cửa)
anh_san             ← Ảnh của sân
khung_gio_cau_hinh  ← Cấu hình giờ cao điểm / thấp điểm
don_dat             ← ⭐ Đơn đặt sân (bảng quan trọng nhất)
chi_tiet_fnb        ← Đồ uống trong đơn đặt
chi_tiet_dung_cu    ← Dụng cụ cho thuê trong đơn đặt
do_uong             ← Danh mục đồ uống bán tại sân
dung_cu             ← Danh mục dụng cụ cho thuê
danh_gia            ← Đánh giá / review của khách
voucher             ← Mã giảm giá
voucher_don_dat     ← Liên kết voucher và đơn đặt
khuyen_mai_san      ← Chương trình khuyến mãi flash sale theo sân
```

### Bảng `don_dat` — Trái tim của hệ thống:

```
id                    — Mã định danh nội bộ
maDon                 — Mã hiển thị cho khách (dạng QR code)
sanId                 — Đặt sân nào
nguoiDungId           — Tài khoản nào đặt (null nếu đặt tại quầy không cần TK)
tenKhach              — Tên người đặt (lưu riêng, không phụ thuộc bảng user)
soDienThoaiKhach      — SĐT người đặt
ngayDat               — Ngày chơi (VD: 2026-09-30)
gioKhoa               — Giờ bắt đầu (VD: "09:00")
soGioThue             — Số giờ thuê (1.0, 1.5, 2.0, 3.0)
gioKetThuc            — Giờ kết thúc (tự tính: gioKhoa + soGioThue)
tongTienSan           — Tiền sân
giamGia               — Tiền giảm (nếu dùng voucher)
tongCong              — Tổng phải trả
trangThai             — CHO_XAC_NHAN → DA_XAC_NHAN → DANG_CHOI → HOAN_THANH
trangThaiThanhToan    — CHUA_THANH_TOAN → DA_THANH_TOAN
phuongThucThanhToan   — TIEN_MAT / MOMO / CHUYEN_KHOAN / VN_PAY / ZALO_PAY / PAY_OS
thoiGianGiuCho        — Deadline 5 phút (giữ slot tạm, chờ thanh toán)
```

### Trạng thái vòng đời một đơn đặt:

```
         [Khách đặt]
              │
              ▼
      CHO_XAC_NHAN     ← Đơn mới, chờ nhân viên duyệt
              │
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
DA_XAC_NHAN         DA_HUY / TU_CHOI
     │
     ▼
DANG_CHOI            ← Khách check-in, đang chơi
     │
     ▼
HOAN_THANH           ← Buổi chơi kết thúc (có thể viết review)
```

### Giá theo giờ cao điểm / thấp điểm:

Bảng `khung_gio_cau_hinh` định nghĩa khung giờ cao điểm:

```
VD: Sân Cầu Lông Phú Thọ
- Thứ 2–6, 17:00–21:00: giá cao điểm = 120.000đ/h
- Các giờ còn lại:       giá thấp điểm = 80.000đ/h
- Thứ 7, CN, tất cả giờ: giá cao điểm  = 120.000đ/h
```

---

## 6. Luồng Dữ Liệu

### Luồng đầy đủ khi mở Trang Chủ:

```
1. Người dùng mở app trên điện thoại
          ↓
2. App.tsx khởi động → render AppDieuHuong
          ↓
3. Bottom Tab hiện → mặc định vào TrangChuScreen
          ↓
4. TrangChuScreen.tsx: useEffect chạy → gọi loadData()
          ↓
5. sanService.getDanhSachMonTheThao() và sanService.getDanhSachSan()
   chạy song song bằng Promise.all([...])
          ↓
6. apiClient (Axios) gửi HTTP GET đến:
   → http://10.254.189.192:5000/api/san/loai-san
   → http://10.254.189.192:5000/api/san
          ↓
7. Backend (Express) nhận request
   → san.routes.ts xử lý
   → Prisma truy vấn MySQL
          ↓
8. MySQL trả về danh sách sân và loại sân
          ↓
9. Prisma chuyển thành TypeScript object
          ↓
10. Backend trả JSON về cho Mobile
          ↓
11. sanService.mapBackendSanToMobile() chuyển đổi định dạng
          ↓
12. setMonTheThaoList(mons) → setLoading(false)
          ↓
13. React re-render → UI hiện danh sách môn thể thao và sân
```

> **Nếu Backend offline:** Bước 6 thất bại → `executeWithFallback` tự động dùng `DANH_SACH_SAN` từ `mockData.js` → App vẫn hiện dữ liệu bình thường, không crash.

### Tại sao Mobile không truy cập Database trực tiếp?

```
❌ Sai — Mobile truy cập DB trực tiếp:
Mobile → MySQL
(Nguy hiểm: lộ thông tin kết nối DB, không kiểm soát được quyền)

✅ Đúng — Mobile → Backend → MySQL:
Mobile → (HTTP request) → Backend → (Prisma) → MySQL
```

**Backend đứng giữa để:**
1. **Kiểm tra quyền:** Khách không xem được đơn của người khác (403 Forbidden)
2. **Kiểm tra dữ liệu:** Số điện thoại sai format → báo lỗi ngay
3. **Xử lý nghiệp vụ:** Tính tổng tiền, kiểm tra trùng slot, áp voucher
4. **Bảo mật:** JWT Token xác nhận đúng người, đúng quyền
5. **Đồng bộ real-time:** Emit Socket.io sau khi đặt thành công

---

## 7. Màn Hình Mobile

### Màn hình 1: TrangChuScreen.tsx — Trang Chủ

**Vị trí:** `src/screens/TrangChuScreen.tsx`
**Tab:** Trang Chủ (icon nhà)

**Làm gì:**
- Hiện danh sách môn thể thao (Cầu Lông, Bóng Đá, Tennis,... dạng scroll ngang)
- Hiện tối đa 4 sân còn trống hôm nay
- Nút "Tìm sân" → navigate sang tab Danh Sách Sân

**Luồng dữ liệu:**
```
useEffect → Promise.all([
  sanService.getDanhSachMonTheThao(),   → GET /api/san/loai-san
  sanService.getDanhSachSan()           → GET /api/san
])
→ render danh sách
```

**Gọi sang màn hình nào:**
- Nhấn sân → `ChiTietSanScreen`
- Nhấn "Xem tất cả" → `DanhSachSanScreen`

---

### Màn hình 2: DanhSachSanScreen.tsx — Danh Sách Sân

**Vị trí:** `src/screens/DanhSachSanScreen.tsx`
**Tab:** Sân Thể Thao (icon vị trí)

**Làm gì:**
- Danh sách đầy đủ tất cả sân
- Filter theo môn thể thao (Cầu Lông / Bóng Đá / Tennis...)
- Sắp xếp theo giá / điểm đánh giá
- Tìm kiếm theo tên sân

**Luồng dữ liệu:**
```
useEffect → sanService.getDanhSachSan({ monTheThao, sapXep, tuKhoa })
→ GET /api/san?monTheThao=Cầu+Lông&sapXep=giaTien
→ render FlatList
```

**Gọi sang màn hình nào:**
- Nhấn sân → `ChiTietSanScreen`

---

### Màn hình 3: ChiTietSanScreen.tsx — Chi Tiết Sân + Chọn Giờ

**Vị trí:** `src/screens/ChiTietSanScreen.tsx`
**Nhận tham số:** `san` (object thông tin sân)

**Làm gì:**
- Hiện đầy đủ thông tin sân (tiện ích, giờ mở cửa, giá giờ cao/thấp điểm)
- Chọn ngày trong tuần (7 ngày kể từ hôm nay)
- Hiện ma trận khung giờ: xanh = trống, đỏ = đã đặt/đã qua
- Tải khung giờ thực tế từ Backend theo ngày được chọn
- Lắng nghe Socket.io: khi có người đặt → slot đổi màu ngay

**Chọn giờ → chuyển sang DatLichScreen:**
```typescript
navigation.navigate('DatLich', {
  san: sanData,
  ngay: ngayChon,  // VD: "2026-10-01"
  gio: gioChon,    // VD: "09:00"
})
```

**Hai nguồn dữ liệu khung giờ:**
1. API thực: `GET /api/san/:id/slots?ngay=2026-10-01`
2. Fallback: mock data 12 khung giờ cố định nếu API lỗi

---

### Màn hình 4: DatLichScreen.tsx — Đặt Lịch + Thanh Toán

**Vị trí:** `src/screens/DatLichScreen.tsx`
**Nhận tham số:** `san`, `ngay`, `gio`

**Làm gì:**
1. Hiện thông tin sân + ngày + giờ đã chọn
2. Nhập Họ tên + Số điện thoại (bắt buộc) + Ghi chú (tùy chọn)
3. Chọn số giờ thuê (1h / 1.5h / 2h / 3h) → tự tính tổng tiền
4. Chọn phương thức thanh toán (Tiền mặt / Chuyển khoản / MoMo)
5. Nếu chọn Chuyển khoản/MoMo → mở VietQRCodeModal
6. Gửi đơn + phát Socket.io khóa slot

**Luồng gửi đơn (tiền mặt):**
```
handleBookingSubmit()
  → validate form (tên, SĐT không được trống)
  → executeCreateBooking()
      → donDatService.taoDonDatSan({ sanId, tenKhach, ... })
         → POST /api/don-dat
      → socketService.emitSlotUpdate(sanId, gio, false)  ← khóa slot real-time
      → Alert "Đặt sân thành công!"
      → navigate về Trang Chủ
```

**Luồng gửi đơn (chuyển khoản):**
```
handleBookingSubmit()
  → chọn chuyenKhoan/momo
  → setShowVietQRModal(true)    ← mở modal QR
  → [Khách quét mã, chuyển tiền]
  → nhấn "Tôi đã chuyển khoản"
  → executeCreateBooking()      ← gửi đơn
  → setShowVietQRModal(false)
```

---

### Màn hình 5: HoSoScreen.tsx — Hồ Sơ Cá Nhân

**Vị trí:** `src/screens/HoSoScreen.tsx`
**Tab:** Hồ Sơ (icon người)

**Làm gì:**
- Header: Avatar (chữ cái đầu tên), Email, Badge "Thành Viên Vàng"
- Tab 0 — Thông tin: Họ tên, Email, SĐT, Ngày tham gia, Môn yêu thích, Tổng lượt đặt
- Tab 1 — Lịch sử: Danh sách đơn đặt với badge màu trạng thái

**Tải dữ liệu song song:**
```typescript
Promise.all([
  authService.getThongTinNguoiDung(),     → GET /api/auth/me
  donDatService.getLichSuDatSan()         → GET /api/don-dat/cua-toi
])
```

**Badge trạng thái:**
- Xanh lá (#DCFCE7): Hoàn thành
- Vàng cam (#FEF3C7): Sắp tới
- Đỏ nhạt (#FEE2E2): Đã hủy

---

## 8. Services Mobile

### apiClient.ts — Trung Tâm Điều Phối HTTP

**Vị trí:** `src/services/apiClient.ts`
**Vai trò:** Cấu hình Axios, gắn JWT tự động, cơ chế Fallback

**Điểm quan trọng — IP kết nối Backend:**
```typescript
export const LOCAL_SERVER_HOST = '10.254.189.192'; // IP máy tính trong LAN
// Android Emulator: thường dùng 10.0.2.2
// Thiết bị thật qua Wi-Fi: IP của máy trong mạng nội bộ
```

**Cơ chế Graceful Fallback:**
```typescript
// Tất cả service đều dùng hàm này:
executeWithFallback(
  apiCall,       // Thử gọi API thật trước
  mockFallback   // Nếu lỗi → trả về dữ liệu mẫu
)
// → App không bao giờ crash trắng màn hình
```

---

### sanService.ts — Giao Tiếp API Sân

**Vị trí:** `src/services/sanService.ts`

| Hàm | API gọi | Fallback |
|-----|---------|----------|
| `getDanhSachSan()` | `GET /api/san` | `DANH_SACH_SAN` mock |
| `getDanhSachMonTheThao()` | `GET /api/san/loai-san` | `DANH_SACH_MON_THE_THAO` mock |
| `getChiTietSan(id)` | `GET /api/san/:id` | Tìm trong mock |
| `getSlotsTheoNgay(id, ngay)` | `GET /api/san/:id/slots?ngay=...` | 6 slot mẫu |

**Hàm chuyển đổi `mapBackendSanToMobile(raw)`:**
Backend trả về schema MySQL, Mobile cần schema khác → hàm này chuyển đổi:
```
raw.giaTienThapDiem (MySQL)  →  san.giaTien (Mobile)
raw.loaiSan.ten (MySQL)      →  san.monTheThao (Mobile)
raw.diemDanhGia (MySQL)      →  san.danhGia (Mobile)
```

---

### donDatService.ts — Giao Tiếp API Đặt Sân

**Vị trí:** `src/services/donDatService.ts`

| Hàm | API gọi | Fallback |
|-----|---------|----------|
| `getLichSuDatSan()` | `GET /api/don-dat/cua-toi` | `LICH_SU_DAT_SAN` mock |
| `taoDonDatSan(data)` | `POST /api/don-dat` | Tự sinh mã, thêm vào mock |
| `huyDonDat(id, lyDo)` | `PATCH /api/don-dat/:id/huy` | Đổi trạng thái trong mock |

**Hàm `mapBackendDonDatToMobile(raw)`:**
Chuyển đổi trạng thái từ MySQL → Mobile:
```
MySQL: 'DA_HUY' / 'TU_CHOI'  →  Mobile: 'daHuy'
MySQL: 'HOAN_THANH'           →  Mobile: 'hoanThanh'
MySQL: còn lại                →  Mobile: 'sapToi'
```

---

### authService.ts — Đăng Nhập / Tài Khoản

**Vị trí:** `src/services/authService.ts`

| Hàm | API gọi |
|-----|---------|
| `dangNhap(taiKhoan, matKhau)` | `POST /api/auth/login` |
| `getThongTinNguoiDung()` | `GET /api/auth/me` |

Sau khi đăng nhập thành công → gọi `setAuthToken(token)` → Axios tự động gắn vào mọi request tiếp theo.

---

### socketService.ts — Real-time

**Vị trí:** `src/services/socketService.ts`

```typescript
// Kết nối đến Socket.io Server
connectSocket()        → connect to ws://10.254.189.192:5000

// Tham gia room của sân (chỉ nhận event của sân đang xem)
joinSanRoom(sanId)     → emit 'join_san'

// Lắng nghe slot_updated từ server
onSlotUpdate(callback) → on('slot_updated', callback)
// Khi event đến → callback cập nhật state → UI đổi màu slot ngay

// Phát event khi vừa đặt xong
emitSlotUpdate(sanId, gio, conTrong) → emit local + trigger server
```

**Tính năng demo một thiết bị:**
```typescript
simulateIncomingSlotUpdate()  // Giả lập event real-time trên 1 máy
// Dùng khi demo trước giáo viên mà không có thiết bị thứ 2
```

---

### vietqr.ts — Sinh Mã QR Thanh Toán

**Vị trí:** `src/services/vietqr.ts`

```typescript
// Sinh URL QR vector (dùng cho react-native-qrcode-svg)
generateVietQRPayloadString({ bankId: 'mbbank', accountNo: '1234...', amount: 120000, addInfo: 'Dat san cau long' })
// Kết quả: https://qr.vietqr.io/970422/1234...?amount=120000&note=Dat%20san%20cau%20long

// Sinh URL ảnh QR (dùng làm fallback nếu SVG lỗi)
generateVietQRQuickLink({...})
// Kết quả: https://img.vietqr.io/image/mbbank-1234...-compact2.png?amount=...
```

---

## 9. Backend API

### Tất cả API Endpoints:

**Auth — Xác thực:**
```
POST   /api/auth/register     Đăng ký tài khoản mới
POST   /api/auth/login        Đăng nhập, nhận JWT Token
GET    /api/auth/me           Lấy thông tin bản thân (cần JWT)
```

**Sân thể thao:**
```
GET    /api/san               Danh sách sân (filter: monTheThao, sapXep, tuKhoa)
GET    /api/san/loai-san      Danh sách môn thể thao
GET    /api/san/:id           Chi tiết 1 sân
GET    /api/san/:id/slots?ngay=YYYY-MM-DD  Khung giờ trống theo ngày
POST   /api/san               Thêm sân mới (chỉ ADMIN)
PUT    /api/san/:id           Sửa thông tin sân (chỉ ADMIN)
```

**Đặt sân:**
```
POST   /api/don-dat                  Tạo đơn mới (cần JWT - CUSTOMER)
GET    /api/don-dat/cua-toi          Lịch sử của tôi (cần JWT)
GET    /api/don-dat/:id              Chi tiết đơn (cần JWT)
PATCH  /api/don-dat/:id/xac-nhan    Duyệt đơn (STAFF/ADMIN)
PATCH  /api/don-dat/:id/tu-choi     Từ chối đơn (STAFF/ADMIN)
PATCH  /api/don-dat/:id/check-in    Check-in khách (STAFF/ADMIN)
PATCH  /api/don-dat/:id/huy         Hủy đơn (CUSTOMER - đơn của mình)
```

**Đồ uống:**
```
GET    /api/do-uong              Danh sách đồ uống đang bán
POST   /api/do-uong              Thêm sản phẩm (ADMIN)
PUT    /api/do-uong/:id          Cập nhật sản phẩm (ADMIN)
POST   /api/do-uong/:id/nhap-kho Nhập kho (ADMIN)
```

**Đánh giá:**
```
POST   /api/danh-gia             Viết review (CUSTOMER, đơn đã HOAN_THANH)
PATCH  /api/danh-gia/:id/phan-hoi  Phản hồi review (ADMIN)
PATCH  /api/danh-gia/:id/an      Ẩn review vi phạm (ADMIN)
```

---

### Tài khoản mẫu (seed data):

| Vai trò | Email | Mật khẩu |
|---------|-------|---------|
| CUSTOMER | khachhang@gmail.com | Abc@123456 |
| STAFF | nhanvien@gmail.com | Abc@123456 |
| ADMIN | admin@gmail.com | Abc@123456 |

---

## 10. Nghiệp Vụ Đặt Sân

### Luồng đặt sân đầy đủ:

```
1. Khách mở app
      ↓
2. Trang Chủ: xem sân nổi bật
      ↓
3. Nhấn vào sân → Màn hình Chi Tiết Sân
      ↓
4. Chọn ngày (7 ngày tới)
      ↓
5. Hệ thống tải khung giờ từ Backend:
   GET /api/san/:id/slots?ngay=2026-10-01
   Backend tính toán:
   - Khung giờ nào còn trống?
   - Khung giờ nào đã bị đặt?
   - Khung giờ nào đã qua (nếu hôm nay)?
   - Giá tiền mỗi khung giờ?
      ↓
6. Khách chọn giờ (slot màu xanh)
      ↓
7. Navigate → Màn hình Đặt Lịch (truyền: san, ngay, gio)
      ↓
8. Nhập họ tên, SĐT, ghi chú
      ↓
9. Chọn số giờ thuê → tổng tiền tự tính
      ↓
10. Chọn phương thức thanh toán
      ↓
11a. Tiền mặt → gửi đơn ngay
      ↓
11b. Chuyển khoản/MoMo → hiện QR → khách quét → xác nhận → gửi đơn
      ↓
12. Backend:
    a. Kiểm tra slot còn trống (trong transaction)
    b. Tính tổng tiền (có thể tính peak/off-peak)
    c. Áp voucher nếu có
    d. Tạo đơn, đặt thoiGianGiuCho = 5 phút
    e. Emit Socket.io slot_updated → tất cả thiết bị thấy slot bị đặt
      ↓
13. Backend trả 201 Created
      ↓
14. Mobile hiện Alert "Đặt sân thành công!"
      ↓
15. Về Trang Chủ
```

---

## 11. Chống Double Booking

### Double Booking là gì?

Double Booking là tình huống 2 người cùng đặt 1 sân, 1 ngày, 1 giờ. Đây là lỗi nghiêm trọng nhất trong hệ thống đặt sân.

**Ví dụ:**
```
08:59 — Khách A đặt Sân Cầu Lông, 30/09, giờ 09:00–10:30
09:00 — Khách B cũng đặt Sân Cầu Lông, 30/09, giờ 09:00–10:30
→ Cả hai cùng nhận "đặt thành công" → Khi đến sân, 2 người tranh 1 sân
```

### Cách project giải quyết — Prisma Transaction:

```typescript
// Toàn bộ logic "kiểm tra + tạo đơn" chạy trong 1 Transaction
const donDat = await prisma.$transaction(async (tx) => {
  // Bước 1: Khóa, lấy thông tin sân
  const san = await tx.san.findUnique({ where: { id: sanId } });

  // Bước 2: Tính khoảng thời gian đơn mới (09:00 → 10:30)

  // Bước 3: Kiểm tra có đơn nào bị OVERLAP không?
  const trungSlot = await tx.donDat.findFirst({
    where: {
      sanId,
      ngayDat: { ... },        // Cùng ngày
      trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI'] },
      AND: [
        { gioKhoa: { lt: gioKetThucMoi } },   // Đơn cũ bắt đầu trước khi đơn mới kết thúc
        { gioKetThuc: { gt: gioKhoaMoi } },   // Đơn cũ kết thúc sau khi đơn mới bắt đầu
      ]
    }
  });

  // Nếu có đơn trùng → ném lỗi (transaction rollback)
  if (trungSlot) throw new Error('SLOT_DA_BI_DAT');

  // Bước 4: Tạo đơn mới
  return await tx.donDat.create({ ... });
});
```

**Transaction là gì?** Là cam kết "tất cả hoặc không có gì". Nếu bước 3 phát hiện trùng, toàn bộ giao dịch bị hủy, đơn mới không được tạo.

**Kết quả:** Không thể có 2 đơn trùng slot trong database.

---

## 12. Thanh Toán VietQR

### Luồng thanh toán chuyển khoản:

```
1. Khách chọn "Chuyển khoản"
        ↓
2. DatLichScreen mở VietQRCodeModal
        ↓
3. VietQRCodeModal nhận thông tin: ngân hàng, STK, tên TK, số tiền, nội dung
        ↓
4. vietqr.ts sinh URL:
   https://qr.vietqr.io/970422/10288012812?amount=120000&note=Dat%20san%20cau%20long
        ↓
5. react-native-qrcode-svg vẽ QR code từ URL trên
   (nếu SVG lỗi → fallback: tải ảnh QR từ img.vietqr.io)
        ↓
6. Khách mở ứng dụng ngân hàng → quét mã → chuyển khoản
        ↓
7. Khách nhấn "Tôi đã chuyển khoản thành công"
        ↓
8. Modal đóng → executeCreateBooking() được gọi
        ↓
9. POST /api/don-dat { phuongThucThanhToan: "CHUYEN_KHOAN", ... }
        ↓
10. Đơn được tạo, slot bị khóa
```

> ⚠️ **Lưu ý:** Hệ thống hiện tại chưa có xác minh thanh toán tự động (không có webhook). Nhân viên phải kiểm tra thủ công tài khoản ngân hàng rồi bấm "Xác nhận" trong hệ thống.

---

## 13. Real-time Socket.io

### Cách hoạt động:

```
Backend khởi động → initSocket(httpServer)
        │
        ▼
Mobile A mở ChiTietSanScreen (sân "Cầu Lông Phú Thọ")
→ socketService.joinSanRoom("san-cau-long-phu-tho")
→ emit 'join_san' → Backend đưa vào room 'san:san-cau-long-phu-tho'

Mobile B cũng mở sân đó → cũng vào room
        │
        ▼
Mobile A đặt thành công
→ Backend emit:
  io.to('san:san-cau-long-phu-tho').emit('slot_updated', {
    gio: '09:00',
    trangThai: 'DANG_GIU',
    ngayDat: '2026-10-01'
  })
        │
        ▼
Mobile B nhận event 'slot_updated'
→ socketService.onSlotUpdate(callback)
→ callback cập nhật state của ChiTietSanScreen
→ React re-render → ô 09:00 chuyển từ XANH → ĐỎ ngay lập tức
```

---

## 14. Tiến Độ

### ✅ Đã làm (code thực tế đã có):

**Mobile:**
- [x] Trang Chủ với danh sách sân và môn thể thao
- [x] Danh Sách Sân với filter và sắp xếp
- [x] Chi Tiết Sân với ma trận khung giờ + chọn ngày
- [x] Đặt Lịch với tính tiền tự động + 3 phương thức thanh toán
- [x] VietQR Modal với mã QR SVG + fallback ảnh
- [x] Hồ Sơ với lịch sử đặt sân + tab thông tin
- [x] Toàn bộ Services: sanService, donDatService, authService, socketService
- [x] Graceful Fallback (app không crash khi backend offline)
- [x] TypeScript 100%

**Backend:**
- [x] Express Server + Socket.io
- [x] JWT Authentication (đăng ký, đăng nhập, bảo vệ route)
- [x] Phân quyền 3 cấp: CUSTOMER / STAFF / ADMIN
- [x] API sân thể thao + tính slot khả dụng theo ngày
- [x] API đặt sân với chống Double-Booking bằng Prisma Transaction
- [x] API lịch sử + hủy đơn + xác nhận + check-in
- [x] API đồ uống + quản lý kho
- [x] API đánh giá + cập nhật điểm trung bình sân
- [x] Tính giá cao điểm / thấp điểm theo ngày và giờ
- [x] Socket.io phát sự kiện slot_updated sau khi đặt

**Database:**
- [x] 13 bảng với quan hệ đầy đủ
- [x] Index tối ưu cho chống double-booking
- [x] Enum rõ ràng cho tất cả trạng thái
- [x] Seed dữ liệu mẫu: 7 loại sân, 3 tài khoản, 1 sân mẫu

### ⏳ Chưa làm (biết rõ là thiếu):

- [ ] **Web Admin:** Giao diện quản lý cho STAFF/ADMIN (chưa có file nào)
- [ ] **Màn hình Đăng Nhập/Đăng Ký Mobile:** Backend đã có API nhưng Mobile chưa có màn hình
- [ ] **Xác minh thanh toán tự động:** Chưa có webhook từ ngân hàng/MoMo
- [ ] **Push Notification:** Thông báo khi đơn được xác nhận/từ chối
- [ ] **React Native Maps:** Bản đồ vị trí sân
- [ ] **Tích hợp MoMo/PayOS SDK** thực sự (hiện chỉ có QR chuyển khoản)
- [ ] **Quản lý cơ sở (đa cơ sở):** Schema hiện tại là đơn cơ sở
- [ ] **Unit Test / Integration Test**

---

## 15. Câu Hỏi Thường Gặp

### "Tại sao Mobile không kết nối trực tiếp Database?"

Vì sẽ phải để thông tin đăng nhập MySQL trong code Mobile — rất nguy hiểm, ai cũng có thể xem và xóa dữ liệu. Backend đứng giữa để kiểm tra quyền trước khi cho phép đọc/ghi database.

---

### "REST API là gì? Tại sao dùng?"

REST là quy ước giao tiếp giữa phần mềm qua internet dùng HTTP. Mobile gửi yêu cầu đến URL, backend trả về JSON. Đơn giản, phổ biến, không phụ thuộc vào ngôn ngữ lập trình.

---

### "JWT Token là gì? Tại sao không dùng Session?"

JWT là chuỗi mã hóa chứa thông tin người dùng (userId, vaiTro). Backend không cần lưu session, chỉ cần giải mã token. Phù hợp với Mobile App và kiến trúc stateless (không trạng thái).

---

### "Prisma Transaction giải quyết double-booking như thế nào?"

Transaction đảm bảo 2 bước "kiểm tra trùng" và "tạo đơn" chạy nguyên tử — không thể bị chen ngang bởi request khác. Nếu 2 người đặt cùng lúc, chỉ 1 người được tạo đơn, người còn lại nhận lỗi 409 Conflict.

---

### "Nếu Backend chưa bật, app có chạy được không?"

Có. Nhờ `executeWithFallback` trong `apiClient.ts`. Mọi gọi API đều có dữ liệu mẫu dự phòng. App hiện dữ liệu mock thay vì crash.

---

### "Socket.io dùng để làm gì cụ thể?"

Khi khách A đặt xong → backend emit `slot_updated` → Mọi điện thoại đang xem trang chi tiết sân đó nhận được sự kiện này → slot 09:00 đổi từ xanh sang đỏ ngay, không cần tải lại trang.

---

### "VietQR là gì? Khác gì mã QR thông thường?"

VietQR là chuẩn QR của Napas, khi quét bằng app ngân hàng Việt Nam sẽ tự điền sẵn: số tài khoản, ngân hàng, số tiền, nội dung chuyển khoản. Người dùng chỉ cần bấm "Xác nhận chuyển khoản".

---

### "Tại sao giá tiền lưu kiểu Int (số nguyên), không dùng Decimal?"

Vì VND không có phần lẻ (không có 80.000,5 đồng). Dùng Int tránh lỗi làm tròn của số thập phân trong máy tính (floating point precision error). Đây là best practice cho tiền tệ không có cents.

---

### "Backend hiện tại có hỗ trợ đa cơ sở không?"

Hiện tại schema chưa có bảng "co_so" (cơ sở). Tất cả sân đang thuộc 1 hệ thống. Đây là điểm có thể mở rộng trong tương lai: thêm bảng `CoSo`, quan hệ `San` thuộc `CoSo`.

---

### "Tại sao có cả `gioKhoa` và `gioKetThuc` trong bảng don_dat?"

`gioKhoa` là giờ bắt đầu do khách chọn. `gioKetThuc` được tính tự động (`gioKhoa + soGioThue`). Lưu cả 2 để query chống double-booking được đơn giản hơn, không cần tính toán mỗi lần so sánh.

---

*Tài liệu này được tạo dựa trên phân tích code thực tế của project tại thời điểm 01/10/2026.*
*Chỉ mô tả những gì thực sự tồn tại trong codebase.*
