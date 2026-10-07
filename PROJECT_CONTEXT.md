# TÀI LIỆU NGỮ CẢNH KỸ THUẬT VÀ NGUỒN SỰ THẬT TRUNG TÂM (PROJECT CONTEXT)
## HỆ THỐNG QUẢN LÝ VÀ ĐẶT LỊCH SÂN THỂ THAO 24/7 (SPORT BOOKING SYSTEM)
### Phiên Bản Kỹ Thuật: 1.3 (Nâng Cấp Quản Lý Tồn Kho, Chuẩn Hóa Phân Quyền RBAC & Mô Hình Hóa UML Toàn Diện)

> **MỤC ĐÍCH TÀI LIỆU NGUỒN SỰ THẬT (CENTRAL SOURCE OF TRUTH):**
> Tài liệu này là bản đặc tả kỹ thuật và nghiệp vụ chính xác nhất, phản ánh trung thực 100% hiện trạng mã nguồn máy chủ (Backend), cơ sở dữ liệu (MySQL 8.0+), cổng quản trị vận hành (Web Admin) và ứng dụng di động (Mobile App). 
> Mọi thành phần trong tài liệu được thiết kế chuyên sâu để làm căn cứ tiên quyết và duy nhất cho việc sinh trực tiếp chuỗi tài liệu thiết kế phần mềm tiêu chuẩn:
> **Requirement → Business Rule → Actor → Use Case → Use Case Decomposition → Use Case Specification → Activity Diagram → Sequence Diagram → State Diagram → Class Diagram → ERD → API → UI → Test Case.**
> Tuyệt đối không để kỹ sư phân tích hoặc người vẽ sơ đồ UML phải tự suy đoán bất kỳ quy tắc nghiệp vụ, quan hệ đối tượng hay ràng buộc dữ liệu nào.

---

# MỤC LỤC CHI TIẾT (50 PHẦN CHUẨN HÓA THEO MASTER PROMPT)

