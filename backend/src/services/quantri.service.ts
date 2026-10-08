// =====================================================================
// SERVICE QUẢN TRỊ — Quản lý danh mục, giá, tài khoản, đóng đơn công nợ
// Đáp ứng: plant/06-api.md mục 4.4, 5.10, 5.12, 5.18, 5.21, 5.22; BR-05, BR-19, BR-33
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { csdl } from '../config/csdl';
import { voiGiaoDich } from '../utils/giaodich';
import { LoiApi } from '../utils/loi';
import { chuyenCamel } from '../utils/chuyendoicamel';
import { bamMatKhau } from '../utils/matkhau';
import { ghiNhatKyTrangThai } from '../utils/nhatky';
import { taoHoaDon } from '../utils/hoadon';
import { layNgayHomNay, layGioHienTai } from '../utils/thoigian';

export class QuanTriService {
  // ===================================================================
  // 1. QUẢN LÝ LOẠI SÂN (ADM-01)
  // ===================================================================
  async layDanhSachLoaiSan() {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ten AS name, phan_loai AS category, mo_ta AS description,
              hoat_dong AS is_active, ngay_tao AS created_at
       FROM loai_san ORDER BY id ASC`
    );
    return chuyenCamel<any[]>(rows).map((r: any) => ({
      ...r,
      isActive: Boolean(r.isActive),
    }));
  }

  async taoLoaiSan(duLieu: { name: string; category?: 'SPORT' | 'EVENT'; description?: string | null }) {
    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO loai_san (ten, phan_loai, mo_ta, hoat_dong) VALUES (?, ?, ?, 1)`,
      [duLieu.name, duLieu.category || 'SPORT', duLieu.description || null]
    );

