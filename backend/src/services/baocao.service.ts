// =====================================================================
// SERVICE BÁO CÁO — Thống kê tổng quan, doanh thu, lấp đầy, dịch vụ
// Đáp ứng: plant/06-api.md mục 4.4, 5.11, 5.19, 5.21 (ADM-07, BR-32, TC-58)
// Báo cáo chi tiết từng khoản: Tiền sân, Nước uống, Thuê đồ, Gói tiệc
// =====================================================================
import { RowDataPacket } from 'mysql2/promise';
import { csdl } from '../config/csdl';

export class BaoCaoService {
  /**
   * ADM-07, spec 5.21: Thống kê tổng quan kèm phân rã chi tiết từng khoản
   */
  async layTongQuan(from?: string, to?: string) {
    let whereDon = 'WHERE 1=1';
    let wherePay = 'WHERE 1=1';
    let whereYc = `WHERE yc.trang_thai = 'DELIVERED'`;
    let whereCourt = `WHERE dd.trang_thai IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')`;

    const paramsDon: any[] = [];
    const paramsPay: any[] = [];
    const paramsYc: any[] = [];
    const paramsCourt: any[] = [];

    if (from) {
      whereDon += ' AND ngay_dat >= ?';
      wherePay += ` AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) >= ?`;
      whereYc += ` AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?`;
      whereCourt += ' AND ct.ngay_dat >= ?';
      paramsDon.push(from);
      paramsPay.push(from);
      paramsYc.push(from);
      paramsCourt.push(from);
    }
    if (to) {
      whereDon += ' AND ngay_dat <= ?';
      wherePay += ` AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) <= ?`;
      whereYc += ` AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?`;
      whereCourt += ' AND ct.ngay_dat <= ?';
      paramsDon.push(to);
      paramsPay.push(to);
      paramsYc.push(to);
      paramsCourt.push(to);
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
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_refunded,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_refunded
       FROM thanh_toan
       ${wherePay}`,
      paramsPay
    );

    // 3. Thống kê chi tiết dịch vụ theo phân loại (DRINK, RENTAL, PACKAGE)
    const [serviceTypeRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         dv.phan_loai AS type,
         COUNT(ct.id) AS line_count,
         COALESCE(SUM(ct.so_luong), 0) AS total_qty,
         COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS total_amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       ${whereYc}
       GROUP BY dv.phan_loai`,
      paramsYc
    );

    // 4. Thống kê chi tiết tiền sân theo loại sân (SPORT vs EVENT)
    const [courtTypeRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         ls.id AS court_type_id,
         ls.ten AS court_type_name,
         ls.phan_loai AS court_category,
         COUNT(ct.id) AS total_slots,
         COALESCE(SUM(ct.gia), 0) AS total_amount
       FROM chi_tiet_khung_gio_dat ct
       JOIN don_dat dd ON dd.id = ct.don_dat_id
       JOIN san s ON s.id = ct.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       ${whereCourt}
       GROUP BY ls.id, ls.ten, ls.phan_loai
       ORDER BY total_amount DESC`,
      paramsCourt
    );

    const d = donRows[0];
    const p = payRows[0];
    const courtPaid = Number(p.court_paid || 0);
    const courtRef = Number(p.court_refunded || 0);
    const courtRev = courtPaid - courtRef;

    const servicePaid = Number(p.service_paid || 0);
    const serviceRef = Number(p.service_refunded || 0);
    const serviceRev = servicePaid - serviceRef;

    let drinkAmount = 0, drinkQty = 0;
    let rentalAmount = 0, rentalQty = 0;
    let packageAmount = 0, packageQty = 0;

    serviceTypeRows.forEach((r: any) => {
      const amt = Number(r.total_amount || 0);
      const qty = Number(r.total_qty || 0);
      if (r.type === 'DRINK') {
        drinkAmount += amt;
        drinkQty += qty;
      } else if (r.type === 'RENTAL') {
        rentalAmount += amt;
        rentalQty += qty;
      } else if (r.type === 'PACKAGE') {
        packageAmount += amt;
        packageQty += qty;
      }
    });

    let sportCourtAmount = 0;
    let eventCourtAmount = 0;
    const courtTypeDetails = courtTypeRows.map((r: any) => {
      const amt = Number(r.total_amount || 0);
      if (r.court_category === 'SPORT') sportCourtAmount += amt;
      else if (r.court_category === 'EVENT') eventCourtAmount += amt;
      return {
        courtTypeId: r.court_type_id,
        courtTypeName: r.court_type_name,
        courtCategory: r.court_category,
        totalSlots: Number(r.total_slots || 0),
        amount: amt,
      };
    });

    return {
      totalBookings: Number(d.total_bookings || 0),
      completedBookings: Number(d.completed_bookings || 0),
      cancelledBookings: Number(d.cancelled_bookings || 0),
      noShowBookings: Number(d.no_show_bookings || 0),
      revenue: {
        court: courtRev,
        service: serviceRev,
        total: courtRev + serviceRev,
        courtPaid,
        courtRefunded: courtRef,
        servicePaid,
        serviceRefunded: serviceRef,
        totalRefunded: courtRef + serviceRef,
        netRevenue: courtRev + serviceRev,
        drinks: drinkAmount,
        rentals: rentalAmount,
        packages: packageAmount,
        breakdown: {
          court: {
            total: courtRev,
            paid: courtPaid,
            refunded: courtRef,
            sportAmount: sportCourtAmount,
            eventAmount: eventCourtAmount,
            byType: courtTypeDetails,
          },
          drinks: {
            amount: drinkAmount,
            qty: drinkQty,
          },
          rentals: {
            amount: rentalAmount,
            qty: rentalQty,
          },
          packages: {
            amount: packageAmount,
            qty: packageQty,
          },
          servicesTotal: drinkAmount + rentalAmount + packageAmount,
        },
      },
      debtClosed: {
        count: Number(d.debt_count || 0),
        amount: Number(d.debt_amount || 0),
      },
    };
  }

  /**
   * ADM-07, spec 5.11: Doanh thu theo ngày/tháng với chi tiết từng khoản
   */
  async layBaoCaoDoanhThu(from: string, to: string, groupBy: 'day' | 'month' = 'day') {
    const formatStr = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    // 1. Thống kê từ bảng thanh toán
    const [payRows] = await csdl.execute<RowDataPacket[]>(
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

    // 2. Thống kê chi tiết dịch vụ (DRINK, RENTAL, PACKAGE) theo ngày/tháng
    const [serviceDailyRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         DATE_FORMAT(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00'), '${formatStr}') AS time_key,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'DRINK' THEN ct.so_luong * ct.don_gia ELSE 0 END), 0) AS drinks_amount,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'RENTAL' THEN ct.so_luong * ct.don_gia ELSE 0 END), 0) AS rentals_amount,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'PACKAGE' THEN ct.so_luong * ct.don_gia ELSE 0 END), 0) AS packages_amount,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'DRINK' THEN ct.so_luong ELSE 0 END), 0) AS drinks_qty,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'RENTAL' THEN ct.so_luong ELSE 0 END), 0) AS rentals_qty,
         COALESCE(SUM(CASE WHEN dv.phan_loai = 'PACKAGE' THEN ct.so_luong ELSE 0 END), 0) AS packages_qty
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       WHERE yc.trang_thai = 'DELIVERED'
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?
       GROUP BY time_key`,
      [from, to]
    );

    const serviceMap = new Map<string, any>();
    serviceDailyRows.forEach((r: any) => {
      serviceMap.set(r.time_key, {
        drinksAmount: Number(r.drinks_amount || 0),
        rentalsAmount: Number(r.rentals_amount || 0),
        packagesAmount: Number(r.packages_amount || 0),
        drinksQty: Number(r.drinks_qty || 0),
        rentalsQty: Number(r.rentals_qty || 0),
        packagesQty: Number(r.packages_qty || 0),
      });
    });

    // Gom tập hợp tất cả các time_key có phát sinh giao dịch hoặc dịch vụ
    const allKeysSet = new Set<string>();
    payRows.forEach((r: any) => allKeysSet.add(r.time_key));
    serviceDailyRows.forEach((r: any) => allKeysSet.add(r.time_key));
    const sortedKeys = Array.from(allKeysSet).sort();

    const payMap = new Map<string, any>();
    payRows.forEach((r: any) => payMap.set(r.time_key, r));

    let totalCourtRev = 0;
    let totalServiceRev = 0;
    let totalDrinkAmount = 0;
    let totalRentalAmount = 0;
    let totalPackageAmount = 0;
    let totalRefundAmount = 0;

    const items = sortedKeys.map((key) => {
      const p = payMap.get(key) || {};
      const s = serviceMap.get(key) || {
        drinksAmount: 0,
        rentalsAmount: 0,
        packagesAmount: 0,
        drinksQty: 0,
        rentalsQty: 0,
        packagesQty: 0,
      };

      const cPaid = Number(p.court_paid || 0);
      const cRef = Number(p.court_refunded || 0);
      const cRev = cPaid - cRef;

      const sPaid = Number(p.service_paid || 0);
      const sRef = Number(p.service_refunded || 0);
      const sRev = sPaid - sRef;

      const refund = cRef + sRef;

      totalCourtRev += cRev;
      totalServiceRev += sRev;
      totalDrinkAmount += s.drinksAmount;
      totalRentalAmount += s.rentalsAmount;
      totalPackageAmount += s.packagesAmount;
      totalRefundAmount += refund;

      return {
        date: key,
        court: { paid: cPaid, refunded: cRef, revenue: cRev },
        service: { paid: sPaid, refunded: sRef, revenue: sRev },
        drinks: { amount: s.drinksAmount, qty: s.drinksQty },
        rentals: { amount: s.rentalsAmount, qty: s.rentalsQty },
        packages: { amount: s.packagesAmount, qty: s.packagesQty },
        refundAmount: refund,
        revenue: cRev + sRev,
      };
    });

    return {
      totalRevenue: totalCourtRev + totalServiceRev,
      courtRevenue: totalCourtRev,
      serviceRevenue: totalServiceRev,
      drinkRevenue: totalDrinkAmount,
      rentalRevenue: totalRentalAmount,
      packageRevenue: totalPackageAmount,
      refundAmount: totalRefundAmount,
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
   * ADM-07, spec 5.19: Báo cáo dịch vụ bán chạy & doanh số theo loại kèm lọc type
   */
  async layBaoCaoDichVu(from?: string, to?: string, type?: string) {
    let whereSql = `WHERE yc.trang_thai = 'DELIVERED'`;
    const params: any[] = [];

    if (from) {
      whereSql += ` AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?`;
      params.push(from);
    }
    if (to) {
      whereSql += ` AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?`;
      params.push(to);
    }
    if (type) {
      whereSql += ` AND dv.phan_loai = ?`;
      params.push(type);
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
              dv.don_vi_tinh AS unit, dv.don_gia AS unit_price,
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

    // Toàn bộ danh mục dịch vụ có phát sinh số liệu trong kỳ
    const [allServicesRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT dv.id AS service_id, dv.ten AS name, dv.phan_loai AS type,
              dv.don_vi_tinh AS unit, dv.don_gia AS unit_price,
              COALESCE(SUM(ct.so_luong), 0) AS qty,
              COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       ${whereSql}
       GROUP BY dv.id
       ORDER BY dv.phan_loai ASC, amount DESC`,
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
        unit: r.unit,
        unitPrice: Number(r.unit_price || 0),
        qty: Number(r.qty),
        amount: Number(r.amount),
      })),
      allServices: allServicesRows.map((r: any) => ({
        serviceId: r.service_id,
        name: r.name,
        type: r.type,
        unit: r.unit,
        unitPrice: Number(r.unit_price || 0),
        qty: Number(r.qty),
        amount: Number(r.amount),
      })),
    };
  }

  /**
   * BÁO CÁO CHI TIẾT TỪNG KHOẢN THU (Itemized Breakdown & Ledger)
   * Phục vụ yêu cầu giáo viên: Báo cáo chi tiết từng khoản như nước uống, thuê đồ, tiền sân, tiền dịch vụ riêng rõ ràng
   */
  async layBaoCaoChiTietKhoanThu(from?: string, to?: string) {
    const f = from || new Date().toISOString().substring(0, 7) + '-01';
    const t = to || new Date().toISOString().substring(0, 10);

    // 1. Thống kê tiền thanh toán và hoàn tiền
    const [payRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'COURT' THEN so_tien ELSE 0 END), 0) AS court_refunded,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_paid,
         COALESCE(SUM(CASE WHEN loai_giao_dich = 'REFUND' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien ELSE 0 END), 0) AS service_refunded
       FROM thanh_toan
       WHERE DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(ngay_tao, '+00:00', '+07:00')) <= ?`,
      [f, t]
    );

    const p = payRows[0];
    const courtPaid = Number(p.court_paid || 0);
    const courtRef = Number(p.court_refunded || 0);
    const courtNet = courtPaid - courtRef;
    const servicePaid = Number(p.service_paid || 0);
    const serviceRef = Number(p.service_refunded || 0);
    const serviceNet = servicePaid - serviceRef;

    // 2. Chi tiết dịch vụ theo từng phân loại (DRINK, RENTAL, PACKAGE)
    const [serviceSummaryRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         dv.phan_loai AS type,
         COUNT(ct.id) AS count,
         COALESCE(SUM(ct.so_luong), 0) AS total_qty,
         COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS total_amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       WHERE yc.trang_thai = 'DELIVERED'
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?
       GROUP BY dv.phan_loai`,
      [f, t]
    );

    let drinkAmount = 0, drinkQty = 0;
    let rentalAmount = 0, rentalQty = 0;
    let packageAmount = 0, packageQty = 0;

    serviceSummaryRows.forEach((r: any) => {
      const amt = Number(r.total_amount || 0);
      const qty = Number(r.total_qty || 0);
      if (r.type === 'DRINK') {
        drinkAmount = amt;
        drinkQty = qty;
      } else if (r.type === 'RENTAL') {
        rentalAmount = amt;
        rentalQty = qty;
      } else if (r.type === 'PACKAGE') {
        packageAmount = amt;
        packageQty = qty;
      }
    });

    const totalGross = courtPaid + drinkAmount + rentalAmount + packageAmount;
    const totalNet = courtNet + serviceNet;

    // Cơ cấu phân bổ doanh thu (Categories Breakdown)
    const categories = [
      {
        key: 'COURT',
        name: 'Tiền thuê sân',
        icon: '🏟️',
        amount: courtNet,
        grossAmount: courtPaid,
        refundAmount: courtRef,
        percentage: totalGross > 0 ? Number(((courtPaid / totalGross) * 100).toFixed(1)) : 0,
        description: 'Phí thuê sân thể thao và phòng sự kiện/tiệc',
      },
      {
        key: 'DRINK',
        name: 'Nước uống giải khát',
        icon: '🥤',
        amount: drinkAmount,
        grossAmount: drinkAmount,
        refundAmount: 0,
        qty: drinkQty,
        unit: 'chai/lon/ly',
        percentage: totalGross > 0 ? Number(((drinkAmount / totalGross) * 100).toFixed(1)) : 0,
        description: 'Nước suối, nước ngọt, nước tăng lực, bia lon, trà đá',
      },
      {
        key: 'RENTAL',
        name: 'Thuê dụng cụ & đồ chơi',
        icon: '🏸',
        amount: rentalAmount,
        grossAmount: rentalAmount,
        refundAmount: 0,
        qty: rentalQty,
        unit: 'lượt thuê',
        percentage: totalGross > 0 ? Number(((rentalAmount / totalGross) * 100).toFixed(1)) : 0,
        description: 'Vợt cầu lông, giày thể thao, bóng đá, áo bib thi đấu',
      },
      {
        key: 'PACKAGE',
        name: 'Gói combo & dịch vụ tiệc',
        icon: '📦',
        amount: packageAmount,
        grossAmount: packageAmount,
        refundAmount: 0,
        qty: packageQty,
        unit: 'gói',
        percentage: totalGross > 0 ? Number(((packageAmount / totalGross) * 100).toFixed(1)) : 0,
        description: 'Gói BBQ, tiệc nước 10 người, trang trí sinh nhật thể thao',
      },
    ];

    // 3. Phân rã tiền sân theo từng loại sân
    const [courtTypeRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         ls.id AS court_type_id,
         ls.ten AS court_type_name,
         ls.phan_loai AS court_category,
         COUNT(ct.id) AS total_slots,
         COALESCE(SUM(ct.gia), 0) AS total_amount
       FROM chi_tiet_khung_gio_dat ct
       JOIN don_dat dd ON dd.id = ct.don_dat_id
       JOIN san s ON s.id = ct.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       WHERE dd.trang_thai IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
         AND ct.ngay_dat >= ? AND ct.ngay_dat <= ?
       GROUP BY ls.id, ls.ten, ls.phan_loai
       ORDER BY total_amount DESC`,
      [f, t]
    );

    // 4. Chi tiết từng mặt hàng dịch vụ
    const [serviceItemRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         dv.id AS service_id,
         dv.ten AS name,
         dv.phan_loai AS type,
         dv.don_vi_tinh AS unit,
         dv.don_gia AS unit_price,
         COALESCE(SUM(ct.so_luong), 0) AS total_qty,
         COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS total_amount
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       WHERE yc.trang_thai = 'DELIVERED'
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?
       GROUP BY dv.id
       ORDER BY dv.phan_loai ASC, total_amount DESC`,
      [f, t]
    );

    // 5. Sổ chi tiết các giao dịch / đơn hàng phát sinh (Itemized Ledger)
    // Gom cả tiền sân và chi tiết dịch vụ đã phục vụ
    const [ledgerCourtRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         dd.id AS booking_id,
         dd.ma_don_dat AS booking_code,
         DATE_FORMAT(CONVERT_TZ(dd.ngay_tao, '+00:00', '+07:00'), '%Y-%m-%d %H:%i') AS created_at,
         COALESCE(dd.ten_khach, nd.ho_ten, 'Khách vãng lai') AS customer_name,
         COALESCE(dd.so_dien_thoai_khach, nd.so_dien_thoai, '—') AS customer_phone,
         'COURT' AS item_category,
         'Tiền thuê sân' AS category_name,
         CONCAT(s.ten, ' (', ls.ten, ')') AS item_name,
         COUNT(ct.id) AS quantity,
         'slot' AS unit,
         COALESCE(MIN(ct.gia), dd.tien_san) AS unit_price,
         dd.tien_san AS total_amount,
         dd.phuong_thuc_thanh_toan AS payment_method,
         dd.trang_thai AS status
       FROM don_dat dd
       JOIN san s ON s.id = dd.san_id
       JOIN loai_san ls ON ls.id = s.loai_san_id
       LEFT JOIN chi_tiet_khung_gio_dat ct ON ct.don_dat_id = dd.id
       LEFT JOIN nguoi_dung nd ON nd.id = dd.nguoi_dung_id
       WHERE dd.trang_thai IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
         AND dd.ngay_dat >= ? AND dd.ngay_dat <= ?
       GROUP BY dd.id, dd.ma_don_dat, dd.ngay_tao, dd.ten_khach, nd.ho_ten, dd.so_dien_thoai_khach, nd.so_dien_thoai, s.ten, ls.ten, dd.tien_san, dd.phuong_thuc_thanh_toan, dd.trang_thai
       ORDER BY dd.id DESC
       LIMIT 100`,
      [f, t]
    );

    const [ledgerServiceRows] = await csdl.execute<RowDataPacket[]>(
      `SELECT
         dd.id AS booking_id,
         dd.ma_don_dat AS booking_code,
         DATE_FORMAT(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00'), '%Y-%m-%d %H:%i') AS created_at,
         COALESCE(dd.ten_khach, nd.ho_ten, 'Khách tại sân') AS customer_name,
         COALESCE(dd.so_dien_thoai_khach, nd.so_dien_thoai, '—') AS customer_phone,
         dv.phan_loai AS item_category,
         CASE dv.phan_loai
           WHEN 'DRINK' THEN 'Nước uống'
           WHEN 'RENTAL' THEN 'Thuê dụng cụ'
           WHEN 'PACKAGE' THEN 'Gói tiệc/combo'
           ELSE 'Dịch vụ'
         END AS category_name,
         dv.ten AS item_name,
         ct.so_luong AS quantity,
         dv.don_vi_tinh AS unit,
         ct.don_gia AS unit_price,
         (ct.so_luong * ct.don_gia) AS total_amount,
         dd.phuong_thuc_thanh_toan AS payment_method,
         'DELIVERED' AS status
       FROM chi_tiet_yeu_cau_dich_vu ct
       JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       JOIN don_dat dd ON dd.id = yc.don_dat_id
       LEFT JOIN nguoi_dung nd ON nd.id = dd.nguoi_dung_id
       WHERE yc.trang_thai = 'DELIVERED'
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) >= ?
         AND DATE(CONVERT_TZ(COALESCE(yc.giao_luc, yc.ngay_tao), '+00:00', '+07:00')) <= ?
       ORDER BY ct.id DESC
       LIMIT 100`,
      [f, t]
    );

    // Gộp và sắp xếp sổ giao dịch theo thời gian mới nhất
    const allLedger = [...ledgerCourtRows, ...ledgerServiceRows].sort((a: any, b: any) =>
      b.created_at.localeCompare(a.created_at)
    );

    return {
      period: { from: f, to: t },
      summary: {
        totalRevenue: totalNet,
        courtRevenue: courtNet,
        courtPaid,
        courtRefunded: courtRef,
        serviceRevenue: serviceNet,
        servicePaid,
        serviceRefunded: serviceRef,
        drinkRevenue: drinkAmount,
        rentalRevenue: rentalAmount,
        packageRevenue: packageAmount,
        totalRefund: courtRef + serviceRef,
        netRevenue: totalNet,
      },
      categories,
      courtByType: courtTypeRows.map((r: any) => ({
        courtTypeId: r.court_type_id,
        courtTypeName: r.court_type_name,
        courtCategory: r.court_category,
        totalSlots: Number(r.total_slots || 0),
        amount: Number(r.total_amount || 0),
        percentage:
          courtPaid > 0
            ? Number(((Number(r.total_amount || 0) / courtPaid) * 100).toFixed(1))
            : 0,
      })),
      serviceItems: serviceItemRows.map((r: any) => ({
        serviceId: r.service_id,
        name: r.name,
        type: r.type,
        unit: r.unit,
        unitPrice: Number(r.unit_price || 0),
        totalQty: Number(r.total_qty || 0),
        totalAmount: Number(r.total_amount || 0),
      })),
      recentTransactions: allLedger.map((r: any) => ({
        bookingId: r.booking_id,
        bookingCode: r.booking_code,
        createdAt: r.created_at,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        itemCategory: r.item_category,
        categoryName: r.category_name,
        itemName: r.item_name,
        quantity: Number(r.quantity || 1),
        unit: r.unit,
        unitPrice: Number(r.unit_price || 0),
        totalAmount: Number(r.total_amount || 0),
        paymentMethod: r.payment_method,
        status: r.status,
      })),
    };
  }
}

export const baoCaoService = new BaoCaoService();

