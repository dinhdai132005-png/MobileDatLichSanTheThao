// ============================================================
// DỊCH VỤ DỊCH VỤ PHÁT SINH & HÓA ĐƠN (Mobile Client Service)
// Đáp ứng: plant/06-api.md mục 4.1, 4.2; CUS-11, CUS-12, CUS-13; BR-24..BR-27
// ============================================================
import { apiClient, requestApi, ApiResponse } from './apiClient';
import { DichVuItem, HoaDonDonDat, YeuCauDichVu } from '../types';

export const dichVuService = {
  /** Lấy danh mục dịch vụ (nước uống, thuê vợt, gói tiệc) */
  async getDanhSachDichVu(type?: 'DRINK' | 'RENTAL' | 'PACKAGE'): Promise<DichVuItem[]> {
    const res = await requestApi<any[]>(
      apiClient.get<ApiResponse<any[]>>('/services', {
        params: type ? { type } : undefined,
      })
    );
    const list = Array.isArray(res) ? res : [];
    return list.map((item: any) => ({
      id: Number(item.id),
      name: item.name || item.ten || '',
      type: item.type || item.phanLoai,
      unitPrice: Number(item.unitPrice || item.donGia || 0),
      unit: item.unit || item.donViTinh || 'món',
      status: item.status || item.trangThai || 'ACTIVE',
      description: item.description || item.moTa || '',
    }));
  },

  /** Khách hàng gọi dịch vụ mang ra sân (CUS-12) */
  async goiDichVu(
    donDatId: string | number,
    items: Array<{ serviceId: number; quantity: number }>,
    note?: string
  ): Promise<YeuCauDichVu> {
    const res = await requestApi<any>(
      apiClient.post<ApiResponse<any>>(`/bookings/${donDatId}/service-orders`, {
        items,
        note: note || undefined,
      })
    );
    return res;
  },

  /** Lấy hóa đơn tổng hợp của đơn đặt (CUS-13, BR-26) */
  async getHoaDon(donDatId: string | number): Promise<HoaDonDonDat> {
    const res = await requestApi<HoaDonDonDat>(
      apiClient.get<ApiResponse<HoaDonDonDat>>(`/bookings/${donDatId}/invoice`)
    );
    return res;
  },

  /** Khách hàng hủy yêu cầu dịch vụ khi còn ở trạng thái REQUESTED (CUS-13) */
  async huyYeuCauDichVu(
    donDatId: string | number,
    orderId: number,
    reason?: string
  ): Promise<any> {
    const res = await requestApi<any>(
      apiClient.post<ApiResponse<any>>(`/bookings/${donDatId}/service-orders/${orderId}/cancel`, {
        reason: reason || 'Khách hàng tự hủy yêu cầu',
      })
    );
    return res;
  },
};
