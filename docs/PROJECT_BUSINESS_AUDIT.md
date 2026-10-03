# PROJECT BUSINESS AUDIT REPORT
## Hệ Thống Quản Lý & Đặt Sân Thể Thao Đa Cơ Sở
> **Ngày kiểm tra:** 01/10/2026  
> **Phương pháp:** Đọc & đối chiếu code thực tế với định hướng nghiệp vụ và kiến trúc mục tiêu  
> **Nguyên tắc:** Chỉ báo cáo — KHÔNG sửa code

---

## TÓM TẮT ĐIỂM SỐ TỔNG QUÁT

| Hạng mục | Đánh giá | Mức độ ưu tiên |
|----------|----------|----------------|
| Kiến trúc tổng thể | 🟡 Đúng hướng, thiếu thành phần | Trung bình |
| Phân quyền (Role-based) | 🟡 Có 3/4 Role, thiếu MANAGER | Cao |
| Đa cơ sở (Multi-facility) | 🔴 Chưa triển khai | **Rất cao** |
| Nghiệp vụ đặt sân | 🟡 Đúng cốt lõi, thiếu một số rule | Trung bình |
| Quản lý sân | 🔴 Đang theo hướng CRUD thông thường | **Cao** |
| Khách đặt nước/dụng cụ từ Mobile | 🔴 Chưa có | Cao |
| Phân biệt Sale vs Rental | 🟡 Schema có, API thiếu | Trung bình |
| Hóa đơn tổng hợp (Invoice) | 🔴 Chưa có model riêng | Cao |
| Chính sách hủy & Hoàn tiền | 🔴 Chưa có logic | Trung bình |
| No-show | 🔴 Chưa có | Thấp |
| Thanh toán Gateway thực tế | 🔴 Chưa tích hợp | Thấp |
| Web Admin | 🔴 Chưa có | **Rất cao** |

---

## PHẦN 1 — KIẾN TRÚC TỔNG THỂ

### 1.1 Kiến trúc thực tế so với mục tiêu

**Kiến trúc mục tiêu:**
```
CUSTOMER → Mobile App → Backend API → Database ← Web Admin ← STAFF/MANAGER/ADMIN
```

**Kiến trúc thực tế hiện có:**
```
CUSTOMER → Mobile App (React Native + Expo) → Backend API (Express) → MySQL
```

**Kết luận:**
- ✅ Nhánh CUSTOMER đã đúng hướng và kết nối được với backend thực tế.
- 🔴 **Nhánh Web Admin hoàn toàn chưa tồn tại.** Không có 1 file nào trong cả project.
- 🔴 STAFF, MANAGER, ADMIN hiện chỉ là enum trong Database. Họ không có giao diện để làm việc.

**Mức độ ảnh hưởng:** Nghiêm trọng. Toàn bộ vận hành nghiệp vụ (xác nhận đơn, check-in, quản lý kho, báo cáo) đang "treo" ở Backend nhưng không có Frontend để kích hoạt.

---

### 1.2 Thành phần kỹ thuật — Kiểm tra thực tế

| Thành phần | Tình trạng | File thực tế |
|------------|------------|--------------|
| React Native Mobile | ✅ Có | `src/screens/*.tsx` |
| Expo | ✅ Có | `package.json`, `app.json` |
| TypeScript (Mobile) | ✅ Có | Toàn bộ `.tsx` files |
| React Navigation (Stack + Tab) | ✅ Có | `src/navigation/AppDieuHuong.tsx` |
| Axios HTTP Client | ✅ Có | `src/services/apiClient.ts` |
| Socket.io Client | ✅ Có | `src/services/socketService.ts` |
| Node.js + Express | ✅ Có | `backend/src/app.ts` |
| TypeScript (Backend) | ✅ Có | Toàn bộ `.ts` files |
| Prisma ORM | ✅ Có | `backend/prisma/schema.prisma` |
| MySQL | ✅ Có | `DATABASE_URL` trong `.env` |
| JWT Authentication | ✅ Có | `backend/src/middleware/auth.middleware.ts` |
| Socket.io Server | ✅ Có | `backend/src/socket.ts` |
| VietQR (QR Code) | ✅ Có | `src/services/vietqr.ts` |
| ReactJS Web Admin | ❌ Chưa có | — |
| Payment Gateway (MoMo/PayOS/VNPay SDK) | ❌ Chưa tích hợp | Chỉ có enum trong schema |

