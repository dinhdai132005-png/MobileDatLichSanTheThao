// =====================================================================
// JOB HẾT HẠN GIỮ CHỖ (SYS-01) — Tham chiếu: Plant/01-database.md mục 7.2 & BR-07
// Quét định kỳ các đơn PENDING quá expires_at, chuyển sang EXPIRED và nhả slot
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { BUSINESS } from '../config/business';
import { withTransaction } from '../utils/transaction';

let intervalTimer: NodeJS.Timeout | null = null;

export async function processExpiredBookings(): Promise<number> {
  return withTransaction(async (conn) => {
    // 1. Khóa và lấy các đơn PENDING đã quá hạn
    const [danhSachDonQuaHan] = await conn.execute<RowDataPacket[]>(
      `SELECT id FROM bookings WHERE status = 'PENDING' AND expires_at < NOW() FOR UPDATE`
    );

    if (danhSachDonQuaHan.length === 0) {
      return 0;
    }

    const danhSachDonDatId = danhSachDonQuaHan.map((dong) => dong.id);
    const chuoiHoiCham = danhSachDonDatId.map(() => '?').join(',');

    // 2. Chuyển trạng thái đơn sang EXPIRED
    await conn.execute(
      `UPDATE bookings SET status = 'EXPIRED', cancelled_at = NOW() WHERE id IN (${chuoiHoiCham})`,
      danhSachDonDatId
    );

    // 3. Nhả slot bằng cách set is_locked = NULL (BR-04: NULL không vi phạm UNIQUE uq_slot_active)
    await conn.execute(
      `UPDATE booking_slots SET is_locked = NULL WHERE booking_id IN (${chuoiHoiCham})`,
      danhSachDonDatId
    );

    // 4. Ghi nhật ký booking_status_logs
    for (const donDatId of danhSachDonDatId) {
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, 'PENDING', 'EXPIRED', NULL, 'Hệ thống tự động hủy do hết hạn giữ chỗ (30 phút)')`,
        [donDatId]
      );
    }

    console.log(`⏱ [SYS-01] Đã tự động hết hạn và nhả slot cho ${danhSachDonDatId.length} đơn đặt: [${danhSachDonDatId.join(', ')}]`);
    return danhSachDonDatId.length;
  });
}

export function startExpireBookingsJob(): void {
  if (intervalTimer) return;
  intervalTimer = setInterval(async () => {
    try {
      await processExpiredBookings();
    } catch (err) {
      console.error('💥 [JOB SYS-01 ERROR] Lỗi khi xử lý đơn hết hạn:', err);
    }
  }, BUSINESS.EXPIRE_JOB_INTERVAL_MS);

  console.log(`🚀 [Job] Khởi động job hết hạn giữ chỗ (Chu kỳ: ${BUSINESS.EXPIRE_JOB_INTERVAL_MS / 1000}s)`);
}

export function stopExpireBookingsJob(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}
