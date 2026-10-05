// =====================================================================
// ROUTES KHÁCH HÀNG — /bookings/*
// Đáp ứng: plant/06-api.md mục 4.2
// =====================================================================
import { Router } from 'express';
import { donDatController } from '../controllers/dondat.controller';
import { dichVuController } from '../controllers/dichvu.controller';
import { yeuCauXacThuc } from '../middlewares/xacthuc.middleware';
import { choPhepVaiTro } from '../middlewares/phanquyen.middleware';
import { kiemTraDuLieu } from '../middlewares/kiemtra.middleware';
import {
  luocDoTaoDonDat,
  luocDoHuyDonKhach,
  luocDoDanhGia,
  luocDoGoiDichVu,
  luocDoHuyYeuCauDichVu,
} from '../validators/dondat.validator';

export const donDatRouter = Router();

// Toàn bộ endpoint nhóm này yêu cầu vai trò CUSTOMER
donDatRouter.use(yeuCauXacThuc, choPhepVaiTro('CUSTOMER'));

donDatRouter.post('/', kiemTraDuLieu(luocDoTaoDonDat), donDatController.taoDonDat);
donDatRouter.get('/my', donDatController.layDonCuaToi);
donDatRouter.get('/:id', donDatController.layChiTietDon);
donDatRouter.post('/:id/cancel', kiemTraDuLieu(luocDoHuyDonKhach), donDatController.huyDonKhach);
donDatRouter.post('/:id/review', kiemTraDuLieu(luocDoDanhGia), donDatController.danhGiaDon);

// Dịch vụ và hóa đơn cho khách
donDatRouter.post('/:id/service-orders', kiemTraDuLieu(luocDoGoiDichVu), dichVuController.goiDichVuKhach);
donDatRouter.get('/:id/invoice', dichVuController.layHoaDonKhach);
donDatRouter.post(
  '/:id/service-orders/:orderId/cancel',
  kiemTraDuLieu(luocDoHuyYeuCauDichVu),
  dichVuController.huyYeuCauKhach
);
