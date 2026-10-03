// ============================================================
// SAN ROUTES — Định tuyến quản lý sân thể thao
// Pattern: Route -> Controller -> Service -> Database -> Response
// ============================================================
import { Router } from 'express';
import { SanController } from '../controllers/san.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/san/loai-san — Lấy danh mục loại sân (phải đặt trước /:id)
router.get('/loai-san', SanController.getLoaiSan);

// GET /api/san — Lấy danh sách sân (hỗ trợ query filter: monTheThao, sapXep, tuKhoa)
router.get('/', SanController.getAll);

// GET /api/san/:id — Xem chi tiết 1 sân
router.get('/:id', SanController.getById);

// GET /api/san/:id/slots — Lấy danh sách khung giờ khả dụng theo ngày
router.get('/:id/slots', SanController.getSlots);

// POST /api/san — Thêm sân mới (Yêu cầu ADMIN)
router.post('/', authMiddleware, requireRole('ADMIN'), SanController.create);

// PUT /api/san/:id — Cập nhật thông tin sân (Yêu cầu ADMIN)
router.put('/:id', authMiddleware, requireRole('ADMIN'), SanController.update);

export default router;
