// =====================================================================
// SERVICE DỊCH VỤ MUA HỘ & ĐI CHỢ NGOÀI PHỤC VỤ TIỆC / SỰ KIỆN
// Quản lý hóa đơn chứng từ điện tử / giấy khi cơ sở đi chợ hộ hoặc đặt hộ ngoài
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { csdl } from '../config/csdl';
import { LoiApi } from '../utils/loi';
import { tinhLaiTienDichVu } from '../utils/hoadon';

export interface BoLocHoaDonMuaHo {
  donDatId?: number;
  loaiChiPhi?: string;
  loaiChungTu?: 'ELECTRONIC' | 'PAPER';
  trangThai?: string;
  tuNgay?: string;
  denNgay?: string;
  tuKhoa?: string;
}

export interface DuLieuTaoHoaDonMuaHo {
  donDatId: number;
  loaiChiPhi: 'GROCERY' | 'CATERING' | 'EQUIPMENT' | 'OTHER';
  tenKhoanChi: string;
  nhaCungCap?: string;
  soHoaDon?: string;
  loaiChungTu: 'ELECTRONIC' | 'PAPER';
  ngayHoaDon: string;
  hinhAnhChungTu?: string;
  tienHoaDon: number;
  phiPhucVu?: number;
  chiTietMon?: string;
  ghiChu?: string;
}

