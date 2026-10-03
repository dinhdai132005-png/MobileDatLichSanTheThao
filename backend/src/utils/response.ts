// =====================================================================
// CHUẨN RESPONSE API — Tham chiếu: Plant/AGENT.md mục 4
// Thành công: { "success": true, "message": "OK", "data": { } }
// Phân trang: { "success": true, "message": "OK", "data": { "items": [], "page": 1, "limit": 20, "total": 57 } }
// Lỗi: { "success": false, "message": "...", "errorCode": "...", "errors": null }
// =====================================================================
import { Response } from 'express';
import { ValidationErrorItem } from './errors';

export function ok<T>(res: Response, data: T, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function created<T>(res: Response, data: T, message = 'Tạo thành công') {
  return ok(res, data, message, 201);
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message = 'OK'
) {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      page,
      limit,
      total,
    },
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errorCode = 'INTERNAL_ERROR',
  errors: ValidationErrorItem[] | null = null
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
  });
}
