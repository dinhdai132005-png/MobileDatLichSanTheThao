// =====================================================================
// CẤU HÌNH DATABASE POOL MYSQL2 — Tham chiếu: Plant/07-architecture.md mục 3.1 & AGENT.md mục 7
// dateStrings: true (trả DATE/TIME/DATETIME dạng chuỗi tránh lệch múi giờ)
// timezone: '+07:00' (giờ Việt Nam)
// =====================================================================
import mysql from 'mysql2/promise';
import { ENV } from './env';

export const pool = mysql.createPool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true,
  timezone: '+07:00',
});

// Kiểm tra kết nối khi khởi động
export async function testDbConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
    console.log(`✅ [Database] Kết nối MySQL thành công tới database '${ENV.DB_NAME}' (Port ${ENV.DB_PORT})`);
  } finally {
    connection.release();
  }
}
