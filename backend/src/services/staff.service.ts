// =====================================================================
// DỊCH VỤ NHÂN VIÊN (STAFF SERVICE) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.3; STF-02..10
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { ApiError } from '../utils/errors';
import { withTransaction } from '../utils/transaction';
import { BookingService } from './booking.service';
import { NguoiDungXacThuc, PhuongThucThanhToan } from '../types';

export class StaffService {
  /**
   * STF-02: Dashboard số liệu tổng quan "Hôm nay"
   */
  static async getDashboard() {
    const hienTai = new Date();
    const homNay = hienTai.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    // 1. Thống kê đơn hôm nay
    const [thongKeDon] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS tongDonHomNay,
         SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS donXacNhanHomNay,
         SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS donHoanThanhHomNay,
         SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS donHuyHomNay
       FROM bookings WHERE booking_date = ?`,
      [homNay]
    );

    // 2. Đơn PENDING đang giữ chỗ
    const [donCho] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS soDonChoGiuCho FROM bookings WHERE status = 'PENDING' AND expires_at > NOW()`
    );

    // 3. Đơn chờ hoàn tiền
    const [choHoanTien] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS soDonChoHoan, COALESCE(SUM(amount), 0) AS tongTienHoan
       FROM payments WHERE type = 'REFUND' AND status = 'PENDING'`
    );

    // 4. Doanh thu hôm nay (Thu - Hoàn)
    const [doanhThu] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE -amount END), 0) AS doanhThuHomNay
       FROM payments WHERE status = 'SUCCESS' AND DATE(processed_at) = ?`,
      [homNay]
    );

    const tongDonHomNay = Number(thongKeDon[0].tongDonHomNay || 0);
    const donXacNhanHomNay = Number(thongKeDon[0].donXacNhanHomNay || 0);
    const donHoanThanhHomNay = Number(thongKeDon[0].donHoanThanhHomNay || 0);
    const donHuyHomNay = Number(thongKeDon[0].donHuyHomNay || 0);
    const soDonChoGiuCho = Number(donCho[0].soDonChoGiuCho || 0);
    const soDonChoHoan = Number(choHoanTien[0].soDonChoHoan || 0);
    const tongTienHoan = Number(choHoanTien[0].tongTienHoan || 0);
    const doanhThuThuanHomNay = Number(doanhThu[0].doanhThuHomNay || 0);

    return {
      ngay: homNay,
      tongDonHomNay,
      donXacNhanHomNay,
      donHoanThanhHomNay,
      donHuyHomNay,
      soDonChoGiuCho,
      soDonChoHoan,
      tongTienHoan,
      doanhThuHomNay: doanhThuThuanHomNay,
    };
  }

  /**
   * STF-03: Lịch lưới sân theo ngày (Sân × Khung giờ)
   */
  static async getScheduleGrid(ngayDat: string) {
    const [danhSachSan] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id AS sanId, c.name AS tenSan, c.status AS trangThaiSan, ct.name AS tenLoaiSan
       FROM courts c
       JOIN court_types ct ON ct.id = c.court_type_id
       WHERE c.status != 'INACTIVE'
       ORDER BY c.court_type_id, c.id`
    );

    const [danhSachKhung] = await pool.execute<RowDataPacket[]>(
      'SELECT id AS khungGioId, start_time AS gioBatDau, end_time AS gioKetThuc FROM time_slots WHERE is_active = 1 ORDER BY start_time'
    );

    const [danhSachDat] = await pool.execute<RowDataPacket[]>(
      `SELECT bs.court_id AS sanId, bs.time_slot_id AS khungGioId, b.id AS donDatId, b.booking_code AS maDonDat,
              b.status AS trangThaiDon, b.payment_status AS trangThaiThanhToan,
              COALESCE(u.full_name, b.guest_name, 'Khách vãng lai') AS tenKhachHang,
              COALESCE(u.phone, b.guest_phone, '') AS soDienThoaiKhach
       FROM booking_slots bs
       JOIN bookings b ON b.id = bs.booking_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE bs.slot_date = ? AND bs.is_locked = 1`,
      [ngayDat]
    );

    const banDoDat = new Map<string, any>();
    for (const dong of danhSachDat) {
      banDoDat.set(`${dong.sanId}_${dong.khungGioId}`, {
        donDatId: dong.donDatId,
        maDonDat: dong.maDonDat,
        trangThaiDon: dong.trangThaiDon,
        trangThaiThanhToan: dong.trangThaiThanhToan,
        tenKhachHang: dong.tenKhachHang,
        soDienThoaiKhach: dong.soDienThoaiKhach,
      });
    }

    const maTranLich = danhSachSan.map((san) => {
      const danhSachO = danhSachKhung.map((khung) => {
        const daDat = banDoDat.get(`${san.sanId}_${khung.khungGioId}`);
        return {
          khungGioId: khung.khungGioId,
          gioBatDau: (khung.gioBatDau as string).substring(0, 5),
          gioKetThuc: (khung.gioKetThuc as string).substring(0, 5),
          daDat: Boolean(daDat),
          thongTinDat: daDat || null,
        };
      });
      return {
        sanId: san.sanId,
        tenSan: san.tenSan,
        trangThaiSan: san.trangThaiSan,
        tenLoaiSan: san.tenLoaiSan,
        danhSachKhungGio: danhSachO,
      };
    });

    return {
      ngayDat,
      danhSachKhungGio: danhSachKhung.map((khung) => ({
        ...khung,
        gioBatDau: (khung.gioBatDau as string).substring(0, 5),
        gioKetThuc: (khung.gioKetThuc as string).substring(0, 5),
      })),
      maTranLich,
    };
  }

  /**
   * STF-04: Danh sách đơn đặt sân (hỗ trợ lọc, tìm kiếm, phân trang)
   */
  static async getBookings(boLoc: {
    ngayDat?: string;
    sanId?: number;
    trangThai?: string;
    trangThaiThanhToan?: string;
    tuKhoa?: string;
    trang?: number;
    gioiHan?: number;
    date?: string;
    courtId?: number;
    status?: string;
    paymentStatus?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const trang = Math.max(1, boLoc.trang || boLoc.page || 1);
    const gioiHan = Math.min(100, Math.max(1, boLoc.gioiHan || boLoc.limit || 20));
    const viTri = (trang - 1) * gioiHan;

    const ngayLoc = boLoc.ngayDat || boLoc.date;
    const sanLoc = boLoc.sanId || boLoc.courtId;
    const trangThaiLoc = boLoc.trangThai || boLoc.status;
    const thanhToanLoc = boLoc.trangThaiThanhToan || boLoc.paymentStatus;
    const tuKhoaLoc = boLoc.tuKhoa || boLoc.keyword;

    let dieuKien = 'WHERE 1=1';
    const thamSo: any[] = [];

    if (ngayLoc) {
      dieuKien += ' AND b.booking_date = ?';
      thamSo.push(ngayLoc);
    }
    if (sanLoc) {
      dieuKien += ' AND b.court_id = ?';
      thamSo.push(sanLoc);
    }
    if (trangThaiLoc) {
      dieuKien += ' AND b.status = ?';
      thamSo.push(trangThaiLoc);
    }
    if (thanhToanLoc) {
      dieuKien += ' AND b.payment_status = ?';
      thamSo.push(thanhToanLoc);
    }
    if (tuKhoaLoc) {
      dieuKien += ' AND (b.booking_code LIKE ? OR b.guest_name LIKE ? OR b.guest_phone LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)';
      const tk = `%${tuKhoaLoc}%`;
      thamSo.push(tk, tk, tk, tk, tk);
    }

    const [dem] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tong FROM bookings b LEFT JOIN users u ON u.id = b.user_id ${dieuKien}`,
      thamSo
    );
    const tong = Number(dem[0].tong);

    const cauTruyVan = `
      SELECT b.id, b.booking_code AS maDonDat, b.court_id AS sanId, c.name AS tenSan,
             ct.name AS tenLoaiSan, b.booking_date AS ngayDat, b.start_time AS gioBatDau, b.end_time AS gioKetThuc,
             b.total_amount AS tongTien, b.status AS trangThai, b.payment_method AS phuongThucThanhToan,
             b.payment_status AS trangThaiThanhToan, b.source AS nguonDon, b.created_at AS ngayTao, b.expires_at AS thoiGianHetHan,
             COALESCE(u.full_name, b.guest_name, 'Khách vãng lai') AS tenKhachHang,
             COALESCE(u.phone, b.guest_phone, '') AS soDienThoaiKhach
      FROM bookings b
      JOIN courts c ON c.id = b.court_id
      JOIN court_types ct ON ct.id = c.court_type_id
      LEFT JOIN users u ON u.id = b.user_id
      ${dieuKien}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, [...thamSo, gioiHan, viTri]);

    return {
      items: danhSach,
      total: tong,
      page: trang,
      limit: gioiHan,
    };
  }

  /**
   * STF-05: Đặt sân tại quầy cho khách vãng lai
   */
  static async createWalkInBooking(
    nhanVien: NguoiDungXacThuc,
    duLieu: {
      sanId: number;
      ngayDat: string;
      danhSachKhungGioId: number[];
      khachHangId?: number | null;
      tenKhachHang?: string | null;
      soDienThoaiKhach?: string | null;
      phuongThucThanhToan: PhuongThucThanhToan;
      thanhToanNgay: boolean;
      ghiChu?: string | null;
    }
  ) {
    const {
      sanId,
      ngayDat,
      danhSachKhungGioId,
      khachHangId,
      tenKhachHang,
      soDienThoaiKhach,
      phuongThucThanhToan,
      thanhToanNgay,
      ghiChu,
    } = duLieu;

    return withTransaction(async (conn) => {
      // 1. Kiểm tra sân
      const [danhSachSan] = await conn.execute<RowDataPacket[]>(
        'SELECT id, court_type_id AS loaiSanId, status FROM courts WHERE id = ? LIMIT 1',
        [sanId]
      );
      if (danhSachSan.length === 0 || danhSachSan[0].status !== 'ACTIVE') {
        throw ApiError.unprocessable('Sân đang bảo trì hoặc không hoạt động', 'COURT_NOT_BOOKABLE');
      }
      const loaiSanId = danhSachSan[0].loaiSanId;

      // 2. Lấy khung giờ
      const chuoiHoiCham = danhSachKhungGioId.map(() => '?').join(',');
      const [danhSachKhung] = await conn.execute<RowDataPacket[]>(
        `SELECT id, start_time AS gioBatDau, end_time AS gioKetThuc FROM time_slots
         WHERE id IN (${chuoiHoiCham}) AND is_active = 1
         ORDER BY start_time ASC`,
        danhSachKhungGioId
      );

      if (danhSachKhung.length !== danhSachKhungGioId.length) {
        throw ApiError.badRequest('Khung giờ không hợp lệ', 'VALIDATION_ERROR');
      }

      // BR-02: Liền kề
      for (let i = 0; i < danhSachKhung.length - 1; i++) {
        if (danhSachKhung[i].gioKetThuc !== danhSachKhung[i + 1].gioBatDau) {
          throw ApiError.unprocessable('Các khung giờ phải liền kề nhau', 'SLOTS_NOT_CONSECUTIVE');
        }
      }

      // BR-03 (STAFF): Khung giờ cuối chưa kết thúc
      const hienTai = new Date();
      const homNay = hienTai.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      if (ngayDat === homNay) {
        const gioHienTaiMang = hienTai.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).split(':').map(Number);
        const phutHienTai = gioHienTaiMang[0] * 60 + gioHienTaiMang[1];
        const [gio, phut] = (danhSachKhung[danhSachKhung.length - 1].gioKetThuc as string).split(':').map(Number);
        if (gio * 60 + phut <= phutHienTai) {
          throw ApiError.unprocessable('Khung giờ bạn chọn đã kết thúc', 'SLOT_IN_PAST');
        }
      }

      // 3. Tính giá snapshot (BR-15)
      const loaiNgay = BookingService.xacDinhLoaiNgay(ngayDat);
      const [danhSachGia] = await conn.execute<RowDataPacket[]>(
        `SELECT time_slot_id, price FROM slot_prices
         WHERE court_type_id = ? AND day_type = ? AND time_slot_id IN (${chuoiHoiCham})`,
        [loaiSanId, loaiNgay, ...danhSachKhungGioId]
      );
      const banDoGia = new Map<number, number>();
      for (const pr of danhSachGia) {
        banDoGia.set(pr.time_slot_id, Number(pr.price));
      }

      let tongTien = 0;
      const danhSachKemGia: { khungGioId: number; giaTien: number }[] = [];
      for (const s of danhSachKhung) {
        const donGia = banDoGia.get(s.id);
        if (donGia === undefined) {
          throw ApiError.unprocessable('Khung giờ chưa được cấu hình giá', 'PRICE_NOT_CONFIGURED');
        }
        danhSachKemGia.push({ khungGioId: s.id, giaTien: donGia });
        tongTien += donGia;
      }

      const maDonDat = BookingService.taoMaDonDat();
      const gioBatDau = danhSachKhung[0].gioBatDau;
      const gioKetThuc = danhSachKhung[danhSachKhung.length - 1].gioKetThuc;
      const trangThaiThanhToanBanDau = thanhToanNgay ? 'PAID' : 'UNPAID';

      const [ketQua] = await conn.execute<ResultSetHeader>(
        `INSERT INTO bookings (
           booking_code, user_id, guest_name, guest_phone, court_id,
           booking_date, start_time, end_time, total_amount, status,
           payment_method, payment_status, source, note, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, 'STAFF', ?, ?)`,
        [
          maDonDat,
          khachHangId || null,
          tenKhachHang || null,
          soDienThoaiKhach || null,
          sanId,
          ngayDat,
          gioBatDau,
          gioKetThuc,
          tongTien,
          phuongThucThanhToan,
          trangThaiThanhToanBanDau,
          ghiChu || null,
          nhanVien.id,
        ]
      );
      const donDatId = ketQua.insertId;

      // 4. Khóa slot (BR-04)
      for (const khungGioKemGia of danhSachKemGia) {
        try {
          await conn.execute(
            `INSERT INTO booking_slots (booking_id, court_id, slot_date, time_slot_id, price, is_locked)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [donDatId, sanId, ngayDat, khungGioKemGia.khungGioId, khungGioKemGia.giaTien]
          );
        } catch (err: any) {
          if (err && err.code === 'ER_DUP_ENTRY') {
            throw ApiError.conflict('Khung giờ đã có người đặt trước', 'SLOT_TAKEN');
          }
          throw err;
        }
      }

      // 5. Nếu thanhToanNgay = true -> Ghi vào payments
      if (thanhToanNgay) {
        await conn.execute(
          `INSERT INTO payments (booking_id, type, method, amount, status, processed_by, processed_at, note)
           VALUES (?, 'PAYMENT', ?, ?, 'SUCCESS', ?, NOW(), 'Thanh toán trực tiếp tại quầy khi tạo đơn')`,
          [donDatId, phuongThucThanhToan, tongTien, nhanVien.id]
        );
      }

      // 6. Ghi log trạng thái
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, NULL, 'CONFIRMED', ?, 'Nhân viên đặt hộ tại quầy')`,
        [donDatId, nhanVien.id]
      );

      return {
        id: donDatId,
        maDonDat,
        sanId,
        ngayDat,
        gioBatDau: (gioBatDau as string).substring(0, 5),
        gioKetThuc: (gioKetThuc as string).substring(0, 5),
        tongTien,
        trangThai: 'CONFIRMED',
        trangThaiThanhToan: trangThaiThanhToanBanDau,
        nguonDon: 'STAFF',
      };
    });
  }

  /**
   * STF-06: Ghi nhận thanh toán cho đơn
   */
  static async recordPayment(
    nhanVien: NguoiDungXacThuc,
    donDatId: number,
    duLieu: {
      phuongThucThanhToan: PhuongThucThanhToan;
      soTien?: number;
      maGiaoDichThamChieu?: string | null;
      ghiChu?: string | null;
    }
  ) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [donDatId]
      );

      if (danhSach.length === 0) throw ApiError.notFound('Đơn đặt không tồn tại');
      const donDat = danhSach[0];

      if (donDat.payment_status === 'PAID') {
        throw ApiError.conflict('Đơn đặt này đã được thanh toán', 'ALREADY_PAID');
      }

      if (['CANCELLED', 'EXPIRED'].includes(donDat.status)) {
        throw ApiError.unprocessable(
          `Không thể ghi nhận thanh toán cho đơn ở trạng thái ${donDat.status}`,
          donDat.status === 'EXPIRED' ? 'BOOKING_EXPIRED' : 'INVALID_STATUS'
        );
      }

      // BR-11: Thanh toán toàn phần
      const soTienThanhToan = duLieu.soTien || donDat.total_amount;
      if (soTienThanhToan !== donDat.total_amount) {
        throw ApiError.badRequest(
          `Số tiền thanh toán phải bằng chính xác tổng tiền đơn (${donDat.total_amount} ₫)`,
          'VALIDATION_ERROR'
        );
      }

      await conn.execute(
        `UPDATE bookings
         SET status = 'CONFIRMED', payment_status = 'PAID', payment_method = ?, expires_at = NULL
         WHERE id = ?`,
        [duLieu.phuongThucThanhToan, donDatId]
      );

      await conn.execute(
        `INSERT INTO payments (
           booking_id, type, method, amount, status, transaction_ref, processed_by, processed_at, note
         ) VALUES (?, 'PAYMENT', ?, ?, 'SUCCESS', ?, ?, NOW(), ?)`,
        [
          donDatId,
          duLieu.phuongThucThanhToan,
          soTienThanhToan,
          duLieu.maGiaoDichThamChieu || null,
          nhanVien.id,
          duLieu.ghiChu || 'Nhân viên xác nhận thanh toán thành công',
        ]
      );

      if (donDat.status === 'PENDING') {
        await conn.execute(
          `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
           VALUES (?, 'PENDING', 'CONFIRMED', ?, 'Nhân viên xác nhận thanh toán chuyển khoản')`,
          [donDatId, nhanVien.id]
        );
      }

      return {
        id: donDatId,
        trangThai: 'CONFIRMED',
        trangThaiThanhToan: 'PAID',
        phuongThucThanhToan: duLieu.phuongThucThanhToan,
        message: 'Ghi nhận thanh toán thành công',
      };
    });
  }

  /**
   * STF-07: Đánh dấu hoàn thành đơn (BR-12)
   */
  static async completeBooking(nhanVien: NguoiDungXacThuc, donDatId: number) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [donDatId]
      );

      if (danhSach.length === 0) throw ApiError.notFound('Đơn đặt không tồn tại');
      const donDat = danhSach[0];

      if (donDat.status !== 'CONFIRMED') {
        throw ApiError.conflict(`Chỉ có thể hoàn thành đơn ở trạng thái CONFIRMED`, 'INVALID_STATUS');
      }

      if (donDat.payment_status !== 'PAID') {
        throw ApiError.unprocessable('Đơn chưa được thanh toán, vui lòng thu tiền trước khi hoàn thành', 'NOT_PAID');
      }

      const thoiDiemBatDau = new Date(`${donDat.booking_date}T${donDat.start_time}+07:00`);
      if (Date.now() < thoiDiemBatDau.getTime()) {
        throw ApiError.unprocessable('Chưa đến giờ bắt đầu của khung giờ đặt, không thể hoàn thành sớm', 'TOO_EARLY');
      }

      await conn.execute(`UPDATE bookings SET status = 'COMPLETED' WHERE id = ? AND status = 'CONFIRMED'`, [donDatId]);
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, 'CONFIRMED', 'COMPLETED', ?, 'Nhân viên xác nhận khách đã đến và hoàn thành giờ chơi')`,
        [donDatId, nhanVien.id]
      );

      return { id: donDatId, trangThai: 'COMPLETED', message: 'Hoàn thành đơn đặt thành công' };
    });
  }

  /**
   * STF-07: Đánh dấu vắng mặt (No-Show)
   */
  static async markNoShow(nhanVien: NguoiDungXacThuc, donDatId: number) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [donDatId]
      );

      if (danhSach.length === 0) throw ApiError.notFound('Đơn đặt không tồn tại');
      const donDat = danhSach[0];

      if (donDat.status !== 'CONFIRMED') {
        throw ApiError.conflict('Chỉ có thể đánh dấu No-Show cho đơn ở trạng thái CONFIRMED', 'INVALID_STATUS');
      }

      const thoiDiemBatDau = new Date(`${donDat.booking_date}T${donDat.start_time}+07:00`);
      if (Date.now() < thoiDiemBatDau.getTime()) {
        throw ApiError.unprocessable('Chưa đến giờ bắt đầu, không thể đánh dấu No-Show', 'TOO_EARLY');
      }

      await conn.execute(`UPDATE bookings SET status = 'NO_SHOW' WHERE id = ? AND status = 'CONFIRMED'`, [donDatId]);
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, 'CONFIRMED', 'NO_SHOW', ?, 'Nhân viên đánh dấu khách vắng mặt không đến')`,
        [donDatId, nhanVien.id]
      );

      return { id: donDatId, trangThai: 'NO_SHOW', message: 'Đã đánh dấu đơn vắng mặt (No-Show)' };
    });
  }

  /**
   * STF-08: Nhân viên hủy đơn đặt thay khách (có lý do)
   */
  static async cancelBookingByStaff(nhanVien: NguoiDungXacThuc, donDatId: number, lyDoHuy: string) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [donDatId]
      );

      if (danhSach.length === 0) throw ApiError.notFound('Đơn đặt không tồn tại');
      const donDat = danhSach[0];

      if (!['PENDING', 'CONFIRMED'].includes(donDat.status)) {
        throw ApiError.conflict(`Không thể hủy đơn đang ở trạng thái ${donDat.status}`, 'INVALID_STATUS');
      }

      await conn.execute(
        `UPDATE bookings SET status = 'CANCELLED', cancelled_at = NOW(), cancel_reason = ? WHERE id = ?`,
        [lyDoHuy, donDatId]
      );
      await conn.execute('UPDATE booking_slots SET is_locked = NULL WHERE booking_id = ?', [donDatId]);

      let choHoanTien = false;
      if (donDat.payment_status === 'PAID') {
        await conn.execute(
          `INSERT INTO payments (booking_id, type, method, amount, status, note)
           VALUES (?, 'REFUND', ?, ?, 'PENDING', ?)`,
          [donDatId, donDat.payment_method, donDat.total_amount, `Nhân viên hủy đơn: ${lyDoHuy}`]
        );
        choHoanTien = true;
      }

      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, ?, 'CANCELLED', ?, ?)`,
        [donDatId, donDat.status, nhanVien.id, `Nhân viên hủy: ${lyDoHuy}`]
      );

      return {
        id: donDatId,
        trangThai: 'CANCELLED',
        choHoanTien,
        message: 'Hủy đơn thành công',
      };
    });
  }

  /**
   * STF-09: Lấy danh sách giao dịch hoàn tiền
   */
  static async getRefunds(trangThai?: string) {
    let cauTruyVan = `
      SELECT p.id, p.booking_id AS donDatId, b.booking_code AS maDonDat, p.amount AS soTienHoan,
             p.method AS phuongThucThanhToan, p.status AS trangThaiGiaoDich,
             p.created_at AS ngayYeuCau, p.processed_at AS ngayHoanThanh, p.note AS ghiChu,
             COALESCE(u.full_name, b.guest_name, 'Khách vãng lai') AS tenKhachHang,
             COALESCE(u.phone, b.guest_phone, '') AS soDienThoaiKhach
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      LEFT JOIN users u ON u.id = b.user_id
      WHERE p.type = 'REFUND'
    `;
    const thamSo: any[] = [];

    if (trangThai) {
      cauTruyVan += ' AND p.status = ?';
      thamSo.push(trangThai);
    }

    cauTruyVan += ' ORDER BY p.created_at DESC';

    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, thamSo);
    return danhSach;
  }

  /**
   * STF-09: Nhân viên xác nhận đã hoàn tiền thành công
   */
  static async confirmRefund(nhanVien: NguoiDungXacThuc, giaoDichId: number) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM payments WHERE id = ? AND type = "REFUND" FOR UPDATE',
        [giaoDichId]
      );

      if (danhSach.length === 0) throw ApiError.notFound('Giao dịch hoàn tiền không tồn tại');
      const giaoDich = danhSach[0];

      if (giaoDich.status === 'SUCCESS') {
        throw ApiError.conflict('Giao dịch hoàn tiền này đã được xác nhận trước đó', 'ALREADY_PAID');
      }

      await conn.execute(
        `UPDATE payments SET status = 'SUCCESS', processed_by = ?, processed_at = NOW() WHERE id = ?`,
        [nhanVien.id, giaoDichId]
      );
      await conn.execute(`UPDATE bookings SET payment_status = 'REFUNDED' WHERE id = ?`, [giaoDich.booking_id]);

      return { id: giaoDichId, trangThai: 'SUCCESS', message: 'Xác nhận hoàn tiền thành công' };
    });
  }

  /**
   * STF-10: Tra cứu danh sách khách hàng
   */
  static async getCustomers(tuKhoa?: string) {
    let cauTruyVan = `
      SELECT u.id, u.full_name AS hoTen, u.phone AS soDienThoai, u.email, u.status AS trangThai,
             u.created_at AS ngayThamGia, COUNT(b.id) AS tongSoDonDat
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      WHERE u.role = 'CUSTOMER'
    `;
    const thamSo: any[] = [];

    if (tuKhoa) {
      cauTruyVan += ' AND (u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
      const tk = `%${tuKhoa}%`;
      thamSo.push(tk, tk, tk);
    }

    cauTruyVan += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, thamSo);
    return danhSach.map((dong) => ({ ...dong, tongSoDonDat: Number(dong.tongSoDonDat) }));
  }

  /**
   * STF-10: Chi tiết khách hàng
   */
  static async getCustomerDetail(khachHangId: number) {
    const [danhSachKhach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name AS hoTen, phone AS soDienThoai, email, status AS trangThai, created_at AS ngayThamGia FROM users WHERE id = ? AND role = "CUSTOMER" LIMIT 1',
      [khachHangId]
    );

    if (danhSachKhach.length === 0) throw ApiError.notFound('Khách hàng không tồn tại');

    const [danhSachDon] = await pool.execute<RowDataPacket[]>(
      `SELECT b.id, b.booking_code AS maDonDat, c.name AS tenSan, b.booking_date AS ngayDat,
              b.start_time AS gioBatDau, b.end_time AS gioKetThuc, b.total_amount AS tongTien,
              b.status AS trangThai, b.created_at AS ngayTao
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC LIMIT 10`,
      [khachHangId]
    );

    return {
      ...danhSachKhach[0],
      donDatGanDay: danhSachDon,
    };
  }
}
