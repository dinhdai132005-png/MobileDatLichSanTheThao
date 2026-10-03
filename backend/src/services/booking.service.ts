// =====================================================================
// DỊCH VỤ ĐẶT SÂN (BOOKING SERVICE) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md; BR-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 13, 15, 20, 22
// =====================================================================
import crypto from 'crypto';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { ENV } from '../config/env';
import { BUSINESS } from '../config/business';
import { ApiError } from '../utils/errors';
import { withTransaction } from '../utils/transaction';
import {
  NguoiDungXacThuc,
  LoaiNgay,
  PhuongThucThanhToan,
  TrangThaiKhungGio,
} from '../types';

export class BookingService {
  /**
   * BR-01: Xác định loại ngày (WEEKDAY hoặc WEEKEND)
   * Chủ nhật = 0, Thứ bảy = 6
   */
  static xacDinhLoaiNgay(ngayDatChuoi: string): LoaiNgay {
    const [nam, thang, ngay] = ngayDatChuoi.split('-').map(Number);
    const thoiGian = new Date(nam, thang - 1, ngay);
    const thuTrongTuan = thoiGian.getDay();
    return thuTrongTuan === 0 || thuTrongTuan === 6 ? 'WEEKEND' : 'WEEKDAY';
  }

  /**
   * BR-22: Sinh mã đơn ngẫu nhiên BK + 8 ký tự chữ hoa/số
   */
  static taoMaDonDat(): string {
    const kyTu = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let maDon = 'BK';
    for (let i = 0; i < 8; i++) {
      const viTriNgauNhien = crypto.randomInt(0, kyTu.length);
      maDon += kyTu[viTriNgauNhien];
    }
    return maDon;
  }

