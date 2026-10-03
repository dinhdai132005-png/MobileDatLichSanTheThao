// ============================================================
// DON_DAT CONTROLLER — Nhận request và gọi DonDatService
// ============================================================
import { Request, Response } from 'express';
import { z } from 'zod';
import { DonDatService } from '../services/donDat.service';
import { sendSuccess, sendError } from '../utils/response';

const taoDonDatSchema = z.object({
  sanId: z.string().min(1, 'Thiếu thông tin sân'),
  tenKhach: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự'),
  soDienThoaiKhach: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ'),
  ghiChu: z.string().optional(),
  ngayDat: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  gioKhoa: z.string().regex(/^\d{2}:\d{2}$/, 'Giờ đặt không hợp lệ'),
  soGioThue: z.number().positive('Số giờ thuê phải lớn hơn 0'),
  phuongThucThanhToan: z.enum(['TIEN_MAT', 'MOMO', 'ZALO_PAY', 'VN_PAY', 'PAY_OS', 'CHUYEN_KHOAN']),
  maVoucher: z.string().optional(),
});

export class DonDatController {
  static async create(req: Request, res: Response) {
    const parsed = taoDonDatSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0].message, 400);
      return;
    }

    try {
      const donDat = await DonDatService.taoDonDat({
        ...parsed.data,
        userId: req.user!.userId,
      });
      sendSuccess(res, donDat, 'Đặt sân thành công! Slot được giữ trong 5 phút.', 201);
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi máy chủ khi tạo đơn đặt sân', err.status || 500);
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const { trangThai } = req.query as { trangThai?: string };
      const donList = await DonDatService.layTatCaDon(trangThai);
      sendSuccess(res, donList, 'Lấy danh sách đơn đặt thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy danh sách đơn đặt', err.status || 500);
    }
  }

  static async getCuaToi(req: Request, res: Response) {
    try {
      const { trangThai } = req.query as { trangThai?: string };
      const donList = await DonDatService.layLichSuCuaKhach(req.user!.userId, trangThai);
      sendSuccess(res, donList, 'Lấy lịch sử đặt sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy lịch sử đặt sân', err.status || 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const don = await DonDatService.layChiTietDon(donId, req.user!);
      sendSuccess(res, don, 'Lấy chi tiết đơn đặt sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi lấy chi tiết đơn', err.status || 500);
    }
  }

  static async xacNhan(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const don = await DonDatService.xacNhanDon(donId);
      sendSuccess(res, don, 'Đã xác nhận đơn đặt sân');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi xác nhận đơn', err.status || 500);
    }
  }

  static async tuChoi(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const { lyDo = 'Bận việc đột xuất' } = req.body as { lyDo?: string };
      const don = await DonDatService.tuChoiDon(donId, lyDo);
      sendSuccess(res, don, 'Đã từ chối đơn đặt sân');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi từ chối đơn', err.status || 500);
    }
  }

  static async checkIn(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const don = await DonDatService.checkInDon(donId);
      sendSuccess(res, don, 'Check-in thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi check-in', err.status || 500);
    }
  }

  static async hoanThanh(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const don = await DonDatService.hoanThanhDon(donId);
      sendSuccess(res, don, 'Hoàn thành ca chơi và trả sân thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi hoàn thành đơn', err.status || 500);
    }
  }

  static async huy(req: Request, res: Response) {
    try {
      const donId = req.params.id as string;
      const { lyDo = 'Khách bận việc đột xuất' } = req.body as { lyDo?: string };
      const don = await DonDatService.huyDon(donId, req.user!.userId, lyDo);
      sendSuccess(res, don, 'Đã gửi yêu cầu hủy đơn thành công');
    } catch (err: any) {
      sendError(res, err.message || 'Lỗi khi hủy đơn', err.status || 500);
    }
  }
}
