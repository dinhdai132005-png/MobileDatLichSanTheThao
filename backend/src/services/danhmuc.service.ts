// =====================================================================
// DỊCH VỤ DANH MỤC CÔNG KHAI — plant/06-api.md mục 4.1, 5.9; CUS-04, 05
// Bảng thao tác: loai_san, san, khung_gio, danh_gia
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/csdl';
import { NGHIEP_VU } from '../config/nghiepvu';
import { LoiApi } from '../utils/loi';
import { chuyenCamel } from '../utils/chuyendoicamel';

export class DanhMucService {
  /** Lấy danh sách loại sân đang hoạt động (có thể lọc theo category: SPORT | EVENT) */
  static async layDanhSachLoaiSan(category?: string) {
    let sql = 'SELECT id, ten AS name, phan_loai AS category, mo_ta AS description FROM loai_san WHERE hoat_dong = 1';
    const params: any[] = [];
    if (category) {
      sql += ' AND phan_loai = ?';
      params.push(category);
    }
    sql += ' ORDER BY id';
    const [danhSach] = await pool.execute<RowDataPacket[]>(sql, params);
    return chuyenCamel(danhSach);
  }

  /** Lấy danh sách sân đang hoạt động/bảo trì (ẩn sân INACTIVE), có thể lọc theo courtTypeId hoặc category */
  static async layDanhSachSan(loc?: { courtTypeId?: number; category?: string }) {
    let sql = `
      SELECT s.id, s.loai_san_id AS court_type_id, ls.ten AS court_type_name, ls.phan_loai AS category,
             s.ten AS name, s.mo_ta AS description, s.hinh_anh AS image_url, s.suc_chua AS capacity,
             s.trang_thai AS status,
             COALESCE(ROUND(AVG(dg.so_sao), 1), 0) AS average_rating,
             COUNT(dg.id) AS total_reviews
      FROM san s
      JOIN loai_san ls ON ls.id = s.loai_san_id
      LEFT JOIN don_dat dd ON dd.san_id = s.id
      LEFT JOIN danh_gia dg ON dg.don_dat_id = dd.id
      WHERE s.trang_thai != 'INACTIVE' AND ls.hoat_dong = 1
    `;
    const params: any[] = [];

    if (loc?.courtTypeId) {
      sql += ' AND s.loai_san_id = ?';
      params.push(loc.courtTypeId);
    }
    if (loc?.category) {
      sql += ' AND ls.phan_loai = ?';
      params.push(loc.category);
    }

    sql += ' GROUP BY s.id ORDER BY s.id';
    const [danhSach] = await pool.execute<RowDataPacket[]>(sql, params);
    return (danhSach as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.image_url,
      capacity: r.capacity !== null ? Number(r.capacity) : null,
      status: r.status,
      courtTypeId: r.court_type_id,
      courtTypeName: r.court_type_name,
      category: r.category,
      averageRating: Number(r.average_rating),
      totalReviews: Number(r.total_reviews),
      courtType: {
        id: r.court_type_id,
        name: r.court_type_name,
        category: r.category,
      },
      rating: {
        average: Number(r.average_rating),
        total: Number(r.total_reviews),
      },
    }));
  }

  /** Lấy chi tiết sân kèm điểm đánh giá */
  static async layChiTietSan(sanId: number) {
    const sql = `
      SELECT s.id, s.loai_san_id AS court_type_id, ls.ten AS court_type_name, ls.phan_loai AS category,
             s.ten AS name, s.mo_ta AS description, s.hinh_anh AS image_url, s.suc_chua AS capacity,
             s.trang_thai AS status,
             COALESCE(ROUND(AVG(dg.so_sao), 1), 0) AS average_rating,
             COUNT(dg.id) AS total_reviews
      FROM san s
      JOIN loai_san ls ON ls.id = s.loai_san_id
      LEFT JOIN don_dat dd ON dd.san_id = s.id
      LEFT JOIN danh_gia dg ON dg.don_dat_id = dd.id
      WHERE s.id = ? AND s.trang_thai != 'INACTIVE'
      GROUP BY s.id
      LIMIT 1
    `;
    const [danhSach] = await pool.execute<RowDataPacket[]>(sql, [sanId]);
    if (danhSach.length === 0) {
      throw LoiApi.khongTimThay('Sân không tồn tại hoặc đã ngừng hoạt động');
    }
    const r: any = danhSach[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.image_url,
      capacity: r.capacity !== null ? Number(r.capacity) : null,
      status: r.status,
      courtTypeId: r.court_type_id,
      courtTypeName: r.court_type_name,
      category: r.category,
      averageRating: Number(r.average_rating),
      totalReviews: Number(r.total_reviews),
      courtType: {
        id: r.court_type_id,
        name: r.court_type_name,
        category: r.category,
      },
      rating: {
        average: Number(r.average_rating),
        total: Number(r.total_reviews),
      },
    };
  }

  /** Lấy danh sách khung giờ cố định đang hoạt động */
  static async layDanhSachKhungGio() {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, gio_bat_dau AS start_time, gio_ket_thuc AS end_time FROM khung_gio WHERE hoat_dong = 1 ORDER BY gio_bat_dau'
    );
    return chuyenCamel(danhSach);
  }

  /** Cấu hình công khai cho ứng dụng (5.9) */
  static layCauHinhCongKhai() {
    return {
      bookingAdvanceDays: NGHIEP_VU.SO_NGAY_DAT_TRUOC_TOI_DA,
      holdMinutes: NGHIEP_VU.PHUT_GIU_CHO_CHUYEN_KHOAN,
      cancelDeadlineHours: NGHIEP_VU.SO_GIO_HAN_HUY,
      maxSlotsPerBooking: NGHIEP_VU.SO_KHUNG_GIO_TOI_DA,
      maxActiveBookingsPerCustomer: NGHIEP_VU.SO_DON_HOAT_DONG_TOI_DA,
      paymentMethods: ['CASH', 'BANK_TRANSFER'],
    };
  }
}

export const danhMucService = {
  layDanhSachLoaiSan: (category?: any) => DanhMucService.layDanhSachLoaiSan(category),
  layDanhSachSan: (boLoc?: any) => DanhMucService.layDanhSachSan(boLoc),
  layChiTietSan: (id: number) => DanhMucService.layChiTietSan(id),
  layDanhSachKhungGio: () => DanhMucService.layDanhSachKhungGio(),
  layCauHinhCongKhai: () => DanhMucService.layCauHinhCongKhai(),
};
