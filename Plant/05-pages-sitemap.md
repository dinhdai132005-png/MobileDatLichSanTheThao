# 05 — PAGES / SITEMAP / QUY ƯỚC GIAO DIỆN

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2: màn hình dịch vụ, hóa đơn, khu sự kiện; thêm đóng đơn có công nợ, thông tin hoàn tiền, tự làm mới). Mỗi màn hình liệt kê chức năng (mã FN) và API sử dụng. Mục 4 là quy ước UI/CSS (thay cho file `06-css-rules.md` riêng).

## 1. Sitemap Mobile (React Native + Expo Router, chỉ cho `CUSTOMER`)

```
(auth)
 ├─ login
 └─ register
(tabs)
 ├─ index        Trang chủ: sân thể thao, khu sự kiện & tiệc, lối vào thực đơn dịch vụ
 ├─ bookings     Lịch đặt của tôi (3 tab: Sắp tới / Hoàn thành / Đã hủy)
 └─ profile      Hồ sơ, đổi mật khẩu, đăng xuất
courts/[id]      Chi tiết sân + chọn ngày + chọn khung giờ
booking/confirm  Xác nhận đơn + chọn phương thức thanh toán
booking/[id]     Chi tiết đơn (hướng dẫn chuyển khoản, đếm ngược, hủy)
booking/[id]/review   Đánh giá sân (P1)
booking/[id]/order    Gọi dịch vụ: đồ uống / thuê đồ / gói tiệc (P1★)
booking/[id]/invoice  Hóa đơn + theo dõi yêu cầu dịch vụ (P1★)
services/index       Thực đơn dịch vụ, chỉ xem (P1★)
profile/edit     Sửa hồ sơ
profile/password Đổi mật khẩu
```

| Màn hình | Đường dẫn file (Expo Router) | FN | API |
|---|---|---|---|
| Đăng nhập | `app/(auth)/login.tsx` | CUS-02 | `POST /auth/login` |
| Đăng ký | `app/(auth)/register.tsx` | CUS-01 | `POST /auth/register` |
| Trang chủ | `app/(tabs)/index.tsx` | CUS-04, CUS-11 | `GET /court-types`, `GET /courts` (lọc `?category=SPORT|EVENT`) |
| Lịch đặt | `app/(tabs)/bookings.tsx` | CUS-08 | `GET /bookings/my` |
| Hồ sơ | `app/(tabs)/profile.tsx` | CUS-03 | `GET /auth/me` |
| Chi tiết sân | `app/courts/[id].tsx` | CUS-05 | `GET /courts/:id`, `/availability`, `/reviews` |
| Xác nhận đơn | `app/booking/confirm.tsx` | CUS-06 | `GET /config/public`, `POST /bookings` |
| Chi tiết đơn | `app/booking/[id].tsx` | CUS-07, 08, 09 (+ nút vào CUS-12, 13) | `GET /bookings/:id`, `POST .../cancel` |
| Đánh giá | `app/booking/[id]/review.tsx` | CUS-10 | `POST /bookings/:id/review` |
| Gọi dịch vụ | `app/booking/[id]/order.tsx` | CUS-12 | `GET /services`, `POST /bookings/:id/service-orders` |
| Hóa đơn | `app/booking/[id]/invoice.tsx` | CUS-13 | `GET /bookings/:id/invoice`, `POST .../service-orders/:orderId/cancel` |
| Thực đơn dịch vụ | `app/services/index.tsx` | CUS-11 | `GET /services` |
| Sửa hồ sơ | `app/profile/edit.tsx` | CUS-03 | `PUT /auth/me` |
| Đổi mật khẩu | `app/profile/password.tsx` | CUS-03 | `PUT /auth/change-password` |

**Luồng điều hướng đặt sân:** Trang chủ → Chi tiết sân (chọn ngày + giờ) → Xác nhận đơn (chọn thanh toán) → Chi tiết đơn (hiện thông tin chuyển khoản nếu có).

### Wireframe: Chi tiết sân và chọn giờ

