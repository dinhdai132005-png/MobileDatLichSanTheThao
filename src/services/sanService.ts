// ============================================================
// DỊCH VỤ SÂN THỂ THAO (San API Service) — TIẾNG VIỆT KHÔNG DẤU
// Kết nối trực tiếp Backend REST API (MySQL)
// Pattern: Screen -> Service -> API Client (Axios) -> Backend -> MySQL
// ============================================================
import { apiClient, requestApi, ApiResponse } from './apiClient';
import { San, MonTheThao, KhungGio } from '../types';

export interface KhungGioBackend {
  khungGioId: number;
  gio: string;
  gioBatDau: string;
  gioKetThuc: string;
  giaTien: number;
  trangThai: 'AVAILABLE' | 'BOOKED' | 'PAST' | 'MAINTENANCE' | 'NO_PRICE';
  conTrong: boolean;
  dangGiuCho?: boolean;
  daQua?: boolean;
  laCaoDiem?: boolean;
}

// Bảng ánh xạ emoji và màu sắc theo môn thể thao
const BAN_DO_MON_THE_THAO: Record<string, { emoji: string; mauSac: string }> = {
  'Sân Cầu Lông': { emoji: '🏸', mauSac: '#00B884' },
  'Sân Bóng Đá': { emoji: '⚽', mauSac: '#3B82F6' },
  'Sân Tennis': { emoji: '🎾', mauSac: '#F59E0B' },
  'Sân Bóng Rổ': { emoji: '🏀', mauSac: '#EF4444' },
  'Pickleball': { emoji: '🏓', mauSac: '#8B5CF6' },
};

/** Chuyển đổi dữ liệu sân từ MySQL Backend sang Type chuẩn của Mobile UI */
export function mapBackendSanToMobile(thongTinRaw: any): San {
  let danhSachTienIch: string[] = ['Wifi miễn phí', 'Chỗ để xe máy/ô tô', 'Nước uống miễn phí', 'Phòng thay đồ'];
  if (Array.isArray(thongTinRaw.tienIch)) {
    danhSachTienIch = thongTinRaw.tienIch;
  } else if (typeof thongTinRaw.tienIch === 'string') {
    try {
      danhSachTienIch = JSON.parse(thongTinRaw.tienIch);
    } catch {
      // Giữ mặc định
    }
  }

  const tenLoaiSan = thongTinRaw.tenLoaiSan || thongTinRaw.loaiSan?.ten || 'Thể Thao';
  const cauHinhMon = BAN_DO_MON_THE_THAO[tenLoaiSan] || { emoji: '🏸', mauSac: '#00B884' };

  // Khung giờ mặc định
  const danhSachKhungGio: KhungGio[] = [
    { gio: '06:00', conTrong: true },
    { gio: '07:00', conTrong: true },
    { gio: '08:00', conTrong: true },
    { gio: '09:00', conTrong: true },
    { gio: '10:00', conTrong: true },
    { gio: '14:00', conTrong: true },
    { gio: '15:00', conTrong: true },
    { gio: '16:00', conTrong: true },
    { gio: '17:00', conTrong: true },
    { gio: '18:00', conTrong: true },
    { gio: '19:00', conTrong: true },
    { gio: '20:00', conTrong: true },
  ];

  return {
    id: String(thongTinRaw.id || thongTinRaw.sanId),
    tenSan: thongTinRaw.tenSan || thongTinRaw.name || 'Sân Thể Thao',
    monTheThao: tenLoaiSan,
    emoji: thongTinRaw.emoji || cauHinhMon.emoji,
    diaChi: thongTinRaw.diaChi || '123 Đường Thể Thao, Quận 10, TP.HCM',
    khoangCach: thongTinRaw.khoangCach || '1.2 km',
    giaTien: Number(thongTinRaw.giaTien || thongTinRaw.giaNgayThuong || 80000),
    danhGia: Number(thongTinRaw.diemDanhGia || thongTinRaw.danhGia || 5.0),
    soLuotDanhGia: Number(thongTinRaw.tongLuotDanhGia || thongTinRaw.soLuotDanhGia || 18),
    conSan: thongTinRaw.trangThai === 'ACTIVE' || thongTinRaw.status === 'ACTIVE' || thongTinRaw.conSan !== false,
    mauSac: thongTinRaw.mauSac || cauHinhMon.mauSac,
    tienIch: danhSachTienIch,
    gioMoCua: '06:00',
    gioDongCua: '22:00',
    danhSachKhungGio,
  };
}

