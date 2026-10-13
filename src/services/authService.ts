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
      throw new Error('Vui lòng đăng nhập tài khoản');
    }

    const nguoiDungData = await requestApi<any>(
      apiClient.get<ApiResponse<any>>('/auth/me')
    );

    const hoTen = nguoiDungData?.fullName || nguoiDungData?.hoTen || nguoiDungData?.full_name || 'Khách Hàng';
    const email = nguoiDungData?.email || '';
    const soDienThoai = nguoiDungData?.phone || nguoiDungData?.soDienThoai || '';
    const ngayTao = nguoiDungData?.createdAt || nguoiDungData?.ngayTao;
    const vaiTro = nguoiDungData?.role || nguoiDungData?.vaiTro || 'CUSTOMER';

    let capDo = 'Thành viên mới';
    if (vaiTro === 'ADMIN') capDo = 'Quản Trị Viên';
    else if (vaiTro === 'STAFF') capDo = 'Nhân Viên';
    else if (nguoiDungData?.capDoThanhVien) capDo = nguoiDungData.capDoThanhVien;
    else capDo = 'Thành viên thân thiết';

    return {
      id: nguoiDungData?.id,
      hoTen,
      email,
      soDienThoai,
      ngayThamGia: ngayTao ? String(ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: nguoiDungData?.tongLuotDat ?? 3,
      monYeuThich: nguoiDungData?.monYeuThich || 'Cầu Lông',
      capDoThanhVien: capDo,
      avatarUrl: nguoiDungData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      vaiTro,
      role: vaiTro,
    };
  },

  /** Đăng nhập hệ thống bằng số điện thoại và mật khẩu */
  async dangNhap(
    soDienThoai: string = '0911111111',
    matKhau: string = '123456'
  ): Promise<{ token: string; nguoiDung: NguoiDung }> {
    const ketQua = await requestApi<{ token: string; nguoiDung?: any; user?: any }>(
      apiClient.post<ApiResponse<{ token: string; nguoiDung?: any; user?: any }>>('/auth/login', {
        phone: soDienThoai,
        soDienThoai,
        password: matKhau,
        matKhau,
      })
    );

    const token = ketQua.token;
    const thongTinRaw = ketQua.user || ketQua.nguoiDung;

    if (token) {
      setAuthToken(token);
    }

    const hoTen = thongTinRaw?.fullName || thongTinRaw?.hoTen || thongTinRaw?.full_name || 'Khách Hàng';
    const email = thongTinRaw?.email || '';
    const phone = thongTinRaw?.phone || thongTinRaw?.soDienThoai || soDienThoai;
    const ngayTao = thongTinRaw?.createdAt || thongTinRaw?.ngayTao;
    const vaiTro = thongTinRaw?.role || thongTinRaw?.vaiTro || 'CUSTOMER';

    let capDo = 'Thành viên mới';
    if (vaiTro === 'ADMIN') capDo = 'Quản Trị Viên';
    else if (vaiTro === 'STAFF') capDo = 'Nhân Viên';
    else capDo = 'Thành viên thân thiết';

    const nguoiDung: NguoiDung = {
      id: thongTinRaw?.id,
      hoTen,
      email,
      soDienThoai: phone,
      ngayThamGia: ngayTao ? String(ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: thongTinRaw?.tongLuotDat ?? 3,
      monYeuThich: thongTinRaw?.monYeuThich || 'Cầu Lông',
      capDoThanhVien: capDo,
      avatarUrl: thongTinRaw?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      vaiTro,
      role: vaiTro,
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
      apiClient.post<ApiResponse<{ token: string; nguoiDung?: any; user?: any }>>('/auth/register', {
        fullName: duLieu.hoTen,
        hoTen: duLieu.hoTen,
        phone: duLieu.soDienThoai,
        soDienThoai: duLieu.soDienThoai,
        email: duLieu.email,
        password: duLieu.matKhau,
        matKhau: duLieu.matKhau,
      })
    );

    const token = ketQua.token;
    const thongTinRaw = ketQua.user || ketQua.nguoiDung;

    if (token) {
      setAuthToken(token);
    }

    const nguoiDung: NguoiDung = {
      id: thongTinRaw?.id,
      hoTen: thongTinRaw?.fullName || thongTinRaw?.hoTen || duLieu.hoTen,
      email: thongTinRaw?.email || duLieu.email,
      soDienThoai: thongTinRaw?.phone || thongTinRaw?.soDienThoai || duLieu.soDienThoai,
      ngayThamGia: new Date().toISOString().split('T')[0],
      tongLuotDat: 0,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: 'Thành viên mới',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      vaiTro: 'CUSTOMER',
      role: 'CUSTOMER',
    };

    return { token, nguoiDung };
  },

  /** Cập nhật thông tin cá nhân (CUS-03) */
  async capNhatHoSo(duLieu: { hoTen?: string; fullName?: string; email?: string }): Promise<NguoiDung> {
    const payload = {
      fullName: duLieu.fullName || duLieu.hoTen,
      email: duLieu.email || null,
    };
    const res = await requestApi<any>(
      apiClient.put<ApiResponse<any>>('/auth/me', payload)
    );
    const thongTinRaw = res.user || res.nguoiDung || res;
    const hoTen = thongTinRaw?.fullName || thongTinRaw?.hoTen || thongTinRaw?.full_name || duLieu.hoTen || 'Khách Hàng';
    const email = thongTinRaw?.email || duLieu.email || '';
    const phone = thongTinRaw?.phone || thongTinRaw?.soDienThoai || '';
    const ngayTao = thongTinRaw?.createdAt || thongTinRaw?.ngayTao;

    return {
      id: thongTinRaw?.id,
      hoTen,
      email,
      soDienThoai: phone,
      ngayThamGia: ngayTao ? String(ngayTao).split('T')[0] : '2026-01-01',
      tongLuotDat: thongTinRaw?.tongLuotDat ?? 3,
      monYeuThich: 'Cầu Lông',
      capDoThanhVien: 'Thành viên thân thiết',
      avatarUrl: thongTinRaw?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      vaiTro: thongTinRaw?.role,
      role: thongTinRaw?.role,
    };
  },

  /** Đổi mật khẩu (CUS-03) */
  async doiMatKhau(duLieu: { matKhauHienTai: string; currentPassword?: string; matKhauMoi: string; newPassword?: string }): Promise<boolean> {
    const payload = {
      currentPassword: duLieu.currentPassword || duLieu.matKhauHienTai,
      newPassword: duLieu.newPassword || duLieu.matKhauMoi,
    };
    await requestApi<any>(
      apiClient.put<ApiResponse<any>>('/auth/change-password', payload)
    );
    return true;
  },

  /** Đăng xuất khỏi hệ thống */
  dangXuat(): void {
    setAuthToken(null);
  },
};
