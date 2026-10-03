// =====================================================================
// AUTH ROUTES — Tham chiếu: Plant/06-api.md mục 4.1
// =====================================================================
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);

router.get('/me', auth, AuthController.getMe);
router.put('/me', auth, validate(updateMeSchema), AuthController.updateMe);
router.put('/change-password', auth, validate(changePasswordSchema), AuthController.changePassword);

export default router;