/** Chuyển đổi dữ liệu môn thể thao / loại sân từ MySQL */
export function mapBackendLoaiSanToMon(thongTinRaw: any): MonTheThao {
  const tenLoaiSan = thongTinRaw.tenLoaiSan || thongTinRaw.ten || thongTinRaw.name || 'Cầu Lông';
  const cauHinhMon = BAN_DO_MON_THE_THAO[tenLoaiSan] || { emoji: '🏸', mauSac: '#00B884' };

  return {
    id: String(thongTinRaw.id),
    ten: tenLoaiSan,
    bieuTuongEmoji: thongTinRaw.emoji || cauHinhMon.emoji,
    mauSac: cauHinhMon.mauSac,
  };
}

export const sanService = {
  /** Lấy danh sách tất cả các sân thể thao từ Backend MySQL */
  async getDanhSachSan(thamSo?: { monTheThao?: string; sapXep?: string; tuKhoa?: string }): Promise<San[]> {
    const danhSachRaw = await requestApi<any[]>(
      apiClient.get<ApiResponse<any[]>>('/courts', { params: thamSo })
    );
    const danhSach = Array.isArray(danhSachRaw) ? danhSachRaw : [];
    return danhSach.map(mapBackendSanToMobile);
  },

  /** Lấy chi tiết thông tin 1 sân theo ID */
  async getChiTietSan(sanId: string): Promise<San | undefined> {
    const thongTinRaw = await requestApi<any>(
      apiClient.get<ApiResponse<any>>(`/courts/${sanId}`)
    );
    return thongTinRaw ? mapBackendSanToMobile(thongTinRaw) : undefined;
  },

  /** Lấy danh mục môn thể thao / loại sân từ Backend MySQL */
  async getDanhSachMonTheThao(): Promise<MonTheThao[]> {
    const danhSachRaw = await requestApi<any[]>(
      apiClient.get<ApiResponse<any[]>>('/court-types')
    );
    const danhSach = Array.isArray(danhSachRaw) ? danhSachRaw : [];
    return danhSach.map(mapBackendLoaiSanToMon);
  },

  /** Lấy khung giờ & giá tiền theo ngày (Realtime từ Backend MySQL) */
  async getSlotsTheoNgay(sanId: string, ngayDat: string): Promise<KhungGioBackend[]> {
    const ketQua = await requestApi<any>(
      apiClient.get<ApiResponse<any>>(`/courts/${sanId}/availability`, {
        params: { ngayDat },
      })
    );

    const danhSachKhung = ketQua?.danhSachKhungGio || ketQua?.slots || (Array.isArray(ketQua) ? ketQua : []);

    return danhSachKhung.map((dong: any) => ({
      khungGioId: dong.khungGioId || dong.timeSlotId || dong.id,
      gio: (dong.gioBatDau || dong.startTime || '06:00').substring(0, 5),
      gioBatDau: (dong.gioBatDau || dong.startTime || '06:00').substring(0, 5),
      gioKetThuc: (dong.gioKetThuc || dong.endTime || '07:00').substring(0, 5),
      giaTien: Number(dong.giaTien || dong.price || 0),
      trangThai: dong.trangThai || dong.status || 'AVAILABLE',
      conTrong: (dong.trangThai || dong.status) === 'AVAILABLE',
      dangGiuCho: (dong.trangThai || dong.status) === 'BOOKED',
      daQua: (dong.trangThai || dong.status) === 'PAST',
      laCaoDiem: Boolean(dong.laCaoDiem),
    }));
  },
};
