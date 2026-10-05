// =====================================================================
// MIDDLEWARE BẮT LỖI TOÀN CỤC — AGENT.md mục 4, 06-api.md mục 3
// Che chi tiết lỗi lạ: trả INTERNAL_ERROR.
// =====================================================================
import { NextFunction, Request, Response } from 'express';
import { LoiApi } from '../utils/loi';
import { phanHoiLoi } from '../utils/phanhoi';

export function xuLyLoi(loi: any, _req: Request, res: Response, _next: NextFunction) {
  if (loi instanceof LoiApi) {
    return phanHoiLoi(res, loi.message, loi.maTrangThai, loi.maLoi, loi.danhSachLoi, loi.duLieu);
  }

  // BR-04: trùng UNIQUE KEY ở DB tiếng Việt không dấu
  if (loi && loi.code === 'ER_DUP_ENTRY') {
    const noiDung: string = String(loi.message ?? '');
    if (noiDung.includes('uq_slot_dang_khoa') || noiDung.includes('uq_slot_active')) {
      return phanHoiLoi(res, 'Khung giờ đã có người đặt', 409, 'SLOT_TAKEN');
    }
    if (noiDung.includes('uq_nguoi_dung_sdt') || noiDung.includes('uq_users_phone')) {
      return phanHoiLoi(res, 'Số điện thoại đã được đăng ký', 409, 'PHONE_EXISTS');
    }
    if (noiDung.includes('uq_nguoi_dung_email') || noiDung.includes('uq_users_email')) {
      return phanHoiLoi(res, 'Email đã được sử dụng', 409, 'EMAIL_EXISTS');
    }
    if (noiDung.includes('uq_danh_gia_don_dat') || noiDung.includes('uq_reviews_booking')) {
      return phanHoiLoi(res, 'Đơn đặt này đã được đánh giá', 409, 'ALREADY_REVIEWED');
    }
    return phanHoiLoi(res, 'Dữ liệu bị trùng lặp trong hệ thống', 409, 'CONFLICT');
  }

  // JSON body sai cú pháp
  if (loi && loi.type === 'entity.parse.failed') {
    return phanHoiLoi(res, 'Cấu trúc JSON không hợp lệ', 400, 'VALIDATION_ERROR');
  }

  console.error('[Lỗi máy chủ]', loi);
  return phanHoiLoi(res, 'Lỗi máy chủ nội bộ', 500, 'INTERNAL_ERROR');
}