---

## PHẦN 2 — PHÂN QUYỀN (ROLE-BASED ACCESS CONTROL)

### 2.1 Kiểm tra 4 Role yêu cầu

**Định hướng:** CUSTOMER / STAFF / MANAGER / ADMIN

**Thực tế trong `schema.prisma` (dòng 20–24):**
```prisma
enum VaiTro {
  CUSTOMER
  STAFF
  ADMIN
}
```
> ⚠️ **MANAGER không tồn tại trong enum.** Hiện chỉ có 3 role: CUSTOMER, STAFF, ADMIN.

**Trong `auth.middleware.ts`:**
```typescript
vaiTro: 'CUSTOMER' | 'STAFF' | 'ADMIN';  // Không có MANAGER
```

### 2.2 Phân quyền từng API — Đối chiếu thực tế

| API | Yêu cầu | Thực tế | Đánh giá |
|-----|---------|---------|----------|
| `POST /api/auth/login` | Public | Public | ✅ Đúng |
| `GET /api/san` | Public | Public | ✅ Đúng |
| `GET /api/san/:id/slots` | Public | Public | ✅ Đúng |
| `POST /api/don-dat` | CUSTOMER | authMiddleware (mọi role) | 🟡 Cần chuẩn hoá |
| `GET /api/don-dat/cua-toi` | CUSTOMER | authMiddleware | ✅ Hợp lý |
| `PATCH /api/don-dat/:id/xac-nhan` | STAFF/ADMIN | requireRole('STAFF','ADMIN') | ✅ Đúng |
| `PATCH /api/don-dat/:id/tu-choi` | STAFF/ADMIN | requireRole('STAFF','ADMIN') | ✅ Đúng |
| `PATCH /api/don-dat/:id/check-in` | STAFF/ADMIN | requireRole('STAFF','ADMIN') | ✅ Đúng |
| `PATCH /api/don-dat/:id/huy` | CUSTOMER (đơn mình) | authMiddleware + check owner | ✅ Đúng |
| `POST /api/san` | ADMIN | requireRole('ADMIN') | ✅ Đúng |
| `PUT /api/san/:id` | ADMIN | requireRole('ADMIN') | ✅ Đúng |
| `POST /api/danh-gia` | CUSTOMER | requireRole('CUSTOMER') | ✅ Đúng |
| `POST /api/do-uong` | ADMIN | requireRole('ADMIN') | ✅ Đúng |

### 2.3 Vấn đề phân quyền theo cơ sở

Route `xac-nhan`, `tu-choi`, `check-in` yêu cầu `STAFF` hoặc `ADMIN`. Nhưng thiếu:
- STAFF chỉ được xử lý đơn thuộc **cơ sở của mình** — không có logic kiểm tra vì không có quan hệ `Staff → CoSo`.
- MANAGER role chưa tồn tại → không có phân quyền cấp manager nào.

---

## PHẦN 3 — ĐA CƠ SỞ (MULTI-FACILITY)

### 3.1 Kiểm tra quan hệ Company → Facility → Court

**Yêu cầu nghiệp vụ:**
```
Công ty → Cơ sở A → Sân 1, Sân 2
         Cơ sở B → Sân 1, Sân 2
         Nhân viên A thuộc Cơ sở A
         Manager A quản lý Cơ sở A
```

**Thực tế trong `schema.prisma` — danh sách bảng:**
```
nguoi_dung  loai_san  san  don_dat  do_uong  dung_cu
chi_tiet_fnb  chi_tiet_dung_cu  danh_gia
voucher  voucher_don_dat  khuyen_mai_san
```

> 🔴 **KHÔNG CÓ bảng `co_so` (cơ sở/facility).**
> 🔴 **KHÔNG CÓ quan hệ `san.coSoId`.**
> 🔴 **KHÔNG CÓ quan hệ `nguoiDung.coSoId` (nhân viên thuộc cơ sở nào).**

**Hậu quả:**
- Tất cả sân đang tồn tại ở cấp "toàn công ty" — không có sân nào thuộc "Cơ sở A" hay "Cơ sở B".
- Một STAFF có thể xác nhận đơn của bất kỳ sân nào — không có cơ chế giới hạn theo cơ sở.
- Manager không thể được triển khai vì không có cơ sở để gán.
- Báo cáo doanh thu không thể phân tách theo cơ sở.

**Đây là khoảng trống nghiêm trọng nhất** giữa đề tài "đa cơ sở" và implementation hiện tại.

