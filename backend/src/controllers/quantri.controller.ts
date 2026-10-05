// =====================================================================
// CONTROLLER QUẢN TRỊ — Quản trị danh mục, giá, tài khoản, đóng đơn công nợ
// Đáp ứng: plant/06-api.md mục 4.4, 5.10, 5.12, 5.18, 5.21, 5.22
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { quanTriService } from '../services/quantri.service';
import { dichVuService } from '../services/dichvu.service';

export class QuanTriController {
  // --- Loại sân ---
  layDanhSachLoaiSan = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await quanTriService.layDanhSachLoaiSan();
    phanHoiThanhCong(res, ketQua);
  });

  taoLoaiSan = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await quanTriService.taoLoaiSan(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Tạo loại sân thành công');
  });

  capNhatLoaiSan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.capNhatLoaiSan(id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  batTatLoaiSan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.batTatLoaiSan(id);
    phanHoiThanhCong(res, ketQua);
  });

  // --- Sân ---
  layDanhSachSan = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await quanTriService.layDanhSachSan();
    phanHoiThanhCong(res, ketQua);
  });

  taoSan = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await quanTriService.taoSan(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Tạo sân thành công');
  });

  capNhatSan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.capNhatSan(id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  doiTrangThaiSan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.doiTrangThaiSan(id, req.body.status);
    phanHoiThanhCong(res, ketQua);
  });

  // --- Khung giờ & Bảng giá ---
  layDanhSachKhungGio = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await quanTriService.layDanhSachKhungGio();
    phanHoiThanhCong(res, ketQua);
  });

  taoKhungGio = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await quanTriService.taoKhungGio(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Tạo khung giờ thành công');
  });

  capNhatKhungGio = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.capNhatKhungGio(id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  batTatKhungGio = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.batTatKhungGio(id);
    phanHoiThanhCong(res, ketQua);
  });

  layMaTranGia = batDongBo(async (req: Request, res: Response) => {
    const courtTypeId = Number(req.query.courtTypeId);
    const ketQua = await quanTriService.layMaTranGia(courtTypeId);
    phanHoiThanhCong(res, ketQua);
  });

  capNhatGiaHangLoat = batDongBo(async (req: Request, res: Response) => {
    const { courtTypeId, prices } = req.body;
    const ketQua = await quanTriService.capNhatGiaHangLoat(courtTypeId, prices);
    phanHoiThanhCong(res, ketQua, 'Cập nhật bảng giá thành công');
  });

  // --- Nhân viên ---
  layDanhSachNhanVien = batDongBo(async (_req: Request, res: Response) => {
    const ketQua = await quanTriService.layDanhSachNhanVien();
    phanHoiThanhCong(res, ketQua);
  });

  taoNhanVien = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await quanTriService.taoNhanVien(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Tạo tài khoản nhân viên thành công');
  });

  capNhatNhanVien = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.capNhatNhanVien(id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  doiTrangThaiNhanVien = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.doiTrangThaiNhanVien(req.nguoiDung!.id, id, req.body.status);
    phanHoiThanhCong(res, ketQua);
  });

  datLaiMatKhauNhanVien = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.datLaiMatKhauNhanVien(id, req.body.newPassword);
    phanHoiThanhCong(res, ketQua);
  });

  // --- Khách hàng ---
  layDanhSachKhachHang = batDongBo(async (req: Request, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const keyword = req.query.keyword as string | undefined;

    const ketQua = await quanTriService.layDanhSachKhachHang(page, limit, keyword);
    phanHoiThanhCong(res, ketQua);
  });

  doiTrangThaiKhachHang = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.doiTrangThaiKhachHang(id, req.body.status);
    phanHoiThanhCong(res, ketQua);
  });

  datLaiMatKhauKhachHang = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.datLaiMatKhauKhachHang(id, req.body.newPassword);
    phanHoiThanhCong(res, ketQua);
  });

  // --- Đóng đơn công nợ ---
  dongDonCongNo = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.dongDonCongNo(req.nguoiDung!.id, id, req.body.reason);
    phanHoiThanhCong(res, ketQua);
  });

  // --- Dịch vụ (Admin) ---
  layDanhSachDichVuAdmin = batDongBo(async (req: Request, res: Response) => {
    const type = req.query.type as any;
    const status = req.query.status as any;
    const ketQua = await dichVuService.layDanhSachDichVu({ type, status, tatCaTrangThai: true });
    phanHoiThanhCong(res, ketQua);
  });

  taoDichVu = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await quanTriService.taoDichVu(req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Tạo dịch vụ thành công');
  });

  capNhatDichVu = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.capNhatDichVu(id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  doiTrangThaiDichVu = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await quanTriService.doiTrangThaiDichVu(id, req.body.status);
    phanHoiThanhCong(res, ketQua);
  });
}

export const quanTriController = new QuanTriController();
