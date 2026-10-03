// =====================================================================
// CATALOG ROUTES — Tham chiếu: Plant/06-api.md mục 4.1
// Danh mục công khai không cần token
// =====================================================================
import { Router } from 'express';
import { CatalogController } from '../controllers/catalog.controller';
import { BookingController } from '../controllers/booking.controller';

const router = Router();

// Danh mục công khai không cần token (Hỗ trợ cả chuẩn REST Tiếng Anh và Alias Tiếng Việt)
router.get('/court-types', CatalogController.getCourtTypes);
router.get('/san/loai-san', CatalogController.getCourtTypes);
router.get('/loai-san', CatalogController.getCourtTypes);

router.get('/courts', CatalogController.getCourts);
router.get('/san', CatalogController.getCourts);

router.get('/courts/:id', CatalogController.getCourtById);
router.get('/san/:id', CatalogController.getCourtById);

router.get('/courts/:id/availability', BookingController.getAvailability);
router.get('/san/:id/availability', BookingController.getAvailability);
router.get('/san/:id/slots', BookingController.getAvailability);

router.get('/courts/:id/reviews', BookingController.getCourtReviews);
router.get('/san/:id/reviews', BookingController.getCourtReviews);

router.get('/time-slots', CatalogController.getTimeSlots);
router.get('/khung-gio', CatalogController.getTimeSlots);

router.get('/config/public', CatalogController.getPublicConfig);
router.get('/cau-hinh/cong-khai', CatalogController.getPublicConfig);

export default router;
