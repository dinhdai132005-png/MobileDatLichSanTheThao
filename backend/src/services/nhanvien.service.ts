// =====================================================================
// SERVICE NHÂN VIÊN — Nghiệp vụ tại quầy, lịch trực, xử lý đơn, hoàn tiền
// Đáp ứng: plant/06-api.md mục 4.3, 5.6 -> 5.9, 5.20, 5.23; BR-02 -> BR-31
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { csdl } from '../config/csdl';
import { voiGiaoDich } from '../utils/giaodich';
import { LoiApi } from '../utils/loi';
import { chuyenCamel } from '../utils/chuyendoicamel';
import { taoMaDonDat, layNgayHomNay, layGioHienTai } from '../utils/thoigian';
import { ghiNhatKyTrangThai } from '../utils/nhatky';
import { taoHoaDon, layDoThueChuaTra, laySoTienDaThu } from '../utils/hoadon';
import { DichVuService } from './dichvu.service';

export class NhanVienService {
  /**
   * STF-02: Dashboard số liệu hôm nay
   */
  async layDashboard(ngayHomNay: string) {
    // Thời điểm hiện tại (UTC+7)
    const ngayHienTaiStr = layNgayHomNay();
    const gioHienTaiStr = layGioHienTai() + ':00';

    // 1. Thống kê đơn theo trạng thái hôm nay
    const [thongKeDon] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_bookings,
         SUM(CASE WHEN trang_thai = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_bookings,
         SUM(CASE WHEN trang_thai = 'CHECKED_IN' THEN 1 ELSE 0 END) AS checked_in_bookings,
         SUM(CASE WHEN trang_thai = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_bookings,
         SUM(CASE WHEN trang_thai = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings,
         SUM(CASE WHEN trang_thai = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show_bookings,
         SUM(CASE WHEN trang_thai = 'PENDING' AND het_han_luc > NOW() THEN 1 ELSE 0 END) AS pending_hold,
         SUM(CASE WHEN trang_thai = 'PENDING' AND het_han_luc < NOW() THEN 1 ELSE 0 END) AS overdue_pending
       FROM don_dat
       WHERE ngay_dat = ?`,
      [ngayHomNay]
    );

    // 2. Doanh thu thu được hôm nay (theo ngày thanh toán thực tế hôm nay)
    const [doanhThu] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_revenue,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_revenue,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' THEN so_tien ELSE 0 END), 0) AS total_revenue
       FROM thanh_toan
       WHERE DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) = ?`,
      [ngayHomNay]
    );

    // 3. Số đồ thuê chưa trả và yêu cầu dịch vụ đang chờ giao
    const [doThueChuaTra] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       WHERE yc.trang_thai = 'DELIVERED' AND dv.phan_loai = 'RENTAL' AND ct.tra_luc IS NULL`
    );

    const [yeuCauChoGiao] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM yeu_cau_dich_vu yc
       JOIN don_dat dd ON dd.id = yc.don_dat_id
       WHERE yc.trang_thai = 'REQUESTED' AND dd.ngay_dat = ?`,
      [ngayHomNay]
    );

    // 4. Số đơn quá giờ chưa xử lý (STF-02, TC-63, Query 7.13: CONFIRMED đã qua giờ kết thúc)
    const [donQuaGio] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT dd.id) AS total
       FROM don_dat dd
       WHERE dd.trang_thai = 'CONFIRMED'
         AND (dd.ngay_dat < ? OR (dd.ngay_dat = ? AND dd.gio_ket_thuc < ?))`,
      [ngayHienTaiStr, ngayHienTaiStr, gioHienTaiStr]
    );

    // 5. Số khoản hoàn tiền chờ xử lý (REFUND PENDING)
    const [hoanTienCho] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM thanh_toan
       WHERE loai_giao_dich = 'REFUND' AND trang_thai = 'PENDING'`
    );

    const tk = thongKeDon[0];
    const dt = doanhThu[0];

    const tongDon = Number(tk.total_bookings || 0);
    const donXacNhan = Number(tk.confirmed_bookings || 0);
    const donHoanThanh = Number(tk.completed_bookings || 0);
    const doanhThuTong = Number(dt.total_revenue || 0);
    const pendingHoldCount = Number(tk.pending_hold || 0);
    const pendingRefundCount = Number(hoanTienCho[0].total || 0);
    const overdueBookingsCount = Number(donQuaGio[0].total || 0);
    const pendingServiceOrdersCount = Number(yeuCauChoGiao[0].total || 0);
    const unreturnedRentalsCount = Number(doThueChuaTra[0].total || 0);

    return {
      date: ngayHomNay,
      bookings: {
        total: tongDon,
        confirmed: donXacNhan,
        checkedIn: Number(tk.checked_in_bookings || 0),
        completed: donHoanThanh,
        cancelled: Number(tk.cancelled_bookings || 0),
        noShow: Number(tk.no_show_bookings || 0),
        overduePending: Number(tk.overdue_pending || 0),
        pendingHold: pendingHoldCount,
      },
      revenue: {
        court: Number(dt.court_revenue || 0),
        service: Number(dt.service_revenue || 0),
        total: doanhThuTong,
      },
      unreturnedRentals: unreturnedRentalsCount,
      pendingServiceOrders: pendingServiceOrdersCount,
      overdueBookings: overdueBookingsCount,
      pendingRefunds: pendingRefundCount,

      // Các trường alias phục vụ Web Admin và tương thích ngược
      tongDonHomNay: tongDon,
      donDaXacNhan: donXacNhan,
      donHoanThanh: donHoanThanh,
      doanhThuHomNay: doanhThuTong,
      soDonChoThanhToan: pendingHoldCount,
      soDonChoHoanTien: pendingRefundCount,
      soDonQuaGio: overdueBookingsCount,
      soYeuCauDichVuChoGiao: pendingServiceOrdersCount,
      soDoThueChuaTra: unreturnedRentalsCount,
    };
  }