```
┌──────────────────────────────┐
│ ←  Sân 5A                    │
│ [ảnh sân]                    │
│ Bóng đá mini 5 người  ★4.6(23)│
│ Mô tả...                     │
│ ── Chọn ngày ──              │
│ [T6 3][T7 4][CN 5][T2 6] ... │  ← dải 15 ngày, cuộn ngang
│ ── Chọn khung giờ (tối đa 3) │
│ [06-07 150k][07-08 150k]     │
│ [17-18 300k][18-19 300k]✔    │  ← ✔ đã chọn, xám = hết chỗ/quá giờ
│ ...                          │
│ Tổng: 600.000 ₫  [Tiếp tục]  │
└──────────────────────────────┘
```
Quy tắc: chỉ cho chọn các giờ **liền kề** (client chặn chọn rời rạc để báo lỗi sớm; server vẫn kiểm tra lại).

**Khu sự kiện/tiệc:** trên Trang chủ có mục riêng "Khu sự kiện & tiệc"; thẻ hiển thị tên, ảnh, **sức chứa** (`capacity`). Chọn vào cùng màn hình Chi tiết sân ở trên (cùng luồng chọn ngày, giờ).

### Wireframe: Gọi dịch vụ (khi đơn `CONFIRMED`, chưa qua giờ kết thúc)

```
┌──────────────────────────────┐
│ ←  Gọi dịch vụ · BK7F3KQ9ZA  │
│ Sân 5A · 17:00–19:00         │
│ [Đồ uống][Thuê đồ][Gói tiệc] │  ← tab theo loại dịch vụ
│ Nước suối  10.000 ₫  [−] 2 [+]│
│ Trà đá     8.000 ₫   [−] 0 [+]│
│ Nước tăng lực  Tạm hết       │  ← OUT_OF_STOCK: xám, không chọn được
│ Ghi chú: [Mang ra sân số 2  ]│
│ Tạm tính: 20.000 ₫ (chưa tính│
│ vào hóa đơn đến khi giao)    │
│              [Gửi yêu cầu]   │
└──────────────────────────────┘
```

### Wireframe: Hóa đơn

```
┌──────────────────────────────┐
│ ←  Hóa đơn · BK7F3KQ9ZA      │
│ Tiền sân              600.000│
│ ── Dịch vụ ──                │
│ #55 Đã giao                  │
│   Nước suối x2         20.000│
│   Thuê vợt x1  (chưa trả)  30.000│
│ #56 Chờ giao  (chưa tính tiền)│
│   [Hủy yêu cầu]              │
│ Tiền dịch vụ           50.000│
│ ────────────────────────────  │
│ Tổng cộng             650.000│
│ Đã thanh toán         600.000│
│ Còn thiếu              50.000│
│ Tiền dịch vụ thanh toán tại  │
│ quầy khi bạn trả đồ.         │
└──────────────────────────────┘
```

## 2. Sitemap Web Admin (ReactJS + Vite, `STAFF` và `ADMIN`)

```
/login
/                       Dashboard hôm nay                      (STAFF, ADMIN)
/schedule               Lịch lưới sân theo ngày                (STAFF, ADMIN)
/bookings               Danh sách đơn                          (STAFF, ADMIN)
/bookings/new           Đặt sân tại quầy                       (STAFF, ADMIN)
/bookings/:id           Chi tiết đơn + hành động               (STAFF, ADMIN)
/refunds                Đơn chờ hoàn tiền                      (STAFF, ADMIN)
/service-orders         Yêu cầu dịch vụ (hàng đợi giao)        (STAFF, ADMIN)
/customers              Tra cứu / quản lý khách                (STAFF xem, ADMIN khóa/mở)
/customers/:id          Chi tiết khách + đơn gần nhất          (STAFF, ADMIN)
/admin/court-types      Loại sân                               (ADMIN)
/admin/courts           Sân                                    (ADMIN)
/admin/time-slots       Khung giờ                              (ADMIN)
/admin/prices           Bảng giá (ma trận)                     (ADMIN)
/admin/staff            Tài khoản nhân viên                    (ADMIN)
/admin/services         Danh mục dịch vụ                       (ADMIN)
/admin/reports          Báo cáo                                (ADMIN)
/profile                Hồ sơ, đổi mật khẩu                    (STAFF, ADMIN)
```

