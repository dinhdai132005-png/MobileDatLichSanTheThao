// =====================================================================
// ERROR MIDDLEWARE — Tham chiếu: Plant/AGENT.md mục 4 & 06-api.md mục 3
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. ApiError do hệ thống chủ động ném ra
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.errors);
  }

  // 2. Lỗi MySQL trùng UNIQUE KEY (ER_DUP_ENTRY) - BR-04
  if (err && err.code === 'ER_DUP_ENTRY') {
    if (err.message && err.message.includes('uq_slot_active')) {
      return sendError(res, 'Khung giờ này đã có người đặt trước', 409, 'SLOT_TAKEN');
    }
    if (err.message && err.message.includes('uq_users_phone')) {
      return sendError(res, 'Số điện thoại này đã được đăng ký', 409, 'PHONE_EXISTS');
    }
    if (err.message && err.message.includes('uq_users_email')) {
      return sendError(res, 'Email này đã được sử dụng', 409, 'EMAIL_EXISTS');
    }
    return sendError(res, 'Dữ liệu bị trùng lặp trong hệ thống', 409, 'CONFLICT');
  }

  // 3. Lỗi JSON syntax sai từ body parser
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return sendError(res, 'Cấu trúc JSON trong request không hợp lệ', 400, 'VALIDATION_ERROR');
  }

  // 4. Lỗi máy chủ không xác định
  console.error('💥 [Server Internal Error]', err);
  return sendError(res, 'Lỗi máy chủ nội bộ', 500, 'INTERNAL_ERROR');
}
