// =====================================================================
// ROUTES CÔNG KHAI & DANH MỤC
// Đáp ứng: plant/06-api.md mục 4.1
// =====================================================================
import { Router } from 'express';
import { danhMucController } from '../controllers/danhmuc.controller';
import { donDatController } from '../controllers/dondat.controller';

export const danhMucRouter = Router();

// Loại sân
danhMucRouter.get('/court-types', danhMucController.layLoaiSan);

// Sân
danhMucRouter.get('/courts', danhMucController.layDanhSachSan);
danhMucRouter.get('/courts/:id', danhMucController.layChiTietSan);
danhMucRouter.get('/courts/:id/availability', donDatController.layLichTrongSan);
danhMucRouter.get('/courts/:id/reviews', donDatController.layDanhGiaSan);

// Khung giờ
danhMucRouter.get('/time-slots', danhMucController.layKhungGio);

// Dịch vụ
danhMucRouter.get('/services', danhMucController.layDanhSachDichVu);
danhMucRouter.get('/services/:id', danhMucController.layChiTietDichVu);

// Cấu hình công khai
danhMucRouter.get('/config/public', danhMucController.layCauHinhCongKhai);
