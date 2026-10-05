// =====================================================================
// DỊCH VỤ ĐẶT SÂN KHÁCH HÀNG — plant/06-api.md mục 4.2, 5.3, 5.4, 5.5, 5.10
// BR-01..BR-10, BR-13, BR-15, BR-20, BR-22, BR-24, BR-29, BR-34
// Bảng thao tác: don_dat, chi_tiet_khung_gio_dat, thanh_toan, nhat_ky_trang_thai_don, danh_gia
// =====================================================================
import crypto from 'crypto';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/csdl';
import { MOI_TRUONG } from '../config/moitruong';
import { NGHIEP_VU } from '../config/nghiepvu';
import { LoiApi } from '../utils/loi';
import { voiGiaoDich } from '../utils/giaodich';
import { chuyenCamel, catGio } from '../utils/chuyendoicamel';
import { ghiNhatKyTrangThai } from '../utils/nhatky';
import {
  layNgayHomNay,
  layPhutHienTai,
  laNgayHopLe,
  congNgay,
  xacDinhLoaiNgay,
  phutTuGio,
  thoiDiemTu,
  dinhDangIso,
} from '../utils/thoigian';
import { NguoiDungXacThuc, PhuongThucThanhToan, TrangThaiKhungGio } from '../types';

export class DonDatService {
  /** BR-22: Sinh mã đơn ngẫu nhiên BK + 8 ký tự chữ hoa/số */
  static sinhMaDonDat(): string {
    const kyTu = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ma = 'BK';
    for (let i = 0; i < 8; i++) {
      ma += kyTu[crypto.randomInt(0, kyTu.length)];
    }
    return ma;
  }

  /**
   * CUS-05 / 5.3: Lịch trống và giá của sân theo ngày (công khai cho khách)
   * Áp dụng quy tắc khách: giờ đã qua hoặc trong vòng 30 phút tới là PAST (BR-03)
   */
  static async layLichTrongSan(sanId: number, ngayDat: string) {
    if (!laNgayHopLe(ngayDat)) {
      throw LoiApi.yeuCauKhongHopLe('Ngày kiểm tra không đúng định dạng YYYY-MM-DD');
    }

    const homNay = layNgayHomNay();
    const ngayToiDa = congNgay(homNay, NGHIEP_VU.SO_NGAY_DAT_TRUOC_TOI_DA);
    if (ngayDat < homNay || ngayDat > ngayToiDa) {
      throw LoiApi.yeuCauKhongHopLe(`Ngày chỉ được trong vòng ${NGHIEP_VU.SO_NGAY_DAT_TRUOC_TOI_DA} ngày kể từ hôm nay`);
    }

    const [danhSachSan] = await pool.execute<RowDataPacket[]>(
      `SELECT s.id, s.ten AS court_name, s.trang_thai AS court_status, ls.ten AS court_type_name
       FROM san s JOIN loai_san ls ON ls.id = s.loai_san_id
       WHERE s.id = ? AND s.trang_thai != 'INACTIVE' LIMIT 1`,
      [sanId]
    );
    if (danhSachSan.length === 0) throw LoiApi.khongTimThay('Sân không tồn tại hoặc đã ngừng hoạt động');

    const thongTinSan = danhSachSan[0];
    const loaiNgay = xacDinhLoaiNgay(ngayDat);
    const laHomNay = ngayDat === homNay;
    const phutHienTai = layPhutHienTai();

    const sql = `
      SELECT kg.id AS time_slot_id, kg.gio_bat_dau AS start_time, kg.gio_ket_thuc AS end_time,
             gkg.gia AS price,
             (ctkg.id IS NOT NULL) AS is_booked
      FROM khung_gio kg
      JOIN san s ON s.id = ?
      LEFT JOIN gia_khung_gio gkg
             ON gkg.loai_san_id  = s.loai_san_id
            AND gkg.khung_gio_id = kg.id
            AND gkg.loai_ngay    = ?
      LEFT JOIN chi_tiet_khung_gio_dat ctkg
             ON ctkg.san_id       = s.id
            AND ctkg.ngay_dat     = ?
            AND ctkg.khung_gio_id = kg.id
            AND ctkg.dang_khoa    = 1
      WHERE kg.hoat_dong = 1
      ORDER BY kg.gio_bat_dau
    `;
    const [danhSachKhung] = await pool.execute<RowDataPacket[]>(sql, [sanId, loaiNgay, ngayDat]);

    const slots = danhSachKhung.map((dong) => {
      let status: TrangThaiKhungGio = 'AVAILABLE';
      if (thongTinSan.court_status === 'MAINTENANCE') {
        status = 'MAINTENANCE';
      } else if (dong.price === null || dong.price === undefined) {
        status = 'NO_PRICE';
      } else if (dong.is_booked) {
        status = 'BOOKED';
      } else if (laHomNay) {
        const phutKhung = phutTuGio(dong.start_time as string);
        if (phutKhung < phutHienTai + NGHIEP_VU.SO_PHUT_DAT_TRUOC_TOI_THIEU) {
          status = 'PAST';
        }
      }

      return {
        timeSlotId: Number(dong.time_slot_id),
        startTime: catGio(dong.start_time as string),
        endTime: catGio(dong.end_time as string),
        price: dong.price !== null ? Number(dong.price) : null,
        status,
      };
    });

    return {
      courtId: thongTinSan.id,
      courtName: thongTinSan.court_name,
      courtTypeName: thongTinSan.court_type_name,
      courtStatus: thongTinSan.court_status,
      date: ngayDat,
      dayType: loaiNgay,
      slots,
    };
  }

