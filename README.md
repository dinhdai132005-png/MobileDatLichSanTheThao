# Hệ Thống Quản Lý & Đặt Lịch Sân Thể Thao 24/7 (v1.2)

Hệ thống đặt lịch sân thể thao đa năng dành cho một cơ sở có nhiều sân, phục vụ đồng thời 3 nhóm đối tượng: **Khách hàng** (Mobile App), **Nhân viên & Quản trị viên** (Web Admin) thông qua một **Backend REST API** tập trung.

---

## 🌟 Điểm Cốt Lõi Của Hệ Thống

1. **Cơ sở dữ liệu 13 bảng tiếng Việt không dấu (`snake_case`)**:
   - `nguoi_dung`, `loai_san`, `san`, `khung_gio`, `gia_khung_gio`, `don_dat`, `chi_tiet_khung_gio_dat`, `thanh_toan`, `nhat_ky_trang_thai_don`, `danh_gia`, `dich_vu`, `yeu_cau_dich_vu`, `chi_tiet_yeu_cau_dich_vu`.
2. **Chống trùng lịch tuyệt đối (Race Condition Prevention)**:
   - Khóa UNIQUE chống trùng slot ở tầng CSDL: `uq_slot_dang_khoa (san_id, ngay_dat, khung_gio_id, dang_khoa)`.
   - Đã kiểm định bằng mô hình Barrier Pattern 15 workers đồng thời bấm đặt cùng 1 slot (TC-20A).
3. **Backend 3 lớp (Route ↔ Controller ↔ Service)**:
   - Viết hoàn toàn bằng SQL thuần với transaction pool `mysql2/promise`, loại bỏ 100% ORM/Prisma.
   - Toàn bộ tên file, class, method, biến nghiệp vụ được chuẩn hóa sang **tiếng Việt không dấu**.
   - Hợp đồng API công khai tuân thủ tuyệt đối chuẩn quốc tế: URL tiếng Anh kebab-case (`/api/v1/...`), payload JSON camelCase, mã lỗi chuẩn (`SLOT_TAKEN`, `TOO_EARLY`, `RENTALS_NOT_RETURNED`...).
4. **Web Admin Vận Hành 13 Tab (`/admin`)**:
   - Tích hợp trực tiếp tại Express static: `http://localhost:4000/admin`.
   - Giao diện Dark Mode cao cấp (Plus Jakarta Sans, JetBrains Mono, emerald accent, glassmorphism).
   - Đầy đủ 13 tab: Dashboard KPI, Lịch sân theo ngày, Danh sách đơn, Đặt tại quầy (quy tắc nhân viên BR-03/TC-61), Hàng đợi dịch vụ (STF-11/STF-15), Xử lý hoàn tiền (STF-09/BR-34), Khách hàng (ADM-06), Loại sân & Sân (BR-05/BR-30), Khung giờ, Bảng giá ma trận (TC-35), Danh mục dịch vụ (ADM-08), Tài khoản nhân viên (TC-36/TC-37), Báo cáo & Thống kê (ADM-07/TC-58).
5. **Mobile App (React Native Expo)**:
   - Đặt sân thể thao và phòng tiệc/khu sự kiện (`EVENT` category có sức chứa `capacity`).
   - Gọi đồ uống, thuê vợt/giày, gói tiệc mang ra sân (`GoiDichVuScreen`).
   - Bảng kê hóa đơn tổng hợp theo thời gian thực (`HoaDonScreen`).
   - Hủy đơn kèm form thông tin hoàn tiền (`refundInfo`) khi đơn đã thanh toán.
6. **Kiểm thử tự động toàn diện (61/61 Tests PASS 100%)**:
   - 8 Test Suites Jest: Concurrency race condition, BVA & RBAC matrix, E2E flows (E1 -> E5), Đơn đặt & Nhân viên, Dịch vụ & Hóa đơn, Danh mục, Xác thực, Quản trị & Báo cáo.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Chuẩn Bị Môi Trường
- **Node.js** >= 18.x
- **MySQL** >= 8.0 (chạy tại cổng 3306)

### 2. Cấu Hình Cơ Sở Dữ Liệu
Tạo cơ sở dữ liệu `sport_booking` trong MySQL:
```sql
CREATE DATABASE sport_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Kiểm tra cấu hình tại file `backend/.env`:
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=sport_booking
JWT_SECRET=sport_booking_super_secret_jwt_key_2026_antigravity
ADMIN_PHONE=0900000001
ADMIN_PASSWORD=admin123456
```

### 3. Nạp CSDL 13 Bảng & Dữ Liệu Mẫu
Mở terminal tại thư mục `backend`:
```bash
cd backend
npm run db:reset
npm run seed:admin
```

### 4. Khởi Động Backend & Web Admin
```bash
cd backend
npm run dev
```
- **REST API Base URL**: `http://localhost:4000/api/v1`
- **Web Admin Portal**: `http://localhost:4000/admin`

### 5. Khởi Động Mobile App (React Native Expo)
Mở một terminal mới tại thư mục gốc:
```bash
npx expo start
```
- Nhấn `w` để mở giao diện Web, hoặc quét mã QR bằng ứng dụng Expo Go trên điện thoại (đảm bảo điện thoại và máy tính cùng mạng WiFi).

