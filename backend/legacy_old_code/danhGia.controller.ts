// ============================================================
// DANH_GIA CONTROLLER — Nhận request và gọi DanhGiaService
// ============================================================
import { Request, Response } from 'express';
import { z } from 'zod';
import { DanhGiaService } from '../services/danhGia.service';
import { sendSuccess, sendError } from '../utils/response';

const danhGiaSchema = z.object({
  donDatId: z.string().min(1, 'Thiếu mã đơn đặt'),
  soSao: z.number().int().min(1).max(5, 'Số sao từ 1 đến 5'),
  noiDung: z.string().max(1000).optional(),
  anhUrl: z.string().url().optional(),
});

export class DanhGiaController {
  static async create(req: Request, res: Response) {
    const parsed = danhGiaSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    try {
      const danhGia = await DanhGiaService.taoDanhGia({
        ...parsed.data,
        userId: req.user!.userId,
      });
      sendSuccess(res, danhGia, 'Gửi đánh giá thành công', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi gửi đánh giá', err.status || 500);
    }
  }

  static async phanHoi(req: Request, res: Response) {
    try {
      const { phanHoi } = req.body as { phanHoi?: string };
      if (!phanHoi) {
        sendError(res, 'Nội dung phản hồi không được để trống', 400);
        return;
      }

      const dg = await DanhGiaService.phanHoi(req.params.id as string, phanHoi);
      sendSuccess(res, dg, 'Phản hồi đánh giá thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi phản hồi đánh giá', err.status || 500);
    }
  }

  static async an(req: Request, res: Response) {
    try {
      const dg = await DanhGiaService.anDanhGia(req.params.id as string);
      sendSuccess(res, dg, 'Đã ẩn đánh giá vi phạm thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi ẩn đánh giá', err.status || 500);
    }
  }
}