  /**
   * STF-03: Lịch lưới sân theo ngày (spec 5.8)
   */
  async layLichLuoi(ngay: string) {
    // Lấy tất cả khung giờ hoạt động
    const [khungGioRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, TIME_FORMAT(gio_bat_dau, '%H:%i') AS start_time, TIME_FORMAT(gio_ket_thuc, '%H:%i') AS end_time
       FROM khung_gio WHERE hoat_dong = 1 ORDER BY gio_bat_dau ASC`
    );

    // Lấy tất cả sân hoạt động
    const [sanRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT s.id, s.ten AS court_name, ls.ten AS court_type_name, s.trang_thai AS status
       FROM san s
       JOIN loai_san ls ON ls.id = s.loai_san_id
       WHERE s.trang_thai != 'INACTIVE'
       ORDER BY s.loai_san_id ASC, s.id ASC`
    );

    // Lấy tất cả các slot đã được đặt trong ngày
    const [slotDatRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT ct.san_id, ct.khung_gio_id, dd.id AS booking_id, dd.ma_don_dat,
              dd.trang_thai, dd.trang_thai_thanh_toan,
              COALESCE(u.ho_ten, dd.ten_khach) AS customer_name,
              COALESCE(u.so_dien_thoai, dd.so_dien_thoai_khach) AS customer_phone
       FROM chi_tiet_khung_gio_dat ct
       JOIN don_dat dd ON dd.id = ct.don_dat_id
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       WHERE ct.ngay_dat = ? AND ct.dang_khoa = 1`,
      [ngay]
    );

    const slotMap = new Map<string, any>();
    for (const row of slotDatRows) {
      const key = `${row.san_id}_${row.khung_gio_id}`;
      slotMap.set(key, {
        id: row.booking_id,
        bookingCode: row.ma_don_dat,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        status: row.trang_thai,
        paymentStatus: row.trang_thai_thanh_toan,
      });
    }

    const timeSlots = chuyenCamel<any[]>(khungGioRows);

    const courts = sanRows.map((san: any) => {
      const slots = timeSlots.map((kg: any) => {
        const key = `${san.id}_${kg.id}`;
        const b = slotMap.get(key);
        return {
          timeSlotId: kg.id,
          status: b ? 'BOOKED' : 'AVAILABLE',
          bookingId: b ? b.id : null,
          bookingCode: b ? b.bookingCode : null,
          customerName: b ? b.customerName : null,
          customerPhone: b ? b.customerPhone : null,
          bookingStatus: b ? b.status : null,
          paymentStatus: b ? b.paymentStatus : null,
          booking: b || null,
        };
      });

      return {
        id: san.id,
        courtId: san.id,
        name: san.court_name,
        courtName: san.court_name,
        courtTypeName: san.court_type_name,
        status: san.status,
        slots,
      };
    });

    return {
      date: ngay,
      timeSlots,
      courts,
    };
  }

  /**
   * STF-05: Lịch trống của sân theo quy tắc nhân viên (spec 5.3)
   * Slot chỉ là PAST khi đã kết thúc (end_time <= now), cho phép chọn giờ đang diễn ra.
   */
  async layLichTrongNhanVien(sanId: number, ngay: string) {
    // 1. Kiểm tra sân
    const [sanRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT s.id, s.ten, s.trang_thai, ls.id AS loai_san_id, ls.ten AS loai_san_ten
       FROM san s
       JOIN loai_san ls ON ls.id = s.loai_san_id
       WHERE s.id = ?`,
      [sanId]
    );

    if (sanRows.length === 0) {
      throw LoiApi.khongTimThay('Không tìm thấy sân thể thao');
    }

    const san = sanRows[0];

    // Xác định thứ trong tuần
    const ngayDatObj = new Date(`${ngay}T00:00:00+07:00`);
    const thu = ngayDatObj.getDay();
    const loaiNgay = thu === 0 || thu === 6 ? 'WEEKEND' : 'WEEKDAY';

    // 2. Lấy danh sách khung giờ và giá
    const [khungGioRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT kg.id, TIME_FORMAT(kg.gio_bat_dau, '%H:%i') AS start_time,
              TIME_FORMAT(kg.gio_ket_thuc, '%H:%i') AS end_time,
              gkg.gia AS price
       FROM khung_gio kg
       LEFT JOIN gia_khung_gio gkg ON gkg.khung_gio_id = kg.id
            AND gkg.loai_san_id = ? AND gkg.loai_ngay = ?
       WHERE kg.hoat_dong = 1
       ORDER BY kg.gio_bat_dau ASC`,
      [san.loai_san_id, loaiNgay]
    );

    // 3. Lấy các slot đã bị khóa
    const [slotDaDatRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT khung_gio_id FROM chi_tiet_khung_gio_dat
       WHERE san_id = ? AND ngay_dat = ? AND dang_khoa = 1`,
      [sanId, ngay]
    );
    const setSlotDaDat = new Set<number>(slotDaDatRows.map((r: any) => r.khung_gio_id));

    // Thời điểm hiện tại (UTC+7)
    const ngayHienTaiStr = layNgayHomNay();
    const gioHienTaiStr = layGioHienTai();

    const slots = khungGioRows.map((kg: any) => {
      let status: 'AVAILABLE' | 'BOOKED' | 'PAST' | 'MAINTENANCE' | 'NO_PRICE' = 'AVAILABLE';

      if (san.trang_thai === 'MAINTENANCE') {
        status = 'MAINTENANCE';
      } else if (setSlotDaDat.has(kg.id)) {
        status = 'BOOKED';
      } else if (ngay < ngayHienTaiStr || (ngay === ngayHienTaiStr && kg.end_time <= gioHienTaiStr)) {
        // Quy tắc nhân viên: chỉ là PAST khi end_time <= now
        status = 'PAST';
      } else if (kg.price === null || kg.price === undefined) {
        status = 'NO_PRICE';
      }

      return {
        timeSlotId: kg.id,
        startTime: kg.start_time,
        endTime: kg.end_time,
        price: kg.price !== null ? Number(kg.price) : null,
        status,
      };
    });

    return {
      courtId: san.id,
      courtName: san.ten,
      courtTypeName: san.loai_san_ten,
      courtStatus: san.trang_thai,
      date: ngay,
      dayType: loaiNgay,
      slots,
    };
  }

