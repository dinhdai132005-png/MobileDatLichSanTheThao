# TÀI LIỆU NGỮ CẢNH KỸ THUẬT VÀ NGUỒN SỰ THẬT TRUNG TÂM (PROJECT CONTEXT)
## HỆ THỐNG QUẢN LÝ VÀ ĐẶT LỊCH SÂN THỂ THAO 24/7 (SPORT BOOKING SYSTEM)
### Phiên Bản Kỹ Thuật: 1.4 (Bổ Sung Quản Lý Hóa Đơn Mua Hộ Ngoại Vi, Module Sự Kiện & Giải Đấu Thể Thao, Nâng Cấp 17 Bảng CSDL, Mô Hình Phân Tích Lớp VOPC, Ma Trận Phân Rã Use Case & Biểu Đồ Tuần Tự Toàn Diện)

> **MỤC ĐÍCH TÀI LIỆU NGUỒN SỰ THẬT (CENTRAL SOURCE OF TRUTH):**
> Tài liệu này là bản đặc tả kỹ thuật và nghiệp vụ chính xác nhất, phản ánh trung thực 100% hiện trạng mã nguồn máy chủ (Backend), cơ sở dữ liệu (MySQL 8.0+), cổng quản trị vận hành (Web Admin) và ứng dụng di động (Mobile App). 
> Mọi thành phần trong tài liệu được thiết kế chuyên sâu để làm căn cứ tiên quyết và duy nhất cho việc sinh trực tiếp chuỗi tài liệu thiết kế phần mềm tiêu chuẩn:
> **Requirement → Business Rule → Actor → Use Case → Use Case Decomposition → Use Case Specification → Activity Diagram → Sequence Diagram → State Diagram → Class Diagram → ERD → API → UI → Test Case → VOPC (View of Participating Classes).**
> Tuyệt đối không để kỹ sư phân tích hoặc người vẽ sơ đồ UML phải tự suy đoán bất kỳ quy tắc nghiệp vụ, quan hệ đối tượng hay ràng buộc dữ liệu nào.

---

# MỤC LỤC CHI TIẾT (52 PHẦN CHUẨN HÓA THEO MASTER PROMPT & THIẾT KẾ HỆ THỐNG)

