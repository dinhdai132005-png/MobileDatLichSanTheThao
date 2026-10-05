// =====================================================================
// JOB QUÉT ĐƠN HẾT HẠN GIỮ CHỖ — plant/03-business-rules.md (BR-07)
// Quét định kỳ mỗi 30 giây, hủy đơn PENDING quá hạn và giải phóng slot
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { csdl } from '../config/csdl';
import { voiGiaoDich } from '../utils/giaodich';
import { ghiNhatKyTrangThai } from '../utils/nhatky';

export async function quetDonHetHan(): Promise<number> {
  try {
    // 1. Tìm các đơn PENDING đã quá hạn
    const [donQuaHan] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ma_don_dat FROM don_dat
       WHERE trang_thai = 'PENDING' AND het_han_luc IS NOT NULL AND het_han_luc < NOW()`
    );

    if (donQuaHan.length === 0) {
      return 0;
    }

    let soDonDaXuLy = 0;

    for (const don of donQuaHan) {
      await voiGiaoDich(async (ketNoi) => {
        // Khóa đơn để kiểm tra lần nữa
        const [rows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, trang_thai FROM don_dat WHERE id = ? FOR UPDATE`,
          [don.id]
        );

        if (rows.length === 0 || rows[0].trang_thai !== 'PENDING') {
          return;
        }

        // Cập nhật trạng thái đơn thành EXPIRED
        await ketNoi.execute(
          `UPDATE don_dat SET trang_thai = 'EXPIRED' WHERE id = ?`,
          [don.id]
        );

        // Mở khóa slot (dang_khoa = NULL)
        await ketNoi.execute(
          `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`,
          [don.id]
        );

        // Ghi nhật ký trạng thái
        await ghiNhatKyTrangThai(ketNoi, {
          donDatId: don.id,
          trangThaiCu: 'PENDING',
          trangThaiMoi: 'EXPIRED',
          ghiChu: 'Hệ thống tự động hủy do hết hạn giữ chỗ (30 phút)',
        });

        soDonDaXuLy++;
      });
    }

    if (soDonDaXuLy > 0) {
      console.log(`[Job Hết Hạn] Đã xử lý ${soDonDaXuLy} đơn đặt hết hạn giữ chỗ.`);
    }

    return soDonDaXuLy;
  } catch (error) {
    console.error('[Job Hết Hạn] Lỗi khi quét đơn hết hạn:', error);
    return 0;
  }
}

let timerJob: NodeJS.Timeout | null = null;

export function khoiDongJobQuetHetHan(khoangCachMs: number = 30000): NodeJS.Timeout {
  if (timerJob) {
    clearInterval(timerJob);
  }

  // Quét ngay lần đầu khi khởi động
  quetDonHetHan();

  // Đặt lịch lặp lại
  timerJob = setInterval(() => {
    quetDonHetHan();
  }, khoangCachMs);

  return timerJob;
}

export function dungJobQuetHetHan(): void {
  if (timerJob) {
    clearInterval(timerJob);
    timerJob = null;
  }
}
