// =====================================================================
// SERVICE DỊCH VỤ & TỒN KHO — Quản lý menu, tồn kho, biến động kho, gọi dịch vụ, giao nhận, hoàn trả
// Đáp ứng: Master Prompt mục X, XI, XII, XIII, XIV, XV, XVI, XVII; plant/06-api.md
// =====================================================================
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { csdl } from '../config/csdl';
import { voiGiaoDich } from '../utils/giaodich';
import { LoiApi } from '../utils/loi';
import { chuyenCamel } from '../utils/chuyendoicamel';
import { tinhLaiTienDichVu, layDoThueChuaTra, laySoTienDaThu, taoHoaDon } from '../utils/hoadon';

export interface TuyChonDanhSachDichVu {
  type?: 'DRINK' | 'RENTAL' | 'PACKAGE';
  status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE';
  search?: string;
  tatCaTrangThai?: boolean;
}

export interface DuLieuGoiDichVu {
  items: Array<{ serviceId: number; quantity: number }>;
  note?: string | null;
}

export interface TuyChonDanhSachTonKho {
  search?: string;
  type?: 'DRINK' | 'RENTAL' | 'PACKAGE';
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';
}

export interface TuyChonLichSuBienDongKho {
  serviceId?: number;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class DichVuService {
  /**
   * Danh mục dịch vụ (Công khai cho khách hàng)
   * Khách hàng chỉ thấy trạng thái khả dụng (isAvailable), không lộ số lượng tồn kho (Master Prompt XIV)
   */
  async layDanhSachDichVu(tuyChon: TuyChonDanhSachDichVu = {}) {
    let sql = `
      SELECT dv.id, dv.ten AS name, dv.phan_loai AS type, dv.don_vi_tinh AS unit,
             dv.don_gia AS price, dv.mo_ta AS description, dv.hinh_anh AS image_url,
             dv.trang_thai AS status, dv.ngay_tao AS created_at, dv.ngay_cap_nhat AS updated_at,
             COALESCE(tk.so_luong, 0) - COALESCE(tk.so_luong_dang_giu, 0) AS available_quantity
      FROM dich_vu dv
      LEFT JOIN ton_kho_dich_vu tk ON tk.dich_vu_id = dv.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!tuyChon.tatCaTrangThai) {
      if (tuyChon.status) {
        sql += ` AND dv.trang_thai = ?`;
        params.push(tuyChon.status);
      } else {
        // Mặc định công khai: hiển thị ACTIVE và OUT_OF_STOCK, ẩn INACTIVE
        sql += ` AND dv.trang_thai IN ('ACTIVE', 'OUT_OF_STOCK')`;
      }
    } else if (tuyChon.status) {
      sql += ` AND dv.trang_thai = ?`;
      params.push(tuyChon.status);
    }

    if (tuyChon.type) {
      sql += ` AND dv.phan_loai = ?`;
      params.push(tuyChon.type);
    }

    if (tuyChon.search) {
      sql += ` AND dv.ten LIKE ?`;
      params.push(`%${tuyChon.search.trim()}%`);
    }

    sql += ` ORDER BY dv.phan_loai ASC, dv.ten ASC`;

    const [rows] = await csdl.execute<RowDataPacket[]>(sql, params);
    return chuyenCamel<any[]>(rows).map((dv) => {
      const avail = Number(dv.availableQuantity);
      const isAvailable = dv.status === 'ACTIVE' && avail > 0;
      // Khách hàng không thấy số lượng tồn kho nội bộ (Master Prompt Section XIV)
      const { availableQuantity, ...publicDv } = dv;
      return {
        ...publicDv,
        price: Number(dv.price),
        isAvailable,
      };
    });
  }

  /**
   * Chi tiết dịch vụ theo ID
   */
  async layChiTietDichVu(dichVuId: number) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT dv.id, dv.ten AS name, dv.phan_loai AS type, dv.don_vi_tinh AS unit,
              dv.don_gia AS price, dv.mo_ta AS description, dv.hinh_anh AS image_url,
              dv.trang_thai AS status, dv.ngay_tao AS created_at, dv.ngay_cap_nhat AS updated_at,
              COALESCE(tk.so_luong, 0) - COALESCE(tk.so_luong_dang_giu, 0) AS available_quantity
       FROM dich_vu dv
       LEFT JOIN ton_kho_dich_vu tk ON tk.dich_vu_id = dv.id
       WHERE dv.id = ? LIMIT 1`,
      [dichVuId]
    );

    if (rows.length === 0) {
      throw LoiApi.khongTimThay('Không tìm thấy dịch vụ');
    }

    const dv = chuyenCamel<any>(rows[0]);
    const isAvailable = dv.status === 'ACTIVE' && Number(dv.availableQuantity) > 0;
    const { availableQuantity, ...publicDv } = dv;
    return { ...publicDv, price: Number(dv.price), isAvailable };
  }