  /**
   * STF-04: Danh sách đơn đặt cho nhân viên
   */
  async layDanhSachDon(tuyChon: {
    date?: string;
    courtId?: number;
    status?: string;
    paymentStatus?: string;
    keyword?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, tuyChon.page || 1);
    const limit = Math.min(100, Math.max(1, tuyChon.limit || 20));
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (tuyChon.date) {
      whereSql += ' AND dd.ngay_dat = ?';
      params.push(tuyChon.date);
    }

    if (tuyChon.courtId) {
      whereSql += ' AND dd.san_id = ?';
      params.push(tuyChon.courtId);
    }

    if (tuyChon.status) {
      const cacTrangThai = tuyChon.status.split(',').map((s) => s.trim());
      whereSql += ` AND dd.trang_thai IN (${cacTrangThai.map(() => '?').join(',')})`;
      params.push(...cacTrangThai);
    }

    if (tuyChon.paymentStatus) {
      whereSql += ' AND dd.trang_thai_thanh_toan = ?';
      params.push(tuyChon.paymentStatus);
    }

    if (tuyChon.keyword) {
      const kw = `%${tuyChon.keyword.trim()}%`;
      whereSql += ` AND (dd.ma_don_dat LIKE ? OR u.ho_ten LIKE ? OR u.so_dien_thoai LIKE ? OR dd.ten_khach LIKE ? OR dd.so_dien_thoai_khach LIKE ?)`;
      params.push(kw, kw, kw, kw, kw);
    }

    if (tuyChon.overdue) {
      // BR-33 & TC-63 & STF-04: Đơn CONFIRMED đã qua giờ kết thúc
      const ngayHienTai = layNgayHomNay();
      const gioHienTai = layGioHienTai() + ':00';
      whereSql += ` AND dd.trang_thai = 'CONFIRMED' AND (dd.ngay_dat < ? OR (dd.ngay_dat = ? AND dd.gio_ket_thuc < ?))`;
      params.push(ngayHienTai, ngayHienTai, gioHienTai);
    }

    // Đếm tổng số
    const [countRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tong
       FROM don_dat dd
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0].tong);

    // Lấy dữ liệu
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT dd.id, dd.ma_don_dat AS booking_code, dd.ngay_dat AS booking_date,
              TIME_FORMAT(dd.gio_bat_dau, '%H:%i') AS start_time,
              TIME_FORMAT(dd.gio_ket_thuc, '%H:%i') AS end_time,
              dd.tien_san AS court_amount, dd.tien_dich_vu AS service_amount,
              (dd.tien_san + dd.tien_dich_vu) AS grand_total,
              dd.trang_thai AS status, dd.phuong_thuc_thanh_toan AS payment_method,
              dd.trang_thai_thanh_toan AS payment_status, dd.nguon_don AS source,
              dd.het_han_luc AS expires_at, dd.ghi_chu AS note, dd.ngay_tao AS created_at,
              dd.dong_don_cong_no AS closed_with_debt,
              s.id AS court_id, s.ten AS court_name, ls.ten AS court_type_name,
              u.id AS customer_id,
              COALESCE(u.ho_ten, dd.ten_khach) AS customer_name,
              COALESCE(u.so_dien_thoai, dd.so_dien_thoai_khach) AS customer_phone
       FROM don_dat dd
       JOIN san s ON s.id = dd.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       ${whereSql}
       ORDER BY dd.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const items = rows.map((r: any) => ({
      id: r.id,
      bookingCode: r.booking_code,
      courtId: r.court_id,
      courtName: r.court_name,
      courtTypeName: r.court_type_name,
      court: {
        id: r.court_id,
        name: r.court_name,
        courtTypeName: r.court_type_name,
      },
      bookingDate: r.booking_date,
      startTime: r.start_time,
      endTime: r.end_time,
      courtAmount: Number(r.court_amount),
      serviceAmount: Number(r.service_amount),
      grandTotal: Number(r.grand_total),
      status: r.status,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      source: r.source,
      expiresAt: r.expires_at,
      note: r.note,
      createdAt: r.created_at,
      closedWithDebt: Boolean(r.closed_with_debt),
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customer: {
        id: r.customer_id,
        name: r.customer_name,
        phone: r.customer_phone,
      },
    }));

