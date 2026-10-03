// =====================================================================
// STAFF ROUTES — Tham chiếu: Plant/06-api.md mục 4.3
// Dành cho STAFF và ADMIN
// =====================================================================
import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { auth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  staffCreateBookingSchema,
  recordPaymentSchema,
  staffCancelBookingSchema,
} from '../validators/staff.validator';

const router = Router();

// Yêu cầu quyền STAFF hoặc ADMIN (AGENT.md §6)
router.use(auth, requireRole('STAFF', 'ADMIN'));

router.get('/dashboard', StaffController.getDashboard);
router.get('/schedule', StaffController.getSchedule);

router.get('/bookings', StaffController.getBookings);
router.get('/bookings/:id', StaffController.getBookingDetail);
router.post('/bookings', validate(staffCreateBookingSchema), StaffController.createWalkIn);
router.post('/bookings/:id/payments', validate(recordPaymentSchema), StaffController.recordPayment);
router.post('/bookings/:id/complete', StaffController.complete);
router.post('/bookings/:id/no-show', StaffController.noShow);
router.post('/bookings/:id/cancel', validate(staffCancelBookingSchema), StaffController.cancel);

router.get('/refunds', StaffController.getRefunds);
router.post('/payments/:id/confirm-refund', StaffController.confirmRefund);

router.get('/customers', StaffController.getCustomers);
router.get('/customers/:id', StaffController.getCustomerDetail);

export default router;
