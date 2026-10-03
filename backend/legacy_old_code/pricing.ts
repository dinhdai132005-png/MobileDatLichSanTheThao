// ============================================================
// PRICING UTILITY — Tính giá theo Peak/Off-peak Hours
// ============================================================

interface CauHinhGia {
  ngayTrongTuan: number; // 0=CN, 1–6=T2–T7, -1=Tất cả
  gioTu: string;
  gioDen: string;
  laCaoDiem: boolean;
}

/**
 * Tính giá đơn vị cho 1 slot theo giờ và ngày trong tuần.
 * @param gio       VD: "18:00"
 * @param cauHinh   Mảng cấu hình peak/off-peak từ DB
 * @param thu       0=CN, 1=T2,..., 6=T7
 * @param giaTienThapDiem  Giá thấp điểm (VND Int)
 * @param giaTienCaoDiem   Giá cao điểm (VND Int)
 * @returns Giá áp dụng (VND Int)
 */
export function tinhGiaTheoGio(
  gio: string,
  cauHinh: CauHinhGia[],
  thu: number,
  giaTienThapDiem: number,
  giaTienCaoDiem: number,
): number {
  const [h, p] = gio.split(':').map(Number);
  const phutHienTai = h * 60 + p;

  const laCaoDiem = cauHinh.some((ch) => {
    // Kiểm tra ngày trong tuần khớp
    const khopNgay = ch.ngayTrongTuan === -1 || ch.ngayTrongTuan === thu;
    if (!khopNgay || !ch.laCaoDiem) return false;

    const [hTu, pTu] = ch.gioTu.split(':').map(Number);
    const [hDen, pDen] = ch.gioDen.split(':').map(Number);
    const phutTu = hTu * 60 + pTu;
    const phutDen = hDen * 60 + pDen;

    return phutHienTai >= phutTu && phutHienTai < phutDen;
  });

  return laCaoDiem ? giaTienCaoDiem : giaTienThapDiem;
}

/**
 * Tính tổng tiền cho đơn đặt có thể span qua nhiều khung giờ
 * (vừa thấp điểm vừa cao điểm)
 */
export function tinhTongTienSan(
  gioKhoa: string,
  soGioThue: number,
  cauHinh: CauHinhGia[],
  thu: number,
  giaTienThapDiem: number,
  giaTienCaoDiem: number,
  soPhutMoiSlot: number = 60,
): number {
  const [h, p] = gioKhoa.split(':').map(Number);
  const phutBatDau = h * 60 + p;
  const tongPhut = Math.round(soGioThue * 60);
  let tongTien = 0;

  for (let offset = 0; offset < tongPhut; offset += soPhutMoiSlot) {
    const phutHienTai = phutBatDau + offset;
    const hh = Math.floor(phutHienTai / 60).toString().padStart(2, '0');
    const mm = (phutHienTai % 60).toString().padStart(2, '0');
    const gioSlot = `${hh}:${mm}`;

    const giaSlot = tinhGiaTheoGio(gioSlot, cauHinh, thu, giaTienThapDiem, giaTienCaoDiem);
    // Quy đổi về đơn vị giờ (giá lưu theo giờ)
    tongTien += Math.round(giaSlot * (soPhutMoiSlot / 60));
  }

  return tongTien;
}