  /**
   * Lấy danh sách tồn kho phục vụ vận hành và quản trị (STAFF & ADMIN)
   * Master Prompt Section XIV, XVII
   */
  async layDanhSachTonKho(tuyChon: TuyChonDanhSachTonKho = {}) {
    let sql = `
      SELECT tk.id, tk.dich_vu_id AS service_id, dv.ten AS service_name,
             dv.phan_loai AS type, dv.don_vi_tinh AS unit, dv.don_gia AS price,
             dv.trang_thai AS service_status,
             tk.so_luong AS quantity, tk.so_luong_dang_giu AS reserved_quantity,
             (tk.so_luong - tk.so_luong_dang_giu) AS available_quantity,
             tk.nguong_canh_bao AS threshold,
             tk.ngay_cap_nhat AS updated_at
      FROM ton_kho_dich_vu tk
      JOIN dich_vu dv ON dv.id = tk.dich_vu_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tuyChon.type) {
      sql += ` AND dv.phan_loai = ?`;
      params.push(tuyChon.type);
    }

    if (tuyChon.search) {
      sql += ` AND dv.ten LIKE ?`;
      params.push(`%${tuyChon.search.trim()}%`);
    }

    sql += ` ORDER BY dv.phan_loai ASC, dv.ten ASC`;

    const [rows] = await csdl.execute<RowDataPacket[]>(sql, params);
    const items = chuyenCamel<any[]>(rows).map((row) => {
      const quantity = Number(row.quantity);
      const reservedQuantity = Number(row.reservedQuantity);
      const availableQuantity = Number(row.availableQuantity);
      const threshold = Number(row.threshold);

      let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE' = 'IN_STOCK';
      if (row.serviceStatus === 'INACTIVE') {
        stockStatus = 'INACTIVE';
      } else if (availableQuantity <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (availableQuantity <= threshold) {
        stockStatus = 'LOW_STOCK';
      }

      return {
        ...row,
        id: row.serviceId,
        serviceId: row.serviceId,
        inventoryId: row.id,
        price: Number(row.price),
        quantity,
        reservedQuantity,
        availableQuantity,
        threshold,
        stockStatus,
      };
    });

    if (tuyChon.stockStatus) {
      return items.filter((it) => it.stockStatus === tuyChon.stockStatus);
    }

    return items;
  }

  /**
   * Lấy lịch sử giao dịch biến động tồn kho (ADMIN ONLY)
   * Master Prompt Section XIII, XIV
   */
  async layLichSuBienDongKho(tuyChon: TuyChonLichSuBienDongKho = {}) {
    const page = Math.max(1, tuyChon.page || 1);
    const limit = Math.min(100, Math.max(1, tuyChon.limit || 20));
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (tuyChon.serviceId) {
      whereSql += ' AND bdk.dich_vu_id = ?';
      params.push(tuyChon.serviceId);
    }

    if (tuyChon.type) {
      whereSql += ' AND bdk.loai_bien_dong = ?';
      params.push(tuyChon.type);
    }

    if (tuyChon.dateFrom) {
      whereSql += ' AND bdk.ngay_tao >= ?';
      params.push(`${tuyChon.dateFrom} 00:00:00`);
    }

    if (tuyChon.dateTo) {
      whereSql += ' AND bdk.ngay_tao <= ?';
      params.push(`${tuyChon.dateTo} 23:59:59`);
    }

    const [countRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM bien_dong_kho bdk ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total);

    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT bdk.id, bdk.ton_kho_dich_vu_id, bdk.dich_vu_id AS service_id,
              dv.ten AS service_name, dv.phan_loai AS service_type,
              bdk.loai_bien_dong AS type, bdk.so_luong AS quantity,
              bdk.so_luong_truoc AS quantity_before, bdk.so_luong_sau AS quantity_after,
              bdk.don_dat_id AS booking_id, dd.ma_don_dat AS booking_code,
              bdk.yeu_cau_dich_vu_id AS service_order_id,
              bdk.nguoi_thuc_hien_id AS performer_id, u.ho_ten AS performer_name,
              bdk.ghi_chu AS note, bdk.ngay_tao AS created_at
       FROM bien_dong_kho bdk
       JOIN dich_vu dv ON dv.id = bdk.dich_vu_id
       LEFT JOIN don_dat dd ON dd.id = bdk.don_dat_id
       LEFT JOIN nguoi_dung u ON u.id = bdk.nguoi_thuc_hien_id
       ${whereSql}
       ORDER BY bdk.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: chuyenCamel<any[]>(rows).map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        quantityBefore: Number(r.quantityBefore),
        quantityAfter: Number(r.quantityAfter),
      })),
      page,
      limit,
      total,
    };
  }

  /**
   * Nhập kho dịch vụ (ADMIN ONLY)
   * Master Prompt Section XIV, LVI
   */
  async nhapKho(
    adminId: number,
    duLieu: { serviceId: number; quantity: number; note?: string | null }
  ) {
    if (duLieu.quantity <= 0) {
      throw new LoiApi(400, 'VALIDATION_ERROR', 'Số lượng nhập kho phải lớn hơn 0');
    }

    return await voiGiaoDich(async (ketNoi) => {
      const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao
         FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
        [duLieu.serviceId]
      );

      if (tkRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy bản ghi tồn kho cho dịch vụ này');
      }

      // Kiểm tra trạng thái dịch vụ (chặn nhập kho cho dịch vụ đã ngưng bán)
      const [dvRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, ten, trang_thai FROM dich_vu WHERE id = ?`,
        [duLieu.serviceId]
      );
      if (dvRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy dịch vụ');
      }
      if (dvRows[0].trang_thai === 'INACTIVE') {
        throw new LoiApi(
          422,
          'SERVICE_INACTIVE',
          `Dịch vụ [${dvRows[0].ten}] đã ngưng bán, không thể nhập thêm hàng vào kho`
        );
      }

      const tk = tkRows[0];
      const soLuongTruoc = Number(tk.so_luong);
      const soLuongSau = soLuongTruoc + duLieu.quantity;

      await ketNoi.execute(
        `UPDATE ton_kho_dich_vu SET so_luong = ? WHERE id = ?`,
        [soLuongSau, tk.id]
      );

      await ketNoi.execute(
        `INSERT INTO bien_dong_kho (
           ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
           so_luong_truoc, so_luong_sau, nguoi_thuc_hien_id, ghi_chu
         ) VALUES (?, ?, 'IMPORT', ?, ?, ?, ?, ?)`,
        [
          tk.id,
          duLieu.serviceId,
          duLieu.quantity,
          soLuongTruoc,
          soLuongSau,
          adminId,
          duLieu.note || 'Nhập thêm hàng vào kho',
        ]
      );