    return {
      id: res.insertId,
      name: duLieu.name,
      category: duLieu.category || 'SPORT',
      description: duLieu.description || null,
      isActive: true,
    };
  }

  async capNhatLoaiSan(id: number, duLieu: { name?: string; category?: 'SPORT' | 'EVENT'; description?: string | null }) {
    const fields: string[] = [];
    const params: any[] = [];

    if (duLieu.name !== undefined) {
      fields.push('ten = ?');
      params.push(duLieu.name);
    }
    if (duLieu.category !== undefined) {
      fields.push('phan_loai = ?');
      params.push(duLieu.category);
    }
    if (duLieu.description !== undefined) {
      fields.push('mo_ta = ?');
      params.push(duLieu.description);
    }

    if (fields.length === 0) {
      throw LoiApi.yeuCauSai('Không có thông tin cần cập nhật');
    }

    params.push(id);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE loai_san SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy loại sân');
    return { success: true, message: 'Cập nhật loại sân thành công' };
  }

  async batTatLoaiSan(id: number) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT hoat_dong FROM loai_san WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy loại sân');

    const trangThaiMoi = rows[0].hoat_dong ? 0 : 1;
    await csdl.execute(`UPDATE loai_san SET hoat_dong = ? WHERE id = ?`, [trangThaiMoi, id]);

    return { id, isActive: Boolean(trangThaiMoi) };
  }

  // ===================================================================
  // 2. QUẢN LÝ SÂN (ADM-02, spec 5.12, BR-05)
  // ===================================================================
  async layDanhSachSan() {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT s.id, s.ten AS name, s.mo_ta AS description, s.hinh_anh AS image_url,
              s.suc_chua AS capacity, s.trang_thai AS status, s.ngay_tao AS created_at,
              ls.id AS court_type_id, ls.ten AS court_type_name, ls.phan_loai AS category,
              COALESCE(AVG(dg.so_sao), 0) AS average_rating,
              COUNT(dg.id) AS total_reviews
       FROM san s
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN don_dat dd ON dd.san_id = s.id
       LEFT JOIN danh_gia dg ON dg.don_dat_id = dd.id
       GROUP BY s.id
       ORDER BY s.id ASC`
    );

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.image_url,
      capacity: r.capacity !== null ? Number(r.capacity) : null,
      status: r.status,
      createdAt: r.created_at,
      courtType: {
        id: r.court_type_id,
        name: r.court_type_name,
        category: r.category,
      },
      rating: {
        average: Number(Number(r.average_rating).toFixed(1)),
        total: Number(r.total_reviews),
      },
    }));
  }

  async taoSan(duLieu: {
    courtTypeId: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    capacity?: number | null;
  }) {
    const [loaiSanRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id FROM loai_san WHERE id = ?`,
      [duLieu.courtTypeId]
    );
    if (loaiSanRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy loại sân');

    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO san (loai_san_id, ten, mo_ta, hinh_anh, suc_chua, trang_thai)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        duLieu.courtTypeId,
        duLieu.name,
        duLieu.description || null,
        duLieu.imageUrl || null,
        duLieu.capacity || null,
      ]
    );

    return {
      id: res.insertId,
      ...duLieu,
      status: 'ACTIVE',
    };
  }

  async capNhatSan(
    id: number,
    duLieu: {
      courtTypeId?: number;
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
      capacity?: number | null;
    }
  ) {
    const [hienTaiRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, loai_san_id, ten FROM san WHERE id = ?`,
      [id]
    );
    if (hienTaiRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy sân');
    const hienTai = hienTaiRows[0];

    // Nghiệp vụ: Chuyển đổi mục đích sử dụng sân (đổi loai_san_id)
    if (duLieu.courtTypeId !== undefined && duLieu.courtTypeId !== hienTai.loai_san_id) {
      const [loaiMoi] = await csdl.execute<RowDataPacket[]>(
        `SELECT id, ten FROM loai_san WHERE id = ?`,
        [duLieu.courtTypeId]
      );
      if (loaiMoi.length === 0) throw LoiApi.khongTimThay('Không tìm thấy loại sân mới');

      // Chặn đổi mục đích sử dụng nếu sân còn đơn đặt trong tương lai
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();

      const [futureRows] = await csdl.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total
         FROM don_dat
         WHERE san_id = ?
           AND trang_thai IN ('CONFIRMED', 'PENDING')
           AND (ngay_dat > ? OR (ngay_dat = ? AND gio_ket_thuc > ?))`,
        [id, ngayHienTaiStr, ngayHienTaiStr, gioHienTaiStr]
      );

      const futureCount = Number(futureRows[0].total);
      if (futureCount > 0) {
        throw new LoiApi(
          409,
          'COURT_HAS_FUTURE_BOOKINGS',
          `Sân hiện đang có ${futureCount} đơn đặt trong tương lai, không thể chuyển đổi mục đích sử dụng sân`,
          null,
          { futureBookings: futureCount }
        );
      }
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (duLieu.courtTypeId !== undefined) {
      fields.push('loai_san_id = ?');
      params.push(duLieu.courtTypeId);
    }
    if (duLieu.name !== undefined) {
      fields.push('ten = ?');
      params.push(duLieu.name);
    }
    if (duLieu.description !== undefined) {
      fields.push('mo_ta = ?');
      params.push(duLieu.description);
    }
    if (duLieu.imageUrl !== undefined) {
      fields.push('hinh_anh = ?');
      params.push(duLieu.imageUrl);
    }
    if (duLieu.capacity !== undefined) {
      fields.push('suc_chua = ?');
      params.push(duLieu.capacity);
    }

    if (fields.length === 0) throw LoiApi.yeuCauSai('Không có thông tin cần cập nhật');

    params.push(id);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE san SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy sân');
    return { success: true, message: 'Chuyển đổi mục đích sử dụng sân thành công' };
  }

  async doiTrangThaiSan(id: number, status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE') {
    if (status !== 'ACTIVE') {
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();

      const [futureRows] = await csdl.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total
         FROM don_dat
         WHERE san_id = ?
           AND trang_thai IN ('CONFIRMED', 'PENDING')
           AND (ngay_dat > ? OR (ngay_dat = ? AND gio_ket_thuc > ?))`,
        [id, ngayHienTaiStr, ngayHienTaiStr, gioHienTaiStr]
      );

      const futureCount = Number(futureRows[0].total);
      if (futureCount > 0) {
        throw new LoiApi(
          409,
          'COURT_HAS_FUTURE_BOOKINGS',
          `Sân hiện đang có ${futureCount} đơn đặt trong tương lai, không thể chuyển trạng thái`,
          null,
          { futureBookings: futureCount }
        );
      }
    }

    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE san SET trang_thai = ? WHERE id = ?`,
      [status, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy sân');
    return { id, status };
  }

  // ===================================================================
  // 3. KHUNG GIỜ & BẢNG GIÁ (ADM-03, ADM-04, spec 5.10)
  // ===================================================================
  async layDanhSachKhungGio() {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, TIME_FORMAT(gio_bat_dau, '%H:%i') AS start_time,
              TIME_FORMAT(gio_ket_thuc, '%H:%i') AS end_time,
              hoat_dong AS is_active
       FROM khung_gio ORDER BY gio_bat_dau ASC`
    );

    return chuyenCamel<any[]>(rows).map((r: any) => ({
      ...r,
      isActive: Boolean(r.isActive),
    }));
  }

  async taoKhungGio(duLieu: { startTime: string; endTime: string }) {
    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO khung_gio (gio_bat_dau, gio_ket_thuc, hoat_dong) VALUES (?, ?, 1)`,
      [duLieu.startTime, duLieu.endTime]
    );

    return {
      id: res.insertId,
      startTime: duLieu.startTime,
      endTime: duLieu.endTime,
      isActive: true,
    };
  }

  async capNhatKhungGio(id: number, duLieu: { startTime: string; endTime: string }) {
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE khung_gio SET gio_bat_dau = ?, gio_ket_thuc = ? WHERE id = ?`,
      [duLieu.startTime, duLieu.endTime, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy khung giờ');
    return { id, ...duLieu };
  }

  async batTatKhungGio(id: number) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT hoat_dong FROM khung_gio WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy khung giờ');

    const trangThaiMoi = rows[0].hoat_dong ? 0 : 1;
    await csdl.execute(`UPDATE khung_gio SET hoat_dong = ? WHERE id = ?`, [trangThaiMoi, id]);

    return { id, isActive: Boolean(trangThaiMoi) };
  }

  async layMaTranGia(courtTypeId: number) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT kg.id AS time_slot_id,
              TIME_FORMAT(kg.gio_bat_dau, '%H:%i') AS start_time,
              TIME_FORMAT(kg.gio_ket_thuc, '%H:%i') AS end_time,
              kg.hoat_dong AS is_active,
              g_wd.gia AS weekday_price,
              g_we.gia AS weekend_price
       FROM khung_gio kg
       LEFT JOIN gia_khung_gio g_wd ON g_wd.khung_gio_id = kg.id
            AND g_wd.loai_san_id = ? AND g_wd.loai_ngay = 'WEEKDAY'
       LEFT JOIN gia_khung_gio g_we ON g_we.khung_gio_id = kg.id
            AND g_we.loai_san_id = ? AND g_we.loai_ngay = 'WEEKEND'
       ORDER BY kg.gio_bat_dau ASC`,
      [courtTypeId, courtTypeId]
    );

    return chuyenCamel<any[]>(rows).map((r: any) => ({
      ...r,
      isActive: Boolean(r.isActive),
      weekdayPrice: r.weekdayPrice !== null ? Number(r.weekdayPrice) : null,
      weekendPrice: r.weekendPrice !== null ? Number(r.weekendPrice) : null,
    }));
  }

  async capNhatGiaHangLoat(
    courtTypeId: number,
    prices: Array<{ timeSlotId: number; dayType: 'WEEKDAY' | 'WEEKEND'; price: number }>
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      let count = 0;
      for (const item of prices) {
        await ketNoi.execute(
          `INSERT INTO gia_khung_gio (loai_san_id, khung_gio_id, loai_ngay, gia)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE gia = VALUES(gia)`,
          [courtTypeId, item.timeSlotId, item.dayType, item.price]
        );
        count++;
      }

      return { affectedRows: count };
    });
  }

  // ===================================================================
  // 4. QUẢN LÝ NHÂN VIÊN (ADM-05, BR-19)
  // ===================================================================
  async layDanhSachNhanVien() {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ho_ten AS full_name, so_dien_thoai AS phone, email,
              trang_thai AS status, ngay_tao AS created_at
       FROM nguoi_dung WHERE vai_tro = 'STAFF' ORDER BY id DESC`
    );
    return chuyenCamel<any[]>(rows);
  }

  async taoNhanVien(duLieu: { fullName: string; phone: string; password: string; email?: string | null }) {
    const [tonTai] = await csdl.execute<RowDataPacket[]>(
      `SELECT id FROM nguoi_dung WHERE so_dien_thoai = ? LIMIT 1`,
      [duLieu.phone]
    );
    if (tonTai.length > 0) throw new LoiApi(409, 'PHONE_EXISTS', 'Số điện thoại đã được đăng ký');

    const băm = await bamMatKhau(duLieu.password);
    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO nguoi_dung (ho_ten, so_dien_thoai, mat_khau_hash, email, vai_tro, trang_thai)
       VALUES (?, ?, ?, ?, 'STAFF', 'ACTIVE')`,
      [duLieu.fullName, duLieu.phone, băm, duLieu.email || null]
    );

    return {
      id: res.insertId,
      fullName: duLieu.fullName,
      phone: duLieu.phone,
      email: duLieu.email || null,
      role: 'STAFF',
      status: 'ACTIVE',
    };
  }

  async capNhatNhanVien(id: number, duLieu: { fullName?: string; email?: string | null; phone?: string }) {
    const fields: string[] = [];
    const params: any[] = [];

    if (duLieu.fullName !== undefined) {
      fields.push('ho_ten = ?');
      params.push(duLieu.fullName);
    }
    if (duLieu.email !== undefined) {
      fields.push('email = ?');
      params.push(duLieu.email);
    }
    if (duLieu.phone !== undefined) {
      const [tonTai] = await csdl.execute<RowDataPacket[]>(
        `SELECT id FROM nguoi_dung WHERE so_dien_thoai = ? AND id != ? LIMIT 1`,
        [duLieu.phone, id]
      );
      if (tonTai.length > 0) throw new LoiApi(409, 'PHONE_EXISTS', 'Số điện thoại đã được sử dụng bởi tài khoản khác');
      fields.push('so_dien_thoai = ?');
      params.push(duLieu.phone);
    }

    if (fields.length === 0) throw LoiApi.yeuCauSai('Không có thông tin cần cập nhật');

    params.push(id);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE nguoi_dung SET ${fields.join(', ')} WHERE id = ? AND vai_tro = 'STAFF'`,
      params
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy nhân viên');
    return { success: true, message: 'Cập nhật nhân viên thành công' };
  }

  async doiTrangThaiNhanVien(adminId: number, id: number, status: 'ACTIVE' | 'LOCKED') {
    if (adminId === id) {
      throw new LoiApi(409, 'CANNOT_LOCK_SELF', 'Không thể tự khóa tài khoản của chính mình');
    }

    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE nguoi_dung SET trang_thai = ? WHERE id = ? AND vai_tro = 'STAFF'`,
      [status, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy nhân viên');
    return { id, status };
  }

  async datLaiMatKhauNhanVien(id: number, matKhauMoi: string) {
    const băm = await bamMatKhau(matKhauMoi);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE nguoi_dung SET mat_khau_hash = ? WHERE id = ? AND vai_tro = 'STAFF'`,
      [băm, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy nhân viên');
    return { success: true, message: 'Đặt lại mật khẩu nhân viên thành công' };
  }

  // ===================================================================
  // 5. QUẢN LÝ KHÁCH HÀNG (ADM-06, spec 5.22)
  // ===================================================================
  async layDanhSachKhachHang(page: number = 1, limit: number = 20, keyword?: string) {
    const curPage = Math.max(1, page);
    const curLimit = Math.min(100, Math.max(1, limit));
    const offset = (curPage - 1) * curLimit;

    let whereSql = `WHERE vai_tro = 'CUSTOMER'`;
    const params: any[] = [];

    if (keyword) {
      const kw = `%${keyword.trim()}%`;
      whereSql += ` AND (ho_ten LIKE ? OR so_dien_thoai LIKE ? OR email LIKE ?)`;
      params.push(kw, kw, kw);
    }

    const [countRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tong FROM nguoi_dung ${whereSql}`,
      params
    );
    const total = Number(countRows[0].tong);

    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, ho_ten AS full_name, so_dien_thoai AS phone, email,
              trang_thai AS status, ngay_tao AS created_at
       FROM nguoi_dung ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, curLimit, offset]
    );

    return {
      items: chuyenCamel<any[]>(rows),
      page: curPage,
      limit: curLimit,
      total,
    };
  }

  async doiTrangThaiKhachHang(id: number, status: 'ACTIVE' | 'LOCKED') {
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE nguoi_dung SET trang_thai = ? WHERE id = ? AND vai_tro = 'CUSTOMER'`,
      [status, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy khách hàng');
    return { id, status };
  }

  async datLaiMatKhauKhachHang(id: number, matKhauMoi: string) {
    const băm = await bamMatKhau(matKhauMoi);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE nguoi_dung SET mat_khau_hash = ? WHERE id = ? AND vai_tro = 'CUSTOMER'`,
      [băm, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy khách hàng');
    return { success: true, message: 'Đã đặt lại mật khẩu cho khách hàng' };
  }

  // ===================================================================
  // 6. ĐÓNG ĐƠN CÔNG NỢ (ADM-09, spec 5.21, BR-33)
  // ===================================================================
  async dongDonCongNo(adminId: number, donDatId: number, lyDo: string) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai, trang_thai_thanh_toan, ngay_dat, gio_bat_dau, ghi_chu
         FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      const don = donRows[0];

      if (!['CONFIRMED', 'CHECKED_IN'].includes(don.trang_thai)) {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Chỉ có thể đóng đơn công nợ khi đơn ở trạng thái CONFIRMED hoặc CHECKED_IN (hiện tại: ${don.trang_thai})`
        );
      }

      // Phải đến hoặc qua giờ bắt đầu
      const ngayHienTaiStr = layNgayHomNay();
      const gioHienTaiStr = layGioHienTai();
      const gioBatDauStr = (don.gio_bat_dau as string).substring(0, 5);

      if (don.ngay_dat > ngayHienTaiStr || (don.ngay_dat === ngayHienTaiStr && gioBatDauStr > gioHienTaiStr)) {
        throw new LoiApi(422, 'TOO_EARLY', 'Chưa đến giờ bắt đầu đặt sân');
      }

      // Cập nhật đơn: COMPLETED, dong_don_cong_no = 1
      const ghiChuMoi = don.ghi_chu ? `${don.ghi_chu} [ĐÓNG CÔNG NỢ: ${lyDo}]` : `[ĐÓNG CÔNG NỢ: ${lyDo}]`;

      await ketNoi.execute(
        `UPDATE don_dat
         SET trang_thai = 'COMPLETED',
             dong_don_cong_no = 1,
             ghi_chu = ?
         WHERE id = ?`,
        [ghiChuMoi, donDatId]
      );

      // Giải phóng slot (dang_khoa = NULL)
      await ketNoi.execute(
        `UPDATE chi_tiet_khung_gio_dat SET dang_khoa = NULL WHERE don_dat_id = ?`,
        [donDatId]
      );

      await ghiNhatKyTrangThai(ketNoi, {
        donDatId,
        trangThaiCu: don.trang_thai,
        trangThaiMoi: 'COMPLETED',
        thayDoiBoiId: adminId,
        ghiChu: `ADMIN đóng đơn có công nợ: ${lyDo}`,
      });

      // Trả về hóa đơn đầy đủ
      return await taoHoaDon(ketNoi, donDatId);
    });
  }

  // ===================================================================
  // 7. QUẢN LÝ DỊCH VỤ ADMIN (ADM-08, spec 5.18)
  // ===================================================================
  async taoDichVu(duLieu: {
    name: string;
    type: 'DRINK' | 'RENTAL' | 'PACKAGE';
    unit: string;
    price: number;
    description?: string | null;
    imageUrl?: string | null;
  }) {
    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO dich_vu (ten, phan_loai, don_vi_tinh, don_gia, mo_ta, hinh_anh, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [
        duLieu.name,
        duLieu.type,
        duLieu.unit,
        duLieu.price,
        duLieu.description || null,
        duLieu.imageUrl || null,
      ]
    );

    // Khởi tạo bản ghi tồn kho tương ứng
    await csdl.execute(
      `INSERT INTO ton_kho_dich_vu (dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao)
       VALUES (?, 0, 0, 5)
       ON DUPLICATE KEY UPDATE id = id`,
      [res.insertId]
    );

    return {
      id: res.insertId,
      ...duLieu,
      status: 'ACTIVE',
    };
  }

  async capNhatDichVu(
    id: number,
    duLieu: {
      name?: string;
      type?: 'DRINK' | 'RENTAL' | 'PACKAGE';
      unit?: string;
      price?: number;
      description?: string | null;
      imageUrl?: string | null;
    }
  ) {
    const fields: string[] = [];
    const params: any[] = [];

    if (duLieu.name !== undefined) {
      fields.push('ten = ?');
      params.push(duLieu.name);
    }
    if (duLieu.type !== undefined) {
      fields.push('phan_loai = ?');
      params.push(duLieu.type);
    }
    if (duLieu.unit !== undefined) {
      fields.push('don_vi_tinh = ?');
      params.push(duLieu.unit);
    }
    if (duLieu.price !== undefined) {
      fields.push('don_gia = ?');
      params.push(duLieu.price);
    }
    if (duLieu.description !== undefined) {
      fields.push('mo_ta = ?');
      params.push(duLieu.description);
    }
    if (duLieu.imageUrl !== undefined) {
      fields.push('hinh_anh = ?');
      params.push(duLieu.imageUrl);
    }

    if (fields.length === 0) throw LoiApi.yeuCauSai('Không có thông tin cần cập nhật');

    params.push(id);
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE dich_vu SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy dịch vụ');
    return { success: true, message: 'Cập nhật dịch vụ thành công' };
  }

  async doiTrangThaiDichVu(id: number, status: 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE') {
    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE dich_vu SET trang_thai = ? WHERE id = ?`,
      [status, id]
    );

    if (res.affectedRows === 0) throw LoiApi.khongTimThay('Không tìm thấy dịch vụ');
    return { id, status };
  }
}

export const quanTriService = new QuanTriService();
