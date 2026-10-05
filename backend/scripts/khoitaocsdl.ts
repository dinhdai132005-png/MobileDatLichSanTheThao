// =====================================================================
// SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU — Thực thi schema.sql và seed.sql
// =====================================================================
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CAU_HINH = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function khoiTao() {
  console.log('⏳ [Khởi tạo CSDL] Đang kết nối MySQL...');
  const ketNoi = await mysql.createConnection(CAU_HINH);

  try {
    const duongDanSchema = path.resolve(__dirname, '../../database/schema.sql');
    const duongDanSeed = path.resolve(__dirname, '../../database/seed.sql');

    console.log('📜 [Khởi tạo CSDL] Đang nạp schema.sql (13 bảng tiếng Việt không dấu)...');
    const noiDungSchema = fs.readFileSync(duongDanSchema, 'utf8');
    await ketNoi.query(noiDungSchema);
    console.log('✅ [Khởi tạo CSDL] Đã tạo 13 bảng thành công!');

    console.log('🌱 [Khởi tạo CSDL] Đang nạp dữ liệu mẫu seed.sql...');
    const noiDungSeed = fs.readFileSync(duongDanSeed, 'utf8');
    await ketNoi.query(noiDungSeed);
    console.log('✅ [Khởi tạo CSDL] Đã nạp dữ liệu mẫu thành công!');
  } catch (loi) {
    console.error('❌ [Khởi tạo CSDL] Thất bại:', loi);
    process.exit(1);
  } finally {
    await ketNoi.end();
  }
}

khoiTao();
