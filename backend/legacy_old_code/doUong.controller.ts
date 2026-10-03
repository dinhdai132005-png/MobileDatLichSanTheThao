// ============================================================
// DO_UONG CONTROLLER — Nhận request và gọi DoUongService
// ============================================================
import { Request, Response } from 'express';
import { DoUongService } from '../services/doUong.service';
import { sendSuccess, sendError } from '../utils/response';

export class DoUongController {
  static async getAll(_req: Request, res: Response) {
    try {
      const list = await DoUongService.layDanhSach();
      sendSuccess(res, list, 'Lấy danh sách đồ uống thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh sách đồ uống', 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const item = await DoUongService.taoMoi(req.body);
      sendSuccess(res, item, 'Thêm đồ uống mới thành công', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi tạo sản phẩm đồ uống', 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const item = await DoUongService.capNhat(id, req.body);
      sendSuccess(res, item, 'Cập nhật sản phẩm thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi cập nhật sản phẩm', 500);
    }
  }

  static async nhapKho(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { soLuong } = req.body as { soLuong: number };

      if (!soLuong || soLuong <= 0) {
        sendError(res, 'Số lượng nhập kho phải lớn hơn 0', 400);
        return;
      }

      const item = await DoUongService.nhapKho(id, soLuong);
      sendSuccess(res, item, `Đã nhập thêm ${soLuong} đơn vị vào kho`);
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi nhập kho', 500);
    }
  }
}