  /**
   * T08 / CUS-05: Lấy lịch trống và giá của sân theo ngày
   */
  static async getCourtAvailability(sanId: number, ngayDatChuoi: string) {
    const [danhSachSan] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.court_type_id AS loaiSanId, c.name AS tenSan, c.status AS trangThai,
              ct.name AS tenLoaiSan
       FROM courts c
       JOIN court_types ct ON ct.id = c.court_type_id
       WHERE c.id = ? AND c.status != 'INACTIVE' LIMIT 1`,
      [sanId]
    );

    if (danhSachSan.length === 0) {
      throw ApiError.notFound('Sân thể thao không tồn tại hoặc đã ngừng hoạt động');
    }

    const thongTinSan = danhSachSan[0];
    const loaiNgay = this.xacDinhLoaiNgay(ngayDatChuoi); // BR-01

    // BR-20: Múi giờ Asia/Ho_Chi_Minh cho so sánh
    const hienTai = new Date();
    const homNayChuoi = hienTai.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const laHomNay = ngayDatChuoi === homNayChuoi;

    const gioHienTaiMang = hienTai.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).split(':').map(Number);
    const phutHienTaiTrongNgay = gioHienTaiMang[0] * 60 + gioHienTaiMang[1];

    // Truy vấn tất cả khung giờ active, giá theo loaiNgay, và trạng thái đã đặt (01 §7.1)
    const cauTruyVan = `
      SELECT ts.id AS khungGioId, ts.start_time AS gioBatDau, ts.end_time AS gioKetThuc, sp.price AS giaTien,
             (bs.id IS NOT NULL) AS daDat
      FROM time_slots ts
      JOIN courts c ON c.id = ?
      LEFT JOIN slot_prices sp
             ON sp.court_type_id = c.court_type_id
            AND sp.time_slot_id  = ts.id
            AND sp.day_type      = ?
      LEFT JOIN booking_slots bs
             ON bs.court_id     = c.id
            AND bs.slot_date    = ?
            AND bs.time_slot_id = ts.id
            AND bs.is_locked    = 1
      WHERE ts.is_active = 1
      ORDER BY ts.start_time
    `;

    const [danhSachKhung] = await pool.execute<RowDataPacket[]>(cauTruyVan, [sanId, loaiNgay, ngayDatChuoi]);

    const danhSachKhungGio = danhSachKhung.map((dong) => {
      let trangThai: TrangThaiKhungGio = 'AVAILABLE';

      if (thongTinSan.trangThai === 'MAINTENANCE') {
        trangThai = 'MAINTENANCE';
      } else if (dong.giaTien === null || dong.giaTien === undefined) {
        trangThai = 'NO_PRICE';
      } else if (dong.daDat) {
        trangThai = 'BOOKED';
      } else if (laHomNay) {
        const [gio, phut] = (dong.gioBatDau as string).split(':').map(Number);
        const phutKhungGioBatDau = gio * 60 + phut;
        if (phutKhungGioBatDau < phutHienTaiTrongNgay + BUSINESS.MIN_LEAD_MINUTES) {
          trangThai = 'PAST';
        }
      } else if (ngayDatChuoi < homNayChuoi) {
        trangThai = 'PAST';
      }

      return {
        khungGioId: dong.khungGioId,
        gioBatDau: (dong.gioBatDau as string).substring(0, 5),
        gioKetThuc: (dong.gioKetThuc as string).substring(0, 5),
        giaTien: dong.giaTien !== null ? Number(dong.giaTien) : null,
        trangThai,
      };
    });

    return {
      sanId: thongTinSan.id,
      tenSan: thongTinSan.tenSan,
      tenLoaiSan: thongTinSan.tenLoaiSan,
      trangThaiSan: thongTinSan.trangThai,
      ngayDat: ngayDatChuoi,
      loaiNgay,
      danhSachKhungGio,
    };
  }

  /**
   * T09 / CUS-06: Khách hàng đặt sân (CASH hoặc BANK_TRANSFER)
   */
  static async createBooking(
    nguoiDung: NguoiDungXacThuc,
    duLieu: {
      sanId: number;
      ngayDat: string;
      danhSachKhungGioId: number[];
      phuongThucThanhToan: PhuongThucThanhToan;
      ghiChu?: string | null;
    }
  ) {
    const { sanId, ngayDat, danhSachKhungGioId, phuongThucThanhToan, ghiChu } = duLieu;

    // BR-02: Tối đa 3 khung giờ một đơn
    if (danhSachKhungGioId.length < 1 || danhSachKhungGioId.length > BUSINESS.MAX_SLOTS_PER_BOOKING) {
      throw ApiError.unprocessable(
        `Số khung giờ đặt phải từ 1 đến ${BUSINESS.MAX_SLOTS_PER_BOOKING} giờ liền kề`,
        'SLOTS_NOT_CONSECUTIVE'
      );
    }

    // BR-03: Kiểm tra ngày đặt từ hôm nay đến hôm nay + 14 ngày
    const hienTai = new Date();
    const homNayChuoi = hienTai.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const ngayToiDa = new Date(hienTai);
    ngayToiDa.setDate(ngayToiDa.getDate() + BUSINESS.BOOKING_ADVANCE_DAYS);
    const ngayToiDaChuoi = ngayToiDa.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (ngayDat < homNayChuoi || ngayDat > ngayToiDaChuoi) {
      throw ApiError.unprocessable(
        `Ngày đặt sân chỉ được phép trong vòng ${BUSINESS.BOOKING_ADVANCE_DAYS} ngày kể từ hôm nay`,
        'BOOKING_DATE_INVALID'
      );
    }

    return withTransaction(async (conn) => {
      // BR-08: Kiểm tra giới hạn 3 đơn hoạt động / khách
      const [donHoatDong] = await conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS tongSoDon FROM bookings
         WHERE user_id = ? AND status IN ('PENDING', 'CONFIRMED')
           AND TIMESTAMP(booking_date, end_time) > NOW()`,
        [nguoiDung.id]
      );
      if (donHoatDong[0].tongSoDon >= BUSINESS.MAX_ACTIVE_BOOKINGS_PER_CUSTOMER) {
        throw ApiError.unprocessable(
          `Bạn đã có ${BUSINESS.MAX_ACTIVE_BOOKINGS_PER_CUSTOMER} đơn đặt sân đang hoạt động. Vui lòng hoàn thành hoặc hủy đơn cũ trước khi đặt tiếp`,
          'TOO_MANY_ACTIVE_BOOKINGS'
        );
      }

