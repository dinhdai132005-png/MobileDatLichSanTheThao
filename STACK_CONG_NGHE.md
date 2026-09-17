# 🚀 CHI TIẾT STACK CÔNG NGHỆ & TÀI NGUYÊN THAM KHẢO
## HỆ THỐNG ĐẶT MÓN & QUẢN LÝ NHÀ HÀNG FAST FOOD "CRISPY BITE" (QSR)

> **Mục đích tài liệu**: Định nghĩa chi tiết toàn bộ kiến trúc công nghệ (Tech Stack), danh sách thư viện vi mô đề xuất kèm lý do kỹ thuật, và liên kết đối chiếu với các kho mã nguồn mở (GitHub Repositories) có nhiều Stars nhất để học hỏi kiến trúc, mẫu thiết kế (Design Patterns) và chuẩn thực chiến.  
> **Phiên bản**: 1.0  
> **Ngày cập nhật**: 2026-08-28.

---

## 🏗️ 1. TỔNG QUAN KIẾN TRÚC TOÀN HỆ THỐNG (FULL-STACK MONOREPO)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   CLIENT: REACT NATIVE (EXPO SDK 54 + TYPESCRIPT)                │
│  - Chạy đồng thời: Web Dashboard (Thu ngân/Quản lý) + Mobile App (Expo Go QR)    │
│  - UI: POS Thu ngân, KDS Bếp (Dark Mode), Sơ đồ 12 bàn, Dashboard Báo cáo        │
│  - State & Network: React Context + Axios HTTP + Socket.io Client Real-time      │
└─────────────────────────────────────────▲────────────────────────────────────────┘
                                          │ REST API (JSON) + WebSocket (Socket.io)
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                   SERVER: NODE.JS + EXPRESS.JS + TYPESCRIPT                      │
│  - Validation: Zod Schema (Validate nested modifier, DTO, params)                │
│  - Real-time Gateway: Socket.io Server (Room "restaurant:kds")                   │
│  - Security: JWT Token, bcrypt password hash, Idempotency key                    │
│  - Data Layer: Prisma ORM (Type-safe models, Atomic transactions)                │
└─────────────────────────────────────────▲────────────────────────────────────────┘
                                          │ Prisma Client Driver
┌─────────────────────────────────────────▼────────────────────────────────────────┐
│                   DATABASE: MYSQL 8.4 (ISOLATED DEV & TEST)                      │
│  - crispy_bite_dev: Dữ liệu phát triển và chạy thử ứng dụng                      │
│  - crispy_bite_test: Dữ liệu cô lập chạy bộ test tự động (Tránh xóa nhầm dev)   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 2. TẦNG FRONTEND (MOBILE & WEB DASHBOARD)

### 2.1. Cốt lõi (Core Stack)
* **React Native (Expo SDK 54)**: Hỗ trợ triển khai đa nền tảng một lần viết chạy cả Web Browser (cho máy thu ngân quầy) lẫn Điện thoại (cho quản lý đi lại trong quán kiểm tra bàn ăn qua Expo Go).
* **TypeScript (Strict Mode)**: Đảm bảo tính an toàn kiểu dữ liệu end-to-end, đồng bộ DTO với Backend.
* **React Navigation v7**: Điều hướng mượt mà với Bottom Tabs (Menu, Bàn, KDS, Báo cáo) và Native Stack (Chi tiết đơn, Hóa đơn).

### 2.2. Danh mục thư viện đề xuất (Recommended Libraries)
| Tên Thư Viện | Phiên bản | Vai trò & Mục đích nghiệp vụ | Lý do kỹ thuật & Lợi ích |
| :--- | :---: | :--- | :--- |
| **`@expo/vector-icons`** | Có sẵn trong Expo | Bộ icon công thái học F&B cho POS/KDS | Cung cấp đầy đủ icon: Giỏ hàng 🛒, Thẻ rung Buzzer 📟, Bàn ăn 🍽️, Xóa món 🗑️, Bếp nấu 🍳 mà không làm tăng kích thước bundle. |
| **`expo-print`** & **`expo-sharing`** | SDK 54 | Xuất hóa đơn điện tử ra file PDF | Cho phép render mẫu HTML hóa đơn ra file PDF sắc nét, mở hộp thoại in hoặc chia sẻ trực tiếp trên cả Mobile và Web mà không cần máy in nhiệt vật lý. |
| **`react-native-qrcode-svg`** | Mới nhất | Hiển thị mã QR thanh toán động | Tạo mã VietQR/QR chuyển khoản ngân hàng ngay trên màn hình POS khi thu ngân chọn hình thức "Quét mã QR". |
| **`axios`** | ^1.7.0 | Gọi REST API xuống Backend | Hỗ trợ Interceptor tự động gắn Header Authorization (JWT Token), cấu hình timeout và xử lý lỗi mạng tập trung. |
| **`socket.io-client`** | ^4.8.0 | Nhận sự kiện thời gian thực từ Bếp | Kết nối hai chiều với server, tự động kết nối lại (Auto-Reconnect) khi mạng chập chờn. |
| **`expo-av`** | SDK 54 | Âm thanh thông báo KDS ("Ting!") | Phát tiếng chuông thông báo khi có đơn mới từ POS bắn xuống bếp, giúp đầu bếp không bị bỏ sót đơn hàng. |

