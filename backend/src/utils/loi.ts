// =====================================================================
// LỖI NGHIỆP VỤ — mã lỗi và HTTP status theo plant/06-api.md mục 3
// =====================================================================

export interface LoiKiemTraDauVao {
  field: string;
  message: string;
}

export class LoiApi extends Error {
  public readonly maTrangThai: number;
  public readonly maLoi: string;
  public readonly danhSachLoi: LoiKiemTraDauVao[] | null;
  /** Dữ liệu kèm theo (VD COURT_HAS_FUTURE_BOOKINGS trả số đơn tương lai) */
  public readonly duLieu: unknown;

  constructor(
    maTrangThai: number,
    maLoi: string,
    thongBao: string,
    danhSachLoi: LoiKiemTraDauVao[] | null = null,
    duLieu: unknown = undefined
  ) {
    super(thongBao);
    this.name = 'LoiApi';
    this.maTrangThai = maTrangThai;
    this.maLoi = maLoi;
    this.danhSachLoi = danhSachLoi;
    this.duLieu = duLieu;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static yeuCauKhongHopLe(thongBao = 'Dữ liệu không hợp lệ', maLoi = 'VALIDATION_ERROR', danhSachLoi: LoiKiemTraDauVao[] | null = null) {
    return new LoiApi(400, maLoi, thongBao, danhSachLoi);
  }

  static chuaXacThuc(thongBao = 'Vui lòng đăng nhập để tiếp tục', maLoi = 'UNAUTHORIZED') {
    return new LoiApi(401, maLoi, thongBao);
  }

  static camTruyCap(thongBao = 'Bạn không có quyền thực hiện thao tác này', maLoi = 'FORBIDDEN') {
    return new LoiApi(403, maLoi, thongBao);
  }

  static khongTimThay(thongBao = 'Không tìm thấy dữ liệu yêu cầu', maLoi = 'NOT_FOUND') {
    return new LoiApi(404, maLoi, thongBao);
  }

  static xungDot(thongBao: string, maLoi = 'CONFLICT', duLieu: unknown = undefined) {
    return new LoiApi(409, maLoi, thongBao, null, duLieu);
  }

  static khongXuLyDuoc(thongBao: string, maLoi = 'UNPROCESSABLE_ENTITY') {
    return new LoiApi(422, maLoi, thongBao);
  }

  static loiNoiBo(thongBao = 'Lỗi máy chủ nội bộ', maLoi = 'INTERNAL_ERROR') {
    return new LoiApi(500, maLoi, thongBao);
  }

  static khongCoQuyen = LoiApi.camTruyCap;
  static yeuCauSai = LoiApi.yeuCauKhongHopLe;
}
