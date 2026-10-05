// =====================================================================
// NHẬT KÝ TRẠNG THÁI — SYS-02: ghi vào bảng nhat_ky_trang_thai_don
// =====================================================================
import { KetNoi } from './giaodich';
import { TrangThaiDon } from '../types';

export interface TuyChonNhatKy {
  donDatId: number;
  trangThaiCu: string | null;
  trangThaiMoi: string;
  thayDoiBoiId?: number | null;
  ghiChu?: string | null;
}

export async function ghiNhatKyTrangThai(
  ketNoi: KetNoi,
  donIdOrOptions: number | TuyChonNhatKy,
  trangThaiTruoc?: TrangThaiDon | string | null,
  trangThaiSau?: TrangThaiDon | string,
  nguoiThucHienId?: number | null,
  ghiChu?: string | null
): Promise<void> {
  let donId: number;
  let ttTruoc: string | null = null;
  let ttSau: string;
  let userId: number | null = null;
  let note: string | null = null;

  if (typeof donIdOrOptions === 'object') {
    donId = donIdOrOptions.donDatId;
    ttTruoc = donIdOrOptions.trangThaiCu || null;
    ttSau = donIdOrOptions.trangThaiMoi;
    userId = donIdOrOptions.thayDoiBoiId || null;
    note = donIdOrOptions.ghiChu || null;
  } else {
    donId = donIdOrOptions;
    ttTruoc = trangThaiTruoc || null;
    ttSau = trangThaiSau!;
    userId = nguoiThucHienId || null;
    note = ghiChu || null;
  }

  await ketNoi.execute(
    `INSERT INTO nhat_ky_trang_thai_don (don_dat_id, trang_thai_truoc, trang_thai_sau, nguoi_thuc_hien_id, ghi_chu)
     VALUES (?, ?, ?, ?, ?)`,
    [donId, ttTruoc, ttSau, userId, note ? note.substring(0, 500) : null]
  );
}
