// ============================================================
// SAN CONTROLLER — Nhận request, xử lý tham số và gọi SanService
// ============================================================
import { Request, Response } from 'express';
import { SanService } from '../services/san.service';
import { sendSuccess, sendError } from '../utils/response';

export class SanController {
  static async getAll(req: Request, res: Response) {
    try {
      const { monTheThao, sapXep, tuKhoa } = req.query as Record<string, string>;
      const sanList = await SanService.layDanhSachSan({ monTheThao, sapXep, tuKhoa });
      sendSuccess(res, sanList, 'Lấy danh sách sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh sách sân', err.status || 500);
    }
  }

  static async getLoaiSan(_req: Request, res: Response) {
    try {
      const loaiSanList = await SanService.layDanhSachLoaiSan();
      sendSuccess(res, loaiSanList, 'Lấy danh sách loại sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh sách loại sân', err.status || 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const sanId = req.params.id as string;
      const san = await SanService.layChiTietSan(sanId);
      sendSuccess(res, san, 'Lấy chi tiết sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy chi tiết sân', err.status || 500);
    }
  }

  static async getSlots(req: Request, res: Response) {
    try {
      const sanId = req.params.id as string;
      const { ngay } = req.query as { ngay?: string };

      if (!ngay) {
        sendError(res, 'Thiếu tham số ngày.', 400);
        return;
      }

      const slots = await SanService.laySlotsTheoNgay(sanId, ngay);
      sendSuccess(res, slots, 'Lấy danh sách khung giờ thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh sách slot', err.status || 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const san = await SanService.taoSan(req.body);
      sendSuccess(res, san, 'Thêm sân mới thành công', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi tạo sân mới', err.status || 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const sanId = req.params.id as string;
      const san = await SanService.capNhatSan(sanId, req.body);
      sendSuccess(res, san, 'Cập nhật sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi cập nhật sân', err.status || 500);
    }
  }
}
