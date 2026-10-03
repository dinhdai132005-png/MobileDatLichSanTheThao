// =====================================================================
// DỊCH VỤ XÁC THỰC (AUTH SERVICE) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.1, 5.1, 5.2 & CUS-01..03
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { ApiError } from '../utils/errors';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { NguoiDungXacThuc, VaiTroNguoiDung } from '../types';

export class AuthService {
  /**
   * CUS-01: Đăng ký tài khoản khách hàng (vai trò: CUSTOMER)
   */
  static async register(duLieu: {
    hoTen: string;
    soDienThoai: string;
    matKhau: string;
    email?: string | null;
  }) {
    const { hoTen, soDienThoai, matKhau, email } = duLieu;

    // Kiểm tra trùng số điện thoại
    const [danhSachSdt] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE phone = ? LIMIT 1',
      [soDienThoai]
    );
    if (danhSachSdt.length > 0) {
      throw ApiError.conflict('Số điện thoại này đã được đăng ký', 'PHONE_EXISTS');
    }

    // Kiểm tra trùng email (nếu có cung cấp)
    if (email) {
      const [danhSachEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      if (danhSachEmail.length > 0) {
        throw ApiError.conflict('Email này đã được sử dụng', 'EMAIL_EXISTS');
      }
    }

    const matKhauHash = await hashPassword(matKhau);
    const [ketQua] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'CUSTOMER', 'ACTIVE')`,
      [hoTen, soDienThoai, email || null, matKhauHash]
    );

    const nguoiDungId = ketQua.insertId;
    const token = signToken(nguoiDungId, 'CUSTOMER');

    const nguoiDungData = {
      id: nguoiDungId,
      hoTen,
      soDienThoai,
      email: email || null,
      role: 'CUSTOMER' as VaiTroNguoiDung,
      status: 'ACTIVE',
    };

    return {
      token,
      nguoiDung: nguoiDungData,
      user: nguoiDungData,
    };
  }

  /**
   * CUS-02 / STF-01: Đăng nhập bằng số điện thoại và mật khẩu
   */
  static async login(soDienThoai: string, matKhauNhap: string) {
    const [danhSachNguoiDung] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name, phone, email, password_hash, role, status FROM users WHERE phone = ? LIMIT 1',
      [soDienThoai]
    );

    if (danhSachNguoiDung.length === 0) {
      throw ApiError.unauthorized('Số điện thoại hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    const nguoiDung = danhSachNguoiDung[0];

    // BR-16: Tài khoản LOCKED không được đăng nhập
    if (nguoiDung.status === 'LOCKED') {
      throw ApiError.unauthorized('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên', 'ACCOUNT_LOCKED');
    }

    const laMatKhauChinhXac = await comparePassword(matKhauNhap, nguoiDung.password_hash);
    if (!laMatKhauChinhXac) {
      throw ApiError.unauthorized('Số điện thoại hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    const token = signToken(nguoiDung.id, nguoiDung.role as VaiTroNguoiDung);

    const thongTinNguoiDung = {
      id: nguoiDung.id,
      hoTen: nguoiDung.full_name,
      soDienThoai: nguoiDung.phone,
      email: nguoiDung.email,
      role: nguoiDung.role,
      status: nguoiDung.status,
    };

    return {
      token,
      nguoiDung: thongTinNguoiDung,
      user: thongTinNguoiDung,
    };
  }

  /**
   * CUS-03: Lấy thông tin cá nhân hiện tại
   */
  static async getMe(nguoiDung: NguoiDungXacThuc) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, full_name AS hoTen, phone AS soDienThoai, email, role, status, created_at AS ngayTao FROM users WHERE id = ? LIMIT 1',
      [nguoiDung.id]
    );
    if (danhSach.length === 0) {
      throw ApiError.notFound('Không tìm thấy thông tin tài khoản');
    }
    return danhSach[0];
  }

  /**
   * CUS-03: Cập nhật thông tin cá nhân (họ tên, email)
   */
  static async updateMe(nguoiDung: NguoiDungXacThuc, duLieu: { hoTen?: string; email?: string | null }) {
    if (duLieu.email) {
      const [trungEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        [duLieu.email, nguoiDung.id]
      );
      if (trungEmail.length > 0) {
        throw ApiError.conflict('Email này đã được sử dụng bởi tài khoản khác', 'EMAIL_EXISTS');
      }
    }

    const danhSachCapNhat: string[] = [];
    const thamSo: any[] = [];

    if (duLieu.hoTen !== undefined) {
      danhSachCapNhat.push('full_name = ?');
      thamSo.push(duLieu.hoTen);
    }
    if (duLieu.email !== undefined) {
      danhSachCapNhat.push('email = ?');
      thamSo.push(duLieu.email || null);
    }

    if (danhSachCapNhat.length > 0) {
      thamSo.push(nguoiDung.id);
      await pool.execute(`UPDATE users SET ${danhSachCapNhat.join(', ')} WHERE id = ?`, thamSo);
    }

    return this.getMe(nguoiDung);
  }

  /**
   * CUS-03: Đổi mật khẩu
   */
  static async changePassword(nguoiDung: NguoiDungXacThuc, matKhauCu: string, matKhauMoi: string) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [nguoiDung.id]
    );
    if (danhSach.length === 0) {
      throw ApiError.notFound('Không tìm thấy tài khoản');
    }

    const laMatKhauCuDung = await comparePassword(matKhauCu, danhSach[0].password_hash);
    if (!laMatKhauCuDung) {
      throw ApiError.badRequest('Mật khẩu hiện tại không đúng', 'INVALID_OLD_PASSWORD');
    }

    const maHashMoi = await hashPassword(matKhauMoi);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [maHashMoi, nguoiDung.id]);

    return { message: 'Đổi mật khẩu thành công' };
  }
}
