// =====================================================================
// VALIDATORS QUẢN TRỊ — plant/06-api.md mục 4.4, 5.10, 5.18, 5.21, 5.22
// =====================================================================
import { z } from 'zod';
import { NGHIEP_VU } from '../config/nghiepvu';

export const luocDoLoaiSan = z.object({
  name: z.string().trim().min(2, 'Tên loại sân tối thiểu 2 ký tự').max(100),
  category: z.enum(['SPORT', 'EVENT']).default('SPORT'),
  description: z.string().max(500).optional().nullable(),
});

export const luocDoCapNhatLoaiSan = luocDoLoaiSan.partial();

export const luocDoSan = z.object({
  courtTypeId: z.number().int().positive('Loại sân không hợp lệ'),
  name: z.string().trim().min(2, 'Tên sân tối thiểu 2 ký tự').max(100),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url('Đường dẫn ảnh không hợp lệ').optional().nullable(),
  capacity: z.number().int().positive('Sức chứa phải là số dương').optional().nullable(),
});

export const luocDoCapNhatSan = luocDoSan.partial();

export const luocDoDoiTrangThaiSan = z.object({
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']),
});

export const luocDoKhungGio = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ bắt đầu phải có dạng HH:mm'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ kết thúc phải có dạng HH:mm'),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'Giờ kết thúc phải lớn hơn giờ bắt đầu',
    path: ['endTime'],
  });

export const luocDoGiaKhungGioHangLoat = z.object({
  courtTypeId: z.number().int().positive('Mã loại sân không hợp lệ'),
  prices: z.array(
    z.object({
      timeSlotId: z.number().int().positive(),
      dayType: z.enum(['WEEKDAY', 'WEEKEND']),
      price: z.number().int().nonnegative('Giá tiền không được âm'),
    })
  ).min(1, 'Danh sách giá không được rỗng'),
});

export const luocDoTaoNhanVien = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0'),
  password: z.string().min(NGHIEP_VU.MAT_KHAU_TOI_THIEU, `Mật khẩu tối thiểu ${NGHIEP_VU.MAT_KHAU_TOI_THIEU} ký tự`),
  email: z.string().email('Email không đúng định dạng').optional().nullable(),
});

export const luocDoCapNhatNhanVien = z.object({
  fullName: z.string().trim().min(2, 'Họ tên tối thiểu 2 ký tự').max(100).optional(),
  email: z.string().email('Email không đúng định dạng').optional().nullable(),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0').optional(),
});

export const luocDoDoiTrangThaiTaiKhoan = z.object({
  status: z.enum(['ACTIVE', 'LOCKED']),
});

export const luocDoDatLaiMatKhau = z.object({
  newPassword: z.string().min(NGHIEP_VU.MAT_KHAU_TOI_THIEU, `Mật khẩu mới tối thiểu ${NGHIEP_VU.MAT_KHAU_TOI_THIEU} ký tự`),
});

export const luocDoDongDonCongNo = z.object({
  reason: z.string().trim().min(5, 'Lý do đóng đơn có công nợ bắt buộc (tối thiểu 5 ký tự)').max(500),
});

export const luocDoDichVu = z.object({
  name: z.string().trim().min(2, 'Tên dịch vụ tối thiểu 2 ký tự').max(100),
  type: z.enum(['DRINK', 'RENTAL', 'PACKAGE']),
  unit: z.string().trim().min(1, 'Đơn vị tính bắt buộc').max(30).default('cái'),
  price: z.number().int().nonnegative('Đơn giá không được âm'),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const luocDoCapNhatDichVu = luocDoDichVu.partial();

export const luocDoDoiTrangThaiDichVu = z.object({
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'INACTIVE']),
});

export const luocDoNhapKho = z.object({
  serviceId: z.number().int().positive('Mã dịch vụ không hợp lệ'),
  quantity: z.number().int().positive('Số lượng nhập phải là số nguyên dương'),
  note: z.string().max(500).optional().nullable(),
});

export const luocDoDieuChinhKho = z.object({
  serviceId: z.number().int().positive('Mã dịch vụ không hợp lệ'),
  type: z.enum(['ADJUST_IN', 'ADJUST_OUT']),
  quantity: z.number().int().positive('Số lượng điều chỉnh phải là số nguyên dương'),
  reason: z.string().trim().min(3, 'Lý do điều chỉnh tối thiểu 3 ký tự').max(500),
});

export const luocDoNguongCanhBao = z.object({
  threshold: z.number().int().nonnegative('Ngưỡng cảnh báo không được âm'),
});

