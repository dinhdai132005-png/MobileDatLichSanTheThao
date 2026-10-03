// =====================================================================
// JOB HẾT HẠN GIỮ CHỖ (SYS-01) — Tham chiếu: Plant/01-database.md mục 7.2 & BR-07
// Quét định kỳ các đơn PENDING quá expires_at, chuyển sang EXPIRED và nhả slot
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { BUSINESS } from '../config/business';
import { withTransaction } from '../utils/transaction';
import { broadcastSlotUpdate } from '../socket';

let intervalTimer: NodeJS.Timeout | null = null;

export async function processExpiredBookings(): Promise<number> {
  let danhSachKhungNha: { sanId: number; gioBatDau: string; ngayDat: string }[] = [];

  const soLuong = await withTransaction(async (conn) => {
    // 1. Khóa và lấy các đơn PENDING đã quá hạn
    const [danhSachDonQuaHan] = await conn.execute<RowDataPacket[]>(
      `SELECT id FROM bookings WHERE status = 'PENDING' AND expires_at < NOW() FOR UPDATE`
    );

    if (danhSachDonQuaHan.length === 0) {
      return 0;
    }

    const danhSachDonDatId = danhSachDonQuaHan.map((dong) => dong.id);
    const chuoiHoiCham = danhSachDonDatId.map(() => '?').join(',');

    // Lấy thông tin các khung giờ sắp được nhả để bắn socket realtime
    const [dsKhung] = await conn.execute<RowDataPacket[]>(
      `SELECT bs.court_id AS sanId, ts.start_time AS gioBatDau, bs.slot_date AS ngayDat
       FROM booking_slots bs
       JOIN time_slots ts ON ts.id = bs.time_slot_id
       WHERE bs.booking_id IN (${chuoiHoiCham})`,
      danhSachDonDatId
    );
    danhSachKhungNha = dsKhung.map((k) => ({
      sanId: k.sanId,
      gioBatDau: (k.gioBatDau as string).substring(0, 5),
      ngayDat: k.ngayDat,
    }));

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

  // Bắn socket nhả slot ra ngoài transaction
  if (danhSachKhungNha.length > 0) {
    try {
      for (const khung of danhSachKhungNha) {
        broadcastSlotUpdate(khung.sanId, khung.gioBatDau, true, khung.ngayDat);
      }
    } catch (e) {
      // Bỏ qua lỗi socket
    }
  }

  return soLuong;
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