| Trang | Component chính | FN | API |
|---|---|---|---|
| Đăng nhập | `LoginPage` | STF-01 | `POST /auth/login` |
| Dashboard | `DashboardPage` (widget: chờ thanh toán, chờ hoàn tiền, yêu cầu dịch vụ chờ giao, **đơn quá giờ chưa xử lý**) | STF-02 | `GET /staff/dashboard` |
| Lịch sân | `SchedulePage`, `ScheduleGrid`, `DatePicker` | STF-03 | `GET /staff/schedule` |
| Danh sách đơn | `BookingListPage`, `BookingFilters` | STF-04 | `GET /staff/bookings` |
| Đặt tại quầy | `CounterBookingPage`, `SlotSelector`, `CustomerSearchBox` | STF-05 | `GET /courts`, **`GET /staff/courts/:id/availability`**, `GET /staff/customers?keyword=`, `POST /staff/bookings` |
| Chi tiết đơn | `BookingDetailPage`, `PaymentModal`, `CancelModal` (có ô `refundInfo`), **`InvoicePanel`**, `AddServiceModal`, `ServicePaymentModal`, `CloseWithDebtModal` (ADMIN) | STF-04..08, STF-12..14, ADM-09 | `POST /admin/bookings/:id/close-with-debt`, `GET /staff/bookings/:id`, `GET .../invoice`, `POST .../service-orders`, `POST .../service-payments`, `POST /staff/service-order-items/:id/return`, các `POST` hành động |
| Chờ hoàn tiền | `RefundListPage` (hiện **thông tin nhận tiền hoàn**) | STF-09 | `GET /staff/refunds`, `POST .../confirm-refund` |
| Yêu cầu dịch vụ | `ServiceOrderQueuePage`, `ServiceOrderCard` | STF-11, STF-15 | `GET /staff/service-orders`, `POST .../deliver`, `POST .../cancel`, `PATCH /staff/services/:id/availability` |
| Khách hàng | `CustomerListPage`, `CustomerDetailPage` (admin: khóa/mở, **đặt lại mật khẩu**) | STF-10, ADM-06 | `GET /staff/customers`, `/admin/customers`, `POST /admin/customers/:id/reset-password` |
| Loại sân / Sân / Khung giờ | `CrudTable` + `FormModal` | ADM-01..03 | `/admin/court-types`, `/admin/courts`, `/admin/time-slots` |
| Bảng giá | `PriceMatrixPage` | ADM-04 | `/admin/slot-prices` |
| Nhân viên | `StaffListPage` | ADM-05 | `/admin/staff` |
| Dịch vụ | `ServiceCatalogPage` (CrudTable) | ADM-08 | `/admin/services` |
| Báo cáo | `ReportsPage` | ADM-07 | `/admin/reports/*` |

**Phân quyền giao diện (Role guard):** component `<RequireRole roles={['ADMIN']}>` bọc các route `/admin/*`; menu ẩn mục không đủ quyền; nhưng quyền thật vẫn do server chặn (`403 FORBIDDEN`).

### Wireframe: Lịch lưới sân

```
┌ Lịch sân ──────────  [◀] 03/10/2026 [▶]  [Hôm nay] [Tải lại] ──┐
│ Giờ        │ Sân 5A        │ Sân 5B        │ CL1  │ CL2 (bảo trì)│
│ 06:00-07:00│ (trống)       │ (trống)       │ ...  │  ▒▒▒▒▒▒▒▒▒   │
│ ...        │               │               │      │              │
│ 18:00-19:00│ ■ Anh Tuấn    │ (trống)       │      │  ▒▒▒▒▒▒▒▒▒   │
│            │   Đã xác nhận │               │      │              │
│ 19:00-20:00│ ■ Nguyễn A    │               │      │              │
│            │   Chờ thanh toán (đếm ngược)  │      │              │
└────────────────────────────────────────────────────────────────────┘
Nhấp ô trống → /bookings/new (điền sẵn sân, ngày, giờ). Nhấp ô có đơn → /bookings/:id.
```

