// =====================================================================
// MIDDLEWARE KIỂM TRA ĐẦU VÀO (zod) — sai thì 400 VALIDATION_ERROR kèm errors[]
// Express 5: req.query / req.params là getter, nên ghi đè bằng defineProperty.
// =====================================================================
import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { LoiApi, LoiKiemTraDauVao } from '../utils/loi';

export function kiemTra(luocDo: ZodType, nguon: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ketQua = luocDo.safeParse(req[nguon] ?? {});
    if (!ketQua.success) {
      const danhSachLoi: LoiKiemTraDauVao[] = ketQua.error.issues.map((loi) => ({
        field: loi.path.length > 0 ? loi.path.join('.') : nguon,
        message: loi.message,
      }));
      return next(LoiApi.yeuCauKhongHopLe(danhSachLoi[0]?.message ?? 'Dữ liệu không hợp lệ', 'VALIDATION_ERROR', danhSachLoi));
    }
    Object.defineProperty(req, nguon, { value: ketQua.data, writable: true, configurable: true, enumerable: true });
    next();
  };
}

export const kiemTraDuLieu = kiemTra;
