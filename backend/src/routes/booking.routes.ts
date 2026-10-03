// =====================================================================
// BOOKING ROUTES — Tham chiếu: Plant/06-api.md mục 4.2 & AGENT.md mục 5
// Dành riêng cho khách hàng (Role = CUSTOMER)
// =====================================================================
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { auth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createBookingSchema,
  cancelBookingSchema,
  reviewSchema,
} from '../validators/booking.validator';

const router = Router();

// Tất cả route đều yêu cầu đăng nhập và đúng role CUSTOMER
router.use(auth, requireRole('CUSTOMER'));

router.post('/', validate(createBookingSchema), BookingController.create);
router.post('/tao-moi', validate(createBookingSchema), BookingController.create);

router.get('/my', BookingController.getMyBookings);
router.get('/cua-toi', BookingController.getMyBookings);

router.get('/:id', BookingController.getDetail);

router.post('/:id/cancel', validate(cancelBookingSchema), BookingController.cancel);
router.post('/:id/huy', validate(cancelBookingSchema), BookingController.cancel);

router.post('/:id/review', validate(reviewSchema), BookingController.review);
router.post('/:id/danh-gia', validate(reviewSchema), BookingController.review);

export default router;
