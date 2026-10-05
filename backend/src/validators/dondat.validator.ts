// =====================================================================
// VALIDATORS ĐẶT SÂN & DỊCH VỤ — plant/06-api.md mục 5.4, 5.5, 5.13, 5.17
// =====================================================================
import { z } from 'zod';
import { NGHIEP_VU } from '../config/nghiepvu';

export const luocDoTaoDonDat = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      let paymentMethod = val.paymentMethod ?? val.phuongThucThanhToan;
      if (paymentMethod === 'chuyenKhoan') paymentMethod = 'BANK_TRANSFER';
      if (paymentMethod === 'tienMat') paymentMethod = 'CASH';

      return {
        courtId: val.courtId !== undefined ? Number(val.courtId) : (val.sanId !== undefined ? Number(val.sanId) : undefined),
        bookingDate: val.bookingDate ?? val.ngayDat,
        timeSlotIds: val.timeSlotIds ?? val.danhSachKhungGioId,
        paymentMethod,
        note: val.note ?? val.ghiChu,
      };
    }
    return val;
  },
  z.object({
    courtId: z.number().int().positive('Mã sân không hợp lệ'),
    bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày đặt phải có định dạng YYYY-MM-DD'),
    timeSlotIds: z.array(z.number().int().positive()).min(1, 'Phải chọn ít nhất 1 khung giờ').max(NGHIEP_VU.SO_KHUNG_GIO_TOI_DA, `Tối đa ${NGHIEP_VU.SO_KHUNG_GIO_TOI_DA} khung giờ`),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'VNPAY'], {
      message: 'Phương thức thanh toán phải là CASH, BANK_TRANSFER hoặc VNPAY',
    }),
    note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional().nullable(),
  })
);

export const luocDoHuyDonKhach = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        reason: val.reason ?? val.lyDoHuy,
        refundInfo: val.refundInfo ?? val.thongTinHoanTien,
      };
    }
    return val;
  },
  z.object({
    reason: z.string().max(500).optional().nullable(),
    refundInfo: z.string().max(NGHIEP_VU.DO_DAI_REFUND_INFO_TOI_DA, `Thông tin hoàn tiền tối đa ${NGHIEP_VU.DO_DAI_REFUND_INFO_TOI_DA} ký tự`).optional().nullable(),
  })
);

export const luocDoDanhGia = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        rating: val.rating !== undefined ? Number(val.rating) : (val.soSao !== undefined ? Number(val.soSao) : undefined),
        comment: val.comment ?? val.noiDungDanhGia,
      };
    }
    return val;
  },
  z.object({
    rating: z.number().int().min(1, 'Đánh giá tối thiểu 1 sao').max(5, 'Đánh giá tối đa 5 sao'),
    comment: z.string().max(1000, 'Nhận xét tối đa 1000 ký tự').optional().nullable(),
  })
);

export const luocDoGoiDichVu = z.object({
  items: z.array(
    z.object({
      serviceId: z.number().int().positive('Mã dịch vụ không hợp lệ'),
      quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1').max(NGHIEP_VU.SO_LUONG_TOI_DA_MOI_DONG, `Số lượng tối đa mỗi món là ${NGHIEP_VU.SO_LUONG_TOI_DA_MOI_DONG}`),
    })
  ).min(1, 'Phải chọn ít nhất 1 dịch vụ').max(NGHIEP_VU.SO_DONG_TOI_DA_MOI_YEU_CAU, `Tối đa ${NGHIEP_VU.SO_DONG_TOI_DA_MOI_YEU_CAU} món trong một yêu cầu`),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional().nullable(),
});

export const luocDoHuyYeuCauDichVu = z.object({
  reason: z.string().max(500).optional().nullable(),
});
