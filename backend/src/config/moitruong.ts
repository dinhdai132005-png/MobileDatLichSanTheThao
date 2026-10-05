// =====================================================================
// CẤU HÌNH BIẾN MÔI TRƯỜNG — validate bằng zod
// Tham chiếu: plant/07-architecture.md mục 3.1, AGENT.md mục 12
// =====================================================================
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const luocDoMoiTruong = z.object({
  PORT: z.string().default('4000').transform(Number),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306').transform(Number),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('sport_booking'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET phải có ít nhất 10 ký tự'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TZ: z.string().default('Asia/Ho_Chi_Minh'),
  BANK_NAME: z.string().default('Vietcombank'),
  BANK_ACCOUNT_NO: z.string().default('0123456789'),
  BANK_ACCOUNT_NAME: z.string().default('TEN CHU TAI KHOAN'),
  ADMIN_PHONE: z.string().default('0900000001'),
  ADMIN_PASSWORD: z.string().min(6).default('doi-mat-khau-nay'),
});

const ketQuaDoc = luocDoMoiTruong.safeParse(process.env);

if (!ketQuaDoc.success) {
  const chiTiet = ketQuaDoc.error.issues.map((loi) => `- ${loi.path.join('.')}: ${loi.message}`).join('\n');
  throw new Error(`Biến môi trường không hợp lệ:\n${chiTiet}`);
}

export const MOI_TRUONG = ketQuaDoc.data;