  /**
   * CUS-06 / 5.4: Tạo đơn đặt sân từ ứng dụng (CUSTOMER)
   */
  static async taoDonDat(
    nguoiDung: NguoiDungXacThuc,
    duLieu: {
      courtId: number;
      bookingDate: string;
      timeSlotIds: number[];
      paymentMethod: PhuongThucThanhToan;
      note?: string | null;
    }
  ) {
    const { courtId, bookingDate, timeSlotIds, paymentMethod, note } = duLieu;

    if (!laNgayHopLe(bookingDate)) {
      throw LoiApi.khongXuLyDuoc('Ngày đặt không đúng định dạng YYYY-MM-DD', 'BOOKING_DATE_INVALID');
    }

    const homNay = layNgayHomNay();
    const ngayToiDa = congNgay(homNay, NGHIEP_VU.SO_NGAY_DAT_TRUOC_TOI_DA);
    if (bookingDate < homNay || bookingDate > ngayToiDa) {
      throw LoiApi.khongXuLyDuoc(`Chỉ được đặt sân từ hôm nay đến ${ngayToiDa}`, 'BOOKING_DATE_INVALID');
    }

    return voiGiaoDich(async (conn) => {
      // BR-08: Tối đa 3 đơn đang hoạt động
      const [demDon] = await conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS tong FROM don_dat
         WHERE nguoi_dung_id = ? AND trang_thai IN ('PENDING','CONFIRMED')
           AND TIMESTAMP(ngay_dat, gio_ket_thuc) > NOW()`,
        [nguoiDung.id]
      );
      if (Number(demDon[0].tong) >= NGHIEP_VU.SO_DON_HOAT_DONG_TOI_DA) {
        throw LoiApi.khongXuLyDuoc('Bạn đã có tối đa 3 đơn đặt đang hoạt động', 'TOO_MANY_ACTIVE_BOOKINGS');
      }

      // BR-05: Sân phải tồn tại và ACTIVE
      const [danhSachSan] = await conn.execute<RowDataPacket[]>(
        `SELECT s.id, s.ten AS name, s.trang_thai, s.loai_san_id, ls.ten AS court_type_name
         FROM san s JOIN loai_san ls ON ls.id = s.loai_san_id
         WHERE s.id = ? LIMIT 1`,
        [courtId]
      );
      if (danhSachSan.length === 0 || danhSachSan[0].trang_thai !== 'ACTIVE') {
        throw LoiApi.khongXuLyDuoc('Sân không khả dụng để đặt', 'COURT_NOT_BOOKABLE');
      }
      const sanInfo = danhSachSan[0];

      // Lấy danh sách khung giờ
      const placeholders = timeSlotIds.map(() => '?').join(',');
      const [danhSachKhung] = await conn.execute<RowDataPacket[]>(
        `SELECT id, gio_bat_dau, gio_ket_thuc FROM khung_gio
         WHERE id IN (${placeholders}) AND hoat_dong = 1
         ORDER BY gio_bat_dau ASC`,
        timeSlotIds
      );
      if (danhSachKhung.length !== timeSlotIds.length) {
        throw LoiApi.yeuCauKhongHopLe('Một hoặc nhiều khung giờ không hợp lệ');
      }

      // BR-02: Kiểm tra các khung giờ phải LIỀN KỀ
      for (let i = 0; i < danhSachKhung.length - 1; i++) {
        if (danhSachKhung[i].gio_ket_thuc !== danhSachKhung[i + 1].gio_bat_dau) {
          throw LoiApi.khongXuLyDuoc('Các khung giờ đặt phải liền kề nhau', 'SLOTS_NOT_CONSECUTIVE');
        }
      }

      // BR-03: Đơn từ APP nếu hôm nay phải cách giờ bắt đầu >= 30 phút
      if (bookingDate === homNay) {
        const phutKhungDau = phutTuGio(danhSachKhung[0].gio_bat_dau as string);
        const phutHienTai = layPhutHienTai();
        if (phutKhungDau < phutHienTai + NGHIEP_VU.SO_PHUT_DAT_TRUOC_TOI_THIEU) {
          throw LoiApi.khongXuLyDuoc('Khung giờ bắt đầu phải cách hiện tại ít nhất 30 phút', 'SLOT_IN_PAST');
        }
      }

      // BR-15: Tra giá snapshot theo loai_san_id x day_type
      const loaiNgay = xacDinhLoaiNgay(bookingDate);
      const [danhSachGia] = await conn.execute<RowDataPacket[]>(
        `SELECT khung_gio_id, gia FROM gia_khung_gio
         WHERE loai_san_id = ? AND loai_ngay = ? AND khung_gio_id IN (${placeholders})`,
        [sanInfo.loai_san_id, loaiNgay, ...timeSlotIds]
      );
      const mapGia = new Map<number, number>();
      for (const g of danhSachGia) mapGia.set(Number(g.khung_gio_id), Number(g.gia));

      let courtAmount = 0;
      const slotsKemGia: { timeSlotId: number; startTime: string; endTime: string; price: number }[] = [];
      for (const k of danhSachKhung) {
        const gia = mapGia.get(Number(k.id));
        if (gia === undefined) {
          throw LoiApi.khongXuLyDuoc('Khung giờ chưa được cấu hình giá', 'PRICE_NOT_CONFIGURED');
        }
        courtAmount += gia;
        slotsKemGia.push({
          timeSlotId: Number(k.id),
          startTime: catGio(k.gio_bat_dau as string),
          endTime: catGio(k.gio_ket_thuc as string),
          price: gia,
        });
      }

      const maDonDat = DonDatService.sinhMaDonDat();
      const startTime = danhSachKhung[0].gio_bat_dau as string;
      const endTime = danhSachKhung[danhSachKhung.length - 1].gio_ket_thuc as string;

      // BR-06, BR-07: Xác định trạng thái khởi tạo và hạn giữ chỗ
      let status: 'PENDING' | 'CONFIRMED' = 'CONFIRMED';
      let hetHanLuc: string | null = null;
      let expiresAtIso: string | null = null;

      if (paymentMethod === 'BANK_TRANSFER') {
        status = 'PENDING';
        const d = new Date(Date.now() + NGHIEP_VU.PHUT_GIU_CHO_CHUYEN_KHOAN * 60 * 1000);
        expiresAtIso = dinhDangIso(d);
        hetHanLuc = expiresAtIso.replace('T', ' ').substring(0, 19);
      }

      // INSERT vào don_dat
      const [ketQuaDon] = await conn.execute<ResultSetHeader>(
        `INSERT INTO don_dat (
           ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
           tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan, trang_thai_thanh_toan,
           nguon_don, ghi_chu, het_han_luc
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'UNPAID', 'APP', ?, ?)`,
        [
          maDonDat,
          nguoiDung.id,
          courtId,
          bookingDate,
          startTime,
          endTime,
          courtAmount,
          status,
          paymentMethod,
          note || null,
          hetHanLuc,
        ]
      );
      const bookingId = ketQuaDon.insertId;

      // BR-04: Khóa các khung giờ trong chi tiết (bắt ER_DUP_ENTRY -> 409 SLOT_TAKEN)
      for (const slot of slotsKemGia) {
        try {
          await conn.execute(
            `INSERT INTO chi_tiet_khung_gio_dat (don_dat_id, san_id, ngay_dat, khung_gio_id, gia, dang_khoa)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [bookingId, courtId, bookingDate, slot.timeSlotId, slot.price]
          );
        } catch (loi: any) {
          if (loi && loi.code === 'ER_DUP_ENTRY') {
            throw LoiApi.xungDot('Khung giờ đã có người đặt', 'SLOT_TAKEN');
          }
          throw loi;
        }
      }

