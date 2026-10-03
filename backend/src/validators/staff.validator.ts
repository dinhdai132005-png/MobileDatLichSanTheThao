// =====================================================================
// STAFF VALIDATORS — TIẾNG VIỆT KHÔNG DẤU (Hỗ trợ alias)
// Tham chiếu: Plant/06-api.md mục 5.6, 5.7 & BR-09, BR-17
// =====================================================================
import { z } from 'zod';

export const staffCreateBookingSchema = z
  .object({
    sanId: z.coerce.number().int().positive().optional(),
    courtId: z.coerce.number().int().positive().optional(),
    ngayDat: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày: YYYY-MM-DD').optional(),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    danhSachKhungGioId: z.array(z.coerce.number().int().positive()).optional(),
    timeSlotIds: z.array(z.coerce.number().int().positive()).optional(),
    khachHangId: z.coerce.number().int().positive().optional().nullable(),
    customerId: z.coerce.number().int().positive().optional().nullable(),
    tenKhachHang: z.string().max(100).optional().nullable(),
    guestName: z.string().max(100).optional().nullable(),
    soDienThoaiKhach: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional().nullable(),
    guestPhone: z.string().regex(/^0\d{9}$/).optional().nullable(),
    phuongThucThanhToan: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
    thanhToanNgay: z.boolean().optional(),
    payNow: z.boolean().optional(),
    ghiChu: z.string().max(500).optional().nullable(),
    note: z.string().max(500).optional().nullable(),
  })
  .transform((data) => ({
    sanId: data.sanId || data.courtId || 0,
    ngayDat: data.ngayDat || data.bookingDate || '',
    danhSachKhungGioId: data.danhSachKhungGioId || data.timeSlotIds || [],
    khachHangId: data.khachHangId || data.customerId || null,
    tenKhachHang: data.tenKhachHang || data.guestName || null,
    soDienThoaiKhach: data.soDienThoaiKhach || data.guestPhone || null,
    phuongThucThanhToan: (data.phuongThucThanhToan || data.paymentMethod || 'CASH') as 'CASH' | 'BANK_TRANSFER',
    thanhToanNgay: data.thanhToanNgay !== undefined ? data.thanhToanNgay : (data.payNow !== undefined ? data.payNow : false),
    ghiChu: data.ghiChu || data.note || null,
  }))
  .refine((d) => d.sanId > 0, { message: 'Vui lòng chọn sân', path: ['sanId'] })
  .refine((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.ngayDat), { message: 'Định dạng ngày: YYYY-MM-DD', path: ['ngayDat'] })
  .refine((d) => d.danhSachKhungGioId.length >= 1 && d.danhSachKhungGioId.length <= 3, {
    message: 'Tối đa 3 khung giờ một lần',
    path: ['danhSachKhungGioId'],
  })
  .refine((d) => Boolean(d.khachHangId) || Boolean(d.soDienThoaiKhach), {
    message: 'Phải chọn tài khoản khách hàng hoặc nhập số điện thoại khách vãng lai (BR-17)',
    path: ['soDienThoaiKhach'],
  });

export const recordPaymentSchema = z.object({
  phuongThucThanhToan: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
  soTien: z.coerce.number().int().positive('Số tiền phải lớn hơn 0').optional(),
  amount: z.coerce.number().int().positive().optional(),
  maGiaoDichThamChieu: z.string().max(100).optional().nullable(),
  transactionRef: z.string().max(100).optional().nullable(),
  ghiChu: z.string().max(500).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
}).transform((data) => ({
  phuongThucThanhToan: (data.phuongThucThanhToan || data.method || 'CASH') as 'CASH' | 'BANK_TRANSFER',
  soTien: data.soTien || data.amount,
  maGiaoDichThamChieu: data.maGiaoDichThamChieu || data.transactionRef || null,
  ghiChu: data.ghiChu || data.note || null,
}));

export const staffCancelBookingSchema = z.object({
  lyDoHuy: z.string().min(1, 'Nhân viên bắt buộc phải nhập lý do khi hủy đơn (BR-09)').optional(),
  reason: z.string().min(1).optional(),
}).transform((data) => ({
  lyDoHuy: data.lyDoHuy || data.reason || '',
})).refine((d) => d.lyDoHuy.length >= 1, {
  message: 'Nhân viên bắt buộc phải nhập lý do khi hủy đơn (BR-09)',
  path: ['lyDoHuy'],
});
