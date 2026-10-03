// ============================================================
// DỊCH VỤ ĐẶT LỊCH SÂN (Don Dat API Service) — TIẾNG VIỆT KHÔNG DẤU
// Kết nối trực tiếp Backend MySQL REST API (/api/v1/bookings & /api/v1/don-dat)
// Pattern: Screen -> Service -> API Client (Axios) -> Backend -> MySQL
// ============================================================
import { apiClient, requestApi, getAuthToken, ApiResponse } from './apiClient';
import { DonDat } from '../types';
import { authService } from './authService';

/** Chuyển đổi chuỗi giờ HH:mm sang ID khung giờ của hệ thống (bắt đầu từ 06:00 = ID 1) */
export function tinhKhungGioIdTuGio(gio: string): number {
  const gioSo = Number(gio.split(':')[0]);
  const khungGioId = gioSo - 5;
  return khungGioId >= 1 && khungGioId <= 16 ? khungGioId : 1;
}

/** Chuyển đổi đơn đặt từ MySQL Backend sang Mobile Type */
export function mapBackendDonDatToMobile(dongRaw: any): DonDat {
  let trangThaiDon: 'sapToi' | 'hoanThanh' | 'daHuy' = 'sapToi';
  const trangThaiBackend = dongRaw.trangThai || dongRaw.status;

  if (trangThaiBackend === 'CANCELLED' || trangThaiBackend === 'DA_HUY' || trangThaiBackend === 'EXPIRED' || trangThaiBackend === 'NO_SHOW') {
    trangThaiDon = 'daHuy';
  } else if (trangThaiBackend === 'COMPLETED' || trangThaiBackend === 'HOAN_THANH') {
    trangThaiDon = 'hoanThanh';
  }

  let ngayDatDinhDang = dongRaw.ngayDat || dongRaw.bookingDate;
  if (typeof ngayDatDinhDang === 'string' && ngayDatDinhDang.includes('T')) {
    ngayDatDinhDang = ngayDatDinhDang.split('T')[0];
  }

  const gioBatDau = (dongRaw.gioBatDau || dongRaw.startTime || dongRaw.gioDat || '08:00').substring(0, 5);

  return {
    id: String(dongRaw.id || dongRaw.maDonDat || dongRaw.bookingCode),
    maDonDat: String(dongRaw.maDonDat || dongRaw.bookingCode || dongRaw.id),
    sanId: String(dongRaw.sanId || dongRaw.courtId || 1),
    tenSan: dongRaw.tenSan || dongRaw.courtName || 'Sân Thể Thao',
    monTheThao: dongRaw.tenLoaiSan || dongRaw.courtTypeName || dongRaw.monTheThao || 'Thể Thao',
    emoji: dongRaw.emoji || '🏸',
    ngayDat: ngayDatDinhDang || new Date().toISOString().split('T')[0],
    gioDat: gioBatDau,
    soGioThue: Number(dongRaw.soGioThue) || 1,
    tongTien: Number(dongRaw.tongTien ?? dongRaw.totalAmount ?? 80000),
    trangThai: trangThaiDon,
    trangThaiGoc: trangThaiBackend,
    trangThaiThanhToan: dongRaw.trangThaiThanhToan || dongRaw.paymentStatus || 'UNPAID',
    mauSac: dongRaw.mauSac || '#00B884',
    hoTen: dongRaw.hoTen || dongRaw.fullName || dongRaw.tenKhachHang,
    soDT: dongRaw.soDienThoai || dongRaw.soDT,
    ghiChu: dongRaw.ghiChu || dongRaw.note,
    phuongThucThanhToan:
      (dongRaw.phuongThucThanhToan === 'BANK_TRANSFER' || dongRaw.paymentMethod === 'BANK_TRANSFER')
        ? 'chuyenKhoan'
        : 'tienMat',
    createdAt: dongRaw.ngayTao || dongRaw.createdAt,
    expiresAt: dongRaw.thoiGianHetHan || dongRaw.expiresAt,
    coTheHuy: Boolean(dongRaw.coTheHuy ?? dongRaw.canCancel),
    daDanhGia: Boolean(dongRaw.daDanhGia ?? dongRaw.isReviewed),
    thongTinThanhToan: dongRaw.thongTinThanhToan || dongRaw.paymentInfo || null,
    danhSachKhungGio: dongRaw.danhSachKhungGio || dongRaw.slots || [],
  };
}

