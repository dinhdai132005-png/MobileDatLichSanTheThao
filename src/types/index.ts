// ============================================================
// TYPINGS & INTERFACES CHO DỰ ÁN ĐẶT LỊCH SÂN THỂ THAO
// ============================================================

/** Parameter list cho React Navigation Stack */
export type RootStackParamList = {
  TrangChuMain: undefined;
  DanhSachSanMain: undefined;
  ChiTietSan: { san: San };
  DatLich: { san: San; ngay: string; gio: string };
  TrangChuTab: undefined;
  DanhSachSanTab: undefined;
  HoSoTab: undefined;
};

/** Thông tin môn thể thao */
export interface MonTheThao {
  id: string;
  ten: string;
  bieuTuongEmoji?: string;
  biểuTượngEmoji?: string;
  mauSac: string;
}

/** Khung giờ đặt sân */
export interface KhungGio {
  gio: string;
  conTrong: boolean;
}

/** Đơn vị Sân thể thao */
export interface San {
  id: string;
  tenSan: string;
  monTheThao: string;
  emoji: string;
  diaChi: string;
  khoangCach: string;
  giaTien: number; // Tính theo VND (Int)
  danhGia: number;
  soLuotDanhGia: number;
  conSan: boolean;
  mauSac: string;
  tienIch: string[];
  gioMoCua: string;
  gioDongCua: string;
  danhSachKhungGio: KhungGio[];
}

/** Trạng thái đơn đặt sân */
export type TrangThaiDonDat = 'sapToi' | 'hoanThanh' | 'daHuy';

/** Phương thức thanh toán */
export type PhuongThucThanhToan = 'tienMat' | 'momo' | 'chuyenKhoan';

/** Đơn đặt sân thể thao */
export interface DonDat {
  id: string;
  sanId?: string;
  tenSan: string;
  monTheThao: string;
  emoji: string;
  ngayDat: string;
  gioDat: string;
  soGioThue: number;
  tongTien: number;
  trangThai: TrangThaiDonDat;
  mauSac: string;
  hoTen?: string;
  soDT?: string;
  ghiChu?: string;
  phuongThucThanhToan?: PhuongThucThanhToan;
  createdAt?: string;
}

/** Thông tin tài khoản người dùng */
export interface NguoiDung {
  hoTen: string;
  email: string;
  soDienThoai: string;
  ngayThamGia: string;
  tongLuotDat: number;
  monYeuThich: string;
  capDoThanhVien: string;
  avatarUrl?: string;
}

/** Cấu hình sinh mã VietQR */
export interface VietQRConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

/** Thông tin Ngân hàng hỗ trợ VietQR */
export interface VietQRBankInfo {
  id: string;
  name: string;
  code: string;
  bin: string;
  logo: string;
}

/** Payload sự kiện Socket.io cập nhật khung giờ */
export interface SocketSlotUpdatePayload {
  sanId: string;
  gio: string;
  conTrong: boolean;
  updatedBy?: string;
  timestamp: string;
}

/** Payload sự kiện Socket.io đơn đặt mới */
export interface SocketNewBookingPayload {
  donDat: DonDat;
  timestamp: string;
}

/** Chuẩn Response API */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}
