// =====================================================================
// CONTROLLER ĐƠN ĐẶT — Đặt sân, hủy, đánh giá, lịch trống khách hàng
// Đáp ứng: plant/06-api.md mục 4.1, 4.2, 5.3, 5.4, 5.5
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { donDatService } from '../services/dondat.service';

export class DonDatController {
  layLichTrongSan = batDongBo(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const date = (req.query.date || req.query.ngayDat) as string;
    const ketQua = await donDatService.layLichTrongSan(sanId, date);
    phanHoiThanhCong(res, ketQua);
  });

  layDanhGiaSan = batDongBo(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const ketQua = await donDatService.layDanhGiaSan(sanId, page, limit);
    phanHoiThanhCong(res, ketQua);
  });

  taoDonDat = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await donDatService.taoDonDat(req.nguoiDung!.id, req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Đặt sân thành công');
  });

  layDonCuaToi = batDongBo(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const ketQua = await donDatService.layDonCuaToi(req.nguoiDung!.id, { status, page, limit });
    phanHoiThanhCong(res, ketQua);
  });

  layChiTietDon = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await donDatService.layChiTietDon(req.nguoiDung!.id, id);
    phanHoiThanhCong(res, ketQua);
  });

  huyDonKhach = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await donDatService.huyDonBoiKhach(req.nguoiDung!.id, id, req.body);
    phanHoiThanhCong(res, ketQua, 'Hủy đơn thành công');
  });

  danhGiaDon = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await donDatService.danhGiaDonDat(req.nguoiDung!.id, id, req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Đánh giá thành công');
  });
}

export const donDatController = new DonDatController();