export class MuaHoService {
  /**
   * Lấy danh sách hóa đơn mua hộ kèm thông tin đơn tiệc và khách hàng
   */
  async layDanhSach(filters: BoLocHoaDonMuaHo = {}) {
    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.donDatId) {
      whereSql += ' AND h.don_dat_id = ?';
      params.push(filters.donDatId);
    }
    if (filters.loaiChiPhi && filters.loaiChiPhi !== 'ALL') {
      whereSql += ' AND h.loai_chi_phi = ?';
      params.push(filters.loaiChiPhi);
    }
    if (filters.loaiChungTu) {
      whereSql += ' AND h.loai_chung_tu = ?';
      params.push(filters.loaiChungTu);
    }
    if (filters.trangThai && filters.trangThai !== 'ALL') {
      whereSql += ' AND h.trang_thai = ?';
      params.push(filters.trangThai);
    }
    if (filters.tuNgay) {
      whereSql += ' AND h.ngay_hoa_don >= ?';
      params.push(filters.tuNgay);
    }
    if (filters.denNgay) {
      whereSql += ' AND h.ngay_hoa_don <= ?';
      params.push(filters.denNgay);
    }
    if (filters.tuKhoa) {
      whereSql += ' AND (h.ten_khoan_chi LIKE ? OR h.nha_cung_cap LIKE ? OR h.so_hoa_don LIKE ? OR dd.ma_don_dat LIKE ?)';
      const kw = `%${filters.tuKhoa}%`;
      params.push(kw, kw, kw, kw);
    }

    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         h.id, h.don_dat_id, dd.ma_don_dat, dd.ngay_dat,
         COALESCE(dd.ten_khach, nd_khach.ho_ten, 'Khách đặt tiệc') AS ten_khach,
         COALESCE(dd.so_dien_thoai_khach, nd_khach.so_dien_thoai, '—') AS so_dien_thoai,
         s.ten AS ten_san, ls.ten AS ten_loai_san,
         h.loai_chi_phi, h.ten_khoan_chi, h.nha_cung_cap, h.so_hoa_don,
         h.loai_chung_tu, DATE_FORMAT(h.ngay_hoa_don, '%Y-%m-%d') AS ngay_hoa_don,
         h.hinh_anh_chung_tu, h.tien_hoa_don, h.phi_phuc_vu, h.tong_tien,
         h.chi_tiet_mon, h.ghi_chu, h.trang_thai,
         nd_nv.ho_ten AS nguoi_tao,
         DATE_FORMAT(CONVERT_TZ(h.ngay_tao, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') AS ngay_tao
       FROM hoa_don_mua_ho h
       JOIN don_dat dd ON dd.id = h.don_dat_id
       JOIN san s ON s.id = dd.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN nguoi_dung nd_khach ON nd_khach.id = dd.nguoi_dung_id
       LEFT JOIN nguoi_dung nd_nv ON nd_nv.id = h.nguoi_tao_id
       ${whereSql}
       ORDER BY h.id DESC`,
      params
    );

    return rows.map((r: any) => ({
      id: r.id,
      bookingId: r.don_dat_id,
      bookingCode: r.ma_don_dat,
      bookingDate: r.ngay_dat,
      customerName: r.ten_khach,
      customerPhone: r.so_dien_thoai,
      courtName: r.ten_san,
      courtTypeName: r.ten_loai_san,
      expenseType: r.loai_chi_phi,
      title: r.ten_khoan_chi,
      supplier: r.nha_cung_cap,
      invoiceNumber: r.so_hoa_don,
      documentType: r.loai_chung_tu,
      invoiceDate: r.ngay_hoa_don,
      invoiceImageUrl: r.hinh_anh_chung_tu,
      invoiceAmount: Number(r.tien_hoa_don),
      serviceFee: Number(r.phi_phuc_vu || 0),
      totalAmount: Number(r.tong_tien),
      itemsDetail: r.chi_tiet_mon,
      note: r.ghi_chu,
      status: r.trang_thai,
      creatorName: r.nguoi_tao,
      createdAt: r.ngay_tao,
    }));
  }

  /**
   * Tạo hóa đơn mua hộ mới và gộp vào hóa đơn đơn đặt
   */
  async taoHoaDonMuaHo(duLieu: DuLieuTaoHoaDonMuaHo, nguoiTaoId: number) {
    if (!duLieu.donDatId) {
      throw LoiApi.yeuCauKhongHopLe('Thiếu mã đơn đặt sân/tiệc (donDatId)');
    }
    if (!duLieu.tenKhoanChi || duLieu.tenKhoanChi.trim() === '') {
      throw LoiApi.yeuCauKhongHopLe('Tên khoản chi hộ không được để trống');
    }
    if (!duLieu.tienHoaDon || duLieu.tienHoaDon <= 0) {
      throw LoiApi.yeuCauKhongHopLe('Số tiền trên hóa đơn phải lớn hơn 0');
    }

    // Kiểm tra đơn đặt
    const [donRows] = await csdl.execute<RowDataPacket[]>(
      'SELECT id, trang_thai FROM don_dat WHERE id = ?',
      [duLieu.donDatId]
    );
    if (donRows.length === 0) {
      throw LoiApi.khongTimThay('Không tìm thấy đơn đặt sân tương ứng');
    }
    const don = donRows[0];
    if (don.trang_thai === 'CANCELLED' || don.trang_thai === 'EXPIRED') {
      throw LoiApi.yeuCauKhongHopLe('Không thể thêm chi phí mua hộ vào đơn đã hủy hoặc hết hạn');
    }

    const phiPhucVu = Math.max(0, Number(duLieu.phiPhucVu || 0));
    const tienHoaDon = Number(duLieu.tienHoaDon);
    const tongTien = tienHoaDon + phiPhucVu;
    const ngayHd = duLieu.ngayHoaDon || new Date().toISOString().substring(0, 10);

    const [res] = await csdl.execute<ResultSetHeader>(
      `INSERT INTO hoa_don_mua_ho (
         don_dat_id, loai_chi_phi, ten_khoan_chi, nha_cung_cap, so_hoa_don,
         loai_chung_tu, ngay_hoa_don, hinh_anh_chung_tu, tien_hoa_don, phi_phuc_vu,
         tong_tien, chi_tiet_mon, ghi_chu, trang_thai, nguoi_tao_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BILLED', ?)`,
      [
        duLieu.donDatId,
        duLieu.loaiChiPhi || 'GROCERY',
        duLieu.tenKhoanChi.trim(),
        duLieu.nhaCungCap?.trim() || null,
        duLieu.soHoaDon?.trim() || null,
        duLieu.loaiChungTu || 'PAPER',
        ngayHd,
        duLieu.hinhAnhChungTu?.trim() || null,
        tienHoaDon,
        phiPhucVu,
        tongTien,
        duLieu.chiTietMon?.trim() || null,
        duLieu.ghiChu?.trim() || null,
        nguoiTaoId,
      ]
    );

    // Tính lại tiền dịch vụ tổng trong don_dat
    await tinhLaiTienDichVu(csdl, duLieu.donDatId);

    return {
      id: res.insertId,
      donDatId: duLieu.donDatId,
      tongTien,
      message: 'Đã tiếp nhận hóa đơn mua hộ và gộp vào đơn tiệc thành công',
    };
  }

  /**
   * Cập nhật trạng thái hóa đơn mua hộ
   */
  async capNhatTrangThai(id: number, trangThai: 'CONFIRMED' | 'BILLED' | 'CANCELLED') {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      'SELECT id, don_dat_id FROM hoa_don_mua_ho WHERE id = ?',
      [id]
    );
    if (rows.length === 0) throw LoiApi.khongTimThay('Hóa đơn mua hộ không tồn tại');

    const h = rows[0];
    await csdl.execute('UPDATE hoa_don_mua_ho SET trang_thai = ? WHERE id = ?', [trangThai, id]);

    // Cập nhật lại tổng tiền dịch vụ của đơn
    await tinhLaiTienDichVu(csdl, h.don_dat_id);

    return { id, trangThai, success: true };
  }

