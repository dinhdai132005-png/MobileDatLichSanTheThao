// =====================================================================
// SCRIPT SỬA LỖI FONT UNICODE (??) CHO DỮ LIỆU CSDL MYSQL
// Chạy: npx ts-node scripts/fix-unicode.ts
// =====================================================================
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixUnicode() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sport_booking',
    charset: 'utf8mb4',
  });

  console.log('🔄 Đang cập nhật bảng court_types...');
  await connection.query('SET NAMES utf8mb4');

  // 1. Cập nhật loại sân
  const loaiSan = [
    { id: 1, name: 'Bóng đá mini 5 người', description: 'Mặt cỏ nhân tạo tiêu chuẩn FIFA, có dàn đèn chiếu sáng ban đêm hiện đại.' },
    { id: 2, name: 'Cầu lông', description: 'Thảm PVC chống trơn trượt chuyên nghiệp, độ nảy chuẩn thi đấu.' },
    { id: 3, name: 'Tennis', description: 'Sân cứng tiêu chuẩn US Open, mặt sân phủ sơn Acrylic cao cấp.' },
    { id: 4, name: 'Pickleball', description: 'Mặt sân đệm giảm chấn thương, hệ thống lưới và đèn đạt chuẩn quốc tế.' },
  ];

  for (const item of loaiSan) {
    await connection.execute(
      'UPDATE court_types SET name = ?, description = ? WHERE id = ?',
      [item.name, item.description, item.id]
    );
  }

  // 2. Cập nhật các sân
  console.log('🔄 Đang cập nhật bảng courts...');
  const danhSachSan = [
    { id: 1, name: 'Sân Bóng 5A', description: 'Sân ngoài trời gần cổng chính, mái che phụ bên lề.' },
    { id: 2, name: 'Sân Bóng 5B', description: 'Sân cạnh khu dịch vụ căng-tin, hệ thống thoát nước ngầm.' },
    { id: 3, name: 'Sân Cầu Lông 1', description: 'Sân số 1 trong nhà thi đấu có máy lạnh.' },
    { id: 4, name: 'Sân Cầu Lông 2', description: 'Sân số 2 thảm chuẩn, khoảng cách biên rộng.' },
    { id: 5, name: 'Sân Cầu Lông 3', description: 'Sân số 3 nhà thi đấu, ánh sáng chống chói.' },
    { id: 6, name: 'Sân Tennis 1', description: 'Sân tennis có khán đài mini, đèn LED 1000W.' },
    { id: 7, name: 'Sân Pickleball 1', description: 'Sân pickleball ngoài trời có mái che nắng.' },
  ];

  for (const item of danhSachSan) {
    await connection.execute(
      'UPDATE courts SET name = ?, description = ? WHERE id = ?',
      [item.name, item.description, item.id]
    );
  }

  // 3. Cập nhật tên người dùng mẫu
  console.log('🔄 Đang cập nhật bảng users...');
  const danhSachUser = [
    { id: 1, full_name: 'Quản Trị Viên Hệ Thống' },
    { id: 2, full_name: 'Nguyễn Văn Nhân Viên' },
    { id: 3, full_name: 'Trần Khách Hàng A' },
    { id: 4, full_name: 'Lê Khách Hàng B' },
  ];

  for (const item of danhSachUser) {
    await connection.execute(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [item.full_name, item.id]
    );
  }

  console.log('✅ Đã sửa thành công 100% lỗi font tiếng Việt (??) trong CSDL MySQL!');
  await connection.end();
}

fixUnicode().catch((err) => {
  console.error('💥 Lỗi khi cập nhật:', err);
  process.exit(1);
});
