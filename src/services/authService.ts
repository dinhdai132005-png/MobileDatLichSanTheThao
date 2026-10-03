// ============================================================
// DỊCH VỤ XÁC THỰC NGƯỜI DÙNG (Auth API Service)
// Kết nối trực tiếp Backend REST API (Prisma/JWT)
// ============================================================
import { apiClient, requestApi, setAuthToken, getAuthToken, ApiResponse } from './apiClient';
import { NguoiDung } from '../types';

export const authService = {
  /** Lấy thông tin người dùng hiện tại từ Backend qua /auth/me */
  async getThongTinNguoiDung(): Promise<NguoiDung> {
    if (!getAuthToken()) {
      await this.dangNhap('0911111111', '123456');
    }

    const nguoiDungData = await requestApi<any>(
      apiClient.get<ApiResponse<any>>('/auth/me')
    );

    return {
      hoTen: nguoiDungData?.hoTen || 'Khách Hàng',
      email: nguoiDungData?.email || 'khachhang@gmail.com',
      soDienThoai: nguoiDungData?.soDienThoai || '0911111111',
      ngayThamGia: nguoiDungData?.ngayTao ? String(nguoiDungData.ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: nguoiDungData?.tongLuotDat ?? 3,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: nguoiDungData?.capDoThanhVien || 'Thành viên mới',
      avatarUrl: nguoiDungData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    };
  },

  /** Đăng nhập hệ thống bằng số điện thoại và mật khẩu */
  async dangNhap(
    soDienThoai: string = '0911111111',
    matKhau: string = '123456'
  ): Promise<{ token: string; nguoiDung: NguoiDung }> {
    const ketQua = await requestApi<{ token: string; nguoiDung?: any; user?: any }>(
      apiClient.post<ApiResponse<{ token: string; nguoiDung?: any; user?: any }>>('/auth/login', {
        soDienThoai,
        matKhau,
      })
    );

    const token = ketQua.token;
    const thongTinRaw = ketQua.nguoiDung || ketQua.user;

    if (token) {
      setAuthToken(token);
    }

    const nguoiDung: NguoiDung = {
      hoTen: thongTinRaw?.hoTen || 'Nguyễn Văn Khách',
      email: thongTinRaw?.email || 'khachhang@gmail.com',
      soDienThoai: thongTinRaw?.soDienThoai || soDienThoai,
      ngayThamGia: thongTinRaw?.ngayTao ? String(thongTinRaw.ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: thongTinRaw?.tongLuotDat ?? 3,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: 'Thành viên thân thiết',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    };

    return { token, nguoiDung };
  },

  /** Đăng ký tài khoản mới */
  async dangKy(duLieu: {
    hoTen: string;
    email: string;
    soDienThoai: string;
    matKhau: string;
  }): Promise<{ token: string; nguoiDung: NguoiDung }> {
    const ketQua = await requestApi<{ token: string; nguoiDung?: any; user?: any }>(
      apiClient.post<ApiResponse<{ token: string; nguoiDung?: any; user?: any }>>('/auth/register', duLieu)
    );

    const token = ketQua.token;
    const thongTinRaw = ketQua.nguoiDung || ketQua.user;

    if (token) {
      setAuthToken(token);
    }

    const nguoiDung: NguoiDung = {
      hoTen: thongTinRaw?.hoTen || duLieu.hoTen,
      email: thongTinRaw?.email || duLieu.email,
      soDienThoai: thongTinRaw?.soDienThoai || duLieu.soDienThoai,
      ngayThamGia: '2026-10-03',
      tongLuotDat: 0,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: 'Thành viên mới',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    };

    return { token, nguoiDung };
  },

  /** Cập nhật thông tin cá nhân (CUS-03) */
  async capNhatHoSo(duLieu: { hoTen?: string; fullName?: string; email?: string }): Promise<NguoiDung> {
    const payload = {
      fullName: duLieu.fullName || duLieu.hoTen,
      hoTen: duLieu.hoTen || duLieu.fullName,
      email: duLieu.email,
    };
    const res = await requestApi<any>(
      apiClient.put<ApiResponse<any>>('/auth/me', payload)
    );
    const thongTinRaw = res.user || res.nguoiDung || res;
    return {
      hoTen: thongTinRaw?.hoTen || thongTinRaw?.full_name || 'Khách Hàng',
      email: thongTinRaw?.email || '',
      soDienThoai: thongTinRaw?.soDienThoai || thongTinRaw?.phone || '',
      ngayThamGia: thongTinRaw?.ngayTao ? String(thongTinRaw.ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: thongTinRaw?.tongLuotDat ?? 3,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: 'Thành viên thân thiết',
      avatarUrl: thongTinRaw?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    };
  },

  /** Đổi mật khẩu (CUS-03) */
  async doiMatKhau(duLieu: { matKhauHienTai: string; currentPassword?: string; matKhauMoi: string; newPassword?: string }): Promise<boolean> {
    const payload = {
      currentPassword: duLieu.currentPassword || duLieu.matKhauHienTai,
      matKhauHienTai: duLieu.matKhauHienTai || duLieu.currentPassword,
      newPassword: duLieu.newPassword || duLieu.matKhauMoi,
      matKhauMoi: duLieu.matKhauMoi || duLieu.newPassword,
    };
    await requestApi<any>(
      apiClient.put<ApiResponse<any>>('/auth/change-password', payload)
    );
    return true;
  },

  /** Đăng xuất khỏi hệ thống */
  dangXuat(): void {
    setAuthToken('');
  },
};
