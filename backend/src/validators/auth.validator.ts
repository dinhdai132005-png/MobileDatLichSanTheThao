// =====================================================================
// AUTH VALIDATORS — TIẾNG VIỆT KHÔNG DẤU (Hỗ trợ kèm alias)
// Tham chiếu: Plant/06-api.md mục 4.1 & Quy tắc BR-21
// BR-21: SĐT ^0\d{9}$, Mật khẩu >= 6 ký tự, Họ tên 2-100 ký tự
// =====================================================================
import { z } from 'zod';

export const registerSchema = z.object({
  hoTen: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên không được vượt quá 100 ký tự').optional(),
  fullName: z.string().min(2).max(100).optional(),
  soDienThoai: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng số 0)').optional(),
  phone: z.string().regex(/^0\d{9}$/).optional(),
  matKhau: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
  password: z.string().min(6).optional(),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  hoTen: data.hoTen || data.fullName || '',
  soDienThoai: data.soDienThoai || data.phone || '',
  matKhau: data.matKhau || data.password || '',
  email: data.email || null,
})).refine((d) => d.hoTen.length >= 2, { message: 'Vui lòng nhập họ tên từ 2 ký tự trở lên', path: ['hoTen'] })
  .refine((d) => /^0\d{9}$/.test(d.soDienThoai), { message: 'Số điện thoại bắt buộc 10 số (bắt đầu bằng 0)', path: ['soDienThoai'] })
  .refine((d) => d.matKhau.length >= 6, { message: 'Mật khẩu phải có ít nhất 6 ký tự', path: ['matKhau'] });

export const loginSchema = z.object({
  soDienThoai: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional(),
  phone: z.string().regex(/^0\d{9}$/).optional(),
  taiKhoan: z.string().optional(),
  matKhau: z.string().min(1, 'Vui lòng nhập mật khẩu').optional(),
  password: z.string().min(1).optional(),
}).transform((data) => ({
  soDienThoai: data.soDienThoai || data.phone || data.taiKhoan || '',
  matKhau: data.matKhau || data.password || '',
})).refine((d) => /^0\d{9}$/.test(d.soDienThoai), { message: 'Số điện thoại đăng nhập không hợp lệ', path: ['soDienThoai'] })
  .refine((d) => d.matKhau.length >= 1, { message: 'Vui lòng nhập mật khẩu', path: ['matKhau'] });

export const updateMeSchema = z.object({
  hoTen: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  hoTen: data.hoTen || data.fullName,
  email: data.email,
}));

export const changePasswordSchema = z.object({
  matKhauCu: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại').optional(),
  oldPassword: z.string().min(1).optional(),
  matKhauMoi: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').optional(),
  newPassword: z.string().min(6).optional(),
}).transform((data) => ({
  matKhauCu: data.matKhauCu || data.oldPassword || '',
  matKhauMoi: data.matKhauMoi || data.newPassword || '',
})).refine((d) => d.matKhauCu.length >= 1, { message: 'Vui lòng nhập mật khẩu hiện tại', path: ['matKhauCu'] })
  .refine((d) => d.matKhauMoi.length >= 6, { message: 'Mật khẩu mới phải từ 6 ký tự trở lên', path: ['matKhauMoi'] });
