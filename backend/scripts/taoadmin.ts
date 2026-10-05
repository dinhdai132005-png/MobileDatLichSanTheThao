// =====================================================================
// SCRIPT TẠO TÀI KHOẢN QUẢN TRỊ VIÊN — Tham chiếu: plant/AGENT.md mục 12
// Đọc ADMIN_PHONE, ADMIN_PASSWORD từ .env, băm bcrypt rồi ghi vào nguoi_dung
// =====================================================================
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const soDienThoai = process.env.ADMIN_PHONE || '0900000001';
const matKhauTho = process.env.ADMIN_PASSWORD || 'admin123456';
const hoTen = 'Quản Trị Viên Hệ Thống';
const email = 'admin@sportbooking.vn';

async function taoAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sport_booking',
  });

  try {
    const matKhauHash = await bcrypt.hash(matKhauTho, 10);
    const sql = `
      INSERT INTO nguoi_dung (id, ho_ten, so_dien_thoai, email, mat_khau_hash, vai_tro, trang_thai)
      VALUES (1, ?, ?, ?, ?, 'ADMIN', 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        ho_ten = VALUES(ho_ten),
        mat_khau_hash = VALUES(mat_khau_hash),
        vai_tro = 'ADMIN',
        trang_thai = 'ACTIVE';
    `;
    await pool.execute(sql, [hoTen, soDienThoai, email, matKhauHash]);
    console.log(`✅ [Tạo Admin] Thành công: SĐT=${soDienThoai}, Mật khẩu=${matKhauTho}`);
  } catch (loi) {
    console.error('❌ [Tạo Admin] Lỗi:', loi);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

taoAdmin();
