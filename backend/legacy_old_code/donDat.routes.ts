// ============================================================
// DON_DAT ROUTES — Định tuyến Đặt Sân (Booking)
// Pattern: Route -> Controller -> Service -> Database -> Response
// ============================================================
import { Router } from 'express';
import { DonDatController } from '../controllers/donDat.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// POST /api/don-dat — Tạo đơn đặt sân mới (cần đăng nhập)
router.post('/', authMiddleware, DonDatController.create);

// GET /api/don-dat — Lấy tất cả đơn đặt sân (Staff/Admin)
router.get('/', authMiddleware, requireRole('STAFF', 'ADMIN'), DonDatController.getAll);

// GET /api/don-dat/cua-toi — Lịch sử đặt sân của người dùng hiện tại
router.get('/cua-toi', authMiddleware, DonDatController.getCuaToi);

// GET /api/don-dat/:id — Xem chi tiết đơn đặt
router.get('/:id', authMiddleware, DonDatController.getById);

// PATCH /api/don-dat/:id/xac-nhan — Duyệt đơn (Staff/Admin)
router.patch('/:id/xac-nhan', authMiddleware, requireRole('STAFF', 'ADMIN'), DonDatController.xacNhan);

// PATCH /api/don-dat/:id/tu-choi — Từ chối đơn (Staff/Admin)
router.patch('/:id/tu-choi', authMiddleware, requireRole('STAFF', 'ADMIN'), DonDatController.tuChoi);

// PATCH /api/don-dat/:id/check-in — Check-in khi khách tới sân (Staff/Admin)
router.patch('/:id/check-in', authMiddleware, requireRole('STAFF', 'ADMIN'), DonDatController.checkIn);

// PATCH /api/don-dat/:id/hoan-thanh — Hoàn thành ca chơi & trả sân (Staff/Admin)
router.patch('/:id/hoan-thanh', authMiddleware, requireRole('STAFF', 'ADMIN'), DonDatController.hoanThanh);

// PATCH /api/don-dat/:id/huy — Khách hàng yêu cầu hủy đơn
router.patch('/:id/huy', authMiddleware, DonDatController.huy);

export default router;
