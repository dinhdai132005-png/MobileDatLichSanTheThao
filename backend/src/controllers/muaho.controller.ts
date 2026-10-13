// =====================================================================
// CONTROLLER HÓA ĐƠN MUA HỘ & ĐI CHỢ PHỤC VỤ TIỆC / SỰ KIỆN
// Quản lý nghiệp vụ chi hộ bên ngoài, hóa đơn điện tử / chứng từ giấy
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { muaHoService } from '../services/muaho.service';

export class MuaHoController {
  layDanhSach = batDongBo(async (req: Request, res: Response) => {
    const filters = {
      donDatId: req.query.donDatId ? Number(req.query.donDatId) : undefined,
      loaiChiPhi: req.query.loaiChiPhi as string | undefined,
      loaiChungTu: req.query.loaiChungTu as 'ELECTRONIC' | 'PAPER' | undefined,
      trangThai: req.query.trangThai as string | undefined,
      tuNgay: req.query.tuNgay as string | undefined,
      denNgay: req.query.denNgay as string | undefined,
      tuKhoa: req.query.tuKhoa as string | undefined,
    };

    const ketQua = await muaHoService.layDanhSach(filters);
    phanHoiThanhCong(res, ketQua);
  });

  taoHoaDonMuaHo = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await muaHoService.taoHoaDonMuaHo(req.body, req.nguoiDung!.id);
    phanHoiTaoThanhCong(res, ketQua, 'Đã tiếp nhận hóa đơn mua hộ thành công');
  });

  capNhatTrangThai = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { trangThai } = req.body;
    const ketQua = await muaHoService.capNhatTrangThai(id, trangThai);
    phanHoiThanhCong(res, ketQua, 'Đã cập nhật trạng thái hóa đơn mua hộ');
  });

  xoa = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await muaHoService.xoa(id);
    phanHoiThanhCong(res, ketQua, 'Đã xóa hóa đơn mua hộ thành công');
  });

  layThongKe = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await muaHoService.layThongKe();
    phanHoiThanhCong(res, ketQua);
  });
}

export const muaHoController = new MuaHoController();
