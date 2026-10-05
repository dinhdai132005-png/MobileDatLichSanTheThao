// =====================================================================
// TỔNG HỢP ROUTES API V1 — plant/06-api.md
// =====================================================================
import { Router } from 'express';
import { xacThucRouter } from './xacthuc.routes';
import { danhMucRouter } from './danhmuc.routes';
import { donDatRouter } from './dondat.routes';
import { nhanVienRouter } from './nhanvien.routes';
import { quanTriRouter } from './quantri.routes';

export const apiV1Router = Router();

apiV1Router.use('/auth', xacThucRouter);
apiV1Router.use('/', danhMucRouter);
apiV1Router.use('/bookings', donDatRouter);
apiV1Router.use('/staff', nhanVienRouter);
apiV1Router.use('/admin', quanTriRouter);
