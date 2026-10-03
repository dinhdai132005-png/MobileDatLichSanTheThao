// =====================================================================
// AUTH MIDDLEWARE — Tham chiếu: Plant/AGENT.md mục 6 & Quy tắc BR-16
// Verify JWT -> Truy vấn lại DB lấy user -> Kiểm tra status = 'LOCKED'
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { ApiError } from '../utils/errors';
import { verifyToken } from '../utils/jwt';
import { NguoiDungXacThuc, VaiTroNguoiDung, TrangThaiNguoiDung } from '../types';

export async function auth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const tieuDeAuth = req.headers.authorization;
  if (!tieuDeAuth || !tieuDeAuth.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Vui lòng đăng nhập để tiếp tục', 'UNAUTHORIZED'));
  }

  const chuoiToken = tieuDeAuth.substring(7).trim();
  try {
    const maXacThuc = verifyToken(chuoiToken);

    // BR-16: Truy vấn lại DB để kiểm tra tài khoản còn tồn tại và không bị khóa
    const [danhSachNguoiDung] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name, phone, email, role, status FROM users WHERE id = ? LIMIT 1',
      [maXacThuc.sub]
    );

    if (danhSachNguoiDung.length === 0) {
      return next(ApiError.unauthorized('Tài khoản không tồn tại', 'UNAUTHORIZED'));
    }

    const nguoiDungDb = danhSachNguoiDung[0];
    if (nguoiDungDb.status === 'LOCKED') {
      return next(ApiError.unauthorized('Tài khoản của bạn đã bị khóa', 'ACCOUNT_LOCKED'));
    }

    const nguoiDungHienTai: NguoiDungXacThuc = {
      id: nguoiDungDb.id,
      hoTen: nguoiDungDb.full_name,
      soDienThoai: nguoiDungDb.phone,
      email: nguoiDungDb.email,
      role: nguoiDungDb.role as VaiTroNguoiDung,
      status: nguoiDungDb.status as TrangThaiNguoiDung,
    };

    req.user = nguoiDungHienTai;
    next();
  } catch (err: any) {
    if (err instanceof ApiError) return next(err);
    return next(ApiError.unauthorized('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 'UNAUTHORIZED'));
  }
}
