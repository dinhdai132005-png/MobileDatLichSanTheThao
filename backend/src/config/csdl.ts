// =====================================================================
// POOL MYSQL2 — plant/07-architecture.md mục 3.1
// dateStrings: true  -> DATE/TIME/DATETIME trả về chuỗi (tránh lệch múi giờ)
// timezone '+07:00'  -> giờ Việt Nam (BR-20)
// Mỗi connection mới đều SET time_zone để NOW() trong SQL cũng theo +07:00.
// =====================================================================
import mysql from 'mysql2/promise';
import { MOI_TRUONG } from './moitruong';

export const pool = mysql.createPool({
  host: MOI_TRUONG.DB_HOST,
  port: MOI_TRUONG.DB_PORT,
  user: MOI_TRUONG.DB_USER,
  password: MOI_TRUONG.DB_PASSWORD,
  database: MOI_TRUONG.DB_NAME,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true,
  timezone: '+07:00',
  charset: 'utf8mb4',
});

export const csdl = pool;

pool.on('connection', (ketNoi) => {
  ketNoi.query("SET time_zone = '+07:00'");
});

/** Kiểm tra kết nối khi khởi động; ném lỗi nếu không kết nối được. */
export async function kiemTraKetNoiCsdl(): Promise<void> {
  const ketNoi = await pool.getConnection();
  try {
    await ketNoi.query('SELECT 1');
  } finally {
    ketNoi.release();
  }
}
