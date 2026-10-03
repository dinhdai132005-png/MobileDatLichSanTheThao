// =====================================================================
// HELPER TRANSACTION MYSQL2 — Tham chiếu: Plant/AGENT.md mục 7
// =====================================================================
import { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/db';

export async function withTransaction<T>(
  hamXuLy: (ketNoi: PoolConnection) => Promise<T>
): Promise<T> {
  const ketNoi = await pool.getConnection();
  await ketNoi.beginTransaction();

  try {
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
