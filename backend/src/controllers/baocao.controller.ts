// =====================================================================
// CONTROLLER BÁO CÁO — Tổng quan, doanh thu, lấp đầy, dịch vụ
// Đáp ứng: plant/06-api.md mục 4.4, 5.11, 5.19, 5.21 (ADM-07)
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong } from '../utils/phanhoi';
import { baoCaoService } from '../services/baocao.service';

export class BaoCaoController {
  layTongQuan = batDongBo(async (req: Request, res: Response) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const ketQua = await baoCaoService.layTongQuan(from, to);
    phanHoiThanhCong(res, ketQua);
  });

  layBaoCaoDoanhThu = batDongBo(async (req: Request, res: Response) => {
    const from = (req.query.from as string) || new Date().toISOString().substring(0, 7) + '-01';
    const to = (req.query.to as string) || new Date().toISOString().substring(0, 10);
    const groupBy = (req.query.groupBy as 'day' | 'month') || 'day';

    const ketQua = await baoCaoService.layBaoCaoDoanhThu(from, to, groupBy);
    phanHoiThanhCong(res, ketQua);
  });

  layBaoCaoSuDungSan = batDongBo(async (req: Request, res: Response) => {
    const from = (req.query.from as string) || new Date().toISOString().substring(0, 7) + '-01';
    const to = (req.query.to as string) || new Date().toISOString().substring(0, 10);

    const ketQua = await baoCaoService.layBaoCaoSuDungSan(from, to);
    phanHoiThanhCong(res, ketQua);
  });

  layBaoCaoDichVu = batDongBo(async (req: Request, res: Response) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const ketQua = await baoCaoService.layBaoCaoDichVu(from, to);
    phanHoiThanhCong(res, ketQua);
  });
}

export const baoCaoController = new BaoCaoController();