---

## PHẦN 4 — QUẢN LÝ SÂN (COURT MANAGEMENT)

### 4.1 Kiểm tra hướng CRUD

**Yêu cầu nghiệp vụ:**
```
Sân không phải CRUD thông thường.
HOAT_DONG → BAO_TRI → DONG_CUA
với lý do, thời gian, người thực hiện.
```

**Thực tế trong `san.routes.ts` (dòng 142–163):**
```typescript
// POST /api/san — TẠO SÂN (Admin)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const san = await prisma.san.create({ data: req.body });
});

// PUT /api/san/:id — CẬP NHẬT SÂN (Admin)
router.put('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  const san = await prisma.san.update({ where: { id }, data: req.body });
});
```

> ⚠️ **Đây là CRUD thông thường.** Không có:
> - Route `PATCH /api/san/:id/khoa` (khóa sân có lý do)
> - Route `PATCH /api/san/:id/bao-tri` (chuyển sang bảo trì)
> - Bảng lịch sử trạng thái sân (`san_trang_thai_log`)
> - `PUT /api/san/:id` nhận `req.body` trực tiếp — có thể thay đổi mọi field không kiểm soát

**Điểm tốt đã có:**
- ✅ Schema có enum `TrangThaiSan { HOAT_DONG, BAO_TRI, DONG_CUA }` — định hướng đúng.
- ✅ Không có route `DELETE /api/san` — sân không bị xóa vật lý, bảo toàn dữ liệu lịch sử.
- ✅ `GET /api/san` chỉ lấy `trangThai: 'HOAT_DONG'` — sân BAO_TRI và DONG_CUA ẩn khỏi danh sách.

**Tóm tắt:** Hướng đúng về ý tưởng nhưng chưa có API chuyên biệt để thay đổi trạng thái có kiểm soát.

---

## PHẦN 5 — NGHIỆP VỤ ĐẶT SÂN (BOOKING FLOW)

### 5.1 Flow đặt sân trên Mobile

**Yêu cầu:**
```
Chọn cơ sở → Chọn ngày → Chọn giờ bắt/kết thúc → Tìm sân trống → Chọn sân → Backend kiểm tra → Tạo Booking
```

**Thực tế (ChiTietSanScreen.tsx + DatLichScreen.tsx):**
```
[Đã ở trang sân cụ thể] → Chọn ngày → Chọn giờ bắt đầu → Chọn số giờ thuê → Xác nhận
```

**Sai lệch:**
- 🔴 Khách phải vào **từng sân** để xem slot, không có màn hình "Tìm sân trống theo ngày/giờ".
- 🔴 Không có bước "Chọn cơ sở" vì chưa có đa cơ sở.
- 🟡 Khách chọn "giờ bắt đầu" + "số giờ thuê" thay vì "giờ bắt đầu" + "giờ kết thúc" — UX khác nhưng kết quả tương đương.

### 5.2 Kiểm tra start_time / end_time / duration

**Trong `donDat.routes.ts` (POST /):**
```typescript
const phutBatDau = gH * 60 + gP;
const phutKetThuc = phutBatDau + Math.round(soGioThue * 60);
const gioKetThuc = `${hKT}:${pKT}`;
```

- ✅ `start_time` = `gioKhoa` — có
- ✅ `end_time` = `gioKetThuc` (tự tính) — có
- ✅ `duration` = `soGioThue` (1.0, 1.5, 2.0, 3.0) — có
- ✅ Lưu cả hai vào database — đúng
- ❌ `minimum_duration` — không có validation
- ❌ `advance_booking` — không giới hạn đặt trước bao nhiêu ngày
- ❌ `minimum_booking_notice` — không kiểm tra đặt quá gần giờ chơi

### 5.3 Chống Double-Booking — Đánh giá

**Kiểm tra overlap trong `donDat.routes.ts` (dòng 74–85):**
```typescript
const trungSlot = await tx.donDat.findFirst({
  where: {
    sanId,
    ngayDat: { gte: ngayStart, lt: ngayEnd },
    trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI'] },
    AND: [
      { gioKhoa: { lt: gioKetThuc } },
      { gioKetThuc: { gt: gioKhoa } },
    ],
  },
});
```

