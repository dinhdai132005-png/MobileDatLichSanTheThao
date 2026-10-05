// =====================================================================
// MIDDLEWARE XÁC THỰC — AGENT.md mục 6, BR-16
// Verify JWT -> truy vấn lại bảng nguoi_dung -> nếu không tồn tại hoặc LOCKED thì 401
// =====================================================================
import { NextFunction, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/csdl';
import { LoiApi } from '../utils/loi';
import { xacMinhToken } from '../utils/jwt';
import { NguoiDungXacThuc } from '../types';

export async function xacThuc(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const tieuDe = req.headers.authorization;
  if (!tieuDe || !tieuDe.startsWith('Bearer ')) {
    return next(LoiApi.chuaXacThuc());
  }

  let noiDungToken;
  try {
    noiDungToken = xacMinhToken(tieuDe.substring(7).trim());
  } catch {
    return next(LoiApi.chuaXacThuc('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'));
  }

  try {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, ho_ten, so_dien_thoai, email, vai_tro, trang_thai FROM nguoi_dung WHERE id = ? LIMIT 1',
      [noiDungToken.sub]
    );
    if (danhSach.length === 0) {
      return next(LoiApi.chuaXacThuc('Tài khoản không tồn tại'));
    }
    const dong = danhSach[0];
    if (dong.trang_thai === 'LOCKED') {
      return next(LoiApi.chuaXacThuc('Tài khoản của bạn đã bị khóa', 'ACCOUNT_LOCKED'));
    }

    const nguoiDung: NguoiDungXacThuc = {
      id: dong.id,
      fullName: dong.ho_ten,
      phone: dong.so_dien_thoai,
      email: dong.email,
      role: dong.vai_tro,
      status: dong.trang_thai,
    };
    req.user = nguoiDung;
    req.nguoiDung = nguoiDung;
    next();
  } catch (loi) {
    next(loi);
  }
}

export const yeuCauXacThuc = xacThuc;
