// =====================================================================
// BỘ ĐIỀU KHIỂN NHÂN VIÊN (STAFF CONTROLLER) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.3
// =====================================================================
import { Request, Response } from 'express';
import { StaffService } from '../services/staff.service';
import { BookingService } from '../services/booking.service';
import { ok, created, paginated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class StaffController {
  static getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await StaffService.getDashboard();
    return ok(res, ketQua);
  });

  static getSchedule = asyncHandler(async (req: Request, res: Response) => {
    const ngayDat = ((req.query.ngayDat || req.query.date) as string) || new Date().toISOString().substring(0, 10);
    const ketQua = await StaffService.getScheduleGrid(ngayDat);
    return ok(res, ketQua);
  });

  static getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { ngayDat, date, sanId, courtId, trangThai, status, trangThaiThanhToan, paymentStatus, tuKhoa, keyword, trang, page, gioiHan, limit } = req.query;
    const ketQua = await StaffService.getBookings({
      ngayDat: (ngayDat || date) as string,
      sanId: (sanId || courtId) ? Number(sanId || courtId) : undefined,
      trangThai: (trangThai || status) as string,
      trangThaiThanhToan: (trangThaiThanhToan || paymentStatus) as string,
      tuKhoa: (tuKhoa || keyword) as string,
      trang: (trang || page) ? Number(trang || page) : 1,
      gioiHan: (gioiHan || limit) ? Number(gioiHan || limit) : 20,
    });
    return paginated(res, ketQua.items, ketQua.total, ketQua.page, ketQua.limit);
  });

  static getBookingDetail = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await BookingService.getBookingDetail(req.user!, donDatId);
    return ok(res, ketQua);
  });

  static createWalkIn = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await StaffService.createWalkInBooking(req.user!, req.body);
    return created(res, ketQua, 'Đặt sân tại quầy thành công');
  });

  static recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await StaffService.recordPayment(req.user!, donDatId, req.body);
    return ok(res, ketQua, ketQua.message);
  });

  static complete = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await StaffService.completeBooking(req.user!, donDatId);
    return ok(res, ketQua, ketQua.message);
  });

  static noShow = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await StaffService.markNoShow(req.user!, donDatId);
    return ok(res, ketQua, ketQua.message);
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const lyDoHuy = req.body.lyDoHuy || req.body.reason;
    const ketQua = await StaffService.cancelBookingByStaff(req.user!, donDatId, lyDoHuy);
    return ok(res, ketQua, ketQua.message);
  });

  static getRefunds = asyncHandler(async (req: Request, res: Response) => {
    const trangThai = (req.query.trangThai || req.query.status) as string | undefined;
    const ketQua = await StaffService.getRefunds(trangThai);
    return ok(res, ketQua);
  });

  static confirmRefund = asyncHandler(async (req: Request, res: Response) => {
    const giaoDichId = Number(req.params.id);
    const ketQua = await StaffService.confirmRefund(req.user!, giaoDichId);
    return ok(res, ketQua, ketQua.message);
  });

  static getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const tuKhoa = (req.query.tuKhoa || req.query.keyword) as string | undefined;
    const ketQua = await StaffService.getCustomers(tuKhoa);
    return ok(res, ketQua);
  });

  static getCustomerDetail = asyncHandler(async (req: Request, res: Response) => {
    const khachHangId = Number(req.params.id);
    const ketQua = await StaffService.getCustomerDetail(khachHangId);
    return ok(res, ketQua);
  });
}