- ✅ Dùng Prisma Transaction — đúng cách.
- ✅ Kiểm tra overlap chuẩn: `(A.start < B.end) AND (A.end > B.start)`.
- ✅ Xem xét tất cả trạng thái "đang chiếm slot".
- ✅ Database index `@@index([ngayDat, gioKhoa])` — tối ưu query.
- ✅ Trả về 409 Conflict nếu trùng.

> **Đây là phần được triển khai tốt nhất trong project.**

---

## PHẦN 6 — KHÁCH ĐẶT NƯỚC & THUÊ DỤNG CỤ TỪ MOBILE

### 6.1 Kiểm tra Mobile (DatLichScreen.tsx)

Form đặt lịch chỉ có:
```typescript
const [soGio, setSoGio] = useState<number>(1);
const [hoTen, setHoTen] = useState<string>('...');
const [soDT, setSoDT] = useState<string>('...');
const [ghiChu, setGhiChu] = useState<string>('');
const [thanhToan, setThanhToan] = useState<PhuongThucThanhToan>('tienMat');
```

> 🔴 **KHÔNG có bất kỳ UI nào để chọn đồ uống hoặc dụng cụ thuê.**

Payload gửi lên Backend không có `doUongList` hay `dungCuList`.

### 6.2 Kiểm tra Backend

```typescript
// POST /api/don-dat schema — không nhận FnB hay Rental
const taodonDatSchema = z.object({
  sanId, tenKhach, soDienThoaiKhach, ghiChu,
  ngayDat, gioKhoa, soGioThue, phuongThucThanhToan, maVoucher
  // Thiếu: doUongList, dungCuList
});
```

Không có API nào để thêm FnB hoặc Rental vào đơn sau khi tạo.

### 6.3 Kiểm tra Database

- ✅ Bảng `chi_tiet_fnb` tồn tại — có thể lưu đồ uống cho đơn
- ✅ Bảng `chi_tiet_dung_cu` tồn tại — có thể lưu dụng cụ thuê cho đơn
- 🔴 `tongTienFnB` và `tongTienDungCu` trong `don_dat` luôn = 0 vì không có cơ chế ghi

**Kết luận:** Schema chuẩn bị tốt nhưng **toàn bộ luồng FnB và Rental chưa được kích hoạt** — cả từ Mobile lẫn từ API.

---

## PHẦN 7 — PHÂN BIỆT SALE vs RENTAL

### 7.1 Sale (Bán sản phẩm — đồ uống)

- ✅ Schema `do_uong`: `giaBan`, `giaNhap`, `tonKho`, `nguongCanhBao` — đủ fields
- ❌ Không có API giảm tồn kho khi bán (`tonKho - soLuong`)
- ❌ Không có cảnh báo khi tồn kho < `nguongCanhBao`

### 7.2 Rental (Cho thuê dụng cụ)

Schema `dung_cu` có trạng thái `SAN_SANG / DANG_CHO_MUON / HONG / BAO_TRI` — đúng nghiệp vụ.
`ChiTietDungCu` có `tinhTrangTra` và `phiBoiThuong` — đúng.

**Thiếu:**
- ❌ Không có route nào để: xuất dụng cụ (AVAILABLE → RENTED), nhận lại (RENTED → AVAILABLE), ghi nhận hỏng
- ❌ `trangThai` trong `dung_cu` là `String` (không phải enum) — dễ gõ sai giá trị

**Tóm tắt:** Schema phân biệt rõ 2 nghiệp vụ nhưng **cả hai đều thiếu API và Mobile UI để vận hành**.

---

## PHẦN 8 — MÔ HÌNH HÓA ĐƠN (INVOICE MODEL)

Trong `don_dat` schema:
```
tongTienSan     Int   // Tiền sân
tongTienFnB     Int   @default(0)   // Luôn 0 vì chưa có flow
tongTienDungCu  Int   @default(0)   // Luôn 0 vì chưa có flow
giamGia         Int   @default(0)
tongCong        Int   // Tổng phải trả
```

- ✅ Tư duy đúng: `tongCong = tongTienSan + tongTienFnB + tongTienDungCu - giamGia`
- ❌ Không có bảng `hoa_don` (invoice) riêng — gộp vào `don_dat`
- ❌ Không có bảng `thanh_toan` (payment) riêng
- ❌ Không hỗ trợ "trả tiền sân trước, trả tiền nước sau"
- ❌ Không có `Paid / Remaining` logic

---

## PHẦN 9 — HỦY ĐẶT / NO-SHOW / HOÀN TIỀN

### 9.1 Flow hủy