### 2.3. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[shadcn-ui/ui](https://github.com/shadcn-ui/ui)** (⭐ **80.0k+ Stars**):
  - *Học hỏi*: **Tiêu chuẩn kiến trúc component Frontend hiện đại nhất** — Triết lý Copy-paste Primitives trực tiếp vào `src/components/ui/`, hệ thống Design Tokens (Theme Variables: `primary`, `secondary`, `card`, `destructive`), mô hình Variant Pattern cho Button/Badge/Dialog, và khả năng tùy biến 100% không dính vendor lock-in.
* **[expo/expo](https://github.com/expo/expo)** (⭐ **33.0k+ Stars**):
  - *Học hỏi*: Chuẩn cấu hình Expo SDK 54, cách build đa nền tảng Web/Mobile, sử dụng `expo-print` và API quản lý asset.
* **[react-navigation/react-navigation](https://github.com/react-navigation/react-navigation)** (⭐ **23.5k+ Stars**):
  - *Học hỏi*: Pattern phân chia Navigation giữa màn hình Public (Login) và Protected (Tabs theo Role Cashier/Kitchen/Admin).
* **[software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated)** (⭐ **8.7k+ Stars**):
  - *Học hỏi*: Hiệu ứng thẻ đơn mới trượt vào KDS, hiệu ứng nhấp nháy đỏ khi đơn hàng bị trễ quá 5 phút.
* **[alexeyten/react-native-qrcode-svg](https://github.com/alexeyten/react-native-qrcode-svg)** (⭐ **1.5k+ Stars**):
  - *Học hỏi*: Cách nhúng logo thương hiệu Crispy Bite vào giữa mã QR thanh toán.

---

## 🖥️ 3. TẦNG BACKEND (REST API & REAL-TIME GATEWAY)

### 3.1. Cốt lõi (Core Stack)
* **Node.js (v24.19.0 - LTS)**: Khóa chặt phiên bản qua `.nvmrc` để bảo đảm tính tương thích tuyệt đối.
* **Express.js (TypeScript)**: Framework REST API gọn nhẹ, dễ kiểm soát luồng Middleware và tốc độ phản hồi cực nhanh.
* **Prisma ORM (v6+)**: ORM thế hệ mới với Type-safety 100%, hỗ trợ Migration tự động và Atomic Database Transactions.
* **Socket.io (v4+)**: Real-time Engine cho luồng liên thông quầy - bếp với độ trễ dưới 200ms.

### 3.2. Danh mục thư viện đề xuất (Recommended Libraries)
| Tên Thư Viện | Phiên bản | Vai trò & Mục đích nghiệp vụ | Lý do kỹ thuật & Lợi ích |
| :--- | :---: | :--- | :--- |
| **`zod`** | ^3.23.0 | Xác thực dữ liệu đầu vào (Validation) | Xác thực cấu trúc mảng Modifier lồng nhau phức tạp của món ăn, kiểm tra kiểu dữ liệu trước khi chạm vào Database. |
| **`jsonwebtoken`** | ^9.0.0 | Cấp và xác thực mã JWT Token | Mã hóa thông tin đăng nhập và phân quyền 3 Role (`CASHIER`, `KITCHEN`, `ADMIN`). |
| **`bcrypt`** | ^5.1.0 | Băm mật khẩu người dùng | Đảm bảo an toàn thông tin tài khoản, không lưu mật khẩu dạng plain text trong DB. |
| **`dotenv`** | ^16.4.0 | Quản lý biến môi trường | Đọc cấu hình `DATABASE_URL`, `JWT_SECRET`, `PORT` từ file `.env` một cách an toàn. |
| **`cors`** | ^2.8.5 | Cấu hình bảo mật Cross-Origin | Cho phép Frontend (Web/Mobile) kết nối an toàn vào Backend API. |

### 3.3. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)** (⭐ **103.0k+ Stars**):
  - *Học hỏi*: "Kinh thánh" kiến trúc Node.js — Cấu trúc thư mục 3 tầng (Routes $\rightarrow$ Controllers $\rightarrow$ Services), middleware xử lý lỗi tập trung và xử lý async/await an toàn.
* **[socketio/socket.io](https://github.com/socketio/socket.io)** (⭐ **61.5k+ Stars**):
  - *Học hỏi*: Mô hình quản lý Room (`restaurant:kds`), cơ chế phát thông điệp (`emit`), và bắt sự kiện ngắt kết nối an toàn.
* **[colinhacks/zod](https://github.com/colinhacks/zod)** (⭐ **35.5k+ Stars**):
  - *Học hỏi*: Pattern validate Express Request Body bằng Zod middleware không làm gián đoạn luồng code.
* **[prisma/prisma-examples](https://github.com/prisma/prisma-examples)** (⭐ **5.6k+ Stars**):
  - *Học hỏi*: Mẫu code chuẩn kết hợp Express + TypeScript + Prisma, script seed dữ liệu mẫu và quan hệ 1-N / N-N phức tạp.

---

## 🗄️ 4. TẦNG CƠ SỞ DỮ LIỆU (DATABASE LAYER)

### 4.1. Cốt lõi (Core Stack)
* **MySQL 8.4 LTS**: Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) chuẩn doanh nghiệp, toàn vẹn dữ liệu với khóa ngoại (Foreign Keys) và hỗ trợ lưu trường JSON (`selectedModifiers`).
* **Mô hình Phân lập Cơ sở dữ liệu (Database Isolation)**:
  - `crispy_bite_dev`: Chạy ứng dụng phục vụ demo và nhập liệu thực tế.
  - `crispy_bite_test`: Dành riêng cho test suite chạy lệnh xóa/tạo lại tự động, loại bỏ 100% rủi ro mất dữ liệu phát triển.

### 4.2. Thiết kế Tiền tệ & Nghiệp vụ Số
* **Tiền tệ VND**: Toàn bộ giá món (`price`), phụ thu modifier (`priceAdjustment`), tạm tính (`subtotal`), thuế (`vatAmount`) và tổng tiền (`totalAmount`) được lưu bằng kiểu số nguyên **`Int`**, tuyệt đối không dùng `Float` hay `Double` để tránh lỗi sai lệch dấu phẩy động khi tính toán kế toán.

---

## 🧪 5. TẦNG KIỂM THỬ (TESTING & VERIFICATION)

### 5.1. Cốt lõi (Core Stack)
* **Vitest**: Test runner siêu tốc cho Backend TypeScript, tương thích 100% cú pháp Jest nhưng chạy nhanh gấp 5 lần nhờ Vite engine.
* **Supertest**: Kiểm thử các HTTP Endpoints (GET, POST, PATCH) của Express mà không cần khởi động server vật lý.
* **Playwright (`webapp-testing`)**: Kiểm thử tự động luồng giao diện Web E2E (Đặt món ở POS $\rightarrow$ Bếp nổ đơn ở KDS).

### 5.2. Kho mã nguồn GitHub tham khảo (Top-Starred Repositories)
* **[vitest-dev/vitest](https://github.com/vitest-dev/vitest)** (⭐ **14.2k+ Stars**):
  - *Học hỏi*: Cấu hình test TypeScript monorepo, mocking module và đo lường code coverage.
* **[microsoft/playwright](https://github.com/microsoft/playwright)** (⭐ **70.5k+ Stars**):
  - *Học hỏi*: Tự động hóa kiểm thử tương tác người dùng, chụp ảnh màn hình so sánh visual regression.
* **[ladjs/supertest](https://github.com/ladjs/supertest)** (⭐ **14.1k+ Stars**):
  - *Học hỏi*: Pattern test API xác thực JWT và kiểm thử phản hồi mã lỗi HTTP 400/401/403/404.

---

## 🏬 6. CÁC DỰ ÁN MẪU VỀ POS & F&B THỰC TẾ TRÊN GITHUB

Để nghiên cứu sâu về nghiệp vụ bán hàng nhà hàng (Point of Sale & Kitchen Workflow), các repo sau là nguồn tham khảo mẫu thiết kế hàng đầu:

1. **[odoo/odoo (Module Point of Sale)](https://github.com/odoo/odoo)** (⭐ **36.5k+ Stars**):
   - *Điểm học hỏi*: Mẫu thiết kế giỏ hàng POS chuyên nghiệp, xử lý phiên làm việc của thu ngân, logic tính tiền thối lại (Cash Change), và sơ đồ bàn ăn trực quan.
2. **[invoiceninja/invoiceninja](https://github.com/invoiceninja/invoiceninja)** (⭐ **8.2k+ Stars**):
   - *Điểm học hỏi*: Tiêu chuẩn tạo và xuất mẫu hóa đơn thanh toán chuẩn mực, tính thuế VAT minh bạch và bố cục in ấn sắc nét.

---

## 📋 7. TỔNG KẾT BẢNG GÓI PHỤ THUỘC ĐỒNG BỘ (PACKAGE SYNC)

```json
{
  "workspaces": ["backend", "frontend"],
  "core_backend": [
    "express", "typescript", "@prisma/client", "socket.io",
    "zod", "jsonwebtoken", "bcrypt", "cors", "dotenv"
  ],
  "dev_backend": [
    "prisma", "vitest", "supertest", "tsx", "@types/express", "@types/node"
  ],
  "core_frontend": [
    "expo", "react-native", "react-navigation", "axios",
    "socket.io-client", "expo-print", "expo-sharing", "react-native-qrcode-svg"
  ],
  "dev_frontend": [
    "jest", "@testing-library/react-native", "typescript"
  ]
}
```

*Tài liệu này được lưu trữ nội bộ để làm cẩm nang đối soát kỹ thuật xuyên suốt các Milestone từ M0 đến M8.*
