// =====================================================================
// HÓA ĐƠN — plant/01-database.md mục 7.7, 7.9, 7.10; 06-api.md mục 5.14
// Tính khi đọc từ don_dat + yeu_cau_dich_vu + chi_tiet_yeu_cau_dich_vu + thanh_toan
// =====================================================================
import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { chuyenCamel } from './chuyendoicamel';
import { LoiApi } from './loi';

export type NguonTruyVan = Pick<PoolConnection, 'execute'>;

/** 7.10 — Cập nhật cache don_dat.tien_dich_vu (chỉ yêu cầu DELIVERED). Gọi trong transaction đã khóa đơn. */
export async function tinhLaiTienDichVu(ketNoi: NguonTruyVan, donId: number): Promise<void> {
  await ketNoi.execute(
    `UPDATE don_dat dd
     SET dd.tien_dich_vu = COALESCE((
       SELECT SUM(ct.so_luong * ct.don_gia)
       FROM yeu_cau_dich_vu ycdv JOIN chi_tiet_yeu_cau_dich_vu ct ON ct.yeu_cau_dich_vu_id = ycdv.id
       WHERE ycdv.don_dat_id = dd.id AND ycdv.trang_thai = 'DELIVERED'), 0)
     WHERE dd.id = ?`,
    [donId]
  );
}

/** Tổng hợp tiền đã thu (7.7) */
export async function laySoTienDaThu(ketNoi: NguonTruyVan, donId: number) {
  const [dong] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' THEN so_tien END), 0) AS da_tra,
       COALESCE(SUM(CASE WHEN loai_giao_dich = 'PAYMENT' AND trang_thai = 'SUCCESS' AND muc_dich = 'SERVICE' THEN so_tien END), 0) AS dich_vu_da_tra
     FROM thanh_toan WHERE don_dat_id = ?`,
    [donId]
  );
  return {
    paidAmount: Number(dong[0].da_tra),
    servicePaid: Number(dong[0].dich_vu_da_tra),
  };
}

/** 7.9 — Đồ thuê đã giao nhưng chưa nhận lại */
export async function layDoThueChuaTra(ketNoi: NguonTruyVan, donId: number) {
  const [dong] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT ct.id AS item_id, dv.ten AS name, ct.so_luong AS quantity
     FROM chi_tiet_yeu_cau_dich_vu ct
     JOIN yeu_cau_dich_vu ycdv ON ycdv.id = ct.yeu_cau_dich_vu_id AND ycdv.trang_thai = 'DELIVERED'
     JOIN dich_vu dv ON dv.id = ct.dich_vu_id AND dv.phan_loai = 'RENTAL'
     WHERE ycdv.don_dat_id = ? AND ct.tra_luc IS NULL
     ORDER BY ct.id`,
    [donId]
  );
  return chuyenCamel<{ itemId: number; name: string; quantity: number }[]>(dong);
}

/** Danh sách yêu cầu dịch vụ kèm các dòng của một đơn */
export async function layYeuCauDichVuCuaDon(ketNoi: NguonTruyVan, donId: number) {
  const [yeuCau] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT id, don_dat_id AS booking_id, trang_thai AS status, nguon AS source,
            ghi_chu AS note, giao_luc AS delivered_at, huy_luc AS cancelled_at,
            ly_do_huy AS cancel_reason, ngay_tao AS created_at
     FROM yeu_cau_dich_vu WHERE don_dat_id = ? ORDER BY ngay_tao, id`,
    [donId]
  );
  if (yeuCau.length === 0) return [];

  const [dong] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT ct.id, ct.yeu_cau_dich_vu_id AS order_id, ct.dich_vu_id AS service_id,
            dv.ten AS name, dv.phan_loai AS type, ct.so_luong AS quantity, ct.don_gia AS unit_price,
            ct.so_luong * ct.don_gia AS line_amount, ct.tra_luc AS returned_at
     FROM chi_tiet_yeu_cau_dich_vu ct
     JOIN dich_vu dv ON dv.id = ct.dich_vu_id
     WHERE ct.yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ?)
     ORDER BY ct.id`,
    [donId]
  );
  const cacDong = chuyenCamel<any[]>(dong);

  return chuyenCamel<any[]>(yeuCau).map((yc) => {
    const items = cacDong.filter((d) => d.orderId === yc.id).map(({ orderId, ...phanConLai }) => ({
      ...phanConLai,
      quantity: Number(phanConLai.quantity),
      unitPrice: Number(phanConLai.unitPrice),
      lineAmount: Number(phanConLai.lineAmount),
    }));
    const orderAmount = items.reduce((tong, d) => tong + d.lineAmount, 0);
    return { ...yc, items, orderAmount };
  });
}

/** 5.14 — Hóa đơn đầy đủ của một đơn đặt (JSON format camelCase đúng chuẩn 06-api.md) */
export async function taoHoaDon(ketNoi: NguonTruyVan, donId: number) {
  const [donDat] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT dd.id, dd.ma_don_dat, dd.trang_thai, dd.ngay_dat, dd.gio_bat_dau, dd.gio_ket_thuc,
            dd.tien_san, dd.tien_dich_vu, dd.dong_don_cong_no, s.id AS san_id, s.ten AS ten_san
     FROM don_dat dd JOIN san s ON s.id = dd.san_id
     WHERE dd.id = ? LIMIT 1`,
    [donId]
  );
  if (donDat.length === 0) throw LoiApi.khongTimThay('Đơn đặt không tồn tại');
  const don = donDat[0];

  const { paidAmount, servicePaid } = await laySoTienDaThu(ketNoi, donId);
  const courtAmount = Number(don.tien_san);
  const serviceAmount = Number(don.tien_dich_vu);
  const grandTotal = courtAmount + serviceAmount;

  const [giaoDich] = await ketNoi.execute<RowDataPacket[]>(
    `SELECT id, loai_giao_dich AS type, muc_dich AS purpose, phuong_thuc AS method,
            so_tien AS amount, trang_thai AS status, ma_giao_dich AS transaction_ref,
            ghi_chu AS note, ngay_xu_ly AS processed_at, ngay_tao AS created_at
     FROM thanh_toan WHERE don_dat_id = ? ORDER BY id`,
    [donId]
  );

  return {
    bookingId: don.id as number,
    bookingCode: don.ma_don_dat as string,
    status: don.trang_thai as string,
    court: { id: don.san_id as number, name: don.ten_san as string },
    bookingDate: don.ngay_dat as string,
    startTime: (don.gio_bat_dau as string).substring(0, 5),
    endTime: (don.gio_ket_thuc as string).substring(0, 5),
    courtAmount,
    orders: await layYeuCauDichVuCuaDon(ketNoi, donId),
    serviceAmount,
    grandTotal,
    paidAmount,
    servicePaid,
    balance: grandTotal - paidAmount,
    serviceBalance: serviceAmount - servicePaid,
    closedWithDebt: Boolean(don.dong_don_cong_no),
    unreturnedRentals: await layDoThueChuaTra(ketNoi, donId),
    payments: chuyenCamel<any[]>(giaoDich).map((g) => ({ ...g, amount: Number(g.amount) })),
  };
}
