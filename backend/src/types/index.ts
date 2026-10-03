// =====================================================================
// KIỂU DỮ LIỆU DÙNG CHUNG — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/01-database.md & Chuẩn chuyên ngành IT
// =====================================================================

// Vai trò người dùng (Giữ nguyên chuẩn IT Enum)
export type VaiTroNguoiDung = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type TrangThaiNguoiDung = 'ACTIVE' | 'LOCKED';

// Trạng thái sân và loại ngày
export type TrangThaiSan = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type LoaiNgay = 'WEEKDAY' | 'WEEKEND';

// Trạng thái vòng đời đơn đặt sân
export type TrangThaiDonDat =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

// Phương thức & trạng thái thanh toán
export type PhuongThucThanhToan = 'CASH' | 'BANK_TRANSFER' | 'VNPAY';
export type TrangThaiThanhToan = 'UNPAID' | 'PAID' | 'REFUNDED';
export type NguonDonDat = 'APP' | 'STAFF';

export type LoaiGiaoDich = 'PAYMENT' | 'REFUND';
export type TrangThaiGiaoDich = 'PENDING' | 'SUCCESS' | 'FAILED';

// Trạng thái khả dụng của từng khung giờ
export type TrangThaiKhungGio =
  | 'AVAILABLE'
  | 'BOOKED'
  | 'PAST'
  | 'MAINTENANCE'
  | 'NO_PRICE';

/** Thông tin người dùng đã xác thực gắn vào Request */
export interface NguoiDungXacThuc {
  id: number;
  hoTen: string;
  soDienThoai: string;
  email?: string | null;
  role: VaiTroNguoiDung;
  status: TrangThaiNguoiDung;
}

// Alias tương thích chuẩn
export type AuthUser = NguoiDungXacThuc;
export type UserRole = VaiTroNguoiDung;
export type UserStatus = TrangThaiNguoiDung;
export type CourtStatus = TrangThaiSan;
export type DayType = LoaiNgay;
export type BookingStatus = TrangThaiDonDat;
export type PaymentMethod = PhuongThucThanhToan;
export type PaymentStatus = TrangThaiThanhToan;
export type BookingSource = NguonDonDat;
export type SlotAvailabilityStatus = TrangThaiKhungGio;

declare global {
  namespace Express {
    interface Request {
      user?: NguoiDungXacThuc;
    }
  }
}
