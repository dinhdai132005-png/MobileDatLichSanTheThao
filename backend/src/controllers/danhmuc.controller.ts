// =====================================================================
// CONTROLLER DANH MỤC — Loại sân, sân, khung giờ, dịch vụ, cấu hình công khai
// Đáp ứng: plant/06-api.md mục 4.1, 5.3, 5.9, 5.18
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong } from '../utils/phanhoi';
import { danhMucService } from '../services/danhmuc.service';
import { dichVuService } from '../services/dichvu.service';

export class DanhMucController {
  layLoaiSan = batDongBo(async (req: Request, res: Response) => {
    const category = req.query.category as 'SPORT' | 'EVENT' | undefined;
    const ketQua = await danhMucService.layDanhSachLoaiSan(category);
    phanHoiThanhCong(res, ketQua);
  });

  layDanhSachSan = batDongBo(async (req: Request, res: Response) => {
    const courtTypeId = req.query.courtTypeId ? Number(req.query.courtTypeId) : undefined;
    const category = req.query.category as 'SPORT' | 'EVENT' | undefined;
    const ketQua = await danhMucService.layDanhSachSan({ courtTypeId, category });
    phanHoiThanhCong(res, ketQua);
  });

  layChiTietSan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await danhMucService.layChiTietSan(id);
    phanHoiThanhCong(res, ketQua);
  });

  layKhungGio = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await danhMucService.layDanhSachKhungGio();
    phanHoiThanhCong(res, ketQua);
  });

  layCauHinhCongKhai = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = danhMucService.layCauHinhCongKhai();
    phanHoiThanhCong(res, ketQua);
  });

  layDanhSachDichVu = batDongBo(async (req: Request, res: Response) => {
    const type = req.query.type as 'DRINK' | 'RENTAL' | 'PACKAGE' | undefined;
    const ketQua = await dichVuService.layDanhSachDichVu({ type });
    phanHoiThanhCong(res, ketQua);
  });

  layChiTietDichVu = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await dichVuService.layChiTietDichVu(id);
    phanHoiThanhCong(res, ketQua);
  });
}

export const danhMucController = new DanhMucController();
