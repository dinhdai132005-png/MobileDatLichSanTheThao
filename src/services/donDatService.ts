// ============================================================
// DỊCH VỤ ĐẶT LỊCH SÂN (Don Dat API Service)
// Gọi API Axios HTTP Client tạo đơn đặt & quản lý lịch sử
// ============================================================

import { apiClient, executeWithFallback } from './apiClient';
import { DonDat } from '../types';
import { LICH_SU_DAT_SAN } from '../data/mockData';

export const donDatService = {
  /** Lấy danh sách lịch sử đặt sân */
  async getLichSuDatSan(): Promise<DonDat[]> {
    return executeWithFallback(
      () => apiClient.get<DonDat[]>('/don-dat-san'),
      () => LICH_SU_DAT_SAN as DonDat[]
    );
  },

  /** Tạo đơn đặt sân mới */
  async taoDonDatSan(donDatData: Partial<DonDat>): Promise<DonDat> {
    const defaultDonDat: DonDat = {
      id: `BK${Math.floor(100 + Math.random() * 900)}`,
      tenSan: donDatData.tenSan || 'Sân Thể Thao',
      monTheThao: donDatData.monTheThao || 'Cầu Lông',
      emoji: donDatData.emoji || '🏸',
      ngayDat: donDatData.ngayDat || new Date().toISOString().split('T')[0],
      gioDat: donDatData.gioDat || '08:00',
      soGioThue: donDatData.soGioThue || 1,
      tongTien: donDatData.tongTien || 100000,
      trangThai: 'sapToi',
      mauSac: donDatData.mauSac || '#00C896',
      hoTen: donDatData.hoTen,
      soDT: donDatData.soDT,
      ghiChu: donDatData.ghiChu,
      phuongThucThanhToan: donDatData.phuongThucThanhToan || 'tienMat',
      createdAt: new Date().toISOString(),
    };

    return executeWithFallback(
      async () => {
        const res = await apiClient.post<DonDat>('/don-dat-san', donDatData);
        return res.data;
      },
      () => {
        (LICH_SU_DAT_SAN as DonDat[]).unshift(defaultDonDat);
        return defaultDonDat;
      }
    );
  },

  /** Hủy đơn đặt sân */
  async huyDonDat(donDatId: string): Promise<boolean> {
    return executeWithFallback(
      async () => {
        const res = await apiClient.patch(`/don-dat-san/${donDatId}/huy`);
        return res.status === 200;
      },
      () => {
        const item = (LICH_SU_DAT_SAN as DonDat[]).find((d) => d.id === donDatId);
        if (item) item.trangThai = 'daHuy';
        return true;
      }
    );
  },
};
