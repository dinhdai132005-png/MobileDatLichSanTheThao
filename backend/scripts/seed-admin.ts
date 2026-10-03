import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const phone = process.env.ADMIN_PHONE || '0900000001';
const rawPassword = process.env.ADMIN_PASSWORD || 'admin123456';
const fullName = 'Quản Trị Viên Hệ Thống';
const email = 'admin@sportbooking.vn';

async function seedAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sport_booking',
  });

  try {
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const sql = `
      INSERT INTO users (full_name, phone, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        password_hash = VALUES(password_hash),
        role = 'ADMIN',
        status = 'ACTIVE';
    `;
    await pool.execute(sql, [fullName, phone, email, passwordHash]);
    console.log(`[SEED ADMIN] Thành công: SĐT=${phone}, Mật khẩu=${rawPassword}`);
  } catch (error) {
    console.error('[SEED ADMIN] Lỗi khi tạo tài khoản Admin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
