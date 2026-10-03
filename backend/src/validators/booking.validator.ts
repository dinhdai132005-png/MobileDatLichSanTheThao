// =====================================================================
// BOOKING VALIDATORS — TIẾNG VIỆT KHÔNG DẤU (Hỗ trợ alias)
// Tham chiếu: Plant/06-api.md mục 5.4 & BR-02, BR-03
// =====================================================================
import { z } from 'zod';

export const createBookingSchema = z.object({
  sanId: z.coerce.number().int().positive().optional(),
  courtId: z.coerce.number().int().positive().optional(),
  ngayDat: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày: YYYY-MM-DD').optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  danhSachKhungGioId: z.array(z.coerce.number().int().positive()).optional(),
  timeSlotIds: z.array(z.coerce.number().int().positive()).optional(),
  phuongThucThanhToan: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']).optional(),
  ghiChu: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional().nullable(),
  note: z.string().max(500).optional().nullable(),
}).transform((data) => ({
  sanId: data.sanId || data.courtId || 0,
  ngayDat: data.ngayDat || data.bookingDate || '',
  danhSachKhungGioId: data.danhSachKhungGioId || data.timeSlotIds || [],
  phuongThucThanhToan: data.phuongThucThanhToan || data.paymentMethod || 'CASH',
  ghiChu: data.ghiChu || data.note || null,
})).refine((d) => d.sanId > 0, { message: 'Vui lòng chọn sân hợp lệ', path: ['sanId'] })
  .refine((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.ngayDat), { message: 'Định dạng ngày đặt phải là YYYY-MM-DD', path: ['ngayDat'] })
  .refine((d) => d.danhSachKhungGioId.length >= 1 && d.danhSachKhungGioId.length <= 3, {
    message: 'Chỉ được chọn từ 1 đến 3 khung giờ một lần (BR-02)',
    path: ['danhSachKhungGioId'],
  });

export const cancelBookingSchema = z.object({
  lyDoHuy: z.string().max(500, 'Lý do không quá 500 ký tự').optional(),
  reason: z.string().max(500).optional(),
}).transform((data) => ({
  lyDoHuy: data.lyDoHuy || data.reason || 'Khách hàng tự hủy trên ứng dụng',
}));

export const reviewSchema = z.object({
  soSao: z.coerce.number().int().min(1, 'Đánh giá tối thiểu 1 sao').max(5, 'Đánh giá tối đa 5 sao').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  noiDungDanhGia: z.string().max(1000, 'Nội dung đánh giá tối đa 1000 ký tự').optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
}).transform((data) => ({
  soSao: data.soSao || data.rating || 5,
  noiDungDanhGia: data.noiDungDanhGia || data.comment || null,
}));