## 3. Hành động cho phép theo trạng thái (hiển thị nút trên chi tiết đơn)

| Trạng thái | payment_status | Nút hiển thị (Web, nhân viên) |
|---|---|---|
| `PENDING` | `UNPAID` | Ghi nhận thanh toán, Hủy đơn |
| `CONFIRMED` | `UNPAID` | Ghi nhận thanh toán, Hủy đơn, No-show (khi đã đến giờ) |
| `CONFIRMED` | `PAID` | Hoàn thành (khi đã đến giờ), No-show (khi đã đến giờ), Hủy đơn |
| `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW` | bất kỳ | Chỉ xem (nếu hủy mà `PAID`, có liên kết sang Chờ hoàn tiền) |

Mobile (khách): chỉ có nút **Hủy** khi `canCancel = true`, nút **Đánh giá** khi `COMPLETED` và chưa đánh giá, nút **Gọi dịch vụ** khi `canOrderService = true`, nút **Xem hóa đơn** với đơn `CONFIRMED`/`COMPLETED`.

**Khối "Dịch vụ & hóa đơn" trên chi tiết đơn (Web, nhân viên)** — chỉ hiện khi đơn `CONFIRMED` hoặc `COMPLETED`:

| Thành phần | Điều kiện hiển thị |
|---|---|
| Danh sách yêu cầu dịch vụ + trạng thái | Luôn (khi có) |
| Nút **Thêm dịch vụ** | Đơn `CONFIRMED` |
| Nút **Đã giao** / **Hủy** từng yêu cầu | Yêu cầu `REQUESTED` (hủy `DELIVERED` theo BR-25) |
| Nút **Đã nhận lại** từng đồ thuê | Dòng `RENTAL` thuộc yêu cầu `DELIVERED`, chưa trả |
| Nút **Thu tiền dịch vụ** | `serviceBalance > 0` và đơn `CONFIRMED` |
| Nút **Hoàn thành** | Chỉ bật khi thỏa BR-12 và BR-28; nếu chưa đủ, hiện lý do (còn yêu cầu chờ giao / còn đồ chưa trả / còn thiếu tiền) |
| Nút **Đóng đơn có công nợ** (chỉ ADMIN) | Đơn `CONFIRMED`, đã đến giờ bắt đầu, và `Hoàn thành` đang bị chặn vì thiếu tiền/đồ thuê, hoặc đã có dịch vụ giao nên không thể hủy/no-show; bắt buộc nhập lý do (BR-33) |

## 4. Quy ước giao diện (thay file `06-css-rules.md`)

### 4.1 Nguyên tắc
- Giao diện **đơn giản, nhất quán**; ưu tiên dễ đọc hơn trang trí.
- Web: **CSS thuần với CSS Variables + CSS Modules** (hoặc một file CSS toàn cục theo component). Không bắt buộc UI framework. Nếu quá thiếu thời gian có thể dùng Ant Design cho bảng/form, nhưng phải dùng thống nhất cả project.
- Mobile: `StyleSheet` của React Native, tách `theme.ts` dùng chung màu/spacing.
- Không dùng màu cứng rải rác; mọi màu lấy từ biến theme.

### 4.2 Design tokens (dùng chung Web và Mobile)

| Token | Giá trị gợi ý |
|---|---|
| `--color-primary` | `#16a34a` (xanh lá, hợp thể thao) |
| `--color-primary-dark` | `#15803d` |
| `--color-bg` | `#f8fafc` |
| `--color-surface` | `#ffffff` |
| `--color-text` | `#0f172a` |
| `--color-muted` | `#64748b` |
| `--color-border` | `#e2e8f0` |
| `--color-danger` | `#dc2626` |
| `--radius` | `8px` |
| Spacing | bội của 4: `4, 8, 12, 16, 24, 32` |
| Font | System UI (Web: `system-ui, sans-serif`); cỡ chữ nội dung 14–16px |