      // Ghi nhật ký trạng thái SYS-02
      await ghiNhatKyTrangThai(conn, bookingId, null, status, nguoiDung.id, 'Khách hàng tạo đơn từ ứng dụng');

      const paymentInfo =
        paymentMethod === 'BANK_TRANSFER' && status === 'PENDING'
          ? {
              bankName: MOI_TRUONG.BANK_NAME,
              accountNo: MOI_TRUONG.BANK_ACCOUNT_NO,
              accountName: MOI_TRUONG.BANK_ACCOUNT_NAME,
              amount: courtAmount,
              transferContent: maDonDat,
            }
          : null;

      return {
        id: bookingId,
        bookingCode: maDonDat,
        court: { id: courtId, name: sanInfo.name, courtTypeName: sanInfo.court_type_name },
        bookingDate,
        startTime: catGio(startTime),
        endTime: catGio(endTime),
        slots: slotsKemGia,
        courtAmount,
        serviceAmount: 0,
        grandTotal: courtAmount,
        status,
        paymentMethod,
        paymentStatus: 'UNPAID',
        source: 'APP',
        expiresAt: expiresAtIso,
        note: note || null,
        customer: { id: nguoiDung.id, name: nguoiDung.fullName, phone: nguoiDung.phone },
        canCancel: true,
        canOrderService: status === 'CONFIRMED',
        closedWithDebt: false,
        createdAt: dinhDangIso(new Date()),
        paymentInfo,
      };
    });
  }

  /** CUS-08: Lấy danh sách đơn của tôi (lọc nhiều trạng thái cách nhau dấu phẩy) */
  static async layDanhSachDonCuaToi(nguoiDungId: number, chuoiTrangThai?: string) {
    let sql = `
      SELECT dd.id, dd.ma_don_dat AS booking_code, dd.san_id AS court_id, s.ten AS court_name,
             ls.ten AS court_type_name, dd.ngay_dat AS booking_date,
             dd.gio_bat_dau AS start_time, dd.gio_ket_thuc AS end_time,
             dd.tien_san AS court_amount, dd.tien_dich_vu AS service_amount,
             dd.tien_san + dd.tien_dich_vu AS grand_total,
             dd.trang_thai AS status, dd.phuong_thuc_thanh_toan AS payment_method,
             dd.trang_thai_thanh_toan AS payment_status, dd.nguon_don AS source,
             dd.het_han_luc AS expires_at, dd.ngay_tao AS created_at
      FROM don_dat dd
      JOIN san s ON s.id = dd.san_id
      JOIN loai_san ls ON ls.id = s.loai_san_id
      WHERE dd.nguoi_dung_id = ?
    `;
    const params: any[] = [nguoiDungId];

    if (chuoiTrangThai) {
      const danhSach = chuoiTrangThai.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      if (danhSach.length > 0) {
        const ph = danhSach.map(() => '?').join(',');
        sql += ` AND dd.trang_thai IN (${ph})`;
        params.push(...danhSach);
      }
    }

    sql += ' ORDER BY dd.id DESC';
    const [danhSach] = await pool.execute<RowDataPacket[]>(sql, params);
    return chuyenCamel(danhSach);
  }

  /** CUS-07 / 08: Chi tiết đơn của tôi (khách chỉ xem đơn của mình -> 404 nếu không khớp) */
  static async layChiTietDonCuaToi(nguoiDung: NguoiDungXacThuc, donId: number) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      `SELECT dd.id, dd.ma_don_dat AS booking_code, dd.san_id AS court_id, s.ten AS court_name,
              ls.ten AS court_type_name, dd.ngay_dat AS booking_date,
              dd.gio_bat_dau AS start_time, dd.gio_ket_thuc AS end_time,
              dd.tien_san AS court_amount, dd.tien_dich_vu AS service_amount,
              dd.tien_san + dd.tien_dich_vu AS grand_total,
              dd.dong_don_cong_no AS closed_with_debt,
              dd.trang_thai AS status, dd.phuong_thuc_thanh_toan AS payment_method,
              dd.trang_thai_thanh_toan AS payment_status, dd.nguon_don AS source,
              dd.ghi_chu AS note, dd.het_han_luc AS expires_at, dd.ngay_tao AS created_at,
              dd.nguoi_dung_id, u.ho_ten AS customer_name, u.so_dien_thoai AS customer_phone
       FROM don_dat dd
       JOIN san s ON s.id = dd.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       WHERE dd.id = ? LIMIT 1`,
      [donId]
    );

    if (danhSach.length === 0) throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
    const don = danhSach[0];

    // Khách chỉ được xem đơn của mình
    if (nguoiDung.role === 'CUSTOMER' && Number(don.nguoi_dung_id) !== nguoiDung.id) {
      throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
    }

    // Lấy danh sách khung giờ
    const [slots] = await pool.execute<RowDataPacket[]>(
      `SELECT ctkg.khung_gio_id AS time_slot_id, kg.gio_bat_dau AS start_time, kg.gio_ket_thuc AS end_time, ctkg.gia AS price
       FROM chi_tiet_khung_gio_dat ctkg
       JOIN khung_gio kg ON kg.id = ctkg.khung_gio_id
       WHERE ctkg.don_dat_id = ?
       ORDER BY kg.gio_bat_dau`,
      [donId]
    );

    // Kiểm tra có dịch vụ DELIVERED không
    const [dvDelivered] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'DELIVERED' LIMIT 1",
      [donId]
    );
    const coDichVuDaGiao = dvDelivered.length > 0;

    // Tính canCancel
    let canCancel = false;
    if (['PENDING', 'CONFIRMED'].includes(don.status)) {
      if (nguoiDung.role === 'STAFF' || nguoiDung.role === 'ADMIN') {
        canCancel = !coDichVuDaGiao;
      } else {
        const thoiDiemBatDau = thoiDiemTu(don.booking_date, don.start_time);
        const chenhLechGio = (thoiDiemBatDau.getTime() - Date.now()) / (1000 * 60 * 60);
        canCancel = chenhLechGio >= NGHIEP_VU.SO_GIO_HAN_HUY && !coDichVuDaGiao;
      }
    }

    // canOrderService: CONFIRMED và chưa qua giờ kết thúc
    const thoiDiemKetThuc = thoiDiemTu(don.booking_date, don.end_time);
    const canOrderService = don.status === 'CONFIRMED' && Date.now() < thoiDiemKetThuc.getTime();

    // Payment info
    const paymentInfo =
      don.status === 'PENDING' && don.payment_method === 'BANK_TRANSFER'
        ? {
            bankName: MOI_TRUONG.BANK_NAME,
            accountNo: MOI_TRUONG.BANK_ACCOUNT_NO,
            accountName: MOI_TRUONG.BANK_ACCOUNT_NAME,
            amount: Number(don.court_amount),
            transferContent: don.booking_code,
          }
        : null;

    return {
      id: don.id,
      bookingCode: don.booking_code,
      court: { id: don.court_id, name: don.court_name, courtTypeName: don.court_type_name },
      bookingDate: don.booking_date,
      startTime: catGio(don.start_time),
      endTime: catGio(don.end_time),
      slots: chuyenCamel(slots),
      courtAmount: Number(don.court_amount),
      serviceAmount: Number(don.service_amount),
      grandTotal: Number(don.grand_total),
      status: don.status,
      paymentMethod: don.payment_method,
      paymentStatus: don.payment_status,
      source: don.source,
      expiresAt: don.expires_at ? `${don.expires_at.replace(' ', 'T')}+07:00` : null,
      note: don.note || null,
      customer: { id: don.nguoi_dung_id, name: don.customer_name, phone: don.customer_phone },
      canCancel,
      canOrderService,
      closedWithDebt: Boolean(don.closed_with_debt),
      createdAt: `${don.created_at.replace(' ', 'T')}+07:00`,
      paymentInfo,
    };
  }

  /**
   * CUS-09 / 5.5: Khách hàng hủy đơn đặt sân (BR-09, BR-10, BR-29, BR-34)
   */
  static async huyDonBoiKhach(nguoiDung: NguoiDungXacThuc, donId: number, duLieu: { reason?: string | null; refundInfo?: string | null }) {
    const { reason, refundInfo } = duLieu;

    return voiGiaoDich(async (conn) => {
      const [danhSach] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM don_dat WHERE id = ? FOR UPDATE',
        [donId]
      );
      if (danhSach.length === 0) throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
      const don = danhSach[0];

      if (don.nguoi_dung_id !== nguoiDung.id) {
        throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
      }

      if (!['PENDING', 'CONFIRMED'].includes(don.trang_thai)) {
        throw LoiApi.xungDot(`Không thể hủy đơn đang ở trạng thái ${don.trang_thai}`, 'INVALID_STATUS');
      }

      // BR-09: Khách phải hủy trước giờ bắt đầu >= 6 tiếng
      const thoiDiemBatDau = thoiDiemTu(don.ngay_dat, don.gio_bat_dau);
      const chenhLechGio = (thoiDiemBatDau.getTime() - Date.now()) / (1000 * 60 * 60);
      if (chenhLechGio < NGHIEP_VU.SO_GIO_HAN_HUY) {
        throw LoiApi.khongXuLyDuoc(
          `Đã quá hạn tự hủy đơn (phải trước giờ bắt đầu ít nhất ${NGHIEP_VU.SO_GIO_HAN_HUY} tiếng)`,
          'CANCEL_DEADLINE_PASSED'
        );
      }

      // BR-29: Chặn hủy nếu đã có yêu cầu dịch vụ DELIVERED
      const [dvDelivered] = await conn.execute<RowDataPacket[]>(
        "SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'DELIVERED' LIMIT 1",
        [donId]
      );
      if (dvDelivered.length > 0) {
        throw LoiApi.xungDot('Đơn đã có dịch vụ đã giao, không thể hủy đơn sân', 'HAS_DELIVERED_SERVICES');
      }

      // BR-34: Nếu đơn đã PAID thì khách bắt buộc phải nhập refundInfo
      if (don.trang_thai_thanh_toan === 'PAID' && (!refundInfo || refundInfo.trim().length === 0)) {
        throw LoiApi.khongXuLyDuoc('Vui lòng nhập thông tin nhận tiền hoàn', 'REFUND_INFO_REQUIRED');
      }

      // 1. Cập nhật don_dat
      await conn.execute(
        `UPDATE don_dat SET trang_thai = 'CANCELLED', huy_luc = NOW(), ly_do_huy = ? WHERE id = ? AND trang_thai = ?`,
        [reason || 'Khách hàng hủy trên ứng dụng', donId, don.trang_thai]
      );

      // 2. Nhả slot (dang_khoa = NULL)
      await conn.execute('UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?', [donId]);

      // 3. Tự động hủy các yêu cầu dịch vụ REQUESTED
      await conn.execute(
        `UPDATE yeu_cau_dich_vu SET trang_thai = 'CANCELLED', huy_luc = NOW(), ly_do_huy = 'Hủy tự động theo đơn sân'
         WHERE don_dat_id = ? AND trang_thai = 'REQUESTED'`,
        [donId]
      );

      // 4. BR-10 & BR-34: Nếu đã PAID, tạo thanh_toan REFUND PENDING
      let refundPending = false;
      if (don.trang_thai_thanh_toan === 'PAID') {
        await conn.execute(
          `INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, ghi_chu)
           VALUES (?, 'REFUND', 'COURT', ?, ?, 'PENDING', ?)`,
          [donId, don.phuong_thuc_thanh_toan, don.tien_san, refundInfo ? refundInfo.trim() : null]
        );
        refundPending = true;
      }

      // 5. Ghi nhật ký trạng thái
      await ghiNhatKyTrangThai(conn, donId, don.trang_thai, 'CANCELLED', nguoiDung.id, reason || 'Khách hủy đơn');

      return {
        id: donId,
        bookingCode: don.ma_don_dat,
        status: 'CANCELLED',
        refundPending,
      };
    });
  }

  /** CUS-10 / 5.10: Đánh giá sân sau khi đơn COMPLETED (BR-13) */
  static async danhGiaDonDat(nguoiDungId: number, donId: number, soSao: number, comment?: string | null) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, nguoi_dung_id, trang_thai FROM don_dat WHERE id = ? LIMIT 1',
      [donId]
    );
    if (danhSach.length === 0) throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
    const don = danhSach[0];

    if (don.nguoi_dung_id !== nguoiDungId) throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
    if (don.trang_thai !== 'COMPLETED') {
      throw LoiApi.khongXuLyDuoc('Chỉ có thể đánh giá sau khi hoàn thành buổi chơi', 'BOOKING_NOT_COMPLETED');
    }

    const [daDanhGia] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM danh_gia WHERE don_dat_id = ? LIMIT 1',
      [donId]
    );
    if (daDanhGia.length > 0) {
      throw LoiApi.xungDot('Đơn đặt này đã được đánh giá', 'ALREADY_REVIEWED');
    }

    const [ketQua]: any = await pool.execute(
      'INSERT INTO danh_gia (don_dat_id, nguoi_dung_id, so_sao, nhan_xet) VALUES (?, ?, ?, ?)',
      [donId, nguoiDungId, soSao, comment || null]
    );

    return { id: ketQua.insertId, rating: Number(soSao), comment: comment || null, message: 'Đánh giá sân thành công' };
  }

  /** CUS-10: Xem danh sách đánh giá của sân */
  static async layDanhSachDanhGiaCuaSan(sanId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [tongRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(dg.id) AS tong FROM danh_gia dg JOIN don_dat dd ON dd.id = dg.don_dat_id WHERE dd.san_id = ?',
      [sanId]
    );
    const total = Number(tongRows[0].tong);

    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT dg.id, dg.so_sao AS rating, dg.nhan_xet AS comment, dg.ngay_tao AS created_at,
              u.ho_ten AS customer_name
       FROM danh_gia dg
       JOIN don_dat dd ON dd.id = dg.don_dat_id
       JOIN nguoi_dung u ON u.id = dg.nguoi_dung_id
       WHERE dd.san_id = ?
       ORDER BY dg.id DESC
       LIMIT ? OFFSET ?`,
      [sanId, limit, offset]
    );

    return { items: chuyenCamel(items), page, limit, total };
  }
}

export const donDatService = {
  layLichTrongSan: (sanId: number, ngay: string) => DonDatService.layLichTrongSan(sanId, ngay),
  layDanhGiaSan: (sanId: number, page?: number, limit?: number) => DonDatService.layDanhSachDanhGiaCuaSan(sanId, page, limit),
  taoDonDat: (nguoiDung: any, duLieu: any) => {
    const user = typeof nguoiDung === 'object' ? nguoiDung : { id: nguoiDung, role: 'CUSTOMER' };
    return DonDatService.taoDonDat(user, duLieu);
  },
  layDonCuaToi: (nguoiDungId: number, tuyChon: any) => DonDatService.layDanhSachDonCuaToi(nguoiDungId, tuyChon),
  layChiTietDon: (nguoiDungId: number, donId: number) =>
    DonDatService.layChiTietDonCuaToi({ id: nguoiDungId, role: 'CUSTOMER' } as any, donId),
  layChiTietDonNhanVien: (donId: number) =>
    DonDatService.layChiTietDonCuaToi({ id: 0, role: 'STAFF' } as any, donId),
  huyDonBoiKhach: (nguoiDung: any, donId: number, duLieu: any) => {
    const user = typeof nguoiDung === 'object' ? nguoiDung : { id: nguoiDung, role: 'CUSTOMER' };
    return DonDatService.huyDonBoiKhach(user, donId, duLieu);
  },
  danhGiaDonDat: (nguoiDungId: number, donId: number, duLieu: any) =>
    DonDatService.danhGiaDonDat(
      nguoiDungId,
      donId,
      duLieu.rating ?? duLieu.soSao,
      duLieu.comment ?? duLieu.nhanXet
    ),
};
