// =====================================================================
// DỊCH VỤ DANH MỤC CÔNG KHAI (CATALOG SERVICE) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.1 & CUS-04, CUS-05
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { ENV } from '../config/env';
import { BUSINESS } from '../config/business';
import { ApiError } from '../utils/errors';

export class CatalogService {
  /**
   * CUS-04: Lấy danh sách loại sân đang hoạt động
   */
  static async getCourtTypes() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name AS tenLoaiSan, description AS moTa FROM court_types WHERE is_active = 1 ORDER BY id'
    );
    return danhSach;
  }

  /**
   * CUS-04: Lấy danh sách sân đang hoạt động (có thể lọc theo loaiSanId)
   */
  static async getCourts(loaiSanId?: number) {
    let cauTruyVan = `
      SELECT c.id, c.court_type_id AS loaiSanId, ct.name AS tenLoaiSan,
             c.name AS tenSan, c.description AS moTa, c.image_url AS anhUrl, c.status AS trangThai,
             (SELECT MIN(sp.price) FROM slot_prices sp WHERE sp.court_type_id = c.court_type_id) AS giaTuTien,
             (SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN bookings b ON b.id = r.booking_id WHERE b.court_id = c.id) AS diemDanhGia,
             (SELECT COUNT(r.id) FROM reviews r JOIN bookings b ON b.id = r.booking_id WHERE b.court_id = c.id) AS tongLuotDanhGia
      FROM courts c
      JOIN court_types ct ON ct.id = c.court_type_id
      WHERE c.status != 'INACTIVE' AND ct.is_active = 1
    `;
    const thamSo: any[] = [];

    if (loaiSanId) {
      cauTruyVan += ' AND c.court_type_id = ?';
      thamSo.push(loaiSanId);
    }

    cauTruyVan += ' ORDER BY c.court_type_id, c.id';

    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, thamSo);
    return danhSach.map((dong) => ({
      ...dong,
      giaTuTien: dong.giaTuTien !== null ? Number(dong.giaTuTien) : null,
      diemDanhGia: dong.diemDanhGia !== null ? Number(dong.diemDanhGia) : null,
      tongLuotDanhGia: Number(dong.tongLuotDanhGia || 0),
    }));
  }

  /**
   * CUS-05: Lấy thông tin chi tiết một sân
   */
  static async getCourtById(sanId: number) {
    const cauTruyVan = `
      SELECT c.id, c.court_type_id AS loaiSanId, ct.name AS tenLoaiSan,
             c.name AS tenSan, c.description AS moTa, c.image_url AS anhUrl, c.status AS trangThai,
             ROUND(AVG(r.rating), 1) AS diemDanhGia,
             COUNT(r.id) AS tongLuotDanhGia
      FROM courts c
      JOIN court_types ct ON ct.id = c.court_type_id
      LEFT JOIN bookings b ON b.court_id = c.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE c.id = ? AND c.status != 'INACTIVE'
      GROUP BY c.id, ct.name
      LIMIT 1
    `;
    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, [sanId]);

    if (danhSach.length === 0) {
      throw ApiError.notFound('Không tìm thấy sân thể thao');
    }

    return danhSach[0];
  }

  /**
   * CUS-05: Lấy danh sách khung giờ cố định đang active
   */
  static async getTimeSlots() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, start_time AS gioBatDau, end_time AS gioKetThuc FROM time_slots WHERE is_active = 1 ORDER BY start_time'
    );
    return danhSach;
  }

  /**
   * CUS-06: Cấu hình công khai cho ứng dụng (thông tin ngân hàng, quy tắc đặt)
   */
  static async getPublicConfig() {
    return {
      quyDinhDatSan: {
        soNgayDatTruocToiDa: BUSINESS.BOOKING_ADVANCE_DAYS,
        thoiGianDatTruocToiThieuPhut: BUSINESS.MIN_LEAD_MINUTES,
        soKhungGioDatToiDa: BUSINESS.MAX_SLOTS_PER_BOOKING,
        thoiGianGiuChoChuyenKhoanPhut: BUSINESS.HOLD_MINUTES_BANK_TRANSFER,
        thoiGianHuyTruocGioChoiTieng: BUSINESS.CANCEL_DEADLINE_HOURS,
        soDonDatHoatDongToiDa: BUSINESS.MAX_ACTIVE_BOOKINGS_PER_CUSTOMER,
      },
      thanhToan: {
        tenNganHang: ENV.BANK_NAME,
        soTaiKhoan: ENV.BANK_ACCOUNT_NO,
        tenChuTaiKhoan: ENV.BANK_ACCOUNT_NAME,
      },
    };
  }
}
