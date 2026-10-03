// =====================================================================
// ROLE MIDDLEWARE — Tham chiếu: Plant/AGENT.md mục 6 & 03-actors-functions.md
// =====================================================================
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { UserRole } from '../types';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Bạn không có quyền truy cập chức năng này'));
    }

    next();
  };
}
