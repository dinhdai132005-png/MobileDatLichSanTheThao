// =====================================================================
// TIỆN ÍCH THỜI GIAN — BR-20: mọi so sánh theo Asia/Ho_Chi_Minh (+07:00)
// Ngày "YYYY-MM-DD", giờ "HH:mm" hoặc "HH:mm:ss" (AGENT.md mục 3)
// =====================================================================
import { LoaiNgay } from '../types';
import { NGHIEP_VU } from '../config/nghiepvu';

const BO_DINH_DANG = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function layThanhPhan(thoiDiem: Date) {
  const ketQua: Record<string, string> = {};
  for (const phan of BO_DINH_DANG.formatToParts(thoiDiem)) ketQua[phan.type] = phan.value;
  return ketQua;
}

/** Ngày hôm nay (giờ VN) dạng YYYY-MM-DD */
export function layNgayHomNay(thoiDiem: Date = new Date()): string {
  const p = layThanhPhan(thoiDiem);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Số phút đã trôi qua trong ngày hiện tại (giờ VN) */
export function layPhutHienTai(thoiDiem: Date = new Date()): number {
  const p = layThanhPhan(thoiDiem);
  return Number(p.hour) * 60 + Number(p.minute);
}

/** Giờ hiện tại (giờ VN) dạng HH:mm */
export function layGioHienTai(thoiDiem: Date = new Date()): string {
  const p = layThanhPhan(thoiDiem);
  return `${p.hour}:${p.minute}`;
}

/** Chuỗi ngày hợp lệ dạng YYYY-MM-DD và tồn tại trên lịch */
export function laNgayHopLe(ngay: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return false;
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  const d = new Date(Date.UTC(nam, thang - 1, ngayTrongThang));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngayTrongThang;
}

/** Cộng/trừ số ngày cho chuỗi YYYY-MM-DD */
export function congNgay(ngay: string, soNgay: number): string {
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  const d = new Date(Date.UTC(nam, thang - 1, ngayTrongThang + soNgay));
  return d.toISOString().substring(0, 10);
}

/** BR-01: Thứ 7, Chủ nhật là WEEKEND, còn lại WEEKDAY */
export function xacDinhLoaiNgay(ngay: string): LoaiNgay {
  const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
  const thu = new Date(Date.UTC(nam, thang - 1, ngayTrongThang)).getUTCDay();
  return (NGHIEP_VU.NGAY_CUOI_TUAN as readonly number[]).includes(thu) ? 'WEEKEND' : 'WEEKDAY';
}

/** Số phút trong ngày của chuỗi giờ "HH:mm" hoặc "HH:mm:ss" */
export function phutTuGio(gio: string): number {
  const [h, m] = gio.split(':').map(Number);
  return h * 60 + m;
}

/** Thời điểm tuyệt đối (Date) của một ngày + giờ theo múi giờ +07:00 */
export function thoiDiemTu(ngay: string, gio: string): Date {
  const gioDayDu = gio.length === 5 ? `${gio}:00` : gio;
  return new Date(`${ngay}T${gioDayDu}+07:00`);
}

/** Định dạng thời điểm thành ISO 8601 +07:00 */
export function dinhDangIso(thoiDiem: Date): string {
  const p = layThanhPhan(thoiDiem);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+07:00`;
}

/** Tạo mã đơn đặt ngẫu nhiên định dạng BKXXXXXXXX */
export function taoMaDonDat(): string {
  const kyTu = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let chuoi = '';
  for (let i = 0; i < 8; i++) {
    chuoi += kyTu.charAt(Math.floor(Math.random() * kyTu.length));
  }
  return `BK${chuoi}`;
}
