// ============================================================
// DỊCH VỤ XÁC THỰC NGƯỜI DÙNG (Auth API Service)
// ============================================================

import { apiClient, executeWithFallback, setAuthToken } from './apiClient';
import { NguoiDung } from '../types';
import { THONG_TIN_NGUOI_DUNG } from '../data/mockData';

export const authService = {
  /** Lấy thông tin người dùng hiện tại */
  async getThongTinNguoiDung(): Promise<NguoiDung> {
    return executeWithFallback(
      () => apiClient.get<NguoiDung>('/auth/me'),
      () => THONG_TIN_NGUOI_DUNG as NguoiDung
    );
  },

  /** Giả lập đăng nhập */
  async dangNhap(soDienThoai: string): Promise<{ token: string; user: NguoiDung }> {
    return executeWithFallback(
      async () => {
        const res = await apiClient.post<{ token: string; user: NguoiDung }>('/auth/login', { soDienThoai });
        setAuthToken(res.data.token);
        return res.data;
      },
      () => {
        const token = `mock-token-${Date.now()}`;
        setAuthToken(token);
        return {
          token,
          user: THONG_TIN_NGUOI_DUNG as NguoiDung,
        };
      }
    );
  },
};