  /**
   * Xóa hoặc hủy hóa đơn mua hộ
   */
  async xoa(id: number) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      'SELECT id, don_dat_id FROM hoa_don_mua_ho WHERE id = ?',
      [id]
    );
    if (rows.length === 0) throw LoiApi.khongTimThay('Hóa đơn mua hộ không tồn tại');

    const h = rows[0];
    await csdl.execute('DELETE FROM hoa_don_mua_ho WHERE id = ?', [id]);

    // Cập nhật lại tiền dịch vụ
    await tinhLaiTienDichVu(csdl, h.don_dat_id);

    return { id, success: true };
  }

  /**
   * Thống kê KPI tổng hợp về dịch vụ mua hộ ngoài
   */
  async layThongKe() {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_invoices,
         COALESCE(SUM(tien_hoa_don), 0) AS total_invoice_amount,
         COALESCE(SUM(phi_phuc_vu), 0) AS total_service_fee,
         COALESCE(SUM(tong_tien), 0) AS grand_procurement_total,
         SUM(CASE WHEN loai_chung_tu = 'ELECTRONIC' THEN 1 ELSE 0 END) AS electronic_count,
         SUM(CASE WHEN loai_chung_tu = 'PAPER' THEN 1 ELSE 0 END) AS paper_count,
         SUM(CASE WHEN trang_thai = 'BILLED' THEN 1 ELSE 0 END) AS billed_count,
         SUM(CASE WHEN trang_thai = 'CONFIRMED' THEN 1 ELSE 0 END) AS pending_count
       FROM hoa_don_mua_ho
       WHERE trang_thai != 'CANCELLED'`
    );

    const r = rows[0];
    return {
      totalInvoices: Number(r.total_invoices || 0),
      totalInvoiceAmount: Number(r.total_invoice_amount || 0),
      totalServiceFee: Number(r.total_service_fee || 0),
      grandProcurementTotal: Number(r.grand_procurement_total || 0),
      electronicCount: Number(r.electronic_count || 0),
      paperCount: Number(r.paper_count || 0),
      billedCount: Number(r.billed_count || 0),
      pendingCount: Number(r.pending_count || 0),
    };
  }
}

export const muaHoService = new MuaHoService();
