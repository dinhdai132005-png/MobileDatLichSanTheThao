// =====================================================================
// MIDDLEWARE PHÂN QUYỀN — AGENT.md mục 6: sai role -> 403 FORBIDDEN
// ADMIN phải được liệt kê rõ ở các route của STAFF: yeuCauVaiTro('STAFF', 'ADMIN')
// =====================================================================
import { NextFunction, Request, Response } from 'express';
import { LoiApi } from '../utils/loi';
import { VaiTro } from '../types';

export function yeuCauVaiTro(...vaiTroChoPhep: VaiTro[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(LoiApi.chuaXacThuc());
    if (!vaiTroChoPhep.includes(req.user.role)) {
      return next(LoiApi.camTruyCap('Bạn không có quyền truy cập chức năng này'));
    }
    next();
  };
}

export const choPhepVaiTro = yeuCauVaiTro;
