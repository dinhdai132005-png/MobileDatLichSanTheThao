// =====================================================================
// ADMIN VALIDATORS — TIẾNG VIỆT KHÔNG DẤU (Hỗ trợ alias)
// Tham chiếu: Plant/06-api.md mục 4.4 & BR-05, BR-19
// =====================================================================
import { z } from 'zod';

export const courtTypeSchema = z.object({
  tenLoaiSan: z.string().min(2, 'Tên loại sân tối thiểu 2 ký tự').max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  moTa: z.string().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
}).transform((data) => ({
  tenLoaiSan: data.tenLoaiSan || data.name || '',
  moTa: data.moTa || data.description || null,
})).refine((d) => d.tenLoaiSan.length >= 2, { message: 'Tên loại sân tối thiểu 2 ký tự', path: ['tenLoaiSan'] });

export const updateCourtTypeSchema = z.object({
  tenLoaiSan: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  moTa: z.string().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
}).transform((data) => ({
  tenLoaiSan: data.tenLoaiSan || data.name,
  moTa: data.moTa !== undefined ? data.moTa : data.description,
}));

export const courtSchema = z.object({
  loaiSanId: z.coerce.number().int().positive().optional(),
  courtTypeId: z.coerce.number().int().positive().optional(),
  tenSan: z.string().min(2, 'Tên sân tối thiểu 2 ký tự').max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  moTa: z.string().max(1000).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  anhUrl: z.string().url('Đường dẫn ảnh không hợp lệ').optional().or(z.literal('')).nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
  trangThai: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
}).transform((data) => ({
  loaiSanId: data.loaiSanId || data.courtTypeId || 1,
  tenSan: data.tenSan || data.name || '',
  moTa: data.moTa || data.description || null,
  anhUrl: data.anhUrl || data.imageUrl || null,
  trangThai: (data.trangThai || data.status || 'ACTIVE') as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE',
})).refine((d) => d.tenSan.length >= 2, { message: 'Tên sân tối thiểu 2 ký tự', path: ['tenSan'] });

export const updateCourtSchema = z.object({
  loaiSanId: z.coerce.number().int().positive().optional(),
  courtTypeId: z.coerce.number().int().positive().optional(),
  tenSan: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  moTa: z.string().max(1000).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  anhUrl: z.string().url().optional().or(z.literal('')).nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  loaiSanId: data.loaiSanId || data.courtTypeId,
  tenSan: data.tenSan || data.name,
  moTa: data.moTa !== undefined ? data.moTa : data.description,
  anhUrl: data.anhUrl !== undefined ? data.anhUrl : data.imageUrl,
}));

export const timeSlotSchema = z.object({
  gioBatDau: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ: HH:mm').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  gioKetThuc: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ: HH:mm').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
}).transform((data) => ({
  gioBatDau: data.gioBatDau || data.startTime || '',
  gioKetThuc: data.gioKetThuc || data.endTime || '',
})).refine((d) => d.gioBatDau.length > 0 && d.gioKetThuc.length > 0, { message: 'Vui lòng nhập giờ bắt đầu và kết thúc' });

export const slotPriceItemSchema = z.object({
  loaiSanId: z.coerce.number().int().positive().optional(),
  courtTypeId: z.coerce.number().int().positive().optional(),
  khungGioId: z.coerce.number().int().positive().optional(),
  timeSlotId: z.coerce.number().int().positive().optional(),
  loaiNgay: z.enum(['WEEKDAY', 'WEEKEND']).optional(),
  dayType: z.enum(['WEEKDAY', 'WEEKEND']).optional(),
  giaTien: z.coerce.number().int().min(0, 'Giá tiền không được âm').optional(),
  price: z.coerce.number().int().min(0).optional(),
}).transform((data) => ({
  loaiSanId: data.loaiSanId || data.courtTypeId || 1,
  khungGioId: data.khungGioId || data.timeSlotId || 1,
  loaiNgay: (data.loaiNgay || data.dayType || 'WEEKDAY') as 'WEEKDAY' | 'WEEKEND',
  giaTien: data.giaTien !== undefined ? data.giaTien : (data.price !== undefined ? data.price : 0),
}));

export const bulkSlotPricesSchema = z.object({
  danhSachGia: z.array(slotPriceItemSchema).optional(),
  prices: z.array(slotPriceItemSchema).optional(),
}).transform((data) => ({
  danhSachGia: data.danhSachGia || data.prices || [],
})).refine((d) => d.danhSachGia.length >= 1, { message: 'Cần ít nhất một mức giá để cập nhật' });

export const createStaffSchema = z.object({
  hoTen: z.string().min(2).max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  soDienThoai: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional(),
  phone: z.string().regex(/^0\d{9}$/).optional(),
  matKhau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional(),
  password: z.string().min(6).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  hoTen: data.hoTen || data.fullName || '',
  soDienThoai: data.soDienThoai || data.phone || '',
  matKhau: data.matKhau || data.password || '',
  email: data.email || null,
})).refine((d) => d.hoTen.length >= 2, { message: 'Họ tên tối thiểu 2 ký tự', path: ['hoTen'] })
  .refine((d) => /^0\d{9}$/.test(d.soDienThoai), { message: 'Số điện thoại không hợp lệ', path: ['soDienThoai'] })
  .refine((d) => d.matKhau.length >= 6, { message: 'Mật khẩu tối thiểu 6 ký tự', path: ['matKhau'] });

export const updateStaffSchema = z.object({
  hoTen: z.string().min(2).max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
}).transform((data) => ({
  hoTen: data.hoTen || data.fullName,
  email: data.email,
}));
