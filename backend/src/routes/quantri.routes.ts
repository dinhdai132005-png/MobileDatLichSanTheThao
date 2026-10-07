// =====================================================================
// ROUTES QUẢN TRỊ — /admin/*
// Đáp ứng: plant/06-api.md mục 4.4
// =====================================================================
import { Router } from 'express';
import { quanTriController } from '../controllers/quantri.controller';
import { baoCaoController } from '../controllers/baocao.controller';
import { yeuCauXacThuc } from '../middlewares/xacthuc.middleware';
import { choPhepVaiTro } from '../middlewares/phanquyen.middleware';
import { kiemTraDuLieu } from '../middlewares/kiemtra.middleware';
import {
  luocDoLoaiSan,
  luocDoCapNhatLoaiSan,
  luocDoSan,
  luocDoCapNhatSan,
  luocDoDoiTrangThaiSan,
  luocDoKhungGio,
  luocDoGiaKhungGioHangLoat,
  luocDoTaoNhanVien,
  luocDoCapNhatNhanVien,
  luocDoDoiTrangThaiTaiKhoan,
  luocDoDatLaiMatKhau,
  luocDoDongDonCongNo,
  luocDoDichVu,
  luocDoCapNhatDichVu,
  luocDoDoiTrangThaiDichVu,
  luocDoNhapKho,
  luocDoDieuChinhKho,
  luocDoNguongCanhBao,
} from '../validators/quantri.validator';
import { dichVuController } from '../controllers/dichvu.controller';

export const quanTriRouter = Router();

// Toàn bộ endpoint nhóm này chỉ cho phép ADMIN
quanTriRouter.use(yeuCauXacThuc, choPhepVaiTro('ADMIN'));

// Loại sân
quanTriRouter.get('/court-types', quanTriController.layDanhSachLoaiSan);
quanTriRouter.post('/court-types', kiemTraDuLieu(luocDoLoaiSan), quanTriController.taoLoaiSan);
quanTriRouter.put('/court-types/:id', kiemTraDuLieu(luocDoCapNhatLoaiSan), quanTriController.capNhatLoaiSan);
quanTriRouter.patch('/court-types/:id/active', quanTriController.batTatLoaiSan);

// Sân
quanTriRouter.get('/courts', quanTriController.layDanhSachSan);
quanTriRouter.post('/courts', kiemTraDuLieu(luocDoSan), quanTriController.taoSan);
quanTriRouter.put('/courts/:id', kiemTraDuLieu(luocDoCapNhatSan), quanTriController.capNhatSan);
quanTriRouter.patch('/courts/:id/status', kiemTraDuLieu(luocDoDoiTrangThaiSan), quanTriController.doiTrangThaiSan);

// Khung giờ & Bảng giá
quanTriRouter.get('/time-slots', quanTriController.layDanhSachKhungGio);
quanTriRouter.post('/time-slots', kiemTraDuLieu(luocDoKhungGio), quanTriController.taoKhungGio);
quanTriRouter.put('/time-slots/:id', kiemTraDuLieu(luocDoKhungGio), quanTriController.capNhatKhungGio);
quanTriRouter.patch('/time-slots/:id/active', quanTriController.batTatKhungGio);

quanTriRouter.get('/slot-prices', quanTriController.layMaTranGia);
quanTriRouter.put('/slot-prices', kiemTraDuLieu(luocDoGiaKhungGioHangLoat), quanTriController.capNhatGiaHangLoat);

// Nhân viên
quanTriRouter.get('/staff', quanTriController.layDanhSachNhanVien);
quanTriRouter.post('/staff', kiemTraDuLieu(luocDoTaoNhanVien), quanTriController.taoNhanVien);
quanTriRouter.put('/staff/:id', kiemTraDuLieu(luocDoCapNhatNhanVien), quanTriController.capNhatNhanVien);
quanTriRouter.patch('/staff/:id/status', kiemTraDuLieu(luocDoDoiTrangThaiTaiKhoan), quanTriController.doiTrangThaiNhanVien);
quanTriRouter.post('/staff/:id/reset-password', kiemTraDuLieu(luocDoDatLaiMatKhau), quanTriController.datLaiMatKhauNhanVien);

// Khách hàng
quanTriRouter.get('/customers', quanTriController.layDanhSachKhachHang);
quanTriRouter.patch('/customers/:id/status', kiemTraDuLieu(luocDoDoiTrangThaiTaiKhoan), quanTriController.doiTrangThaiKhachHang);
quanTriRouter.post('/customers/:id/reset-password', kiemTraDuLieu(luocDoDatLaiMatKhau), quanTriController.datLaiMatKhauKhachHang);

// Đóng đơn công nợ
quanTriRouter.post('/bookings/:id/close-with-debt', kiemTraDuLieu(luocDoDongDonCongNo), quanTriController.dongDonCongNo);

// Dịch vụ (Admin)
quanTriRouter.get('/services', quanTriController.layDanhSachDichVuAdmin);
quanTriRouter.post('/services', kiemTraDuLieu(luocDoDichVu), quanTriController.taoDichVu);
quanTriRouter.put('/services/:id', kiemTraDuLieu(luocDoCapNhatDichVu), quanTriController.capNhatDichVu);
quanTriRouter.patch('/services/:id/status', kiemTraDuLieu(luocDoDoiTrangThaiDichVu), quanTriController.doiTrangThaiDichVu);

// Báo cáo
quanTriRouter.get('/reports/summary', baoCaoController.layTongQuan);
quanTriRouter.get('/reports/revenue', baoCaoController.layBaoCaoDoanhThu);
quanTriRouter.get('/reports/court-usage', baoCaoController.layBaoCaoSuDungSan);
quanTriRouter.get('/reports/services', baoCaoController.layBaoCaoDichVu);

// Quản lý tồn kho (Admin)
quanTriRouter.get('/inventory', dichVuController.layDanhSachTonKho);
quanTriRouter.get('/inventory/transactions', dichVuController.layLichSuBienDongKho);
quanTriRouter.post('/inventory/import', kiemTraDuLieu(luocDoNhapKho), dichVuController.nhapKho);
quanTriRouter.post('/inventory/adjust', kiemTraDuLieu(luocDoDieuChinhKho), dichVuController.dieuChinhKho);
quanTriRouter.patch('/inventory/:serviceId/threshold', kiemTraDuLieu(luocDoNguongCanhBao), dichVuController.capNhatNguongCanhBao);
