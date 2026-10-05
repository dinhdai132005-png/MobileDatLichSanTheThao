// =====================================================================
// TRANSACTION MYSQL2 — AGENT.md mục 7: lấy connection -> BEGIN -> fn -> COMMIT/ROLLBACK
// =====================================================================
import { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/csdl';

export type KetNoi = PoolConnection;

export async function voiGiaoDich<T>(hamXuLy: (ketNoi: KetNoi) => Promise<T>): Promise<T> {
  const ketNoi = await pool.getConnection();
  try {
    await ketNoi.beginTransaction();
    const ketQua = await hamXuLy(ketNoi);
    await ketNoi.commit();
    return ketQua;
  } catch (loi) {
    await ketNoi.rollback();
    throw loi;
  } finally {
    ketNoi.release();
  }
}