      // BR-05: Kiểm tra sân ACTIVE
      const [danhSachSan] = await conn.execute<RowDataPacket[]>(
        'SELECT id, court_type_id AS loaiSanId, status FROM courts WHERE id = ? LIMIT 1',
        [sanId]
      );
      if (danhSachSan.length === 0 || danhSachSan[0].status !== 'ACTIVE') {
        throw ApiError.unprocessable(
          'Sân này hiện đang bảo trì hoặc tạm ngưng phục vụ, không thể đặt',
          'COURT_NOT_BOOKABLE'
        );
      }
      const loaiSanId = danhSachSan[0].loaiSanId;

      // Lấy danh sách khung giờ theo ID
      const chuoiHoiCham = danhSachKhungGioId.map(() => '?').join(',');
      const [danhSachKhung] = await conn.execute<RowDataPacket[]>(
        `SELECT id, start_time AS gioBatDau, end_time AS gioKetThuc FROM time_slots
         WHERE id IN (${chuoiHoiCham}) AND is_active = 1
         ORDER BY start_time ASC`,
        danhSachKhungGioId
      );

      if (danhSachKhung.length !== danhSachKhungGioId.length) {
        throw ApiError.badRequest('Một hoặc nhiều khung giờ chọn không hợp lệ', 'VALIDATION_ERROR');
      }

      // BR-02: Kiểm tra các khung giờ phải LIỀN KỀ
      for (let i = 0; i < danhSachKhung.length - 1; i++) {
        if (danhSachKhung[i].gioKetThuc !== danhSachKhung[i + 1].gioBatDau) {
          throw ApiError.unprocessable(
            'Các khung giờ bạn chọn phải liền kề nhau',
            'SLOTS_NOT_CONSECUTIVE'
          );
        }
      }