### 4.3 Màu trạng thái (bắt buộc dùng thống nhất ở mọi màn hình)

| Trạng thái | Nhãn tiếng Việt | Màu |
|---|---|---|
| `PENDING` | Chờ thanh toán | Vàng `#f59e0b` |
| `CONFIRMED` | Đã xác nhận | Xanh dương `#2563eb` |
| `COMPLETED` | Hoàn thành | Xanh lá `#16a34a` |
| `CANCELLED` | Đã hủy | Xám `#6b7280` |
| `EXPIRED` | Hết hạn | Xám nhạt `#9ca3af` |
| `NO_SHOW` | Vắng mặt | Đỏ `#dc2626` |
| `UNPAID` | Chưa thanh toán | Vàng |
| `PAID` | Đã thanh toán | Xanh lá |
| `REFUNDED` | Đã hoàn tiền | Tím `#7c3aed` |
| Yêu cầu dịch vụ `REQUESTED` | Chờ giao | Vàng `#f59e0b` |
| Yêu cầu dịch vụ `DELIVERED` | Đã giao | Xanh lá `#16a34a` |
| Yêu cầu dịch vụ `CANCELLED` | Đã hủy | Xám `#6b7280` |
| Đồ thuê chưa trả | Chưa trả | Cam `#ea580c` |
| Slot `AVAILABLE` | Trống | Trắng, viền xanh |
| Slot `BOOKED`/`PAST`/`NO_PRICE` | Hết chỗ / Đã qua / Chưa có giá | Xám, không bấm được |
| Slot `MAINTENANCE` | Bảo trì | Xám sọc |

Dùng một component `StatusBadge` dùng chung (map trạng thái → nhãn + màu), không tự viết lại từng nơi.

### 4.4 Thành phần chung (Web)
`AppLayout` (sidebar + header + vùng nội dung), `DataTable` (phân trang, loading, rỗng), `FormModal`, `ConfirmDialog`, `StatusBadge`, `Money` (định dạng VND), `Toast` (thành công/lỗi), `RequireRole`, `Loading`, `ErrorState` (có nút Thử lại), `InvoicePanel`, `ServiceOrderCard`.

### 4.5 Thành phần chung (Mobile)
`Screen` (SafeArea + nền), `Button`, `TextField`, `CourtCard`, `SlotChip`, `DateStrip`, `StatusBadge`, `Money`, `EmptyState`, `ErrorState`, `ServiceCard` (ảnh, giá, bộ chọn số lượng), `CartBar` (tạm tính + nút gửi), `InvoiceView`.

### 4.6 Quy tắc UX bắt buộc
- **Tự làm mới 30 giây khi màn hình đang mở** (hằng số `POLL_INTERVAL_MS = 30000`): Web — Lịch sân, Yêu cầu dịch vụ, Dashboard, chi tiết đơn `PENDING`; Mobile — chi tiết đơn `PENDING`, Hóa đơn. Dừng khi rời màn hình/ứng dụng ở nền. Danh sách **Lịch đặt** (Mobile) và **Danh sách đơn** (Web) còn **tải lại mỗi khi tab/màn hình được focus**. Cộng thêm nút "Tải lại"/kéo để làm mới.
- Mọi nút gửi dữ liệu: **disable + hiện loading** khi đang gọi API (chống bấm đúp).
- Hành động nguy hiểm (hủy đơn, khóa tài khoản, đổi trạng thái sân): luôn có hộp xác nhận.
- Lỗi từ server hiển thị `message` tiếng Việt; lỗi validate hiển thị dưới từng ô.
- Hủy đơn đã thanh toán (Mobile và Web): hộp thoại hiện ô **"Thông tin nhận tiền hoàn"** (bắt buộc với khách, BR-34).
- `409 SLOT_TAKEN`: báo "Khung giờ vừa có người đặt", tự tải lại lịch trống và bỏ chọn.
- Tiền: `150.000 ₫`; ngày: `dd/MM/yyyy`; giờ: `HH:mm`.
- Responsive: Web hỗ trợ ≥ 1024px (admin); không bắt buộc tối ưu mobile web.
