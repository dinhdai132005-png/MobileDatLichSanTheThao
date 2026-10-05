// =====================================================================
// ROUTES XÁC THỰC — /auth/*
// Đáp ứng: plant/06-api.md mục 4.1
// =====================================================================
import { Router } from 'express';
import { xacThucController } from '../controllers/xacthuc.controller';
import { yeuCauXacThuc } from '../middlewares/xacthuc.middleware';
import { kiemTraDuLieu } from '../middlewares/kiemtra.middleware';
import {
  luocDoDangKy,
  luocDoDangNhap,
  luocDoCapNhatThongTin,
  luocDoDoiMatKhau,
} from '../validators/xacthuc.validator';

export const xacThucRouter = Router();

xacThucRouter.post('/register', kiemTraDuLieu(luocDoDangKy), xacThucController.dangKy);
xacThucRouter.post('/login', kiemTraDuLieu(luocDoDangNhap), xacThucController.dangNhap);

xacThucRouter.get('/me', yeuCauXacThuc, xacThucController.layThongTinToi);
xacThucRouter.put('/me', yeuCauXacThuc, kiemTraDuLieu(luocDoCapNhatThongTin), xacThucController.capNhatThongTinToi);
xacThucRouter.put(
  '/change-password',
  yeuCauXacThuc,
  kiemTraDuLieu(luocDoDoiMatKhau),
  xacThucController.doiMatKhau
);