      // BR-03 (APP): Khung giờ đầu phải cách hiện tại >= 30 phút nếu đặt cho hôm nay
      if (ngayDat === homNayChuoi) {
        const gioHienTaiMang = hienTai.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }).split(':').map(Number);
        const phutHienTai = gioHienTaiMang[0] * 60 + gioHienTaiMang[1];
        const [gio, phut] = (danhSachKhung[0].gioBatDau as string).split(':').map(Number);
        const phutBatDau = gio * 60 + phut;

        if (phutBatDau < phutHienTai + BUSINESS.MIN_LEAD_MINUTES) {
          throw ApiError.unprocessable(
            `Đơn đặt qua ứng dụng phải cách giờ bắt đầu ít nhất ${BUSINESS.MIN_LEAD_MINUTES} phút`,
            'SLOT_IN_PAST'
          );
        }
      }

      // BR-01 & BR-15: Lấy giá snapshot từ bảng slot_prices
      const loaiNgay = this.xacDinhLoaiNgay(ngayDat);
      const [danhSachGia] = await conn.execute<RowDataPacket[]>(
        `SELECT time_slot_id, price FROM slot_prices
         WHERE court_type_id = ? AND day_type = ? AND time_slot_id IN (${chuoiHoiCham})`,
        [loaiSanId, loaiNgay, ...danhSachKhungGioId]
      );

      const banDoGia = new Map<number, number>();
      for (const gia of danhSachGia) {
        banDoGia.set(gia.time_slot_id, Number(gia.price));
      }

      let tongTien = 0;
      const danhSachKemGia: { khungGioId: number; giaTien: number }[] = [];
      for (const khung of danhSachKhung) {
        const donGia = banDoGia.get(khung.id);
        if (donGia === undefined) {
          throw ApiError.unprocessable(
            `Khung giờ ${khung.gioBatDau.substring(0, 5)} - ${khung.gioKetThuc.substring(0, 5)} chưa được cấu hình bảng giá`,
            'PRICE_NOT_CONFIGURED'
          );
        }
        danhSachKemGia.push({ khungGioId: khung.id, giaTien: donGia });
        tongTien += donGia;
      }

      // BR-06 & BR-07: Xác định trạng thái ban đầu và hạn giữ chỗ
      let trangThai: 'PENDING' | 'CONFIRMED' = 'CONFIRMED';
      let thoiGianHetHan: string | null = null;

      if (phuongThucThanhToan === 'BANK_TRANSFER') {
        trangThai = 'PENDING';
        const hanGiuCho = new Date(Date.now() + BUSINESS.HOLD_MINUTES_BANK_TRANSFER * 60 * 1000);
        const expLocale = new Date(hanGiuCho.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const y = expLocale.getFullYear();
        const m = String(expLocale.getMonth() + 1).padStart(2, '0');
        const d = String(expLocale.getDate()).padStart(2, '0');
        const hh = String(expLocale.getHours()).padStart(2, '0');
        const mm = String(expLocale.getMinutes()).padStart(2, '0');
        const ss = String(expLocale.getSeconds()).padStart(2, '0');
        thoiGianHetHan = `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
      }

      const maDonDat = this.taoMaDonDat(); // BR-22
      const gioBatDau = danhSachKhung[0].gioBatDau;
      const gioKetThuc = danhSachKhung[danhSachKhung.length - 1].gioKetThuc;

      // INSERT vào bảng bookings
      const [ketQuaInsert] = await conn.execute<ResultSetHeader>(
        `INSERT INTO bookings (
           booking_code, user_id, court_id, booking_date,
           start_time, end_time, total_amount, status,
           payment_method, payment_status, source, note, expires_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 'APP', ?, ?)`,
        [
          maDonDat,
          nguoiDung.id,
          sanId,
          ngayDat,
          gioBatDau,
          gioKetThuc,
          tongTien,
          trangThai,
          phuongThucThanhToan,
          ghiChu || null,
          thoiGianHetHan,
        ]
      );
      const donDatId = ketQuaInsert.insertId;

      // BR-04: INSERT vào booking_slots với is_locked = 1
      for (const khungGioKemGia of danhSachKemGia) {
        try {
          await conn.execute(
            `INSERT INTO booking_slots (booking_id, court_id, slot_date, time_slot_id, price, is_locked)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [donDatId, sanId, ngayDat, khungGioKemGia.khungGioId, khungGioKemGia.giaTien]
          );
        } catch (loiSlot: any) {
          if (loiSlot && loiSlot.code === 'ER_DUP_ENTRY') {
            throw ApiError.conflict('Khung giờ này đã có người đặt trước', 'SLOT_TAKEN');
          }
          throw loiSlot;
        }
      }

      // SYS-02: Ghi nhật ký booking_status_logs
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, NULL, ?, ?, 'Khách hàng tạo đơn đặt sân từ ứng dụng')`,
        [donDatId, trangThai, nguoiDung.id]
      );

      // Thông tin chuyển khoản VietQR nếu là BANK_TRANSFER
      let thongTinThanhToan: any = null;
      if (phuongThucThanhToan === 'BANK_TRANSFER') {
        thongTinThanhToan = {
          tenNganHang: ENV.BANK_NAME,
          soTaiKhoan: ENV.BANK_ACCOUNT_NO,
          tenChuTaiKhoan: ENV.BANK_ACCOUNT_NAME,
          soTien: tongTien,
          noiDungChuyenKhoan: maDonDat,
          qrUrl: `https://img.vietqr.io/image/${ENV.BANK_NAME}-${ENV.BANK_ACCOUNT_NO}-compact2.png?amount=${tongTien}&addInfo=${encodeURIComponent(maDonDat)}&accountName=${encodeURIComponent(ENV.BANK_ACCOUNT_NAME)}`,
        };
      }

      return {
        id: donDatId,
        maDonDat,
        sanId,
        ngayDat,
        gioBatDau: (gioBatDau as string).substring(0, 5),
        gioKetThuc: (gioKetThuc as string).substring(0, 5),
        tongTien,
        trangThai,
        phuongThucThanhToan,
        trangThaiThanhToan: 'UNPAID',
        thoiGianHetHan,
        thongTinThanhToan,
      };
    });
  }

  /**
   * CUS-08: Lấy danh sách đơn đặt của tôi (kèm lọc status)
   */
  static async getMyBookings(nguoiDung: NguoiDungXacThuc, chuoiTrangThai?: string) {
    let cauTruyVan = `
      SELECT b.id, b.booking_code AS maDonDat, b.court_id AS sanId, c.name AS tenSan,
             ct.name AS tenLoaiSan, b.booking_date AS ngayDat,
             b.start_time AS gioBatDau, b.end_time AS gioKetThuc,
             b.total_amount AS tongTien, b.status AS trangThai,
             b.payment_method AS phuongThucThanhToan, b.payment_status AS trangThaiThanhToan,
             b.expires_at AS thoiGianHetHan, b.created_at AS ngayTao
      FROM bookings b
      JOIN courts c ON c.id = b.court_id
      JOIN court_types ct ON ct.id = c.court_type_id
      WHERE b.user_id = ?
    `;
    const thamSo: any[] = [nguoiDung.id];

    if (chuoiTrangThai) {
      const danhSachTrangThai = chuoiTrangThai.split(',').map((s) => s.trim().toUpperCase());
      const chuoiHoiCham = danhSachTrangThai.map(() => '?').join(',');
      cauTruyVan += ` AND b.status IN (${chuoiHoiCham})`;
      thamSo.push(...danhSachTrangThai);
    }

    cauTruyVan += ' ORDER BY b.created_at DESC';

    const [danhSach] = await pool.execute<RowDataPacket[]>(cauTruyVan, thamSo);
    return danhSach;
  }

  /**
   * CUS-07 / CUS-08: Xem chi tiết một đơn đặt
   */
  static async getBookingDetail(nguoiDung: NguoiDungXacThuc, donDatId: number) {
    const [danhSachDon] = await pool.execute<RowDataPacket[]>(
      `SELECT b.id, b.booking_code AS maDonDat, b.court_id AS sanId, c.name AS tenSan,
              ct.name AS tenLoaiSan, b.booking_date AS ngayDat,
              b.start_time AS gioBatDau, b.end_time AS gioKetThuc,
              b.total_amount AS tongTien, b.status AS trangThai,
              b.payment_method AS phuongThucThanhToan, b.payment_status AS trangThaiThanhToan,
              b.source AS nguonDon, b.note AS ghiChu, b.expires_at AS thoiGianHetHan,
              b.cancelled_at AS thoiGianHuy, b.cancel_reason AS lyDoHuy,
              b.user_id AS nguoiDungId, b.created_at AS ngayTao
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       JOIN court_types ct ON ct.id = c.court_type_id
       WHERE b.id = ? LIMIT 1`,
      [donDatId]
    );

    if (danhSachDon.length === 0) {
      throw ApiError.notFound('Đơn đặt không tồn tại');
    }

    const donDat = danhSachDon[0];

    // Quyền: Khách chỉ được xem đơn của chính mình (404 để không lộ sự tồn tại)
    if (nguoiDung.role === 'CUSTOMER' && donDat.nguoiDungId !== nguoiDung.id) {
      throw ApiError.notFound('Đơn đặt không tồn tại');
    }

    // Danh sách khung giờ
    const [danhSachKhung] = await pool.execute<RowDataPacket[]>(
      `SELECT bs.id, bs.time_slot_id AS khungGioId, ts.start_time AS gioBatDau, ts.end_time AS gioKetThuc,
              bs.price AS giaTien, bs.is_locked AS dangKhoa
       FROM booking_slots bs
       JOIN time_slots ts ON ts.id = bs.time_slot_id
       WHERE bs.booking_id = ?
       ORDER BY ts.start_time`,
      [donDatId]
    );

    // Quyền hủy: BR-09
    let coTheHuy = false;
    if (['PENDING', 'CONFIRMED'].includes(donDat.trangThai)) {
      if (nguoiDung.role === 'STAFF' || nguoiDung.role === 'ADMIN') {
        coTheHuy = true;
      } else {
        const thoiDiemBatDau = new Date(`${donDat.ngayDat}T${donDat.gioBatDau}+07:00`);
        const chenhLechGio = (thoiDiemBatDau.getTime() - Date.now()) / (1000 * 60 * 60);
        coTheHuy = chenhLechGio >= BUSINESS.CANCEL_DEADLINE_HOURS;
      }
    }

    const [danhSachDanhGia] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE booking_id = ? LIMIT 1',
      [donDatId]
    );
    const daDanhGia = danhSachDanhGia.length > 0;

    let thongTinThanhToan: any = null;
    if (donDat.trangThai === 'PENDING' && donDat.phuongThucThanhToan === 'BANK_TRANSFER') {
      thongTinThanhToan = {
        tenNganHang: ENV.BANK_NAME,
        soTaiKhoan: ENV.BANK_ACCOUNT_NO,
        tenChuTaiKhoan: ENV.BANK_ACCOUNT_NAME,
        soTien: donDat.tongTien,
        noiDungChuyenKhoan: donDat.maDonDat,
        qrUrl: `https://img.vietqr.io/image/${ENV.BANK_NAME}-${ENV.BANK_ACCOUNT_NO}-compact2.png?amount=${donDat.tongTien}&addInfo=${encodeURIComponent(donDat.maDonDat)}&accountName=${encodeURIComponent(ENV.BANK_ACCOUNT_NAME)}`,
      };
    }

    // SYS-02 & T32: Nhật ký thay đổi trạng thái
    const [danhSachNhatKy] = await pool.execute<RowDataPacket[]>(
      `SELECT bsl.id, bsl.from_status AS trangThaiTruoc, bsl.to_status AS trangThaiSau,
              bsl.changed_by AS nguoiThayDoiId, bsl.note AS ghiChu, bsl.created_at AS thoiGian,
              u.full_name AS tenNguoiThayDoi, u.role AS vaiTroNguoiThayDoi
       FROM booking_status_logs bsl
       LEFT JOIN users u ON u.id = bsl.changed_by
       WHERE bsl.booking_id = ?
       ORDER BY bsl.created_at ASC`,
      [donDatId]
    );

    // Lịch sử thanh toán / hoàn tiền
    const [danhSachGiaoDich] = await pool.execute<RowDataPacket[]>(
      `SELECT id, type AS loaiGiaoDich, amount AS soTien, method AS phuongThuc,
              status AS trangThai, reference_code AS maThamChieu, processed_at AS thoiGianXuLy, created_at AS thoiGianTao
       FROM payments
       WHERE booking_id = ?
       ORDER BY created_at ASC`,
      [donDatId]
    );

    return {
      ...donDat,
      coTheHuy,
      daDanhGia,
      thongTinThanhToan,
      danhSachKhungGio: danhSachKhung,
      nhatKyTrangThai: danhSachNhatKy,
      danhSachGiaoDich: danhSachGiaoDich,
    };
  }

  /**
   * CUS-09: Khách hàng hủy đơn đặt sân (BR-09, BR-10)
   */
  static async cancelBookingByCustomer(nguoiDung: NguoiDungXacThuc, donDatId: number, lyDoHuy?: string) {
    return withTransaction(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
        [donDatId]
      );

      if (danhSach.length === 0) {
        throw ApiError.notFound('Đơn đặt không tồn tại');
      }

      const donDat = danhSach[0];

      if (donDat.user_id !== nguoiDung.id) {
        throw ApiError.notFound('Đơn đặt không tồn tại');
      }

      if (!['PENDING', 'CONFIRMED'].includes(donDat.status)) {
        throw ApiError.conflict(`Không thể hủy đơn đang ở trạng thái ${donDat.status}`, 'INVALID_STATUS');
      }

      // BR-09: Kiểm tra hạn 6 tiếng
      const thoiDiemBatDau = new Date(`${donDat.booking_date}T${donDat.start_time}+07:00`);
      const chenhLechGio = (thoiDiemBatDau.getTime() - Date.now()) / (1000 * 60 * 60);

      if (chenhLechGio < BUSINESS.CANCEL_DEADLINE_HOURS) {
        throw ApiError.unprocessable(
          `Đã quá hạn tự hủy đơn (phải trước giờ bắt đầu ít nhất ${BUSINESS.CANCEL_DEADLINE_HOURS} tiếng). Vui lòng liên hệ nhân viên sân để được hỗ trợ`,
          'CANCEL_DEADLINE_PASSED'
        );
      }

      // 1. Cập nhật status = CANCELLED
      await conn.execute(
        `UPDATE bookings SET status = 'CANCELLED', cancelled_at = NOW(), cancel_reason = ? WHERE id = ?`,
        [lyDoHuy || 'Khách hàng tự hủy trên ứng dụng', donDatId]
      );

      // 2. Nhả slot (is_locked = NULL)
      await conn.execute('UPDATE booking_slots SET is_locked = NULL WHERE booking_id = ?', [donDatId]);

      // 3. BR-10: Hoàn tiền 100% nếu đã trả
      let choHoanTien = false;
      if (donDat.payment_status === 'PAID') {
        await conn.execute(
          `INSERT INTO payments (booking_id, type, method, amount, status, note)
           VALUES (?, 'REFUND', ?, ?, 'PENDING', ?)`,
          [
            donDatId,
            donDat.payment_method,
            donDat.total_amount,
            'Hoàn tiền tự động do khách hủy đơn hợp lệ trước 6 tiếng',
          ]
        );
        choHoanTien = true;
      }

      // 4. Ghi log
      await conn.execute(
        `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
         VALUES (?, ?, 'CANCELLED', ?, ?)`,
        [donDatId, donDat.status, nguoiDung.id, lyDoHuy || 'Khách hàng tự hủy trên ứng dụng']
      );

      return {
        id: donDatId,
        trangThai: 'CANCELLED',
        choHoanTien,
        message: choHoanTien
          ? 'Hủy đơn thành công. Tiền đã thanh toán sẽ được nhân viên hoàn trả lại cho bạn'
          : 'Hủy đơn đặt sân thành công',
      };
    });
  }

  /**
   * CUS-10: Đánh giá sân sau khi hoàn thành đơn (BR-13)
   */
  static async reviewBooking(
    nguoiDung: NguoiDungXacThuc,
    donDatId: number,
    soSao: number,
    noiDungDanhGia?: string | null
  ) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, user_id, status FROM bookings WHERE id = ? LIMIT 1',
      [donDatId]
    );

    if (danhSach.length === 0) throw ApiError.notFound('Đơn đặt không tồn tại');
    const donDat = danhSach[0];

    if (donDat.user_id !== nguoiDung.id) throw ApiError.notFound('Đơn đặt không tồn tại');
    if (donDat.status !== 'COMPLETED') {
      throw ApiError.unprocessable('Chỉ có thể đánh giá sân sau khi đơn đặt đã hoàn thành', 'BOOKING_NOT_COMPLETED');
    }

    const [trungDanhGia] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE booking_id = ? LIMIT 1',
      [donDatId]
    );
    if (trungDanhGia.length > 0) {
      throw ApiError.conflict('Đơn đặt này đã được đánh giá trước đó', 'ALREADY_REVIEWED');
    }

    await pool.execute(
      'INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [donDatId, nguoiDung.id, soSao, noiDungDanhGia || null]
    );

    return { message: 'Đánh giá sân thành công' };
  }

  /**
   * CUS-10: Xem danh sách đánh giá của sân
   */
  static async getCourtReviews(sanId: number, trang = 1, gioiHan = 20) {
    const viTri = (trang - 1) * gioiHan;

    const [tongSo] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(r.id) AS tong FROM reviews r JOIN bookings b ON b.id = r.booking_id WHERE b.court_id = ?`,
      [sanId]
    );
    const tong = Number(tongSo[0].tong);

    const [danhSach] = await pool.execute<RowDataPacket[]>(
      `SELECT r.id, r.rating AS soSao, r.comment AS noiDungDanhGia, r.created_at AS ngayDanhGia,
              u.full_name AS tenNguoiDung
       FROM reviews r
       JOIN bookings b ON b.id = r.booking_id
       JOIN users u ON u.id = r.user_id
       WHERE b.court_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [sanId, gioiHan, viTri]
    );

    return {
      items: danhSach,
      total: tong,
      page: trang,
      limit: gioiHan,
    };
  }
}
