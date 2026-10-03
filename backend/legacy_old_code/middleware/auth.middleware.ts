// ============================================================
// JWT MIDDLEWARE — Xác thực Bearer Token
// ============================================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  vaiTro: 'CUSTOMER' | 'STAFF' | 'ADMIN';
}

// Mở rộng Request type để gắn user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Chưa xác thực. Vui lòng đăng nhập.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

/** Chỉ cho phép các role cụ thể */
export function requireRole(...roles: Array<'CUSTOMER' | 'STAFF' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.vaiTro)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
      return;
    }
    next();
  };
}