1. [Tổng Quan Nghiệp Vụ](#1-tổng-quan-nghiệp-vụ)
2. [Phạm Vi Hệ Thống](#2-phạm-vi-hệ-thống)
3. [Các Tác Nhân Nghiệp Vụ (Actors)](#3-các-tác-nhân-nghiệp-vụ-actors)
4. [Mô Hình Phân Quyền Dựa Trên Vai Trò (RBAC)](#4-mô-hình-phân-quyền-dựa-trên-vai-trò-rbac)
5. [Nguyên Tắc An Toàn Nghiệp Vụ & Bảo Mật (Security Rules)](#5-nguyên-tắc-an-toàn-nghiệp-vụ--bảo-mật-security-rules)
6. [Kiến Trúc Hệ Thống (Architecture)](#6-kiến-trúc-hệ-thống-architecture)
7. [Ngăn Xếp Công Nghệ Thực Tế (Tech Stack)](#7-ngăn-xếp-công-nghệ-thực-tế-tech-stack)
8. [Cấu Trúc Mô-đun Hệ Thống (Modules)](#8-cấu-trúc-mô-đun-hệ-thống-modules)
9. [Tổng Quan Cơ Sở Dữ Liệu (Database Overview)](#9-tổng-quan-cơ-sở-dữ-liệu-database-overview)
10. [Chi Tiết Lược Đồ 17 Bảng Cơ Sở Dữ Liệu (Detailed Database Schema)](#10-chi-tiết-lược-đồ-17-bảng-cơ-sở-dữ-liệu-detailed-database-schema)
11. [Sơ Đồ Thực Thể Quan Hệ (Entity Relationship Diagram - ERD)](#11-sơ-đồ-thực-thể-quan-hệ-entity-relationship-diagram---erd)
12. [Bảng Ánh Xạ Bảng CSDL Sang Entity Class (Entity-Class Mapping)](#12-bảng-ánh-xạ-bảng-csdl-sang-entity-class-entity-class-mapping)
13. [Mô Hình Lớp Miền Khái Niệm (Conceptual Domain Class Model)](#13-mô-hình-lớp-miền-khái-niệm-conceptual-domain-class-model)
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
26. [Mô Hình Đặt Khu Vực Sự Kiện & Tiệc (Event Booking Model)](#26-mô-hình-đặt-khu-vực-sự-kiện--tiệc-event-booking-model)
27. [Quy Trình Quản Lý Hóa Đơn Mua Hộ Ngoại Vi (Procurement Flow)](#27-quy-trình-quản-lý-hóa-đơn-mua-hộ-ngoại-vi-procurement-flow)
28. [Quy Trình Sự Kiện & Giải Đấu Thể Thao (Tournament & Event Workflow)](#28-quy-trình-sự-kiện--giải-đấu-thể-thao-tournament--event-workflow)
29. [Hệ Thống Quản Lý Tồn Kho Thực Tế (Inventory Module)](#29-hệ-thống-quản-lý-tồn-kho-thực-tế-inventory-module)
30. [Quy Trình Tính Toán Hóa Đơn Động (Dynamic Invoice Calculation)](#30-quy-trình-tính-toán-hóa-đơn-động-dynamic-invoice-calculation)
31. [Đặc Quyền Đóng Đơn Có Công Nợ (Debt Write-Off Privilege)](#31-đặc-quyền-đóng-đơn-có-công-nợ-debt-write-off-privilege)
32. [Tiến Trình Chạy Ngầm Tự Động (Scheduler Background Job)](#32-tiến-trình-chạy-ngầm-tự-động-scheduler-background-job)
33. [Danh Mục Quy Tắc Nghiệp Vụ Toàn Diện (Business Rules BR-01 → BR-50)](#33-danh-mục-quy-tắc-nghiệp-vụ-toàn-diện-business-rules-br-01--br-50)
34. [Ma Trận Chuyển Đổi Trạng Thái Thực Thể (State Transition Matrix)](#34-ma-trận-chuyển-đổi-trạng-thái-thực-thể-state-transition-matrix)
35. [Đặc Tả Luồng Hoạt Động (25 Activity Flow Specifications)](#35-đặc-tả-luồng-hoạt-động-25-activity-flow-specifications)
36. [Đặc Tả Luồng Tương Tác Tuần Tự (Sequence Flow Specifications)](#36-đặc-tả-luồng-tương-tác-tuần-tự-sequence-flow-specifications)
37. [Mô Hình Lớp Phân Tích VOPC (View Of Participating Classes)](#37-mô-hình-lớp-phân-tích-vopc-view-of-participating-classes)
38. [Danh Mục Giao Diện Lập Trình Ứng Dụng (API Endpoints Catalog)](#38-danh-mục-giao-diện-lập-trình-ứng-dụng-api-endpoints-catalog)
39. [Quy Chuẩn Kiểm Định Dữ Liệu Đầu Vào (Zod Validation)](#39-quy-chuẩn-kiểm-định-dữ-liệu-đầu-vào-zod-validation)
40. [Danh Mục Mã Lỗi Nghiệp Vụ Chuẩn Hóa (Standardized Error Codes)](#40-danh-mục-mã-lỗi-nghiệp-vụ-chuẩn-hóa-standardized-error-codes)
41. [Ranh Giới Giao Dịch Dữ Liệu (Transaction Boundaries)](#41-ranh-giới-giao-dịch-dữ-liệu-transaction-boundaries)
42. [Kiểm Soát Xung Đột Đồng Thời (Concurrency Control Strategy)](#42-kiểm-soát-xung-đột-đồng-thời-concurrency-control-strategy)
43. [Giao Diện Cổng Quản Trị Web (Web Admin Portal)](#43-giao-diện-cổng-quản-trị-web-web-admin-portal)
44. [Giao Diện Ứng Dụng Di Động (Mobile Application)](#44-giao-diện-ứng-dộng-di-động-mobile-application)
45. [Ma Trận Phân Quyền Actor – Use Case (Actor–Use Case Matrix)](#45-ma-trận-phân-quyền-actor--use-case-actoruse-case-matrix)
46. [Cây Phân Rã Use Case Chi Tiết (Use Case Decomposition)](#46-cây-phân-rã-use-case-chi-tiết-use-case-decomposition)
47. [Ma Trận Ánh Xạ Use Case – Class – Table – API](#47-ma-trận-ánh-xạ-use-case--class--table--api)
48. [Danh Mục Kịch Bản Kiểm Thử Tự Động (Test Cases Catalog)](#48-danh-mục-kịch-bản-kiểm-thử-tự-động-test-cases-catalog)
49. [Báo Cáo Kết Quả Kiểm Thử Thực Tế (Automated Test Execution Results)](#49-báo-cáo-kết-quả-kiểm-thử-thực-tế-automated-test-execution-results)
50. [Quy Chuẩn Di Chuyển Lược Đồ CSDL (Database Migrations)](#50-quy-chuẩn-di-chuyển-lược-đồ-csdl-database-migrations)
51. [Chiến Lược Khởi Tạo Dữ Liệu Mẫu (Database Seeding)](#51-chiến-lược-khởi-tạo-dữ-liệu-mẫu-database-seeding)
52. [Ma Trận Truy Xuất Nguồn Gốc Nghiệp Vụ Toàn Diện (Traceability Matrix)](#52-ma-trận-truy-xuất-nguồn-gốc-nghiệp-vụ-toàn-diện-traceability-matrix)

---

# 1. TỔNG QUAN NGHIỆP VỤ

Hệ thống **"Quản Lý Và Đặt Lịch Sân Thể Thao 24/7" (Sport Booking System)** phục vụ bài toán số hóa toàn diện quy trình kinh doanh và điều hành cho một cơ sở thể thao phức hợp đa năng. Cơ sở quản lý đồng thời:
1. **Sân bóng đá mini** (sân cỏ nhân tạo 5 người / 7 người).
2. **Sân cầu lông** (sàn thảm tiêu chuẩn thi đấu).
3. **Sân tennis** (mặt sân cứng tiêu chuẩn quốc tế).
4. **Sân bóng rổ** (sân trong nhà và ngoài trời).
5. **Khu vực tổ chức sự kiện / tiệc** (phòng hội họp thể thao, khu tiệc BBQ ngoài trời, tiệc giao lưu câu lạc bộ).
6. **Sự kiện & Giải đấu thể thao** (các giải phong trào mở rộng do sân tổ chức hoặc liên kết tài trợ).

Hệ thống kết nối mượt mà giữa ứng dụng di động cho khách hàng, cổng web điều hành thời gian thực cho nhân viên và bảng điều khiển quản trị chuyên sâu cho người quản lý, hỗ trợ đặt sân từ xa, đặt sân trực tiếp tại quầy, phục vụ đồ uống, dụng cụ thể thao cho thuê, hóa đơn mua hộ ngoài phục vụ tiệc và tự động hóa quản lý kho chống thất thoát.

---

# 2. PHẠM VI HỆ THỐNG

### Trong phạm vi (In Scope):
- Đặt sân theo khung giờ cố định (60 phút / slot), cho phép chọn từ 1 đến 3 khung giờ liên tiếp trong ngày, tối đa trước 14 ngày.
- Cơ chế giữ chỗ tạm thời (Hold) 30 phút đối với phương thức chuyển khoản ngân hàng qua mã QR động (VietQR).
- Ngăn chặn hoàn toàn việc đặt trùng lịch (Double Booking) và tranh chấp tài nguyên đồng thời (Race Condition) bằng Unique Constraint Barrier.
- Bán đồ uống giải khát (DRINK), cho thuê đồ dùng tập luyện (RENTAL) và đặt gói dịch vụ (PACKAGE).
- Ghi nhận hóa đơn mua hộ ngoài (Procurement / Đi chợ BBQ hộ khách) theo 2 loại chứng từ: Hóa đơn điện tử (ELECTRONIC) và Chứng từ giấy (PAPER), hỗ trợ tính phí phục vụ.
- Theo dõi vòng đời dụng cụ thuê: giao hàng, ghi nhận người giao, xác nhận trả đồ, hoàn tồn kho tự động.
- Quản lý sự kiện & giải đấu của sân (\`su_kien\`), quản lý thông tin giải, ngày thi đấu, địa điểm, phí tham gia, giải thưởng và hotline liên hệ.
- Quản lý tồn kho thực tế: số lượng tổng (\`so_luong\`), số lượng đang giữ (\`so_luong_dang_giu\`), số lượng khả dụng (\`availableQuantity = so_luong - so_luong_dang_giu\`), ngưỡng cảnh báo (\`nguong_canh_bao\`) và truy vết toàn diện biến động kho (\`bien_dong_kho\`).
- Tổng hợp hóa đơn động theo thời gian thực (Dynamic Real-Time Invoice) bóc tách minh bạch tiền sân, tiền dịch vụ nội bộ, tiền dịch vụ mua hộ ngoài, phí phục vụ và tiền hoàn.
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
- **Trách nhiệm:** Tra cứu sân, xem lịch trống, đặt sân, thanh toán chuyển khoản, gọi dịch vụ ra sân, xem thông tin giải đấu/sự kiện của sân, hủy dịch vụ REQUESTED, theo dõi hóa đơn, đánh giá chất lượng sân (COMPLETED).
- **Ranh giới:** Chỉ có quyền đọc và ghi trên tài nguyên thuộc quyền sở hữu của chính mình (Ownership Rule). Tuyệt đối không thấy số lượng tồn kho nội bộ, ngưỡng cảnh báo hay thông tin nhân viên xử lý.

### 2. STAFF (Nhân Viên Vận Hành Tại Quầy)
- **Kênh tương tác:** Cổng Quản trị Web (Web Admin Portal).
- **Trách nhiệm:** Vận hành tại quầy lễ tân, xem dashboard số liệu hôm nay, xem lịch lưới sân, đặt sân cho khách vãng lai, ghi nhận thanh toán tiền mặt/chuyển khoản, giao dịch vụ ra sân, tiếp nhận và ghi nhận hóa đơn mua hộ ngoài phục vụ tiệc, xác nhận thu hồi đồ thuê (Return Rental), hủy đơn thay khách theo quy tắc, xác nhận hoàn tiền đã được đối soát, xem số lượng tồn kho khả dụng để phục vụ vận hành.
- **Ranh giới:** **KHÔNG CÓ QUYỀN QUẢN TRỊ HỆ THỐNG.** Bị cấm hoàn toàn đối với việc quản lý loại sân, cấu hình sân, sửa giá giờ, quản lý tài khoản nhân viên, khóa tài khoản, đóng đơn công nợ (Write-off debt), nhập kho (IMPORT), điều chỉnh kiểm kê (ADJUST), hoặc can thiệp lịch sử tài chính.

### 3. ADMIN (Quản Trị Viên Hệ Thống)
- **Kênh tương tác:** Cổng Quản trị Web (Web Admin Portal).
- **Trách nhiệm:** Sở hữu toàn quyền cấu hình dữ liệu danh mục hệ thống: tạo/sửa loại sân, chuyển đổi mục đích sân theo quy hoạch, cấu hình khung giờ, ma trận bảng giá giờ thường/cuối tuần/cao điểm, tạo và quản lý dịch vụ niêm yết, tạo/khóa/đặt lại mật khẩu nhân viên, khóa khách hàng gian lận, nhập kho (IMPORT), điều chỉnh tồn kho (ADJUST_IN, ADJUST_OUT), cấu hình ngưỡng cảnh báo kho, xem toàn bộ lịch sử biến động kho kiểm toán, xem báo cáo doanh thu & tỷ lệ lấp đầy sân, báo cáo chi tiết phân rã khoản thu, thực hiện đặc quyền đóng đơn có công nợ (Write-off debt).
- **Ranh giới an toàn:** Không được tự khóa tài khoản của chính mình (ADM-04) và hệ thống luôn bắt buộc duy trì tối thiểu một tài khoản ADMIN đang ACTIVE.

### 4. SCHEDULER (Tiến Trình Chạy Ngầm Hệ Thống)
- **Bản chất:** Tiến trình hệ thống chạy ngầm trong Node.js (Background Daemon Job), không phải người dùng, không có bản ghi trong bảng \`nguoi_dung\`.
- **Trách nhiệm:** Quét định kỳ mỗi 30 giây: tìm các đơn PENDING đã quá thời hạn giữ chỗ (\`het_han_luc < NOW()\`), chuyển sang trạng thái \`EXPIRED\`, nhả slot (\`dang_khoa = NULL\`), tự động giải phóng tồn kho đã giữ chỗ (RELEASE stock) và ghi nhật ký trạng thái.

---

# 4. MÔ HÌNH PHÂN QUYỀN DỰA TRÊN VAI TRÒ (RBAC)

Hệ thống áp dụng mô hình phân quyền chặt chẽ 3 cấp (\`CUSTOMER\`, \`STAFF\`, \`ADMIN\`):

\`\`\`
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
  - /api/v1/events               - /api/v1/services              - /api/v1/courts/*
  - /api/v1/auth/me              - /api/v1/procurement-invoices  - /api/v1/inventory/*
  (Chỉ dữ liệu sở hữu)           (Vận hành tại quầy)             (Toàn quyền hệ thống)
\`\`\`

### Quy tắc kế thừa phân quyền:
- \`ADMIN\` được phép truy cập tất cả endpoint của \`STAFF\` (để hỗ trợ vận hành khi cần).
- \`STAFF\` bị cấm tuyệt đối tại tất cả endpoint của \`ADMIN\` (HTTP 403 Forbidden).
- \`CUSTOMER\` bị cấm tại tất cả endpoint của \`STAFF\` và \`ADMIN\` (HTTP 403 Forbidden).
- Khách vãng lai chưa đăng nhập chỉ được truy cập các endpoint công khai (Public): \`/auth/login\`, \`/auth/register\`, \`/courts\`, \`/court-types\`, \`/time-slots\`, \`/slot-prices\`, \`/services\`, \`/events\`.

---

# 5. NGUYÊN TẮC AN TOÀN NGHIỆP VỤ & BẢO MẬT (SECURITY RULES)

1. **Authorization Bắt Buộc Ở Backend:** Không bao giờ dựa vào việc ẩn nút bấm trên giao diện Web Admin hay Mobile App. Mọi yêu cầu HTTP gửi đến API đều phải đi qua Middleware \`xacThuc\` (kiểm tra JWT hợp lệ, chưa hết hạn, tài khoản đang ACTIVE) và Middleware \`choPhepVaiTro\` (kiểm tra Role).
2. **Quy Tắc Sở Hữu Tài Nguyên (Resource Ownership Rule):** Khách hàng A không bao giờ được phép xem, hủy đơn hay gọi dịch vụ cho đơn đặt của Khách hàng B. Vi phạm trả về \`404 NOT_FOUND\` hoặc \`403 FORBIDDEN\`.
3. **STAFF Không Có Quyền Quản Trị Hệ Thống:** Mọi hành vi cố tình gọi trực tiếp vào API Admin từ tài khoản Staff đều bị chặn với mã \`403 FORBIDDEN\`.
4. **Bảo Vệ Thao Tác Nguy Hiểm Cao (High-Risk Operations):** Sửa giá, điều chỉnh tồn kho, khóa tài khoản, đóng đơn công nợ chỉ thuộc về \`ADMIN\`, yêu cầu giao dịch dữ liệu ACID và ghi vết kiểm toán.
5. **Vô Hiệu Hóa Token Tức Thì Khi Bị Khóa:** Khi một tài khoản bị chuyển sang trạng thái \`LOCKED\`, Middleware xác thực truy vấn trạng thái thực tế trong cơ sở dữ liệu và từ chối ngay lập tức ở request kế tiếp (\`403 ACCOUNT_LOCKED\`), không chờ JWT hết hạn.
6. **Bất Biến Tài Khoản Admin Tối Thiểu:** Hệ thống chặn đứng hành vi Admin tự khóa chính mình hoặc khóa tài khoản Admin duy nhất còn lại của cơ sở (\`409 CANNOT_LOCK_SELF\`).

---

# 6. KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Phân tầng hướng dịch vụ (Layered Service-Oriented Architecture)**:

\`\`\`
[ Mobile App (Customer) ]          [ Web Admin (Staff / Admin) ]
           \\                                    /
            \\--- HTTPS / JSON RESTful API -----/
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
\`\`\`

---

# 7. NGĂN XẾP CÔNG NGHỆ THỰC TẾ (TECH STACK)

- **Backend Runtime:** Node.js (LTS >= 18.x) thực thi trên Windows Server / Linux.
- **Ngôn ngữ:** TypeScript 5.9.3, Strict Mode kích hoạt 100%.
- **Framework:** Express.js 5.2.1.
- **Database Driver:** \`mysql2/promise\` (3.14.0) với Bể kết nối (Connection Pool: 15 kết nối, hỗ trợ \`dateStrings: true\`, múi giờ \`+07:00\`).
- **Xác thực & Mã hóa:** \`jsonwebtoken\` 9.0.3 (JWT thời hạn 24h), \`bcryptjs\` 3.0.3 (Cost Factor = 10).
- **Kiểm định dữ liệu:** \`zod\` 4.0.0.
- **Kiểm thử tự động:** Jest 30.5.2, \`ts-jest\`, \`supertest\` 7.3.1 (13 Test Suites, 128 Tests).
- **Cơ sở dữ liệu:** MySQL Community Server 8.0+, bảng mã \`utf8mb4_unicode_ci\`, Storage Engine \`InnoDB\`.
- **Frontend Web Admin:** HTML5, Vanilla JavaScript ES6+, Vanilla CSS (CSS Variables, Flexbox, CSS Grid).
- **Mobile Application:** React Native / Expo SDK, React Navigation.

---

# 8. CẤU TRÚC MÔ-ĐUN HỆ THỐNG (MODULES)

\`\`\`
backend/
├── src/
│   ├── config/          # Cấu hình CSDL (csdl.ts), Môi trường (moitruong.ts), Hằng số nghiệp vụ (nghiepvu.ts)
│   ├── controllers/     # Điều phối HTTP: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc, muaho
│   ├── services/        # Nghiệp vụ cốt lõi: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc, muaho
│   ├── routes/          # Khai báo tuyến đường API: dondat, nhanvien, quantri, dichvu, baocao, xacthuc, danhmuc
│   ├── middlewares/     # Bộ lọc: xacthuc, phanquyen, kiemtra (Zod), loi (Error Handler)
│   ├── validators/      # Định nghĩa Schema kiểm tra dữ liệu bằng Zod
│   ├── jobs/            # Tiến trình chạy ngầm: hethan-dondat.job.ts (30s)
│   ├── types/           # Định nghĩa Typescript Interfaces & Types
│   └── utils/           # Tiện ích: giaodich, nhatky, hoadon, thoigian, phanhoi, loi
├── public/admin/        # Web Admin Portal (index.html, admin.js)
├── database/            # schema.sql (17 bảng), seed.sql (dữ liệu mẫu ban đầu)
├── scripts/             # Kịch bản kiểm tra toàn bộ hệ thống, khởi tạo CSDL, seed dữ liệu
└── tests/               # 13 test suites kiểm thử tự động toàn diện
\`\`\`


---

# 9. TỔNG QUAN CƠ SỞ DỮ LIỆU (DATABASE OVERVIEW)

Cơ sở dữ liệu gồm đúng **17 bảng chuẩn hóa**, đặt tên tiếng Việt không dấu theo chuẩn `snake_case`:
1. `nguoi_dung`: Lưu thông tin tài khoản người dùng (Customer, Staff, Admin).
2. `loai_san`: Phân loại danh mục môn thể thao hoặc khu vực sự kiện / tiệc (SPORT, EVENT).
3. `san`: Danh sách các sân thể thao cụ thể và mặt bằng phòng tiệc, khu BBQ.
4. `khung_gio`: Danh mục các khung giờ tiêu chuẩn cố định trong ngày (06:00 -> 22:00).
5. `gia_khung_gio`: Bảng ma trận giá phân biệt theo loại sân, khung giờ và loại ngày (WEEKDAY / WEEKEND).
6. `don_dat`: Thực thể giao dịch trung tâm quản lý vòng đời đặt sân và tổng giá trị đơn.
7. `chi_tiet_khung_gio_dat`: Khóa chống trùng lịch tuyệt đối và danh sách khung giờ đặt của đơn.
8. `thanh_toan`: Sổ cái tài chính ghi nhận toàn bộ giao dịch thanh toán và hoàn tiền.
9. `nhat_ky_trang_thai_don`: Nhật ký kiểm toán bất biến theo dõi lịch sử chuyển trạng thái đơn đặt.
10. `danh_gia`: Đánh giá chất lượng và số sao của khách hàng sau khi hoàn tất trải nghiệm tại sân.
11. `dich_vu`: Danh mục dịch vụ niêm yết (Đồ uống DRINK, Đồ thuê RENTAL, Gói tiệc PACKAGE).
12. `yeu_cau_dich_vu`: Quản lý từng lần gọi dịch vụ gắn liền với một đơn đặt sân.
13. `chi_tiet_yeu_cau_dich_vu`: Chi tiết từng món trong một lần gọi và quản lý vòng đời hoàn trả đồ thuê.
14. `ton_kho_dich_vu`: Quản lý tồn kho hiện vật thực tế, số lượng đang giữ chỗ và ngưỡng cảnh báo an toàn.
15. `bien_dong_kho`: Nhật ký biến động kho phục vụ kiểm toán minh bạch (IMPORT, ADJUST, RESERVE, RELEASE, DELIVER, RETURN).
16. `hoa_don_mua_ho`: Chứng từ hóa đơn điện tử / giấy cho dịch vụ mua hộ, đi chợ ngoài phục vụ tiệc BBQ và sự kiện.
17. `su_kien`: Quản lý các sự kiện, giải đấu thể thao, workshop phong trào và đại tiệc của cụm sân.

---

# 10. CHI TIẾT LƯỢC ĐỒ 17 BẢNG CƠ SỞ DỮ LIỆU (DETAILED DATABASE SCHEMA)

### Bảng 1: `nguoi_dung`
- **Ý nghĩa nghiệp vụ:** Lưu trữ thông tin định danh, thông tin đăng nhập và vai trò người dùng trong hệ thống.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ho_ten`: VARCHAR(100) NOT NULL — Họ và tên người dùng.
  - `so_dien_thoai`: VARCHAR(15) NOT NULL — Số điện thoại đăng nhập duy nhất.
  - `email`: VARCHAR(150) NULL — Địa chỉ thư điện tử duy nhất.
  - `mat_khau_hash`: VARCHAR(255) NOT NULL — Mật khẩu băm Bcrypt (Cost Factor = 10).
  - `vai_tro`: ENUM('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER' — Vai trò trong hệ thống.
  - `trang_thai`: ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE' — Trạng thái hoạt động tài khoản.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_nguoi_dung_sdt` (`so_dien_thoai`), `uq_nguoi_dung_email` (`email`).
- **Chỉ mục:** `idx_nguoi_dung_vaitro_trangthai` (`vai_tro`, `trang_thai`).
- **Class Ánh Xạ:** `NguoiDung`.

### Bảng 2: `loai_san`
- **Ý nghĩa nghiệp vụ:** Danh mục phân loại các môn thể thao hoặc khu vực sự kiện / tiệc.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ten`: VARCHAR(100) NOT NULL — Tên loại sân (VD: Sân bóng đá mini, Sân cầu lông, Khu tiệc nướng BBQ).
  - `phan_loai`: ENUM('SPORT','EVENT') NOT NULL DEFAULT 'SPORT' — SPORT: sân thể thao, EVENT: khu tiệc/BBQ.
  - `mo_ta`: VARCHAR(500) NULL.
  - `hoat_dong`: TINYINT(1) NOT NULL DEFAULT 1 — Cờ kích hoạt danh mục (1 = ACTIVE, 0 = INACTIVE).
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_loai_san_ten` (`ten`).
- **Class Ánh Xạ:** `LoaiSan`.

### Bảng 3: `san`
- **Ý nghĩa nghiệp vụ:** Từng sân thể thao hoặc mặt bằng phòng tiệc, khu BBQ cụ thể của cơ sở.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `loai_san_id`: INT UNSIGNED NOT NULL (FK -> `loai_san.id`).
  - `ten`: VARCHAR(100) NOT NULL — Tên sân (VD: Sân 5A, Sân CL1, Phòng tiệc A).
  - `mo_ta`: VARCHAR(1000) NULL.
  - `hinh_anh`: VARCHAR(500) NULL.
  - `suc_chua`: SMALLINT UNSIGNED NULL — Sức chứa tối đa (người) dùng cho cả thể thao và sự kiện.
  - `trang_thai`: ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_san_ten` (`ten`).
- **Khóa ngoại:** `fk_san_loai_san` REFERENCES `loai_san(id)`.
- **Chỉ mục:** `idx_san_loai_trangthai` (`loai_san_id`, `trang_thai`).
- **Class Ánh Xạ:** `San`.

### Bảng 4: `khung_gio`
- **Ý nghĩa nghiệp vụ:** Danh mục các khung giờ tiêu chuẩn cố định 60 phút trong ngày từ 06:00 đến 22:00.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `gio_bat_dau`: TIME NOT NULL — Giờ bắt đầu (VD: 06:00:00).
  - `gio_ket_thuc`: TIME NOT NULL — Giờ kết thúc (VD: 07:00:00).
  - `hoat_dong`: TINYINT(1) NOT NULL DEFAULT 1 — Cờ kích hoạt (1 = ACTIVE, 0 = INACTIVE).
- **Ràng buộc duy nhất:** `uq_khung_gio_bat_dau` (`gio_bat_dau`).
- **Ràng buộc kiểm tra:** `chk_khung_gio_hop_le` CHECK (`gio_ket_thuc` > `gio_bat_dau`).
- **Class Ánh Xạ:** `KhungGio`.

### Bảng 5: `gia_khung_gio`
- **Ý nghĩa nghiệp vụ:** Ma trận giá theo loại sân, khung giờ và loại ngày (ngày trong tuần hoặc cuối tuần).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `loai_san_id`: INT UNSIGNED NOT NULL (FK -> `loai_san.id`).
  - `khung_gio_id`: INT UNSIGNED NOT NULL (FK -> `khung_gio.id`).
  - `loai_ngay`: ENUM('WEEKDAY','WEEKEND') NOT NULL — WEEKDAY: Thứ 2-6, WEEKEND: Thứ 7-CN.
  - `gia`: INT UNSIGNED NOT NULL — Giá niêm yết (VND).
- **Ràng buộc duy nhất:** `uq_gia_khung_gio` (`loai_san_id`, `khung_gio_id`, `loai_ngay`).
- **Khóa ngoại:** `fk_gia_loai_san` REFERENCES `loai_san(id)`, `fk_gia_khung_gio` REFERENCES `khung_gio(id)`.
- **Class Ánh Xạ:** `GiaKhungGio`.

### Bảng 6: `don_dat`
- **Ý nghĩa nghiệp vụ:** Thực thể giao dịch trung tâm quản lý toàn bộ vòng đời đơn đặt sân và tổng giá trị tài chính.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ma_don_dat`: VARCHAR(12) NOT NULL — Mã đơn đặt sinh tự động (BK + 8 ký tự, VD: BK7A9F12C3).
  - `nguoi_dung_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Khách hàng sở hữu đơn.
  - `ten_khach`: VARCHAR(100) NULL — Họ tên khách đặt (dùng cho khách vãng lai hoặc cache).
  - `so_dien_thoai_khach`: VARCHAR(15) NULL — Số điện thoại khách đặt.
  - `san_id`: INT UNSIGNED NOT NULL (FK -> `san.id`) — Sân thi đấu hoặc phòng tiệc được đặt.
  - `ngay_dat`: DATE NOT NULL — Ngày sử dụng sân (YYYY-MM-DD).
  - `gio_bat_dau`: TIME NOT NULL — Giờ bắt đầu chuỗi slot.
  - `gio_ket_thuc`: TIME NOT NULL — Giờ kết thúc chuỗi slot.
  - `tien_san`: INT UNSIGNED NOT NULL — Tổng tiền sân đã snapshot cố định theo ma trận giá lúc đặt.
  - `tien_dich_vu`: INT UNSIGNED NOT NULL DEFAULT 0 — Cache tổng tiền dịch vụ đã giao (DELIVERED) và hóa đơn mua hộ (CONFIRMED/BILLED).
  - `dong_don_cong_no`: TINYINT(1) NOT NULL DEFAULT 0 — Cờ đánh dấu Admin đóng đơn nợ (1 = Write-off debt, BR-33).
  - `trang_thai`: ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NOT NULL DEFAULT 'PENDING'.
  - `phuong_thuc_thanh_toan`: ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL.
  - `trang_thai_thanh_toan`: ENUM('UNPAID','PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID'.
  - `nguon_don`: ENUM('APP','STAFF') NOT NULL DEFAULT 'APP'.
  - `ghi_chu`: VARCHAR(500) NULL.
  - `het_han_luc`: DATETIME NULL — Mốc hết hạn giữ chỗ (30 phút từ lúc tạo đơn PENDING chuyển khoản).
  - `huy_luc`: DATETIME NULL.
  - `ly_do_huy`: VARCHAR(500) NULL.
  - `nguoi_tao_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Nhân viên tạo hộ tại quầy.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_don_dat_ma` (`ma_don_dat`).
- **Ràng buộc kiểm tra:** 
  - `chk_don_dat_khach_hang` CHECK (`nguoi_dung_id` IS NOT NULL OR `so_dien_thoai_khach` IS NOT NULL).
  - `chk_don_dat_thoi_gian` CHECK (`gio_ket_thuc` > `gio_bat_dau`).
- **Khóa ngoại:** 
  - `fk_don_dat_nguoi_dung` REFERENCES `nguoi_dung(id)`.
  - `fk_don_dat_san` REFERENCES `san(id)`.
  - `fk_don_dat_nguoi_tao` REFERENCES `nguoi_dung(id)`.
- **Chỉ mục:** `idx_don_dat_san_ngay`, `idx_don_dat_user_trangthai`, `idx_don_dat_trangthai_hethan`, `idx_don_dat_ngay_trangthai`.
- **Class Ánh Xạ:** `DonDat`.

### Bảng 7: `chi_tiet_khung_gio_dat`
- **Ý nghĩa nghiệp vụ:** Chi tiết từng slot giờ của đơn và thực thi cơ chế khóa hàng rào chống trùng lịch tuyệt đối.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `san_id`: INT UNSIGNED NOT NULL (FK -> `san.id`).
  - `ngay_dat`: DATE NOT NULL.
  - `khung_gio_id`: INT UNSIGNED NOT NULL (FK -> `khung_gio.id`).
  - `gia`: INT UNSIGNED NOT NULL — Giá tiền snapshot tại thời điểm đặt.
  - `dang_khoa`: TINYINT NULL DEFAULT 1 — Cột cờ: `1` = Đang giữ slot; `NULL` = Đã giải phóng slot (EXPIRED, CANCELLED, COMPLETED, NO_SHOW).
- **Ràng buộc duy nhất:** `uq_slot_dang_khoa` (`san_id`, `ngay_dat`, `khung_gio_id`, `dang_khoa`).
- **Khóa ngoại:** `fk_ctkg_don_dat` REFERENCES `don_dat(id)`, `fk_ctkg_san` REFERENCES `san(id)`, `fk_ctkg_khung_gio` REFERENCES `khung_gio(id)`.
- **Class Ánh Xạ:** `ChiTietKhungGioDat`.

### Bảng 8: `thanh_toan`
- **Ý nghĩa nghiệp vụ:** Sổ cái tài chính ghi nhận các giao dịch thanh toán và hoàn tiền của đơn đặt.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `loai_giao_dich`: ENUM('PAYMENT','REFUND') NOT NULL.
  - `muc_dich`: ENUM('COURT','SERVICE') NOT NULL DEFAULT 'COURT' — COURT: tiền sân, SERVICE: dịch vụ.
  - `phuong_thuc`: ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL.
  - `so_tien`: INT UNSIGNED NOT NULL — Số tiền giao dịch thực tế (VND).
  - `trang_thai`: ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING'.
  - `ma_giao_dich`: VARCHAR(100) NULL — Mã đối soát ngân hàng / biên nhận.
  - `nguoi_xu_ly_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Nhân viên xác nhận thu/hoàn tiền.
  - `ghi_chu`: VARCHAR(500) NULL — Lưu thông tin hoàn tiền (`refundInfo`) khi loại giao dịch là REFUND.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_xu_ly`: DATETIME NULL — Thời điểm giao dịch thành công.
- **Khóa ngoại:** `fk_thanh_toan_don_dat` REFERENCES `don_dat(id)`, `fk_thanh_toan_nhan_vien` REFERENCES `nguoi_dung(id)`.
- **Class Ánh Xạ:** `ThanhToan`.

### Bảng 9: `nhat_ky_trang_thai_don`
- **Ý nghĩa nghiệp vụ:** Nhật ký kiểm toán bất biến theo dõi tất cả lần thay đổi trạng thái của đơn đặt.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `trang_thai_truoc`: ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NULL.
  - `trang_thai_sau`: ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NOT NULL.
  - `nguoi_thuc_hien_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — NULL biểu thị Hệ thống (Job quét tự động).
  - `ghi_chu`: VARCHAR(500) NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Khóa ngoại:** `fk_nhat_ky_don_dat` REFERENCES `don_dat(id)`, `fk_nhat_ky_nguoi_dung` REFERENCES `nguoi_dung(id)`.
- **Class Ánh Xạ:** `NhatKyTrangThaiDon`.

### Bảng 10: `danh_gia`
- **Ý nghĩa nghiệp vụ:** Đánh giá chất lượng và số sao của khách hàng sau khi hoàn tất trải nghiệm tại sân.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id`).
  - `nguoi_dung_id`: INT UNSIGNED NOT NULL (FK -> `nguoi_dung.id`).
  - `so_sao`: TINYINT UNSIGNED NOT NULL — Từ 1 đến 5 sao.
  - `nhan_xet`: VARCHAR(1000) NULL.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_danh_gia_don_dat` (`don_dat_id`).
- **Ràng buộc kiểm tra:** `chk_danh_gia_so_sao` CHECK (`so_sao` BETWEEN 1 AND 5).
- **Khóa ngoại:** `fk_danh_gia_don_dat` REFERENCES `don_dat(id)`, `fk_danh_gia_nguoi_dung` REFERENCES `nguoi_dung(id)`.
- **Class Ánh Xạ:** `DanhGia`.

### Bảng 11: `dich_vu`
- **Ý nghĩa nghiệp vụ:** Danh mục món dịch vụ phục vụ tại cơ sở (Nước giải khát, Dụng cụ cho thuê, Gói tiệc trọn gói).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `ten`: VARCHAR(100) NOT NULL — Tên món dịch vụ (VD: Nước tăng lực Redbull, Thuê vợt Yonex, Gói Đại Tiệc BBQ).
  - `phan_loai`: ENUM('DRINK','RENTAL','PACKAGE') NOT NULL.
  - `don_vi_tinh`: VARCHAR(30) NOT NULL DEFAULT 'cái'.
  - `don_gia`: INT UNSIGNED NOT NULL — Giá bán niêm yết (VND).
  - `mo_ta`: VARCHAR(500) NULL.
  - `hinh_anh`: VARCHAR(500) NULL.
  - `trang_thai`: ENUM('ACTIVE','OUT_OF_STOCK','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_dich_vu_ten` (`ten`).
- **Class Ánh Xạ:** `DichVu`.

### Bảng 12: `yeu_cau_dich_vu`
- **Ý nghĩa nghiệp vụ:** Quản lý từng lần gọi dịch vụ gắn liền với một đơn đặt sân đang hoạt động.
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
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Khóa ngoại:** `fk_ycdv_don_dat` REFERENCES `don_dat(id)`, `fk_ycdv_nguoi_yeu_cau` REFERENCES `nguoi_dung(id)`, `fk_ycdv_nguoi_giao` REFERENCES `nguoi_dung(id)`.
- **Class Ánh Xạ:** `YeuCauDichVu`.

### Bảng 13: `chi_tiet_yeu_cau_dich_vu`
- **Ý nghĩa nghiệp vụ:** Từng món cụ thể trong một lần gọi dịch vụ và theo dõi vòng đời hoàn trả dụng cụ cho thuê (RENTAL).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `yeu_cau_dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `yeu_cau_dich_vu.id`).
  - `dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `dich_vu.id`).
  - `so_luong`: SMALLINT UNSIGNED NOT NULL — Giới hạn từ 1 đến 20 mỗi dòng.
  - `don_gia`: INT UNSIGNED NOT NULL — Giá tiền snapshot tại thời điểm gọi dịch vụ (BR-23).
  - `tra_luc`: DATETIME NULL — Thời điểm khách trả đồ thuê (áp dụng cho RENTAL).
  - `nguoi_nhan_tra_id`: INT UNSIGNED NULL (FK -> `nguoi_dung.id`) — Nhân viên tiếp nhận kiểm tra đồ trả.
- **Ràng buộc kiểm tra:** `chk_ctycdv_so_luong` CHECK (`so_luong` BETWEEN 1 AND 20).
- **Khóa ngoại:** `fk_ctycdv_yeu_cau` REFERENCES `yeu_cau_dich_vu(id)`, `fk_ctycdv_dich_vu` REFERENCES `dich_vu(id)`, `fk_ctycdv_nguoi_tra` REFERENCES `nguoi_dung(id)`.
- **Class Ánh Xạ:** `ChiTietYeuCauDichVu`.

### Bảng 14: `ton_kho_dich_vu`
- **Ý nghĩa nghiệp vụ:** Quản lý số lượng tồn kho vật lý thực tế, số lượng đang giữ chỗ và ngưỡng cảnh báo an toàn.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `dich_vu_id`: INT UNSIGNED NOT NULL (FK -> `dich_vu.id` ON DELETE CASCADE).
  - `so_luong`: INT NOT NULL DEFAULT 0 — Tổng tồn kho hiện vật trong kho.
  - `so_luong_dang_giu`: INT NOT NULL DEFAULT 0 — Số lượng đang được khách đặt giữ chỗ (Hold trong đơn REQUESTED).
  - `nguong_canh_bao`: INT NOT NULL DEFAULT 5 — Ngưỡng cảnh báo sắp hết hàng.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Ràng buộc duy nhất:** `uq_ton_kho_dich_vu` (`dich_vu_id`).
- **Ràng buộc kiểm tra:** 
  - `chk_ton_kho_so_luong` CHECK (`so_luong` >= 0)
  - `chk_ton_kho_dang_giu` CHECK (`so_luong_dang_giu` >= 0)
  - `chk_ton_kho_nguong` CHECK (`nguong_canh_bao` >= 0)
  - `chk_ton_kho_hop_le` CHECK (`so_luong_dang_giu` <= `so_luong`)
- **Class Ánh Xạ:** `TonKhoDichVu`.

### Bảng 15: `bien_dong_kho`
- **Ý nghĩa nghiệp vụ:** Nhật ký kiểm toán bất biến theo dõi tất cả giao dịch biến động tồn kho của hệ thống.
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

### Bảng 16: `hoa_don_mua_ho`
- **Ý nghĩa nghiệp vụ:** Lưu trữ chứng từ hóa đơn điện tử hoặc hóa đơn giấy khi cơ sở đi chợ hộ hoặc đặt dịch vụ ngoài phục vụ khách tiệc / sự kiện (Cách 2 quản lý tiệc).
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `don_dat_id`: INT UNSIGNED NOT NULL (FK -> `don_dat.id` ON DELETE CASCADE) — Gắn chặt với đơn đặt sân/tiệc.
  - `loai_chi_phi`: ENUM('GROCERY','CATERING','EQUIPMENT','OTHER') NOT NULL DEFAULT 'GROCERY' — Phân loại: Đi chợ, Đặt tiệc ngoài, Thuê thiết bị ngoài, Khác.
  - `ten_khoan_chi`: VARCHAR(255) NOT NULL — Tên khoản chi hộ (VD: Mua hải sản tôm cua & bò Úc nướng BBQ).
  - `nha_cung_cap`: VARCHAR(150) NULL — Tên siêu thị, nhà hàng hoặc cửa hàng cung ứng (VD: Siêu thị Mega Market).
  - `so_hoa_don`: VARCHAR(100) NULL — Số hóa đơn GTGT hoặc số biên lai thanh toán.
  - `loai_chung_tu`: ENUM('ELECTRONIC','PAPER') NOT NULL DEFAULT 'PAPER' — Phân biệt Hóa đơn điện tử VAT hay Biên lai/Ảnh chụp giấy.
  - `ngay_hoa_don`: DATE NOT NULL — Ngày ghi nhận trên hóa đơn (YYYY-MM-DD).
  - `hinh_anh_chung_tu`: VARCHAR(500) NULL — URL ảnh chụp hóa đơn chứng từ đính kèm để khách đối soát.
  - `tien_hoa_don`: INT UNSIGNED NOT NULL — Số tiền gốc trên hóa đơn mua ngoài (VND).
  - `phi_phuc_vu`: INT UNSIGNED NOT NULL DEFAULT 0 — Phí phục vụ / công đi chợ thu thêm của cơ sở (VND).
  - `tong_tien`: INT UNSIGNED NOT NULL — Tổng tiền cộng vào đơn (`tong_tien = tien_hoa_don + phi_phuc_vu`).
  - `chi_tiet_mon`: TEXT NULL — Mô tả chi tiết các mặt hàng mua hộ kèm định lượng.
  - `ghi_chu`: VARCHAR(500) NULL.
  - `trang_thai`: ENUM('PENDING','CONFIRMED','BILLED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED' — Mặc định khi nhân viên tạo là CONFIRMED hoặc BILLED để tính vào hóa đơn.
  - `nguoi_tao_id`: INT UNSIGNED NOT NULL (FK -> `nguoi_dung.id`) — Nhân viên tạo chứng từ mua hộ.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
  - `ngay_cap_nhat`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP.
- **Khóa ngoại:** 
  - `fk_hdmh_don_dat` REFERENCES `don_dat(id)` ON DELETE CASCADE.
  - `fk_hdmh_nguoi_tao` REFERENCES `nguoi_dung(id)`.
- **Chỉ mục:** `idx_hdmh_don_dat` (`don_dat_id`), `idx_hdmh_trangthai` (`trang_thai`), `idx_hdmh_ngay` (`ngay_hoa_don`).
- **Class Ánh Xạ:** `HoaDonMuaHo`.

### Bảng 17: `su_kien`
- **Ý nghĩa nghiệp vụ:** Quản lý các sự kiện thể thao, giải đấu phong trào, workshop tập luyện và ngày hội thể thao tổ chức tại cơ sở.
- **Khóa chính (PK):** `id` (INT UNSIGNED AUTO_INCREMENT).
- **Các cột:**
  - `tieu_de`: VARCHAR(255) NOT NULL — Tên sự kiện / giải đấu (VD: Giải Vô Địch Cầu Lông Đôi Nam Nữ 2026).
  - `mo_ta_ngan`: VARCHAR(500) NOT NULL — Tóm tắt ngắn gọn hiển thị trên banner hoặc danh sách thẻ.
  - `noi_dung`: TEXT NOT NULL — Nội dung chi tiết thể thức thi đấu, đối tượng tham gia, quyền lợi VĐV.
  - `hinh_anh`: VARCHAR(500) NOT NULL — Ảnh poster sự kiện chất lượng cao.
  - `ngay_bat_dau`: DATETIME NOT NULL — Thời điểm khai mạc sự kiện.
  - `ngay_ket_thuc`: DATETIME NOT NULL — Thời điểm bế mạc sự kiện.
  - `dia_diem`: VARCHAR(255) NOT NULL — Địa điểm thi đấu cụ thể (VD: Cụm Sân Cầu Lông 1, 2, 3).
  - `san_id`: INT UNSIGNED NULL (FK -> `san.id` ON DELETE SET NULL) — Liên kết với sân cụ thể trong cơ sở (nếu có).
  - `phi_tham_gia`: INT UNSIGNED NOT NULL DEFAULT 0 — Lệ phí tham gia giải đấu (0 = Miễn phí).
  - `phan_thuong`: VARCHAR(255) NULL — Cơ cấu giải thưởng (Cúp, cờ, tiền thưởng, quà tặng).
  - `trang_thai`: ENUM('UPCOMING','HAPPENING','FINISHED') NOT NULL DEFAULT 'UPCOMING' — Vòng đời sự kiện: Sắp diễn ra, Đang diễn ra, Đã kết thúc.
  - `hotline_lh`: VARCHAR(30) NOT NULL DEFAULT '0900000001' — Số điện thoại hotline ban tổ chức tiếp nhận đăng ký.
  - `ngay_tao`: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.
- **Khóa ngoại:** `fk_sukien_san` REFERENCES `san(id)` ON DELETE SET NULL.
- **Chỉ mục:** `idx_sukien_trangthai` (`trang_thai`), `idx_sukien_ngay` (`ngay_bat_dau`).
- **Class Ánh Xạ:** `SuKien`.

---

# 11. SƠ ĐỒ THỰC THỂ QUAN HỆ (ENTITY RELATIONSHIP DIAGRAM - ERD)

\`\`\`
+---------------+        1:N         +---------------+        1:N         +------------------------+
|   loai_san    |------------------->|      san      |------------------->|        don_dat         |
+---------------+                    +---------------+                    +------------------------+
        |                                    | 0..1                               | 1:N            | 1:N
        | 1:N                                |                                    v                v
        v                                    | 0..*                       +---------------+  +--------------+
+---------------+                            v                            |chi_tiet_khung_|  |  thanh_toan  |
| gia_khung_gio |                    +---------------+                    |  gio_dat      |  +--------------+
+---------------+                    |    su_kien    |                    +---------------+        |
        ^                            +---------------+                            |                |
        | 1:N                                                                     v                v
+---------------+                                                         +---------------+  +--------------+
|   khung_gio   |                                                         |  nhat_ky_     |  |   danh_gia   |
+---------------+                                                         |  trang_thai   |  +--------------+
                                                                          +---------------+
                                                                                  |
                                              +-----------------------------------+
                                              |
                                              | 1:N
                                              v
+-------------------+        1:N     +------------------------+  1:N      +------------------------+
|      dich_vu      |<---------------|chi_tiet_yeu_cau_dich_vu|<----------|    yeu_cau_dich_vu     |
+-------------------+                +------------------------+           +------------------------+
     |          ^                                                                     ^
 1:1 |          | 1:N                                                                 |
     v          |                                                                     | 1:N
+-------------------+        1:N     +------------------------+                       |
|  ton_kho_dich_vu  |--------------->|     bien_dong_kho      |-----------------------+
+-------------------+                +------------------------+
                                                  |
                                                  | 1:N
                                                  v
                                     +------------------------+
                                     |    hoa_don_mua_ho      | <--- 1:N từ don_dat
                                     +------------------------+
\`\`\`

---

# 12. BẢNG ÁNH XẠ BẢNG CSDL SANG ENTITY CLASS (ENTITY-CLASS MAPPING)

| STT | Tên Bảng (Database Table) | Tên Entity Class Khái Niệm | Mô-đun Nghiệp Vụ | Trách Nhiệm Miền |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `nguoi_dung` | `NguoiDung` | Identity & Auth | Quản lý tài khoản, xác thực Bcrypt/JWT, phân quyền 3 cấp |
| 2 | `loai_san` | `LoaiSan` | Court Catalog | Quản lý danh mục loại môn thể thao và khu vực sự kiện |
| 3 | `san` | `San` | Court Catalog | Quản lý từng sân thi đấu cụ thể, sức chứa và trạng thái vận hành |
| 4 | `khung_gio` | `KhungGio` | Time Schedule | Quản lý danh mục các khung giờ cố định 60 phút |
| 5 | `gia_khung_gio` | `GiaKhungGio` | Pricing Matrix | Bảng ma trận giá phân biệt ngày thường và cuối tuần |
| 6 | `don_dat` | `DonDat` | Booking Lifecycle | Thực thể giao dịch đặt sân, tổng hợp số tiền và vòng đời đơn |
| 7 | `chi_tiet_khung_gio_dat` | `ChiTietKhungGioDat` | Concurrency Hold | Giữ slot giờ và khóa hàng rào chống trùng lịch tuyệt đối |
| 8 | `thanh_toan` | `ThanhToan` | Financial Ledger | Sổ cái giao dịch thu tiền mặt/chuyển khoản và đối soát hoàn tiền |
| 9 | `nhat_ky_trang_thai_don` | `NhatKyTrangThaiDon` | State Audit | Nhật ký kiểm toán bất biến theo dõi chuyển trạng thái đơn đặt |
| 10 | `danh_gia` | `DanhGia` | Feedback & Review | Khách hàng đánh giá số sao và nhận xét chất lượng sau khi chơi |
| 11 | `dich_vu` | `DichVu` | Service Master | Danh mục món nước uống, dụng cụ cho thuê và gói tiệc trọn gói |
| 12 | `yeu_cau_dich_vu` | `YeuCauDichVu` | Service Order | Đơn yêu cầu dịch vụ nội bộ phát sinh tại sân |
| 13 | `chi_tiet_yeu_cau_dich_vu`| `ChiTietYeuCauDichVu` | Service Item & Return| Chi tiết từng món gọi và theo dõi vòng đời hoàn trả đồ thuê |
| 14 | `ton_kho_dich_vu` | `TonKhoDichVu` | Inventory Management | Quản lý tồn kho thực tế, số lượng giữ chỗ và ngưỡng cảnh báo |
| 15 | `bien_dong_kho` | `BienDongKho` | Inventory Audit Trail| Nhật ký giao dịch biến động tồn kho phục vụ kiểm toán |
| 16 | `hoa_don_mua_ho` | `HoaDonMuaHo` | Procurement Invoicing | Quản lý hóa đơn điện tử / giấy mua hộ ngoài phục vụ tiệc |
| 17 | `su_kien` | `SuKien` | Tournament & Events | Quản lý giải đấu thể thao, workshop và sự kiện phong trào |

---


---

# 13. MÔ HÌNH LỚP MIỀN KHÁI NIỆM (CONCEPTUAL DOMAIN CLASS MODEL)

### Phân biệt rõ ràng giữa 2 tầng:
- **Conceptual Domain Class:** Lớp nghiệp vụ khái niệm thể hiện đầy đủ các thuộc tính và phương thức nghiệp vụ miền (`taoDon()`, `reserve()`, `deliver()`, `hoanThanhDon()`, `ghiNhanMuaHo()`, `dangKySuKien()`) dùng cho việc thiết kế mô hình hóa UML (Class Diagram, VOPC).
- **Implementation Service/Entity Layer:** Tầng triển khai thực tế bằng mã nguồn Node.js/TypeScript sử dụng Service Layer (`DonDatService`, `DichVuService`, `NhanVienService`, `QuanTriService`, `MuaHoService`, `DanhMucService`) kết hợp tham số hóa SQL qua Bể kết nối `mysql2`.

```
+----------------------------------------------------------------------------------------------------+
|                                           NguoiDung                                                |
+----------------------------------------------------------------------------------------------------+
| - id: int                                                                                          |
| - hoTen: string                                                                                    |
| - soDienThoai: string                                                                              |
| - email: string?                                                                                   |
| - matKhauHash: string                                                                              |
| - vaiTro: VaiTro                                                                                   |
| - trangThai: TrangThaiNguoiDung                                                                    |
+----------------------------------------------------------------------------------------------------+
| + dangKy(thongTin): NguoiDung                                                                      |
| + dangNhap(sdt, matKhau): TokenSession                                                            |
| + khoaTaiKhoan(): void                                                                             |
| + moKhoaTaiKhoan(): void                                                                           |
| + datLaiMatKhau(matKhauMoi): void                                                                  |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------+   +-----------------------------------------------+
|                      LoaiSan                       |   |                     San                       |
+----------------------------------------------------+   +-----------------------------------------------+
| - id: int                                          |   | - id: int                                     |
| - ten: string                                      |   | - loaiSanId: int                              |
| - phanLoai: PhanLoaiSan                            |   | - ten: string                                 |
| - moTa: string?                                    |   | - sucChua: int?                               |
| - hoatDong: boolean                                |   | - trangThai: TrangThaiSan                     |
+----------------------------------------------------+   +-----------------------------------------------+
| + kichHoat(): void                                 |   | + chuyenBaoTri(): void                        |
| + ngungHoatDong(): void                            |   | + duaVaoHoatDong(): void                      |
+----------------------------------------------------+   | + chuyenDoiMucDich(loaiMoiId): void           |
                                                         +-----------------------------------------------+

+----------------------------------------------------------------------------------------------------+
|                                             DonDat                                                 |
+----------------------------------------------------------------------------------------------------+
| - id: int                                                                                          |
| - maDonDat: string                                                                                 |
| - nguoiDungId: int?                                                                                |
| - sanId: int                                                                                       |
| - ngayDat: Date                                                                                    |
| - gioBatDau: Time                                                                                  |
| - gioKetThuc: Time                                                                                 |
| - tienSan: int                                                                                     |
| - tienDichVu: int                                                                                  |
| - dongDonCongNo: boolean                                                                           |
| - trangThai: TrangThaiDon                                                                          |
| - phuongThucThanhToan: PhuongThucThanhToan                                                         |
| - trangThaiThanhToan: TrangThaiThanhToan                                                           |
| - hetHanLuc: DateTime?                                                                             |
+----------------------------------------------------------------------------------------------------+
| + taoDonOnline(khach, san, slots, ptThanhToan): DonDat                                            |
| + taoDonTaiQuay(staff, san, slots, khachVangLai, payNow): DonDat                                  |
| + xacNhanThanhToan(soTien, phuongThuc): void                                                       |
| + huyDon(lyDo, thongTinHoan): void                                                                 |
| + hoanThanhDon(): void                                                                             |
| + danhDauNoShow(): void                                                                            |
| + dongDonCongNo(adminId, lyDo): void                                                               |
| + capNhatTienDichVu(tongTienMoi): void                                                             |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------+   +-----------------------------------------------+
|                 TonKhoDichVu                       |   |                HoaDonMuaHo                    |
+----------------------------------------------------+   +-----------------------------------------------+
| - id: int                                          |   | - id: int                                     |
| - dichVuId: int                                    |   | - donDatId: int                               |
| - soLuong: int                                     |   | - loaiChiPhi: LoaiChiPhiMuaHo                 |
| - soLuongDangGiu: int                              |   | - tenKhoanChi: string                         |
| - nguongCanhBao: int                               |   | - nhaCungCap: string?                         |
+----------------------------------------------------+   | - soHoaDon: string?                           |
| + layKhaDung(): int                                |   | - loaiChungTu: LoaiChungTu                    |
| + reserve(soLuong): void                           |   | - ngayHoaDon: Date                            |
| + release(soLuong): void                           |   | - tienHoaDon: int                             |
| + deliver(soLuong): void                           |   | - phiPhucVu: int                              |
| + returnStock(soLuong): void                       |   | - tongTien: int                               |
| + importStock(soLuong): void                       |   | - trangThai: TrangThaiHoaDonMuaHo             |
| + adjustStock(soLuong, loai): void                 |   +-----------------------------------------------+
+----------------------------------------------------+   | + taoHoaDon(staffId, duLieu): HoaDonMuaHo     |
                                                         | + capNhatTrangThai(trangThai): void           |
+----------------------------------------------------+   | + xoaHoaDon(): void                           |
|                    SuKien                          |   +-----------------------------------------------+
+----------------------------------------------------+
| - id: int                                          |
| - tieuDe: string                                   |
| - moTaNgan: string                                 |
| - noiDung: string                                  |
| - hinhAnh: string                                  |
| - ngayBatDau: DateTime                             |
| - ngayKetThuc: DateTime                            |
| - diaDiem: string                                  |
| - sanId: int?                                      |
| - phiThamGia: int                                  |
| - phanThuong: string?                              |
| - trangThai: TrangThaiSuKien                       |
| - hotlineLh: string                                |
+----------------------------------------------------+
| + taoMoiSuKien(thongTin): SuKien                   |
| + capNhatTrangThai(status): void                   |
| + traCuuDanhSach(status): SuKien[]                 |
+----------------------------------------------------+
```

---

# 14. TRÁCH NHIỆM CỐT LÕI CỦA CÁC LỚP (CLASS RESPONSIBILITIES)

- **`NguoiDung`:** Quản lý định danh tài khoản, kiểm tra vai trò (CUSTOMER, STAFF, ADMIN) và thẩm định trạng thái ACTIVE/LOCKED.
- **`LoaiSan`:** Xác định danh mục môn thể thao hoặc loại hình sự kiện, quản lý cờ hoạt động.
- **`San`:** Quản lý trạng thái hoạt động thực tế (ACTIVE, MAINTENANCE, INACTIVE), sức chứa tối đa và quy hoạch chuyển đổi mục đích.
- **`KhungGio`:** Quản lý khoảng thời gian 60 phút cố định trong ngày và cờ kích hoạt.
- **`GiaKhungGio`:** Định nghĩa chính sách định giá phân biệt giữa ngày trong tuần (WEEKDAY) và cuối tuần (WEEKEND).
- **`DonDat`:** Quản lý trạng thái vòng đời đặt sân (`PENDING` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED` / `EXPIRED` / `NO_SHOW`), tổng hợp số tiền snapshot.
- **`ChiTietKhungGioDat`:** Đảm bảo tính duy nhất của từng khung giờ đặt, chống trùng lịch tuyệt đối qua cờ `dang_khoa`.
- **`ThanhToan`:** Sổ cái tài chính ghi nhận các giao dịch nạp tiền thanh toán (`PAYMENT`) và hoàn trả tiền (`REFUND`).
- **`TonKhoDichVu`:** Đảm bảo toàn vẹn số lượng tồn kho: `availableQuantity = so_luong - so_luong_dang_giu >= 0`. Ngăn chặn bán quá số lượng (Overselling).
- **`BienDongKho`:** Truy vết bất biến mọi biến động kho với đầy đủ số lượng trước, số lượng sau, lý do và người thực hiện.
- **`HoaDonMuaHo`:** Quản lý chi phí mua sắm ngoài, đi chợ hộ cho khách tiệc BBQ/sự kiện, lưu chứng từ điện tử/giấy và cộng dồn vào hóa đơn tổng hợp.
- **`SuKien`:** Cung cấp thông tin giải đấu, sự kiện thể thao, workshop phong trào, lịch trình, lệ phí, cơ cấu giải thưởng và hotline liên hệ.

---

# 15. MỐI QUAN HỆ GIỮA CÁC LỚP (CLASS RELATIONSHIPS)

1. `LoaiSan 1 ────── 0..* San` (Association: Loại sân chứa nhiều sân cụ thể)
2. `LoaiSan 1 ────── 0..* GiaKhungGio` (Association)
3. `KhungGio 1 ───── 0..* GiaKhungGio` (Association)
4. `San 1 ────────── 0..* DonDat` (Association)
5. `DonDat 1 ─────── 1..3 ChiTietKhungGioDat` (Composition: Chi tiết khung giờ phụ thuộc vòng đời đơn đặt)
6. `KhungGio 1 ───── 0..* ChiTietKhungGioDat` (Association)
7. `DonDat 1 ─────── 0..* ThanhToan` (Association: Giao dịch tài chính thuộc đơn)
8. `DonDat 1 ─────── 0..* NhatKyTrangThaiDon` (Composition: Nhật ký phụ thuộc vòng đời đơn)
9. `DonDat 1 ─────── 0..1 DanhGia` (Association: Một đơn tối đa 1 đánh giá)
10. `DonDat 1 ────── 0..* YeuCauDichVu` (Association: Đơn sân có thể gọi dịch vụ nhiều lần)
11. `YeuCauDichVu 1 ─ 1..* ChiTietYeuCauDichVu` (Composition: Chi tiết phụ thuộc đơn gọi)
12. `DichVu 1 ────── 0..* ChiTietYeuCauDichVu` (Association)
13. `DichVu 1 ────── 0..1 TonKhoDichVu` (Association: Mỗi dịch vụ có 1 bản ghi tồn kho tương ứng)
14. `TonKhoDichVu 1 ─ 0..* BienDongKho` (Association: Nhật ký biến động kho)
15. `DonDat 1 ────── 0..* HoaDonMuaHo` (Composition: Hóa đơn mua hộ gắn chặt với đơn tiệc, bị xóa khi đơn xóa vật lý)
16. `San 0..1 ────── 0..* SuKien` (Aggregation: Sự kiện có thể tổ chức tại 1 sân cụ thể hoặc toàn cơ sở)
17. `NguoiDung 1 ──── 0..* HoaDonMuaHo` (Association role: `creatorStaff` - Nhân viên tạo chứng từ mua hộ)

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
| `DonDat` | `HoaDonMuaHo` | `1` sang `0..*` | Một đơn tiệc/sự kiện có thể có nhiều chứng từ mua hộ ngoài |
| `San` | `SuKien` | `0..1` sang `0..*` | Một sân có thể là địa điểm tổ chức của nhiều sự kiện |

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
8. `NguoiDung` đóng vai trò **`procurementCreator`** trong quan hệ với `HoaDonMuaHo`: Nhân viên tạo và chịu trách nhiệm chứng từ mua hộ.

---

# 18. QUAN HỆ HỢP THÀNH VÀ THU NẠP (COMPOSITION & AGGREGATION)

### Quan hệ Hợp Thành (Composition - Bắt buộc gắn liền vòng đời):
- `DonDat` ◆── `ChiTietKhungGioDat`: Các khung giờ đặt không thể tồn tại độc lập ngoài đơn đặt.
- `DonDat` ◆── `NhatKyTrangThaiDon`: Nhật ký chuyển trạng thái gắn chặt với vòng đời của đơn đặt.
- `DonDat` ◆── `HoaDonMuaHo`: Hóa đơn mua hộ gắn chặt với đơn đặt tiệc, khi đơn đặt bị xóa (trong kiểm thử), hóa đơn mua hộ bị xóa theo (`ON DELETE CASCADE`).
- `YeuCauDichVu` ◆── `ChiTietYeuCauDichVu`: Các dòng món dịch vụ phụ thuộc hoàn toàn vào lần yêu cầu dịch vụ.

### Quan hệ Thu Nạp (Aggregation - Tồn tại độc lập):
- `LoaiSan` ◇── `San`: Sân thuộc về một loại sân, nhưng loại sân là danh mục độc lập.
- `San` ◇── `SuKien`: Sự kiện có thể liên kết với một sân cụ thể, khi sân bị xóa thì `san_id` trong sự kiện chuyển thành NULL (`ON DELETE SET NULL`).
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
7. `TrangThaiThanhToan`: `UNPAID`, `PAID`, `REFUNDED`
8. `NguonDon`: `APP`, `STAFF`
9. `PhuongThucThanhToan`: `CASH`, `BANK_TRANSFER`, `VNPAY`
10. `PhanLoaiDichVu`: `DRINK`, `RENTAL`, `PACKAGE`
11. `TrangThaiYeuCauDichVu`: `REQUESTED`, `DELIVERED`, `CANCELLED`
12. `LoaiGiaoDichThanhToan`: `PAYMENT`, `REFUND`
13. `MucDichThanhToan`: `COURT`, `SERVICE`
14. `TrangThaiGiaoDich`: `PENDING`, `SUCCESS`, `FAILED`
15. `LoaiBienDongKho`: `IMPORT`, `ADJUST_IN`, `ADJUST_OUT`, `RESERVE`, `RELEASE`, `DELIVER`, `RETURN`
16. `TrangThaiTonKho`: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`
17. `LoaiChiPhiMuaHo`: `GROCERY`, `CATERING`, `EQUIPMENT`, `OTHER`
18. `LoaiChungTuMuaHo`: `ELECTRONIC`, `PAPER`
19. `TrangThaiHoaDonMuaHo`: `PENDING`, `CONFIRMED`, `BILLED`, `CANCELLED`
20. `TrangThaiSuKien`: `UPCOMING`, `HAPPENING`, `FINISHED`

---


---

# 20. QUY TRÌNH NGHIỆP VỤ ĐẶT LỊCH SÂN (BOOKING FLOW)

- **Quy tắc khung giờ:** Đặt từ 1 đến 3 khung giờ liên tiếp (VD: 07:00-08:00, 08:00-09:00, 09:00-10:00). Không được đặt ngắt quãng trên cùng một đơn (BR-02).
- **Phạm vi ngày:** Trong ngày hôm nay hoặc tối đa 14 ngày tới (`ngay_dat BETWEEN layNgayHomNay() AND congNgay(layNgayHomNay(), 14)`) (BR-03).
- **Quy tắc thời gian đặt trước:** Khách hàng (Customer) đặt từ ứng dụng phải đặt trước giờ bắt đầu của slot đầu tiên ít nhất 30 phút. Nhân viên (Staff) đặt tại quầy được phép đặt slot đang diễn ra nếu slot đó chưa kết thúc (BR-03, BR-04).
- **Giữ chỗ (Hold):** Khi khách hàng chọn `BANK_TRANSFER`, đơn có trạng thái `PENDING`, giữ chỗ 30 phút (`het_han_luc = NOW() + INTERVAL 30 MINUTE`). Trong thời gian này, slot bị khóa bằng cờ `dang_khoa = 1`, không ai khác đặt được. Khi nhân viên xác nhận thanh toán -> `CONFIRMED`. Nếu quá 30 phút -> Scheduler tự động quét chuyển sang `EXPIRED` và nhả slot (BR-06, BR-07).

---

# 21. QUY TRÌNH THANH TOÁN (PAYMENT FLOW)

Hệ thống hỗ trợ 2 mục đích thanh toán:
1. `COURT`: Tiền thuê sân bóng hoặc phòng tiệc.
2. `SERVICE`: Tiền dịch vụ ăn uống, thuê dụng cụ và chi phí mua hộ phát sinh.

Hỗ trợ các phương thức:
- `CASH`: Tiền mặt tại quầy lễ tân do Staff tiếp nhận.
- `BANK_TRANSFER`: Chuyển khoản ngân hàng qua mã VietQR chuẩn.

Tuyệt đối không tạo payment giả. Mọi giao dịch tài chính đều được ghi vào bảng `thanh_toan` với đầy đủ số tiền, phương thức, người xử lý và mã giao dịch đối soát (BR-28).

---

# 22. QUY TRÌNH HOÀN TIỀN (REFUND FLOW)

- **Điều kiện hủy hoàn tiền của khách:** Khách hàng chỉ được hủy đơn khi thời điểm hiện tại cách giờ bắt đầu thi đấu của slot đầu tiên **tối thiểu 6 giờ** (`>= 360 phút`) và đơn **chưa có bất kỳ dịch vụ nào đã giao** (`DELIVERED`) (BR-09, BR-29).
- **Xử lý hoàn tiền:** Nếu đơn chưa thanh toán (`UNPAID`), hủy ngay không phát sinh hoàn tiền. Nếu đơn đã thanh toán (`PAID`), khách bắt buộc nhập thông tin nhận tiền hoàn (`refundInfo`). Hệ thống chuyển trạng thái đơn sang `CANCELLED`, `trang_thai_thanh_toan = REFUND_PENDING` và tạo bản ghi `thanh_toan` loại `REFUND`, trạng thái `PENDING` (BR-10, BR-34).
- **Nhân viên xử lý:** Staff vào danh mục hoàn tiền (`GET /staff/refunds`), kiểm tra thông tin đối soát và thực hiện chuyển khoản lại cho khách, sau đó bấm xác nhận hoàn tiền (`POST /staff/payments/:id/confirm-refund`) -> chuyển trạng thái thanh toán sang `REFUNDED` và bản ghi thanh toán sang `SUCCESS`.

---

# 23. QUY TRÌNH PHỤC VỤ DỊCH VỤ TẠI SÂN (SERVICE FLOW)

1. **Gửi yêu cầu (REQUESTED):** Khách hàng trên sân đặt dịch vụ qua Mobile App (hoặc Staff nhập hộ tại quầy). Hệ thống kiểm tra số lượng khả dụng: nếu `availableQuantity >= requested` -> Khóa record kho (`SELECT ... FOR UPDATE`), tăng `so_luong_dang_giu` (RESERVE) và ghi log `bien_dong_kho`. Trạng thái đơn gọi là `REQUESTED` (BR-37, BR-38).
2. **Giao hàng (DELIVERED):** Nhân viên mang đồ ra sân, bấm xác nhận giao hàng (`POST /staff/service-orders/:id/deliver`). Hệ thống trừ tồn kho thực tế (`so_luong = so_luong - requested`), giảm giữ chỗ (`so_luong_dang_giu = so_luong_dang_giu - requested`), ghi log `DELIVER` trong `bien_dong_kho` và chuyển trạng thái sang `DELIVERED`. Lúc này, tiền dịch vụ chính thức được cộng dồn vào hóa đơn của đơn đặt (BR-24, BR-40).
3. **Hủy yêu cầu (CANCELLED):** Khách hoặc Staff hủy yêu cầu khi đang ở trạng thái `REQUESTED`. Hệ thống giải phóng giữ chỗ (`so_luong_dang_giu = so_luong_dang_giu - requested`), tăng khả dụng trở lại và ghi log `RELEASE` (BR-25, BR-39). Nhân viên hủy yêu cầu đã DELIVERED chỉ được phép nếu tiền dịch vụ đã thu chưa vượt quá tổng tiền sau hủy (BR-26).

---

# 24. QUY TRÌNH QUẢN LÝ CHO THUÊ DỤNG CỤ (RENTAL FLOW)

- Dụng cụ cho thuê (`dich_vu.phan_loai = 'RENTAL'`) như vợt, giày, bóng, áo bib được quản lý chặt chẽ.
- Khi giao đồ thuê (`DELIVERED`), nhân viên mang đồ ra sân.
- Khi đơn đặt sân kết thúc, hệ thống kiểm tra các dòng đồ thuê: nếu còn đồ thuê chưa có thời gian trả (`tra_luc IS NULL`) thì **KHÔNG ĐƯỢC PHÉP HOÀN THÀNH ĐƠN** (`422 RENTALS_NOT_RETURNED` / `409 HAS_UNRETURNED_RENTALS`) (BR-27, BR-11).
- Nhân viên kiểm tra nhận lại đồ nguyên vẹn và xác nhận trả đồ (`POST /staff/service-order-items/:id/return`). Hệ thống ghi nhận `tra_luc = NOW()`, người nhận trả `nguoi_nhan_tra_id`, tự động cộng lại số lượng thực tế trong kho (`so_luong = so_luong + requested`) và ghi log `RETURN` trong `bien_dong_kho` (BR-41).

---

# 25. HIỆN TRẠNG TRIỂN KHAI GÓI DỊCH VỤ (PACKAGE MODULE)

- **Trạng thái thực tế:** `STATUS: IMPLEMENTED (STANDALONE SERVICE)`.
- Gói dịch vụ (`PACKAGE`) như "Gói Đại Tiệc BBQ Sân Vườn Hoàng Hôn", "Gói Tiệc Sinh Nhật / Thôi Nôi Thể Thao", "Gói Gala Dinner & Team Building Doanh Nghiệp" được quản lý như một dịch vụ độc lập có đơn vị tính là 'gói' trong bảng `dich_vu` và kiểm soát tồn kho trong `ton_kho_dich_vu`.
- Mô hình này vừa đảm bảo đơn giản, vừa cho phép bán gói dịch vụ độc lập hoặc kết hợp linh hoạt với đặt sân.

---

# 26. MÔ HÌNH ĐẶT KHU VỰC SỰ KIỆN & TIỆC (EVENT BOOKING MODEL)

- **Nguyên tắc cốt lõi:** Khu vực sự kiện/tiệc được mô hình hóa trực tiếp trong hệ thống hiện tại bằng cách sử dụng:
  `loai_san.phan_loai = 'EVENT'` kết hợp với trường sức chứa `san.suc_chua`.
- **Dùng chung toàn bộ:** Tái sử dụng 100% các bảng `san`, `khung_gio`, `gia_khung_gio`, `don_dat`, `chi_tiet_khung_gio_dat`, `thanh_toan`.
- **2 Phương thức phục vụ tiệc đồng thời:**
  - **Cách 1 (Nội bộ):** Đặt các gói tiệc trọn gói niêm yết trong danh mục `dich_vu` (`phan_loai = 'PACKAGE'`).
  - **Cách 2 (Ngoại vi):** Cơ sở đi chợ hộ hoặc thuê dịch vụ ngoài theo yêu cầu riêng của khách, ghi nhận vào bảng `hoa_don_mua_ho`.

---

# 27. QUY TRÌNH QUẢN LÝ HÓA ĐƠN MUA HỘ NGOẠI VI (PROCUREMENT FLOW)

- **Mục đích:** Phục vụ nhu cầu khách tổ chức tiệc BBQ hoặc sự kiện thể thao muốn đặt món đặc biệt ngoài danh mục (hải sản tươi sống, bánh kem sinh nhật, âm thanh ánh sáng, v.v.).
- **Quy trình xử lý:**
  1. Nhân viên thỏa thuận với khách, tiến hành mua hộ hoặc tiếp nhận hóa đơn chứng từ từ nhà cung cấp ngoài.
  2. Nhân viên tạo phiếu ghi nhận mua hộ trên Web Admin (`POST /api/v1/staff/procurement-invoices`):
     - Nhập `donDatId`, `loaiChiPhi` (GROCERY, CATERING, EQUIPMENT, OTHER).
     - Nhập `tenKhoanChi`, `nhaCungCap`, `soHoaDon`, `loaiChungTu` (ELECTRONIC / PAPER).
     - Nhập số tiền hóa đơn gốc `tienHoaDon`, phí phục vụ `phiPhucVu` (công đi chợ).
     - Đính kèm URL ảnh chụp chứng từ / hóa đơn đỏ VAT (`hinhAnhChungTu`) để khách kiểm tra.
  3. Hệ thống tự động tính `tongTien = tienHoaDon + phiPhucVu`, gán trạng thái `BILLED` và gọi hàm `tinhLaiTienDichVu` để cập nhật tức thì cache `don_dat.tien_dich_vu` (BR-43, BR-44, BR-45).
  4. Hóa đơn mua hộ xuất hiện minh bạch trong mục hóa đơn tổng hợp của đơn đặt (`taoHoaDon`), giúp khách và nhân viên theo dõi số dư cần thanh toán.

---

# 28. QUY TRÌNH SỰ KIỆN & GIẢI ĐẤU THỂ THAO (TOURNAMENT & EVENT WORKFLOW)

- **Mục đích:** Quảng bá và quản lý các giải đấu thể thao phong trào (Cúp bóng đá mini, Giải cầu lông mở rộng, Ngày hội Pickleball miễn phí, Đêm hội BBQ âm nhạc).
- **Vòng đời sự kiện:** `UPCOMING` (Sắp diễn ra) -> `HAPPENING` (Đang diễn ra) -> `FINISHED` (Đã kết thúc).
- **Luồng khách hàng:**
  - Khách hàng xem danh sách giải đấu trên Mobile App (`GET /api/v1/events`).
  - Xem chi tiết thể thức thi đấu, cơ cấu giải thưởng, lệ phí tham gia và hotline ban tổ chức (`GET /api/v1/events/:id`).
  - Khách bấm gọi hotline hoặc liên hệ trực tiếp quầy để đăng ký tham gia (BR-46, BR-50).

---

# 29. HỆ THỐNG QUẢN LÝ TỒN KHO THỰC TẾ (INVENTORY MODULE)

Hệ thống quản lý tồn kho chuyên sâu được chuẩn hóa tại bảng `ton_kho_dich_vu` và `bien_dong_kho`:
- **Số lượng tổng tồn kho:** `so_luong` (INT >= 0).
- **Số lượng đang giữ chỗ:** `so_luong_dang_giu` (INT >= 0).
- **Số lượng khả dụng thực tế:** `availableQuantity = so_luong - so_luong_dang_giu`.
- **Bất biến toàn vẹn:** `so_luong_dang_giu <= so_luong` và `availableQuantity >= 0` (BR-35, BR-36).
- **Cơ chế khóa dòng chống xung đột:** Mọi thao tác biến động kho chạy trong giao dịch dữ liệu ACID và sử dụng `SELECT ... FOR UPDATE` trên dòng tồn kho tương ứng.
- **Thứ tự ưu tiên cảnh báo tồn kho:**
  - `dich_vu.trang_thai = 'INACTIVE'` -> Trạng thái tính toán luôn là `INACTIVE` (Ngưng bán), có độ ưu tiên cao nhất, ghi đè toàn bộ số lượng vật lý còn trong kho. Hệ thống khóa toàn bộ nghiệp vụ nhập kho (`POST /admin/inventory/import`) hoặc điều chỉnh kho (`POST /admin/inventory/adjust`) với mã lỗi `422 SERVICE_INACTIVE`.
  - Nếu `dich_vu.trang_thai = 'ACTIVE'`:
    - `availableQuantity <= 0` -> Trạng thái tính toán: `OUT_OF_STOCK`.
    - `0 < availableQuantity <= nguong_canh_bao` -> Trạng thái tính toán: `LOW_STOCK`.
    - `availableQuantity > nguong_canh_bao` -> Trạng thái tính toán: `IN_STOCK`.
- **Quyền hạn kho rõ ràng:**
  - `CUSTOMER`: Chỉ thấy cờ `isAvailable: boolean`, hoàn toàn không thấy số lượng tồn, ngưỡng cảnh báo hay lịch sử kho (BR-42).
  - `STAFF`: Xem số lượng tồn phục vụ vận hành tại quầy (`GET /staff/inventory`), thực hiện giao hàng (DELIVER), nhận lại đồ thuê (RETURN). Tuyệt đối không được nhập kho (IMPORT) hay điều chỉnh kho (ADJUST).
  - `ADMIN`: Toàn quyền nhập kho (`POST /admin/inventory/import`), điều chỉnh tăng/giảm (`POST /admin/inventory/adjust`), cập nhật ngưỡng (`PATCH /admin/inventory/:id/threshold`), và xem toàn bộ nhật ký biến động kho (`GET /admin/inventory/transactions`).

---

# 30. QUY TRÌNH TÍNH TOÁN HÓA ĐƠN ĐỘNG (DYNAMIC INVOICE CALCULATION)

Hóa đơn không lưu cứng thành một bảng tĩnh mà được tính toán động tại thời điểm truy vấn (`layHoaDon` / `taoHoaDon`) (BR-24, BR-29, BR-47):
```
courtAmount          = don_dat.tien_san
inHouseServiceAmount = SUM(chi_tiet_yeu_cau_dich_vu.so_luong * chi_tiet_yeu_cau_dich_vu.don_gia) 
                       CỦA CÁC YÊU CẦU CÓ trang_thai = 'DELIVERED'
procurementAmount    = SUM(hoa_don_mua_ho.tong_tien)
                       CỦA CÁC HÓA ĐƠN CÓ trang_thai IN ('CONFIRMED', 'BILLED')
serviceAmount        = inHouseServiceAmount + procurementAmount
grandTotal           = courtAmount + serviceAmount
paidAmount           = SUM(thanh_toan.so_tien) CỦA GIAO DỊCH PAYMENT CÓ trang_thai = 'SUCCESS'
servicePaid          = SUM(thanh_toan.so_tien) CỦA PAYMENT MỤC ĐÍCH 'SERVICE' CÓ trang_thai = 'SUCCESS'
balance              = grandTotal - paidAmount
serviceBalance       = serviceAmount - servicePaid
isFullyPaid          = (balance <= 0)
```

---

# 31. ĐẶC QUYỀN ĐÓNG ĐƠN CÓ CÔNG NỢ (DEBT WRITE-OFF PRIVILEGE)

- **Vấn đề thực tế:** Khách hàng đến thi đấu hoặc đặt tiệc, đã sử dụng dịch vụ hoặc mua hộ nhưng bỏ về mà không thanh toán nốt phần tiền còn thiếu.
- **Ranh giới quyền hạn:** **CHỈ ADMIN MỚI CÓ QUYỀN NÀY** (`POST /api/v1/admin/bookings/:id/close-with-debt`). Nhân viên (Staff) bị cấm hoàn toàn (BR-30).
- **Xử lý an toàn:**
  - Tự động hủy các yêu cầu dịch vụ đang `REQUESTED` và giải phóng tồn kho tương ứng.
  - Chuyển trạng thái đơn sang `COMPLETED`, đánh dấu cờ `dong_don_cong_no = 1`.
  - Giải phóng slot giờ (`dang_khoa = NULL`).
  - Tuyệt đối không tự tạo payment giả để bù trừ.
  - Ghi nhật ký trạng thái với lý do đóng đơn có công nợ.
  - Số tiền công nợ được xuất hiện minh bạch trong báo cáo quản trị tổng quan (`reports/summary`) để kế toán đối soát.

---

# 32. TIẾN TRÌNH CHẠY NGẦM TỰ ĐỘNG (SCHEDULER BACKGROUND JOB)

- Tiến trình `quetDonHetHan` chạy tự động mỗi 30 giây (`khoiDongJobQuetHetHan(30000)`).
- Truy vấn tất cả các đơn `PENDING` có `het_han_luc < NOW()`.
- Với mỗi đơn, mở transaction và thực hiện khóa dòng `SELECT ... FOR UPDATE`:
  1. Cập nhật `don_dat.trang_thai = 'EXPIRED'`.
  2. Mở khóa slot: `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`.
  3. Giải phóng tồn kho dịch vụ nếu khách có gọi dịch vụ trong lúc PENDING: gọi `DichVuService.giaiPhongTonKhoDonHuy` để trừ `so_luong_dang_giu` và ghi log `RELEASE`.
  4. Ghi nhật ký trạng thái: `PENDING -> EXPIRED` với ghi chú "Hệ thống tự động hủy do hết hạn giữ chỗ (30 phút)".

---

# 33. DANH MỤC QUY TẮC NGHIỆP VỤ TOÀN DIỆN (BUSINESS RULES BR-01 → BR-50)

- **BR-01:** Khung giờ hoạt động cố định: Các khung giờ chuẩn 60 phút từ 06:00 đến 22:00, không được ngắt quãng hay chồng lấn.
- **BR-02:** Mỗi đơn đặt được chọn từ 1 đến 3 khung giờ liên tiếp trên cùng một sân và trong cùng một ngày.
- **BR-03:** Khách hàng chỉ được đặt trước tối đa 14 ngày tính từ ngày hiện tại.
- **BR-04:** Khách hàng đặt qua app phải đặt trước giờ bắt đầu của slot đầu tiên ít nhất 30 phút.
- **BR-05:** Nhân viên tại quầy được phép đặt slot đang diễn ra nếu slot đó chưa kết thúc.
- **BR-06:** Khách hàng chọn chuyển khoản có 30 phút giữ chỗ tạm thời (Hold).
- **BR-07:** Scheduler tự động quét mỗi 30s để hủy đơn PENDING quá hạn sang EXPIRED và nhả slot.
- **BR-08:** Khách hàng thanh toán tiền mặt tại quầy phải được nhân viên xác nhận và đổi trạng thái CONFIRMED.
- **BR-09:** Khách hàng chỉ được hủy đơn trước giờ bắt đầu thi đấu tối thiểu 6 giờ và khi chưa có dịch vụ nào đã DELIVERED.
- **BR-10:** Hủy đơn đã thanh toán (PAID) tạo yêu cầu hoàn tiền REFUND PENDING, nhân viên đối soát hoàn trả tiền cho khách.
- **BR-11:** Một đơn đặt chỉ được hoàn thành (COMPLETED) khi đã thanh toán đủ 100% và đã trả hết đồ thuê.
- **BR-12:** Đơn đặt quá giờ bắt đầu mà khách không đến được nhân viên đánh dấu NO_SHOW.
- **BR-13:** Đơn đặt sau khi COMPLETED mới được phép gửi đánh giá (Rating từ 1 đến 5 sao).
- **BR-14:** Bảng giá sân phân biệt giữa ngày trong tuần (WEEKDAY) và cuối tuần (WEEKEND).
- **BR-15:** Chống trùng lịch tuyệt đối bằng Unique Constraint và giao dịch ACID ở CSDL.
- **BR-16:** Sân ở trạng thái MAINTENANCE hoặc INACTIVE không xuất hiện trên lịch trống và không được đặt.
- **BR-17:** Không thể đưa sân về trạng thái bảo trì nếu đang có đơn PENDING hoặc CONFIRMED trong tương lai.
- **BR-18:** Cổng Web Admin chỉ cho phép tài khoản có vai trò STAFF hoặc ADMIN đăng nhập.
- **BR-19:** Mỗi khách hàng chỉ được có tối đa 3 đơn PENDING/CONFIRMED cùng lúc để chống spam giữ chỗ.
- **BR-20:** Giá tiền sân được snapshot cố định tại thời điểm đặt, đổi giá tương lai không ảnh hưởng đơn cũ.
- **BR-21:** Khách hàng chỉ xem và thao tác trên đơn đặt của chính mình (Resource Ownership Rule).
- **BR-22:** Mã đơn đặt gồm tiền tố BK kèm 8 ký tự ngẫu nhiên chữ hoa và số.
- **BR-23:** Giá dịch vụ được snapshot cố định tại thời điểm tạo yêu cầu dịch vụ.
- **BR-24:** Dịch vụ chỉ được tính vào tổng hóa đơn khi đã ở trạng thái DELIVERED.
- **BR-25:** Khách hàng chỉ được hủy yêu cầu dịch vụ khi yêu cầu đó đang ở trạng thái REQUESTED.
- **BR-26:** Nhân viên có quyền hủy yêu cầu dịch vụ kèm theo lý do bắt buộc; không được hủy nếu tiền đã thu vượt quá tổng mới.
- **BR-27:** Đồ thuê (RENTAL) phải được nhân viên xác nhận nhận lại đồ trước khi đơn được đóng.
- **BR-28:** Không tạo payment giả. Mọi giao dịch tài chính phải có bản ghi thanh toán tương ứng.
- **BR-29:** Hóa đơn được tổng hợp động từ tiền sân, tiền dịch vụ đã giao, hóa đơn mua hộ và các khoản thanh toán.
- **BR-30:** Chỉ ADMIN mới có quyền đóng đơn có công nợ (Debt Write-Off) khi khách bỏ về không thanh toán.
- **BR-31:** Tài khoản ADMIN không thể tự khóa chính mình và hệ thống luôn duy trì ít nhất 1 ADMIN ACTIVE.
- **BR-32:** Báo cáo doanh thu phân tích tách bạch giữa tiền sân, tiền dịch vụ nội bộ, tiền mua hộ ngoài và tiền hoàn.
- **BR-33:** Trạng thái tài khoản LOCKED bị từ chối ngay lập tức ở request kế tiếp dù JWT chưa hết hạn.
- **BR-34:** Hủy đơn đã thanh toán bắt buộc phải cung cấp thông tin nhận tiền hoàn.
- **BR-35:** Tồn kho khả dụng được tính theo công thức: `availableQuantity = so_luong - so_luong_dang_giu`.
- **BR-36:** Bất biến tồn kho: `so_luong >= 0`, `so_luong_dang_giu >= 0`, `so_luong_dang_giu <= so_luong`.
- **BR-37:** Gửi yêu cầu dịch vụ tự động giữ chỗ kho (RESERVE) và khóa dòng bằng `SELECT ... FOR UPDATE`.
- **BR-38:** Từ chối ngay lập tức với lỗi `422 INSUFFICIENT_STOCK` nếu số lượng yêu cầu vượt quá số lượng khả dụng.
- **BR-39:** Hủy yêu cầu dịch vụ hoặc hủy đơn đặt tự động giải phóng tồn kho đang giữ chỗ (RELEASE).
- **BR-40:** Giao hàng dịch vụ (DELIVER) trừ tồn kho thực tế và giảm số lượng đang giữ chỗ.
- **BR-41:** Xác nhận trả đồ thuê (RETURN) tự động cộng hoàn lại tồn kho thực tế của dụng cụ.
- **BR-42:** Khách hàng chỉ thấy trạng thái `isAvailable: boolean`, hoàn toàn không thấy chi tiết số lượng kho nội bộ.
- **BR-43:** Hóa đơn mua hộ ngoài chỉ được thêm vào đơn đặt ở trạng thái hoạt động (không phải CANCELLED hoặc EXPIRED).
- **BR-44:** Chứng từ mua hộ phân biệt giữa Hóa đơn điện tử (ELECTRONIC) và Chứng từ giấy (PAPER) kèm ảnh chụp hóa đơn.
- **BR-45:** Cập nhật hoặc xóa hóa đơn mua hộ ngoài tự động kích hoạt tính toán lại cache `tien_dich_vu` của đơn đặt.
- **BR-46:** Sự kiện và giải đấu thể thao có vòng đời rõ ràng: `UPCOMING` -> `HAPPENING` -> `FINISHED`.
- **BR-47:** Báo cáo tài chính phân rã chi tiết tách biệt doanh thu tiền sân, dịch vụ nội bộ, dịch vụ mua hộ và phí phục vụ.
- **BR-48:** Chu kỳ quét tự động đơn hết hạn giữ chỗ là 30 giây (`setInterval` 30,000ms).
- **BR-49:** Khung giờ hoạt động chuẩn gồm các slot liên tiếp 60 phút từ 06:00 đến 22:00.
- **BR-50:** Endpoint tra cứu sự kiện giải đấu là công khai, cho phép khách hàng xem chi tiết giải và liên hệ hotline.

---

# 34. MA TRẬN CHUYỂN ĐỔI TRẠNG THÁI THỰC THỂ (STATE TRANSITION MATRIX)

### 1. Thực thể `DonDat` (Đơn Đặt Sân):

| Trạng Thái Cũ | Kích Hoạt (Trigger) | Điều Kiện Bảo Vệ (Guard) | Trạng Thái Mới | Tác Nhân | Thao Tác CSDL & Tác Động Phụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Khách đặt chọn CK | Dữ liệu hợp lệ, slot trống | `PENDING` | CUSTOMER | Insert `don_dat`, Insert slot (dang_khoa=1), hẹn giờ het_han_luc +30p |
| `[None]` | Staff đặt tại quầy | Dữ liệu hợp lệ, slot trống | `CONFIRMED` | STAFF | Insert `don_dat`, Insert slot (dang_khoa=1), ghi nhận thanh toán nếu payNow=true |
| `PENDING` | Khách thanh toán CK | Staff xác nhận tiền về | `CONFIRMED` | STAFF | Update `don_dat` -> CONFIRMED, PAID. Insert `thanh_toan` SUCCESS |
| `PENDING` | Quá hạn 30 phút | het_han_luc < NOW() | `EXPIRED` | SCHEDULER | Update `don_dat` -> EXPIRED, nhả slot (dang_khoa=NULL), giải phóng tồn kho DV |
| `PENDING` | Khách tự hủy đơn | Đơn thuộc quyền sở hữu | `CANCELLED` | CUSTOMER | Update `don_dat` -> CANCELLED, nhả slot (dang_khoa=NULL), giải phóng tồn kho DV |
| `CONFIRMED` | Khách hủy hợp lệ | >= 6h trước giờ đá & chưa có DV giao | `CANCELLED` | CUSTOMER | Update `don_dat` -> CANCELLED, nhả slot, tạo `thanh_toan` REFUND PENDING |
| `CONFIRMED` | Staff hủy thay khách | Chưa có dịch vụ đã giao | `CANCELLED` | STAFF | Update `don_dat` -> CANCELLED, nhả slot, tạo `thanh_toan` REFUND PENDING |
| `CONFIRMED` | Hoàn thành đơn | Đã trả hết đồ thuê & đã thanh toán đủ | `COMPLETED` | STAFF | Update `don_dat` -> COMPLETED, nhả slot. Khách có quyền đánh giá đơn |
| `CONFIRMED` | Khách không đến | Quá giờ bắt đầu thi đấu | `NO_SHOW` | STAFF | Update `don_dat` -> NO_SHOW, nhả slot, ghi nhật ký trạng thái |
| `CONFIRMED` | Khách nợ bỏ về | Duy nhất ADMIN phê duyệt | `COMPLETED` | ADMIN | Update `don_dat` -> COMPLETED, dong_don_cong_no=1. Giải phóng DV REQUESTED |

### 2. Thực thể `YeuCauDichVu` (Yêu Cầu Dịch Vụ):

| Trạng Thái Cũ | Kích Hoạt | Điều Kiện Bảo Vệ | Trạng Thái Mới | Tác Nhân | Thao Tác Kho & CSDL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Gọi món ra sân | availableQuantity >= requested | `REQUESTED` | CUSTOMER/STAFF | Insert `yeu_cau_dich_vu`, Khóa kho, tăng `so_luong_dang_giu` (RESERVE) |
| `REQUESTED` | Giao đồ ra sân | Hàng có sẵn | `DELIVERED` | STAFF | Update `yeu_cau_dich_vu` -> DELIVERED, trừ `so_luong`, giảm giữ chỗ (DELIVER) |
| `REQUESTED` | Khách/Staff hủy | Yêu cầu đang REQUESTED | `CANCELLED` | CUSTOMER/STAFF | Update `yeu_cau_dich_vu` -> CANCELLED, giảm giữ chỗ (RELEASE) |

### 3. Thực thể `HoaDonMuaHo` (Hóa Đơn Mua Hộ Ngoài):

| Trạng Thái Cũ | Kích Hoạt | Điều Kiện Bảo Vệ | Trạng Thái Mới | Tác Nhân | Thao Tác CSDL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Tạo HĐ mua hộ | Đơn không CANCELLED/EXPIRED | `BILLED` | STAFF | Insert `hoa_don_mua_ho`, tính lại cache `don_dat.tien_dich_vu` |
| `BILLED` | Nhân viên xác nhận lại | Hóa đơn tồn tại | `CONFIRMED` | STAFF | Update trạng thái, tính lại cache `don_dat.tien_dich_vu` |
| `BILLED` | Nhân viên hủy HĐ | Hóa đơn tồn tại | `CANCELLED` | STAFF | Update trạng thái, trừ khỏi cache `don_dat.tien_dich_vu` |

### 4. Thực thể `SuKien` (Sự Kiện & Giải Đấu Thể Thao):

| Trạng Thái Cũ | Kích Hoạt | Điều Kiện Bảo Vệ | Trạng Thái Mới | Tác Nhân | Thao Tác CSDL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[None]` | Tạo giải đấu | Dữ liệu hợp lệ | `UPCOMING` | ADMIN | Insert `su_kien` |
| `UPCOMING` | Khai mạc giải | Đến ngày bắt đầu | `HAPPENING` | ADMIN/Hệ thống | Update `su_kien.trang_thai = 'HAPPENING'` |
| `HAPPENING` | Bế mạc trao giải | Qua ngày kết thúc | `FINISHED` | ADMIN/Hệ thống | Update `su_kien.trang_thai = 'FINISHED'` |

---


---

# 35. ĐẶC TẢ LUỒNG HOẠT ĐỘNG (25 ACTIVITY FLOW SPECIFICATIONS)

Mỗi luồng nghiệp vụ đều được xác định rõ luồng Actor, luồng Hệ Thống, các điểm rẽ nhánh (Decision) và ranh giới giao dịch:

1. **Đăng Ký Tài Khoản:** Khách nhập Họ tên, SĐT, Mật khẩu -> Hệ thống kiểm tra trùng SĐT -> Băm mật khẩu Bcrypt -> Lưu bảng `nguoi_dung` với role CUSTOMER.
2. **Đăng Nhập & Cấp Quyền:** Nhập SĐT, Mật khẩu -> Hệ thống xác thực hash mật khẩu -> Kiểm tra tài khoản ACTIVE -> Cấp phát JWT mang vai trò tương ứng.
3. **Tra Cứu Lịch Trống:** Chọn ngày, chọn loại sân -> Hệ thống quét danh mục slot và trạng thái sân -> Trả về ma trận khung giờ kèm giá tương ứng và cờ trạng thái (AVAILABLE / BOOKED / PAST / MAINTENANCE / NO_PRICE).
4. **Khách Đặt Sân Trực Tuyến:** Chọn 1-3 slot liên tiếp -> Bắt đầu Transaction -> Khóa kiểm tra slot (`dang_khoa = 1`) -> Tạo `don_dat` PENDING -> Giữ slot -> Hẹn giờ 30 phút -> Commit.
5. **Thanh Toán Chuyển Khoản:** Khách quét VietQR -> Chuyển tiền thành công -> Nhân viên tại quầy kiểm tra tiền về -> Chuyển đơn sang CONFIRMED và PAID.
6. **Hết Hạn Giữ Chỗ (Scheduler):** Job quét mỗi 30s -> Phát hiện đơn PENDING quá hạn -> Bắt đầu Transaction -> Đổi EXPIRED -> Nhả slot (`dang_khoa = NULL`) -> Giải phóng tồn kho dịch vụ nếu có -> Commit.
7. **Khách Hủy Đơn:** Khách gửi yêu cầu hủy -> Kiểm tra >= 6h trước giờ đá & chưa giao DV -> Hủy đơn -> Nhả slot -> Nếu đã PAID thì tạo yêu cầu hoàn tiền REFUND PENDING.
8. **Xác Nhận Hoàn Tiền:** Staff xem danh sách hoàn tiền -> Thực hiện chuyển khoản trả tiền cho khách -> Xác nhận trên Web Admin -> Cập nhật `thanh_toan` SUCCESS và `don_dat` REFUNDED.
9. **Đặt Sân Tại Quầy (Walk-in):** Staff chọn sân, slot cho khách vãng lai -> Tạo đơn CONFIRMED -> Nhận tiền mặt hoặc CK -> Ghi nhận `thanh_toan` SUCCESS ngay lập tức nếu payNow=true.
10. **Gọi Dịch Vụ Ra Sân:** Khách/Staff gửi yêu cầu món -> Bắt đầu Transaction -> Khóa tồn kho (`SELECT ... FOR UPDATE`) -> Kiểm tra `available >= requested` -> Tạo `yeu_cau_dich_vu` -> Tăng `so_luong_dang_giu` (RESERVE) -> Commit.
11. **Giao Dịch Vụ Ra Sân:** Staff mang đồ ra sân -> Xác nhận DELIVERED -> Trừ `so_luong` tồn kho thực tế, giảm `so_luong_dang_giu` -> Ghi log DELIVER -> Tiền DV tính vào hóa đơn.
12. **Hủy Yêu Cầu Dịch Vụ:** Hủy yêu cầu đang REQUESTED -> Giải phóng `so_luong_dang_giu` (RELEASE) -> Phục hồi khả dụng kho.
13. **Thu Hồi Đồ Thuê (Rental Return):** Khách trả đồ -> Staff kiểm tra dụng cụ -> Bấm xác nhận trả đồ -> Cập nhật `tra_luc = NOW()` -> Cộng lại `so_luong` tồn kho thực tế (RETURN) -> Ghi log RETURN.
14. **Thu Tiền Dịch Vụ:** Staff mở hóa đơn đơn đặt -> Chọn thu tiền mặt/CK cho phần tiền dịch vụ còn thiếu -> Tạo bản ghi `thanh_toan` loại PAYMENT, mục đích SERVICE.
15. **Hoàn Thành Đơn Đặt:** Staff bấm hoàn thành đơn -> Kiểm tra: Đã thanh toán đủ 100%? Đã trả hết đồ thuê? -> Đạt điều kiện -> Đổi trạng thái `don_dat` sang COMPLETED, nhả slot.
16. **Đánh Dấu Không Đến (NO_SHOW):** Quá giờ bắt đầu mà khách không đến -> Staff xác nhận NO_SHOW -> Đổi trạng thái đơn, nhả slot.
17. **Đóng Đơn Có Công Nợ (Admin Write-Off):** Khách nợ bỏ về -> Admin xem xét -> Bấm đóng đơn nợ -> Hủy DV REQUESTED -> Đổi `don_dat` sang COMPLETED kèm cờ `dong_don_cong_no = 1` -> Khoản nợ ghi vào báo cáo.
18. **Nhập Kho (Admin IMPORT):** Admin chọn dịch vụ, nhập số lượng, ghi chú -> Khóa kho -> Tăng `so_luong` -> Ghi log IMPORT trong `bien_dong_kho`.
19. **Điều Chỉnh Kho (Admin ADJUST):** Admin chọn ADJUST_IN hoặc ADJUST_OUT kèm lý do bắt buộc -> Khóa kho -> Kiểm tra không để khả dụng âm -> Cập nhật `so_luong` -> Ghi log ADJUST.
20. **Cập Nhật Ngưỡng Cảnh Báo:** Admin cập nhật threshold -> Hệ thống tính toán lại trạng thái cảnh báo (IN_STOCK / LOW_STOCK / OUT_OF_STOCK).
21. **Đặt Sân Sự Kiện (Event Booking):** Đặt mặt bằng sự kiện với `loai_san.phan_loai = EVENT` -> Áp dụng luồng đặt sân chuẩn kết hợp kiểm tra sức chứa `san.suc_chua` và phục vụ gói tiệc.
22. **Ghi Nhận Hóa Đơn Mua Hộ Ngoại Vi:** Staff tiếp nhận hóa đơn chợ/siêu thị ngoài -> Nhập thông tin, số tiền, phí phục vụ và ảnh chứng từ -> Hệ thống tạo `hoa_don_mua_ho` BILLED -> Tính lại cache `don_dat.tien_dich_vu` -> Hiển thị trên hóa đơn tổng hợp.
23. **Cập Nhật & Xóa Hóa Đơn Mua Hộ:** Staff sửa trạng thái (CONFIRMED/CANCELLED) hoặc xóa hóa đơn mua hộ -> Hệ thống tự động tính toán lại cache `don_dat.tien_dich_vu`.
24. **Tra Cứu & Đăng Ký Sự Kiện / Giải Đấu:** Khách hàng tra cứu danh sách giải đấu thể thao trên app (`/events`) -> Xem chi tiết thể thức và hotline ban tổ chức -> Liên hệ đăng ký tham gia.
25. **Báo Cáo Phân Rã Khoản Thu:** Admin xem báo cáo tổng hợp bóc tách doanh thu tiền sân, tiền dịch vụ nội bộ, tiền hóa đơn mua hộ ngoài và phí phục vụ.

---

# 36. ĐẶC TẢ LUỒNG TƯƠNG TÁC TUẦN TỰ (SEQUENCE FLOW SPECIFICATIONS)

### 1. Luồng Tranh Chấp Đặt Sân Đồng Thời (Booking Concurrency Sequence):
```
Client 1                 Client 2                Controller             Service               Database (MySQL)
   |                        |                        |                     |                        |
   |-- POST /bookings ----->|                        |                     |                        |
   |   (Slot 1, 08:00)      |                        |                     |                        |
   |                        |-- POST /bookings ----->|                     |                        |
   |                        |   (Slot 1, 08:00)      |                     |                        |
   |                        |                        |-- taoDonDat() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- INSERT chi_tiet... ->| (dang_khoa=1) -> Thành công!
   |                        |                        |                     |-- COMMIT ------------->|
   |<-- 201 Created --------|------------------------|                     |                        |
   |                        |                        |-- taoDonDat() ----->|                        |
   |                        |                        |                     |-- START TRANSACTION -->|
   |                        |                        |                     |-- INSERT chi_tiet... ->| ER_DUP_ENTRY (san, ngay, slot, 1)
   |                        |                        |                     |-- ROLLBACK ----------->|
   |                        |<-- 409 Conflict (SLOT_TAKEN) ----------------|                        |
```

### 2. Luồng Giữ Chỗ Tồn Kho Dịch Vụ Đồng Thời (Inventory Reserve Concurrency Sequence):
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
   |                        |                        |                     |-- Validate available ->| (Đủ hàng: avail = 1)
   |                        |                        |                     |-- UPDATE so_luong_dang_giu (+1)
   |                        |                        |                     |-- INSERT bien_dong_kho | (RESERVE)
   |                        |                        |                     |-- COMMIT ------------->| (Khóa giải phóng!)
   |<-- 201 Created --------|------------------------|                     |                        |
   |                        |                        |                     |-- Đọc row mới -------->| (Avail = 0)
   |                        |                        |                     |-- Validate available ->| (Hết hàng -> Thất bại!)
   |                        |                        |                     |-- ROLLBACK ----------->|
   |                        |<-- 422 INSUFFICIENT_STOCK -------------------|                        |
```

### 3. Luồng Ghi Nhận Hóa Đơn Mua Hộ Ngoài & Tính Hóa Đơn Động (Procurement Invoicing Sequence):
```
Staff (Web Admin)                MuaHoController            MuaHoService            HoaDonUtil / Database
      |                                 |                         |                          |
      |-- POST /procurement-invoices -->|                         |                          |
      |   (donDatId, tien, phi, img)    |-- taoHoaDonMuaHo() ---->|                          |
      |                                 |                         |-- Kiểm tra don_dat ----->| (Không CANCELLED/EXPIRED)
      |                                 |                         |-- INSERT hoa_don_mua_ho->| (Status = BILLED)
      |                                 |                         |-- tinhLaiTienDichVu() -->|
      |                                 |                         |   |-- SUM(ct) + SUM(hdmh)|
      |                                 |                         |   |-- UPDATE don_dat --->| (Cache tien_dich_vu)
      |<-- 201 Created -----------------|-------------------------|                          |
      |                                 |                         |                          |
      |-- GET /bookings/:id/invoice --->|                         |                          |
      |                                 |-- layHoaDon() --------->|-- taoHoaDon() ---------->|
      |                                 |                         |   |-- Lấy tien_san       |
      |                                 |                         |   |-- Lấy orders DELIVERED
      |                                 |                         |   |-- Lấy procurementInvoices
      |                                 |                         |   |-- Lấy payments       |
      |                                 |                         |   |-- Tính grandTotal & balance
      |<-- 200 OK (Invoice JSON) -------|-------------------------|<-- Trả về hóa đơn đầy đủ |
```

### 4. Luồng Hoàn Trả Đồ Thuê & Tự Động Phục Hồi Tồn Kho (Rental Return Sequence):
```
Staff (Web Admin)              DichVuController           DichVuService             Database (MySQL)
      |                                |                         |                        |
      |-- POST .../items/:id/return -->|                         |                        |
      |                                |-- traDoThue() --------->|                        |
      |                                |                         |-- START TRANSACTION -->|
      |                                |                         |-- SELECT FOR UPDATE -->| (chi_tiet_yeu_cau_dich_vu)
      |                                |                         |-- Kiểm tra RENTAL & tra_luc IS NULL
      |                                |                         |-- UPDATE tra_luc = NOW()
      |                                |                         |-- SELECT FOR UPDATE -->| (ton_kho_dich_vu)
      |                                |                         |-- UPDATE so_luong (+qty)
      |                                |                         |-- INSERT bien_dong_kho | (RETURN)
      |                                |                         |-- COMMIT ------------->|
      |<-- 200 OK (Item returned) -----|-------------------------|                        |
```

### 5. Luồng Hủy Đơn & Đối Soát Hoàn Tiền (Cancellation & Refund Sequence):
```
Customer (App)                   DonDatController           DonDatService             Database (MySQL)
      |                                |                         |                        |
      |-- POST /bookings/:id/cancel -->|                         |                        |
      |   (reason, refundInfo)         |-- huyDonBoiKhach() ---->|                        |
      |                                |                         |-- START TRANSACTION -->|
      |                                |                         |-- SELECT FOR UPDATE -->| (don_dat)
      |                                |                         |-- Kiểm tra: >= 6h & chưa giao DV
      |                                |                         |-- UPDATE trang_thai = CANCELLED
      |                                |                         |-- UPDATE dang_khoa = NULL (Nhả slot)
      |                                |                         |-- giaiPhongTonKhoDonHuy() (RELEASE)
      |                                |                         |-- INSERT thanh_toan (REFUND PENDING)
      |                                |                         |-- COMMIT ------------->|
      |<-- 200 OK (refundPending=true) |-------------------------|                        |
      |                                                                                   |
Staff (Web Admin)              NhanVienController         NhanVienService                 |
      |                                |                         |                        |
      |-- POST .../confirm-refund ---->|                         |                        |
      |   (transactionRef)             |-- xacNhanHoanTien() --->|-- START TRANSACTION -->|
      |                                |                         |-- UPDATE thanh_toan -> | (Status = SUCCESS)
      |                                |                         |-- UPDATE don_dat ----->| (trang_thai_thanh_toan = REFUNDED)
      |                                |                         |-- COMMIT ------------->|
      |<-- 200 OK (Hoàn tất) ----------|-------------------------|                        |
```

### 6. Luồng Đóng Đơn Có Công Nợ Bởi Admin (Debt Write-off Sequence):
```
Admin (Web Admin)              QuanTriController          QuanTriService            Database (MySQL)
      |                                |                         |                        |
      |-- POST .../close-with-debt --->|                         |                        |
      |   (reason)                     |-- dongDonCongNo() ----->|                        |
      |                                |                         |-- START TRANSACTION -->|
      |                                |                         |-- SELECT FOR UPDATE -->| (don_dat: CONFIRMED)
      |                                |                         |-- Kiểm tra: qua giờ bắt đầu sân
      |                                |                         |-- UPDATE don_dat ----->| (COMPLETED, dong_don_cong_no=1)
      |                                |                         |-- UPDATE dang_khoa = NULL
      |                                |                         |-- Ghi nhật ký trạng thái
      |                                |                         |-- taoHoaDon() -------->| (Hóa đơn công nợ minh bạch)
      |                                |                         |-- COMMIT ------------->|
      |<-- 200 OK (Closed with Debt) --|-------------------------|                        |
```

---

# 37. MÔ HÌNH LỚP PHÂN TÍCH VOPC (VIEW OF PARTICIPATING CLASSES)

Trong phân tích và thiết kế phần mềm hướng đối tượng theo chuẩn RUP/UML, **VOPC (View of Participating Classes)** là mô hình xác định tập hợp các lớp tham gia thực hiện một Use Case cụ thể, được chia thành 3 nhóm chuẩn:
- **Boundary Classes (`<<boundary>>`):** Giao diện tương tác người dùng hoặc các Controller tiếp nhận yêu cầu HTTP RESTful API.
- **Control Classes (`<<control>>`):** Các lớp điều khiển điều phối luồng nghiệp vụ, kiểm tra ràng buộc quy tắc và quản lý giao dịch.
- **Entity Classes (`<<entity>>`):** Các lớp thực thể dữ liệu mang trạng thái và ánh xạ trực tiếp đến bảng cơ sở dữ liệu.
- **Helper/Utility Classes:** Các lớp tiện ích hỗ trợ tính toán, thời gian, mật mã, giao dịch.

Dưới đây là bảng đặc tả VOPC chi tiết cho **10 Use Case trọng yếu** của hệ thống:

| STT | Use Case Trọng Yếu | Boundary Classes (`<<boundary>>`) | Control Classes (`<<control>>`) | Entity Classes (`<<entity>>`) | Helper / Utility Classes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VOPC-01** | **Đặt lịch sân trực tuyến (UC-04)** | `MobileBookingScreen`, `DonDatController` | `DonDatService` | `DonDat`, `ChiTietKhungGioDat`, `San`, `KhungGio`, `GiaKhungGio`, `NhatKyTrangThaiDon` | `voiGiaoDich`, `thoigian`, `nghiepvu` |
| **VOPC-02** | **Đặt sân tại quầy (Walk-in) (UC-05)** | `StaffWebBookingModal`, `NhanVienController` | `NhanVienService` | `DonDat`, `ChiTietKhungGioDat`, `ThanhToan`, `San`, `KhungGio`, `NhatKyTrangThaiDon` | `voiGiaoDich`, `thoigian`, `chuyendoicamel` |
| **VOPC-03** | **Gọi và giao dịch vụ tại sân (UC-14, 15)** | `MobileServiceOrderScreen`, `StaffServiceQueueUI`, `DichVuController` | `DichVuService` | `YeuCauDichVu`, `ChiTietYeuCauDichVu`, `DichVu`, `TonKhoDichVu`, `BienDongKho`, `DonDat` | `voiGiaoDich`, `hoadon` (`tinhLaiTienDichVu`) |
| **VOPC-04** | **Quản lý thuê và thu hồi dụng cụ (UC-17)** | `StaffRentalReturnModal`, `DichVuController` | `DichVuService` | `ChiTietYeuCauDichVu`, `DichVu`, `TonKhoDichVu`, `BienDongKho`, `YeuCauDichVu` | `voiGiaoDich` |
| **VOPC-05** | **Ghi nhận hóa đơn mua hộ ngoài (UC-30)** | `StaffProcurementModal`, `MuaHoController` | `MuaHoService` | `HoaDonMuaHo`, `DonDat`, `San`, `NguoiDung` | `hoadon` (`tinhLaiTienDichVu`, `taoHoaDon`) |
| **VOPC-06** | **Hủy đơn & xử lý hoàn tiền (UC-08, 10)** | `MobileCancelModal`, `StaffRefundUI`, `DonDatController`, `NhanVienController` | `DonDatService`, `NhanVienService` | `DonDat`, `ThanhToan`, `ChiTietKhungGioDat`, `NhatKyTrangThaiDon`, `TonKhoDichVu`, `BienDongKho` | `voiGiaoDich`, `thoigian` |
| **VOPC-07** | **Đóng đơn có công nợ (UC-24)** | `AdminDebtWriteOffModal`, `QuanTriController` | `QuanTriService` | `DonDat`, `ChiTietKhungGioDat`, `NhatKyTrangThaiDon`, `YeuCauDichVu` | `voiGiaoDich`, `hoadon` (`taoHoaDon`) |
| **VOPC-08** | **Quản trị nhập xuất và điều chỉnh kho (UC-20, 21)** | `AdminInventoryTab`, `DichVuController` | `DichVuService` | `TonKhoDichVu`, `BienDongKho`, `DichVu` | `voiGiaoDich` |
| **VOPC-09** | **Quét đơn giữ chỗ hết hạn (UC-07)** | `SchedulerDaemon (quetDonHetHan)` | `HeThanDonDatJob`, `DichVuService` | `DonDat`, `ChiTietKhungGioDat`, `TonKhoDichVu`, `BienDongKho`, `NhatKyTrangThaiDon` | `voiGiaoDich` |
| **VOPC-10** | **Tra cứu & Quản lý giải đấu thể thao (UC-31)** | `MobileEventScreen`, `AdminEventUI`, `DanhMucController` | `DanhMucService` | `SuKien`, `San` | `chuyendoicamel` |

---


---

# 38. DANH MỤC GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API ENDPOINTS CATALOG)

### 1. Xác thực & Tài khoản (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Đăng ký tài khoản khách hàng mới.
- `POST /api/v1/auth/login`: Đăng nhập hệ thống (Customer, Staff, Admin).
- `GET /api/v1/auth/me`: Lấy thông tin cá nhân hiện tại.
- `PUT /api/v1/auth/me`: Cập nhật họ tên, email.
- `PUT /api/v1/auth/change-password`: Đổi mật khẩu cá nhân.

### 2. Danh mục Công Khai (`/api/v1`)
- `GET /api/v1/court-types`: Danh sách loại sân đang hoạt động.
- `GET /api/v1/courts`: Danh sách sân thể thao và mặt bằng sự kiện.
- `GET /api/v1/courts/:id`: Chi tiết một sân cụ thể.
- `GET /api/v1/courts/:id/availability?date=YYYY-MM-DD`: Xem trạng thái các slot trong ngày của một sân.
- `GET /api/v1/time-slots`: Danh mục các khung giờ tiêu chuẩn.
- `GET /api/v1/slot-prices`: Ma trận giá công khai.
- `GET /api/v1/services`: Danh mục dịch vụ niêm yết (ẩn số tồn kho, chỉ hiển thị `isAvailable`).
- `GET /api/v1/services/:id`: Xem chi tiết món dịch vụ hoặc gói tiệc.
- `GET /api/v1/events`: Danh sách các sự kiện & giải đấu thể thao của cụm sân.
- `GET /api/v1/events/:id`: Xem chi tiết thể thức thi đấu và giải thưởng của sự kiện.
- `GET /api/v1/config/public`: Xem cấu hình ngân hàng chuyển khoản VietQR công khai.

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
- `GET /api/v1/staff/refunds`: Danh sách các khoản tiền cần hoàn trả kèm thống kê KPI.
- `POST /api/v1/staff/refunds/demo-seed`: Tạo dữ liệu mẫu hoàn tiền phục vụ kiểm thử.
- `POST /api/v1/staff/payments/:id/confirm-refund`: Xác nhận đã hoàn tiền cho khách.
- `GET /api/v1/staff/customers`: Tìm kiếm thông tin khách hàng.
- `GET /api/v1/staff/customers/:id`: Xem chi tiết hồ sơ khách hàng.
- `GET /api/v1/staff/service-orders`: Xem hàng đợi yêu cầu dịch vụ cần phục vụ.
- `POST /api/v1/staff/service-orders/:id/deliver`: Xác nhận giao dịch vụ ra sân.
- `POST /api/v1/staff/service-orders/:id/cancel`: Nhân viên hủy yêu cầu dịch vụ kèm lý do.
- `POST /api/v1/staff/bookings/:id/service-orders`: Nhập yêu cầu dịch vụ tại quầy cho khách.
- `POST /api/v1/staff/service-order-items/:id/return`: Xác nhận nhận lại đồ thuê (Rental Return).
- `GET /api/v1/staff/bookings/:id/invoice`: Xem chi tiết hóa đơn tại quầy.
- `POST /api/v1/staff/bookings/:id/service-payments`: Thu tiền dịch vụ tại quầy.
- `PATCH /api/v1/staff/services/:id/availability`: Bật/tắt tạm thời trạng thái hết hàng của dịch vụ.
- `GET /api/v1/staff/inventory`: Xem danh sách số lượng tồn kho khả dụng phục vụ vận hành.
- `GET /api/v1/staff/procurement-invoices`: Danh sách hóa đơn mua hộ ngoài phục vụ tiệc/sự kiện.
- `GET /api/v1/staff/procurement-invoices/summary`: Thống kê KPI về dịch vụ mua hộ ngoài.
- `POST /api/v1/staff/procurement-invoices`: Ghi nhận hóa đơn mua hộ ngoài (kèm ảnh chứng từ).
- `PATCH /api/v1/staff/procurement-invoices/:id/status`: Cập nhật trạng thái hóa đơn mua hộ.
- `DELETE /api/v1/staff/procurement-invoices/:id`: Xóa hóa đơn mua hộ ngoài.

### 5. Quản Trị Hệ Thống (`/api/v1/admin`)
- `GET /api/v1/admin/court-types`, `POST`, `PUT /:id`, `PATCH /:id/active`: Quản lý danh mục loại sân.
- `GET /api/v1/admin/courts`, `POST`, `PUT /:id`, `PATCH /:id/status`: Quản lý sân, chuyển đổi mục đích quy hoạch.
- `GET /api/v1/admin/time-slots`, `POST`, `PUT /:id`, `PATCH /:id/active`: Cấu hình danh mục khung giờ.
- `GET /api/v1/admin/slot-prices`, `PUT /api/v1/admin/slot-prices`: Cập nhật bảng giá ma trận hàng loạt.
- `GET /api/v1/admin/staff`, `POST`, `PUT /:id`, `PATCH /:id/status`, `POST /:id/reset-password`: Quản lý nhân viên.
- `GET /api/v1/admin/customers`, `PATCH /:id/status`, `POST /:id/reset-password`: Quản lý tài khoản khách.
- `POST /api/v1/admin/bookings/:id/close-with-debt`: Đặc quyền đóng đơn có công nợ (Write-off debt).
- `GET /api/v1/admin/services`, `POST`, `PUT /:id`, `PATCH /:id/status`: Quản lý dịch vụ niêm yết.
- `GET /api/v1/admin/reports/summary`: Báo cáo tổng quan KPI điều hành.
- `GET /api/v1/admin/reports/revenue`: Báo cáo doanh thu tài chính chi tiết.
- `GET /api/v1/admin/reports/court-usage`: Báo cáo tỷ lệ sử dụng sân (Occupancy rate).
- `GET /api/v1/admin/reports/services`: Báo cáo doanh số dịch vụ bán chạy.
- `GET /api/v1/admin/reports/itemized-breakdown`: Báo cáo phân rã chi tiết từng khoản thu (sân, DV nội bộ, mua hộ ngoài).
- `GET /api/v1/admin/inventory`: Xem danh sách quản trị tồn kho đầy đủ.
- `GET /api/v1/admin/inventory/transactions`: Xem nhật ký biến động kho kiểm toán có phân trang.
- `POST /api/v1/admin/inventory/import`: Nhập thêm hàng vào kho (IMPORT).
- `POST /api/v1/admin/inventory/adjust`: Điều chỉnh tăng/giảm tồn kho (ADJUST_IN, ADJUST_OUT).
- `PATCH /api/v1/admin/inventory/:serviceId/threshold`: Cập nhật ngưỡng cảnh báo kho.

---

# 39. QUY CHUẨN KIỂM ĐỊNH DỮ LIỆU ĐẦU VÀO (ZOD VALIDATION)

Toàn bộ tham số đầu vào được tiền xử lý và kiểm định chặt chẽ bằng Zod Schema:
- **Chuỗi số điện thoại:** Định dạng chuẩn Việt Nam 10 chữ số (`/^0\d{9}$/`).
- **Mật khẩu:** Tối thiểu 6 ký tự.
- **Ngày đặt sân:** Chuỗi `YYYY-MM-DD` hợp lệ, không phải ngày trong quá khứ, không quá 14 ngày tới.
- **Khung giờ đặt:** Mảng từ 1 đến 3 số nguyên dương liên tiếp.
- **Tiền tệ:** Số nguyên không âm (`z.number().int().nonnegative()`).
- **Số lượng dịch vụ:** Mỗi dòng từ 1 đến 20 (`z.number().int().min(1).max(20)`).
- **Hóa đơn mua hộ:** Bắt buộc có `donDatId`, `tenKhoanChi`, `tienHoaDon > 0`, `loaiChungTu` ('ELECTRONIC' | 'PAPER').
- **Lý do hủy / Điều chỉnh kho:** Bắt buộc tối thiểu 3 đến 5 ký tự (`z.string().trim().min(3).max(500)`).

---

# 40. DANH MỤC MÃ LỖI NGHIỆP VỤ CHUẨN HÓA (STANDARDIZED ERROR CODES)

| Mã Lỗi (Error Code) | HTTP Status | Diễn Giải Chi Tiết |
| :--- | :--- | :--- |
| `SLOT_TAKEN` | 409 Conflict | Khung giờ sân đã có người khác đặt giữ chỗ trước |
| `DOUBLE_BOOKING` | 409 Conflict | Xung đột đặt trùng lịch trên cùng một sân |
| `TOO_MANY_ACTIVE_BOOKINGS`| 429 Too Many Req | Khách vượt quá giới hạn 3 đơn PENDING đang hoạt động |
| `INVALID_STATE` / `INVALID_STATUS`| 409 Conflict | Trạng thái thực thể không cho phép thực hiện hành động này |
| `HAS_DELIVERED_SERVICES` | 409 Conflict | Không thể hủy đơn vì đã có dịch vụ giao ra sân |
| `RENTALS_NOT_RETURNED` / `HAS_UNRETURNED_RENTALS` | 422 / 409 | Không thể hoàn thành đơn vì còn đồ thuê chưa được trả |
| `INSUFFICIENT_STOCK` | 422 Unprocessable | Số lượng khả dụng trong kho không đủ đáp ứng |
| `SERVICE_INACTIVE` | 422 Unprocessable | Dịch vụ đã ngưng kinh doanh, cấm nhập kho hoặc điều chỉnh |
| `NOT_RENTAL_ITEM` | 422 Unprocessable | Món dịch vụ không phải đồ thuê để nhận trả |
| `REFUND_INFO_REQUIRED` | 422 Unprocessable | Bắt buộc nhập thông tin nhận tiền hoàn khi hủy đơn đã PAID |
| `CANCEL_DEADLINE_PASSED` | 422 Unprocessable | Đã quá hạn tự hủy đơn (phải trước giờ bắt đầu ít nhất 6 tiếng) |
| `TOO_EARLY` | 422 Unprocessable | Chưa đến giờ bắt đầu sử dụng sân |
| `CANNOT_LOCK_SELF` | 409 Conflict | Quản trị viên không được phép tự khóa tài khoản của chính mình |
| `UNAUTHORIZED` | 401 Unauthorized | Thiếu hoặc sai lệch mã thông báo xác thực JWT |
| `FORBIDDEN` | 403 Forbidden | Vai trò người dùng không có quyền truy cập endpoint này |
| `ACCOUNT_LOCKED` | 403 Forbidden | Tài khoản người dùng đã bị khóa hoạt động |
| `NOT_FOUND` | 404 Not Found | Không tìm thấy tài nguyên yêu cầu trong cơ sở dữ liệu |
| `VALIDATION_ERROR` | 400 Bad Request | Dữ liệu đầu vào không thỏa mãn lược đồ Zod Schema |

---

# 41. RANH GIỚI GIAO DỊCH DỮ LIỆU (TRANSACTION BOUNDARIES)

Mọi thao tác làm thay đổi nhiều bảng liên quan hoặc yêu cầu tính toàn vẹn tài chính/tồn kho đều được bọc trong hàm tiện ích `voiGiaoDich` (quản lý `START TRANSACTION`, `COMMIT`, `ROLLBACK` tự động):
1. **Giao dịch Đặt Sân (Booking Transaction):** Insert `don_dat`, Insert 1..3 `chi_tiet_khung_gio_dat` (`dang_khoa = 1`), ghi `nhat_ky_trang_thai_don`, Insert `thanh_toan` (nếu có).
2. **Giao dịch Giữ Chỗ Tồn Kho Dịch Vụ (Inventory Reserve Transaction):** Khóa dòng `SELECT ... FOR UPDATE`, kiểm tra `availableQuantity >= requested`, Insert `yeu_cau_dich_vu`, Insert `chi_tiet_yeu_cau_dich_vu`, Update `so_luong_dang_giu`, Insert `bien_dong_kho` (RESERVE).
3. **Giao dịch Hoàn Tất Thu Hồi Đồ Thuê (Rental Return Transaction):** Khóa dòng chi tiết yêu cầu, Update `tra_luc = NOW()`, Khóa và cộng lại `so_luong` tồn kho, Insert `bien_dong_kho` (RETURN).
4. **Giao dịch Tiếp Nhận Hóa Đơn Mua Hộ Ngoài:** Insert `hoa_don_mua_ho`, tính lại cache `don_dat.tien_dich_vu`.

---

# 42. KIỂM SOÁT XUNG ĐỘT ĐỒNG THỜI (CONCURRENCY CONTROL STRATEGY)

1. **Khóa Bi Lạc Quan Tầng CSDL (Unique Constraint Barrier):** Ràng buộc `UNIQUE KEY uq_slot_dang_khoa (san_id, ngay_dat, khung_gio_id, dang_khoa)` đảm bảo trong cùng một mili-giây, nếu có 100 yêu cầu cùng tranh chấp một slot, duy nhất 1 yêu cầu thành công, 99 yêu cầu còn lại bị MySQL chặn đứng với lỗi `ER_DUP_ENTRY` và Backend ánh xạ thành HTTP `409 Conflict (SLOT_TAKEN)`.
2. **Khóa Bi Quan Tầng Kho Dữ Liệu (Pessimistic Locking `SELECT ... FOR UPDATE`):** Đảm bảo tính tuần tự hóa (Serialization) khi nhiều luồng cùng gọi đồ uống hoặc dụng cụ tập luyện có số lượng hạn chế. Không bao giờ xảy ra hiện tượng tồn kho âm hay bán vượt số lượng tồn thực tế.

---

# 43. GIAO DIỆN CỔNG QUẢN TRỊ WEB (WEB ADMIN PORTAL)

- **Địa chỉ truy cập nội bộ:** `http://localhost:3000/admin/index.html`.
- **Giao diện vận hành Nhân viên (Staff):**
  - Dashboard tổng quan hôm nay (STF-02).
  - Lịch sân theo ngày dạng lưới (STF-03).
  - Danh sách đơn đặt và tra cứu (STF-04).
  - Đặt sân tại quầy cho khách vãng lai (STF-05).
  - Hàng đợi dịch vụ cần giao ra sân (STF-10).
  - Quản lý hóa đơn mua hộ ngoài phục vụ tiệc BBQ/sự kiện (Tạo HĐ, đính kèm ảnh chứng từ, xem thống kê).
  - Quản lý tồn kho vận hành (Xem tồn khả dụng, theo dõi hết hàng).
  - Xử lý hoàn tiền cho khách (STF-09).
  - Tra cứu khách hàng (STF-15).
- **Giao diện Quản trị viên (Admin):**
  - Quản lý loại sân và sân thi đấu, chuyển đổi mục đích quy hoạch (ADM-01, ADM-02).
  - Cấu hình khung giờ và ma trận giá (ADM-03).
  - Quản lý dịch vụ niêm yết (ADM-08).
  - Quản trị tồn kho nâng cao: Nhập kho (IMPORT), Điều chỉnh kiểm kê (ADJUST), Cấu hình ngưỡng cảnh báo, Xem nhật ký biến động kho (Audit Trail).
  - Quản lý tài khoản nhân viên (ADM-04).
  - Quản lý khách hàng (ADM-06).
  - Đóng đơn có công nợ (ADM-05).
  - Báo cáo tài chính, doanh thu, tỷ lệ sử dụng sân và phân rã chi tiết khoản thu (ADM-07).

---

# 44. GIAO DIỆN ỨNG DỤNG DI ĐỘNG (MOBILE APPLICATION)

- **Công nghệ xây dựng:** React Native với Expo SDK.
- **Màn hình chính của Khách hàng:**
  - Màn hình Khám phá & Tra cứu sân theo ngày, loại sân và giờ.
  - Màn hình Khám phá Sự kiện & Giải đấu thể thao của sân (thể thức, giải thưởng, hotline).
  - Màn hình Chọn slot và Đặt sân (hiển thị VietQR động để chuyển khoản).
  - Màn hình Chi tiết đơn đặt: theo dõi trạng thái, xem hóa đơn động thời gian thực bóc tách tiền sân, tiền dịch vụ, hóa đơn mua hộ.
  - Màn hình Gọi dịch vụ ăn uống & thuê dụng cụ tại sân (kiểm tra tồn khả dụng).
  - Màn hình Đánh giá chất lượng sân và gửi phản hồi sau khi hoàn tất.
  - Màn hình Quản lý hồ sơ và đổi mật khẩu cá nhân.

---

# 45. MA TRẬN PHÂN QUYỀN ACTOR – USE CASE (ACTOR–USE CASE MATRIX)

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
| **UC-30** | Ghi nhận & quản lý hóa đơn mua hộ ngoài | Forbidden | Allowed | Allowed | N/A |
| **UC-31** | Tra cứu & quản lý sự kiện giải đấu | Allowed | Allowed | Allowed | N/A |
| **UC-32** | Xem báo cáo phân rã chi tiết khoản thu | Forbidden | **Forbidden** | Allowed | N/A |

---

# 46. CÂY PHÂN RÃ USE CASE CHI TIẾT (USE CASE DECOMPOSITION)

Để phục vụ trực tiếp cho việc vẽ **Biểu đồ Use Case Phân Rã (Use Case Decomposition Diagrams)**, các ca sử dụng lớn được phân rã thành các ca sử dụng con với đầy đủ quan hệ phụ thuộc:

### 1. Phân rã Cụm Đặt Sân Trực Tuyến & Giữ Chỗ (UC-04):
- **UC-04.1:** Chọn loại sân và tra cứu lịch trống theo ngày.
- **UC-04.2:** Chọn từ 1 đến 3 khung giờ liên tiếp trên cùng một sân.
- **UC-04.3:** `<<include>>` Kiểm tra ràng buộc thời gian (trước >= 30 phút, tối đa 14 ngày tới).
- **UC-04.4:** `<<include>>` Khóa hàng rào kiểm tra trùng lịch (Barrier Check `dang_khoa = 1`).
- **UC-04.5:** `<<include>>` Snapshot giá tiền cố định theo ma trận giá ngày thường / cuối tuần.
- **UC-04.6:** `<<extend>>` Hẹn giờ tự động hủy giữ chỗ 30 phút (Hold 30 mins) khi chọn Chuyển khoản (VietQR).

### 2. Phân rã Cụm Vận Hành Tại Quầy & Theo Dõi Lịch Sân (UC11, UC-05, UC-06, UC-12):
- **UC11 — Theo dõi lịch sân (Cổng Web Nhân viên / Web Admin):**
  - **UC11.1: Xem lịch sân theo ngày (`GET /api/v1/staff/schedule?date=...`):**
    - Hiển thị ma trận lưới thời gian thực (Trục ngang: Các sân thi đấu, loại sân, sức chứa, trạng thái; Trục dọc: Các khung giờ chuẩn từ 06:00 đến 22:00).
    - Bộ điều hướng ngày linh hoạt: Nút lùi 1 ngày, Nút tiến 1 ngày, Nút nhảy về Hôm nay, Datepicker chọn ngày tùy ý và Nút làm mới dữ liệu.
  - **UC11.2: Lọc lịch theo sân (`#schedule-court-filter`):**
    - Cho phép nhân viên lọc xem toàn bộ các sân hoặc lọc riêng một sân cụ thể trực tiếp trên giao diện lưới.
    - Cập nhật tức thì dữ liệu hiển thị thông qua bộ đệm `cachedScheduleData` phía máy trạm kết hợp API backend.
  - **UC11.3: Xem chi tiết lịch đặt (`GET /api/v1/staff/bookings/:id` & `.../invoice`):**
    - Tương tác 1-chạm: Bấm vào bất kỳ ô đã đặt nào trên lưới lịch để kích hoạt Modal chi tiết đơn đặt sân (`#modal-detail`).
    - Bóc tách đầy đủ: Thông tin khách (Tên, SĐT), Khung giờ & Sân, Tiền sân, Tiền dịch vụ phát sinh, Hóa đơn mua hộ ngoài tiệc, Tiền đã thanh toán, Dư nợ (`balance`).
    - Hỗ trợ các nút thao tác nhanh: Thu tiền dịch vụ tại sân, Giao dịch vụ, Hoàn thành đơn, Hủy đơn.
  - **UC11.4: Xem thời gian sân bị khóa:**
    - Trực quan hóa và phân loại 4 trạng thái khóa khác nhau với màu sắc và chú thích rõ ràng:
      + **Khóa do đã xác nhận / Đang sử dụng (`CONFIRMED`)**: Huy hiệu màu xanh dương (`legend-badge-booked`), hiển thị mã đơn và tên khách hàng.
      + **Khóa giữ chỗ tạm thời (`PENDING`)**: Huy hiệu màu vàng cam (`legend-badge-pending`) tương ứng đơn chờ chuyển khoản VietQR trong vòng 30 phút.
      + **Khóa do sân đang bảo trì (`MAINTENANCE`)**: Huy hiệu màu đỏ (`legend-badge-maint`) kèm nhãn "🔧 Bảo trì", vô hiệu hóa đặt sân.
      + **Khóa do khung giờ đã trôi qua (`PAST`)**: Ô màu xám mờ (`legend-badge-past`) kèm nhãn "⏳ Đã qua" (quy tắc nhân viên: chỉ khóa khi `end_time <= now`).
  - **UC11.5: Tra cứu khoảng thời gian còn trống:**
    - Các ô chưa có người đặt và sân không bảo trì hiển thị màu xanh lá (`legend-badge-avail`).
    - Hiển thị đơn giá chính xác theo ma trận bảng giá ngày thường (WEEKDAY) hoặc cuối tuần (WEEKEND) của loại sân đó.
    - Tích hợp lối tắt *"⚡ Bấm đặt"* (1-Click Walk-in Booking): Bấm trực tiếp vào ô trống để chuyển sang màn hình Đặt sân tại quầy với Sân, Ngày và Khung giờ đã được tự động điền sẵn.
- **UC12 — Quản lý đơn đặt sân (Cổng Web Nhân viên / Web Admin):**
  - **UC12.1: Xem danh sách đơn đặt (`GET /api/v1/staff/bookings`):**
    - Bảng danh sách đơn trực quan hiển thị đầy đủ các trường: Mã đơn, Khách hàng & SĐT, Sân & Loại sân, Ngày đặt & Khung giờ, Tiền sân, Tiền dịch vụ, Tổng cộng (`grandTotal`), Trạng thái đơn, Trạng thái thanh toán, Nút thao tác Chi tiết.
    - Hỗ trợ phân trang máy chủ (`page`, `limit`).
  - **UC12.2: Tra cứu đơn theo điều kiện:**
    - Bộ lọc đa tiêu chí linh hoạt kết hợp đồng thời:
      + Lọc theo ngày đặt (`filter-date`).
      + Lọc theo sân thi đấu (`filter-court`).
      + Lọc theo trạng thái đơn (`filter-status`: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, EXPIRED, NO_SHOW).
      + Lọc theo trạng thái thanh toán (`filter-payment`: UNPAID, PAID, REFUNDED).
      + Tìm kiếm theo từ khóa (`filter-keyword`): Tìm kiếm tức thì theo Mã đơn đặt, Tên khách hàng hoặc Số điện thoại.
      + Lọc đơn quá hạn (`overdue=true`): Hiển thị danh sách các đơn đã qua giờ kết thúc mà chưa hoàn thành.
  - **UC12.3: Xem chi tiết đơn đặt (`GET /api/v1/staff/bookings/:id` & `.../invoice`):**
    - Mở Modal chi tiết đơn đặt sân (`#modal-detail`) từ bảng danh sách đơn hoặc từ lưới lịch.
    - Bóc tách đầy đủ: Chi tiết các khung giờ đặt, Bảng kê dịch vụ nội bộ (Đồ uống, Đồ thuê kèm trạng thái trả đồ), Bảng kê hóa đơn mua hộ ngoài tiệc BBQ (kèm ảnh chứng từ), Hóa đơn động tổng hợp (`grandTotal`, `paidAmount`, `balance`).
  - **UC12.4: Cập nhật trạng thái đơn:**
    - Vòng đời trạng thái đơn được quản lý chặt chẽ theo ma trận chuyển đổi:
      + `PENDING` -> `CONFIRMED`: Xác nhận đơn / Ghi nhận thanh toán tiền sân.
      + `CONFIRMED` -> `CHECKED_IN`: Khách có mặt tại sân nhận sân (Check-in).
      + `CONFIRMED` / `CHECKED_IN` -> `COMPLETED`: Hoàn tất lượt sử dụng sân.
      + `CONFIRMED` -> `NO_SHOW`: Ghi nhận khách không đến.
      + `PENDING` / `CONFIRMED` -> `CANCELLED`: Hủy đơn.
      + `CONFIRMED` / `CHECKED_IN` -> `COMPLETED (with debt)`: Admin đóng đơn có công nợ (Write-off debt).
    - Mọi bước chuyển trạng thái đều được lưu vết đầy đủ trong bảng `nhat_ky_trang_thai_don` phục vụ kiểm toán.
  - **UC12.5: Hủy đơn theo quyền được cấp (`POST /api/v1/staff/bookings/:id/cancel`):**
    - Nhân viên có quyền hủy các đơn ở trạng thái `PENDING` hoặc `CONFIRMED`.
    - Kiểm tra ràng buộc BR-29: Không cho phép hủy nếu đã có dịch vụ giao ra sân (`DELIVERED`).
    - Khi hủy: Giải phóng slot sân (`dang_khoa = NULL`), tự động hủy các yêu cầu dịch vụ đang `REQUESTED` và hoàn trả kho (`RELEASE`), ghi nhận lý do hủy.
    - Nếu đơn đã thanh toán (`PAID`): Tự động khởi tạo bản ghi hoàn tiền `REFUND` ở trạng thái `PENDING` (BR-34) để nhân viên thực hiện đối soát hoàn tiền qua ngân hàng.
  - **UC12.6: Xác nhận khách đến sân - Check-in (`POST /api/v1/staff/bookings/:id/check-in`):**
    - Áp dụng cho các đơn đã `CONFIRMED`.
    - Nhân viên bấm nút *"📍 Xác Nhận Khách Đến Sân (Check-in)"* trên Modal chi tiết đơn khi khách có mặt tại quầy nhận sân.
    - Chuyển trạng thái đơn sang `CHECKED_IN`, ghi nhận nhật ký kiểm toán, mở khóa các dịch vụ phục vụ tại sân.
  - **UC12.7: Hoàn tất lượt sử dụng sân (`POST /api/v1/staff/bookings/:id/complete`):**
    - Áp dụng cho đơn ở trạng thái `CONFIRMED` hoặc `CHECKED_IN`.
    - Kiểm tra các ràng buộc nghiệp vụ nghiêm ngặt (BR-12, BR-28):
      + `<<include>>` Đã đến hoặc qua giờ bắt đầu sử dụng sân (`ngay_dat <= today && gio_bat_dau <= now`).
      + `<<include>>` Tiền sân đã được thanh toán 100% (`trang_thai_thanh_toan = 'PAID'`).
      + `<<include>>` Không còn yêu cầu dịch vụ nào đang chờ xử lý (`trang_thai = 'REQUESTED'`).
      + `<<include>>` Đã thu hồi 100% dụng cụ cho thuê (`layDoThueChuaTra = empty`).
      + `<<include>>` Số dư công nợ dịch vụ đã thanh toán xong (`balance <= 0`).
    - Khi hoàn tất: Chuyển đơn sang `COMPLETED`, giải phóng slot (`dang_khoa = NULL`), ghi nhật ký trạng thái.
  - **UC12.8: Ghi nhận khách không đến - No-Show (`POST /api/v1/staff/bookings/:id/no-show`):**
    - Áp dụng cho đơn `CONFIRMED` khi quá giờ bắt đầu thi đấu mà khách vắng mặt (BR-12, BR-29).
    - Kiểm tra ràng buộc BR-29: Không được No-Show nếu đã có dịch vụ giao ra sân (`DELIVERED`).
    - Khi đánh dấu No-Show: Chuyển đơn sang `NO_SHOW`, giải phóng slot giờ (`dang_khoa = NULL`), tự động hủy các dịch vụ giữ chỗ và hoàn tồn kho, không hoàn lại tiền sân/tiền cọc, ghi nhật ký trạng thái.

### 3. Phân rã UC13 — Đặt Sân Tại Quầy (Cổng Web Nhân viên / Web Admin):
- **UC13.1: Tra cứu thông tin khách đặt sân:**
  - Nhập SĐT hoặc tên khách hàng, hệ thống tự động tìm kiếm trong bảng `nguoi_dung` (`GET /api/v1/staff/customers?keyword=...`). Nếu khách đã có tài khoản, tự động điền họ tên và gắn `nguoi_dung_id`. Nếu khách mới, lưu `ten_khach` và `so_dien_thoai_khach` vãng lai.
- **UC13.2: Tạo yêu cầu đặt sân tại quầy (`#tab-walkin`):**
  - Nhân viên chọn loại sân, sân thi đấu, ngày đặt và từ 1 đến 3 khung giờ liên tiếp trên cùng một sân.
- **UC13.3: Kiểm tra khả dụng sân:**
  - `<<include>>` Dùng chung quy tắc kiểm tra khả dụng với đặt trực tuyến (UC03): Gọi `GET /api/v1/staff/courts/:id/availability?date=...`, kiểm tra barrier trùng lịch `dang_khoa = 1`, kiểm tra khung giờ đã qua theo quy tắc nhân viên (`end_time <= now`), snapshot giá ngày thường/cuối tuần.
- **UC13.4: Xác nhận đơn đặt tại quầy (`POST /api/v1/staff/bookings`):**
  - Khác với đặt online cần chờ cọc (PENDING hold 30 phút), đơn đặt tại quầy được tạo trực tiếp ở trạng thái `CONFIRMED`, khóa slot ngay lập tức (`dang_khoa = 1`).
- **UC13.5: Ghi nhận nguồn đặt tại quầy:**
  - Đánh dấu trường `nguon_don = 'STAFF'` và lưu `nguoi_tao_id = nhanVienId`.
- **UC13.6: Tiếp nhận yêu cầu đặt sân qua điện thoại:**
  - Nhân viên nhận cuộc gọi hotline, tra cứu lịch trống trên lưới lịch (UC11) hoặc form đặt quầy (UC13), ghi nhận thông tin và lưu cờ `ghi_chu: 'Đặt qua điện thoại'`.

### 4. Phân rã UC14 — Xử Lý Dịch Vụ Và Thiết Bị Thuê:
- **Nguyên tắc nghiệp vụ cốt lõi:** Phân định rạch ròi bản chất giữa Bán hàng tiêu hao (DRINK) và Cho thuê tài sản quay vòng (RENTAL):
  - **Bán hàng (`DRINK`):** Vòng đời kết thúc khi giao hàng (`DELIVERED`) và trừ đứt tồn kho thực tế (`so_luong -= qty`). Không có nghiệp vụ hoàn trả.
  - **Cho thuê (`RENTAL`):** Vòng đời 2 giai đoạn: Giao đồ cho khách (`DELIVERED`) ➔ Thu hồi nhận lại đồ (`RETURNED`).
- **UC14.1: Xem hàng đợi yêu cầu dịch vụ (`GET /api/v1/staff/service-orders?status=REQUESTED`):**
  - Màn hình `#tab-services` hiển thị danh sách các món đồ uống, đồ thuê mà khách tại sân vừa gọi từ Mobile App hoặc nhân viên thêm tại quầy.
- **UC14.2: Tiếp nhận yêu cầu dịch vụ:**
  - Nhân viên nhận thông báo thời gian thực (Socket.io / Polling) kèm vị trí sân thi đấu đang yêu cầu.
- **UC14.3: Chuẩn bị sản phẩm cho khách:**
  - Lấy đồ uống giải khát từ tủ mát hoặc lấy dụng cụ thể thao (vợt, bóng, giày) từ kho vật tư.
- **UC14.4: Xác nhận giao sản phẩm (`POST /api/v1/staff/service-orders/:id/deliver`):**
  - Nhân viên mang đồ ra sân và bấm xác nhận giao hàng. Hệ thống trừ tồn kho thực tế (`so_luong -= qty`), giải phóng giữ chỗ (`so_luong_dang_giu -= qty`), ghi log `DELIVER` và tự động cập nhật cache `tien_dich_vu` trong đơn đặt.
- **UC14.5: Bàn giao dụng cụ thuê:**
  - Giao vợt, bóng thi đấu cho khách mượn, hệ thống ghi nhận dòng dịch vụ `RENTAL` với `tra_luc IS NULL`.
- **UC14.6: Tiếp nhận dụng cụ trả (`POST /api/v1/staff/service-order-items/:id/return`):**
  - Khi khách thi đấu xong mang trả dụng cụ, nhân viên bấm *"📦 Đã nhận lại"*. Hệ thống ghi nhận `tra_luc = NOW()`, `nguoi_nhan_tra_id = nhanVienId` và hoàn tồn kho thực tế (`so_luong += qty`, log `RETURN`).
- **UC14.7: Xác nhận tình trạng dụng cụ:**
  - Kiểm tra tình trạng nguyên vẹn của dụng cụ trả lại (bình thường, trầy xước nhẹ, gãy cước, hỏng hóc).
- **UC14.8: Ghi nhận dụng cụ hỏng hoặc mất:**
  - Nếu dụng cụ bị hỏng hoặc làm mất, nhân viên ghi nhận phụ thu bồi thường (`phi_phu_thu`), tự động cộng vào hóa đơn thanh toán của đơn đặt.
- **UC14.9: Cập nhật trạng thái yêu cầu dịch vụ:**
  - Quản lý trạng thái yêu cầu dịch vụ (`REQUESTED` ➔ `DELIVERED` ➔ `CANCELLED`). Hủy yêu cầu khi chưa giao hàng sẽ hoàn trả số lượng đang giữ chỗ (`RELEASE`).

### 5. Phân rã UC15 — Xử Lý Giao Dịch Tại Quầy:
- **Nguyên tắc nghiệp vụ cốt lõi:** Thống nhất mô hình Invoice (Bảng kê nghĩa vụ tài chính thời gian thực) và Payment (Chứng từ giao dịch thu tiền thực tế). Việc tạo hóa đơn KHÔNG PHẢI là bằng chứng đã thanh toán. Khách chỉ được xem là đã thanh toán khi có bản ghi `thanh_toan` ở trạng thái `SUCCESS`.
- **UC15.1: Tra cứu khoản tiền phải thu (`GET /api/v1/staff/bookings/:id/invoice`):**
  - Xem bảng kê hóa đơn bóc tách minh bạch: Tiền sân (`courtAmount`), Tiền dịch vụ nội bộ (`inHouseServiceAmount`), Tiền mua hộ ngoài (`procurementAmount`), Tiền hoàn (`refundAmount`), Tổng cộng (`grandTotal`), Đã trả (`paidAmount`) và Dư nợ cần thu (`balance`).
- **UC15.2: Ghi nhận thanh toán tiền mặt (`POST .../payments` hoặc `.../service-payments` với method `CASH`):**
  - Thu tiền mặt trực tiếp tại quầy thu ngân, hệ thống tạo bản ghi thanh toán `CASH` trạng thái `SUCCESS`.
- **UC15.3: Ghi nhận thanh toán chuyển khoản hoặc QR (method `BANK_TRANSFER`):**
  - Hướng dẫn khách quét mã VietQR Napas247 tại quầy, đối soát tiền vào tài khoản và bấm xác nhận thanh toán.
- **UC15.4: Ghi nhận thanh toán một phần:**
  - Hệ thống cho phép tách thu từng phần: Thu trước tiền sân (`POST .../payments`), thu sau tiền đồ uống/dụng cụ thuê (`POST .../service-payments`). Mỗi lần thu sẽ cộng dồn vào `paidAmount` và tự động giảm trừ `balance`.
- **UC15.5: Xác nhận kết quả thu tiền:**
  - Hệ thống kiểm tra số dư: Nếu `balance <= 0`, tự động chuyển trạng thái thanh toán sang `PAID`.
- **UC15.6: Tra cứu giao dịch tại quầy:**
  - Xem danh sách toàn bộ các phiếu thu tiền mặt và chuyển khoản liên quan đến đơn đặt trong Modal chi tiết đơn hoặc tab Báo cáo doanh thu.

### 6. Phân rã UC16 — Xử Lý Hoàn Tiền:
- **UC16.1: Tra cứu giao dịch cần hoàn (`GET /api/v1/staff/refunds`):**
  - Màn hình `#tab-refunds` hiển thị danh sách các đơn hủy có phát sinh nghĩa vụ hoàn tiền cọc/tiền sân (`thanh_toan.loai_giao_dich = 'REFUND' AND trang_thai = 'PENDING'`).
- **UC16.2: Kiểm tra điều kiện hoàn tiền (BR-09, BR-34):**
  - `<<include>>` Kiểm tra mốc thời gian hủy: Hủy trước giờ bắt đầu >= 6 tiếng được hoàn 100% tiền sân; Hủy gấp < 6 tiếng hoặc No-Show không được hoàn tiền.
- **UC16.3: Tiếp nhận yêu cầu hoàn tiền:**
  - Đọc thông tin thụ hưởng do khách cung cấp khi gửi yêu cầu hủy (Ngân hàng, Số tài khoản, Tên chủ tài khoản lưu trong trường `ghi_chu`).
- **UC16.4: Xác định số tiền được hoàn:**
  - Bằng đúng số tiền sân đã thanh toán (`don_dat.tien_san`) theo chính sách bảo vệ quyền lợi người tiêu dùng.
- **UC16.5: Gửi yêu cầu hoàn tiền (Thực hiện chuyển khoản hoàn tiền):**
  - Nhân viên kế toán/thu ngân thực hiện lệnh chuyển khoản qua ngân hàng số hoặc hoàn tiền mặt trực tiếp tại quầy theo thông tin đã lưu.
- **UC16.6: Ghi nhận kết quả hoàn tiền (`POST /api/v1/staff/payments/:id/confirm-refund`):**
  - Nhập mã giao dịch ngân hàng / số chứng từ và bấm *"Xác nhận đã hoàn tiền"*. Bản ghi `thanh_toan` chuyển sang `SUCCESS`, đơn đặt cập nhật `trang_thai_thanh_toan = 'REFUNDED'`.
- **UC16.7: Tra cứu trạng thái hoàn tiền:**
  - Theo dõi tiến độ hoàn tiền trực quan theo 2 trạng thái: `PENDING` (Chờ nhân viên hoàn) và `SUCCESS` (Đã hoàn tất chuyển khoản).

### 7. Phân rã UC17 — Tra Cứu Khách Hàng:
- **Nguyên tắc bảo mật:** Giới hạn quyền xem theo phạm vi vận hành cần thiết, tuyệt đối không để lộ mật khẩu băm, token hay thông tin nhạy cảm.
- **UC17.1: Tìm khách hàng theo thông tin (`GET /api/v1/staff/customers?keyword=...`):**
  - Màn hình `#tab-customers` cho phép tìm kiếm theo Họ tên, Số điện thoại hoặc Email.
- **UC17.2: Xem thông tin khách hàng (`GET /api/v1/staff/customers/:id`):**
  - Hiển thị hồ sơ khách hàng: Tên, SĐT, Email, Ngày đăng ký tài khoản, Trạng thái tài khoản (ACTIVE/LOCKED), Hạng thành viên.
- **UC17.3: Xem lịch sử đặt sân của khách:**
  - Bảng danh sách tất cả các đơn đặt sân trong quá khứ và hiện tại của khách đó (Mã đơn, Sân, Khung giờ, Trạng thái đơn, Trạng thái thanh toán).
- **UC17.4: Xem thông tin giao dịch liên quan đến khách:**
  - Thống kê tổng số lượt đặt sân, tổng số tiền đã chi tiêu tại cơ sở để nhân viên nhận diện khách hàng thân thiết và áp dụng chính sách chăm sóc phù hợp.

### 8. Phân rã Cụm Tiệc & Hóa Đơn Mua Hộ Ngoài (Tách thành UC18A & UC18B):
#### UC18A — Xử lý tiệc / sự kiện tại cơ sở:
- **UC18A.1: Tra cứu yêu cầu tổ chức tiệc:**
  - Nhân viên lọc danh sách đơn đặt các khu vực tiệc (Khu tiệc BBQ, phòng hội họp thể thao) hoặc các đơn có gọi gói dịch vụ sự kiện (`PACKAGE`).
- **UC18A.2: Xem chi tiết yêu cầu tiệc:**
  - Xem số lượng khách tham dự, thời gian bắt đầu - kết thúc, danh mục món ăn/đồ uống nội bộ đã đặt trước.
- **UC18A.3: Xác nhận yêu cầu tiệc:**
  - Khảo sát lịch sân và cơ sở vật chất, xác nhận nhận tiệc và chuyển đơn sang `CONFIRMED`.
- **UC18A.4: Chuẩn bị dịch vụ cho tiệc:**
  - Giữ chỗ số lượng đồ uống, ly cốc, dụng cụ nấu nướng trong kho và điều phối nhân sự phục vụ.
- **UC18A.5: Cập nhật trạng thái phục vụ tiệc:**
  - Giao các hạng mục dịch vụ ra khu vực tiệc theo tiến độ thực tế của khách (`DELIVERED`).
- **UC18A.6: Hoàn tất yêu cầu tiệc:**
  - Nghiệm thu khu vực tiệc, thu hồi đầy đủ dụng cụ cho mượn và thanh toán hóa đơn tổng hợp.

#### UC18B — Ghi nhận hóa đơn mua hộ (Procurement Flow):
- **Bản chất nghiệp vụ:** Nhân viên cơ sở đi chợ mua sắm thực phẩm ngoài (thịt bò, hải sản BBQ, trái cây, bánh kem...) theo yêu cầu riêng của khách tiệc. Đây là khoản cơ sở chi hộ trước cho nhà cung cấp ngoài (`tien_hoa_don`), cơ sở thu thêm phí phục vụ (`phi_phuc_vu`). Tổng tiền (`tong_tien = tien_hoa_don + phi_phuc_vu`) là **khoản phải thu lại từ khách hàng** và được cộng dồn vào hóa đơn tổng hợp.
- **UC18B.1: Tạo phiếu ghi nhận mua hộ (`POST /api/v1/staff/procurement-invoices`):**
  - Màn hình `#tab-catering` cho phép nhân viên tạo phiếu mua hộ gắn với một đơn đặt tiệc cụ thể (`don_dat_id`).
- **UC18B.2: Ghi nhận chi phí mua hàng bên ngoài:**
  - Nhập tên khoản chi (Ví dụ: "Hải sản tôm cua tiệc BBQ"), đơn vị cung cấp ngoài, số tiền hóa đơn gốc (`tien_hoa_don`) và phí phục vụ tiệc (`phi_phuc_vu`).
- **UC18B.3: Đính kèm thông tin chứng từ:**
  - Bắt buộc chọn loại chứng từ: Hóa đơn điện tử (`ELECTRONIC`) hoặc Hóa đơn/chứng từ giấy (`PAPER`), kèm số hóa đơn VAT và URL ảnh chụp hóa đơn gốc (`anh_chung_tu_url`).
- **UC18B.4: Liên kết khoản chi với tiệc/đơn liên quan:**
  - Hệ thống tự động liên kết với `don_dat_id` và cộng dồn vào cache `tien_dich_vu` của đơn đặt.
- **UC18B.5: Xác nhận khoản chi (`PATCH /api/v1/staff/procurement-invoices/:id/status`):**
  - Duyệt khoản chi (`CONFIRMED` ➔ `BILLED`), đưa vào bảng kê hóa đơn thanh toán của khách.
- **UC18B.6: Tra cứu lịch sử mua hộ (`GET /api/v1/staff/procurement-invoices`):**
  - Bảng tổng hợp toàn bộ các phiếu mua hộ ngoài kèm ảnh chứng từ, hỗ trợ lọc theo ngày, theo đơn và xuất báo cáo đối soát.

### 9. Phân rã UC19 — Theo Dõi Tồn Kho Vận Hành:
- **Nguyên tắc phân quyền RBAC:** Nhân viên (STAFF) chỉ có quyền XEM số liệu tồn kho vận hành; Quyền nhập xuất, điều chỉnh kiểm kê và sửa ngưỡng cảnh báo ĐỘC QUYỀN thuộc về Quản trị viên (ADMIN).
- **UC19.1: Xem danh sách mặt hàng (`GET /api/v1/staff/inventory`):**
  - Màn hình `#tab-inventory` hiển thị danh mục toàn bộ các sản phẩm đồ uống (`DRINK`), dụng cụ thuê (`RENTAL`) và gói tiệc (`PACKAGE`).
- **UC19.2: Tra cứu số lượng khả dụng:**
  - Hiển thị trực quan 3 chỉ số theo thời gian thực:
    * Số lượng tổng trong kho (`so_luong`).
    * Số lượng đang bị giữ chỗ bởi các đơn đang phục vụ (`so_luong_dang_giu`).
    * Số lượng thực sự khả dụng để bán/cho thuê tiếp (`availableQuantity = so_luong - so_luong_dang_giu`).
    * Nhãn cảnh báo: `Đủ hàng` (xanh), `Sắp hết` (vàng - `LOW_STOCK`), `Hết hàng` (đỏ - `OUT_OF_STOCK`).
- **UC19.3: Kiểm tra tình trạng dụng cụ thuê:**
  - Theo dõi số lượng dụng cụ (vợt, bóng, giày) đang ở ngoài sân do khách thuê chưa trả và số lượng đang nằm trong kho sẵn sàng phục vụ.
- **UC19.4: Tra cứu biến động kho liên quan đến đơn dịch vụ:**
  - Nhân viên theo dõi được các giao dịch trừ tồn khi giao hàng (`DELIVER`) và cộng tồn khi nhận lại đồ thuê (`RETURN`). Mọi biến động kiểm kê điều chỉnh lớn (`ADJUST_IN`, `ADJUST_OUT`, `IMPORT`) được ghi vào sổ cái `bien_dong_kho` để Admin kiểm toán độc lập.

### 5. Phân rã Cụm Tra Cứu Sự Kiện & Giải Đấu Thể Thao (UC08 / UC-31):
- **UC08.1 (UC-31.1):** Xem danh sách sự kiện & giải đấu (`GET /api/v1/events`):
  - Hiển thị danh sách giải đấu thể thao phong trào (Cúp bóng đá mini, Giải cầu lông mở rộng, Workshop Pickleball, Đêm hội BBQ).
  - Phân loại trực quan vòng đời sự kiện: `UPCOMING` (Sắp diễn ra), `HAPPENING` (Đang diễn ra), `FINISHED` (Đã kết thúc).
- **UC08.2 (UC-31.2):** Xem thông tin chi tiết sự kiện (`GET /api/v1/events/:id`):
  - `<<include>>` Hiển thị thể lệ & thể thức thi đấu (vòng bảng, loại trực tiếp, đối tượng tham gia).
  - `<<include>>` Hiển thị cơ cấu giải thưởng (cúp vàng, huy chương, cờ lưu niệm, tiền thưởng).
  - `<<include>>` Hiển thị lệ phí tham gia (hoặc hoàn toàn miễn phí).
- **UC08.3 (UC-31.3):** Tra cứu lịch tổ chức và thông tin liên hệ:
  - `<<include>>` Tra cứu thời gian thi đấu cụ thể (ngày giờ bắt đầu - kết thúc) và địa điểm cụm sân thi đấu.
  - `<<include>>` Hiển thị hotline Ban tổ chức tiếp nhận đăng ký VĐV.
  - `<<extend>>` Gọi điện thoại trực tiếp đến Ban tổ chức qua nút quay số một chạm trên Mobile App.

### 10. Phân rã UC20 — Quản Trị Tồn Kho Nâng Cao (Admin Inventory Management):
- **UC20.1: Nhập kho hàng mới (`POST /api/v1/admin/inventory/import`):**
  - Quản trị viên nhập bổ sung số lượng nước uống, bóng, vợt, dụng cụ thể thao từ nhà cung cấp kèm ghi chú nguồn hàng. Hệ thống cộng tồn kho thực tế (`so_luong += qty`) và ghi sổ cái `bien_dong_kho` (loại `IMPORT`).
- **UC20.2: Điều chỉnh kiểm kê tồn kho (`POST /api/v1/admin/inventory/adjust`):**
  - Sau kỳ kiểm kê kho định kỳ, Admin điều chỉnh tăng (`ADJUST_IN`) hoặc giảm (`ADJUST_OUT`) do hao hụt, hỏng hóc. Bắt buộc nhập lý do hoặc số biên bản kiểm kê. Hệ thống chặn không cho điều chỉnh giảm vượt quá tồn khả dụng.
- **UC20.3: Cấu hình ngưỡng cảnh báo tồn kho (`PATCH /api/v1/admin/inventory/:id/threshold`):**
  - Thiết lập số lượng tối thiểu an toàn (`nguong_canh_bao`). Khi tồn khả dụng xuống dưới ngưỡng, hệ thống tự động gắn nhãn cảnh báo `LOW_STOCK` (Sắp hết hàng) và gửi thông báo lên Dashboard.
- **UC20.4: Xem nhật ký biến động kho kiểm toán (`GET /api/v1/admin/inventory/audit-logs`):**
  - Truy vết sổ cái kiểm toán từ bảng `bien_dong_kho`: Mã món, Loại biến động (`IMPORT`, `ADJUST_IN`, `ADJUST_OUT`, `RESERVE`, `RELEASE`, `DELIVER`, `RETURN`), Số lượng thay đổi, Tồn trước - sau, Người thực hiện và Thời điểm chính xác.

### 11. Phân rã UC21 — Quản Lý Cơ Sở Vật Chất & Sân Thi Đấu:
- **UC21.1: Xem danh sách loại sân và sân thi đấu (`GET /api/v1/admin/courts`, `GET /court-types`):**
  - Quản lý toàn bộ cụm sân của cơ sở (Sân bóng đá cỏ nhân tạo 5/7 người, Sân tennis tiêu chuẩn, Sân cầu lông thảm thi đấu, Sân bóng rổ, Khu vực tiệc BBQ).
- **UC21.2: Thêm mới loại sân & sân thi đấu (`POST /api/v1/admin/court-types`, `POST /courts`):**
  - Tạo mới cụm sân, thiết lập tên sân, loại sân, sức chứa và phân loại mục đích sử dụng (`SPORT` hoặc `EVENT`).
- **UC21.3: Cập nhật thông tin sân & chuyển đổi trạng thái (`PUT /courts/:id`, `PATCH /courts/:id/status`):**
  - Chuyển đổi trạng thái hoạt động:
    * `ACTIVE`: Sẵn sàng kinh doanh.
    * `MAINTENANCE`: Khóa sân để bảo trì mặt cỏ/sàn thảm/hệ thống chiếu sáng, tự động ngăn chặn khách đặt sân trên cả Web và Mobile.
    * `INACTIVE`: Ngừng kinh doanh.
- **UC21.4: Quy hoạch và phân chia sân:**
  - Hỗ trợ đổi phân loại quy hoạch cụm sân linh hoạt theo nhu cầu vận hành thực tế (chuyển đổi giữa sân 7 người và các sân 5 người).

### 12. Phân rã UC22 — Quản Lý Khung Giờ & Bảng Giá Ma Trận:
- **UC22.1: Xem danh mục khung giờ hoạt động (`GET /api/v1/admin/timeslots`):**
  - Bảng danh mục các slot giờ chuẩn (mỗi slot 60 phút, từ 06:00 đến 22:00).
- **UC22.2: Bật / tắt khung giờ hoạt động (`PATCH /api/v1/admin/timeslots/:id/toggle`):**
  - Tạm khóa các khung giờ đặc biệt (nghỉ trưa, bảo dưỡng định kỳ ban ngày).
- **UC22.3: Xem ma trận bảng giá (`GET /api/v1/admin/pricing-matrix/:courtTypeId`):**
  - Hiển thị ma trận giá 2 chiều: Trục dọc là Khung giờ (giờ thường vs giờ cao điểm/vàng); Trục ngang là Loại ngày (Ngày thường `WEEKDAY` từ T2-T6 vs Cuối tuần `WEEKEND` T7-CN).
- **UC22.4: Cập nhật bảng giá hàng loạt (`PUT /api/v1/admin/pricing-matrix/bulk-update`):**
  - Admin điều chỉnh giá linh hoạt theo mùa giải hoặc chính sách kinh doanh; hệ thống cập nhật tự động trong một giao dịch an toàn (`bulk-update`).

### 13. Phân rã UC23 — Quản Lý Danh Mục Dịch Vụ Niêm Yết:
- **UC23.1: Xem danh mục dịch vụ niêm yết (`GET /api/v1/admin/services`):**
  - Danh mục chi tiết các mặt hàng đồ uống (`DRINK`), dụng cụ thuê (`RENTAL`) và combo sự kiện (`PACKAGE`).
- **UC23.2: Thêm mới mặt hàng dịch vụ (`POST /api/v1/admin/services`):**
  - Khởi tạo món mới, chọn phân loại, thiết lập đơn vị tính (chai, lon, cây vợt, đôi giày, bộ), đơn giá niêm yết và số lượng kho ban đầu.
- **UC23.3: Cập nhật thông tin dịch vụ (`PUT /api/v1/admin/services/:id`):**
  - Cập nhật giá bán, mô tả, ảnh minh họa sản phẩm.
- **UC23.4: Bật / tắt trạng thái kinh doanh (`PATCH /api/v1/admin/services/:id/status`):**
  - Đổi trạng thái: `ACTIVE` (đang bán), `OUT_OF_STOCK` (tạm hết), `INACTIVE` (ngừng kinh doanh).

### 14. Phân rã UC24 — Quản Lý Tài Khoản Nhân Viên:
- **UC24.1: Xem danh sách nhân viên cơ sở (`GET /api/v1/admin/staff`):**
  - Bảng danh sách nhân sự quầy: Họ tên, Số điện thoại, Email, Vai trò (`STAFF`), Trạng thái hoạt động, Ngày tạo.
- **UC24.2: Cấp tài khoản nhân viên mới (`POST /api/v1/admin/staff`):**
  - Nhập SĐT, Họ tên, Email và mật khẩu khởi tạo; hệ thống băm mật khẩu chuẩn bcrypt 10 rounds và cấp quyền `STAFF`.
- **UC24.3: Khóa / Mở khóa tài khoản nhân viên (`PATCH /api/v1/admin/staff/:id/status`):**
  - Chuyển trạng thái giữa `ACTIVE` và `LOCKED`. **Ràng buộc an toàn:** Hệ thống kiểm tra và ngăn chặn Admin tự khóa chính tài khoản của mình.
- **UC24.4: Đặt lại mật khẩu nhân viên (`POST /api/v1/admin/staff/:id/reset-password`):**
  - Cấp mật khẩu mới an toàn khi nhân viên quên mật khẩu làm việc.

### 15. Phân rã UC25 — Đóng Đơn Có Công Nợ (Debt Write-off - Đặc Quyền Admin):
- **UC25.1: Tra cứu đơn khách bỏ về có công nợ:**
  - Lọc các đơn đặt sân đã quá giờ kết thúc, khách đã rời cơ sở nhưng chưa thanh toán đủ tiền dịch vụ/mua hộ (`balance > 0`).
- **UC25.2: Xác thực đặc quyền Admin tối cao (BR-33):**
  - `<<include>>` Kiểm tra vai trò `ADMIN`. Nhân viên thường (STAFF) tuyệt đối không có quyền này để chống tiêu cực và thất thoát tiền quỹ.
- **UC25.3: Tự động giải phóng tồn kho dịch vụ đang chờ:**
  - Hủy các yêu cầu dịch vụ đang `REQUESTED` và hoàn trả số lượng đang giữ về kho (`RELEASE`).
- **UC25.4: Đóng đơn ở trạng thái COMPLETED kèm cờ công nợ (`POST /api/v1/admin/bookings/:id/close-with-debt`):**
  - Chuyển trạng thái đơn sang `COMPLETED`, đánh dấu cờ `dong_don_cong_no = 1`, giải phóng slot giờ sân (`dang_khoa = NULL`), ghi rõ lý do vào sổ kiểm toán `nhat_ky_trang_thai_don` để đối soát tài chính cuối tháng.

### 16. Phân rã UC26 — Báo Cáo Tài Chính & Thống Kê Doanh Thu:
- **UC26.1: Báo cáo tổng quan KPI theo khoảng thời gian (`GET /api/v1/admin/reports/overview?from=...&to=...`):**
  - Tổng số đơn, Số đơn hoàn thành, Số đơn hủy, Số đơn vắng mặt (No-show), Tổng doanh thu thực thu, Tổng tiền hoàn trả khách.
- **UC26.2: Báo cáo doanh thu theo chu kỳ (`GET /api/v1/admin/reports/revenue`):**
  - Biểu đồ và bảng số liệu doanh thu theo ngày (`day`) hoặc theo tháng (`month`), bóc tách doanh thu tiền mặt vs chuyển khoản ngân hàng.
- **UC26.3: Báo cáo tỷ lệ sử dụng sân (`GET /api/v1/admin/reports/court-utilization`):**
  - Tần suất lấp đầy của từng sân thi đấu, thống kê các khung giờ cao điểm (giờ vàng từ 17:00 - 20:00) phục vụ chiến lược điều chỉnh giá.
- **UC26.4: Báo cáo phân rã chi tiết 5 thành phần khoản thu (`GET /api/v1/admin/reports/itemized-breakdown`):**
  - Phân tích bóc tách minh bạch cơ cấu doanh thu cơ sở:
    1. Doanh thu tiền thuê sân thi đấu (`court_revenue`).
    2. Doanh thu dịch vụ ăn uống nội bộ (`drink_revenue`).
    3. Doanh thu cho thuê dụng cụ thể thao (`rental_revenue`).
    4. Doanh thu dịch vụ mua hộ ngoại vi & phí phục vụ tiệc BBQ (`procurement_revenue` & `service_fee_revenue`).
    5. Tổng các khoản tiền hoàn trả cho khách hủy đơn (`refund_deduction`).

---

# 47. MA TRẬN ÁNH XẠ USE CASE – CLASS – TABLE – API

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
| Xác nhận khách đến sân | STAFF | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/staff/bookings/:id/check-in` |
| Hoàn thành đơn đặt | STAFF | `DonDat` | `don_dat` | `POST /api/v1/staff/bookings/:id/complete` |
| Đánh dấu No-show | STAFF | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/staff/bookings/:id/no-show` |
| Xác nhận hoàn tiền | STAFF | `ThanhToan` | `thanh_toan`, `don_dat` | `POST /api/v1/staff/payments/:id/confirm-refund` |
| Tra cứu khách hàng | STAFF | `NguoiDung` | `nguoi_dung`, `don_dat` | `GET /api/v1/staff/customers` |
| Đóng đơn có công nợ | ADMIN | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/admin/bookings/:id/close-with-debt` |
| Ghi nhận HĐ mua hộ | STAFF | `HoaDonMuaHo` | `hoa_don_mua_ho`, `don_dat` | `POST /api/v1/staff/procurement-invoices` |
| Cập nhật HĐ mua hộ | STAFF | `HoaDonMuaHo` | `hoa_don_mua_ho`, `don_dat` | `PATCH /api/v1/staff/procurement-invoices/:id/status`|
| Tra cứu giải đấu | PUBLIC/CUST | `SuKien` | `su_kien`, `san` | `GET /api/v1/events` |
| Nhập kho dịch vụ | ADMIN | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho` | `POST /api/v1/admin/inventory/import` |
| Điều chỉnh kho | ADMIN | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho` | `POST /api/v1/admin/inventory/adjust` |
| Cập nhật giá hàng loạt | ADMIN | `GiaKhungGio` | `gia_khung_gio` | `PUT /api/v1/admin/pricing-matrix/bulk-update` |
| Quản lý nhân viên | ADMIN | `NguoiDung` | `nguoi_dung` | `POST/PATCH /api/v1/admin/staff` |
| Xem báo cáo phân rã | ADMIN | `ThanhToan` | `thanh_toan`, `don_dat`, `hoa_don_mua_ho`| `GET /api/v1/admin/reports/itemized-breakdown` |

---


---

# 48. DANH MỤC KỊCH BẢN KIỂM THỬ TỰ ĐỘNG (TEST CASES CATALOG)

Toàn bộ hệ thống được bảo vệ bởi **13 bộ kịch bản kiểm thử tích hợp tự động (Integration Test Suites)** và **1 kịch bản kiểm định toàn diện 11 luồng nghiệp vụ**:
1. `tests/danhmuc.test.ts`: Kiểm thử danh mục công khai (loại sân, sân, khung giờ, bảng giá ma trận).
2. `tests/xacthuc.test.ts`: Kiểm thử đăng ký, đăng nhập, cấp phát JWT, xác thực mật khẩu băm, vô hiệu hóa tài khoản LOCKED.
3. `tests/dondat-concurrency.test.ts`: Kiểm thử đặt sân đồng thời, cơ chế giữ chỗ 30 phút, tranh chấp đặt trùng lịch (Barrier Pattern).
4. `tests/nhanvien-dondat.test.ts`: Kiểm thử đặt sân tại quầy cho khách vãng lai, thu tiền mặt, hoàn thành đơn, đánh dấu NO_SHOW.
5. `tests/dichvu-hoadon.test.ts`: Kiểm thử gọi món ra sân, giao hàng, thu hồi dụng cụ cho thuê, tính toán hóa đơn động, kiểm tra nợ.
6. `tests/bva-rbac.test.ts`: Kiểm thử giá trị biên (BVA) 1-3 slot, biên 14 ngày, biên hủy 6 giờ, phân tích múi giờ UTC+7.
7. `tests/quantri-baocao.test.ts`: Kiểm thử các tính năng Admin: đổi trạng thái sân, cập nhật bảng giá hàng loạt, báo cáo doanh thu, đóng đơn công nợ (Write-off debt).
8. `tests/e2e-flows.test.ts`: Kiểm thử luồng nghiệp vụ đầu cuối (E1 đến E7).
9. `tests/rbac-strict.test.ts`: Kiểm thử ranh giới phân quyền nghiêm ngặt giữa Customer, Staff, Admin; ngăn chặn Staff truy cập Master Data, Price, Staff Management, Debt Write-off, Inventory Admin operations; kiểm tra Admin không thể tự khóa chính mình.
10. `tests/inventory.test.ts`: Kiểm thử toàn diện module tồn kho: khởi tạo tồn kho, ẩn số tồn với khách, Admin nhập kho (IMPORT), điều chỉnh tăng (ADJUST_IN), điều chỉnh giảm (ADJUST_OUT), từ chối xuất quá số lượng khả dụng, cập nhật ngưỡng cảnh báo, kiểm tra trạng thái LOW_STOCK/OUT_OF_STOCK, đặt dịch vụ giữ chỗ (RESERVE), hủy đơn nhả giữ chỗ (RELEASE), giao hàng trừ tồn (DELIVER), trả đồ thuê cộng tồn (RETURN), xem nhật ký biến động kho kiểm toán và **Kiểm thử tranh chấp đồng thời 15 yêu cầu đặt cạnh tranh 10 sản phẩm tồn kho**.
11. `tests/muaho-tiec.test.ts`: Kiểm thử nghiệp vụ quản lý tiệc và hóa đơn mua hộ ngoài theo 2 phương thức (nội bộ và đi chợ ngoài kèm chứng từ E-Invoice/Paper), tính năng tự động cộng dồn hóa đơn động và kiểm soát trạng thái.
12. `tests/hethong-on-dinh.test.ts`: Kiểm định tính ổn định, độ bền và tính toàn vẹn CSDL với 300+ đơn đặt sân, kiểm tra không có bất biến nào bị phá vỡ.
13. `tests/fullstack-sync.test.ts`: Kiểm thử đồng bộ dữ liệu thời gian thực giữa Mobile App (Customer) <-> Cổng Web Nhân viên (Staff) <-> Cổng Web Quản trị (Admin).
14. `scripts/kiemtra-toan-bo-hethong.ts`: Bộ kịch bản độc lập chạy qua 11 luồng nghiệp vụ toàn diện từ đăng ký, phân quyền, đặt sân, tranh chấp barrier, vận hành quầy, dịch vụ, trả đồ, công nợ, mua hộ ngoài, tồn kho, hoàn tiền, báo cáo đến đánh giá sao.

---

# 49. BÁO CÁO KẾT QUẢ KIỂM THỬ THỰC TẾ (AUTOMATED TEST EXECUTION RESULTS)

### 1. Kết quả thực thi toàn bộ 13 Test Suites (Jest):
```
PASS tests/dondat-concurrency.test.ts
PASS tests/e2e-flows.test.ts
PASS tests/inventory.test.ts
PASS tests/fullstack-sync.test.ts
PASS tests/bva-rbac.test.ts
PASS tests/hethong-on-dinh.test.ts
PASS tests/rbac-strict.test.ts
PASS tests/quantri-baocao.test.ts
PASS tests/nhanvien-dondat.test.ts
PASS tests/dichvu-hoadon.test.ts
PASS tests/xacthuc.test.ts
PASS tests/muaho-tiec.test.ts
PASS tests/danhmuc.test.ts

--------------------------------------------------------------------------------
Test Suites: 13 passed, 13 total
Tests:       128 passed, 128 total
Snapshots:   0 total
Time:        9.965 s
Trạng thái:  100% PASS - HOÀN TOÀN KHÔNG CÓ REGRESSION
--------------------------------------------------------------------------------
```

### 2. Kết quả thực thi kịch bản kiểm định 11 luồng nghiệp vụ (`kiemtra-toan-bo-hethong.ts`):
```
=====================================================================
   KẾT QUẢ KIỂM ĐỊNH TOÀN DIỆN 11 LUỒNG NGHIỆP VỤ HỆ THỐNG
=====================================================================
Tổng số bước kiểm thử: 37
Thành công (PASS):     37 (100.0%)
Thất bại (FAIL):       0
Trạng thái:            🎉 TOÀN BỘ 11 LUỒNG NGHIỆP VỤ ĐẠT 100% TIÊU CHUẨN THỰC TẾ!
=====================================================================
```

---

# 50. QUY CHUẨN DI CHUYỂN LƯỢC ĐỒ CSDL (DATABASE MIGRATIONS)

- Quá trình nâng cấp lược đồ CSDL từ 13 bảng lên 15 bảng (`ton_kho_dich_vu`, `bien_dong_kho`) và 17 bảng (`hoa_don_mua_ho`, `su_kien`) được thực hiện theo nguyên tắc an toàn dữ liệu tuyệt đối (Zero Data Loss):
  - Bổ sung bảng 16 (`hoa_don_mua_ho`) có khóa ngoại liên kết với `don_dat(id)` cơ chế `ON DELETE CASCADE` và `nguoi_tao_id` liên kết `nguoi_dung(id)`.
  - Bổ sung bảng 17 (`su_kien`) có khóa ngoại liên kết với `san(id)` cơ chế `ON DELETE SET NULL` để khi xóa sân không ảnh hưởng tới dữ liệu lịch sử sự kiện.
  - Tự động nạp giá trị ban đầu cho các dịch vụ gói tiệc (`PACKAGE`) và các giải đấu mẫu trong `scripts/migrate-sukien.ts`.

---

# 51. CHIẾN LƯỢC KHỞI TẠO DỮ LIỆU MẪU (DATABASE SEEDING)

Hệ thống cung cấp sẵn các kịch bản nạp dữ liệu hoàn chỉnh phục vụ kiểm thử và vận hành thực tế:
- **Tài khoản quản trị (ADMIN):** SĐT `0900000001`, Mật khẩu `admin123456`.
- **Tài khoản nhân viên (STAFF):** SĐT `0900000002` hoặc `0909000001`, Mật khẩu `123456`.
- **Tài khoản khách hàng (CUSTOMER):** SĐT `0911111111` (Khách A), `0922222222` (Khách B), Mật khẩu `123456`.
- **Danh mục Loại sân:** Sân bóng đá mini, Sân cầu lông tiêu chuẩn, Sân tennis, Sân bóng rổ, Khu vực tiệc sự kiện BBQ.
- **Danh mục Sân:** 9 vị trí sân cố định trong cơ sở.
- **Danh mục Khung giờ:** 16 khung giờ tiêu chuẩn cố định từ 06:00 đến 22:00.
- **Danh mục Dịch vụ:** 4 loại nước uống, 4 loại đồ thuê, 4 gói tiệc trọn gói cao cấp.
- **Danh mục Sự kiện:** 4 giải đấu & sự kiện phong trào (Giải Cầu Lông Đôi Nam Nữ, Cúp Tứ Hùng Bóng Đá Mini, Workshop Pickleball Miễn Phí, Đêm Hội BBQ Âm Nhạc).

---

# 52. MA TRẬN TRUY XUẤT NGUỒN GỐC NGHIỆP VỤ TOÀN DIỆN (TRACEABILITY MATRIX)

| Yêu Cầu Nghiệp Vụ (Requirement) | Quy Tắc Chi Phối (BR) | Use Case Liên Quan | Entity Class | Bảng CSDL | API Endpoint Thực Tế | Kịch Bản Test Kiểm Chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Không đặt trùng lịch** | BR-15 | UC-04, UC-05 | `DonDat`, `ChiTietKhungGioDat` | `don_dat`, `chi_tiet_khung_gio_dat` | `POST /api/v1/bookings` | `dondat-concurrency.test.ts` |
| **Giữ chỗ 30 phút** | BR-06, BR-07 | UC-04, UC-07 | `DonDat` | `don_dat` | `Internal Job (quetDonHetHan)` | `dondat-concurrency.test.ts` |
| **Không bán vượt tồn kho (No Oversell)** | BR-35, BR-38 | UC-14 | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho`| `POST /api/v1/bookings/:id/service-orders` | `inventory.test.ts` (15 workers concurrent) |
| **Hoàn trả kho khi hủy yêu cầu** | BR-39 | UC-16 | `TonKhoDichVu` | `ton_kho_dich_vu`, `bien_dong_kho`| `POST .../service-orders/:id/cancel` | `inventory.test.ts` |
| **Hoàn trả kho khi trả đồ thuê** | BR-27, BR-41 | UC-17 | `ChiTietYeuCauDichVu` | `chi_tiet_yeu_cau_dich_vu`, `ton_kho` | `POST /api/v1/staff/service-order-items/:id/return` | `inventory.test.ts` |
| **Phân quyền Staff không quản trị** | BR-18 | UC-20 → UC-29| `NguoiDung` | `nguoi_dung` | `POST /api/v1/admin/*` | `rbac-strict.test.ts` (Staff -> Admin = 403) |
| **Admin không tự khóa mình** | BR-31 | UC-27 | `NguoiDung` | `nguoi_dung` | `PATCH /api/v1/admin/staff/:id/status` | `rbac-strict.test.ts` (ADM-04 -> 409) |
| **Đóng đơn có công nợ an toàn** | BR-30 | UC-24 | `DonDat` | `don_dat`, `nhat_ky_trang_thai_don` | `POST /api/v1/admin/bookings/:id/close-with-debt` | `quantri-baocao.test.ts`, `kiemtra-toan-bo-hethong.ts` |
| **Tính hóa đơn động minh bạch** | BR-24, BR-29 | UC-18 | `ThanhToan`, `DonDat`| `don_dat`, `thanh_toan`, `chi_tiet_yeu_cau` | `GET /api/v1/staff/bookings/:id/invoice` | `dichvu-hoadon.test.ts` |
| **Giới hạn thời gian hủy trước 6h** | BR-09, BR-34 | UC-08 | `DonDat` | `don_dat`, `thanh_toan` | `POST /api/v1/bookings/:id/cancel` | `bva-rbac.test.ts` |
| **Quản lý hóa đơn mua hộ ngoài** | BR-43, BR-44, BR-45 | UC-30 | `HoaDonMuaHo` | `hoa_don_mua_ho`, `don_dat` | `POST /api/v1/staff/procurement-invoices` | `muaho-tiec.test.ts`, `kiemtra-toan-bo-hethong.ts` |
| **Sự kiện & Giải đấu thể thao** | BR-46, BR-50 | UC-31 | `SuKien` | `su_kien`, `san` | `GET /api/v1/events` | `danhmuc.test.ts` |
| **Báo cáo phân rã đa chiều** | BR-47 | UC-32 | `ThanhToan` | `thanh_toan`, `don_dat`, `hoa_don_mua_ho` | `GET /api/v1/admin/reports/itemized-breakdown` | `quantri-baocao.test.ts` |

---

> **KẾT LUẬN & CAM KẾT CHUẨN MỰC:**
> Tệp tài liệu `PROJECT_CONTEXT.md` này đã được đồng bộ hóa và đối chiếu toàn diện 8 lớp:
> **Requirement → Business Rule → Use Case → Class → Database → API → UI → Test → VOPC.**
> Đây là bản tài liệu kỹ thuật hoàn chỉnh và chính xác tuyệt đối ở phiên bản 1.4, sẵn sàng cung cấp ngữ cảnh tiêu chuẩn để sinh toàn bộ sơ đồ phân tích và thiết kế hệ thống (Use Case Tổng Quát, Use Case Phân Rã, Sơ Đồ CSDL ERD 17 bảng, Biểu Đồ Class, Biểu Đồ Tuần Tự và Biểu Đồ VOPC) mà không để lại bất kỳ sự mơ hồ hay giả định nào.
