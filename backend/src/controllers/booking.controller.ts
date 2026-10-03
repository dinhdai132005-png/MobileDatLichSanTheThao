// =====================================================================
// BỘ ĐIỀU KHIỂN ĐẶT SÂN (BOOKING CONTROLLER) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.2
// =====================================================================
import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { ok, created, paginated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class BookingController {
  static getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const ngayDat = (req.query.ngayDat || req.query.date) as string;
    const ketQua = await BookingService.getCourtAvailability(sanId, ngayDat);
    return ok(res, ketQua);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await BookingService.createBooking(req.user!, req.body);
    return created(res, ketQua, 'Đặt sân thành công');
  });

  static getMyBookings = asyncHandler(async (req: Request, res: Response) => {
    const chuoiTrangThai = (req.query.trangThai || req.query.status) as string | undefined;
    const ketQua = await BookingService.getMyBookings(req.user!, chuoiTrangThai);
    return ok(res, ketQua);
  });

  static getDetail = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await BookingService.getBookingDetail(req.user!, donDatId);
    return ok(res, ketQua);
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const lyDoHuy = req.body?.lyDoHuy || req.body?.reason;
    const ketQua = await BookingService.cancelBookingByCustomer(req.user!, donDatId, lyDoHuy);
    return ok(res, ketQua, ketQua.message);
  });

  static review = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const { soSao, noiDungDanhGia } = req.body;
    const ketQua = await BookingService.reviewBooking(req.user!, donDatId, soSao, noiDungDanhGia);
    return created(res, ketQua, ketQua.message);
  });

  static getCourtReviews = asyncHandler(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const trang = Number(req.query.trang || req.query.page) || 1;
    const gioiHan = Number(req.query.gioiHan || req.query.limit) || 20;
    const ketQua = await BookingService.getCourtReviews(sanId, trang, gioiHan);
    return paginated(res, ketQua.items, ketQua.total, ketQua.page, ketQua.limit);
  });
}