export const donDatService = {
  /** Lấy danh sách lịch sử đặt sân của người dùng từ MySQL Backend (CUS-08) */
  async getLichSuDatSan(): Promise<DonDat[]> {
    if (!getAuthToken()) {
      await authService.dangNhap('0911111111', '123456');
    }

    const danhSachRaw = await requestApi<any[]>(
      apiClient.get<ApiResponse<any[]>>('/bookings/my')
    );
    const danhSach = Array.isArray(danhSachRaw) ? danhSachRaw : [];
    return danhSach.map(mapBackendDonDatToMobile);
  },

  /** Lấy chi tiết đơn đặt sân (CUS-07) */
  async getChiTietDonDat(donDatId: string): Promise<DonDat> {
    if (!getAuthToken()) {
      await authService.dangNhap('0911111111', '123456');
    }

    const data = await requestApi<any>(
      apiClient.get<ApiResponse<any>>(`/bookings/${donDatId}`)
    );
    return mapBackendDonDatToMobile(data);
  },

  /** Tạo đơn đặt sân mới trên Backend MySQL (CUS-06) */
  async taoDonDatSan(donDatData: Partial<DonDat> & { danhSachKhungGioId?: number[] }): Promise<DonDat> {
    if (!getAuthToken()) {
      await authService.dangNhap('0911111111', '123456');
    }

    const sanIdSo = Number(donDatData.sanId) || 1;
    const gioDau = donDatData.gioDat || '08:00';
    const soGioThue = Math.min(3, Math.max(1, Math.round(Number(donDatData.soGioThue) || 1)));

    // Xác định danh sách khung giờ liền kề (BR-02)
    let danhSachKhungGioId = donDatData.danhSachKhungGioId;
    if (!danhSachKhungGioId || danhSachKhungGioId.length === 0) {
      const khungGioDau = tinhKhungGioIdTuGio(gioDau);
      danhSachKhungGioId = [];
      for (let i = 0; i < soGioThue; i++) {
        danhSachKhungGioId.push(khungGioDau + i);
      }
    }

    const phuongThucThanhToan =
      donDatData.phuongThucThanhToan === 'chuyenKhoan' || donDatData.phuongThucThanhToan === 'momo'
        ? 'BANK_TRANSFER'
        : 'CASH';

    const duLieuGui = {
      sanId: sanIdSo,
      courtId: sanIdSo,
      ngayDat: donDatData.ngayDat || new Date().toISOString().split('T')[0],
      bookingDate: donDatData.ngayDat || new Date().toISOString().split('T')[0],
      danhSachKhungGioId,
      timeSlotIds: danhSachKhungGioId,
      phuongThucThanhToan,
      paymentMethod: phuongThucThanhToan,
      ghiChu: donDatData.ghiChu || null,
    };

    const ketQua = await requestApi<any>(
      apiClient.post<ApiResponse<any>>('/bookings', duLieuGui)
    );
    return mapBackendDonDatToMobile(ketQua);
  },

  /** Hủy đơn đặt sân (CUS-09) */
  async huyDonDat(donDatId: string, lyDoHuy: string = 'Khách hàng tự hủy trên ứng dụng'): Promise<boolean> {
    await requestApi<any>(
      apiClient.post<ApiResponse<any>>(`/bookings/${donDatId}/cancel`, { lyDoHuy, reason: lyDoHuy })
    );
    return true;
  },

  /** Đánh giá sân sau khi hoàn thành đơn (CUS-10 & Task T29) */
  async danhGiaDonDat(donDatId: string, soSao: number, noiDungDanhGia: string): Promise<any> {
    const res = await requestApi<any>(
      apiClient.post<ApiResponse<any>>(`/bookings/${donDatId}/review`, {
        soSao,
        rating: soSao,
        noiDungDanhGia,
        comment: noiDungDanhGia,
      })
    );
    return res;
  },
};
