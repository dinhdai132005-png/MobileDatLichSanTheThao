// ============================================================
// DỊCH VỤ SÂN THỂ THAO (San API Service)
// Sử dụng Axios HTTP Client kết hợp Fallback dữ liệu mockData
// ============================================================

import { apiClient, executeWithFallback } from './apiClient';
import { San, MonTheThao } from '../types';
import { DANH_SACH_SAN, DANH_SACH_MON_THE_THAO } from '../data/mockData';

export const sanService = {
  /** Lấy danh sách tất cả các sân thể thao */
  async getDanhSachSan(): Promise<San[]> {
    return executeWithFallback(
      () => apiClient.get<San[]>('/san-the-thao'),
      () => DANH_SACH_SAN as San[]
    );
  },

  /** Lấy chi tiết thông tin 1 sân theo ID */
  async getChiTietSan(sanId: string): Promise<San | undefined> {
    return executeWithFallback(
      () => apiClient.get<San>(`/san-the-thao/${sanId}`),
      () => (DANH_SACH_SAN as San[]).find((s) => s.id === sanId)
    );
  },

  /** Lấy danh sách môn thể thao */
  async getDanhSachMonTheThao(): Promise<MonTheThao[]> {
    return executeWithFallback(
      () => apiClient.get<MonTheThao[]>('/mon-the-thao'),
      () => DANH_SACH_MON_THE_THAO as MonTheThao[]
    );
  },

  /** Cập nhật trạng thái khung giờ của sân */
  async capNhatKhungGio(sanId: string, gio: string, conTrong: boolean): Promise<boolean> {
    return executeWithFallback(
      async () => {
        const res = await apiClient.patch(`/san-the-thao/${sanId}/khung-gio`, { gio, conTrong });
        return res.status === 200;
      },
      () => {
        const san = (DANH_SACH_SAN as San[]).find((s) => s.id === sanId);
        if (san) {
          const kg = san.danhSachKhungGio.find((k) => k.gio === gio);
          if (kg) kg.conTrong = conTrong;
        }
        return true;
      }
    );
  },
};
