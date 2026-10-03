// =====================================================================
// DỊCH VỤ QUẢN TRỊ (ADMIN SERVICE) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.4; ADM-01..07; BR-05, BR-14, BR-16, BR-19
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { ApiError } from '../utils/errors';
import { hashPassword } from '../utils/password';
import { NguoiDungXacThuc, TrangThaiSan, LoaiNgay, TrangThaiNguoiDung } from '../types';

export class AdminService {
  // ================= 1. ADM-01: LOẠI SÂN =================
  static async getCourtTypes() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name AS tenLoaiSan, description AS moTa, is_active AS dangHoatDong, created_at AS ngayTao FROM court_types ORDER BY id'
    );
    return danhSach.map((dong) => ({ ...dong, dangHoatDong: Boolean(dong.dangHoatDong) }));
  }

  static async createCourtType(duLieu: { tenLoaiSan: string; moTa?: string | null }) {
    const { tenLoaiSan, moTa } = duLieu;
    const [tonTai] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM court_types WHERE name = ? LIMIT 1',
      [tenLoaiSan]
    );
    if (tonTai.length > 0) throw ApiError.conflict('Tên loại sân đã tồn tại', 'CONFLICT');

    const [ketQua] = await pool.execute<ResultSetHeader>(
      'INSERT INTO court_types (name, description, is_active) VALUES (?, ?, 1)',
      [tenLoaiSan, moTa || null]
    );
    return { id: ketQua.insertId, tenLoaiSan, moTa, dangHoatDong: true };
  }

  static async updateCourtType(loaiSanId: number, duLieu: { tenLoaiSan?: string; moTa?: string | null }) {
    if (duLieu.tenLoaiSan) {
      const [tonTai] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM court_types WHERE name = ? AND id != ? LIMIT 1',
        [duLieu.tenLoaiSan, loaiSanId]
      );
      if (tonTai.length > 0) throw ApiError.conflict('Tên loại sân đã tồn tại', 'CONFLICT');
    }

    await pool.execute(
      'UPDATE court_types SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [duLieu.tenLoaiSan || null, duLieu.moTa || null, loaiSanId]
    );
    return { id: loaiSanId, ...duLieu };
  }

  static async toggleCourtTypeActive(loaiSanId: number) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT is_active FROM court_types WHERE id = ?',
      [loaiSanId]
    );
    if (danhSach.length === 0) throw ApiError.notFound('Loại sân không tồn tại');

    const trangThaiMoi = danhSach[0].is_active ? 0 : 1;

    // BR-05: Kiểm tra sân đang hoạt động
    if (trangThaiMoi === 0) {
      const [sanDangHoatDong] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) AS tong FROM courts WHERE court_type_id = ? AND status != 'INACTIVE'",
        [loaiSanId]
      );
      if (sanDangHoatDong[0].tong > 0) {
        throw ApiError.conflict(
          `Không thể tắt loại sân vì đang có ${sanDangHoatDong[0].tong} sân thuộc loại này đang hoạt động`,
          'IN_USE'
        );
      }
    }

    await pool.execute('UPDATE court_types SET is_active = ? WHERE id = ?', [trangThaiMoi, loaiSanId]);
    return { id: loaiSanId, dangHoatDong: Boolean(trangThaiMoi) };
  }

  // ================= 2. ADM-02: QUẢN LÝ SÂN =================
  static async getCourts() {
    const cauTruyVan = `
      SELECT c.id, c.court_type_id AS loaiSanId, ct.name AS tenLoaiSan,
             c.name AS tenSan, c.description AS moTa, c.image_url AS anhUrl, c.status AS trangThai
      FROM courts c
      JOIN court_types ct ON ct.id = c.court_type_id
      ORDER BY c.court_type_id, c.id
    `;
    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan);
    return danhSach;
  }

  static async createCourt(duLieu: {
    loaiSanId: number;
    tenSan: string;
    moTa?: string | null;
    anhUrl?: string | null;
    trangThai: TrangThaiSan;
  }) {
    const [tonTai] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM courts WHERE name = ? LIMIT 1',
      [duLieu.tenSan]
    );
    if (tonTai.length > 0) throw ApiError.conflict('Tên sân đã tồn tại', 'CONFLICT');

    const [ketQua] = await pool.execute<ResultSetHeader>(
      `INSERT INTO courts (court_type_id, name, description, image_url, status)
       VALUES (?, ?, ?, ?, ?)`,
      [duLieu.loaiSanId, duLieu.tenSan, duLieu.moTa || null, duLieu.anhUrl || null, duLieu.trangThai]
    );
    return { id: ketQua.insertId, ...duLieu };
  }

  static async updateCourt(
    sanId: number,
    duLieu: {
      loaiSanId?: number;
      tenSan?: string;
      moTa?: string | null;
      anhUrl?: string | null;
    }
  ) {
    if (duLieu.tenSan) {
      const [tonTai] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM courts WHERE name = ? AND id != ? LIMIT 1',
        [duLieu.tenSan, sanId]
      );
      if (tonTai.length > 0) throw ApiError.conflict('Tên sân đã tồn tại', 'CONFLICT');
    }

    await pool.execute(
      `UPDATE courts
       SET court_type_id = COALESCE(?, court_type_id),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [duLieu.loaiSanId || null, duLieu.tenSan || null, duLieu.moTa || null, duLieu.anhUrl || null, sanId]
    );
    return { id: sanId, ...duLieu };
  }

  /**
   * BR-05 / TC-34: Đổi trạng thái sân (kiểm tra đơn tương lai)
   */
  static async updateCourtStatus(sanId: number, trangThaiMoi: TrangThaiSan) {
    const [danhSach] = await pool.execute<RowDataPacket[]>('SELECT status FROM courts WHERE id = ?', [sanId]);
    if (danhSach.length === 0) throw ApiError.notFound('Sân không tồn tại');

    // BR-05: Chuyển sang MAINTENANCE hoặc INACTIVE phải kiểm tra đơn tương lai
    if (['MAINTENANCE', 'INACTIVE'].includes(trangThaiMoi)) {
      const [donTuongLai] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS tong FROM bookings
         WHERE court_id = ? AND status IN ('PENDING', 'CONFIRMED')
           AND TIMESTAMP(booking_date, end_time) > NOW()`,
        [sanId]
      );

      const soDon = Number(donTuongLai[0].tong);
      if (soDon > 0) {
        throw ApiError.conflict(
          `Không thể chuyển trạng thái sân vì đang có ${soDon} đơn đặt còn hiệu lực trong tương lai. Vui lòng xử lý đơn trước khi bảo trì hoặc ngừng hoạt động`,
          'COURT_HAS_FUTURE_BOOKINGS'
        );
      }
    }

    await pool.execute('UPDATE courts SET status = ? WHERE id = ?', [trangThaiMoi, sanId]);
    return { id: sanId, trangThai: trangThaiMoi };
  }

  // ================= 3. ADM-03: KHUNG GIỜ =================
  static async getTimeSlots() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, start_time AS gioBatDau, end_time AS gioKetThuc, is_active AS dangHoatDong FROM time_slots ORDER BY start_time'
    );
    return danhSach.map((dong) => ({ ...dong, dangHoatDong: Boolean(dong.dangHoatDong) }));
  }

  static async createTimeSlot(gioBatDau: string, gioKetThuc: string) {
    try {
      const [ketQua] = await pool.execute<ResultSetHeader>(
        'INSERT INTO time_slots (start_time, end_time, is_active) VALUES (?, ?, 1)',
        [gioBatDau, gioKetThuc]
      );
      return { id: ketQua.insertId, gioBatDau, gioKetThuc, dangHoatDong: true };
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('Khung giờ bắt đầu này đã tồn tại', 'CONFLICT');
      }
      throw err;
    }
  }

  static async toggleTimeSlotActive(khungGioId: number) {
    const [danhSach] = await pool.execute<RowDataPacket[]>('SELECT is_active FROM time_slots WHERE id = ?', [khungGioId]);
    if (danhSach.length === 0) throw ApiError.notFound('Khung giờ không tồn tại');

    const trangThaiMoi = danhSach[0].is_active ? 0 : 1;
    if (trangThaiMoi === 0) {
      const [donTuongLai] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS tong FROM booking_slots bs
         JOIN bookings b ON b.id = bs.booking_id
         WHERE bs.time_slot_id = ? AND b.status IN ('PENDING', 'CONFIRMED')
           AND TIMESTAMP(b.booking_date, b.end_time) > NOW()`,
        [khungGioId]
      );
      if (donTuongLai[0].tong > 0) {
        throw ApiError.conflict(
          `Khung giờ này đang có ${donTuongLai[0].tong} đơn đặt trong tương lai, không thể tắt`,
          'SLOT_IN_USE'
        );
      }
    }

    await pool.execute('UPDATE time_slots SET is_active = ? WHERE id = ?', [trangThaiMoi, khungGioId]);
    return { id: khungGioId, dangHoatDong: Boolean(trangThaiMoi) };
  }

  // ================= 4. ADM-04: MA TRẬN BẢNG GIÁ =================
  static async getSlotPrices(loaiSanId: number) {
    const cauTruyVan = `
      SELECT ts.id AS khungGioId, ts.start_time AS gioBatDau, ts.end_time AS gioKetThuc,
             sp_wd.price AS giaNgayThuong,
             sp_we.price AS giaCuoiTuan
      FROM time_slots ts
      LEFT JOIN slot_prices sp_wd
             ON sp_wd.time_slot_id  = ts.id
            AND sp_wd.court_type_id = ?
            AND sp_wd.day_type      = 'WEEKDAY'
      LEFT JOIN slot_prices sp_we
             ON sp_we.time_slot_id  = ts.id
            AND sp_we.court_type_id = ?
            AND sp_we.day_type      = 'WEEKEND'
      WHERE ts.is_active = 1
      ORDER BY ts.start_time
    `;
    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, [loaiSanId, loaiSanId]);
    return danhSach;
  }

  static async updateSlotPrices(
    danhSachGia: { loaiSanId: number; khungGioId: number; loaiNgay: LoaiNgay; giaTien: number }[]
  ) {
    for (const mucGia of danhSachGia) {
      await pool.execute(
        `INSERT INTO slot_prices (court_type_id, time_slot_id, day_type, price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price)`,
        [mucGia.loaiSanId, mucGia.khungGioId, mucGia.loaiNgay, mucGia.giaTien]
      );
    }
    return { soMucGiaCapNhat: danhSachGia.length, message: 'Cập nhật bảng giá thành công' };
  }

  // ================= 5. ADM-05: NHÂN VIÊN =================
  static async getStaffList() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      `SELECT id, full_name AS hoTen, phone AS soDienThoai, email, role, status AS trangThai, created_at AS ngayTao
       FROM users WHERE role = 'STAFF' ORDER BY id DESC`
    );
    return danhSach;
  }

  static async createStaff(duLieu: {
    hoTen: string;
    soDienThoai: string;
    matKhau: string;
    email?: string | null;
  }) {
    const [tonTai] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE phone = ? LIMIT 1', [duLieu.soDienThoai]);
    if (tonTai.length > 0) throw ApiError.conflict('Số điện thoại đã tồn tại', 'PHONE_EXISTS');

    const maHash = await hashPassword(duLieu.matKhau);
    const [ketQua] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'STAFF', 'ACTIVE')`,
      [duLieu.hoTen, duLieu.soDienThoai, duLieu.email || null, maHash]
    );

    return {
      id: ketQua.insertId,
      hoTen: duLieu.hoTen,
      soDienThoai: duLieu.soDienThoai,
      email: duLieu.email || null,
      role: 'STAFF',
      status: 'ACTIVE',
    };
  }

  static async updateStaff(nhanVienId: number, duLieu: { hoTen?: string; email?: string | null }) {
    await pool.execute(
      'UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE id = ? AND role = "STAFF"',
      [duLieu.hoTen || null, duLieu.email || null, nhanVienId]
    );
    return { id: nhanVienId, ...duLieu };
  }

  /**
   * BR-19 / TC-36: Khóa/mở tài khoản nhân viên / admin
   */
  static async toggleUserStatus(quanTriVien: NguoiDungXacThuc, nguoiDungId: number, trangThaiMoi: TrangThaiNguoiDung) {
    if (quanTriVien.id === nguoiDungId && trangThaiMoi === 'LOCKED') {
      throw ApiError.conflict('Bạn không thể tự khóa tài khoản quản trị của chính mình', 'CANNOT_LOCK_SELF');
    }

    const [danhSach] = await pool.execute<RowDataPacket[]>('SELECT role, status FROM users WHERE id = ? LIMIT 1', [nguoiDungId]);
    if (danhSach.length === 0) throw ApiError.notFound('Tài khoản không tồn tại');

    const nguoiDung = danhSach[0];
    if (nguoiDung.role === 'ADMIN' && trangThaiMoi === 'LOCKED') {
      const [soAdminConLai] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) AS tong FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE' AND id != ?",
        [nguoiDungId]
      );
      if (soAdminConLai[0].tong === 0) {
        throw ApiError.conflict(
          'Hệ thống phải duy trì ít nhất 1 tài khoản Quản trị viên (ADMIN) đang hoạt động',
          'LAST_ADMIN'
        );
      }
    }

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [trangThaiMoi, nguoiDungId]);
    return { id: nguoiDungId, trangThai: trangThaiMoi };
  }

  static async resetStaffPassword(nhanVienId: number, matKhauMoi: string) {
    const maHash = await hashPassword(matKhauMoi);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [maHash, nhanVienId]);
    return { id: nhanVienId, message: 'Đặt lại mật khẩu thành công' };
  }

  // ================= 6. ADM-07: BÁO CÁO DOANH THU & LẤP ĐẦY =================
  static async getSummaryReport(tuNgay: string, denNgay: string) {
    const [danhSachDoanhThu] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(processed_at) AS ngayBaoCao,
              SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) AS tongThu,
              SUM(CASE WHEN type = 'REFUND' THEN amount ELSE 0 END) AS tongHoan,
              SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE -amount END) AS doanhThuThuan
       FROM payments
       WHERE status = 'SUCCESS' AND DATE(processed_at) BETWEEN ? AND ?
       GROUP BY DATE(processed_at)
       ORDER BY ngayBaoCao ASC`,
      [tuNgay, denNgay]
    );

    const [thongKeTrangThai] = await pool.execute<RowDataPacket[]>(
      `SELECT status AS trangThai, COUNT(*) AS soDon, COALESCE(SUM(total_amount), 0) AS tongTien
       FROM bookings
       WHERE booking_date BETWEEN ? AND ?
       GROUP BY status`,
      [tuNgay, denNgay]
    );

    const [slotDaDat] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tongSlot
       FROM booking_slots bs
       JOIN bookings b ON b.id = bs.booking_id
       WHERE bs.is_locked = 1 AND b.status IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
         AND bs.slot_date BETWEEN ? AND ?`,
      [tuNgay, denNgay]
    );

    const [soSan] = await pool.execute<RowDataPacket[]>("SELECT COUNT(*) AS tong FROM courts WHERE status = 'ACTIVE'");
    const [soKhung] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS tong FROM time_slots WHERE is_active = 1');

    const ngayBatDau = new Date(tuNgay);
    const ngayKetThuc = new Date(denNgay);
    const soNgay = Math.max(1, Math.round((ngayKetThuc.getTime() - ngayBatDau.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const tongSlotToiDa = (soSan[0].tong || 1) * (soKhung[0].tong || 1) * soNgay;
    const soSlotThucTe = Number(slotDaDat[0].tongSlot || 0);
    const tyLeLapDay = Number(((soSlotThucTe / tongSlotToiDa) * 100).toFixed(1));

    return {
      tuNgay,
      denNgay,
      tyLeLapDay,
      tongSlotToiDa,
      soSlotThucTe,
      doanhThuTheoNgay: danhSachDoanhThu.map((dong) => ({
        ngayBaoCao: dong.ngayBaoCao,
        tongThu: Number(dong.tongThu),
        tongHoan: Number(dong.tongHoan),
        doanhThuThuan: Number(dong.doanhThuThuan),
      })),
      donTheoTrangThai: thongKeTrangThai,
    };
  }

  /**
   * ADM-07: Báo cáo chi tiết doanh thu theo ngày/tháng
   * Tham chiếu: Plant/06-api.md 5.11 & Plant/01-database.md 7.3
   */
  static async getRevenueReport(tuNgay: string, denNgay: string, nhomTheo: 'day' | 'month' = 'day') {
    const formatNgay = nhomTheo === 'month' ? "DATE_FORMAT(processed_at, '%Y-%m')" : 'DATE(processed_at)';

    const [danhSach] = await pool.execute<RowDataPacket[]>(
      `SELECT ${formatNgay} AS ngay,
              SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END) AS daThu,
              SUM(CASE WHEN type = 'REFUND' THEN amount ELSE 0 END) AS daHoan,
              SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE -amount END) AS doanhThu
       FROM payments
       WHERE status = 'SUCCESS' AND DATE(processed_at) BETWEEN ? AND ?
       GROUP BY ${formatNgay}
       ORDER BY ngay ASC`,
      [tuNgay, denNgay]
    );

    let tongDoanhThu = 0;
    let tongDaThu = 0;
    let tongDaHoan = 0;

    const items = danhSach.map((dong) => {
      const thu = Number(dong.daThu || 0);
      const hoan = Number(dong.daHoan || 0);
      const dt = Number(dong.doanhThu || 0);
      tongDaThu += thu;
      tongDaHoan += hoan;
      tongDoanhThu += dt;

      return {
        date: String(dong.ngay),
        ngay: String(dong.ngay),
        paid: thu,
        daThu: thu,
        refunded: hoan,
        daHoan: hoan,
        revenue: dt,
        doanhThu: dt,
      };
    });

    return {
      totalRevenue: tongDoanhThu,
      tongDoanhThu,
      tongDaThu,
      tongDaHoan,
      tuNgay,
      denNgay,
      nhomTheo,
      items,
    };
  }

  /**
   * ADM-07: Báo cáo tỷ lệ sử dụng từng sân
   * Tham chiếu: Plant/04 ADM-07 & Plant/01-database.md 7.4
   */
  static async getCourtUsageReport(tuNgay: string, denNgay: string) {
    const ngayBatDau = new Date(tuNgay);
    const ngayKetThuc = new Date(denNgay);
    const soNgay = Math.max(1, Math.round((ngayKetThuc.getTime() - ngayBatDau.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const [danhSachKhung] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS tong FROM time_slots WHERE is_active = 1');
    const soKhungHoatDong = Number(danhSachKhung[0].tong || 1);
    const tongSlotMotSan = soKhungHoatDong * soNgay;

    const [danhSachSan] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id AS sanId, c.name AS tenSan, ct.name AS tenLoaiSan, c.status AS trangThai,
              COUNT(bs.id) AS soSlotDaDat,
              COALESCE(SUM(bs.price), 0) AS doanhThuSan
       FROM courts c
       JOIN court_types ct ON ct.id = c.court_type_id
       LEFT JOIN booking_slots bs ON bs.court_id = c.id
            AND bs.is_locked = 1
            AND bs.slot_date BETWEEN ? AND ?
       LEFT JOIN bookings b ON b.id = bs.booking_id AND b.status IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
       GROUP BY c.id, c.name, ct.name, c.status
       ORDER BY soSlotDaDat DESC, c.id ASC`,
      [tuNgay, denNgay]
    );

    const items = danhSachSan.map((dong) => {
      const soSlotDaDat = Number(dong.soSlotDaDat || 0);
      const tyLeLapDay = Number(((soSlotDaDat / tongSlotMotSan) * 100).toFixed(1));

      return {
        sanId: dong.sanId,
        courtId: dong.sanId,
        tenSan: dong.tenSan,
        courtName: dong.tenSan,
        tenLoaiSan: dong.tenLoaiSan,
        courtTypeName: dong.tenLoaiSan,
        trangThai: dong.trangThai,
        soSlotDaDat,
        bookedSlots: soSlotDaDat,
        tongSlotKhaDung: tongSlotMotSan,
        totalAvailableSlots: tongSlotMotSan,
        tyLeLapDay,
        utilizationRate: tyLeLapDay,
        doanhThu: Number(dong.doanhThuSan || 0),
        revenue: Number(dong.doanhThuSan || 0),
      };
    });

    return {
      tuNgay,
      denNgay,
      soNgay,
      tongSlotMotSan,
      items,
    };
  }
}