1. [Tổng Quan Nghiệp Vụ](#1-tổng-quan-nghiệp-vụ)
2. [Phạm Vi Hệ Thống](#2-phạm-vi-hệ-thống)
3. [Các Tác Nhân Nghiệp Vụ (Actors)](#3-các-tác-nhân-nghiệp-vụ-actors)
4. [Mô Hình Phân Quyền Dựa Trên Vai Trò (RBAC)](#4-mô-hình-phân-quyền-dựa-trên-vai-trò-rbac)
5. [Nguyên Tắc An Toàn Nghiệp Vụ & Bảo Mật (Security Rules)](#5-nguyên-tắc-an-toàn-nghiệp-vụ--bảo-mật-security-rules)
6. [Kiến Trúc Hệ Thống (Architecture)](#6-kiến-trúc-hệ-thống-architecture)
7. [Ngăn Xếp Công Nghệ Thực Tế (Tech Stack)](#7-ngăn-xếp-công-nghệ-thực-tế-tech-stack)
8. [Cấu Trúc Mô-đun Hệ Thống (Modules)](#8-cấu-trúc-mô-đun-hệ-thống-modules)
9. [Tổng Quan Cơ Sở Dữ Liệu (Database Overview)](#9-tổng-quan-cơ-sở-dữ-liệu-database-overview)
10. [Chi Tiết Lược Đồ 15 Bảng Cơ Sở Dữ Liệu (Detailed Database Schema)](#10-chi-tiết-lược-đồ-15-bảng-cơ-sở-dữ-liệu-detailed-database-schema)
11. [Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)](#11-sơ-đồ-thực-thể-quan-hệ-entity-relationship-diagram---erd)
12. [Bảng Ánh Xạ Bảng CSDL Sang Entity Class (Entity-Class Mapping)](#12-bảng-ánh-xạ-bảng-csdl-sang-entity-class-entity-class-mapping)
13. [Mô Hình Lớp Miền Khái Niệm (Class Model)](#13-mô-hình-lớp-miền-khái-niệm-class-model)
14. [Trách Nhiệm Cốt Lõi Của Các Lớp (Class Responsibilities)](#14-trách-nhiệm-cốt-lõi-của-các-lớp-class-responsibilities)
15. [Mối Quan Hệ Giữa Các Lớp (Class Relationships)](#15-mối-quan-hệ-giữa-các-lớp-class-relationships)
16. [Bội Số Quan Hệ (Multiplicity Matrix)](#16-bội-số-quan-hệ-multiplicity-matrix)
17. [Vai Trò Liên Kết Ngữ Cảnh (Association Roles)](#17-vai-trò-liên-kết-ngữ-cảnh-association-roles)
18. [Quan Hệ Hợp Thành Và Thu Nạp (Composition & Aggregation)](#18-quan-hệ-hợp-thành-và-thu-nạp-composition--aggregation)
19. [Danh Mục Kiểu Liệt Kê Nghiệp Vụ (Enumerations)](#19-danh-mục-kiểu-liệt-kê-nghiệp-vụ-enumerations)
20. [Quy Trình Nghiệp Vụ Đặt Lịch Sân (Booking Flow)](#20-quy-trình-nghiệp-vụ-đặt-lịch-sân-booking-flow)
21. [Quy Trình Thanh Toán (Payment Flow)](#21-quy-trình-thanh-toán-payment-flow)
22. [Quy Trình Hoàn Tiền (Refund Flow)](#22-quy-trình-hoàn-tiền-refund-flow)
23. [Quy Trình Phục Vụ Dịch Vụ Tại Sân (Service Flow)](#23-quy-trình-phục-vụ-dịch-vụ-tại-sân-service-flow)
24. [Quy Trình Quản Lý Cho Thuê Dụng Cụ (Rental Flow)](#24-quy-trình-quản-lý-cho-thuê-dụng-cụ-rental-flow)
25. [Hiện Trạng Triển Khai Gói Dịch Vụ (Package Module)](#25-hiện-trạng-triển-khai-gói-dịch-vụ-package-module)
26. [Mô Hình Đặt Khu Vực Sự Kiện (Event Booking Model)](#26-mô-hình-đặt-khu-vực-sự-kiện-event-booking-model)
27. [Hệ Thống Quản Lý Tồn Kho Thực Tế (Inventory Module)](#27-hệ-thống-quản-lý-tồn-kho-thực-tế-inventory-module)
28. [Quy Trình Tính Toán Hóa Đơn Động (Dynamic Invoice Calculation)](#28-quy-trình-tính-toán-hóa-đơn-động-dynamic-invoice-calculation)
29. [Đặc Quyền Đóng Đơn Có Công Nợ (Debt Write-Off Privilege)](#29-đặc-quyền-đóng-đơn-có-công-nợ-debt-write-off-privilege)
30. [Tiến Trình Chạy Ngầm Tự Động (Scheduler Background Job)](#30-tiến-trình-chạy-ngầm-tự-động-scheduler-background-job)
31. [Danh Mục Quy Tắc Nghiệp Vụ Toàn Diện (Business Rules BR-01 → BR-42)](#31-danh-mục-quy-tắc-nghiệp-vụ-toàn-diện-business-rules-br-01--br-42)
32. [Ma Trận Chuyển Đổi Trạng Thái Thực Thể (State Transition Matrix)](#32-ma-trận-chuyển-đổi-trạng-thái-thực-thể-state-transition-matrix)
33. [Đặc Tả Luồng Hoạt Động (21 Activity Flow Specifications)](#33-đặc-tả-luồng-hoạt-động-21-activity-flow-specifications)
34. [Đặc Tả Luồng Tương Tác Tuần Tự (Sequence Flow Specifications)](#34-đặc-tả-luồng-tương-tác-tuần-tự-sequence-flow-specifications)
35. [Danh Mục Giao Diện Lập Trình Ứng Dụng (API Endpoints Catalog)](#35-danh-mục-giao-diện-lập-trình-ứng-dụng-api-endpoints-catalog)
36. [Quy Chuẩn Kiểm Định Dữ Liệu Đầu Vào (Zod Validation)](#36-quy-chuẩn-kiểm-định-dữ-liệu-đầu-vào-zod-validation)
37. [Danh Mục Mã Lỗi Nghiệp Vụ Chuẩn Hóa (Standardized Error Codes)](#37-danh-mục-mã-lỗi-nghiệp-vụ-chuẩn-hóa-standardized-error-codes)
38. [Ranh Giới Giao Dịch Dữ Liệu (Transaction Boundaries)](#38-ranh-giới-giao-dịch-dữ-liệu-transaction-boundaries)
39. [Kiểm Soát Xung Đột Đồng Thời (Concurrency Control Strategy)](#39-kiểm-soát-xung-đột-đồng-thời-concurrency-control-strategy)
40. [Giao Diện Cổng Quản Trị Web (Web Admin Portal)](#40-giao-diện-cổng-quản-trị-web-web-admin-portal)
41. [Giao Diện Ứng Dụng Di Động (Mobile Application)](#41-giao-diện-ứng-dộng-di-động-mobile-application)
42. [Ma Trận Phân Quyền Actor – Use Case (Actor–Use Case Matrix)](#42-ma-trận-phân-quyền-actor--use-case-actoruse-case-matrix)
43. [Cây Phân Rã Use Case Chi Tiết (Use Case Decomposition)](#43-cây-phân-rã-use-case-chi-tiết-use-case-decomposition)
44. [Ma Trận Ánh Xạ Use Case – Class – Table – API](#44-ma-trận-ánh-xạ-use-case--class--table--api)
45. [Danh Mục Kịch Bản Kiểm Thử Tự Động (Test Cases Catalog)](#45-danh-mục-kịch-bản-kiểm-thử-tự-động-test-cases-catalog)
46. [Báo Cáo Kết Quả Kiểm Thử Thực Tế (Automated Test Execution Results)](#46-báo-cáo-kết-quả-kiểm-thử-thực-tế-automated-test-execution-results)
47. [Quy Chuẩn Di Chuyển Lược Đồ CSDL (Database Migrations)](#47-quy-chuẩn-di-chuyển-lược-đồ-csdl-database-migrations)
48. [Chiến Lược Khởi Tạo Dữ Liệu Mẫu (Database Seeding)](#48-chiến-lược-khởi-tạo-dữ-liệu-mẫu-database-seeding)
49. [Giới Hạn Hệ Thống & Khuyến Nghị Sản Phẩm (System Limitations)](#49-giới-hạn-hệ-thống--khuyến-nghị-sản-phẩm-system-limitations)
50. [Ma Trận Truy Xuất Nguồn Gốc Nghiệp Vụ Toàn Diện (Traceability Matrix)](#50-ma-trận-truy-xuất-nguồn-gốc-nghiệp-vụ-toàn-diện-traceability-matrix)

---

# 1. TỔNG QUAN NGHIỆP VỤ

Hệ thống **"Quản Lý Và Đặt Lịch Sân Thể Thao 24/7" (Sport Booking System)** phục vụ bài toán số hóa toàn diện quy trình kinh doanh và điều hành cho một cơ sở thể thao phức hợp đa năng. Cơ sở quản lý đồng thời:
1. **Sân bóng đá mini** (sân cỏ nhân tạo 5 người / 7 người).
2. **Sân cầu lông** (sàn thảm tiêu chuẩn thi đấu).
3. **Sân tennis** (mặt sân cứng tiêu chuẩn quốc tế).
4. **Sân bóng rổ** (sân trong nhà và ngoài trời).
5. **Khu vực tổ chức sự kiện / tiệc** (phòng hội họp thể thao, khu tiệc BBQ ngoài trời, sinh nhật câu lạc bộ).

Hệ thống kết nối mượt mà giữa ứng dụng di động cho khách hàng, cổng web điều hành thời gian thực cho nhân viên và bảng điều khiển quản trị chuyên sâu cho người quản lý, hỗ trợ đặt sân từ xa, đặt sân trực tiếp tại quầy, phục vụ đồ uống, dụng cụ thể thao cho thuê và tự động hóa quản lý kho chống thất thoát.

---

# 2. PHẠM VI HỆ THỐNG

### Trong phạm vi (In Scope):
- Đặt sân theo khung giờ cố định (60 phút / slot), cho phép chọn từ 1 đến 3 khung giờ liên tiếp trong ngày, tối đa trước 14 ngày.
- Cơ chế giữ chỗ tạm thời (Hold) 30 phút đối với phương thức chuyển khoản ngân hàng qua mã QR động (VietQR).
- Ngăn chặn hoàn toàn việc đặt trùng lịch (Double Booking) và tranh chấp tài nguyên đồng thời (Race Condition).
- Bán đồ uống giải khát (DRINK), cho thuê đồ dùng tập luyện (RENTAL) và đặt gói dịch vụ (PACKAGE).
- Theo dõi vòng đời dụng cụ thuê: giao hàng, ghi nhận người giao, xác nhận trả đồ, hoàn tồn kho tự động.
- Quản lý tồn kho thực tế: số lượng tổng (`so_luong`), số lượng đang giữ (`so_luong_dang_giu`), số lượng khả dụng (`availableQuantity = so_luong - so_luong_dang_giu`), ngưỡng cảnh báo (`nguong_canh_bao`) và truy vết toàn diện biến động kho (`bien_dong_kho`).
- Tổng hợp hóa đơn động theo thời gian thực (Dynamic Real-Time Invoice).
- Quy trình hủy đơn và hoàn tiền có kiểm soát thời gian biên (>= 6 giờ trước giờ bắt đầu thi đấu).
- Lối thoát tài chính: Quản trị viên đóng đơn có công nợ (Debt Write-Off) khi khách hàng bỏ về mà không thanh toán.
- Quét tự động ngầm định kỳ 30 giây để hủy các đơn PENDING quá hạn và giải phóng slot, hoàn tồn kho.

### Ngoài phạm vi (Out of Scope):
- Tích hợp cổng thanh toán trực tiếp qua thẻ tín dụng quốc tế (Visa/Mastercard Payment Gateway SDK).
- Đăng nhập qua mạng xã hội của bên thứ ba (Google OAuth, Facebook Login, Apple Sign-In).
- Tính năng ghép đội tự do (Matchmaking / Social Community Feed).
- Quản lý lương thưởng và chấm công nhân viên chuyên sâu (HRM/Payroll).

---

# 3. CÁC TÁC NHÂN NGHIỆP VỤ (ACTORS)

Hệ thống có đúng 4 tác nhân nghiệp vụ:

### 1. CUSTOMER (Khách Hàng)
- **Kênh tương tác:** Ứng dụng Di động (Mobile App - React Native Expo).
- **Trách nhiệm:** Tra cứu sân, xem lịch trống, đặt sân, thanh toán chuyển khoản, gọi dịch vụ ra sân, hủy dịch vụ REQUESTED, theo dõi hóa đơn, đánh giá chất lượng sân (COMPLETED).
- **Ranh giới:** Chỉ có quyền đọc và ghi trên tài nguyên thuộc quyền sở hữu của chính mình (Ownership Rule). Tuyệt đối không thấy số lượng tồn kho nội bộ, ngưỡng cảnh báo hay thông tin nhân viên xử lý.

### 2. STAFF (Nhân Viên Vận Hành Tại Quầy)
- **Kênh tương tác:** Cổng Quản trị Web (Web Admin Portal).
- **Trách nhiệm:** Vận hành tại quầy lễ tân, xem dashboard số liệu hôm nay, xem lịch lưới sân, đặt sân cho khách vãng lai, ghi nhận thanh toán tiền mặt/chuyển khoản, giao dịch vụ ra sân, xác nhận thu hồi đồ thuê (Return Rental), hủy đơn thay khách theo quy tắc, xác nhận hoàn tiền đã được Admin duyệt, xem số lượng tồn kho khả dụng để phục vụ vận hành.
- **Ranh giới:** **KHÔNG CÓ QUYỀN QUẢN TRỊ HỆ THỐNG.** Bị cấm hoàn toàn đối với việc quản lý loại sân, cấu hình sân, sửa giá giờ, quản lý tài khoản nhân viên, khóa tài khoản, đóng đơn công nợ (Write-off debt), nhập kho (IMPORT), điều chỉnh kiểm kê (ADJUST), hoặc can thiệp lịch sử tài chính.

### 3. ADMIN (Quản Trị Viên Hệ Thống)
- **Kênh tương tác:** Cổng Quản trị Web (Web Admin Portal).
- **Trách nhiệm:** Sở hữu toàn quyền cấu hình dữ liệu danh mục hệ thống: tạo/sửa loại sân, chuyển đổi mục đích sân, cấu hình khung giờ, ma trận bảng giá giờ thường/cuối tuần/cao điểm, tạo và quản lý dịch vụ niêm yết, tạo/khóa/đặt lại mật khẩu nhân viên, khóa khách hàng gian lận, nhập kho (IMPORT), điều chỉnh tồn kho (ADJUST_IN, ADJUST_OUT), cấu hình ngưỡng cảnh báo kho, xem toàn bộ lịch sử biến động kho kiểm toán, xem báo cáo doanh thu & tỷ lệ lấp đầy sân, thực hiện đặc quyền đóng đơn có công nợ (Write-off debt).
- **Ranh giới an toàn:** Không được tự khóa tài khoản của chính mình (ADM-04) và hệ thống luôn bắt buộc duy trì tối thiểu một tài khoản ADMIN đang ACTIVE.

### 4. SCHEDULER (Tiến Trình Chạy Ngầm Hệ Thống)
- **Bản chất:** Tiến trình hệ thống chạy ngầm trong Node.js (Background Daemon Job), không phải người dùng, không có bản ghi trong bảng `nguoi_dung`.
- **Trách nhiệm:** Quét định kỳ mỗi 30 giây: tìm các đơn PENDING đã quá thời hạn giữ chỗ (`het_han_luc < NOW()`), chuyển sang trạng thái `EXPIRED`, nhả slot (`dang_khoa = NULL`), tự động giải phóng tồn kho đã giữ chỗ (RELEASE stock) và ghi nhật ký trạng thái.

---

# 4. MÔ HÌNH PHÂN QUYỀN DỰA TRÊN VAI TRÒ (RBAC)

Hệ thống áp dụng mô hình phân quyền chặt chẽ 3 cấp (`CUSTOMER`, `STAFF`, `ADMIN`):

```
                     +---------------------------------------+
                     |         NGƯỜI DÙNG XÁC THỰC           |
                     |           (JWT Payload)               |
                     +-------------------+-------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
   [ CUSTOMER ]                      [ STAFF ]                       [ ADMIN ]
         |                               |                               |
  - /api/v1/bookings/*           - /api/v1/staff/*               - /api/v1/admin/*
  - /api/v1/services             - /api/v1/courts/*              - /api/v1/staff/* (Thừa kế)
  - /api/v1/auth/me              - /api/v1/services              - /api/v1/courts/*
  (Chỉ dữ liệu sở hữu)           (Vận hành tại quầy)             (Toàn quyền hệ thống)
```

### Quy tắc kế thừa phân quyền:
- `ADMIN` được phép truy cập tất cả endpoint của `STAFF` (để hỗ trợ vận hành khi cần).
- `STAFF` bị cấm tuyệt đối tại tất cả endpoint của `ADMIN` (HTTP 403 Forbidden).
- `CUSTOMER` bị cấm tại tất cả endpoint của `STAFF` và `ADMIN` (HTTP 403 Forbidden).
- Khách vãng lai chưa đăng nhập chỉ được truy cập các endpoint công khai (Public): `/auth/login`, `/auth/register`, `/courts`, `/court-types`, `/time-slots`, `/slot-prices`, `/services`.

---

# 5. NGUYÊN TẮC AN TOÀN NGHIỆP VỤ & BẢO MẬT (SECURITY RULES)

1. **Authorization Bắt Buộc Ở Backend:** Không bao giờ dựa vào việc ẩn nút bấm trên giao diện Web Admin hay Mobile App. Mọi yêu cầu HTTP gửi đến API đều phải đi qua Middleware `xacThuc` (kiểm tra JWT hợp lệ, chưa hết hạn, tài khoản đang ACTIVE) và Middleware `choPhepVaiTro` (kiểm tra Role).
2. **Quy Tắc Sở Hữu Tài Nguyên (Resource Ownership Rule):** Khách hàng A không bao giờ được phép xem, hủy đơn hay gọi dịch vụ cho đơn đặt của Khách hàng B. Vi phạm trả về `404 NOT_FOUND` hoặc `403 FORBIDDEN`.
3. **STAFF Không Có Quyền Quản Trị Hệ Thống:** Mọi hành vi cố tình gọi trực tiếp vào API Admin từ tài khoản Staff đều bị chặn với mã `403 FORBIDDEN`.
4. **Bảo Vệ Thao Tác Nguy Hiểm Cao (High-Risk Operations):** Sửa giá, điều chỉnh tồn kho, khóa tài khoản, đóng đơn công nợ chỉ thuộc về `ADMIN`, yêu cầu giao dịch dữ liệu ACID và ghi vết kiểm toán.
5. **Vô Hiệu Hóa Token Tức Thì Khi Bị Khóa:** Khi một tài khoản bị chuyển sang trạng thái `LOCKED`, Middleware xác thực truy vấn trạng thái thực tế trong cơ sở dữ liệu và từ chối ngay lập tức ở request kế tiếp (`403 ACCOUNT_LOCKED`), không chờ JWT hết hạn.
6. **Bất Biến Tài Khoản Admin Tối Thiểu:** Hệ thống chặn đứng hành vi Admin tự khóa chính mình hoặc khóa tài khoản Admin duy nhất còn lại của cơ sở (`409 CANNOT_LOCK_SELF`).

---

# 6. KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Phân tầng hướng dịch vụ (Layered Service-Oriented Architecture)**:

```
[ Mobile App (Customer) ]          [ Web Admin (Staff / Admin) ]
           \                                    /
            \--- HTTPS / JSON RESTful API -----/
                             |
                     [ Nginx Reverse Proxy ]
                             |
                   [ Express.js App Layer ]
      +----------------------------------------------+
      | 1. Middleware Pipeline (CORS, JWT, RBAC, Zod)|
      | 2. Controller Layer (Parse req, Send res)    |
      | 3. Service Layer (Pure Business Rules, SQL)  |
      | 4. Database Transaction Helper (voiGiaoDich) |
      | 5. Background Jobs (Scheduler 30s)           |
      +----------------------------------------------+
                             |
             [ MySQL Connection Pool (mysql2) ]
                             |
                 [ MySQL 8.0 Database Layer ]
```

---

# 7. NGĂN XẾP CÔNG NGHỆ THỰC TẾ (TECH STACK)

- **Backend Runtime:** Node.js (LTS >= 18.x) thực thi trên Windows Server / Linux.
- **Ngôn ngữ:** TypeScript 5.9.3, Strict Mode kích hoạt 100%.
- **Framework:** Express.js 5.2.1.
- **Database Driver:** `mysql2/promise` (3.14.0) với Bể kết nối (Connection Pool: 10 kết nối, hỗ trợ `enableKeepAlive`).
- **Xác thực & Mã hóa:** `jsonwebtoken` 9.0.3 (JWT thời hạn 24h), `bcryptjs` 3.0.3 (Cost Factor = 10).
- **Kiểm định dữ liệu:** `zod` 4.0.0.
- **Kiểm thử tự động:** Jest 30.5.2, `ts-jest`, `supertest` 7.3.1.
- **Cơ sở dữ liệu:** MySQL Community Server 8.0+, bảng mã `utf8mb4_unicode_ci`, Storage Engine `InnoDB`.
- **Frontend Web Admin:** HTML5, Vanilla JavaScript ES6+, Vanilla CSS (CSS Variables, Flexbox, CSS Grid).
- **Mobile Application:** React Native / Expo SDK, React Navigation.

---

# 8. CẤU TRÚC MÔ-ĐUN HỆ THỐNG (MODULES)

```
backend/
├── src/
│   ├── config/          # Cấu hình CSDL (csdl.ts), Môi trường (moitruong.ts), Hằng số nghiệp vụ (nghiepvu.ts)
│   ├── controllers/     # Điều phối HTTP: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc
│   ├── services/        # Nghiệp vụ cốt lõi: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc
│   ├── routes/          # Khai báo tuyến đường API: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc
│   ├── middlewares/     # Bộ lọc: xacthuc, phanquyen, kiemtra (Zod), loi (Error Handler)
│   ├── validators/      # Định nghĩa Schema kiểm tra dữ liệu bằng Zod
│   ├── jobs/            # Tiến trình chạy ngầm: hethan-dondat.job.ts
│   ├── types/           # Định nghĩa Typescript Interfaces & Types
│   └── utils/           # Tiện ích: giaodich, nhatky, hoadon, thoigian, phanhoi, loi
├── public/admin/        # Web Admin Portal (index.html, admin.js)
├── database/            # schema.sql (15 bảng), seed.sql (dữ liệu mẫu ban đầu)
└── tests/               # 10 test suites kiểm thử tự động toàn diện
```

---

# 9. TỔNG QUAN CƠ SỞ DỮ LIỆU (DATABASE OVERVIEW)

Cơ sở dữ liệu gồm đúng **15 bảng chuẩn hóa**, đặt tên tiếng Việt không dấu theo chuẩn `snake_case`:
1. `nguoi_dung`: Lưu thông tin tài khoản (Customer, Staff, Admin).
2. `loai_san`: Phân loại sân (SPORT, EVENT).
3. `san`: Danh sách các sân thể thao và mặt bằng tổ chức sự kiện.
4. `khung_gio`: Danh mục 15 khung giờ chuẩn (06:00 -> 21:00).
5. `gia_khung_gio`: Bảng ma trận giá giờ thường và cuối tuần.
6. `don_dat`: Thực thể giao dịch đặt sân trung tâm.
7. `chi_tiet_khung_gio_dat`: Khóa chống trùng lịch và danh sách khung giờ đặt.
8. `thanh_toan`: Nhật ký giao dịch tài chính (Thu tiền và Hoàn tiền).
9. `nhat_ky_trang_thai_don`: Lịch sử kiểm toán chuyển đổi trạng thái đơn đặt.
10. `danh_gia`: Đánh giá chất lượng sau khi hoàn thành đơn.
11. `dich_vu`: Danh mục dịch vụ niêm yết (DRINK, RENTAL, PACKAGE).
12. `yeu_cau_dich_vu`: Yêu cầu gọi dịch vụ gắn với đơn sân.
13. `chi_tiet_yeu_cau_dich_vu`: Từng món dịch vụ trong một lần gọi và quản lý trả đồ thuê.
14. `ton_kho_dich_vu`: Quản lý số lượng tồn thực tế, số lượng đang giữ và ngưỡng cảnh báo.
15. `bien_dong_kho`: Nhật ký biến động kho phục vụ kiểm toán minh bạch.

---

# 10. CHI TIẾT LƯỢC ĐỒ 15 BẢNG CƠ SỞ DỮ LIỆU (DETAILED DATABASE SCHEMA)

### Bảng 1: `nguoi_dung`
- **Ý nghĩa nghiệp vụ:** Lưu trữ thông tin định danh, thông tin đăng nhập và vai trò người dùng trong hệ thống.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ho_ten`: VARCHAR(100) NOT NULL — Họ và tên người dùng.
  - `so_dien_thoai`: VARCHAR(15) NOT NULL UNIQUE — Số điện thoại đăng nhập.
  - `mat_khau_hash`: VARCHAR(255) NOT NULL — Mật khẩu băm Bcrypt.
  - `email`: VARCHAR(100) NULL UNIQUE — Địa chỉ thư điện tử.
  - `vai_tro`: ENUM('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER' — Vai trò trong hệ thống.
  - `trang_thai`: ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE' — Trạng thái hoạt động tài khoản.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_nguoi_dung_sdt` (`so_dien_thoai`), `uq_nguoi_dung_email` (`email`).
- **Chỉ mục:** `idx_nguoidung_vaitro_trangthai` (`vai_tro`, `trang_thai`).
- **Class Ánh Xạ:** `NguoiDung`.

### Bảng 2: `loai_san`
- **Ý nghĩa nghiệp vụ:** Danh mục phân loại các môn thể thao hoặc khu vực sự kiện.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ten`: VARCHAR(50) NOT NULL UNIQUE — Tên loại sân (VD: Sân bóng đá mini, Sân cầu lông).
  - `phan_loai`: ENUM('SPORT','EVENT') NOT NULL DEFAULT 'SPORT' — Phân loại sân thể thao hay khu sự kiện.
  - `gia_mac_dinh_gio`: INT UNSIGNED NOT NULL — Giá tham chiếu giờ mặc định (VND).
  - `mo_ta`: TEXT NULL.
  - `hinh_anh`: VARCHAR(500) NULL.
  - `trang_thai`: ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
- **Class Ánh Xạ:** `LoaiSan`.

### Bảng 3: `san`
- **Ý nghĩa nghiệp vụ:** Từng sân bóng, sân cầu lông hoặc mặt bằng sự kiện cụ thể của cơ sở.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `loai_san_id`: INT UNSIGNED NOT NULL (FK -> `loai_san.id`).
  - `ten`: VARCHAR(50) NOT NULL — Tên sân (VD: Sân bóng đá 1, Khu tiệc BBQ).
  - `suc_chua`: INT UNSIGNED NOT NULL DEFAULT 10 — Sức chứa tối đa (người) dùng cho cả thể thao và sự kiện.
  - `mo_ta`: TEXT NULL.
  - `hinh_anh`: VARCHAR(500) NULL.
  - `trang_thai`: ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
- **Ràng buộc duy nhất:** `uq_san_loai_ten` (`loai_san_id`, `ten`).
- **Khóa ngoại:** `fk_san_loai_san` REFERENCES `loai_san(id)`.
- **Class Ánh Xạ:** `San`.

### Bảng 4: `khung_gio`
- **Ý nghĩa nghiệp vụ:** Danh mục 15 khung giờ tiêu chuẩn cố định trong ngày từ 06:00 đến 21:00.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `gio_bat_dau`: TIME NOT NULL — Giờ bắt đầu (VD: 06:00:00).
  - `gio_ket_thuc`: TIME NOT NULL — Giờ kết thúc (VD: 07:00:00).
  - `la_gio_cao_diem`: TINYINT(1) NOT NULL DEFAULT 0 — Cờ đánh dấu giờ cao điểm.
  - `trang_thai`: ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
- **Ràng buộc duy nhất:** `uq_khung_gio_thoi_gian` (`gio_bat_dau`, `gio_ket_thuc`).
- **Ràng buộc kiểm tra (Check):** `chk_khung_gio_thoi_gian` CHECK (`gio_ket_thuc` > `gio_bat_dau`).
- **Class Ánh Xạ:** `KhungGio`.

### Bảng 5: `gia_khung_gio`
- **Ý nghĩa nghiệp vụ:** Ma trận giá theo loại sân, khung giờ và loại ngày (ngày thường / cuối tuần).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `loai_san_id`: INT UNSIGNED NOT NULL (FK -> `loai_san.id`).
  - `khung_gio_id`: INT UNSIGNED NOT NULL (FK -> `khung_gio.id`).
  - `loai_ngay`: ENUM('WEEKDAY','WEEKEND') NOT NULL — Ngày trong tuần hay Thứ Bảy/Chủ Nhật.
  - `gia`: INT UNSIGNED NOT NULL — Giá tiền niêm yết (VND).
- **Ràng buộc duy nhất:** `uq_gia_loai_khung_ngay` (`loai_san_id`, `khung_gio_id`, `loai_ngay`).
- **Class Ánh Xạ:** `GiaKhungGio`.

### Bảng 6: `don_dat`
- **Ý nghĩa nghiệp vụ:** Thực thể trung tâm quản lý giao dịch đặt sân và toàn bộ vòng đời đơn đặt.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ma_don_dat`: VARCHAR(20) NOT NULL UNIQUE — Mã đơn sinh tự động (VD: BK7A9F12C3).
  - `nguoi_dung_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Khách hàng sở hữu đơn.
  - `nguoi_tao_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Nhân viên tạo hộ tại quầy.
  - `san_id`: INT UNSIGNED NOT NULL (FK -> `san.id`) — Sân được đặt.
  - `ngay_dat`: DATE NOT NULL — Ngày thi đấu.
  - `gio_bat_dau`: TIME NOT NULL — Giờ bắt đầu chuỗi slot.
  - `gio_ket_thuc`: TIME NOT NULL — Giờ kết thúc chuỗi slot.
  - `tien_san`: INT UNSIGNED NOT NULL — Tổng tiền sân đã snapshot cố định.
  - `tien_dich_vu`: INT UNSIGNED NOT NULL DEFAULT 0 — Tổng tiền các dịch vụ đã giao (DELIVERED).
  - `phuong_thuc_thanh_toan`: ENUM('CASH','BANK_TRANSFER') NOT NULL DEFAULT 'BANK_TRANSFER'.
  - `trang_thai`: ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NOT NULL DEFAULT 'PENDING'.
  - `trang_thai_thanh_toan`: ENUM('UNPAID','PARTIALLY_PAID','PAID','REFUND_PENDING','REFUNDED') NOT NULL DEFAULT 'UNPAID'.
  - `nguon_don`: ENUM('APP','WALK_IN') NOT NULL DEFAULT 'APP'.
  - `ten_khach_vang_lai`: VARCHAR(100) NULL.
  - `so_dien_thoai_khach`: VARCHAR(15) NULL.
  - `ghi_chu`: VARCHAR(500) NULL.
  - `ly_do_huy`: VARCHAR(500) NULL.
  - `dong_don_cong_no`: TINYINT(1) NOT NULL DEFAULT 0 — Cờ đánh dấu Admin đóng đơn nợ (Write-off debt).
  - `het_han_luc`: DATETIME NULL — Mốc thời gian hết hạn giữ chỗ (30 phút từ lúc tạo đơn PENDING).
  - `huy_luc`: DATETIME NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc kiểm tra:** `chk_don_dat_khach_hang` CHECK (`nguoi_dung_id` IS NOT NULL OR `so_dien_thoai_khach` IS NOT NULL).
- **Class Ánh Xạ:** `DonDat`.

### Bảng 7: `chi_tiet_khung_gio_dat`
- **Ý nghĩa nghiệp vụ:** Chi tiết từng slot giờ của đơn và thực thi cơ chế khóa chống trùng lịch tuyệt đối.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `san_id`: INT UNSIGNED NOT NULL (FK -> `san.id`).
  - `ngay_dat`: DATE NOT NULL.
  - `khung_gio_id`: INT UNSIGNED NOT NULL (FK -> `khung_gio.id`).
  - `gia`: INT UNSIGNED NOT NULL — Giá tiền snapshot tại thời điểm đặt.
  - `dang_khoa`: TINYINT NULL DEFAULT 1 — Cột cờ: `1` = Đang giữ slot; `NULL` = Đã giải phóng slot.
- **Ràng buộc duy nhất:** `uq_slot_dang_khoa` (`san_id`, `ngay_dat`, `khung_gio_id`, `dang_khoa`).
- **Class Ánh Xạ:** `ChiTietKhungGioDat`.

### Bảng 8: `thanh_toan`
- **Ý nghĩa nghiệp vụ:** Lưu vết toàn bộ các giao dịch tài chính (Thu tiền mặt, Chuyển khoản, Hoàn tiền).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `loai_giao_dich`: ENUM('PAYMENT','REFUND') NOT NULL DEFAULT 'PAYMENT'.
  - `muc_dich`: ENUM('COURT','SERVICE') NOT NULL DEFAULT 'COURT'.
  - `phuong_thuc`: ENUM('CASH','BANK_TRANSFER') NOT NULL.
  - `so_tien`: INT UNSIGNED NOT NULL — Số tiền giao dịch (VND).
  - `trang_thai`: ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS'.
  - `ma_giao_dich`: VARCHAR(100) NULL — Mã đối soát ngân hàng.
  - `nguoi_xu_ly_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`).
  - `ghi_chu`: VARCHAR(500) NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Class Ánh Xạ:** `ThanhToan`.

### Bảng 9: `nhat_ky_trang_thai_don`
- **Ý nghĩa nghiệp vụ:** Nhật ký kiểm toán bất biến theo dõi tất cả lần thay đổi trạng thái của đơn đặt.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `trang_thai_cu`: VARCHAR(30) NULL.
  - `trang_thai_moi`: VARCHAR(30) NOT NULL.
  - `nguoi_thuc_hien_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`).
  - `ghi_chu`: VARCHAR(500) NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Class Ánh Xạ:** `NhatKyTrangThaiDon`.

### Bảng 10: `danh_gia`
- **Ý nghĩa nghiệp vụ:** Nhận xét và số sao của khách hàng sau khi hoàn tất trải nghiệm tại sân.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `san_id`: INT UNSIGNED NOT NULL (FK -> `san.id`).
  - `nguoi_dung_id`: INT UNSIGNED NOT NULL (FK -> `nguoi_dung.id`).
  - `so_sao`: TINYINT UNSIGNED NOT NULL — Từ 1 đến 5 sao.
  - `nhan_xet`: TEXT NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_danh_gia_don_dat` (`don_dat_id`).
- **Class Ánh Xạ:** `DanhGia`.

### Bảng 11: `dich_vu`
- **Ý nghĩa nghiệp vụ:** Danh mục món dịch vụ phục vụ tại cơ sở (Nước uống, Đồ thuê, Gói tiệc).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ten`: VARCHAR(100) NOT NULL UNIQUE — Tên món dịch vụ.
  - `phan_loai`: ENUM('DRINK','RENTAL','PACKAGE') NOT NULL.
  - `don_vi_tinh`: VARCHAR(30) NOT NULL DEFAULT 'cái'.
  - `don_gia`: INT UNSIGNED NOT NULL — Giá bán niêm yết (VND).
  - `mo_ta`: VARCHAR(500) NULL.
  - `hinh_anh`: VARCHAR(500) NULL.
  - `trang_thai`: ENUM('ACTIVE','OUT_OF_STOCK','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
- **Class Ánh Xạ:** `DichVu`.

### Bảng 12: `yeu_cau_dich_vu`
- **Ý nghĩa nghiệp vụ:** Quản lý từng lần gọi dịch vụ gắn liền với một đơn đặt sân.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `trang_thai`: ENUM('REQUESTED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'REQUESTED'.
  - `nguon`: ENUM('APP','STAFF') NOT NULL DEFAULT 'APP'.
  - `ghi_chu`: VARCHAR(500) NULL.
  - `nguoi_yeu_cau_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`).
  - `nguoi_giao_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`).
  - `giao_luc`: DATETIME NULL.
  - `huy_luc`: DATETIME NULL.
  - `ly_do_huy`: VARCHAR(500) NULL.
- **Class Ánh Xạ:** `YeuCauDichVu`.

### Bảng 13: `chi_tiet_yeu_cau_dich_vu`
- **Ý nghĩa nghiệp vụ:** Từng món cụ thể trong một lần gọi dịch vụ và theo dõi trả đồ thuê (RENTAL).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `yeu_cau_dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `yeu_cau_dich_vu.id`).
  - `dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `dich_vu.id`).
  - `so_luong`: INT UNSIGNED NOT NULL — Giới hạn từ 1 đến 20 mỗi dòng.
  - `don_gia`: INT UNSIGNED NOT NULL — Giá tiền snapshot tại thời điểm gọi dịch vụ.
  - `tra_luc`: DATETIME NULL — Thời điểm khách trả đồ thuê.
  - `nguoi_nhan_tra_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Nhân viên nhận lại đồ thuê.
- **Class Ánh Xạ:** `ChiTietYeuCauDichVu`.

### Bảng 14: `ton_kho_dich_vu`
- **Ý nghĩa nghiệp vụ:** Quản lý trạng thái tồn kho thực tế, số lượng đang giữ và ngưỡng cảnh báo an toàn.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `dich_vu_id`: INT UNSIGNED NOT NULL UNIQUE (FK -> `dich_vu.id` ON DELETE CASCADE).
  - `so_luong`: INT NOT NULL DEFAULT 0 — Tổng tồn kho thực tế hiện vật trong kho.
  - `so_luong_dang_giu`: INT NOT NULL DEFAULT 0 — Số lượng đang được khách đặt giữ chỗ (Hold).
  - `nguong_canh_bao`: INT NOT NULL DEFAULT 5 — Ngưỡng cảnh báo sắp hết hàng.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc kiểm tra (Check):**
  - `chk_ton_kho_so_luong` CHECK (`so_luong` >= 0)
  - `chk_ton_kho_dang_giu` CHECK (`so_luong_dang_giu` >= 0)
  - `chk_ton_kho_nguong` CHECK (`nguong_canh_bao` >= 0)
  - `chk_ton_kho_hop_le` CHECK (`so_luong_dang_giu` <= `so_luong`)
- **Class Ánh Xạ:** `TonKhoDichVu`.

### Bảng 15: `bien_dong_kho`
- **Ý nghĩa nghiệp vụ:** Nhật ký kiểm toán bất biến theo dõi tất cả giao dịch biến động kho của hệ thống.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ton_kho_dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `ton_kho_dich_vu.id` ON DELETE CASCADE).
  - `dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `dich_vu.id` ON DELETE CASCADE).
  - `loai_bien_dong`: ENUM('IMPORT','ADJUST_IN','ADJUST_OUT','RESERVE','RELEASE','DELIVER','RETURN') NOT NULL.
  - `so_luong`: INT NOT NULL — Số lượng biến động.
  - `so_luong_truoc`: INT NOT NULL — Số lượng trước biến động.
  - `so_luong_sau`: INT NOT NULL — Số lượng sau biến động.
  - `don_dat_id`: INT UNSIGNED NULL (FK -> `don_dat.id` ON DELETE SET NULL).
  - `yeu_cau_dich_vu_id`: INT UNSIGNED NULL (FK -> `yeu_cau_dich_vu.id` ON DELETE SET NULL).
  - `nguoi_thuc_hien_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id` ON DELETE SET NULL).
  - `ghi_chu`: VARCHAR(500) NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Class Ánh Xạ:** `BienDongKho`.

---

# 11. SƠ ĐỒ THỰC THỂ QUAN HỆ (ENTITY RELATIONSHIP DIAGRAM - ERD)

```
+---------------+        1:N         +---------------+        1:N         +------------------------+
|   loai_san    |------------------->|      san      |------------------->|        don_dat         |
+---------------+                    +---------------+                    +------------------------+
        |                                                                     | 1:N            | 1:N
        | 1:N                                                                 v                v
        v                                                             +---------------+  +--------------+
+---------------+                                                     |chi_tiet_khung_|  |  thanh_toan  |
| gia_khung_gio |                                                     |  gio_dat      |  +--------------+
+---------------+                                                     +---------------+        |
        ^                                                                     |                |
        | 1:N                                                                 v                v
+---------------+                                                     +---------------+  +--------------+
|   khung_gio   |                                                     |  nhat_ky_     |  |   danh_gia   |
+---------------+                                                     |  trang_thai   |  +--------------+
                                                                      +---------------+
                                                                              |
                                                                              | 1:N
                                                                              v
+---------------+        1:N         +------------------------+  1:N  +------------------------+
|    dich_vu    |<-------------------|chi_tiet_yeu_cau_dich_vu|<------|    yeu_cau_dich_vu     |
+---------------+                    +------------------------+       +------------------------+
     |      ^
 1:1 |      | 1:N
     v      |
+-------------------+    1:N         +------------------------+
|  ton_kho_dich_vu  |--------------->|     bien_dong_kho      |
+-------------------+                +------------------------+
```

---

# 12. BẢNG ÁNH XẠ BẢNG CSDL SANG ENTITY CLASS (ENTITY-CLASS MAPPING)

| STT | Tên Bảng (Database Table) | Tên Entity Class Khái Niệm | Mô-đun Nghiệp Vụ | Trách Nhiệm Miền |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `nguoi_dung` | `NguoiDung` | Identity & Auth | Quản lý người dùng, phân quyền, xác thực |
| 2 | `loai_san` | `LoaiSan` | Court Catalog | Quản lý phân loại sân thể thao và sự kiện |
| 3 | `san` | `San` | Court Catalog | Quản lý sân thi đấu và trạng thái mặt bằng |
| 4 | `khung_gio` | `KhungGio` | Time Schedule | Quản lý 15 khung giờ tiêu chuẩn 60 phút |
| 5 | `gia_khung_gio` | `GiaKhungGio` | Pricing Matrix | Bảng giá theo loại sân, khung giờ và ngày |
| 6 | `don_dat` | `DonDat` | Booking Lifecycle | Vòng đời đơn đặt sân và tổng tiền |
| 7 | `chi_tiet_khung_gio_dat` | `ChiTietKhungGioDat` | Concurrency Hold | Giữ slot giờ và khóa chống trùng lịch |
| 8 | `thanh_toan` | `ThanhToan` | Financial Ledger | Bản ghi thu tiền và hoàn tiền minh bạch |
| 9 | `nhat_ky_trang_thai_don` | `NhatKyTrangThaiDon` | State Audit | Kiểm toán chuyển đổi trạng thái bất biến |
| 10 | `danh_gia` | `DanhGia` | Feedback & Review | Đánh giá chất lượng dịch vụ và sân |
| 11 | `dich_vu` | `DichVu` | Service Master | Danh mục món nước, đồ thuê và gói tiệc |
| 12 | `yeu_cau_dich_vu` | `YeuCauDichVu` | Service Order | Đơn gọi dịch vụ tại sân |
| 13 | `chi_tiet_yeu_cau_dich_vu`| `ChiTietYeuCauDichVu` | Service Item & Return| Chi tiết từng món và theo dõi trả đồ thuê |
| 14 | `ton_kho_dich_vu` | `TonKhoDichVu` | Inventory Management | Tồn kho thực tế, giữ chỗ và cảnh báo |
| 15 | `bien_dong_kho` | `BienDongKho` | Inventory Audit Trail| Nhật ký giao dịch biến động tồn kho |

---

# 13. MÔ HÌNH LỚP MIỀN KHÁI NIỆM (CLASS MODEL)

### Phân biệt rõ ràng giữa 2 tầng:
- **Conceptual Domain Class:** Lớp nghiệp vụ khái niệm thể hiện đầy đủ các phương thức nghiệp vụ miền (`taoDon()`, `reserve()`, `deliver()`, `hoanThanhDon()`) dùng cho việc thiết kế mô hình hóa UML.
- **Implementation Service/Entity Layer:** Tầng triển khai thực tế bằng mã nguồn Node.js/TypeScript sử dụng Service Layer (`DonDatService`, `DichVuService`, `NhanVienService`, `QuanTriService`) kết hợp tham số hóa SQL qua Bể kết nối `mysql2`.

---

# 14. TRÁCH NHIỆM CỐT LÕI CỦA CÁC LỚP (CLASS RESPONSIBILITIES)

- **`NguoiDung`:** Quản lý định danh tài khoản, kiểm tra vai trò (CUSTOMER, STAFF, ADMIN) và thẩm định trạng thái ACTIVE/LOCKED.
- **`LoaiSan`:** Xác định danh mục môn thể thao hoặc loại hình sự kiện, quản lý giá giờ chuẩn.
- **`San`:** Quản lý trạng thái hoạt động thực tế (ACTIVE, MAINTENANCE, INACTIVE) và sức chứa tối đa.
- **`KhungGio`:** Quản lý khoảng thời gian 60 phút và xác định giờ cao điểm.
- **`GiaKhungGio`:** Định nghĩa chính sách định giá phân biệt giữa ngày thường (WEEKDAY) và cuối tuần (WEEKEND).
- **`DonDat`:** Quản lý trạng thái vòng đời đặt sân (`PENDING` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED` / `EXPIRED` / `NO_SHOW`), tổng hợp số tiền snapshot.
- **`ChiTietKhungGioDat`:** Đảm bảo tính duy nhất của từng khung giờ đặt, chống trùng lịch tuyệt đối qua cờ `dang_khoa`.
- **`ThanhToan`:** Quản lý giao dịch nạp tiền thanh toán (`PAYMENT`) và hoàn trả tiền (`REFUND`).
- **`TonKhoDichVu`:** Đảm bảo toàn vẹn số lượng tồn kho: `availableQuantity = so_luong - so_luong_dang_giu >= 0`. Ngăn chặn bán quá số lượng (Overselling).
- **`BienDongKho`:** Truy vết bất biến mọi biến động kho với đầy đủ số lượng trước, số lượng sau, lý do và người thực hiện.

---

# 15. MỐI QUAN HỆ GIỮA CÁC LỚP (CLASS RELATIONSHIPS)

1. `LoaiSan 1 ────── 0..* San` (Association)
2. `LoaiSan 1 ────── 0..* GiaKhungGio` (Association)
3. `KhungGio 1 ───── 0..* GiaKhungGio` (Association)
4. `San 1 ────────── 0..* DonDat` (Association)
5. `DonDat 1 ─────── 1..3 ChiTietKhungGioDat` (Composition: ChiTietKhungGioDat phụ thuộc vòng đời DonDat)
6. `KhungGio 1 ───── 0..* ChiTietKhungGioDat` (Association)
7. `DonDat 1 ─────── 0..* ThanhToan` (Association: Bản ghi thanh toán thuộc đơn)
8. `DonDat 1 ─────── 0..* NhatKyTrangThaiDon` (Composition: Nhật ký phụ thuộc DonDat)
9. `DonDat 1 ─────── 0..1 DanhGia` (Association)
10. `DonDat 1 ────── 0..* YeuCauDichVu` (Association)
11. `YeuCauDichVu 1 ─ 1..* ChiTietYeuCauDichVu` (Composition: Chi tiết phụ thuộc đơn gọi)
12. `DichVu 1 ────── 0..* ChiTietYeuCauDichVu` (Association)
13. `DichVu 1 ────── 0..1 TonKhoDichVu` (Association: Mỗi dịch vụ có 1 bản ghi tồn kho tương ứng)
14. `TonKhoDichVu 1 ─ 0..* BienDongKho` (Association: Nhật ký biến động kho)

---

# 16. BỘI SỐ QUAN HỆ (MULTIPLICITY MATRIX)

| Lớp Nguồn | Lớp Đích | Bội Số (Multiplicity) | Diễn Giải Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| `LoaiSan` | `San` | `1` sang `0..*` | Một loại sân có nhiều sân cụ thể |
| `LoaiSan` | `GiaKhungGio` | `1` sang `0..*` | Một loại sân có nhiều mức giá theo khung giờ |
| `San` | `DonDat` | `1` sang `0..*` | Một sân có thể có nhiều đơn đặt qua các ngày |
| `DonDat` | `ChiTietKhungGioDat` | `1` sang `1..3` | Một đơn đặt chứa từ 1 đến 3 slot liên tiếp |
| `DonDat` | `ThanhToan` | `1` sang `0..*` | Một đơn có thể có nhiều giao dịch (tiền sân, tiền DV, hoàn tiền) |
| `DonDat` | `DanhGia` | `1` sang `0..1` | Một đơn hoàn thành chỉ được đánh giá tối đa 1 lần |
| `DonDat` | `YeuCauDichVu` | `1` sang `0..*` | Một đơn sân có thể gọi dịch vụ nhiều lần trong buổi thi đấu |
| `YeuCauDichVu`| `ChiTietYeuCauDichVu`| `1` sang `1..*` | Một lần gọi chứa từ 1 đến 20 dòng món |
| `DichVu` | `TonKhoDichVu` | `1` sang `0..1` | Mỗi dịch vụ có tối đa 1 bản ghi kiểm soát tồn kho |
| `TonKhoDichVu`| `BienDongKho` | `1` sang `0..*` | Một kho dịch vụ có nhiều bản ghi lịch sử biến động |

---

# 17. VAI TRÒ LIÊN KẾT NGỮ CẢNH (ASSOCIATION ROLES)

Đối với thực thể `NguoiDung`, hệ thống phân định rõ ràng các vai trò liên kết (Association Roles) để không nối chung chung:
1. `NguoiDung` đóng vai trò **`customer`** trong quan hệ với `DonDat`: Khách hàng sở hữu đơn.
2. `NguoiDung` đóng vai trò **`creatorStaff`** trong quan hệ với `DonDat`: Nhân viên trực tiếp nhập đơn tại quầy.
3. `NguoiDung` đóng vai trò **`requester`** trong quan hệ với `YeuCauDichVu`: Người gửi yêu cầu gọi dịch vụ.
4. `NguoiDung` đóng vai trò **`deliverer`** trong quan hệ với `YeuCauDichVu`: Nhân viên xác nhận mang dịch vụ ra sân.
5. `NguoiDung` đóng vai trò **`returnVerifier`** trong quan hệ với `ChiTietYeuCauDichVu`: Nhân viên tiếp nhận kiểm tra đồ thuê hoàn trả.
6. `NguoiDung` đóng vai trò **`paymentProcessor`** trong quan hệ với `ThanhToan`: Nhân viên thu tiền hoặc xác nhận hoàn tiền.
7. `NguoiDung` đóng vai trò **`stockPerformer`** trong quan hệ với `BienDongKho`: Quản trị viên nhập kho / điều chỉnh kho.

---

# 18. QUAN HỆ HỢP THÀNH VÀ THU NẠP (COMPOSITION & AGGREGATION)

### Quan hệ Hợp Thành (Composition - Bắt buộc gắn liền vòng đời):
- `DonDat` ◆── `ChiTietKhungGioDat`: Các khung giờ đặt không thể tồn tại độc lập ngoài đơn đặt. Khi đơn bị xóa vật lý (trong kịch bản dọn dẹp kiểm thử), các chi tiết khung giờ bị xóa theo.
- `DonDat` ◆── `NhatKyTrangThaiDon`: Nhật ký chuyển trạng thái gắn chặt với vòng đời của đơn đặt.
- `YeuCauDichVu` ◆── `ChiTietYeuCauDichVu`: Các dòng món dịch vụ phụ thuộc hoàn toàn vào lần yêu cầu dịch vụ.

### Quan hệ Thu Nạp (Aggregation - Tồn tại độc lập):
- `LoaiSan` ◇── `San`: Sân thuộc về một loại sân, nhưng loại sân là danh mục độc lập.
- `DichVu` ◇── `ChiTietYeuCauDichVu`: Món dịch vụ tồn tại độc lập trong danh mục master data.
- `TonKhoDichVu` ◇── `BienDongKho`: Các giao dịch biến động truy vết kho độc lập.

---

# 19. DANH MỤC KIỂU LIỆT KÊ NGHIỆP VỤ (ENUMERATIONS)

1. `VaiTro`: `CUSTOMER`, `STAFF`, `ADMIN`
2. `TrangThaiNguoiDung`: `ACTIVE`, `LOCKED`
3. `PhanLoaiSan`: `SPORT`, `EVENT`
4. `TrangThaiSan`: `ACTIVE`, `MAINTENANCE`, `INACTIVE`
5. `LoaiNgay`: `WEEKDAY`, `WEEKEND`
6. `TrangThaiDon`: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW`
7. `TrangThaiThanhToan`: `UNPAID`, `PARTIALLY_PAID`, `PAID`, `REFUND_PENDING`, `REFUNDED`
8. `NguonDon`: `APP`, `WALK_IN`
9. `PhuongThucThanhToan`: `CASH`, `BANK_TRANSFER`
10. `PhanLoaiDichVu`: `DRINK`, `RENTAL`, `PACKAGE`
11. `TrangThaiYeuCauDichVu`: `REQUESTED`, `DELIVERED`, `CANCELLED`
12. `LoaiGiaoDichThanhToan`: `PAYMENT`, `REFUND`
13. `MucDichThanhToan`: `COURT`, `SERVICE`
14. `TrangThaiGiaoDich`: `PENDING`, `SUCCESS`, `FAILED`
15. `LoaiBienDongKho`: `IMPORT`, `ADJUST_IN`, `ADJUST_OUT`, `RESERVE`, `RELEASE`, `DELIVER`, `RETURN`
16. `TrangThaiTonKho`: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`

---

# 20. QUY TRÌNH NGHIỆP VỤ ĐẶT LỊCH SÂN (BOOKING FLOW)

- **Quy tắc khung giờ:** Đặt từ 1 đến 3 khung giờ liên tiếp (VD: 07:00-08:00, 08:00-09:00, 09:00-10:00). Không được đặt ngắt quãng (VD: 07:00 và 09:00 trên cùng 1 đơn).
- **Phạm vi ngày:** Trong ngày hôm nay hoặc tối đa 14 ngày tới (`ngay_dat BETWEEN layNgayHomNay() AND congNgay(layNgayHomNay(), 14)`).
- **Quy tắc thời gian đặt trước:** Khách hàng (Customer) phải đặt trước giờ bắt đầu của slot đầu tiên ít nhất 30 phút. Nhân viên (Staff) đặt tại quầy được phép đặt slot đang diễn ra nếu slot đó chưa kết thúc.
- **Giữ chỗ (Hold):** Khi chọn `BANK_TRANSFER`, đơn có trạng thái `PENDING`, giữ chỗ 30 phút (`het_han_luc = NOW() + INTERVAL 30 MINUTE`). Trong thời gian này, slot bị khóa, không ai khác đặt được. Khi xác nhận thanh toán -> `CONFIRMED`. Nếu quá 30 phút -> Scheduler quét chuyển `EXPIRED` và nhả slot.

---

# 21. QUY TRÌNH THANH TOÁN (PAYMENT FLOW)

Hệ thống hỗ trợ 2 mục đích thanh toán:
1. `COURT`: Tiền thuê sân bóng.
2. `SERVICE`: Tiền dịch vụ ăn uống và thuê dụng cụ phát sinh.

Hỗ trợ 2 phương thức:
- `CASH`: Tiền mặt tại quầy lễ tân do Staff tiếp nhận.
- `BANK_TRANSFER`: Chuyển khoản ngân hàng qua mã VietQR chuẩn.

Tuyệt đối không tạo payment giả. Mọi giao dịch tài chính đều được ghi vào bảng `thanh_toan` với đầy đủ số tiền, phương thức, người xử lý và mã giao dịch đối soát.

---

# 22. QUY TRÌNH HOÀN TIỀN (REFUND FLOW)

- **Điều kiện hủy hoàn tiền của khách:** Khách hàng chỉ được hủy đơn khi thời điểm hiện tại cách giờ bắt đầu thi đấu của slot đầu tiên **tối thiểu 6 giờ** (`>= 360 phút`) và đơn **chưa có bất kỳ dịch vụ nào đã giao** (`DELIVERED`).
- **Xử lý hoàn tiền:** Nếu đơn chưa thanh toán (`UNPAID`), hủy ngay không phát sinh hoàn tiền. Nếu đơn đã thanh toán (`PAID`), khách bắt buộc nhập thông tin nhận tiền hoàn (`refundInfo`). Hệ thống chuyển trạng thái đơn sang `CANCELLED`, `trang_thai_thanh_toan = REFUND_PENDING` và tạo bản ghi `thanh_toan` loại `REFUND`, trạng thái `PENDING`.
- **Nhân viên xử lý:** Staff vào danh mục hoàn tiền (`GET /staff/refunds`), kiểm tra thông tin và thực hiện chuyển khoản lại cho khách, sau đó bấm xác nhận hoàn tiền (`POST /staff/payments/:id/confirm-refund`) -> chuyển trạng thái thanh toán sang `REFUNDED`.

---

# 23. QUY TRÌNH PHỤC VỤ DỊCH VỤ TẠI SÂN (SERVICE FLOW)

1. **Gửi yêu cầu (REQUESTED):** Khách hàng trên sân đặt dịch vụ qua Mobile App (hoặc Staff nhập hộ tại quầy). Hệ thống kiểm tra số lượng khả dụng: nếu `availableQuantity >= requested` -> Khóa record kho (`SELECT ... FOR UPDATE`), tăng `so_luong_dang_giu` (RESERVE) và ghi log `bien_dong_kho`. Trạng thái đơn gọi là `REQUESTED`.
2. **Giao hàng (DELIVERED):** Nhân viên mang đồ ra sân, bấm xác nhận giao hàng (`POST /staff/service-orders/:id/deliver`). Hệ thống trừ tồn kho thực tế (`so_luong = so_luong - requested`), giảm giữ chỗ (`so_luong_dang_giu = so_luong_dang_giu - requested`), ghi log `DELIVER` trong `bien_dong_kho` và chuyển trạng thái sang `DELIVERED`. Lúc này, tiền dịch vụ chính thức được cộng vào hóa đơn của đơn đặt.
3. **Hủy yêu cầu (CANCELLED):** Khách hoặc Staff hủy yêu cầu khi đang ở trạng thái `REQUESTED`. Hệ thống giải phóng giữ chỗ (`so_luong_dang_giu = so_luong_dang_giu - requested`), tăng khả dụng trở lại và ghi log `RELEASE`.

---

# 24. QUY TRÌNH QUẢN LÝ CHO THUÊ DỤNG CỤ (RENTAL FLOW)

- Dụng cụ cho thuê (`dich_vu.phan_loai = 'RENTAL'`) như vợt, giày, bóng, áo bib được quản lý chặt chẽ.
- Khi giao đồ thuê (`DELIVERED`), nhân viên mang đồ ra sân.
- Khi đơn đặt sân kết thúc, hệ thống kiểm tra các dòng đồ thuê: nếu còn đồ thuê chưa có thời gian trả (`tra_luc IS NULL`) thì **KHÔNG ĐƯỢC PHÉP HOÀN THÀNH ĐƠN** (`409 HAS_UNRETURNED_RENTALS`).
- Nhân viên kiểm tra nhận lại đồ nguyên vẹn và xác nhận trả đồ (`POST /staff/service-order-items/:id/return`). Hệ thống ghi nhận `tra_luc = NOW()`, người nhận trả `nguoi_nhan_tra_id`, tự động cộng lại số lượng thực tế trong kho (`so_luong = so_luong + requested`) và ghi log `RETURN` trong `bien_dong_kho`.

---

# 25. HIỆN TRẠNG TRIỂN KHAI GÓI DỊCH VỤ (PACKAGE MODULE)

- **Trạng thái thực tế:** `STATUS: IMPLEMENTED (STANDALONE SERVICE)`.
- Gói dịch vụ (`PACKAGE`) như "Gói tiệc nước 10 người", "Gói BBQ 10 người" được quản lý như một dịch vụ độc lập có đơn vị tính là 'gói' trong bảng `dich_vu` và kiểm soát tồn kho trong `ton_kho_dich_vu`.
- Mô hình tách thành phần con `ChiTietGoiDichVu` hiện tại chưa áp dụng nhằm giữ đơn giản và tránh phức tạp hóa dữ liệu khi chưa có yêu cầu cụ thể.

---

# 26. MÔ HÌNH ĐẶT KHU VỰC SỰ KIỆN (EVENT BOOKING MODEL)

- **Nguyên tắc cốt lõi:** Khu vực sự kiện/tiệc được mô hình hóa trực tiếp trong hệ thống hiện tại bằng cách sử dụng:
  `loai_san.phan_loai = 'EVENT'` kết hợp với trường sức chứa `san.suc_chua`.
- **Dùng chung toàn bộ:** Tái sử dụng 100% các bảng `san`, `khung_gio`, `gia_khung_gio`, `don_dat`, `chi_tiet_khung_gio_dat`, `thanh_toan`.
- Tuyệt đối không tạo module `EventBooking` riêng biệt.

---

# 27. HỆ THỐNG QUẢN LÝ TỒN KHO THỰC TẾ (INVENTORY MODULE)

Hệ thống quản lý tồn kho chuyên sâu được chuẩn hóa tại bảng `ton_kho_dich_vu` và `bien_dong_kho`:
- **Số lượng tổng tồn kho:** `so_luong` (INT >= 0).
- **Số lượng đang giữ chỗ:** `so_luong_dang_giu` (INT >= 0).
- **Số lượng khả dụng thực tế:** `availableQuantity = so_luong - so_luong_dang_giu`.
- **Bất biến toàn vẹn:** `so_luong_dang_giu <= so_luong` và `availableQuantity >= 0`.
- **Cơ chế khóa dòng chống xung đột:** Mọi thao tác biến động kho chạy trong giao dịch dữ liệu ACID và sử dụng `SELECT ... FOR UPDATE` trên dòng tồn kho tương ứng.
- **Cảnh báo và trạng thái tồn kho (Thứ tự ưu tiên theo BR Master Prompt):**
  - `dich_vu.trang_thai = 'INACTIVE'` -> Trạng thái tính toán luôn là `INACTIVE` (Ngưng bán), có độ ưu tiên cao nhất, ghi đè toàn bộ số lượng vật lý còn trong kho. Hệ thống khóa toàn bộ nghiệp vụ nhập kho (`POST /admin/inventory/import`) hoặc điều chỉnh kho (`POST /admin/inventory/adjust`) với mã lỗi `422 SERVICE_INACTIVE`.
  - Nếu `dich_vu.trang_thai = 'ACTIVE'`:
    - `availableQuantity <= 0` -> Trạng thái tính toán: `OUT_OF_STOCK`.
    - `0 < availableQuantity <= nguong_canh_bao` -> Trạng thái tính toán: `LOW_STOCK`.
    - `availableQuantity > nguong_canh_bao` -> Trạng thái tính toán: `IN_STOCK`.
- **Quyền hạn kho rõ ràng:**
  - `CUSTOMER`: Chỉ thấy cờ `isAvailable: boolean`, hoàn toàn không thấy số lượng tồn, ngưỡng cảnh báo hay lịch sử kho.
  - `STAFF`: Xem số lượng tồn phục vụ vận hành tại quầy (`GET /staff/inventory`), thực hiện giao hàng (DELIVER), nhận lại đồ thuê (RETURN). Tuyệt đối không được nhập kho (IMPORT) hay điều chỉnh kho (ADJUST).
  - `ADMIN`: Toàn quyền nhập kho (`POST /admin/inventory/import`), điều chỉnh tăng/giảm (`POST /admin/inventory/adjust`), cập nhật ngưỡng (`PATCH /admin/inventory/:id/threshold`), và xem toàn bộ nhật ký biến động kho (`GET /admin/inventory/transactions`). Các sản phẩm `INACTIVE` bị ẩn khỏi dropdown nhập kho và vô hiệu hóa nút thao tác.

---

# 28. QUY TRÌNH TÍNH TOÁN HÓA ĐƠN ĐỘNG (DYNAMIC INVOICE CALCULATION)

Hóa đơn không lưu cứng thành một bảng tĩnh mà được tính toán động tại thời điểm truy vấn (`layHoaDon`):
```
courtAmount      = don_dat.tien_san
serviceAmount    = SUM(chi_tiet_yeu_cau_dich_vu.so_luong * chi_tiet_yeu_cau_dich_vu.don_gia) 
                   CỦA CÁC YÊU CẦU CÓ trang_thai = 'DELIVERED'
grandTotal       = courtAmount + serviceAmount
paidAmount       = SUM(thanh_toan.so_tien) CỦA GIAO DỊCH PAYMENT CÓ trang_thai = 'SUCCESS'
refundedAmount   = SUM(thanh_toan.so_tien) CỦA GIAO DỊCH REFUND CÓ trang_thai = 'SUCCESS'
remainingAmount  = grandTotal - paidAmount
isFullyPaid      = (remainingAmount <= 0)
```

---

# 29. ĐẶC QUYỀN ĐÓNG ĐƠN CÓ CÔNG NỢ (DEBT WRITE-OFF PRIVILEGE)

- **Vấn đề thực tế:** Khách hàng đến đá bóng, đã nhận nước uống hoặc thuê đồ nhưng bỏ về mà không thanh toán nốt tiền dịch vụ.
- **Ranh giới quyền hạn:** **CHỈ ADMIN MỚI CÓ QUYỀN NÀY** (`POST /api/v1/admin/bookings/:id/close-with-debt`). Nhân viên (Staff) bị cấm hoàn toàn.
- **Xử lý an toàn:**
  - Tự động hủy các yêu cầu dịch vụ đang `REQUESTED` và giải phóng tồn kho tương ứng.
  - Chuyển trạng thái đơn sang `COMPLETED`, đánh dấu cờ `dong_don_cong_no = 1`.
  - Tuyệt đối không tự tạo payment giả để bù trừ.
  - Ghi nhật ký trạng thái với lý do đóng đơn có công nợ.
  - Số tiền công nợ được xuất hiện minh bạch trong báo cáo quản trị tổng quan (`reports/summary`) để kế toán đối soát.

---

# 30. TIẾN TRÌNH CHẠY NGẦM TỰ ĐỘNG (SCHEDULER BACKGROUND JOB)

- Tiến trình `quetDonHetHan` chạy tự động mỗi 30 giây (`setInterval` 30,000 ms).
- Truy vấn tất cả các đơn `PENDING` có `het_han_luc < NOW()`.
- Với mỗi đơn, mở transaction và thực hiện khóa dòng `SELECT ... FOR UPDATE`:
  1. Cập nhật `don_dat.trang_thai = 'EXPIRED'`.
  2. Mở khóa slot: `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`.
  3. Giải phóng tồn kho dịch vụ nếu khách có gọi dịch vụ trong lúc PENDING: gọi `DichVuService.giaiPhongTonKhoDonHuy` để trừ `so_luong_dang_giu` và ghi log `RELEASE`.
  4. Ghi nhật ký trạng thái: `PENDING -> EXPIRED` với ghi chú "Hệ thống tự động hủy do hết hạn giữ chỗ (30 phút)".

---

# 31. DANH MỤC QUY TẮC NGHIỆP VỤ TOÀN DIỆN (BUSINESS RULES BR-01 → BR-42)

- **BR-01:** Khung giờ hoạt động cố định: 15 slot/ngày, mỗi slot đúng 60 phút từ 06:00 đến 21:00.
- **BR-02:** Mỗi đơn đặt được chọn từ 1 đến 3 khung giờ liên tiếp trên cùng một sân và trong cùng một ngày.
- **BR-03:** Khách hàng chỉ được đặt trước tối đa 14 ngày tính từ ngày hiện tại.
- **BR-04:** Khách hàng phải đặt trước giờ bắt đầu của slot đầu tiên ít nhất 30 phút.
- **BR-05:** Nhân viên tại quầy được phép đặt slot đang diễn ra nếu slot đó chưa kết thúc.
- **BR-06:** Khách hàng chọn chuyển khoản có 30 phút giữ chỗ tạm thời (Hold).
- **BR-07:** Scheduler tự động hủy đơn PENDING quá 30 phút và giải phóng slot sang EXPIRED.
- **BR-08:** Khách hàng thanh toán tiền mặt tại quầy phải được nhân viên xác nhận và đổi trạng thái CONFIRMED.
- **BR-09:** Khách hàng chỉ được hủy đơn trước giờ bắt đầu thi đấu tối thiểu 6 giờ và khi chưa có dịch vụ nào đã DELIVERED.
- **BR-10:** Hủy đơn đã thanh toán (PAID) tạo yêu cầu hoàn tiền REFUND PENDING, nhân viên đối soát hoàn trả tiền cho khách.
- **BR-11:** Một đơn đặt chỉ được hoàn thành (COMPLETED) khi đã thanh toán đủ 100% và đã trả hết đồ thuê.
- **BR-12:** Đơn đặt quá 15 phút sau giờ bắt đầu mà khách không đến được đánh dấu NO_SHOW.
- **BR-13:** Đơn đặt sau khi COMPLETED mới được phép gửi đánh giá (Rating từ 1 đến 5 sao).
- **BR-14:** Bảng giá sân phân biệt giữa ngày thường (WEEKDAY) và cuối tuần (WEEKEND).
- **BR-15:** Chống trùng lịch tuyệt đối bằng Unique Constraint và giao dịch ACID ở CSDL.
- **BR-16:** Sân ở trạng thái MAINTENANCE hoặc INACTIVE không xuất hiện trên lịch trống và không được đặt.
- **BR-17:** Không thể đưa sân về trạng thái bảo trì nếu đang có đơn PENDING hoặc CONFIRMED trong tương lai.
- **BR-18:** Cổng Web Admin chỉ cho phép tài khoản có vai trò STAFF hoặc ADMIN đăng nhập.
- **BR-19:** Mỗi khách hàng chỉ được có tối đa 3 đơn PENDING cùng lúc để chống spam giữ chỗ.
- **BR-20:** Giá tiền sân được snapshot cố định tại thời điểm đặt, đổi giá tương lai không ảnh hưởng đơn cũ.
- **BR-21:** Khách hàng chỉ xem và thao tác trên đơn đặt của chính mình (Ownership Rule).
- **BR-22:** Mã đơn đặt gồm tiền tố BK kèm 8 ký tự ngẫu nhiên chữ hoa và số.
- **BR-23:** Giá dịch vụ được snapshot cố định tại thời điểm tạo yêu cầu dịch vụ.
- **BR-24:** Dịch vụ chỉ được tính vào tổng hóa đơn khi đã ở trạng thái DELIVERED.
- **BR-25:** Khách hàng chỉ được hủy yêu cầu dịch vụ khi yêu cầu đó đang ở trạng thái REQUESTED.
- **BR-26:** Nhân viên có quyền hủy yêu cầu dịch vụ kèm theo lý do bắt buộc.
- **BR-27:** Đồ thuê (RENTAL) phải được nhân viên xác nhận nhận lại đồ trước khi đơn được đóng.
- **BR-28:** Không tạo payment giả. Mọi giao dịch tài chính phải có bản ghi thanh toán tương ứng.
- **BR-29:** Hóa đơn được tổng hợp động từ tiền sân, tiền dịch vụ đã giao và các khoản thanh toán.
- **BR-30:** Chỉ ADMIN mới có quyền đóng đơn có công nợ (Debt Write-Off) khi khách bỏ về không thanh toán.
- **BR-31:** Tài khoản ADMIN không thể tự khóa chính mình và hệ thống luôn duy trì ít nhất 1 ADMIN ACTIVE.
- **BR-32:** Báo cáo doanh thu phân tích tách bạch giữa tiền sân, tiền dịch vụ, tiền hoàn và doanh thu thực.
- **BR-33:** Trạng thái tài khoản LOCKED bị từ chối ngay lập tức ở request kế tiếp dù JWT chưa hết hạn.
- **BR-34:** Hủy đơn đã thanh toán bắt buộc phải cung cấp thông tin nhận tiền hoàn.
- **BR-35 (Mới):** Tồn kho khả dụng được tính theo công thức: `availableQuantity = so_luong - so_luong_dang_giu`.
- **BR-36 (Mới):** Bất biến tồn kho: `so_luong >= 0`, `so_luong_dang_giu >= 0`, `so_luong_dang_giu <= so_luong`.
- **BR-37 (Mới):** Gửi yêu cầu dịch vụ tự động giữ chỗ kho (RESERVE) và khóa dòng bằng `SELECT ... FOR UPDATE`.
- **BR-38 (Mới):** Từ chối ngay lập tức với lỗi `422 INSUFFICIENT_STOCK` nếu số lượng yêu cầu vượt quá số lượng khả dụng.
- **BR-39 (Mới):** Hủy yêu cầu dịch vụ hoặc hủy đơn đặt tự động giải phóng tồn kho đang giữ chỗ (RELEASE).
- **BR-40 (Mới):** Giao hàng dịch vụ (DELIVER) trừ tồn kho thực tế và giảm số lượng đang giữ chỗ.
- **BR-41 (Mới):** Xác nhận trả đồ thuê (RETURN) tự động cộng hoàn lại tồn kho thực tế của dụng cụ.
- **BR-42 (Mới):** Khách hàng chỉ thấy trạng thái `isAvailable: boolean`, hoàn toàn không thấy chi tiết số lượng kho nội bộ.

---

# 32. MA TRẬN CHUYỂN ĐỔI TRẠNG THÁI THỰC THỂ (STATE TRANSITION MATRIX)

### 1. Thực thể `DonDat` (Đơn Đặt Sân):

| Trạng Thái Cũ | Kích Hoạt (Trigger) | Điều Kiện Bảo Vệ (Guard) | Trạng Thái Mới | Tác Nhân | Thao Tác CSDL & Tác Động Phụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Khách đặt chọn CK | Dữ liệu hợp lệ, slot trống | `PENDING` | CUSTOMER | Insert `don_dat`, Insert `chi_tiet_khung_gio_dat` (dang_khoa=1), hẹn giờ het_han_luc +30p |
| `[None]` | Staff đặt tại quầy | Dữ liệu hợp lệ, slot trống | `CONFIRMED` | STAFF | Insert `don_dat`, Insert slot (dang_khoa=1), ghi nhận thanh toán tiền mặt/CK |
| `PENDING` | Khách thanh toán CK | Staff xác nhận tiền về | `CONFIRMED` | STAFF | Update `don_dat` -> CONFIRMED, PAID. Ghi nhận `thanh_toan` SUCCESS |
| `PENDING` | Quá hạn 30 phút | het_han_luc < NOW() | `EXPIRED` | SCHEDULER | Update `don_dat` -> EXPIRED, nhả slot (dang_khoa=NULL), giải phóng tồn kho dịch vụ |
| `PENDING` | Khách tự hủy đơn | Đơn thuộc quyền sở hữu | `CANCELLED` | CUSTOMER | Update `don_dat` -> CANCELLED, nhả slot (dang_khoa=NULL), giải phóng tồn kho dịch vụ |
| `CONFIRMED` | Khách hủy hợp lệ | >= 6h trước giờ đá & chưa có DV giao | `CANCELLED` | CUSTOMER | Update `don_dat` -> CANCELLED, nhả slot, tạo `thanh_toan` REFUND PENDING |
| `CONFIRMED` | Staff hủy thay khách | Chưa có dịch vụ đã giao | `CANCELLED` | STAFF | Update `don_dat` -> CANCELLED, nhả slot, tạo `thanh_toan` REFUND PENDING |
| `CONFIRMED` | Hoàn thành đơn | Đã trả hết đồ thuê & đã thanh toán đủ | `COMPLETED` | STAFF | Update `don_dat` -> COMPLETED. Khách có quyền đánh giá đơn |
| `CONFIRMED` | Khách không đến | Quá 15p sau giờ bắt đầu | `NO_SHOW` | STAFF | Update `don_dat` -> NO_SHOW, ghi nhật ký trạng thái |
| `CONFIRMED` | Khách nợ bỏ về | Duy nhất ADMIN phê duyệt | `COMPLETED` | ADMIN | Update `don_dat` -> COMPLETED, dong_don_cong_no=1. Giải phóng DV REQUESTED |

### 2. Thực thể `YeuCauDichVu` (Yêu Cầu Dịch Vụ):

| Trạng Thái Cũ | Kích Hoạt | Điều Kiện Bảo Vệ | Trạng Thái Mới | Tác Nhân | Thao Tác Kho & CSDL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Gọi món ra sân | availableQuantity >= requested | `REQUESTED` | CUSTOMER/STAFF | Insert `yeu_cau_dich_vu`, Khóa kho, tăng `so_luong_dang_giu` (RESERVE) |
| `REQUESTED` | Giao đồ ra sân | Hàng có sẵn | `DELIVERED` | STAFF | Update `yeu_cau_dich_vu` -> DELIVERED, trừ `so_luong`, giảm giữ chỗ (DELIVER) |
| `REQUESTED` | Khách/Staff hủy | Yêu cầu đang REQUESTED | `CANCELLED` | CUSTOMER/STAFF | Update `yeu_cau_dich_vu` -> CANCELLED, giảm giữ chỗ (RELEASE) |

---

# 33. ĐẶC TẢ LUỒNG HOẠT ĐỘNG (21 ACTIVITY FLOW SPECIFICATIONS)

Mỗi luồng nghiệp vụ đều được xác định rõ luồng Actor, luồng Hệ Thống, các điểm rẽ nhánh (Decision) và ranh giới giao dịch:

1. **Đăng Ký Tài Khoản:** Khách nhập Họ tên, SĐT, Mật khẩu -> Hệ thống kiểm tra trùng SĐT -> Băm mật khẩu Bcrypt -> Lưu bảng `nguoi_dung` với role CUSTOMER.
2. **Đăng Nhập & Cấp Quyền:** Nhập SĐT, Mật khẩu -> Hệ thống xác thực hash mật khẩu -> Kiểm tra tài khoản ACTIVE -> Cấp phát JWT mang vai trò tương ứng.
3. **Tra Cứu Lịch Trống:** Chọn ngày, chọn loại sân -> Hệ thống quét 15 slot giờ và trạng thái sân -> Trả về ma trận khung giờ kèm giá tương ứng.
4. **Khách Đặt Sân Trực Tuyến:** Chọn 1-3 slot liên tiếp -> Bắt đầu Transaction -> Khóa kiểm tra slot (`dang_khoa = 1`) -> Tạo `don_dat` PENDING -> Giữ slot -> Hẹn giờ 30 phút -> Commit.
5. **Thanh Toán Chuyển Khoản:** Khách quét VietQR -> Chuyển tiền thành công -> Nhân viên tại quầy kiểm tra tiền về -> Chuyển đơn sang CONFIRMED.
6. **Hết Hạn Giữ Chỗ (Scheduler):** Job quét mỗi 30s -> Phát hiện đơn PENDING quá hạn -> Bắt đầu Transaction -> Đổi EXPIRED -> Nhả slot (`dang_khoa = NULL`) -> Giải phóng tồn kho dịch vụ nếu có -> Commit.
7. **Khách Hủy Đơn:** Khách gửi yêu cầu hủy -> Kiểm tra >= 6h trước giờ đá & chưa giao DV -> Hủy đơn -> Nhả slot -> Nếu đã PAID thì tạo yêu cầu hoàn tiền REFUND PENDING.
8. **Xác Nhận Hoàn Tiền:** Staff xem danh sách hoàn tiền -> Thực hiện chuyển khoản trả tiền cho khách -> Xác nhận trên Web Admin -> Cập nhật `thanh_toan` SUCCESS và `don_dat` REFUNDED.
9. **Đặt Sân Tại Quầy (Walk-in):** Staff chọn sân, slot cho khách vãng lai -> Tạo đơn CONFIRMED -> Nhận tiền mặt hoặc CK -> Ghi nhận `thanh_toan` SUCCESS ngay lập tức.
10. **Gọi Dịch Vụ Ra Sân:** Khách/Staff gửi yêu cầu món -> Bắt đầu Transaction -> Khóa tồn kho (`SELECT ... FOR UPDATE`) -> Kiểm tra `available >= requested` -> Tạo `yeu_cau_dich_vu` -> Tăng `so_luong_dang_giu` (RESERVE) -> Commit.
11. **Giao Dịch Vụ Ra Sân:** Staff mang đồ ra sân -> Xác nhận DELIVERED -> Trừ `so_luong` tồn kho thực tế, giảm `so_luong_dang_giu` -> Ghi log DELIVER -> Tiền DV tính vào hóa đơn.
12. **Hủy Yêu Cầu Dịch Vụ:** Hủy yêu cầu đang REQUESTED -> Giải phóng `so_luong_dang_giu` (RELEASE) -> Phục hồi khả dụng kho.
13. **Thu Hồi Đồ Thuê (Rental Return):** Khách trả đồ -> Staff kiểm tra dụng cụ -> Bấm xác nhận trả đồ -> Cập nhật `tra_luc = NOW()` -> Cộng lại `so_luong` tồn kho thực tế (RETURN) -> Ghi log RETURN.
14. **Thu Tiền Dịch Vụ:** Staff mở hóa đơn đơn đặt -> Chọn thu tiền mặt/CK cho phần tiền dịch vụ còn thiếu -> Tạo bản ghi `thanh_toan` loại PAYMENT, mục đích SERVICE.
15. **Hoàn Thành Đơn Đặt:** Staff bấm hoàn thành đơn -> Kiểm tra: Đã thanh toán đủ 100%? Đã trả hết đồ thuê? -> Đạt điều kiện -> Đổi trạng thái `don_dat` sang COMPLETED.
16. **Đánh Dấu Không Đến (NO_SHOW):** Quá 15 phút sau giờ bắt đầu mà khách không đến -> Staff xác nhận NO_SHOW -> Đổi trạng thái đơn.
17. **Đóng Đơn Có Công Nợ (Admin Write-Off):** Khách nợ bỏ về -> Admin xem xét -> Bấm đóng đơn nợ -> Hủy DV REQUESTED -> Đổi `don_dat` sang COMPLETED kèm cờ `dong_don_cong_no = 1` -> Khoản nợ ghi vào báo cáo.
18. **Nhập Kho (Admin IMPORT):** Admin chọn dịch vụ, nhập số lượng, ghi chú -> Khóa kho -> Tăng `so_luong` -> Ghi log IMPORT trong `bien_dong_kho`.
19. **Điều Chỉnh Kho (Admin ADJUST):** Admin chọn ADJUST_IN hoặc ADJUST_OUT kèm lý do bắt buộc -> Khóa kho -> Kiểm tra không để khả dụng âm -> Cập nhật `so_luong` -> Ghi log ADJUST.
20. **Cập Nhật Ngưỡng Cảnh Báo:** Admin cập nhật threshold -> Hệ thống tính toán lại trạng thái cảnh báo (IN_STOCK / LOW_STOCK / OUT_OF_STOCK).
21. **Đặt Sân Sự Kiện (Event Booking):** Đặt mặt bằng sự kiện với `loai_san.phan_loai = EVENT` -> Áp dụng luồng đặt sân chuẩn kết hợp kiểm tra sức chứa `san.suc_chua` và phục vụ gói tiệc.

---

# 34. ĐẶC TẢ LUỒNG TƯƠNG TÁC TUẦN TỰ (SEQUENCE FLOW SPECIFICATIONS)

### Luồng Tranh Chấp Đặt Sân Đồng Thời (Booking Concurrency Sequence):
```
Client 1                 Client 2                Controller             Service               Database (MySQL)
   |                        |                        |                     |                        |
   |-- POST /bookings ----->|                        |                     |                        |
   |   (Slot 1, 08:00)      |                        |                     |                        |
   |                        |-- POST /bookings ----->|                     |                        |
   |                        |   (Slot 1, 08:00)      |                     |                        |
   |                        |                        |-- taoDonDat() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- INSERT chi_tiet... ->| (Dang_khoa=1) -> Thành công!
   |                        |                        |                     |-- COMMIT ------------->|
   |<-- 201 Created --------|------------------------|                     |                        |
   |                        |                        |-- taoDonDat() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- INSERT chi_tiet... ->| ER_DUP_ENTRY (san, ngay, slot, 1)
   |                        |                        |                     |-- ROLLBACK ----------->|
   |                        |<-- 409 Conflict (SLOT_TAKEN) ----------------|                        |
```

### Luồng Giữ Chỗ Tồn Kho Dịch Vụ Đồng Thời (Inventory Reserve Concurrency Sequence):
```
Client A                 Client B                Controller             Service               Database (MySQL)
   |                        |                        |                     |                        |
   |-- POST service-orders -|                        |                     |                        |
   |   (Qty: 1)             |                        |                     |                        |
   |                        |-- POST service-orders -|                     |                        |
   |                        |   (Qty: 1)             |                     |                        |
   |                        |                        |-- taoYeuCau() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- SELECT FOR UPDATE -->| (Row locked for Client A)
   |                        |                        |-- taoYeuCau() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- SELECT FOR UPDATE -->| (Chờ khóa giải phóng...)
   |                        |                        |                     |-- Validate available ->| (Đủ hàng)
   |                        |                        |                     |-- UPDATE so_luong_dang_giu
   |                        |                        |                     |-- INSERT bien_dong_kho |
   |                        |                        |                     |-- COMMIT ------------->| (Khóa giải phóng!)
   |<-- 201 Created --------|------------------------|                     |                        |
   |                        |                        |                     |-- Đọc row mới -------->| (Available giảm 1)
   |                        |                        |                     |-- Validate available ->| (Hết hàng -> Thất bại!)
   |                        |                        |                     |-- ROLLBACK ----------->|
   |                        |<-- 422 INSUFFICIENT_STOCK -------------------|                        |
```

---

# 35. DANH MỤC GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API ENDPOINTS CATALOG)

### 1. Xác thực & Tài khoản (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Đăng ký tài khoản khách hàng mới.
- `POST /api/v1/auth/login`: Đăng nhập hệ thống (Customer, Staff, Admin).
- `GET /api/v1/auth/me`: Lấy thông tin cá nhân hiện tại.
- `PUT /api/v1/auth/profile`: Cập nhật họ tên, email.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu cá nhân.

### 2. Danh mục Công Khai (`/api/v1`)
- `GET /api/v1/court-types`: Danh sách loại sân đang hoạt động.
- `GET /api/v1/courts`: Danh sách sân thể thao và mặt bằng sự kiện.
- `GET /api/v1/courts/:id`: Chi tiết một sân cụ thể.
- `GET /api/v1/courts/:id/availability?date=YYYY-MM-DD`: Xem trạng thái 15 slot trong ngày của một sân.
- `GET /api/v1/time-slots`: Danh mục 15 khung giờ tiêu chuẩn.
- `GET /api/v1/slot-prices`: Ma trận giá công khai.
- `GET /api/v1/services`: Danh mục dịch vụ niêm yết (ẩn số tồn kho, chỉ hiển thị `isAvailable`).

### 3. Nghiệp vụ Khách Hàng (`/api/v1/bookings`)
- `POST /api/v1/bookings`: Tạo đơn đặt sân trực tuyến (1-3 slot liên tiếp).
- `GET /api/v1/bookings/my`: Xem lịch sử đơn đặt của chính mình.
- `GET /api/v1/bookings/:id`: Xem chi tiết đơn đặt và hóa đơn của chính mình.
- `POST /api/v1/bookings/:id/cancel`: Hủy đơn đặt sân (kiểm tra điều kiện >= 6h & chưa giao DV).
- `POST /api/v1/bookings/:id/service-orders`: Gửi yêu cầu gọi dịch vụ ra sân.
- `GET /api/v1/bookings/:id/invoice`: Xem hóa đơn tổng hợp động của đơn.
- `POST /api/v1/bookings/:id/service-orders/:orderId/cancel`: Hủy yêu cầu dịch vụ đang REQUESTED.
- `POST /api/v1/bookings/:id/review`: Đánh giá đơn đặt sân đã COMPLETED (1-5 sao).

### 4. Nghiệp vụ Vận Hành Nhân Viên (`/api/v1/staff`)
- `GET /api/v1/staff/dashboard`: Xem số liệu tổng quan điều hành hôm nay.
- `GET /api/v1/staff/schedule?date=YYYY-MM-DD`: Xem sơ đồ lưới lịch tất cả các sân theo ngày.
- `GET /api/v1/staff/courts/:id/availability?date=YYYY-MM-DD`: Tra cứu lịch sân chi tiết tại quầy.
- `GET /api/v1/staff/bookings`: Tra cứu danh sách đơn đặt (lọc theo ngày, trạng thái, SĐT).
- `GET /api/v1/staff/bookings/:id`: Xem chi tiết hồ sơ đơn đặt.
- `POST /api/v1/staff/bookings`: Đặt sân trực tiếp tại quầy cho khách vãng lai.
- `POST /api/v1/staff/bookings/:id/payments`: Ghi nhận thanh toán tiền sân.
- `POST /api/v1/staff/bookings/:id/complete`: Hoàn thành đơn đặt sân khi đủ điều kiện.
- `POST /api/v1/staff/bookings/:id/no-show`: Đánh dấu khách không đến (NO_SHOW).
- `POST /api/v1/staff/bookings/:id/cancel`: Nhân viên hủy đơn thay khách.
- `GET /api/v1/staff/refunds`: Danh sách các khoản tiền cần hoàn trả.
- `POST /api/v1/staff/payments/:id/confirm-refund`: Xác nhận đã hoàn tiền cho khách.
- `GET /api/v1/staff/customers`: Tìm kiếm thông tin khách hàng.
- `GET /api/v1/staff/service-orders`: Xem hàng đợi yêu cầu dịch vụ cần phục vụ.
- `POST /api/v1/staff/service-orders/:id/deliver`: Xác nhận giao dịch vụ ra sân.
- `POST /api/v1/staff/service-orders/:id/cancel`: Nhân viên hủy yêu cầu dịch vụ kèm lý do.
- `POST /api/v1/staff/bookings/:id/service-orders`: Nhập yêu cầu dịch vụ tại quầy cho khách.
- `POST /api/v1/staff/service-order-items/:id/return`: Xác nhận nhận lại đồ thuê (Rental Return).
- `GET /api/v1/staff/bookings/:id/invoice`: Xem chi tiết hóa đơn tại quầy.
- `POST /api/v1/staff/bookings/:id/service-payments`: Thu tiền dịch vụ tại quầy.
- `PATCH /api/v1/staff/services/:id/availability`: Bật/tắt tạm thời trạng thái hết hàng của dịch vụ.
- `GET /api/v1/staff/inventory`: Xem danh sách số lượng tồn kho khả dụng phục vụ vận hành.

### 5. Quản Trị Hệ Thống (`/api/v1/admin`)
- `GET /api/v1/admin/court-types`, `POST`, `PUT /:id`, `PATCH /:id/active`: Quản lý danh mục loại sân.
- `GET /api/v1/admin/courts`, `POST`, `PUT /:id`, `PATCH /:id/status`: Quản lý sân và bảo trì sân.
- `GET /api/v1/admin/time-slots`, `POST`, `PUT /:id`, `PATCH /:id/active`: Cấu hình danh mục khung giờ.
- `GET /api/v1/admin/slot-prices`, `PUT /api/v1/admin/slot-prices`: Cập nhật bảng giá ma trận hàng loạt.
- `GET /api/v1/admin/staff`, `POST`, `PUT /:id`, `PATCH /:id/status`, `POST /:id/reset-password`: Quản lý nhân viên.
- `GET /api/v1/admin/customers`, `PATCH /:id/status`, `POST /:id/reset-password`: Quản lý tài khoản khách.
- `POST /api/v1/admin/bookings/:id/close-with-debt`: Đặc quyền đóng đơn có công nợ (Write-off debt).
- `GET /api/v1/admin/services`, `POST`, `PUT /:id`, `PATCH /:id/status`: Quản lý dịch vụ niêm yết.
- `GET /api/v1/admin/reports/summary`: Báo cáo tổng quan KPI điều hành.
- `GET /api/v1/admin/reports/revenue`: Báo cáo doanh thu tài chính chi tiết.
- `GET /api/v1/admin/reports/court-usage`: Báo cáo tỷ lệ sử dụng sân.
- `GET /api/v1/admin/reports/services`: Báo cáo doanh số dịch vụ bán chạy.
- `GET /api/v1/admin/inventory`: Xem danh sách quản trị tồn kho đầy đủ.
- `GET /api/v1/admin/inventory/transactions`: Xem nhật ký biến động kho kiểm toán có phân trang.
- `POST /api/v1/admin/inventory/import`: Nhập thêm hàng vào kho (IMPORT).
- `POST /api/v1/admin/inventory/adjust`: Điều chỉnh tăng/giảm tồn kho (ADJUST_IN, ADJUST_OUT).
- `PATCH /api/v1/admin/inventory/:serviceId/threshold`: Cập nhật ngưỡng cảnh báo kho.

---

# 36. QUY CHUẨN KIỂM ĐỊNH DỮ LIỆU ĐẦU VÀO (ZOD VALIDATION)

Toàn bộ tham số đầu vào được tiền xử lý và kiểm định chặt chẽ bằng Zod Schema:
- **Chuỗi số điện thoại:** Định dạng chuẩn Việt Nam 10 chữ số, bắt đầu bằng `0[3|5|7|8|9]`.
- **Mật khẩu:** Tối thiểu 6 ký tự.
- **Ngày đặt sân:** Chuỗi `YYYY-MM-DD` hợp lệ, không phải ngày trong quá khứ, không quá 14 ngày tới.
- **Khung giờ đặt:** Mảng từ 1 đến 3 số nguyên dương liên tiếp.
- **Tiền tệ:** Số nguyên không âm (`z.number().int().nonnegative()`).
- **Số lượng dịch vụ:** Mỗi dòng từ 1 đến 20 (`z.number().int().min(1).max(20)`).
- **Lý do hủy / Điều chỉnh:** Bắt buộc tối thiểu 3 đến 5 ký tự (`z.string().trim().min(3).max(500)`).

---

# 37. DANH MỤC MÃ LỖI NGHIỆP VỤ CHUẨN HÓA (STANDARDIZED ERROR CODES)

| Mã Lỗi (Error Code) | HTTP Status | Diễn Giải Chi Tiết |
| :--- | :--- | :--- |
| `SLOT_TAKEN` | 409 Conflict | Khung giờ sân đã có người khác đặt giữ chỗ trước |
| `DOUBLE_BOOKING` | 409 Conflict | Xung đột đặt trùng lịch trên cùng một sân |
| `TOO_MANY_ACTIVE_BOOKINGS`| 429 Too Many Req | Khách vượt quá giới hạn 3 đơn PENDING đang hoạt động |
| `INVALID_STATE` / `INVALID_STATUS`| 409 Conflict | Trạng thái thực thể không cho phép thực hiện hành động này |
| `HAS_DELIVERED_SERVICES` | 409 Conflict | Không thể hủy đơn vì đã có dịch vụ giao ra sân |
| `HAS_UNRETURNED_RENTALS` | 409 Conflict | Không thể hoàn thành đơn vì còn đồ thuê chưa được trả |
| `INSUFFICIENT_STOCK` | 422 Unprocessable | Số lượng khả dụng trong kho không đủ đáp ứng |
| `NOT_RENTAL_ITEM` | 422 Unprocessable | Món dịch vụ không phải đồ thuê để nhận trả |
| `REFUND_INFO_REQUIRED` | 422 Unprocessable | Bắt buộc nhập thông tin nhận tiền hoàn khi hủy đơn đã PAID |
| `CANNOT_CANCEL` | 422 Unprocessable | Không thể hủy đơn vì vi phạm quy định thời gian trước 6 giờ |
| `CANNOT_LOCK_SELF` | 409 Conflict | Quản trị viên không được phép tự khóa tài khoản của chính mình |
| `UNAUTHORIZED` | 401 Unauthorized | Thiếu hoặc sai lệch mã thông báo xác thực JWT |
| `FORBIDDEN` | 403 Forbidden | Vai trò người dùng không có quyền truy cập endpoint này |
| `ACCOUNT_LOCKED` | 403 Forbidden | Tài khoản người dùng đã bị khóa hoạt động |
| `NOT_FOUND` | 404 Not Found | Không tìm thấy tài nguyên yêu cầu trong cơ sở dữ liệu |
| `VALIDATION_ERROR` | 400 Bad Request | Dữ liệu đầu vào không thỏa mãn lược đồ Zod Schema |

---

# 38. RANH GIỚI GIAO DỊCH DỮ LIỆU (TRANSACTION BOUNDARIES)

Mọi thao tác làm thay đổi nhiều bảng liên quan hoặc yêu cầu tính toàn vẹn tài chính/tồn kho đều được bọc trong hàm tiện ích `voiGiaoDich` (quản lý `START TRANSACTION`, `COMMIT`, `ROLLBACK` tự động):

1. **Giao dịch Đặt Sân (Booking Transaction):**
   - Bắt đầu Transaction.
   - Thẩm định điều kiện slot và số lượng đơn PENDING.
   - Insert bản ghi `don_dat`.
   - Insert 1..3 bản ghi `chi_tiet_khung_gio_dat` (`dang_khoa = 1`).
   - Ghi nhật ký chuyển trạng thái `nhat_ky_trang_thai_don`.
   - Nếu là đặt tại quầy có thu tiền: Insert `thanh_toan`.
   - Commit Transaction.

2. **Giao dịch Giữ Chỗ Tồn Kho Dịch Vụ (Inventory Reserve Transaction):**
   - Bắt đầu Transaction.
   - Khóa bản ghi tồn kho: `SELECT ... FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`.
   - Tính toán `availableQuantity = so_luong - so_luong_dang_giu`.
   - Nếu `availableQuantity < requested`: Rollback và ném lỗi `422 INSUFFICIENT_STOCK`.
   - Insert `yeu_cau_dich_vu` và `chi_tiet_yeu_cau_dich_vu`.
   - Cập nhật: `UPDATE ton_kho_dich_vu SET so_luong_dang_giu = so_luong_dang_giu + requested`.
   - Ghi bản ghi `bien_dong_kho` loại `RESERVE`.
   - Commit Transaction.

3. **Giao dịch Hoàn Tất Thu Hồi Đồ Thuê (Rental Return Transaction):**
   - Bắt đầu Transaction.
   - Khóa dòng chi tiết yêu cầu: `SELECT ... FROM chi_tiet_yeu_cau_dich_vu WHERE id = ? FOR UPDATE`.
   - Kiểm tra `tra_luc IS NULL` và `phan_loai = 'RENTAL'`.
   - Cập nhật `tra_luc = NOW()`, `nguoi_nhan_tra_id`.
   - Khóa và cộng lại kho: `UPDATE ton_kho_dich_vu SET so_luong = so_luong + requested`.
   - Ghi bản ghi `bien_dong_kho` loại `RETURN`.
   - Commit Transaction.

---

# 39. KIỂM SOÁT XUNG ĐỘT ĐỒNG THỜI (CONCURRENCY CONTROL STRATEGY)

1. **Khóa Bi Lạc Quan Tầng CSDL (Unique Constraint Barrier):** Ràng buộc `UNIQUE KEY uq_slot_dang_khoa (san_id, ngay_dat, khung_gio_id, dang_khoa)` đảm bảo trong cùng một mili-giây, nếu có 100 yêu cầu cùng tranh chấp một slot, duy nhất 1 yêu cầu thành công, 99 yêu cầu còn lại bị MySQL chặn đứng với lỗi `ER_DUP_ENTRY` và Backend ánh xạ thành HTTP `409 Conflict (SLOT_TAKEN)`.
2. **Khóa Bi Quan Tầng Kho Dữ Liệu (Pessimistic Locking `SELECT ... FOR UPDATE`):** Đảm bảo tính tuần tự hóa (Serialization) khi nhiều luồng cùng gọi đồ uống hoặc dụng cụ tập luyện có số lượng hạn chế. Không bao giờ xảy ra hiện tượng tồn kho âm hay bán vượt số lượng tồn thực tế.

---

# 40. GIAO DIỆN CỔNG QUẢN TRỊ WEB (WEB ADMIN PORTAL)

- **Địa chỉ truy cập nội bộ:** `http://localhost:3000/admin/index.html`.
- **Giao diện vận hành Nhân viên (Staff):**
  - Dashboard tổng quan hôm nay (STF-02).
  - Lịch sân theo ngày (STF-03).
  - Danh sách đơn đặt và tra cứu (STF-04).
  - Đặt sân tại quầy cho khách vãng lai (STF-05).
  - Hàng đợi dịch vụ cần giao ra sân (STF-10).
  - Quản lý tồn kho vận hành (Xem tồn khả dụng, theo dõi hết hàng).
  - Xử lý hoàn tiền cho khách (STF-09).
  - Tra cứu khách hàng (STF-15).
- **Giao diện Quản trị viên (Admin):**
  - Quản lý loại sân và sân thi đấu (ADM-01, ADM-02).
  - Cấu hình khung giờ và ma trận giá (ADM-03).
  - Quản lý dịch vụ niêm yết (ADM-08).
  - Quản trị tồn kho nâng cao: Nhập kho (IMPORT), Điều chỉnh kiểm kê (ADJUST), Cấu hình ngưỡng cảnh báo, Xem toàn bộ nhật ký biến động kho (Audit Trail).
  - Quản lý tài khoản nhân viên (ADM-04).
  - Quản lý khách hàng (ADM-06).
  - Đóng đơn có công nợ (ADM-05).
  - Báo cáo tài chính, doanh thu và tỷ lệ sử dụng sân (ADM-07).

---

# 41. GIAO DIỆN ỨNG DỤNG DI ĐỘNG (MOBILE APPLICATION)

- **Công nghệ xây dựng:** React Native với Expo SDK.
- **Màn hình chính của Khách hàng:**
  - Màn hình Khám phá & Tra cứu sân theo ngày, loại sân và giờ.
  - Màn hình Chọn slot và Đặt sân (hiển thị VietQR động để chuyển khoản).
  - Màn hình Chi tiết đơn đặt: theo dõi trạng thái, xem hóa đơn động thời gian thực.
  - Màn hình Gọi dịch vụ ăn uống & thuê dụng cụ tại sân (kiểm tra tồn khả dụng).
  - Màn hình Đánh giá chất lượng sân và gửi phản hồi.
  - Màn hình Quản lý hồ sơ và đổi mật khẩu.

---

# 42. MA TRẬN PHÂN QUYỀN ACTOR – USE CASE (ACTOR–USE CASE MATRIX)

| Mã UC | Tên Use Case | CUSTOMER | STAFF | ADMIN | SCHEDULER |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **UC-01** | Đăng ký tài khoản | Allowed | Allowed | Allowed | N/A |
| **UC-02** | Đăng nhập hệ thống | Allowed | Allowed | Allowed | N/A |
| **UC-03** | Tra cứu sân & lịch trống | Allowed | Allowed | Allowed | N/A |
| **UC-04** | Đặt lịch sân trực tuyến | Allowed | Forbidden | Forbidden | N/A |
| **UC-05** | Đặt lịch sân tại quầy | Forbidden | Allowed | Allowed | N/A |
| **UC-06** | Ghi nhận thanh toán tiền sân | Forbidden | Allowed | Allowed | N/A |
| **UC-07** | Quét đơn giữ chỗ hết hạn | N/A | N/A | N/A | Automatic |
| **UC-08** | Khách hủy đơn đặt sân | Allowed | Forbidden | Forbidden | N/A |
| **UC-09** | Nhân viên hủy đơn thay khách | Forbidden | Allowed | Allowed | N/A |
| **UC-10** | Xác nhận hoàn tiền cho khách | Forbidden | Allowed | Allowed | N/A |
| **UC-11** | Hoàn thành đơn đặt sân | Forbidden | Allowed | Allowed | N/A |
| **UC-12** | Đánh dấu khách không đến (NO_SHOW) | Forbidden | Allowed | Allowed | N/A |
| **UC-13** | Đánh giá chất lượng đơn đặt | Allowed | Forbidden | Forbidden | N/A |
| **UC-14** | Yêu cầu gọi dịch vụ ra sân | Allowed | Allowed | Allowed | N/A |
| **UC-15** | Giao dịch vụ ra sân | Forbidden | Allowed | Allowed | N/A |
| **UC-16** | Hủy yêu cầu dịch vụ | Allowed | Allowed | Allowed | N/A |
| **UC-17** | Thu hồi dụng cụ thuê (Return Rental) | Forbidden | Allowed | Allowed | N/A |
| **UC-18** | Thu tiền dịch vụ phát sinh | Forbidden | Allowed | Allowed | N/A |
| **UC-19** | Xem danh sách tồn kho vận hành | Forbidden | Allowed | Allowed | N/A |
| **UC-20** | Nhập kho dịch vụ (IMPORT) | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-21** | Điều chỉnh tồn kho (ADJUST) | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-22** | Cấu hình ngưỡng cảnh báo kho | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-23** | Xem nhật ký biến động kho (Audit) | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-24** | Đóng đơn có công nợ (Write-off debt) | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-25** | Quản lý danh mục loại sân & sân | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-26** | Quản lý bảng giá ma trận | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-27** | Quản lý tài khoản nhân viên | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-28** | Quản lý danh mục dịch vụ niêm yết | Forbidden | **Forbidden** | Allowed | N/A |
| **UC-29** | Xem báo cáo tài chính & doanh thu | Forbidden | **Forbidden** | Allowed | N/A |

---

# 43. CÂY PHÂN RÃ USE CASE CHI TIẾT (USE CASE DECOMPOSITION)

### 1. Phân rã UC-04: Đặt lịch sân trực tuyến (Customer)
- Tra cứu danh mục sân và chọn môn thể thao.
- Kiểm tra tính khả dụng của từng slot trong ngày đã chọn.
- Chọn từ 1 đến 3 slot liên tiếp trên cùng một sân.
- Hệ thống thẩm định thời gian đặt trước ít nhất 30 phút.
- Hệ thống tính toán tổng tiền snapshot theo bảng giá ma trận.
- Chọn hình thức thanh toán chuyển khoản ngân hàng (VietQR).
- Tạo đơn đặt PENDING và giữ slot trong vòng 30 phút.

### 2. Phân rã UC-14: Quản lý dịch vụ phát sinh tại sân
- Khách hàng xem danh mục món có sẵn (`isAvailable = true`).
- Chọn món và số lượng mong muốn (tối đa 20/món).
- Hệ thống khóa kiểm tra tồn khả dụng (`availableQuantity >= requested`).
- Tạo yêu cầu dịch vụ ở trạng thái `REQUESTED`.
- Tự động giữ chỗ kho (RESERVE) và ghi nhật ký biến động kho.
- Nhân viên giao hàng ra sân và xác nhận `DELIVERED`.
- Hệ thống trừ tồn kho thực tế và cập nhật tiền dịch vụ vào hóa đơn.

### 3. Phân rã UC-20 & UC-21: Quản trị tồn kho chuyên sâu (Admin)
- Admin tra cứu danh sách tồn kho, lọc theo loại dịch vụ hoặc trạng thái cảnh báo.
- Thao tác Nhập kho (IMPORT): Chọn dịch vụ, nhập số lượng dương, ghi chú nguồn hàng.
- Thao tác Điều chỉnh kho (ADJUST): Chọn loại điều chỉnh (ADJUST_IN / ADJUST_OUT), nhập số lượng và bắt buộc nhập lý do biên bản kiểm kê.
- Hệ thống xác thực không cho phép điều chỉnh giảm vượt quá tồn khả dụng.
- Cập nhật số lượng và ghi bản ghi nhật ký bất biến vào `bien_dong_kho`.

---

# 44. MA TRẬN ÁNH XẠ USE CASE – CLASS – TABLE – API

| Use Case | Actor | Entity Class | Table | HTTP Method & API Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| Đặt lịch sân online | CUSTOMER | `DonDat` | `don_dat`, `chi_tiet_khung_gio_dat` | `POST /api/v1/bookings` |
| Đặt sân tại quầy | STAFF | `DonDat` | `don_dat`, `thanh_toan` | `POST /api/v1/staff/bookings` |
| Hủy đơn online | CUSTOMER | `DonDat` | `don_dat`, `thanh_toan` | `POST /api/v1/bookings/:id/cancel` |
| Hủy đơn thay khách | STAFF | `DonDat` | `don_dat`, `thanh_toan` | `POST /api/v1/staff/bookings/:id/cancel` |
| Quét hết hạn đơn | SCHEDULER | `DonDat` | `don_dat`, `chi_tiet_khung_gio_dat` | `Internal Job (quetDonHetHan)` |
| Gọi dịch vụ ra sân | CUSTOMER | `YeuCauDichVu` | `yeu_cau_dich_vu`, `ton_kho_dich_vu` | `POST /api/v1/bookings/:id/service-orders` |
| Giao dịch vụ ra sân | STAFF | `YeuCauDichVu` | `yeu_cau_dich_vu`, `ton_kho_dich_vu` | `POST /api/v1/staff/service-orders/:id/deliver` |
| Hủy yêu cầu dịch vụ | CUST/STAFF| `YeuCauDichVu` | `yeu_cau_dich_vu`, `ton_kho_dich_vu` | `POST .../service-orders/:id/cancel` |
| Trả đồ thuê | STAFF | `ChiTietYeuCau`| `chi_tiet_yeu_cau_dich_vu`, `ton_kho` | `POST /api/v1/staff/service-order-items/:id/return` |
| Thu tiền dịch vụ | STAFF | `ThanhToan` | `thanh_toan`, `don_dat` | `POST /api/v1/staff/bookings/:id/service-payments` |
| Hoàn thành đơn đặt | STAFF | `DonDat` | `don_dat` | `POST /api/v1/staff/bookings/:id/complete` |
| Đóng đơn có công nợ | ADMIN | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/admin/bookings/:id/close-with-debt` |
| Xem tồn kho vận hành | STAFF/ADMIN| `TonKhoDichVu` | `ton_kho_dich_vu`, `dich_vu` | `GET /api/v1/staff/inventory` |
| Nhập kho dịch vụ | ADMIN | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho` | `POST /api/v1/admin/inventory/import` |
| Điều chỉnh kho | ADMIN | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho` | `POST /api/v1/admin/inventory/adjust` |
| Cập nhật ngưỡng kho | ADMIN | `TonKhoDichVu` | `ton_kho_dich_vu` | `PATCH /api/v1/admin/inventory/:id/threshold` |
| Xem nhật ký kho | ADMIN | `BienDongKho` | `bien_dong_kho` | `GET /api/v1/admin/inventory/transactions` |
| Quản lý bảng giá | ADMIN | `GiaKhungGio` | `gia_khung_gio` | `PUT /api/v1/admin/slot-prices` |
| Quản lý nhân viên | ADMIN | `NguoiDung` | `nguoi_dung` | `POST /api/v1/admin/staff` |
| Xem báo cáo doanh thu| ADMIN | `ThanhToan` | `thanh_toan`, `don_dat` | `GET /api/v1/admin/reports/revenue` |

---

# 45. DANH MỤC KỊCH BẢN KIỂM THỬ TỰ ĐỘNG (TEST CASES CATALOG)

Toàn bộ hệ thống được bảo vệ bởi 10 bộ kịch bản kiểm thử tích hợp tự động (Integration Test Suites):
1. `tests/danhmuc.test.ts`: Kiểm thử danh mục công khai (loại sân, sân, khung giờ, bảng giá ma trận).
2. `tests/xacthuc.test.ts`: Kiểm thử đăng ký, đăng nhập, cấp phát JWT, xác thực mật khẩu băm, vô hiệu hóa tài khoản LOCKED.
3. `tests/dondat-concurrency.test.ts`: Kiểm thử đặt sân đồng thời, cơ chế giữ chỗ 30 phút, tranh chấp đặt trùng lịch (Barrier Pattern).
4. `tests/nhanvien-dondat.test.ts`: Kiểm thử đặt sân tại quầy cho khách vãng lai, thu tiền mặt, hoàn thành đơn, đánh dấu NO_SHOW.
5. `tests/dichvu-hoadon.test.ts`: Kiểm thử gọi món ra sân, giao hàng, thu hồi dụng cụ cho thuê, tính toán hóa đơn động, kiểm tra nợ.
6. `tests/bva-rbac.test.ts`: Kiểm thử giá trị biên (BVA) 1-3 slot, biên 14 ngày, biên hủy 6 giờ, phân tích múi giờ UTC+7.
7. `tests/quantri-baocao.test.ts`: Kiểm thử các tính năng Admin: đổi trạng thái sân, cập nhật bảng giá hàng loạt, báo cáo doanh thu, đóng đơn công nợ (Write-off debt).
8. `tests/e2e-flows.test.ts`: Kiểm thử luồng nghiệp vụ đầu cuối (E1 đến E7).
9. `tests/rbac-strict.test.ts` (Mới): Kiểm thử ranh giới phân quyền nghiêm ngặt giữa Customer, Staff, Admin; ngăn chặn Staff truy cập Master Data, Price, Staff Management, Debt Write-off, Inventory Admin operations; kiểm tra Admin không thể tự khóa chính mình.
10. `tests/inventory.test.ts` (Mới): Kiểm thử toàn diện module tồn kho: khởi tạo tồn kho 0, ẩn số tồn với khách, Admin nhập kho (IMPORT), điều chỉnh tăng (ADJUST_IN), điều chỉnh giảm (ADJUST_OUT), từ chối xuất quá số lượng khả dụng, cập nhật ngưỡng cảnh báo, kiểm tra trạng thái LOW_STOCK/OUT_OF_STOCK, đặt dịch vụ giữ chỗ (RESERVE), hủy đơn nhả giữ chỗ (RELEASE), giao hàng trừ tồn (DELIVER), trả đồ thuê cộng tồn (RETURN), xem nhật ký biến động kho kiểm toán và **Kiểm thử tranh chấp đồng thời 15 yêu cầu đặt cạnh tranh 10 sản phẩm tồn kho**.

---

# 46. BÁO CÁO KẾT QUẢ KIỂM THỬ THỰC TẾ (AUTOMATED TEST EXECUTION RESULTS)

Kết quả thực thi toàn bộ 10 Test Suites trên môi trường máy chủ thực tế:

```
PASS tests/dondat-concurrency.test.ts
PASS tests/e2e-flows.test.ts
PASS tests/inventory.test.ts
PASS tests/bva-rbac.test.ts
PASS tests/rbac-strict.test.ts
PASS tests/nhanvien-dondat.test.ts
PASS tests/dichvu-hoadon.test.ts
PASS tests/xacthuc.test.ts
PASS tests/quantri-baocao.test.ts
PASS tests/danhmuc.test.ts

--------------------------------------------------------------------------------
Test Suites: 10 passed, 10 total
Tests:       98 passed, 98 total
Snapshots:   0 total
Time:        10.741 s
Trạng thái:  100% PASS - HOÀN TOÀN KHÔNG CÓ REGRESSION
--------------------------------------------------------------------------------
```

---

# 47. QUY CHUẨN DI CHUYỂN LƯỢC ĐỒ CSDL (DATABASE MIGRATIONS)

- Quá trình nâng cấp từ 13 bảng lên 15 bảng (`ton_kho_dich_vu`, `bien_dong_kho`) được thực hiện theo nguyên tắc an toàn dữ liệu tuyệt đối (Zero Data Loss):
  - Bổ sung bảng 14 (`ton_kho_dich_vu`) với ràng buộc khóa ngoại tham chiếu sang `dich_vu(id)` có cơ chế `ON DELETE CASCADE`.
  - Bổ sung bảng 15 (`bien_dong_kho`) với cơ chế `ON DELETE CASCADE` cho dịch vụ và `ON DELETE SET NULL` cho các tham chiếu `don_dat_id`, `yeu_cau_dich_vu_id`, `nguoi_thuc_hien_id` để đảm bảo khi dọn dẹp đơn đặt không phá vỡ tính toàn vẹn dữ liệu kiểm toán.
  - Tự động nạp giá trị ban đầu cho 11 dịch vụ mẫu trong `seed.sql`.

---

# 48. CHIẾN LƯỢC KHỞI TẠO DỮ LIỆU MẪU (DATABASE SEEDING)

Tệp `database/seed.sql` và kịch bản `scripts/taoadmin.ts` khởi tạo sẵn hệ sinh thái dữ liệu hoàn chỉnh phục vụ kiểm thử và chạy thử nghiệm:
- **Tài khoản quản trị (ADMIN):** SĐT `0900000001`, Mật khẩu `admin123456`.
- **Tài khoản nhân viên (STAFF):** SĐT `0900000002`, Mật khẩu `123456`.
- **Tài khoản khách hàng (CUSTOMER):** SĐT `0911111111` (Khách A), `0922222222` (Khách B), Mật khẩu `123456`.
- **5 Loại sân:** Sân bóng đá mini, Sân cầu lông tiêu chuẩn, Sân tennis, Sân bóng rổ, Khu vực tiệc sự kiện.
- **9 Sân cụ thể:** Sân bóng đá 1, 2; Sân cầu lông 1, 2; Sân tennis 1, 2; Sân bóng rổ 1, 2; Khu tiệc nướng BBQ & Sự kiện.
- **15 Khung giờ:** Từ 06:00 đến 21:00 (đánh dấu giờ cao điểm 17:00 -> 21:00).
- **Bảng giá ma trận:** Cấu hình giá giờ thường (WEEKDAY) và cuối tuần (WEEKEND) cho tất cả các loại sân.
- **11 Dịch vụ niêm yết:** 4 loại nước uống (Nước suối, Nước tăng lực, Trà đá, Bia lon), 4 loại đồ thuê (Vợt cầu lông, Giày, Bóng, Áo bib), 3 gói tiệc (Gói tiệc nước, Gói BBQ, Trang trí sinh nhật).
- **11 Bản ghi tồn kho:** Khởi tạo số lượng tồn tương ứng cho 11 dịch vụ kèm theo 11 bản ghi giao dịch `IMPORT` ban đầu trong bảng `bien_dong_kho`.

---

# 49. GIỚI HẠN HỆ THỐNG & KHUYẾN NGHỊ SẢN PHẨM (SYSTEM LIMITATIONS)

1. **Bộ nhớ phiên làm việc trên Node.js đơn nhân (Single Node Runtime):** Hiện tại Job quét hết hạn đơn giữ chỗ chạy bằng `setInterval` trên tiến trình Node.js. Khi triển khai cụm nhiều máy chủ (Cluster / Multi-instance), khuyến nghị sử dụng hàng đợi phân tán như Redis BullMQ kết hợp Redis Distributed Lock (Redlock) để tránh nhiều tiến trình quét trùng một đơn.
2. **Cổng thanh toán thẻ tín dụng:** Hiện tại sử dụng hình thức chuyển khoản qua mã VietQR và xác nhận thủ công/webhook. Khi mở rộng quy mô, khuyến nghị tích hợp cổng thanh toán trực tiếp (PayOS / VNPay / MoMo SDK).
3. **Múi giờ máy chủ:** Toàn bộ hệ thống được cố định tại múi giờ UTC+7 (`Asia/Ho_Chi_Minh`) qua các hàm tiện ích trong `backend/src/utils/thoigian.ts` (`layNgayHomNay()`, `layGioHienTai()`). Máy chủ sản xuất cần bảo đảm biến môi trường `TZ=Asia/Ho_Chi_Minh`.

---

# 50. MA TRẬN TRUY XUẤT NGUỒN GỐC NGHIỆP VỤ TOÀN DIỆN (TRACEABILITY MATRIX)

| Yêu Cầu Nghiệp Vụ (Requirement) | Quy Tắc Chi Phối (BR) | Use Case Liên Quan | Entity Class | Bảng CSDL | API Endpoint Thực Tế | Kịch Bản Test Kiểm Chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Không đặt trùng lịch** | BR-15 | UC-04, UC-05 | `DonDat`, `ChiTietKhungGioDat` | `don_dat`, `chi_tiet_khung_gio_dat` | `POST /api/v1/bookings` | `dondat-concurrency.test.ts` |
| **Giữ chỗ 30 phút** | BR-06, BR-07 | UC-04, UC-07 | `DonDat` | `don_dat` | `Internal Job (quetDonHetHan)` | `dondat-concurrency.test.ts` |
| **Không bán vượt tồn kho (No Oversell)** | BR-35, BR-38 | UC-14 | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho`| `POST /api/v1/bookings/:id/service-orders` | `inventory.test.ts` (15 workers concurrent) |
| **Hoàn trả kho khi hủy yêu cầu** | BR-39 | UC-16 | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho`| `POST .../service-orders/:id/cancel` | `inventory.test.ts` |
| **Hoàn trả kho khi trả đồ thuê** | BR-27, BR-41 | UC-17 | `ChiTietYeuCauDichVu` | `chi_tiet_yeu_cau_dich_vu`, `ton_kho` | `POST /api/v1/staff/service-order-items/:id/return` | `inventory.test.ts` |
| **Phân quyền Staff không quản trị** | BR-18 | UC-20 → UC-29| `NguoiDung` | `nguoi_dung` | `POST /api/v1/admin/*` | `rbac-strict.test.ts` (Staff -> Admin = 403) |
| **Admin không tự khóa mình** | BR-31 | UC-27 | `NguoiDung` | `nguoi_dung` | `PATCH /api/v1/admin/staff/:id/status` | `rbac-strict.test.ts` (ADM-04 -> 409) |
| **Đóng đơn có công nợ an toàn** | BR-30 | UC-24 | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/admin/bookings/:id/close-with-debt` | `quantri-baocao.test.ts`, `rbac-strict.test.ts` |
| **Tính hóa đơn động minh bạch** | BR-24, BR-29 | UC-18 | `ThanhToan`, `DonDat`| `don_dat`, `thanh_toan`, `chi_tiet_yeu_cau` | `GET /api/v1/staff/bookings/:id/invoice` | `dichvu-hoadon.test.ts` |
| **Giới hạn thời gian hủy trước 6h** | BR-09, BR-34 | UC-08 | `DonDat` | `don_dat`, `thanh_toan` | `POST /api/v1/bookings/:id/cancel` | `bva-rbac.test.ts` |

---

> **KẾT LUẬN & CAM KẾT CHUẨN MỰC:**
> Tệp tài liệu `PROJECT_CONTEXT.md` này đã được đồng bộ hóa và đối chiếu toàn diện 8 lớp:
> **Requirement → Business Rule → Use Case → Class → Database → API → UI → Test.**
> Đây là bản tài liệu kỹ thuật hoàn chỉnh và chính xác tuyệt đối, sẵn sàng cung cấp ngữ cảnh tiêu chuẩn để sinh toàn bộ sơ đồ phân tích và thiết kế hệ thống (Use Case, Activity, Sequence, State, Class, ERD) mà không để lại bất kỳ sự mơ hồ hay giả định nào.
