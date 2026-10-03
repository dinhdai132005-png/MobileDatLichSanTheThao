// =====================================================================
// BỘ ĐIỀU KHIỂN QUẢN TRỊ (ADMIN CONTROLLER) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.4
// =====================================================================
import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { ok, created } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class AdminController {
  // 1. Loại sân
  static getCourtTypes = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await AdminService.getCourtTypes();
    return ok(res, ketQua);
  });

  static createCourtType = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AdminService.createCourtType(req.body);
    return created(res, ketQua, 'Tạo loại sân thành công');
  });

  static updateCourtType = asyncHandler(async (req: Request, res: Response) => {
    const loaiSanId = Number(req.params.id);
    const ketQua = await AdminService.updateCourtType(loaiSanId, req.body);
    return ok(res, ketQua, 'Cập nhật loại sân thành công');
  });

  static toggleCourtTypeActive = asyncHandler(async (req: Request, res: Response) => {
    const loaiSanId = Number(req.params.id);
    const ketQua = await AdminService.toggleCourtTypeActive(loaiSanId);
    return ok(res, ketQua, 'Thay đổi trạng thái loại sân thành công');
  });

  // 2. Sân
  static getCourts = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await AdminService.getCourts();
    return ok(res, ketQua);
  });

  static createCourt = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AdminService.createCourt(req.body);
    return created(res, ketQua, 'Tạo sân thành công');
  });

  static updateCourt = asyncHandler(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const ketQua = await AdminService.updateCourt(sanId, req.body);
    return ok(res, ketQua, 'Cập nhật thông tin sân thành công');
  });

  static updateCourtStatus = asyncHandler(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const trangThai = req.body.trangThai || req.body.status;
    const ketQua = await AdminService.updateCourtStatus(sanId, trangThai);
    return ok(res, ketQua, 'Cập nhật trạng thái sân thành công');
  });

  // 3. Khung giờ
  static getTimeSlots = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await AdminService.getTimeSlots();
    return ok(res, ketQua);
  });

  static createTimeSlot = asyncHandler(async (req: Request, res: Response) => {
    const gioBatDau = req.body.gioBatDau || req.body.startTime;
    const gioKetThuc = req.body.gioKetThuc || req.body.endTime;
    const ketQua = await AdminService.createTimeSlot(gioBatDau, gioKetThuc);
    return created(res, ketQua, 'Tạo khung giờ thành công');
  });

  static toggleTimeSlotActive = asyncHandler(async (req: Request, res: Response) => {
    const khungGioId = Number(req.params.id);
    const ketQua = await AdminService.toggleTimeSlotActive(khungGioId);
    return ok(res, ketQua, 'Thay đổi trạng thái khung giờ thành công');
  });

  // 4. Bảng giá
  static getSlotPrices = asyncHandler(async (req: Request, res: Response) => {
    const loaiSanId = Number(req.query.loaiSanId || req.query.courtTypeId);
    const ketQua = await AdminService.getSlotPrices(loaiSanId);
    return ok(res, ketQua);
  });

  static updateSlotPrices = asyncHandler(async (req: Request, res: Response) => {
    const danhSachGia = req.body.danhSachGia || req.body.prices;
    const ketQua = await AdminService.updateSlotPrices(danhSachGia);
    return ok(res, ketQua, ketQua.message);
  });

  // 5. Nhân viên
  static getStaffList = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await AdminService.getStaffList();
    return ok(res, ketQua);
  });

  static createStaff = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AdminService.createStaff(req.body);
    return created(res, ketQua, 'Tạo tài khoản nhân viên thành công');
  });

  static updateStaff = asyncHandler(async (req: Request, res: Response) => {
    const nhanVienId = Number(req.params.id);
    const ketQua = await AdminService.updateStaff(nhanVienId, req.body);
    return ok(res, ketQua, 'Cập nhật nhân viên thành công');
  });

  static toggleStaffStatus = asyncHandler(async (req: Request, res: Response) => {
    const nhanVienId = Number(req.params.id);
    const trangThai = req.body.trangThai || req.body.status;
    const ketQua = await AdminService.toggleUserStatus(req.user!, nhanVienId, trangThai);
    return ok(res, ketQua, 'Thay đổi trạng thái tài khoản thành công');
  });

  static resetStaffPassword = asyncHandler(async (req: Request, res: Response) => {
    const nhanVienId = Number(req.params.id);
    const matKhauMoi = req.body.matKhauMoi || req.body.password;
    const ketQua = await AdminService.resetStaffPassword(nhanVienId, matKhauMoi);
    return ok(res, ketQua, ketQua.message);
  });

  // 6. Khách hàng
  static toggleCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
    const khachHangId = Number(req.params.id);
    const trangThai = req.body.trangThai || req.body.status;
    const ketQua = await AdminService.toggleUserStatus(req.user!, khachHangId, trangThai);
    return ok(res, ketQua, 'Thay đổi trạng thái tài khoản khách hàng thành công');
  });

  // 7. Báo cáo (ADM-07)
  static getSummaryReport = asyncHandler(async (req: Request, res: Response) => {
    const tuNgay = ((req.query.tuNgay || req.query.from) as string) || new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
    const denNgay = ((req.query.denNgay || req.query.to) as string) || new Date().toISOString().substring(0, 10);
    const ketQua = await AdminService.getSummaryReport(tuNgay, denNgay);
    return ok(res, ketQua);
  });

  static getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const tuNgay = ((req.query.tuNgay || req.query.from) as string) || new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
    const denNgay = ((req.query.denNgay || req.query.to) as string) || new Date().toISOString().substring(0, 10);
    const nhomTheo = ((req.query.nhomTheo || req.query.groupBy) as 'day' | 'month') || 'day';
    const ketQua = await AdminService.getRevenueReport(tuNgay, denNgay, nhomTheo);
    return ok(res, ketQua);
  });

  static getCourtUsageReport = asyncHandler(async (req: Request, res: Response) => {
    const tuNgay = ((req.query.tuNgay || req.query.from) as string) || new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
    const denNgay = ((req.query.denNgay || req.query.to) as string) || new Date().toISOString().substring(0, 10);
    const ketQua = await AdminService.getCourtUsageReport(tuNgay, denNgay);
    return ok(res, ketQua);
  });
}