**Thực tế trong `PATCH /api/don-dat/:id/huy`:**
- ✅ Khách chỉ hủy được đơn của mình
- ✅ Không hủy được đơn DANG_CHOI hay HOAN_THANH
- ✅ Giải phóng slot khi hủy (Socket.io TRONG)
- ❌ Không có **Cancellation Policy** (hủy trước 24h miễn phí / hủy muộn phí 30%)
- ❌ Không có **Refund flow**
- ❌ `TrangThaiThanhToan.HOAN_TIEN` tồn tại trong schema nhưng không bao giờ được set

### 9.2 No-show

- ❌ Không có trạng thái `NO_SHOW` trong enum `TrangThaiDonDat`
- ❌ Không có route `PATCH /api/don-dat/:id/no-show`
- ❌ Không có cơ chế tự động đánh dấu no-show sau giờ chơi

---

## PHẦN 10 — THANH TOÁN

**Trong Mobile (DatLichScreen.tsx):**
```
Tiền mặt → hoạt động đúng
Chuyển khoản VietQR → hiện QR, không verify webhook
MoMo "Ví MoMo" → thực ra chỉ hiện QR chuyển khoản thường (UX misleading)
```

**Thiếu:**
- ❌ Không có Webhook nhận xác nhận thanh toán từ ngân hàng/MoMo
- ❌ `trangThaiThanhToan` không tự động cập nhật — phải nhân viên xác nhận thủ công
- ❌ MoMo SDK chưa tích hợp

---

## PHẦN 11 — BOOKING ONLINE vs BOOKING TẠI QUẦY

Schema có `taoBoiNhanVienId` — đúng ý tưởng. Nhưng:
- ❌ **Không có UI để Staff tạo booking tại quầy** — Web Admin chưa có
- ❌ `taoBoiNhanVienId` không được set khi Staff dùng `POST /api/don-dat` — không tracking được
- ❌ Không có API chuyên biệt "tạo đơn tại quầy" (walk-in)

---

## PHẦN 12 — THỜI GIAN ĐẶT SÂN

- ✅ `soPhutMoiSlot` lưu trong DB — mỗi sân có slot 30 hoặc 60 phút
- ✅ Hỗ trợ đặt 1.0, 1.5, 2.0, 3.0 giờ — không hard-code 1 giờ
- ✅ `tinhTongTienSan` tính đúng nếu span qua giờ cao điểm → thấp điểm
- ❌ Không có `minimum_duration` validation
- ❌ Không có `advance_booking_limit`
- ❌ Không có `minimum_booking_notice`

---

## PHẦN 13 — TỔNG HỢP

### ✅ Phần đúng — Có thể tự tin bảo vệ

| Chức năng | Bằng chứng code |
|-----------|----------------|
| Chống Double-Booking bằng Prisma Transaction | `donDat.routes.ts` dòng 49–154 |
| Tính giá cao điểm / thấp điểm theo ngày và giờ | `backend/src/utils/pricing.ts` |
| JWT phân quyền 3 cấp | `backend/src/middleware/auth.middleware.ts` |
| Slot real-time qua Socket.io | `backend/src/socket.ts`, `src/services/socketService.ts` |
| Khách chỉ xem/hủy đơn của mình (403 nếu không phải) | `donDat.routes.ts` dòng 213, 279 |
| Sân không có route DELETE — bảo toàn lịch sử | `san.routes.ts` không có DELETE |
| Schema phân biệt Sale (đồ uống) và Rental (dụng cụ) | `schema.prisma` bảng `do_uong` và `dung_cu` |
| VietQR thanh toán chuyển khoản | `src/services/vietqr.ts` |
| Slot 5 phút giữ chỗ (`thoiGianGiuCho`) | `donDat.routes.ts` dòng 128 |
| Voucher giảm giá (FIXED và PERCENT) | `donDat.routes.ts` dòng 100–123 |
| Loyalty points + cấp độ thành viên (schema) | `schema.prisma` NguoiDung |

---

### 🟡 Đang làm nhưng chưa hoàn chỉnh

