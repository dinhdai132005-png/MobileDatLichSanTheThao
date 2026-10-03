// ============================================================
// DO_UONG ROUTES — Định tuyến đồ uống
// Pattern: Route -> Controller -> Service -> Database -> Response
// ============================================================
import { Router } from 'express';
import { DoUongController } from '../controllers/doUong.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/do-uong — Danh sách đồ uống đang bán
router.get('/', DoUongController.getAll);

// POST /api/do-uong — Thêm sản phẩm (Admin)
router.post('/', authMiddleware, requireRole('ADMIN'), DoUongController.create);

// PUT /api/do-uong/:id — Cập nhật sản phẩm (Admin)
router.put('/:id', authMiddleware, requireRole('ADMIN'), DoUongController.update);

// POST /api/do-uong/:id/nhap-kho — Nhập kho sản phẩm (Admin)
router.post('/:id/nhap-kho', authMiddleware, requireRole('ADMIN'), DoUongController.nhapKho);

export default router;
