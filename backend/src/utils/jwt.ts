// =====================================================================
// JWT — payload { sub: userId, role }, hạn JWT_EXPIRES_IN (AGENT.md mục 6)
// =====================================================================
import jwt from 'jsonwebtoken';
import { MOI_TRUONG } from '../config/moitruong';
import { VaiTro } from '../types';

export interface NoiDungToken {
  sub: number;
  role: VaiTro;
}

export function kyToken(nguoiDungId: number, role: VaiTro): string {
  const noiDung: NoiDungToken = { sub: nguoiDungId, role };
  return jwt.sign(noiDung, MOI_TRUONG.JWT_SECRET, {
    expiresIn: MOI_TRUONG.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function xacMinhToken(token: string): NoiDungToken {
  return jwt.verify(token, MOI_TRUONG.JWT_SECRET) as unknown as NoiDungToken;
}
