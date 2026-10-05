// =====================================================================
// VALIDATORS XÁC THỰC — plant/06-api.md mục 4.1, 5.1, 5.2; BR-21
// =====================================================================
import { z } from 'zod';
import { NGHIEP_VU } from '../config/nghiepvu';

export const luocDoDangKy = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        fullName: val.fullName ?? val.hoTen,
        phone: val.phone ?? val.soDienThoai,
        password: val.password ?? val.matKhau,
        email: val.email,
      };
    }
    return val;
  },
  z.object({
    fullName: z.string().trim().min(2, 'Họ tên phải từ 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0'),
    password: z.string().min(NGHIEP_VU.MAT_KHAU_TOI_THIEU, `Mật khẩu phải từ ${NGHIEP_VU.MAT_KHAU_TOI_THIEU} ký tự`),
    email: z.string().email('Email không đúng định dạng').optional().nullable(),
  })
);

export const luocDoDangNhap = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        phone: val.phone ?? val.soDienThoai,
        password: val.password ?? val.matKhau,
      };
    }
    return val;
  },
  z.object({
    phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  })
);

export const luocDoCapNhatHoSo = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        fullName: val.fullName ?? val.hoTen,
        email: val.email,
      };
    }
    return val;
  },
  z.object({
    fullName: z.string().trim().min(2, 'Họ tên phải từ 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    email: z.string().email('Email không đúng định dạng').optional().nullable(),
  })
);

export const luocDoDoiMatKhau = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        currentPassword: val.currentPassword ?? val.matKhauHienTai,
        newPassword: val.newPassword ?? val.matKhauMoi,
      };
    }
    return val;
  },
  z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(NGHIEP_VU.MAT_KHAU_TOI_THIEU, `Mật khẩu mới phải từ ${NGHIEP_VU.MAT_KHAU_TOI_THIEU} ký tự`),
  })
);

export const luocDoCapNhatThongTin = luocDoCapNhatHoSo;
