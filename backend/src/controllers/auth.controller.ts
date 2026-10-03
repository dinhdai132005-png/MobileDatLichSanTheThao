// =====================================================================
// BỘ ĐIỀU KHIỂN XÁC THỰC (AUTH CONTROLLER) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/AGENT.md mục 5 & 06-api.md mục 4.1
// =====================================================================
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ok, created } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AuthService.register(req.body);
    return created(res, ketQua, 'Đăng ký tài khoản thành công');
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { soDienThoai, phone, matKhau, password } = req.body;
    const soDienThoaiDung = soDienThoai || phone;
    const matKhauDung = matKhau || password;
    const ketQua = await AuthService.login(soDienThoaiDung, matKhauDung);
    return ok(res, ketQua, 'Đăng nhập thành công');
  });

  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AuthService.getMe(req.user!);
    return ok(res, ketQua);
  });

  static updateMe = asyncHandler(async (req: Request, res: Response) => {
    const ketQua = await AuthService.updateMe(req.user!, req.body);
    return ok(res, ketQua, 'Cập nhật thông tin thành công');
  });

  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { matKhauCu, oldPassword, matKhauMoi, newPassword } = req.body;
    const ketQua = await AuthService.changePassword(
      req.user!,
      matKhauCu || oldPassword,
      matKhauMoi || newPassword
    );
    return ok(res, ketQua, 'Đổi mật khẩu thành công');
  });
}
