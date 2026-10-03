// =====================================================================
// TIỆN ÍCH JWT — Tham chiếu: Plant/AGENT.md mục 6
// =====================================================================
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { VaiTroNguoiDung } from '../types';

export interface JwtPayload {
  sub: number;              // id người dùng
  role: VaiTroNguoiDung;    // CUSTOMER | STAFF | ADMIN
}

export function signToken(nguoiDungId: number, role: VaiTroNguoiDung): string {
  const duLieuToken: JwtPayload = { sub: nguoiDungId, role };
  return jwt.sign(duLieuToken, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as unknown as JwtPayload;
}