    return { items, page, limit, total };
  }

  /**
   * STF-05: Đặt sân tại quầy (spec 5.6)
   */
  async datSanTaiQuay(
    nhanVienId: number,
    duLieu: {
      courtId: number;
      bookingDate: string;
      timeSlotIds: number[];
      customerId?: number | null;
      guestName?: string | null;
      guestPhone?: string | null;
      payNow: boolean;
      paymentMethod: 'CASH' | 'BANK_TRANSFER';
      note?: string | null;
    }
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      // 1. Kiểm tra sân
      const [sanRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT s.id, s.ten, s.trang_thai, ls.id AS loai_san_id, ls.ten AS loai_san_ten
         FROM san s JOIN loai_san ls ON ls.id = s.loai_san_id WHERE s.id = ?`,
        [duLieu.courtId]
      );
      if (sanRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy sân');
      const san = sanRows[0];
      if (san.trang_thai !== 'ACTIVE') {
        throw new LoiApi(422, 'COURT_NOT_BOOKABLE', 'Sân hiện không ở trạng thái hoạt động');
      }

      // 2. Xác định ngày đặt và loại ngày
      const ngayDatObj = new Date(`${duLieu.bookingDate}T00:00:00+07:00`);
      const thu = ngayDatObj.getDay();
      const loaiNgay = thu === 0 || thu === 6 ? 'WEEKEND' : 'WEEKDAY';

      // 3. Lấy thông tin các khung giờ
      const placeholders = duLieu.timeSlotIds.map(() => '?').join(',');
      const [khungGioRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT kg.id, TIME_FORMAT(kg.gio_bat_dau, '%H:%i') AS start_time,
                TIME_FORMAT(kg.gio_ket_thuc, '%H:%i') AS end_time,
                gkg.gia AS price
         FROM khung_gio kg
         LEFT JOIN gia_khung_gio gkg ON gkg.khung_gio_id = kg.id
              AND gkg.loai_san_id = ? AND gkg.loai_ngay = ?
         WHERE kg.id IN (${placeholders}) AND kg.hoat_dong = 1
         ORDER BY kg.gio_bat_dau ASC`,
        [san.loai_san_id, loaiNgay, ...duLieu.timeSlotIds]
      );

      if (khungGioRows.length !== duLieu.timeSlotIds.length) {
        throw new LoiApi(422, 'SLOT_NOT_FOUND', 'Có khung giờ không hợp lệ hoặc đã ngừng hoạt động');
      }

      // Kiểm tra giá cấu hình
      for (const kg of khungGioRows) {
        if (kg.price === null || kg.price === undefined) {
          throw new LoiApi(422, 'PRICE_NOT_CONFIGURED', `Khung giờ ${kg.start_time} - ${kg.end_time} chưa cấu hình giá`);
        }
      }

      // Kiểm tra slot không được là quá khứ theo quy tắc nhân viên: end_time <= now
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();

      if (duLieu.bookingDate < ngayHienTaiStr) {
        throw new LoiApi(422, 'SLOT_IN_PAST', 'Không thể đặt ngày trong quá khứ');
      }

      if (duLieu.bookingDate === ngayHienTaiStr) {
        for (const kg of khungGioRows) {
          if (kg.end_time <= gioHienTaiStr) {
            throw new LoiApi(422, 'SLOT_IN_PAST', `Khung giờ ${kg.start_time} - ${kg.end_time} đã kết thúc`);
          }
        }
      }

      // Kiểm tra tính liên tục
      for (let i = 0; i < khungGioRows.length - 1; i++) {
        if (khungGioRows[i].end_time !== khungGioRows[i + 1].start_time) {
          throw new LoiApi(422, 'SLOTS_NOT_CONSECUTIVE', 'Các khung giờ chọn phải liên tục nhau');
        }
      }

      // 4. Khóa slot chống trùng (BR-04, uq_slot_dang_khoa)
      const [trungRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT khung_gio_id FROM chi_tiet_khung_gio_dat
         WHERE san_id = ? AND ngay_dat = ? AND khung_gio_id IN (${placeholders}) AND dang_khoa = 1`,
        [duLieu.courtId, duLieu.bookingDate, ...duLieu.timeSlotIds]
      );
      if (trungRows.length > 0) {
        throw new LoiApi(409, 'SLOT_TAKEN', 'Khung giờ đã có người đặt');
      }

      // Tính tổng tiền sân
      const tongTienSan = khungGioRows.reduce((acc, kg) => acc + Number(kg.price), 0);
      const gioBatDau = khungGioRows[0].start_time;
      const gioKetThuc = khungGioRows[khungGioRows.length - 1].end_time;
      const maDonDat = taoMaDonDat();

      const trangThai = 'CONFIRMED';
      const trangThaiThanhToan = duLieu.payNow ? 'PAID' : 'UNPAID';

      // 5. Tạo đơn đặt
      const [resDon] = await ketNoi.execute<ResultSetHeader>(
        `INSERT INTO don_dat (
           ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
           tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan,
           trang_thai_thanh_toan, nguon_don, ghi_chu,
           ten_khach, so_dien_thoai_khach, nguoi_tao_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'STAFF', ?, ?, ?, ?)`,
        [
          maDonDat,
          duLieu.customerId || null,
          duLieu.courtId,
          duLieu.bookingDate,
          gioBatDau,
          gioKetThuc,
          tongTienSan,
          trangThai,
          duLieu.paymentMethod,
          trangThaiThanhToan,
          duLieu.note || null,
          duLieu.guestName || null,
          duLieu.guestPhone || null,
          nhanVienId,
        ]
      );
      const donDatId = resDon.insertId;

      // 6. Ghi chi tiết khung giờ đặt (kèm dang_khoa = 1)
      for (const kg of khungGioRows) {
        await ketNoi.execute(
          `INSERT INTO chi_tiet_khung_gio_dat (
             don_dat_id, san_id, ngay_dat, khung_gio_id, gia, dang_khoa
           ) VALUES (?, ?, ?, ?, ?, 1)`,
          [donDatId, duLieu.courtId, duLieu.bookingDate, kg.id, Number(kg.price)]
        );
      }

      // 7. Nếu payNow = true: tạo bản ghi thanh toán
      if (duLieu.payNow) {
        await ketNoi.execute(
          `INSERT INTO thanh_toan (
             don_dat_id, loai_giao_dich, muc_dich, phuong_thuc,
             so_tien, trang_thai, nguoi_xu_ly_id, ngay_xu_ly
           ) VALUES (?, 'PAYMENT', 'COURT', ?, ?, 'SUCCESS', ?, NOW())`,
          [donDatId, duLieu.paymentMethod, tongTienSan, nhanVienId]
        );
      }

      // 8. Ghi nhật ký trạng thái
      await ghiNhatKyTrangThai(ketNoi, {
        donDatId,
        trangThaiCu: null,
        trangThaiMoi: 'CONFIRMED',
        thayDoiBoiId: nhanVienId,
        ghiChu: `Nhân viên đặt tại quầy${duLieu.payNow ? ' (Đã thanh toán)' : ''}`,
      });

      // Lấy thông tin khách hàng
      let customer = {
        id: duLieu.customerId || null,
        name: duLieu.guestName || '',
        phone: duLieu.guestPhone || '',
      };
      if (duLieu.customerId) {
        const [userRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, ho_ten, so_dien_thoai FROM nguoi_dung WHERE id = ?`,
          [duLieu.customerId]
        );
        if (userRows.length > 0) {
          customer = {
            id: userRows[0].id,
            name: userRows[0].ho_ten,
            phone: userRows[0].so_dien_thoai,
          };
        }
      }

      return {
        id: donDatId,
        bookingCode: maDonDat,
        court: {
          id: san.id,
          name: san.ten,
          courtTypeName: san.loai_san_ten,
        },
        bookingDate: duLieu.bookingDate,
        startTime: gioBatDau,
        endTime: gioKetThuc,
        slots: khungGioRows.map((kg) => ({
          timeSlotId: kg.id,
          startTime: kg.start_time,
          endTime: kg.end_time,
          price: Number(kg.price),
        })),
        courtAmount: tongTienSan,
        serviceAmount: 0,
        grandTotal: tongTienSan,
        status: trangThai,
        paymentMethod: duLieu.paymentMethod,
        paymentStatus: trangThaiThanhToan,
        source: 'STAFF',
        expiresAt: null,
        note: duLieu.note || null,
        customer,
        canCancel: false,
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * STF-06: Ghi nhận thanh toán tiền sân (spec 5.7)
   */
  async ghiNhanThanhToanTienSan(
    nhanVienId: number,
    donDatId: number,
    duLieu: { method: 'CASH' | 'BANK_TRANSFER'; transactionRef?: string | null }
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, ma_don_dat, nguoi_dung_id, trang_thai, trang_thai_thanh_toan, tien_san
         FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      const don = donRows[0];

      if (don.trang_thai_thanh_toan === 'PAID') {
        throw new LoiApi(409, 'ALREADY_PAID', 'Tiền sân của đơn này đã được thanh toán');
      }

      if (['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(don.trang_thai)) {
        throw new LoiApi(409, 'INVALID_STATUS', `Không thể thanh toán cho đơn ở trạng thái ${don.trang_thai}`);
      }

      const trangThaiMoi = don.trang_thai === 'PENDING' ? 'CONFIRMED' : don.trang_thai;

      // Cập nhật trạng thái thanh toán và trạng thái đơn nếu từ PENDING lên CONFIRMED
      await ketNoi.execute(
        `UPDATE don_dat
         SET trang_thai_thanh_toan = 'PAID', trang_thai = ?, het_han_luc = NULL
         WHERE id = ?`,
        [trangThaiMoi, donDatId]
      );

      // Thêm bản ghi thanh toán
      await ketNoi.execute(
        `INSERT INTO thanh_toan (
           don_dat_id, loai_giao_dich, muc_dich, phuong_thuc,
           so_tien, trang_thai, ma_giao_dich, nguoi_xu_ly_id, ngay_xu_ly
         ) VALUES (?, 'PAYMENT', 'COURT', ?, ?, 'SUCCESS', ?, ?, NOW())`,
        [donDatId, duLieu.method, don.tien_san, duLieu.transactionRef || null, nhanVienId]
      );

      if (don.trang_thai === 'PENDING') {
        await ghiNhatKyTrangThai(ketNoi, {
          donDatId,
          trangThaiCu: 'PENDING',
          trangThaiMoi: 'CONFIRMED',
          thayDoiBoiId: nhanVienId,
          ghiChu: 'Nhân viên xác nhận thanh toán tiền sân',
        });
      }

      // Lấy lịch sử thanh toán
      const [payments] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, loai_giao_dich AS type, muc_dich AS purpose, phuong_thuc AS method,
                so_tien AS amount, trang_thai AS status, ma_giao_dich AS transaction_ref,
                ngay_xu_ly AS processed_at
         FROM thanh_toan WHERE don_dat_id = ? ORDER BY id ASC`,
        [donDatId]
      );

      return {
        id: donDatId,
        bookingCode: don.ma_don_dat,
        status: trangThaiMoi,
        paymentStatus: 'PAID',
        payments: chuyenCamel<any[]>(payments).map((p) => ({ ...p, amount: Number(p.amount) })),
      };
    });
  }

  /**
   * STF-07: Hoàn thành đơn đặt (BR-12, BR-28)
   */
  async hoanThanhDon(nhanVienId: number, donDatId: number) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai, trang_thai_thanh_toan, ngay_dat, gio_bat_dau, tien_san, tien_dich_vu
         FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      const don = donRows[0];

      if (!['CONFIRMED', 'CHECKED_IN'].includes(don.trang_thai)) {
        throw new LoiApi(409, 'INVALID_STATUS', `Chỉ có thể hoàn thành đơn ở trạng thái CONFIRMED hoặc CHECKED_IN (hiện tại: ${don.trang_thai})`);
      }

      // Tiền sân phải PAID
      if (don.trang_thai_thanh_toan !== 'PAID') {
        throw new LoiApi(422, 'NOT_PAID', 'Tiền sân chưa được thanh toán');
      }

      // Phải đến hoặc qua giờ bắt đầu (BR-12)
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();
      const gioBatDauStr = (don.gio_bat_dau as string).substring(0, 5);

      if (don.ngay_dat > ngayHienTaiStr || (don.ngay_dat === ngayHienTaiStr && gioBatDauStr > gioHienTaiStr)) {
        throw new LoiApi(422, 'TOO_EARLY', 'Chưa đến giờ bắt đầu sử dụng sân, không thể hoàn thành đơn');
      }

      // Kiểm tra BR-28:
      // 1. Không còn yêu cầu dịch vụ nào ở trạng thái REQUESTED
      const [ycDangCho] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'REQUESTED'`,
        [donDatId]
      );
      if (Number(ycDangCho[0].total) > 0) {
        throw new LoiApi(422, 'HAS_PENDING_SERVICE_ORDERS', 'Còn yêu cầu dịch vụ đang chờ giao');
      }

      // 2. Không còn đồ thuê chưa trả
      const doThueChuaTra = await layDoThueChuaTra(ketNoi, donDatId);
      if (doThueChuaTra.length > 0) {
        throw new LoiApi(422, 'RENTALS_NOT_RETURNED', 'Còn đồ thuê chưa được trả');
      }

      // 3. Số dư dịch vụ phải thanh toán xong (serviceBalance <= 0)
      const { servicePaid } = await laySoTienDaThu(ketNoi, donDatId);
      const serviceAmount = Number(don.tien_dich_vu);
      if (serviceAmount > servicePaid) {
        throw new LoiApi(422, 'SERVICE_BALANCE_DUE', 'Còn tiền dịch vụ chưa thanh toán');
      }

      // Cập nhật trạng thái đơn thành COMPLETED và giải phóng slot (dang_khoa = NULL)
      await ketNoi.execute(
        `UPDATE don_dat SET trang_thai = 'COMPLETED' WHERE id = ?`,
        [donDatId]
      );

      await ketNoi.execute(
        `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`,
        [donDatId]
      );

      await ghiNhatKyTrangThai(ketNoi, {
        donDatId,
        trangThaiCu: don.trang_thai,
        trangThaiMoi: 'COMPLETED',
        thayDoiBoiId: nhanVienId,
        ghiChu: 'Nhân viên xác nhận hoàn thành đơn đặt',
      });

      return { success: true, status: 'COMPLETED', message: 'Hoàn thành đơn đặt thành công' };
    });
  }

  /**
   * STF-07: Đánh dấu khách vắng mặt - No-show (BR-12, BR-29)
   */
  async danhDauNoShow(nhanVienId: number, donDatId: number) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai, ngay_dat, gio_bat_dau FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      const don = donRows[0];

      if (don.trang_thai !== 'CONFIRMED') {
        throw new LoiApi(409, 'INVALID_STATUS', `Chỉ có thể đánh dấu No-show cho đơn CONFIRMED (hiện tại: ${don.trang_thai})`);
      }

      // Phải sau giờ bắt đầu
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();
      const gioBatDauStr = (don.gio_bat_dau as string).substring(0, 5);

      if (don.ngay_dat > ngayHienTaiStr || (don.ngay_dat === ngayHienTaiStr && gioBatDauStr > gioHienTaiStr)) {
        throw new LoiApi(422, 'TOO_EARLY', 'Chưa đến giờ bắt đầu đặt sân');
      }

      // Kiểm tra BR-29: không được no-show nếu đã có dịch vụ DELIVERED
      const [dvDaGiao] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'DELIVERED'`,
        [donDatId]
      );
      if (Number(dvDaGiao[0].total) > 0) {
        throw new LoiApi(409, 'HAS_DELIVERED_SERVICES', 'Không thể đánh dấu No-show vì đơn đã có dịch vụ đã giao');
      }

      // Cập nhật trạng thái NO_SHOW và giải phóng slot
      await ketNoi.execute(
        `UPDATE don_dat SET trang_thai = 'NO_SHOW' WHERE id = ?`,
        [donDatId]
      );

      await ketNoi.execute(
        `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`,
        [donDatId]
      );

      await ghiNhatKyTrangThai(ketNoi, {
        donDatId,
        trangThaiCu: 'CONFIRMED',
        trangThaiMoi: 'NO_SHOW',
        thayDoiBoiId: nhanVienId,
        ghiChu: 'Nhân viên đánh dấu khách vắng mặt (No-show)',
      });

      return { success: true, message: 'Đã đánh dấu khách vắng mặt (No-show)' };
    });
  }

  /**
   * STF-08: Nhân viên hủy thay khách (spec 5.5, BR-10, BR-29, BR-34)
   */
  async huyThayKhach(
    nhanVienId: number,
    donDatId: number,
    duLieu: { reason: string; refundInfo?: string | null }
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, ma_don_dat, nguoi_dung_id, trang_thai, trang_thai_thanh_toan, tien_san
         FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      const don = donRows[0];

      if (!['PENDING', 'CONFIRMED'].includes(don.trang_thai)) {
        throw new LoiApi(409, 'INVALID_STATUS', `Không thể hủy đơn ở trạng thái ${don.trang_thai}`);
      }

      // BR-29: Kiểm tra dịch vụ đã giao
      const [dvDaGiao] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'DELIVERED'`,
        [donDatId]
      );
      if (Number(dvDaGiao[0].total) > 0) {
        throw new LoiApi(409, 'HAS_DELIVERED_SERVICES', 'Không thể hủy đơn vì đã có dịch vụ đã giao');
      }

      // Giải phóng slot
      await ketNoi.execute(
        `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`,
        [donDatId]
      );

      // Tự động hủy các yêu cầu dịch vụ REQUESTED và giải phóng tồn kho
      await DichVuService.giaiPhongTonKhoDonHuy(
        ketNoi,
        donDatId,
        nhanVienId,
        duLieu.reason ? `Nhân viên hủy đơn: ${duLieu.reason}` : 'Nhân viên hủy đơn'
      );

      let refundPending = false;
      let trangThaiThanhToanMoi = don.trang_thai_thanh_toan;

      // Xử lý hoàn tiền nếu tiền sân đã PAID
      if (don.trang_thai_thanh_toan === 'PAID') {
        refundPending = true;
        trangThaiThanhToanMoi = 'REFUND_PENDING';

        await ketNoi.execute(
          `INSERT INTO thanh_toan (
             don_dat_id, loai_giao_dich, muc_dich, phuong_thuc,
             so_tien, trang_thai, ghi_chu
           ) VALUES (?, 'REFUND', 'COURT', 'BANK_TRANSFER', ?, 'PENDING', ?)`,
          [
            donDatId,
            don.tien_san,
            duLieu.refundInfo || `Nhân viên hủy: ${duLieu.reason}`,
          ]
        );
      }

      await ketNoi.execute(
        `UPDATE don_dat
         SET trang_thai = 'CANCELLED',
             trang_thai_thanh_toan = ?,
             ly_do_huy = ?,
             huy_luc = NOW()
         WHERE id = ?`,
        [trangThaiThanhToanMoi, duLieu.reason, donDatId]
      );

      await ghiNhatKyTrangThai(ketNoi, {
        donDatId,
        trangThaiCu: don.trang_thai,
        trangThaiMoi: 'CANCELLED',
        thayDoiBoiId: nhanVienId,
        ghiChu: `Nhân viên hủy đơn. Lý do: ${duLieu.reason}`,
      });

      return {
        id: donDatId,
        status: 'CANCELLED',
        refundPending,
      };
    });
  }

  /**
   * STF-09: Danh sách các khoản hoàn tiền (spec 5.20)
   */
  async layDanhSachHoanTien(status?: string, page: number = 1, limit: number = 20) {
    const curPage = Math.max(1, page);
    const curLimit = Math.min(100, Math.max(1, limit));
    const offset = (curPage - 1) * curLimit;

    let whereSql = `WHERE tt.loai_giao_dich = 'REFUND'`;
    const params: any[] = [];

    if (status) {
      whereSql += ` AND tt.trang_thai = ?`;
      params.push(status);
    }

    const [countRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tong FROM thanh_toan tt ${whereSql}`,
      params
    );
    const total = Number(countRows[0].tong);

    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT tt.id AS payment_id, tt.so_tien AS amount, tt.trang_thai AS status,
              tt.ghi_chu AS refund_info, tt.ngay_tao AS created_at,
              dd.id AS booking_id, dd.ma_don_dat AS booking_code, s.ten AS court_name,
              dd.ngay_dat AS booking_date,
              COALESCE(u.ho_ten, dd.ten_khach) AS customer_name,
              COALESCE(u.so_dien_thoai, dd.so_dien_thoai_khach) AS customer_phone
       FROM thanh_toan tt
       JOIN don_dat dd ON dd.id = tt.don_dat_id
       JOIN san s ON s.id = dd.san_id
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       ${whereSql}
       ORDER BY tt.id DESC
       LIMIT ? OFFSET ?`,
      [...params, curLimit, offset]
    );

    const items = rows.map((r: any) => ({
      paymentId: r.payment_id,
      amount: Number(r.amount),
      status: r.status,
      refundInfo: r.refund_info,
      createdAt: r.created_at,
      booking: {
        id: r.booking_id,
        bookingCode: r.booking_code,
        courtName: r.court_name,
        bookingDate: r.booking_date,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
      },
    }));

    return { items, page: curPage, limit: curLimit, total };
  }

  /**
   * STF-09: Xác nhận đã hoàn tiền (spec 5.20)
   */
  async xacNhanHoanTien(
    nhanVienId: number,
    paymentId: number,
    duLieu: { transactionRef?: string | null; note?: string | null }
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      const [payRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, don_dat_id, trang_thai FROM thanh_toan
         WHERE id = ? AND loai_giao_dich = 'REFUND' FOR UPDATE`,
        [paymentId]
      );

      if (payRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy giao dịch hoàn tiền');
      }

      const pay = payRows[0];
      if (pay.trang_thai !== 'PENDING') {
        throw new LoiApi(409, 'INVALID_STATUS', `Giao dịch hoàn tiền không ở trạng thái PENDING (hiện tại: ${pay.trang_thai})`);
      }

      // Cập nhật trạng thái giao dịch
      await ketNoi.execute(
        `UPDATE thanh_toan
         SET trang_thai = 'SUCCESS',
             ma_giao_dich = ?,
             ghi_chu = COALESCE(?, ghi_chu),
             nguoi_xu_ly_id = ?,
             ngay_xu_ly = NOW()
         WHERE id = ?`,
        [duLieu.transactionRef || null, duLieu.note || null, nhanVienId, paymentId]
      );

      // Cập nhật trạng thái thanh toán của đơn đặt
      await ketNoi.execute(
        `UPDATE don_dat SET trang_thai_thanh_toan = 'REFUNDED' WHERE id = ?`,
        [pay.don_dat_id]
      );

      return { success: true, message: 'Đã xác nhận hoàn tiền thành công' };
    });
  }

  /**
   * STF-10: Tìm kiếm khách hàng theo SĐT / Họ tên (spec 5.23)
   */
  async timKiemKhachHang(keyword: string) {
    const kw = `%${keyword.trim()}%`;
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ho_ten AS full_name, so_dien_thoai AS phone, trang_thai AS status
       FROM nguoi_dung
       WHERE vai_tro = 'CUSTOMER' AND (so_dien_thoai LIKE ? OR ho_ten LIKE ?)
       ORDER BY ho_ten ASC
       LIMIT 20`,
      [kw, kw]
    );

    const items = chuyenCamel<any[]>(rows);
    return { items, page: 1, limit: 20, total: items.length };
  }

  /**
   * STF-10: Chi tiết khách hàng và các đơn gần nhất
   */
  async layChiTietKhachHang(khachId: number) {
    const [userRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ho_ten AS full_name, so_dien_thoai AS phone, email,
              trang_thai AS status, ngay_tao AS created_at
       FROM nguoi_dung WHERE id = ? AND vai_tro = 'CUSTOMER' LIMIT 1`,
      [khachId]
    );

    if (userRows.length === 0) {
      throw LoiApi.khongTimThay('Không tìm thấy khách hàng');
    }

    const [recentBookings] = await csdl.execute<RowDataPacket[]>(
      `SELECT dd.id, dd.ma_don_dat AS booking_code, dd.ngay_dat AS booking_date,
              dd.trang_thai AS status, dd.tien_san AS court_amount, dd.tien_dich_vu AS service_amount,
              s.ten AS court_name
       FROM don_dat dd
       JOIN san s ON s.id = dd.san_id
       WHERE dd.nguoi_dung_id = ?
       ORDER BY dd.id DESC
       LIMIT 5`,
      [khachId]
    );

    return {
      customer: chuyenCamel<any>(userRows[0]),
      recentBookings: chuyenCamel<any[]>(recentBookings),
    };
  }
}

export const nhanVienService = new NhanVienService();
