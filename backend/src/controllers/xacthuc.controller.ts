// =====================================================================
// CONTROLLER XÁC THỰC — Đăng ký, đăng nhập, thông tin tài khoản, đổi mật khẩu
// Đáp ứng: plant/06-api.md mục 4.1, 5.1, 5.2
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { xacThucService } from '../services/xacthuc.service';

export class XacThucController {
  dangKy = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await xacThucService.dangKy(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Đăng ký thành công');
  });

  dangNhap = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await xacThucService.dangNhap(req.body);
    phanHoiThanhCong(res, ketQua, 'Đăng nhập thành công');
  });

  layThongTinToi = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await xacThucService.layThongTinNguoiDung(req.nguoiDung!.id);
    phanHoiThanhCong(res, ketQua);
  });

  capNhatThongTinToi = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await xacThucService.capNhatThongTin(req.nguoiDung!.id, req.body);
    phanHoiThanhCong(res, ketQua, 'Cập nhật thông tin thành công');
  });

  doiMatKhau = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await xacThucService.doiMatKhau(req.nguoiDung!.id, req.body);
    phanHoiThanhCong(res, ketQua, 'Đổi mật khẩu thành công');
  });
}

export const xacThucController = new XacThucController();