| Chức năng | % | Thiếu gì |
|-----------|---|---------|
| Đặt sân từ Mobile | 80% | Bước chọn cơ sở, FnB/Rental UI |
| Hủy đơn | 60% | Cancellation policy, refund logic |
| Quản lý trạng thái sân | 50% | API chuyên biệt + audit log |
| Thanh toán VietQR | 70% | Webhook xác minh tự động |
| Staff xác nhận/từ chối/check-in | 90% | API OK, thiếu Web Admin UI |
| Đánh giá sân | 90% | API OK, thiếu màn hình trên Mobile |
| Tích điểm loyalty | 20% | Schema có, không có logic cập nhật |
| Khuyến mãi flash sale | 10% | Schema có, không có logic áp dụng |

---

### 🔴 Chưa có — Khoảng trống lớn

| Chức năng | Ảnh hưởng |
|-----------|-----------|
| **Web Admin** (toàn bộ) | Nghiêm trọng |
| **Đa cơ sở (Multi-facility)** | Nghiêm trọng — tên đề tài nhưng chưa có |
| **Role MANAGER** | Cao |
| **Khách đặt nước/dụng cụ từ Mobile** | Cao |
| **API FnB + Rental cho đơn** | Cao |
| **Màn hình Đăng nhập/Đăng ký Mobile** | Cao — API có, UI không có |
| **No-show flow** | Trung bình |
| **Cancellation Policy** | Trung bình |
| **Refund flow** | Trung bình |
| **Invoice tách riêng** | Trung bình |
| **Báo cáo doanh thu** | Thấp |

---

### ⚠️ Làm theo hướng khác — Cần chú ý khi bảo vệ

| Điểm khác | Thực tế | Định hướng | Rủi ro |
|-----------|---------|-----------|--------|
| Khách chọn từng sân trước, rồi xem slot | Đúng | Yêu cầu: chọn ngày/giờ → backend tìm sân trống | Thấp |
| `soGioThue` thay vì `end_time` | Có tính `gioKetThuc` | Yêu cầu: cả start/end | Thấp |
| MoMo hiện QR chuyển khoản thường | Có | MoMo SDK thật | Trung bình |
| Tài khoản test hard-code trong service | `dangNhap('khachhang@gmail.com',...)` | Không nên | Thấp |

---

## PHẦN 14 — THỨ TỰ ƯU TIÊN XỬ LÝ (Chỉ gợi ý — không phải task hiện tại)

> Lưu ý: Đây chỉ là phân tích, KHÔNG phải lệnh sửa ngay bây giờ.

**Nhóm 1 — Cần để đề tài đúng tên:**
1. Thêm bảng `co_so` vào schema, quan hệ `san → co_so`, `nguoiDung → co_so`
2. Thêm role `MANAGER` vào enum `VaiTro`
3. Cập nhật phân quyền theo cơ sở

**Nhóm 2 — Cần để demo đủ luồng:**
1. Xây dựng Web Admin (đơn giản nhất): xem đơn, xác nhận, từ chối
2. Thêm màn hình Đăng Nhập / Đăng Ký trên Mobile
3. Thêm UI đặt thêm đồ uống từ màn hình Đặt Lịch

**Nhóm 3 — Cần để hoàn chỉnh nghiệp vụ:**
1. API thêm FnB vào đơn + giảm tồn kho
2. API thêm Rental vào đơn + thay đổi trạng thái dụng cụ
3. Cancellation Policy (tỷ lệ hoàn tiền theo thời gian hủy)
4. No-show status

---

## KẾT LUẬN

Project hiện tại đã xây dựng được **nền tảng kỹ thuật tốt** — Backend mạnh, schema chuẩn, chống double-booking đúng kỹ thuật, Socket.io real-time hoạt động.

**Điểm mạnh cốt lõi có thể tự tin bảo vệ:**
- Prisma Transaction chống double-booking — nghiêm ngặt và đúng kỹ thuật
- Tính giá peak/off-peak linh hoạt theo ngày và giờ
- Socket.io cập nhật slot real-time không cần refresh
- JWT phân quyền rõ ràng, khách không xem được đơn của người khác

**Khoảng cách lớn nhất giữa tên đề tài và thực tế:**
1. **"Đa cơ sở"** — chưa có bảng `co_so`, chưa có quan hệ Staff/Manager/Court → Cơ sở
2. **"Quản lý"** — Web Admin chưa tồn tại, STAFF/ADMIN không có giao diện
3. **"Đặt thêm nước và dụng cụ"** — Schema có, nhưng toàn bộ flow chưa được kích hoạt

---
*Báo cáo này dựa hoàn toàn trên code thực tế tại thời điểm 01/10/2026.*
*Không có bất kỳ thay đổi nào được thực hiện trong quá trình audit.*
