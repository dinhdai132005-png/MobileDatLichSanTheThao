// =====================================================================
// SERVICE BÁO CÁO — Thống kê tổng quan, doanh thu, lấp đầy, dịch vụ
// Đáp ứng: plant/06-api.md mục 4.4, 5.11, 5.19, 5.21 (ADM-07)
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { csdl } from '../config/csdl';

export class BaoCaoService {
  /**
   * ADM-07, spec 5.21: Thống kê tổng quan
   */
  async layTongQuan(from?: string, to?: string) {
    let whereDon = 'WHERE 1=1';
    let wherePay = 'WHERE 1=1';
    const paramsDon: any[] = [];
    const paramsPay: any[] = [];

    if (from) {
      whereDon += ' AND ngay_dat >= ?';
      wherePay += ` AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) >= ?`;
      paramsDon.push(from);
      paramsPay.push(from);
    }
    if (to) {
      whereDon += ' AND ngay_dat <= ?';
      wherePay += ` AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) <= ?`;
      paramsDon.push(to);
      paramsPay.push(to);
    }

    // 1. Thống kê đơn
    const [donRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_bookings,
         SUM(CASE WHEN trang_thai = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_bookings,
         SUM(CASE WHEN trang_thai = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings,
         SUM(CASE WHEN trang_thai = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_show_bookings,
         SUM(CASE WHEN dong_don_cong_no = 1 THEN 1 ELSE 0 END) AS debt_count,
         SUM(CASE WHEN dong_don_cong_no = 1 THEN (tien_san + tien_dich_vu) ELSE 0 END) AS debt_amount
       FROM don_dat
       ${whereDon}`,
      paramsDon
    );

    // 2. Thống kê doanh thu thực tế từ bảng thanh_toan
    const [payRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_net,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_net
       FROM thanh_toan
       ${wherePay}`,
      paramsPay
    );

    const d = donRows[0];
    const p = payRows[0];
    const courtRev = Number(p.court_net || 0);
    const serviceRev = Number(p.service_net || 0);

    return {
      totalBookings: Number(d.total_bookings || 0),
      completedBookings: Number(d.completed_bookings || 0),
      cancelledBookings: Number(d.cancelled_bookings || 0),
      noShowBookings: Number(d.no_show_bookings || 0),
      revenue: {
        court: courtRev,
        service: serviceRev,
        total: courtRev + serviceRev,
      },
      debtClosed: {
        count: Number(d.debt_count || 0),
        amount: Number(d.debt_amount || 0),
      },
    };
  }

  /**
   * ADM-07, spec 5.11: Doanh thu theo ngày/tháng
   */
  async layBaoCaoDoanhThu(from: string, to: string, groupBy: 'day' | 'month' = 'day') {
    const formatStr = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(CONVERT_TZ(ngay_tao, '+00:00', '+07:00'), '${formatStr}') AS time_key,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_refunded,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_refunded
       FROM thanh_toan
       WHERE DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) <= ?
       GROUP BY time_key
       ORDER BY time_key ASC`,
      [from, to]
    );

    let totalCourtRev = 0;
    let totalServiceRev = 0;

    const items = rows.map((r: any) => {
      const cPaid = Number(r.court_paid);
      const cRef = Number(r.court_refunded);
      const cRev = cPaid - cRef;

      const sPaid = Number(r.service_paid);
      const sRef = Number(r.service_refunded);
      const sRev = sPaid - sRef;

      totalCourtRev += cRev;
      totalServiceRev += sRev;

      return {
        date: r.time_key,
        court: { paid: cPaid, refunded: cRef, revenue: cRev },
        service: { paid: sPaid, refunded: sRef, revenue: sRev },
        revenue: cRev + sRev,
      };
    });

    return {
      totalRevenue: totalCourtRev + totalServiceRev,
      courtRevenue: totalCourtRev,
      serviceRevenue: totalServiceRev,
      items,
    };
  }

  /**
   * ADM-07: Thống kê tỷ lệ lấp đầy sân
   */
  async layBaoCaoSuDungSan(from: string, to: string) {
    const [rows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         s.id AS court_id, s.ten AS court_name, ls.ten AS court_type_name,
         COUNT(ct.id) AS total_slots_booked,
         COALESCE(SUM(ct.gia), 0) AS total_amount
       FROM san s
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN chi_tiet_khung_gio_dat ct ON ct.san_id = s.id
            AND ct.ngay_dat >= ? AND ct.ngay_dat <= ?
       LEFT JOIN don_dat dd ON dd.id = ct.don_dat_id AND dd.trang_thai IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
       GROUP BY s.id
       ORDER BY total_slots_booked DESC`,
      [from, to]
    );

    return rows.map((r: any) => ({
      courtId: r.court_id,
      courtName: r.court_name,
      courtTypeName: r.court_type_name,
      totalSlotsBooked: Number(r.total_slots_booked),
      totalAmount: Number(r.total_amount),
    }));
  }

  /**
   * ADM-07, spec 5.19: Báo cáo dịch vụ bán chạy & doanh số theo loại
   */
  async layBaoCaoDichVu(from?: string, to?: string) {
    let whereSql = `WHERE yc.trang_thai = 'DELIVERED'`;
    const params: any[] = [];

    if (from) {
      whereSql += ` AND DATE(CONVERT_TZ(yc.giao_luc, '+00:00', '+07:00')) >= ?`;
      params.push(from);
    }
    if (to) {
      whereSql += ` AND DATE(CONVERT_TZ(yc.giao_luc, '+00:00', '+07:00')) <= ?`;
      params.push(to);
    }

    // Doanh số theo loại
    const [byTypeRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT dv.phan_loai AS type,
              COALESCE(SUM(ct.so_luong), 0) AS qty,
              COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       ${whereSql}
       GROUP BY dv.phan_loai
       ORDER BY amount DESC`,
      params
    );

    // Top dịch vụ bán chạy
    const [topRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT dv.id AS service_id, dv.ten AS name, dv.phan_loai AS type,
              COALESCE(SUM(ct.so_luong), 0) AS qty,
              COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       ${whereSql}
       GROUP BY dv.id
       ORDER BY qty DESC, amount DESC
       LIMIT 10`,
      params
    );

    return {
      byType: byTypeRows.map((r: any) => ({
        type: r.type,
        qty: Number(r.qty),
        amount: Number(r.amount),
      })),
      topServices: topRows.map((r: any) => ({
        serviceId: r.service_id,
        name: r.name,
        type: r.type,
        qty: Number(r.qty),
        amount: Number(r.amount),
      })),
    };
  }
}

export const baoCaoService = new BaoCaoService();
