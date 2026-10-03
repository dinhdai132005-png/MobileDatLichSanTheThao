// =====================================================================
// ADMIN ROUTES — Tham chiếu: Plant/06-api.md mục 4.4
// Dành riêng cho ADMIN
// =====================================================================
import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { StaffController } from '../controllers/staff.controller';
import { auth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  courtTypeSchema,
  updateCourtTypeSchema,
  courtSchema,
  updateCourtSchema,
  timeSlotSchema,
  bulkSlotPricesSchema,
  createStaffSchema,
  updateStaffSchema,
} from '../validators/admin.validator';

const router = Router();

// Yêu cầu quyền ADMIN duy nhất
router.use(auth, requireRole('ADMIN'));

// 1. Loại sân
router.get('/court-types', AdminController.getCourtTypes);
router.post('/court-types', validate(courtTypeSchema), AdminController.createCourtType);
router.put('/court-types/:id', validate(updateCourtTypeSchema), AdminController.updateCourtType);
router.patch('/court-types/:id/active', AdminController.toggleCourtTypeActive);

// 2. Sân
router.get('/courts', AdminController.getCourts);
router.post('/courts', validate(courtSchema), AdminController.createCourt);
router.put('/courts/:id', validate(updateCourtSchema), AdminController.updateCourt);
router.patch('/courts/:id/status', AdminController.updateCourtStatus);

// 3. Khung giờ
router.get('/time-slots', AdminController.getTimeSlots);
router.post('/time-slots', validate(timeSlotSchema), AdminController.createTimeSlot);
router.patch('/time-slots/:id/active', AdminController.toggleTimeSlotActive);

// 4. Bảng giá ma trận
router.get('/slot-prices', AdminController.getSlotPrices);
router.put('/slot-prices', validate(bulkSlotPricesSchema), AdminController.updateSlotPrices);

// 5. Nhân viên
router.get('/staff', AdminController.getStaffList);
router.post('/staff', validate(createStaffSchema), AdminController.createStaff);
router.put('/staff/:id', validate(updateStaffSchema), AdminController.updateStaff);
router.patch('/staff/:id/status', AdminController.toggleStaffStatus);
router.post('/staff/:id/reset-password', AdminController.resetStaffPassword);

// 6. Khách hàng
router.get('/customers', StaffController.getCustomers);
router.patch('/customers/:id/status', AdminController.toggleCustomerStatus);

// 7. Báo cáo (ADM-07)
router.get('/reports/summary', AdminController.getSummaryReport);
router.get('/reports/revenue', AdminController.getRevenueReport);
router.get('/reports/court-usage', AdminController.getCourtUsageReport);
router.get('/bao-cao/tong-quan', AdminController.getSummaryReport);
router.get('/bao-cao/doanh-thu', AdminController.getRevenueReport);
router.get('/bao-cao/su-dung-san', AdminController.getCourtUsageReport);

export default router;
