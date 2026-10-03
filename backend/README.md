# 🚀 HƯỚNG DẪN KHỞI ĐỘNG BACKEND

## Yêu cầu tiên quyết
- ✅ Node.js v18+ (bạn đang dùng v24 — OK)
- ✅ XAMPP / Laragon đang chạy, MySQL đã bật
- ✅ Database `dat_lich_san_the_thao` đã tạo trong phpMyAdmin

---

## Bước 1: Tạo Database trong phpMyAdmin

Mở phpMyAdmin → Tạo database mới:
- **Tên**: `dat_lich_san_the_thao`
- **Encoding**: `utf8mb4_unicode_ci`

---

## Bước 2: Cấu hình .env

Kiểm tra file `.env`, đảm bảo `DATABASE_URL` đúng với cài đặt MySQL của bạn:

```env
# Nếu MySQL không có mật khẩu (XAMPP mặc định):
DATABASE_URL="mysql://root:@localhost:3306/dat_lich_san_the_thao"

# Nếu có mật khẩu:
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/dat_lich_san_the_thao"
```

---

## Bước 3: Generate Prisma Client & Migrate DB

```powershell
cd backend

# Generate Prisma types (bắt buộc làm trước)
node node_modules\@prisma\client\dist\cli.js generate
# HOẶC dùng binary trực tiếp:
node node_modules\.bin\prisma-cli generate

# Tạo bảng trong database (migrate)
node node_modules\.bin\prisma-cli migrate dev --name init

# Seed dữ liệu mẫu
npx ts-node prisma/seed.ts
```

---

## Bước 4: Chạy Development Server

```powershell
cd backend
npm run dev
```

Server sẽ chạy tại: **http://localhost:5000**

---

## Kiểm tra hoạt động

Mở Postman hoặc trình duyệt, test endpoint:
```
GET http://localhost:5000/health
→ { "status": "OK", "timestamp": "..." }

GET http://localhost:5000/api/san
→ Danh sách sân từ DB

POST http://localhost:5000/api/auth/login
Body: { "taiKhoan": "admin@gmail.com", "matKhau": "Abc@123456" }
→ { "success": true, "data": { "token": "...", "nguoiDung": {...} } }
```

---

## Cấu trúc thư mục Backend

```
backend/
├── prisma/
│   ├── schema.prisma      ← Cấu trúc Database
│   └── seed.ts            ← Dữ liệu mẫu
├── src/
│   ├── server.ts          ← Entry point
│   ├── app.ts             ← Express app + routes
│   ├── socket.ts          ← Socket.io server
│   ├── lib/
│   │   └── prisma.ts      ← Prisma singleton
│   ├── middleware/
│   │   └── auth.middleware.ts  ← JWT verify + requireRole
│   ├── routes/
│   │   ├── auth.routes.ts      ← POST /register, /login, GET /me
│   │   ├── san.routes.ts       ← GET /san, /san/:id, /san/:id/slots
│   │   ├── donDat.routes.ts    ← POST /don-dat (chống double-booking)
│   │   ├── doUong.routes.ts    ← GET/POST /do-uong
│   │   └── danhGia.routes.ts   ← POST /danh-gia
│   └── utils/
│       └── pricing.ts          ← Tính giá Peak/Off-peak
├── .env                   ← Cấu hình (không commit!)
└── tsconfig.json
```

---

## Tài khoản mẫu (sau khi seed)

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | admin@gmail.com | Abc@123456 |
| Staff | nhanvien@gmail.com | Abc@123456 |
| Customer | khachhang@gmail.com | Abc@123456 |
