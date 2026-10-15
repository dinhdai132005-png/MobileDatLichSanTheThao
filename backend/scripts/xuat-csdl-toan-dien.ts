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
  database: process.env.DB_NAME || 'sport_booking',
};

// Danh sách 17 bảng theo thứ tự quan hệ phụ thuộc khóa ngoại
const DANH_SACH_BANG = [
  'nguoi_dung',
  'loai_san',
  'san',
  'khung_gio',
  'gia_khung_gio',
  'don_dat',
  'chi_tiet_khung_gio_dat',
  'thanh_toan',
  'nhat_ky_trang_thai_don',
  'danh_gia',
  'dich_vu',
  'yeu_cau_dich_vu',
  'chi_tiet_yeu_cau_dich_vu',
  'ton_kho_dich_vu',
  'bien_dong_kho',
  'hoa_don_mua_ho',
  'su_kien',
];

function escapeGiaTri(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'number') {
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (val instanceof Date) {
    // Format YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const nam = val.getFullYear();
    const thang = pad(val.getMonth() + 1);
    const ngay = pad(val.getDate());
    const gio = pad(val.getHours());
    const phut = pad(val.getMinutes());
    const giay = pad(val.getSeconds());
    return `'${nam}-${thang}-${ngay} ${gio}:${phut}:${giay}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  // Chuỗi: escape dấu nháy đơn và backslash
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\0/g, '\\0');
  return `'${str}'`;
}

async function xuatCSDL() {
  console.log('⏳ Đang kết nối CSDL MySQL...');
  const ketNoi = await mysql.createConnection(CAU_HINH);

  try {
    const lines: string[] = [];

    // Header thông tin
    lines.push('-- =====================================================================');
    lines.push('-- HỆ THỐNG QUẢN LÝ VÀ ĐẶT LỊCH SÂN THỂ THAO 24/7 (sport_booking)');
    lines.push('-- FILE KHỞI TẠO CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (ALL-IN-ONE SQL SCRIPT)');
    lines.push('-- Bao gồm: Tạo CSDL, Cấu trúc 17 bảng hoàn chỉnh và toàn bộ dữ liệu thực tế');
    lines.push('-- Thời gian xuất: ' + new Date().toLocaleString('vi-VN'));
    lines.push('-- =====================================================================');
    lines.push('-- HƯỚNG DẪN SỬ DỤNG:');
    lines.push('-- 1. Mở file này trong MySQL Workbench, Navicat, HeidiSQL hoặc phpMyAdmin.');
    lines.push('-- 2. Bấm nút Execute (hoặc phím tắt F5 / Ctrl+Enter) để thực thi toàn bộ script.');
    lines.push('-- 3. Hệ thống sẽ tự động tạo database `sport_booking`, cấu trúc 17 bảng và');
    lines.push('--    chèn toàn bộ dữ liệu mẫu & dữ liệu vận hành.');
    lines.push('--');
    lines.push('-- TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH:');
    lines.push('--   + QUẢN TRỊ VIÊN (ADMIN):  SĐT: 0900000001 | Mật khẩu: admin123456');
    lines.push('--   + NHÂN VIÊN (STAFF):      SĐT: 0900000002 | Mật khẩu: 123456');
    lines.push('--   + KHÁCH HÀNG (CUSTOMER):  SĐT: 0911111111 | Mật khẩu: 123456');
    lines.push('-- =====================================================================\n');

    lines.push('/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;');
    lines.push('/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;');
    lines.push('/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;');
    lines.push('/*!50503 SET NAMES utf8mb4 */;');
    lines.push('/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;');
    lines.push("/*!40103 SET TIME_ZONE='+07:00' */;");
    lines.push('/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;');
    lines.push('/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;');
    lines.push("/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;\n");

    lines.push('-- ---------------------------------------------------------------------');
    lines.push('-- 1. KHỞI TẠO CƠ SỞ DỮ LIỆU `sport_booking`');
    lines.push('-- ---------------------------------------------------------------------');
    lines.push('CREATE DATABASE IF NOT EXISTS `sport_booking`');
    lines.push('  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    lines.push('USE `sport_booking`;\n');

    lines.push('SET FOREIGN_KEY_CHECKS = 0;\n');

    // Đọc cấu trúc bảng từ database
    for (let i = 0; i < DANH_SACH_BANG.length; i++) {
      const tenBang = DANH_SACH_BANG[i];
      console.log(`📦 Đang trích xuất cấu trúc và dữ liệu bảng [${i + 1}/17]: ${tenBang}...`);

      lines.push('-- ---------------------------------------------------------------------');
      lines.push(`-- Bảng ${i + 1}/17: \`${tenBang}\``);
      lines.push('-- ---------------------------------------------------------------------');
      lines.push(`DROP TABLE IF EXISTS \`${tenBang}\`;`);

      const [showCreateRows]: any = await ketNoi.query(`SHOW CREATE TABLE \`${tenBang}\``);
      const createTableSql: string = showCreateRows[0]['Create Table'];
      lines.push(createTableSql + ';\n');

      // Trích xuất dữ liệu
      const [dataRows]: any = await ketNoi.query(`SELECT * FROM \`${tenBang}\``);
      if (dataRows.length > 0) {
        lines.push(`-- Dữ liệu bảng \`${tenBang}\` (${dataRows.length} bản ghi)`);
        
        // Lấy danh sách cột
        const cotList = Object.keys(dataRows[0]).map(c => `\`${c}\``).join(', ');
        
        // Chia nhỏ batch 50 bản ghi mỗi câu lệnh INSERT
        const batchSize = 50;
        for (let b = 0; b < dataRows.length; b += batchSize) {
          const chunk = dataRows.slice(b, b + batchSize);
          const valuesSql = chunk.map((r: any) => {
            const vals = Object.values(r).map(v => escapeGiaTri(v));
            return `(${vals.join(', ')})`;
          }).join(',\n');

          lines.push(`INSERT INTO \`${tenBang}\` (${cotList}) VALUES\n${valuesSql};`);
        }
        lines.push('');
      } else {
        lines.push(`-- Bảng \`${tenBang}\` hiện chưa có dữ liệu\n`);
      }
    }

    lines.push('-- ---------------------------------------------------------------------');
    lines.push('-- HOÀN TẤT VÀ KHÔI PHỤC CÁC RÀNG BUỘC KIỂM TRA');
    lines.push('-- ---------------------------------------------------------------------');
    lines.push('SET FOREIGN_KEY_CHECKS = 1;');
    lines.push('/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;');
    lines.push('/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;');
    lines.push('/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;');
    lines.push('/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;');
    lines.push('/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;');
    lines.push('/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;');
    lines.push('/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;\n');

    lines.push("SELECT 'Cơ sở dữ liệu sport_booking đã được nạp thành công với đầy đủ 17 bảng và dữ liệu!' AS KetQua;\n");

    const fullSql = lines.join('\n');

    const pathFull = path.resolve(__dirname, '../../database/sport_booking_full.sql');
    const pathDump = path.resolve(__dirname, '../../database/sport_booking_dump.sql');

    fs.writeFileSync(pathFull, fullSql, 'utf8');
    fs.writeFileSync(pathDump, fullSql, 'utf8');

    console.log(`\n🎉 XUẤT THÀNH CÔNG!`);
    console.log(`📁 File 1: ${pathFull} (${(fullSql.length / 1024).toFixed(1)} KB)`);
    console.log(`📁 File 2: ${pathDump} (${(fullSql.length / 1024).toFixed(1)} KB)`);

  } catch (loi) {
    console.error('❌ Lỗi khi xuất CSDL:', loi);
  } finally {
    await ketNoi.end();
  }
}

xuatCSDL();