---

## 👥 Danh Sách Tài Khoản Mặc Định

| Vai trò | Số điện thoại | Mật khẩu | Phạm vi sử dụng |
|---|---|---|---|
| **Quản trị viên (ADMIN)** | `0900000001` | `admin123456` | Web Admin (toàn quyền 13 tab, đóng đơn công nợ, quản lý nhân viên, bảng giá) |
| **Nhân viên (STAFF)** | `0900000002` | `123456` | Web Admin (các tab vận hành: Dashboard, Lịch sân, Đặt tại quầy, Hàng đợi dịch vụ, Hoàn tiền) |
| **Khách hàng A (CUSTOMER)** | `0911111111` | `123456` | Mobile App (đặt sân, gọi dịch vụ, xem hóa đơn) |
| **Khách hàng B (CUSTOMER)** | `0922222222` | `123456` | Mobile App |

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)

Chạy toàn bộ 8 test suites (61 test cases) tại thư mục `backend`:
```bash
cd backend
npm test
```

### Chi Tiết 8 Test Suites:
1. `tests/dondat-concurrency.test.ts` (4 tests): Kiểm thử đồng thời Barrier Pattern 15 worker, double confirm payment race, cancel vs payment race, event room concurrency.
2. `tests/e2e-flows.test.ts` (17 tests): Luồng tích hợp End-to-End trọn vẹn 5 kịch bản E1 -> E5 theo `plant/11-end-to-end-flows.md`.
3. `tests/bva-rbac.test.ts` (13 tests): Phân tích giá trị biên (BVA) 14 ngày, max 3 đơn hoạt động, hạn hủy <6h, và ma trận phân quyền RBAC đa chiều 4 vai trò.
4. `tests/nhanvien-dondat.test.ts` (7 tests): Nghiệp vụ nhân viên tại quầy, check-in, hủy hoàn tiền, job hết hạn, đơn quá giờ `overdue=true`.
5. `tests/dichvu-hoadon.test.ts` (5 tests): Quy trình gọi dịch vụ, giao hàng, trả đồ thuê, thu tiền dịch vụ, đóng đơn công nợ.
6. `tests/danhmuc.test.ts` (5 tests): API danh mục công khai loại sân, sân, khung giờ, bảng giá, dịch vụ.
7. `tests/xacthuc.test.ts` (6 tests): Đăng ký, đăng nhập, bảo mật JWT, đổi mật khẩu.
8. `tests/quantri-baocao.test.ts` (4 tests): Quản trị sân, cấu hình, báo cáo doanh thu và tỷ lệ lấp đầy.

Kiểm tra Typecheck và Build:
```bash
# Backend
cd backend
npm run typecheck
npm run build

# Mobile
npm run type-check
```

---

## 📁 Cấu Trúc Thư Mục Chính

```
DatLichSanTheThao/
├── database/
│   ├── schema.sql              # CSDL 13 bảng tiếng Việt không dấu (snake_case)
│   └── seed.sql                # Dữ liệu mẫu (sân thể thao, phòng tiệc, 11 dịch vụ)
├── backend/
│   ├── public/admin/           # Web Admin tĩnh (HTML5 + CSS + JS thuần)
│   ├── scripts/                # Script khởi tạo CSDL và tạo Admin
│   ├── src/
│   │   ├── config/             # Cấu hình CSDL, môi trường, nghiệp vụ
│   │   ├── controllers/        # 7 Controllers tiếng Việt không dấu
│   │   ├── services/           # 7 Services tiếng Việt không dấu (SQL thuần transaction)
│   │   ├── routes/             # Định tuyến REST API v1
│   │   ├── middlewares/        # Xác thực, phân quyền, kiểm tra Zod, bắt lỗi
│   │   ├── utils/              # Bộ tiện ích (hóa đơn, thời gian, JWT, mật khẩu...)
│   │   └── jobs/               # Background job quét đơn PENDING hết hạn
│   └── tests/                  # 8 Test Suites Jest (61 automated tests)
├── src/                        # Ứng dụng Mobile React Native (Expo)
│   ├── screens/                # Màn hình (Đặt sân, Gọi dịch vụ, Hóa đơn, Lịch đặt...)
│   ├── services/               # Client kết nối REST API Backend
│   └── navigation/             # Bộ điều hướng React Navigation
└── plant/                      # Tài liệu đặc tả phân tích & thiết kế v1.2 (00 -> 11)
```

---

## 📚 Tài Liệu Đặc Tả Nghiệp Vụ (`plant/`)
- `01-database.md`: Đặc tả 13 bảng CSDL, khóa chống trùng, logic snapshot giá và hóa đơn.
- `03-actors-functions.md`: Phân vai và ma trận chức năng (CUS, STF, ADM, SYS).
- `04-function-details-flows.md`: Danh sách 34 quy tắc nghiệp vụ (BR-01 -> BR-34).
- `06-api.md`: Hợp đồng chuẩn toàn bộ REST API v1.
- `09-defense-guide.md`: Kịch bản demo 16 bước và bộ câu hỏi bảo vệ đồ án.
- `11-end-to-end-flows.md`: Luồng liền mạch Mobile ↔ API ↔ Database ↔ Web (E1 -> E5).
