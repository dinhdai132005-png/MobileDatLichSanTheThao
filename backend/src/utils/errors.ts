// =====================================================================
// API ERROR — Chuẩn hóa mã lỗi và HTTP status theo Plant/06-api.md mục 3
// =====================================================================

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errors?: ValidationErrorItem[] | null;

  constructor(statusCode: number, errorCode: string, message: string, errors: ValidationErrorItem[] | null = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message = 'Dữ liệu không hợp lệ', errorCode = 'VALIDATION_ERROR', errors: ValidationErrorItem[] | null = null) {
    return new ApiError(400, errorCode, message, errors);
  }

  static unauthorized(message = 'Chưa xác thực hoặc token không hợp lệ', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, errorCode, message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này', errorCode = 'FORBIDDEN') {
    return new ApiError(403, errorCode, message);
  }

  static notFound(message = 'Không tìm thấy tài nguyên yêu cầu', errorCode = 'NOT_FOUND') {
    return new ApiError(404, errorCode, message);
  }

  static conflict(message: string, errorCode = 'CONFLICT') {
    return new ApiError(409, errorCode, message);
  }

  static unprocessable(message: string, errorCode = 'UNPROCESSABLE_ENTITY') {
    return new ApiError(422, errorCode, message);
  }

  static internal(message = 'Lỗi máy chủ nội bộ', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, errorCode, message);
  }
}
