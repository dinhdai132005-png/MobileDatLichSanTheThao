// =====================================================================
// KIỂU DỮ LIỆU DÙNG CHUNG — giá trị enum giữ nguyên theo 01-database.md mục 6
// =====================================================================
export type VaiTro = 'CUSTOMER' | 'STAFF' | 'ADMIN';
export type TrangThaiTaiKhoan = 'ACTIVE' | 'LOCKED';

export type DanhMucSan = 'SPORT' | 'EVENT';
export type TrangThaiSan = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type LoaiNgay = 'WEEKDAY' | 'WEEKEND';

export type TrangThaiDon = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW';
export type PhuongThucThanhToan = 'CASH' | 'BANK_TRANSFER' | 'VNPAY';
export type TrangThaiThanhToanDon = 'UNPAID' | 'PAID' | 'REFUNDED';
export type NguonDon = 'APP' | 'STAFF';

export type LoaiGiaoDich = 'PAYMENT' | 'REFUND';
export type MucDichGiaoDich = 'COURT' | 'SERVICE';
export type TrangThaiGiaoDich = 'PENDING' | 'SUCCESS' | 'FAILED';

export type LoaiDichVu = 'DRINK' | 'RENTAL' | 'PACKAGE';
export type TrangThaiDichVu = 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE';
export type TrangThaiYeuCauDichVu = 'REQUESTED' | 'DELIVERED' | 'CANCELLED';

export type LoaiBienDongKho = 'IMPORT' | 'ADJUST_IN' | 'ADJUST_OUT' | 'RESERVE' | 'RELEASE' | 'DELIVER' | 'RETURN';
export type TrangThaiTonKho = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type TrangThaiKhungGio = 'AVAILABLE' | 'BOOKED' | 'PAST' | 'MAINTENANCE' | 'NO_PRICE';

/** Người dùng đã xác thực, gắn vào req.user bởi middleware xacThuc */
export interface NguoiDungXacThuc {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: VaiTro;
  status: TrangThaiTaiKhoan;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: NguoiDungXacThuc;
      nguoiDung?: NguoiDungXacThuc;
    }
  }
}
