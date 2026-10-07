// =====================================================================
// ROUTES NHÂN VIÊN — /staff/*
// Đáp ứng: plant/06-api.md mục 4.3
// =====================================================================
import { Router } from 'express';
import { nhanVienController } from '../controllers/nhanvien.controller';
import { dichVuController } from '../controllers/dichvu.controller';
import { yeuCauXacThuc } from '../middlewares/xacthuc.middleware';
import { choPhepVaiTro } from '../middlewares/phanquyen.middleware';
import { kiemTraDuLieu } from '../middlewares/kiemtra.middleware';
import {
  luocDoNhanVienDatSan,
  luocDoGhiNhanThanhToan,
  luocDoNhanVienHuyDon,
  luocDoXacNhanHoanTien,
  luocDoThuTienDichVu,
  luocDoBatTatDichVuNhanVien,
  luocDoHuyYeuCauNhanVien,
} from '../validators/nhanvien.validator';
import { luocDoGoiDichVu } from '../validators/dondat.validator';

export const nhanVienRouter = Router();

// Yêu cầu vai trò STAFF hoặc ADMIN
nhanVienRouter.use(yeuCauXacThuc, choPhepVaiTro('STAFF', 'ADMIN'));

// Dashboard & Lịch
nhanVienRouter.get('/dashboard', nhanVienController.layDashboard);
nhanVienRouter.get('/schedule', nhanVienController.layLichLuoi);
nhanVienRouter.get('/courts/:id/availability', nhanVienController.layLichTrongNhanVien);

// Đơn đặt & Khách hàng
nhanVienRouter.get('/bookings', nhanVienController.layDanhSachDon);
nhanVienRouter.get('/bookings/:id', nhanVienController.layChiTietDon);
nhanVienRouter.post('/bookings', kiemTraDuLieu(luocDoNhanVienDatSan), nhanVienController.datSanTaiQuay);
nhanVienRouter.post('/bookings/:id/payments', kiemTraDuLieu(luocDoGhiNhanThanhToan), nhanVienController.ghiNhanThanhToan);
nhanVienRouter.post('/bookings/:id/complete', nhanVienController.hoanThanhDon);
nhanVienRouter.post('/bookings/:id/no-show', nhanVienController.danhDauNoShow);
nhanVienRouter.post('/bookings/:id/cancel', kiemTraDuLieu(luocDoNhanVienHuyDon), nhanVienController.huyThayKhach);

// Hoàn tiền
nhanVienRouter.get('/refunds', nhanVienController.layDanhSachHoanTien);
nhanVienRouter.post('/payments/:id/confirm-refund', kiemTraDuLieu(luocDoXacNhanHoanTien), nhanVienController.xacNhanHoanTien);

// Tìm kiếm khách hàng
nhanVienRouter.get('/customers', nhanVienController.timKiemKhachHang);
nhanVienRouter.get('/customers/:id', nhanVienController.layChiTietKhachHang);

// Dịch vụ và hóa đơn
nhanVienRouter.get('/service-orders', dichVuController.layHangDoiYeuCau);
nhanVienRouter.post('/service-orders/:id/deliver', dichVuController.giaoYeuCau);
nhanVienRouter.post('/service-orders/:id/cancel', kiemTraDuLieu(luocDoHuyYeuCauNhanVien), dichVuController.nhanVienHuyYeuCau);
nhanVienRouter.post('/bookings/:id/service-orders', kiemTraDuLieu(luocDoGoiDichVu), dichVuController.nhanVienThemDichVuTaiQuay);
nhanVienRouter.post('/service-order-items/:id/return', dichVuController.traDoThue);
nhanVienRouter.get('/bookings/:id/invoice', dichVuController.layHoaDonNhanVien);
nhanVienRouter.post('/bookings/:id/service-payments', kiemTraDuLieu(luocDoThuTienDichVu), dichVuController.thuTienDichVu);
nhanVienRouter.patch('/services/:id/availability', kiemTraDuLieu(luocDoBatTatDichVuNhanVien), dichVuController.batTatTamHetHang);

// Tồn kho vận hành
nhanVienRouter.get('/inventory', dichVuController.layDanhSachTonKho);
