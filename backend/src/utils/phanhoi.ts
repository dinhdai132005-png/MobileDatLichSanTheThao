// =====================================================================
// CHUẨN RESPONSE API — plant/AGENT.md mục 4
// Thành công: { success: true, message, data }
// Phân trang: data = { items, page, limit, total }
// Lỗi:        { success: false, message, errorCode, errors }
// =====================================================================
import { Response } from 'express';
import { LoiKiemTraDauVao } from './loi';

export function thanhCong<T>(res: Response, data: T, thongBao = 'OK', maTrangThai = 200) {
  return res.status(maTrangThai).json({ success: true, message: thongBao, data });
}

export function taoMoi<T>(res: Response, data: T, thongBao = 'Tạo thành công') {
  return thanhCong(res, data, thongBao, 201);
}

export const phanHoiThanhCong = thanhCong;
export const phanHoiTaoThanhCong = taoMoi;

export function phanTrang<T>(res: Response, items: T[], tong: number, trang: number, gioiHan: number, thongBao = 'OK') {
  return thanhCong(res, { items, page: trang, limit: gioiHan, total: tong }, thongBao);
}

export function phanHoiLoi(
  res: Response,
  thongBao: string,
  maTrangThai = 500,
  maLoi = 'INTERNAL_ERROR',
  danhSachLoi: LoiKiemTraDauVao[] | null = null,
  duLieu?: unknown
) {
  const noiDung: Record<string, unknown> = { success: false, message: thongBao, errorCode: maLoi, errors: danhSachLoi };
  if (duLieu !== undefined) noiDung.data = duLieu;
  return res.status(maTrangThai).json(noiDung);
}
