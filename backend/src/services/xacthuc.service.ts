// =====================================================================
// DỊCH VỤ XÁC THỰC — plant/06-api.md mục 4.1, 5.1, 5.2; CUS-01, 02, 03; STF-01
// Bảng thao tác: nguoi_dung
// =====================================================================
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/csdl';
import { LoiApi } from '../utils/loi';
import { bamMatKhau, soSanhMatKhau } from '../utils/matkhau';
import { kyToken } from '../utils/jwt';
import { chuyenCamel } from '../utils/chuyendoicamel';
import { VaiTro } from '../types';

export class XacThucService {
  /** CUS-01: Đăng ký khách hàng mới (role luôn là CUSTOMER) */
  static async dangKy(duLieu: { fullName: string; phone: string; password: string; email?: string | null }) {
    const { fullName, phone, password, email } = duLieu;

    // Kiểm tra trùng số điện thoại
    const [trungSdt] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM nguoi_dung WHERE so_dien_thoai = ? LIMIT 1',
      [phone]
    );
    if (trungSdt.length > 0) {
      throw LoiApi.xungDot('Số điện thoại đã được đăng ký', 'PHONE_EXISTS');
    }

    // Kiểm tra trùng email (nếu có)
    if (email) {
      const [trungEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM nguoi_dung WHERE email = ? LIMIT 1',
        [email]
      );
      if (trungEmail.length > 0) {
        throw LoiApi.xungDot('Email đã được sử dụng', 'EMAIL_EXISTS');
      }
    }

    const matKhauHash = await bamMatKhau(password);

    const [ketQua] = await pool.execute<ResultSetHeader>(
      `INSERT INTO nguoi_dung (ho_ten, so_dien_thoai, email, mat_khau_hash, vai_tro, trang_thai)
       VALUES (?, ?, ?, ?, 'CUSTOMER', 'ACTIVE')`,
      [fullName, phone, email || null, matKhauHash]
    );

    const userId = ketQua.insertId;
    const token = kyToken(userId, 'CUSTOMER');

    return {
      token,
      user: {
        id: userId,
        fullName,
        phone,
        email: email || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    };
  }

  /** CUS-02 / STF-01: Đăng nhập bằng số điện thoại và mật khẩu */
  static async dangNhap(duLieu: { phone: string; password: string }) {
    const { phone, password } = duLieu;

    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, ho_ten, so_dien_thoai, email, mat_khau_hash, vai_tro, trang_thai FROM nguoi_dung WHERE so_dien_thoai = ? LIMIT 1',
      [phone]
    );

    if (danhSach.length === 0) {
      throw LoiApi.chuaXacThuc('Số điện thoại hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    const user = danhSach[0];

    // BR-16: Tài khoản LOCKED không được đăng nhập
    if (user.trang_thai === 'LOCKED') {
      throw LoiApi.chuaXacThuc('Tài khoản của bạn đã bị khóa', 'ACCOUNT_LOCKED');
    }

    const khopMatKhau = await soSanhMatKhau(password, user.mat_khau_hash);
    if (!khopMatKhau) {
      throw LoiApi.chuaXacThuc('Số điện thoại hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
    }

    const token = kyToken(user.id, user.vai_tro as VaiTro);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.ho_ten,
        phone: user.so_dien_thoai,
        email: user.email,
        role: user.vai_tro,
        status: user.trang_thai,
      },
    };
  }

  /** CUS-03: Lấy thông tin tài khoản hiện tại */
  static async layThongTinMe(nguoiDungId: number) {
    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT id, ho_ten AS full_name, so_dien_thoai AS phone, email, vai_tro AS role, trang_thai AS status, ngay_tao AS created_at FROM nguoi_dung WHERE id = ? LIMIT 1',
      [nguoiDungId]
    );
    if (danhSach.length === 0) {
      throw LoiApi.khongTimThay('Người dùng không tồn tại');
    }
    return chuyenCamel(danhSach[0]);
  }

  /** CUS-03: Cập nhật thông tin họ tên, email */
  static async capNhatMe(nguoiDungId: number, duLieu: { fullName: string; email?: string | null }) {
    const { fullName, email } = duLieu;

    if (email) {
      const [trungEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM nguoi_dung WHERE email = ? AND id != ? LIMIT 1',
        [email, nguoiDungId]
      );
      if (trungEmail.length > 0) {
        throw LoiApi.xungDot('Email đã được sử dụng bởi tài khoản khác', 'EMAIL_EXISTS');
      }
    }

    await pool.execute(
      'UPDATE nguoi_dung SET ho_ten = ?, email = ? WHERE id = ?',
      [fullName, email || null, nguoiDungId]
    );

    return this.layThongTinMe(nguoiDungId);
  }

  /** CUS-03: Đổi mật khẩu */
  static async doiMatKhau(nguoiDungId: number, duLieu: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = duLieu;

    const [danhSach] = await pool.execute<RowDataPacket[]>(
      'SELECT mat_khau_hash FROM nguoi_dung WHERE id = ? LIMIT 1',
      [nguoiDungId]
    );
    if (danhSach.length === 0) throw LoiApi.khongTimThay('Người dùng không tồn tại');

    const khop = await soSanhMatKhau(currentPassword, danhSach[0].mat_khau_hash);
    if (!khop) {
      throw LoiApi.chuaXacThuc('Mật khẩu hiện tại không chính xác', 'INVALID_CREDENTIALS');
    }

    return { message: 'Đổi mật khẩu thành công' };
  }
}

export const xacThucService = {
  dangKy: (duLieu: any) => XacThucService.dangKy(duLieu),
  dangNhap: (duLieu: any) => XacThucService.dangNhap(duLieu),
  layThongTinNguoiDung: (id: number) => XacThucService.layThongTinMe(id),
  capNhatThongTin: (id: number, duLieu: any) => XacThucService.capNhatMe(id, duLieu),
  doiMatKhau: (id: number, duLieu: any) => XacThucService.doiMatKhau(id, duLieu),
};
