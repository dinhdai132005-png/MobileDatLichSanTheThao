// ============================================================
// DANH_GIA ROUTES — Định tuyến Đánh giá & Chấm sao
// Pattern: Route -> Controller -> Service -> Database -> Response
// ============================================================
import { Router } from 'express';
import { DanhGiaController } from '../controllers/danhGia.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// POST /api/danh-gia — Viết đánh giá sau khi hoàn thành đơn (Customer)
router.post('/', authMiddleware, requireRole('CUSTOMER'), DanhGiaController.create);

// PATCH /api/danh-gia/:id/phan-hoi — Phản hồi đánh giá (Admin)
router.patch('/:id/phan-hoi', authMiddleware, requireRole('ADMIN'), DanhGiaController.phanHoi);

// PATCH /api/danh-gia/:id/an — Ẩn đánh giá vi phạm (Admin)
router.patch('/:id/an', authMiddleware, requireRole('ADMIN'), DanhGiaController.an);

export default router;
