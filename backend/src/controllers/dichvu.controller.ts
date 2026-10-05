// =====================================================================
// CONTROLLER DỊCH VỤ — Gọi dịch vụ, giao nhận, trả đồ thuê, hóa đơn, thu tiền
// Đáp ứng: plant/06-api.md mục 4.2, 4.3, 5.13 -> 5.17
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { dichVuService } from '../services/dichvu.service';

export class DichVuController {
  // --- Khách hàng ---
  goiDichVuKhach = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await dichVuService.taoYeuCauDichVu(
      req.nguoiDung!.id,
      req.nguoiDung!.role,
      donDatId,
      req.body,
      false
    );
    phanHoiTaoThanhCong(res, ketQua, 'Đã gửi yêu cầu');
  });

  layHoaDonKhach = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await dichVuService.layHoaDon(
      donDatId,
      req.nguoiDung!.id,
      req.nguoiDung!.role
    );
    phanHoiThanhCong(res, ketQua);
  });

  huyYeuCauKhach = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const orderId = Number(req.params.orderId);
    const ketQua = await dichVuService.huyYeuCauBoiKhach(
      req.nguoiDung!.id,
      donDatId,
      orderId,
      req.body?.reason
    );
    phanHoiThanhCong(res, ketQua);
  });

  // --- Nhân viên ---
  layHangDoiYeuCau = batDongBo(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const date = req.query.date as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const ketQua = await dichVuService.layHangDoiYeuCau({ status, date, page, limit });
    phanHoiThanhCong(res, ketQua);
  });

  giaoYeuCau = batDongBo(async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const ketQua = await dichVuService.xacNhanGiaoHang(req.nguoiDung!.id, orderId);
    phanHoiThanhCong(res, ketQua, 'Đã giao dịch vụ thành công');
  });

  nhanVienHuyYeuCau = batDongBo(async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const lyDo = req.body.reason;
    const ketQua = await dichVuService.nhanVienHuyYeuCau(req.nguoiDung!.id, orderId, lyDo);
    phanHoiThanhCong(res, ketQua);
  });

  nhanVienThemDichVuTaiQuay = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await dichVuService.taoYeuCauDichVu(
      req.nguoiDung!.id,
      req.nguoiDung!.role,
      donDatId,
      req.body,
      true
    );
    phanHoiTaoThanhCong(res, ketQua, 'Đã thêm dịch vụ tại quầy');
  });

  traDoThue = batDongBo(async (req: Request, res: Response) => {
    const itemId = Number(req.params.id);
    const ketQua = await dichVuService.traDoThue(req.nguoiDung!.id, itemId);
    phanHoiThanhCong(res, ketQua, 'Đã xác nhận trả đồ thuê');
  });

  layHoaDonNhanVien = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await dichVuService.layHoaDon(donDatId);
    phanHoiThanhCong(res, ketQua);
  });

  thuTienDichVu = batDongBo(async (req: Request, res: Response) => {
    const donDatId = Number(req.params.id);
    const ketQua = await dichVuService.thuTienDichVu(req.nguoiDung!.id, donDatId, req.body);
    phanHoiThanhCong(res, ketQua, 'Thu tiền dịch vụ thành công');
  });

  batTatTamHetHang = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await dichVuService.batTatTamHetHang(id, req.body.status);
    phanHoiThanhCong(res, ketQua);
  });
}

export const dichVuController = new DichVuController();
