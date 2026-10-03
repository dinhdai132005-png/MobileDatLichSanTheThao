// =====================================================================
// MASTER ROUTER — Tham chiếu: Plant/06-api.md mục 1 (Base URL: /api/v1)
// =====================================================================
import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogRoutes from './catalog.routes';
import bookingRoutes from './booking.routes';
import staffRoutes from './staff.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';

const apiV1Router = Router();

apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/', catalogRoutes);       // /court-types, /courts, /san, /time-slots, /config/public
apiV1Router.use('/bookings', bookingRoutes);
apiV1Router.use('/don-dat', bookingRoutes);
apiV1Router.use('/staff', staffRoutes);
apiV1Router.use('/admin', adminRoutes);
apiV1Router.use('/payments', paymentRoutes);

export default apiV1Router;
