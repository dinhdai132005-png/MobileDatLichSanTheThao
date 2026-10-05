// =====================================================================
// VALIDATORS NHÂN VIÊN — plant/06-api.md mục 4.3, 5.6, 5.7, 5.15, 5.16
// =====================================================================
import { z } from 'zod';
import { NGHIEP_VU } from '../config/nghiepvu';

export const luocDoNhanVienDatSan = z
  .object({
    courtId: z.number().int().positive('Mã sân không hợp lệ'),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày đặt phải có định dạng YYYY-MM-DD'),
    timeSlotIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất 1 khung giờ').max(NGHIEP_VU.SO_KHUNG_GIO_TOI_DA, `Tối đa ${NGHIEP_VU.SO_KHUNG_GIO_TOI_DA} khung giờ`),
    customerId: z.number().int().positive().optional().nullable(),
    guestName: z.string().trim().min(2, 'Tên khách tối thiểu 2 ký tự').optional().nullable(),
    guestPhone: z.string().regex(/^0\d{9}$/, 'Số điện thoại khách phải gồm 10 chữ số').optional().nullable(),
    payNow: z.boolean().default(false),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']).default('CASH'),
    note: z.string().max(500).optional().nullable(),
  })
  .refine(
    (duLieu) => duLieu.customerId !== null && duLieu.customerId !== undefined || (Boolean(duLieu.guestPhone) && Boolean(duLieu.guestName)),
    {
      message: 'Phải chọn tài khoản khách hàng hoặc nhập đầy đủ tên và số điện thoại khách vãng lai',
      path: ['customerId'],
    }
  );

export const luocDoGhiNhanThanhToan = z.object({
  method: z.enum(['CASH', 'BANK_TRANSFER'], { message: 'Phương thức thanh toán phải là CASH hoặc BANK_TRANSFER' }),
  transactionRef: z.string().max(100).optional().nullable(),
});

export const luocDoNhanVienHuyDon = z.object({
  reason: z.string().trim().min(3, 'Lý do hủy bắt buộc (tối thiểu 3 ký tự)').max(500),
  refundInfo: z.string().max(NGHIEP_VU.DO_DAI_REFUND_INFO_TOI_DA).optional().nullable(),
});

export const luocDoXacNhanHoanTien = z.object({
  transactionRef: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const luocDoThuTienDichVu = z.object({
  method: z.enum(['CASH', 'BANK_TRANSFER']).default('CASH'),
  transactionRef: z.string().max(100).optional().nullable(),
});

export const luocDoBatTatDichVuNhanVien = z.object({
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK'], { message: 'Trạng thái chỉ được là ACTIVE hoặc OUT_OF_STOCK' }),
});

export const luocDoHuyYeuCauNhanVien = z.object({
  reason: z.string().trim().min(3, 'Lý do hủy yêu cầu bắt buộc (tối thiểu 3 ký tự)').max(500),
});