      return {
        serviceId: duLieu.serviceId,
        quantity: soLuongSau,
        quantityBefore: soLuongTruoc,
        quantityAfter: soLuongSau,
        importedQuantity: duLieu.quantity,
        availableQuantity: soLuongSau - Number(tk.so_luong_dang_giu),
      };
    });
  }

  /**
   * Điều chỉnh tăng/giảm kho (ADMIN ONLY)
   * Master Prompt Section XIV, LVI
   */
  async dieuChinhKho(
    adminId: number,
    duLieu: {
      serviceId: number;
      type: 'ADJUST_IN' | 'ADJUST_OUT';
      quantity: number;
      reason: string;
    }
  ) {
    if (duLieu.quantity <= 0) {
      throw new LoiApi(400, 'VALIDATION_ERROR', 'Số lượng điều chỉnh phải lớn hơn 0');
    }

    return await voiGiaoDich(async (ketNoi) => {
      const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao
         FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
        [duLieu.serviceId]
      );

      if (tkRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy bản ghi tồn kho cho dịch vụ này');
      }

      // Kiểm tra trạng thái dịch vụ (chặn điều chỉnh kho cho dịch vụ đã ngưng bán)
      const [dvRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, ten, trang_thai FROM dich_vu WHERE id = ?`,
        [duLieu.serviceId]
      );
      if (dvRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy dịch vụ');
      }
      if (dvRows[0].trang_thai === 'INACTIVE') {
        throw new LoiApi(
          422,
          'SERVICE_INACTIVE',
          `Dịch vụ [${dvRows[0].ten}] đã ngưng bán, không thể điều chỉnh tồn kho`
        );
      }

      const tk = tkRows[0];
      const soLuongTruoc = Number(tk.so_luong);
      const soLuongDangGiu = Number(tk.so_luong_dang_giu);
      let soLuongSau = soLuongTruoc;

      if (duLieu.type === 'ADJUST_IN') {
        soLuongSau = soLuongTruoc + duLieu.quantity;
      } else if (duLieu.type === 'ADJUST_OUT') {
        const khaDung = soLuongTruoc - soLuongDangGiu;
        if (khaDung < duLieu.quantity) {
          throw new LoiApi(
            422,
            'INSUFFICIENT_STOCK',
            `Số lượng khả dụng không đủ để điều chỉnh giảm kho (khả dụng: ${khaDung}, yêu cầu giảm: ${duLieu.quantity})`
          );
        }
        soLuongSau = soLuongTruoc - duLieu.quantity;
      }

      await ketNoi.execute(
        `UPDATE ton_kho_dich_vu SET so_luong = ? WHERE id = ?`,
        [soLuongSau, tk.id]
      );

      await ketNoi.execute(
        `INSERT INTO bien_dong_kho (
           ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
           so_luong_truoc, so_luong_sau, nguoi_thuc_hien_id, ghi_chu
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tk.id,
          duLieu.serviceId,
          duLieu.type,
          duLieu.quantity,
          soLuongTruoc,
          soLuongSau,
          adminId,
          duLieu.reason,
        ]
      );

      return {
        serviceId: duLieu.serviceId,
        quantity: soLuongSau,
        adjustmentType: duLieu.type,
        quantityBefore: soLuongTruoc,
        quantityAfter: soLuongSau,
        adjustedQuantity: duLieu.quantity,
        availableQuantity: soLuongSau - soLuongDangGiu,
      };
    });
  }

  /**
   * Cập nhật ngưỡng cảnh báo tồn kho (ADMIN ONLY)
   */
  async capNhatNguongCanhBao(serviceId: number, threshold: number) {
    if (threshold < 0) {
      throw new LoiApi(400, 'VALIDATION_ERROR', 'Ngưỡng cảnh báo không được âm');
    }

    const [res] = await csdl.execute<ResultSetHeader>(
      `UPDATE ton_kho_dich_vu SET nguong_canh_bao = ? WHERE dich_vu_id = ?`,
      [threshold, serviceId]
    );

    if (res.affectedRows === 0) {
      throw LoiApi.khongTimThay('Không tìm thấy bản ghi tồn kho');
    }

    return { serviceId, threshold };
  }

  /**
   * Khách hàng gọi dịch vụ cho đơn của mình (POST /bookings/:id/service-orders)
   * Nhân viên thêm dịch vụ tại quầy (POST /staff/bookings/:id/service-orders)
   * Tích hợp kiểm tra tồn kho, khóa hàng (RESERVE) và xuất kho (DELIVER) (Master Prompt XV, XVI)
   */
  async taoYeuCauDichVu(
    nguoiDungId: number,
    vaiTro: string,
    donDatId: number,
    duLieu: DuLieuGoiDichVu,
    laNhanVien: boolean = false
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      // 1. Khóa đơn đặt để kiểm tra trạng thái
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, nguoi_dung_id, trang_thai, ngay_dat, gio_ket_thuc
         FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      }

      const don = donRows[0];

      // Nếu khách gọi: phải là chủ đơn
      if (!laNhanVien && vaiTro === 'CUSTOMER' && don.nguoi_dung_id !== nguoiDungId) {
        throw LoiApi.khongCoQuyen('Bạn không có quyền thao tác trên đơn đặt này');
      }

      // Kiểm tra trạng thái đơn: chỉ cho phép gọi khi CONFIRMED (hoặc cả CHECKED_IN nếu nhân viên)
      const trangThaiChoPhep = laNhanVien ? ['CONFIRMED', 'CHECKED_IN'] : ['CONFIRMED'];
      if (!trangThaiChoPhep.includes(don.trang_thai)) {
        throw new LoiApi(
          422,
          'BOOKING_NOT_ACTIVE_FOR_SERVICE',
          'Đơn đặt không ở trạng thái hợp lệ để gọi dịch vụ'
        );
      }

      // Nếu là khách: kiểm tra giờ kết thúc đã qua chưa (BR-24)
      if (!laNhanVien) {
        const gioKetThucStr = (don.gio_ket_thuc as string).substring(0, 5);
        const thoiDiemKetThuc = new Date(`${don.ngay_dat}T${gioKetThucStr}:00+07:00`).getTime();
        if (Date.now() > thoiDiemKetThuc) {
          throw new LoiApi(
            422,
            'BOOKING_NOT_ACTIVE_FOR_SERVICE',
            'Đơn đặt đã qua thời gian sử dụng sân'
          );
        }
      }

      // 2. Kiểm tra các món dịch vụ
      const serviceIds = duLieu.items.map((i) => i.serviceId);
      const placeholders = serviceIds.map(() => '?').join(',');
      const [dvRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, ten, phan_loai, don_gia, trang_thai
         FROM dich_vu WHERE id IN (${placeholders})`,
        serviceIds
      );

      const dvMap = new Map<number, any>();
      for (const r of dvRows) {
        dvMap.set(r.id, r);
      }

      for (const item of duLieu.items) {
        const dv = dvMap.get(item.serviceId);
        if (!dv || dv.trang_thai !== 'ACTIVE') {
          throw new LoiApi(
            422,
            'SERVICE_NOT_AVAILABLE',
            `Dịch vụ #${item.serviceId} không khả dụng hoặc đã hết hàng`
          );
        }
      }

      // 3. Khóa và kiểm tra tồn kho cho từng món (Master Prompt XV: SELECT ... FOR UPDATE)
      for (const item of duLieu.items) {
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao
           FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
          [item.serviceId]
        );

        if (tkRows.length === 0) {
          throw new LoiApi(
            422,
            'SERVICE_NOT_AVAILABLE',
            `Dịch vụ #${item.serviceId} chưa được cấu hình tồn kho`
          );
        }

        const tk = tkRows[0];
        const soLuong = Number(tk.so_luong);
        const soLuongDangGiu = Number(tk.so_luong_dang_giu);
        const khaDung = soLuong - soLuongDangGiu;

        if (khaDung < item.quantity) {
          const tenDv = dvMap.get(item.serviceId)?.ten || `#${item.serviceId}`;
          throw new LoiApi(
            422,
            'INSUFFICIENT_STOCK',
            `Dịch vụ "${tenDv}" không đủ số lượng tồn kho (khả dụng: ${khaDung}, yêu cầu: ${item.quantity})`
          );
        }
      }

      // 4. Chuẩn bị tạo yêu cầu dịch vụ
      const trangThaiYeuCau = laNhanVien ? 'DELIVERED' : 'REQUESTED';
      const nguonYeuCau = laNhanVien ? 'STAFF' : 'APP';
      const nguoiGiaoId = laNhanVien ? nguoiDungId : null;

      const [resYc] = await ketNoi.execute<ResultSetHeader>(
        `INSERT INTO yeu_cau_dich_vu (
           don_dat_id, nguoi_yeu_cau_id, nguoi_giao_id, trang_thai,
           nguon, ghi_chu, giao_luc
         ) VALUES (?, ?, ?, ?, ?, ?, ${laNhanVien ? 'NOW()' : 'NULL'})`,
        [donDatId, nguoiDungId, nguoiGiaoId, trangThaiYeuCau, nguonYeuCau, duLieu.note || null]
      );
      const yeuCauId = resYc.insertId;

      let tongTienYeuCau = 0;
      const danhSachDongKetQua: any[] = [];

      for (const item of duLieu.items) {
        const dv = dvMap.get(item.serviceId);
        const donGia = Number(dv.don_gia);
        const thanhTien = donGia * item.quantity;
        tongTienYeuCau += thanhTien;

        const [resCt] = await ketNoi.execute<ResultSetHeader>(
          `INSERT INTO chi_tiet_yeu_cau_dich_vu (
             yeu_cau_dich_vu_id, dich_vu_id, so_luong, don_gia
           ) VALUES (?, ?, ?, ?)`,
          [yeuCauId, dv.id, item.quantity, donGia]
        );

        danhSachDongKetQua.push({
          id: resCt.insertId,
          serviceId: dv.id,
          name: dv.ten,
          type: dv.phan_loai,
          quantity: item.quantity,
          unitPrice: donGia,
          lineAmount: thanhTien,
          returnedAt: null,
        });

        // 5. Cập nhật tồn kho theo vai trò
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ?`,
          [item.serviceId]
        );
        const tk = tkRows[0];

        if (laNhanVien) {
          // Nhân viên tạo tại quầy: đi thẳng vào DELIVERED -> Trừ trực tiếp vào kho thực
          const soLuongTruoc = Number(tk.so_luong);
          const soLuongSau = Math.max(0, soLuongTruoc - item.quantity);
          await ketNoi.execute(
            `UPDATE ton_kho_dich_vu SET so_luong = ? WHERE id = ?`,
            [soLuongSau, tk.id]
          );
          await ketNoi.execute(
            `INSERT INTO bien_dong_kho (
               ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
               so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
               nguoi_thuc_hien_id, ghi_chu
             ) VALUES (?, ?, 'DELIVER', ?, ?, ?, ?, ?, ?, 'Nhân viên giao dịch vụ tại quầy')`,
            [tk.id, item.serviceId, item.quantity, soLuongTruoc, soLuongSau, donDatId, yeuCauId, nguoiDungId]
          );
        } else {
          // Khách hàng đặt trên App: trạng thái REQUESTED -> Giữ chỗ tồn kho (RESERVE)
          const dangGiuTruoc = Number(tk.so_luong_dang_giu);
          const dangGiuSau = dangGiuTruoc + item.quantity;
          const khaDungTruoc = Number(tk.so_luong) - dangGiuTruoc;
          const khaDungSau = khaDungTruoc - item.quantity;

          await ketNoi.execute(
            `UPDATE ton_kho_dich_vu SET so_luong_dang_giu = ? WHERE id = ?`,
            [dangGiuSau, tk.id]
          );
          await ketNoi.execute(
            `INSERT INTO bien_dong_kho (
               ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
               so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
               nguoi_thuc_hien_id, ghi_chu
             ) VALUES (?, ?, 'RESERVE', ?, ?, ?, ?, ?, ?, 'Khách hàng giữ chỗ dịch vụ')`,
            [tk.id, item.serviceId, item.quantity, khaDungTruoc, khaDungSau, donDatId, yeuCauId, nguoiDungId]
          );
        }
      }

      // Nếu nhân viên thêm tại quầy: trạng thái là DELIVERED -> cập nhật ngay tien_dich_vu của don_dat
      if (laNhanVien) {
        await tinhLaiTienDichVu(ketNoi, donDatId);
      }

      const [ycMoi] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT ngay_tao, giao_luc FROM yeu_cau_dich_vu WHERE id = ?`,
        [yeuCauId]
      );

      return {
        id: yeuCauId,
        bookingId: donDatId,
        status: trangThaiYeuCau,
        source: nguonYeuCau,
        note: duLieu.note || null,
        items: danhSachDongKetQua,
        orderAmount: tongTienYeuCau,
        createdAt: ycMoi[0].ngay_tao,
        deliveredAt: ycMoi[0].giao_luc || null,
      };
    });
  }

  /**
   * Khách hàng hủy yêu cầu dịch vụ chưa giao (POST /bookings/:id/service-orders/:orderId/cancel)
   * Tự động giải phóng tồn kho đã giữ (RELEASE) (Master Prompt XVI)
   */
  async huyYeuCauBoiKhach(nguoiDungId: number, donDatId: number, orderId: number, lyDo?: string | null) {
    return await voiGiaoDich(async (ketNoi) => {
      // Kiểm tra đơn
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, nguoi_dung_id FROM don_dat WHERE id = ?`,
        [donDatId]
      );
      if (donRows.length === 0 || donRows[0].nguoi_dung_id !== nguoiDungId) {
        throw LoiApi.khongTimThay('Không tìm thấy đơn đặt của bạn');
      }

      // Khóa yêu cầu
      const [ycRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai FROM yeu_cau_dich_vu WHERE id = ? AND don_dat_id = ? FOR UPDATE`,
        [orderId, donDatId]
      );
      if (ycRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy yêu cầu dịch vụ');
      }

      const yc = ycRows[0];
      if (yc.trang_thai !== 'REQUESTED') {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Chỉ có thể hủy yêu cầu đang ở trạng thái REQUESTED (hiện tại: ${yc.trang_thai})`
        );
      }

      // Giải phóng tồn kho giữ chỗ (RELEASE)
      const [items] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT dich_vu_id, so_luong FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id = ?`,
        [orderId]
      );

      for (const it of items) {
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
          [it.dich_vu_id]
        );
        if (tkRows.length > 0) {
          const tk = tkRows[0];
          const dangGiuMoi = Math.max(0, Number(tk.so_luong_dang_giu) - Number(it.so_luong));
          const khaDungTruoc = Number(tk.so_luong) - Number(tk.so_luong_dang_giu);
          const khaDungSau = Number(tk.so_luong) - dangGiuMoi;

          await ketNoi.execute(
            `UPDATE ton_kho_dich_vu SET so_luong_dang_giu = ? WHERE id = ?`,
            [dangGiuMoi, tk.id]
          );
          await ketNoi.execute(
            `INSERT INTO bien_dong_kho (
               ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
               so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
               nguoi_thuc_hien_id, ghi_chu
             ) VALUES (?, ?, 'RELEASE', ?, ?, ?, ?, ?, ?, 'Khách hủy yêu cầu, giải phóng tồn kho đã giữ')`,
            [tk.id, it.dich_vu_id, it.so_luong, khaDungTruoc, khaDungSau, donDatId, orderId, nguoiDungId]
          );
        }
      }

      await ketNoi.execute(
        `UPDATE yeu_cau_dich_vu
         SET trang_thai = 'CANCELLED', huy_luc = NOW(), ly_do_huy = ?
         WHERE id = ?`,
        [lyDo || 'Khách hàng hủy trên ứng dụng', orderId]
      );

      return { success: true, message: 'Đã hủy yêu cầu dịch vụ thành công' };
    });
  }

  /**
   * Hàng đợi yêu cầu dịch vụ cho nhân viên (GET /staff/service-orders)
   */
  async layHangDoiYeuCau(tuyChon: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, tuyChon.page || 1);
    const limit = Math.min(100, Math.max(1, tuyChon.limit || 20));
    const offset = (page - 1) * limit;

    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (tuyChon.status) {
      whereSql += ' AND ycdv.trang_thai = ?';
      params.push(tuyChon.status);
    }
    if (tuyChon.date) {
      whereSql += ' AND dd.ngay_dat = ?';
      params.push(tuyChon.date);
    }

    // Đếm tổng số
    const [countRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS tong
       FROM yeu_cau_dich_vu ycdv
       JOIN don_dat dd ON dd.id = ycdv.don_dat_id
       ${whereSql}`,
      params
    );
    const total = Number(countRows[0].tong);

    // Lấy danh sách yêu cầu
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT ycdv.id, ycdv.don_dat_id AS booking_id, ycdv.trang_thai AS status,
              ycdv.ghi_chu AS note, ycdv.ngay_tao AS created_at, ycdv.giao_luc AS delivered_at,
              dd.ma_don_dat AS booking_code, s.ten AS court_name,
              TIME_FORMAT(dd.gio_bat_dau, '%H:%i') AS start_time,
              TIME_FORMAT(dd.gio_ket_thuc, '%H:%i') AS end_time,
              COALESCE(u.ho_ten, dd.ten_khach) AS customer_name,
              COALESCE(u.so_dien_thoai, dd.so_dien_thoai_khach) AS customer_phone
       FROM yeu_cau_dich_vu ycdv
       JOIN don_dat dd ON dd.id = ycdv.don_dat_id
       JOIN san s ON s.id = dd.san_id
       LEFT JOIN nguoi_dung u ON u.id = dd.nguoi_dung_id
       ${whereSql}
       ORDER BY ycdv.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    if (rows.length === 0) {
      return { items: [], page, limit, total };
    }

    const yeuCauIds = rows.map((r: any) => r.id);
    const placeholders = yeuCauIds.map(() => '?').join(',');

    const [itemRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT ct.id, ct.yeu_cau_dich_vu_id AS order_id, ct.dich_vu_id AS service_id,
              dv.ten AS name, dv.phan_loai AS type, ct.so_luong AS quantity,
              ct.don_gia AS unit_price, (ct.so_luong * ct.don_gia) AS line_amount, ct.tra_luc AS returned_at
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       WHERE ct.yeu_cau_dich_vu_id IN (${placeholders})
       ORDER BY ct.id ASC`,
      yeuCauIds
    );

    const itemsByOrder = new Map<number, any[]>();
    for (const item of itemRows) {
      const orderId = item.order_id;
      if (!itemsByOrder.has(orderId)) {
        itemsByOrder.set(orderId, []);
      }
      itemsByOrder.get(orderId)!.push({
        id: item.id,
        serviceId: item.service_id,
        name: item.name,
        type: item.type,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        lineAmount: Number(item.line_amount),
        returnedAt: item.returned_at || null,
      });
    }

    const items = rows.map((r: any) => {
      const subItems = itemsByOrder.get(r.id) || [];
      const orderAmount = subItems.reduce((acc, cur) => acc + cur.lineAmount, 0);
      return {
        id: r.id,
        status: r.status,
        createdAt: r.created_at,
        deliveredAt: r.delivered_at || null,
        note: r.note || null,
        booking: {
          id: r.booking_id,
          bookingCode: r.booking_code,
          courtName: r.court_name,
          startTime: r.start_time,
          endTime: r.end_time,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
        },
        items: subItems,
        orderAmount,
      };
    });

    return { items, page, limit, total };
  }

  /**
   * Nhân viên xác nhận đã giao dịch vụ (POST /staff/service-orders/:id/deliver)
   * Tự động trừ kho thực tế và giảm giữ chỗ (DELIVER) (Master Prompt XVI)
   */
  async xacNhanGiaoHang(nhanVienId: number, orderId: number) {
    return await voiGiaoDich(async (ketNoi) => {
      const [ycRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, don_dat_id, trang_thai FROM yeu_cau_dich_vu WHERE id = ? FOR UPDATE`,
        [orderId]
      );
      if (ycRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy yêu cầu dịch vụ');
      }

      const yc = ycRows[0];
      if (yc.trang_thai !== 'REQUESTED') {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Chỉ có thể giao yêu cầu đang ở trạng thái REQUESTED (hiện tại: ${yc.trang_thai})`
        );
      }

      // Khóa đơn đặt để tránh xung đột
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai FROM don_dat WHERE id = ? FOR UPDATE`,
        [yc.don_dat_id]
      );
      if (donRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      }

      const don = donRows[0];
      if (['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(don.trang_thai)) {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Không thể giao dịch vụ cho đơn đặt ở trạng thái ${don.trang_thai}`
        );
      }

      // Chuyển kho từ giữ chỗ sang đã giao (DELIVER)
      const [items] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT dich_vu_id, so_luong FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id = ?`,
        [orderId]
      );

      for (const it of items) {
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
          [it.dich_vu_id]
        );
        if (tkRows.length > 0) {
          const tk = tkRows[0];
          const soLuongTruoc = Number(tk.so_luong);
          const soLuongSau = Math.max(0, soLuongTruoc - Number(it.so_luong));
          const dangGiuSau = Math.max(0, Number(tk.so_luong_dang_giu) - Number(it.so_luong));

          await ketNoi.execute(
            `UPDATE ton_kho_dich_vu SET so_luong = ?, so_luong_dang_giu = ? WHERE id = ?`,
            [soLuongSau, dangGiuSau, tk.id]
          );
          await ketNoi.execute(
            `INSERT INTO bien_dong_kho (
               ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
               so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
               nguoi_thuc_hien_id, ghi_chu
             ) VALUES (?, ?, 'DELIVER', ?, ?, ?, ?, ?, ?, 'Bàn giao dịch vụ ra sân')`,
            [tk.id, it.dich_vu_id, it.so_luong, soLuongTruoc, soLuongSau, yc.don_dat_id, orderId, nhanVienId]
          );
        }
      }

      // Cập nhật yêu cầu
      await ketNoi.execute(
        `UPDATE yeu_cau_dich_vu
         SET trang_thai = 'DELIVERED', giao_luc = NOW(), nguoi_giao_id = ?
         WHERE id = ?`,
        [nhanVienId, orderId]
      );

      // Tính lại tiền dịch vụ cho đơn đặt (BR-25, 7.10)
      await tinhLaiTienDichVu(ketNoi, yc.don_dat_id);

      const [donMoi] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT tien_dich_vu FROM don_dat WHERE id = ?`,
        [yc.don_dat_id]
      );

      return {
        id: orderId,
        bookingId: yc.don_dat_id,
        status: 'DELIVERED',
        serviceAmount: Number(donMoi[0].tien_dich_vu),
      };
    });
  }

  /**
   * Nhân viên hủy yêu cầu dịch vụ (POST /staff/service-orders/:id/cancel)
   * Tự động giải phóng hoặc hoàn trả tồn kho (RELEASE hoặc RETURN)
   */
  async nhanVienHuyYeuCau(nhanVienId: number, orderId: number, lyDo: string) {
    return await voiGiaoDich(async (ketNoi) => {
      const [ycRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, don_dat_id, trang_thai FROM yeu_cau_dich_vu WHERE id = ? FOR UPDATE`,
        [orderId]
      );
      if (ycRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy yêu cầu dịch vụ');
      }

      const yc = ycRows[0];
      // Nếu đã DELIVERED, kiểm tra BR-25: không được hủy nếu đã thu tiền dịch vụ vượt quá tổng mới
      if (yc.trang_thai === 'DELIVERED') {
        const { servicePaid } = await laySoTienDaThu(ketNoi, yc.don_dat_id);
        // Tính tiền nếu loại bỏ order này
        const [subRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS tien_con_lai
           FROM yeu_cau_dich_vu y
           JOIN chi_tiet_yeu_cau_dich_vu ct ON ct.yeu_cau_dich_vu_id = y.id
           WHERE y.don_dat_id = ? AND y.trang_thai = 'DELIVERED' AND y.id != ?`,
          [yc.don_dat_id, orderId]
        );
        const tienConLai = Number(subRows[0].tien_con_lai);
        if (servicePaid > tienConLai) {
          throw new LoiApi(
            409,
            'SERVICE_ALREADY_PAID',
            'Không thể hủy yêu cầu đã giao vì số tiền dịch vụ đã thu lớn hơn tổng tiền sau khi hủy'
          );
        }
      } else if (yc.trang_thai !== 'REQUESTED') {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Không thể hủy yêu cầu ở trạng thái ${yc.trang_thai}`
        );
      }

      // Xử lý hoàn kho
      const [items] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT dich_vu_id, so_luong FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id = ?`,
        [orderId]
      );

      for (const it of items) {
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
          [it.dich_vu_id]
        );
        if (tkRows.length > 0) {
          const tk = tkRows[0];
          if (yc.trang_thai === 'REQUESTED') {
            // Giảm số lượng giữ chỗ (RELEASE)
            const dangGiuSau = Math.max(0, Number(tk.so_luong_dang_giu) - Number(it.so_luong));
            const khaDungTruoc = Number(tk.so_luong) - Number(tk.so_luong_dang_giu);
            const khaDungSau = Number(tk.so_luong) - dangGiuSau;
            await ketNoi.execute(
              `UPDATE ton_kho_dich_vu SET so_luong_dang_giu = ? WHERE id = ?`,
              [dangGiuSau, tk.id]
            );
            await ketNoi.execute(
              `INSERT INTO bien_dong_kho (
                 ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
                 so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
                 nguoi_thuc_hien_id, ghi_chu
               ) VALUES (?, ?, 'RELEASE', ?, ?, ?, ?, ?, ?, 'Nhân viên hủy yêu cầu chờ giao')`,
              [tk.id, it.dich_vu_id, it.so_luong, khaDungTruoc, khaDungSau, yc.don_dat_id, orderId, nhanVienId]
            );
          } else if (yc.trang_thai === 'DELIVERED') {
            // Hoàn lại kho thực tế (RETURN)
            const soLuongTruoc = Number(tk.so_luong);
            const soLuongSau = soLuongTruoc + Number(it.so_luong);
            await ketNoi.execute(
              `UPDATE ton_kho_dich_vu SET so_luong = ? WHERE id = ?`,
              [soLuongSau, tk.id]
            );
            await ketNoi.execute(
              `INSERT INTO bien_dong_kho (
                 ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
                 so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
                 nguoi_thuc_hien_id, ghi_chu
               ) VALUES (?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, 'Nhân viên hủy yêu cầu đã giao, hoàn kho')`,
              [tk.id, it.dich_vu_id, it.so_luong, soLuongTruoc, soLuongSau, yc.don_dat_id, orderId, nhanVienId]
            );
          }
        }
      }

      await ketNoi.execute(
        `UPDATE yeu_cau_dich_vu
         SET trang_thai = 'CANCELLED', huy_luc = NOW(), ly_do_huy = ?
         WHERE id = ?`,
        [lyDo, orderId]
      );

      // Nếu trước đó là DELIVERED, tính lại tiền
      if (yc.trang_thai === 'DELIVERED') {
        await tinhLaiTienDichVu(ketNoi, yc.don_dat_id);
      }

      return { success: true, message: 'Đã hủy yêu cầu dịch vụ thành công' };
    });
  }

  /**
   * Nhân viên nhận lại đồ thuê (POST /staff/service-order-items/:id/return)
   * Tự động cộng lại kho (RETURN) (Master Prompt XI, XVI)
   */
  async traDoThue(nhanVienId: number, itemId: number) {
    return await voiGiaoDich(async (ketNoi) => {
      const [rows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT ct.id, ct.dich_vu_id, ct.so_luong, ct.tra_luc, dv.phan_loai,
                ycdv.don_dat_id, ycdv.id AS yeu_cau_dich_vu_id, ycdv.trang_thai AS yc_status
         FROM chi_tiet_yeu_cau_dich_vu ct
         JOIN dich_vu dv ON dv.id = ct.dich_vu_id
         JOIN yeu_cau_dich_vu ycdv ON ycdv.id = ct.yeu_cau_dich_vu_id
         WHERE ct.id = ? FOR UPDATE`,
        [itemId]
      );

      if (rows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy dòng dịch vụ');
      }

      const item = rows[0];
      if (item.phan_loai !== 'RENTAL') {
        throw new LoiApi(422, 'NOT_RENTAL_ITEM', 'Dòng dịch vụ này không phải đồ thuê');
      }

      if (item.yc_status !== 'DELIVERED') {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          'Đồ thuê chưa được giao nên không thể xác nhận trả'
        );
      }

      if (item.tra_luc !== null) {
        throw new LoiApi(409, 'ALREADY_RETURNED', 'Đồ thuê này đã được xác nhận trả trước đó');
      }

      // Đánh dấu đã nhận lại
      await ketNoi.execute(
        `UPDATE chi_tiet_yeu_cau_dich_vu SET tra_luc = NOW(), nguoi_nhan_tra_id = ? WHERE id = ?`,
        [nhanVienId, itemId]
      );

      // Cộng lại tồn kho (RETURN)
      const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, so_luong FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
        [item.dich_vu_id]
      );
      if (tkRows.length > 0) {
        const tk = tkRows[0];
        const soLuongTruoc = Number(tk.so_luong);
        const soLuongSau = soLuongTruoc + Number(item.so_luong);

        await ketNoi.execute(
          `UPDATE ton_kho_dich_vu SET so_luong = ? WHERE id = ?`,
          [soLuongSau, tk.id]
        );
        await ketNoi.execute(
          `INSERT INTO bien_dong_kho (
             ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
             so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
             nguoi_thuc_hien_id, ghi_chu
           ) VALUES (?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, 'Khách hàng hoàn trả đồ thuê')`,
          [tk.id, item.dich_vu_id, item.so_luong, soLuongTruoc, soLuongSau, item.don_dat_id, item.yeu_cau_dich_vu_id, nhanVienId]
        );
      }

      const [updated] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, tra_luc AS returned_at FROM chi_tiet_yeu_cau_dich_vu WHERE id = ?`,
        [itemId]
      );

      return {
        id: updated[0].id,
        returnedAt: updated[0].returned_at,
      };
    });
  }

  /**
   * Thu tiền dịch vụ (POST /staff/bookings/:id/service-payments)
   */
  async thuTienDichVu(
    nhanVienId: number,
    donDatId: number,
    duLieu: { method: 'CASH' | 'BANK_TRANSFER'; transactionRef?: string | null }
  ) {
    return await voiGiaoDich(async (ketNoi) => {
      const [donRows] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT id, trang_thai, tien_dich_vu FROM don_dat WHERE id = ? FOR UPDATE`,
        [donDatId]
      );

      if (donRows.length === 0) {
        throw LoiApi.khongTimThay('Không tìm thấy đơn đặt');
      }

      const don = donRows[0];
      if (['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(don.trang_thai)) {
        throw new LoiApi(
          409,
          'INVALID_STATUS',
          `Không thể thu tiền cho đơn đặt ở trạng thái ${don.trang_thai}`
        );
      }

      // Lấy số tiền dịch vụ đã thu
      const { servicePaid } = await laySoTienDaThu(ketNoi, donDatId);
      const serviceAmount = Number(don.tien_dich_vu);
      const serviceBalance = serviceAmount - servicePaid;

      if (serviceBalance <= 0) {
        throw new LoiApi(422, 'NOTHING_TO_PAY', 'Đơn đặt không còn khoản tiền dịch vụ nào cần thu');
      }

      // Tạo thanh toán
      await ketNoi.execute(
        `INSERT INTO thanh_toan (
           don_dat_id, loai_giao_dich, muc_dich,
           phuong_thuc, so_tien, trang_thai, ma_giao_dich, nguoi_xu_ly_id, ngay_xu_ly
         ) VALUES (?, 'PAYMENT', 'SERVICE', ?, ?, 'SUCCESS', ?, ?, NOW())`,
        [
          donDatId,
          duLieu.method,
          serviceBalance,
          duLieu.transactionRef || null,
          nhanVienId,
        ]
      );

      // Trả về hóa đơn đầy đủ đã cập nhật
      return await taoHoaDon(ketNoi, donDatId);
    });
  }

  /**
   * Nhân viên bật/tắt trạng thái tạm hết hàng (PATCH /staff/services/:id/availability)
   */
  async batTatTamHetHang(dichVuId: number, status: 'ACTIVE' | 'OUT_OF_STOCK') {
    const [result] = await csdl.execute<ResultSetHeader>(
      `UPDATE dich_vu SET trang_thai = ? WHERE id = ? AND trang_thai IN ('ACTIVE', 'OUT_OF_STOCK')`,
      [status, dichVuId]
    );

    if (result.affectedRows === 0) {
      throw LoiApi.khongTimThay('Dịch vụ không tồn tại hoặc đã bị ngừng kinh doanh (INACTIVE)');
    }

    return await this.layChiTietDichVu(dichVuId);
  }

  /**
   * Lấy hóa đơn tổng thể của một đơn đặt (GET /bookings/:id/invoice hoặc /staff/bookings/:id/invoice)
   */
  async layHoaDon(donDatId: number, nguoiDungId?: number, vaiTro?: string) {
    if (vaiTro === 'CUSTOMER' && nguoiDungId) {
      const [don] = await csdl.execute<RowDataPacket[]>(
        `SELECT nguoi_dung_id FROM don_dat WHERE id = ?`,
        [donDatId]
      );
      if (don.length === 0 || don[0].nguoi_dung_id !== nguoiDungId) {
        throw LoiApi.khongTimThay('Không tìm thấy đơn đặt của bạn');
      }
    }

    return await taoHoaDon(csdl, donDatId);
  }

  /**
   * Tiện ích giải phóng toàn bộ tồn kho giữ chỗ khi một đơn đặt bị hủy hoặc hết hạn
   */
  static async giaiPhongTonKhoDonHuy(
    ketNoi: PoolConnection,
    donDatId: number,
    nguoiThucHienId: number | null,
    lyDo: string
  ) {
    const [ycRows] = await ketNoi.execute<RowDataPacket[]>(
      `SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ? AND trang_thai = 'REQUESTED'`,
      [donDatId]
    );

    for (const yc of ycRows) {
      const [items] = await ketNoi.execute<RowDataPacket[]>(
        `SELECT dich_vu_id, so_luong FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id = ?`,
        [yc.id]
      );

      for (const it of items) {
        const [tkRows] = await ketNoi.execute<RowDataPacket[]>(
          `SELECT id, so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ? FOR UPDATE`,
          [it.dich_vu_id]
        );
        if (tkRows.length > 0) {
          const tk = tkRows[0];
          const dangGiuSau = Math.max(0, Number(tk.so_luong_dang_giu) - Number(it.so_luong));
          const khaDungTruoc = Number(tk.so_luong) - Number(tk.so_luong_dang_giu);
          const khaDungSau = Number(tk.so_luong) - dangGiuSau;

          await ketNoi.execute(
            `UPDATE ton_kho_dich_vu SET so_luong_dang_giu = ? WHERE id = ?`,
            [dangGiuSau, tk.id]
          );
          await ketNoi.execute(
            `INSERT INTO bien_dong_kho (
               ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong,
               so_luong_truoc, so_luong_sau, don_dat_id, yeu_cau_dich_vu_id,
               nguoi_thuc_hien_id, ghi_chu
             ) VALUES (?, ?, 'RELEASE', ?, ?, ?, ?, ?, ?, ?)`,
            [tk.id, it.dich_vu_id, it.so_luong, khaDungTruoc, khaDungSau, donDatId, yc.id, nguoiThucHienId, lyDo]
          );
        }
      }

      await ketNoi.execute(
        `UPDATE yeu_cau_dich_vu SET trang_thai = 'CANCELLED', huy_luc = NOW(), ly_do_huy = ? WHERE id = ?`,
        [lyDo, yc.id]
      );
    }
  }
}

export const dichVuService = new DichVuService();
