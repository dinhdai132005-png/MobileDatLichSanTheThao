// =====================================================================
// CONTROLLER NHÂN VIÊN — Dashboard, lịch lưới, đặt tại quầy, xử lý đơn, hoàn tiền
// Đáp ứng: plant/06-api.md mục 4.3, 5.6 -> 5.9, 5.20, 5.23
// =====================================================================
import { Request, Response } from 'express';
import { batDongBo } from '../utils/batdongbo';
import { phanHoiThanhCong, phanHoiTaoThanhCong } from '../utils/phanhoi';
import { nhanVienService } from '../services/nhanvien.service';
import { donDatService } from '../services/dondat.service';
import { layNgayHomNay } from '../utils/thoigian';

export class NhanVienController {
  layDashboard = batDongBo(async (req: Request, res: Response) => {
    const ngayHomNay = (req.query.date as string) || layNgayHomNay();
    const ketQua = await nhanVienService.layDashboard(ngayHomNay);
    phanHoiThanhCong(res, ketQua);
  });

  layLichLuoi = batDongBo(async (req: Request, res: Response) => {
    const date = (req.query.date as string) || layNgayHomNay();
    const ketQua = await nhanVienService.layLichLuoi(date);
    phanHoiThanhCong(res, ketQua);
  });

  layLichTrongNhanVien = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const date = (req.query.date as string) || layNgayHomNay();
    const ketQua = await nhanVienService.layLichTrongNhanVien(id, date);
    phanHoiThanhCong(res, ketQua);
  });

  layDanhSachDon = batDongBo(async (req: Request, res: Response) => {
    const date = req.query.date as string | undefined;
    const courtId = req.query.courtId ? Number(req.query.courtId) : undefined;
    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const keyword = req.query.keyword as string | undefined;
    const overdue = req.query.overdue === 'true';
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const ketQua = await nhanVienService.layDanhSachDon({
      date,
      courtId,
      status,
      paymentStatus,
      keyword,
      overdue,
      page,
      limit,
    });
    phanHoiThanhCong(res, ketQua);
  });

  layChiTietDon = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await donDatService.layChiTietDonNhanVien(id);
    phanHoiThanhCong(res, ketQua);
  });

  datSanTaiQuay = batDongBo(async (req: Request, res: Response) => {
    const ketQua = await nhanVienService.datSanTaiQuay(req.nguoiDung!.id, req.body);
    phanHoiTaoThanhCong(res, ketQua, 'Đặt sân thành công');
  });

  ghiNhanThanhToan = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.ghiNhanThanhToanTienSan(req.nguoiDung!.id, id, req.body);
    phanHoiThanhCong(res, ketQua, 'Ghi nhận thanh toán thành công');
  });

  hoanThanhDon = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.hoanThanhDon(req.nguoiDung!.id, id);
    phanHoiThanhCong(res, ketQua);
  });

  danhDauNoShow = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.danhDauNoShow(req.nguoiDung!.id, id);
    phanHoiThanhCong(res, ketQua);
  });

  huyThayKhach = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.huyThayKhach(req.nguoiDung!.id, id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  layDanhSachHoanTien = batDongBo(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const ketQua = await nhanVienService.layDanhSachHoanTien(status, page, limit);
    phanHoiThanhCong(res, ketQua);
  });

  xacNhanHoanTien = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.xacNhanHoanTien(req.nguoiDung!.id, id, req.body);
    phanHoiThanhCong(res, ketQua);
  });

  timKiemKhachHang = batDongBo(async (req: Request, res: Response) => {
    const keyword = (req.query.keyword as string) || '';
    const ketQua = await nhanVienService.timKiemKhachHang(keyword);
    phanHoiThanhCong(res, ketQua);
  });

  layChiTietKhachHang = batDongBo(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ketQua = await nhanVienService.layChiTietKhachHang(id);
    phanHoiThanhCong(res, ketQua);
  });
}

export const nhanVienController = new NhanVienController();
