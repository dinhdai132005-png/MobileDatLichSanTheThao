// ============================================================
// VIETQR CODE GENERATOR - CHUẨN MÃ QR NGÂN HÀNG VIỆT NAM (Napas247)
// Tính năng: Sinh URL QuickLink, Tạo chuỗi EMVCo Payload, Danh sách ngân hàng
// ============================================================

import { VietQRConfig, VietQRBankInfo } from '../types';

/** Danh sách các ngân hàng phổ biến hỗ trợ VietQR */
export const DANH_SACH_NGAN_HANG: VietQRBankInfo[] = [
  { id: 'MB', name: 'Ngân hàng Quân Đội (MBBank)', code: 'MB', bin: '970422', logo: '🏦' },
  { id: 'VCB', name: 'Ngân hàng Vietcombank', code: 'VCB', bin: '970436', logo: '🟢' },
  { id: 'ICB', name: 'Ngân hàng VietinBank', code: 'ICB', bin: '970415', logo: '🔵' },
  { id: 'TCB', name: 'Ngân hàng Techcombank', code: 'TCB', bin: '970407', logo: '🔴' },
  { id: 'ACB', name: 'Ngân hàng ACB', code: 'ACB', bin: '970416', logo: '🔷' },
  { id: 'BIDV', name: 'Ngân hàng BIDV', code: 'BIDV', bin: '970418', logo: '🟩' },
  { id: 'VPB', name: 'Ngân hàng VPBank', code: 'VPB', bin: '970432', logo: '🟢' },
];

/** Cấu hình VietQR mặc định cho Chủ Sân Thể Thao */
export const VIETQR_MAC_DINH: VietQRConfig = {
  bankId: 'MB',
  accountNo: '0912345678',
  accountName: 'DINH NGOC DAI',
  amount: 80000,
  addInfo: 'DAT SAN THE THAO',
  template: 'compact2',
};

/**
 * Sinh đường dẫn URL hình ảnh VietQR QuickLink (dùng hiển thị hoặc tải ảnh)
 */
export function generateVietQRQuickLink(config: Partial<VietQRConfig>): string {
  const bank = config.bankId || VIETQR_MAC_DINH.bankId;
  const stk = config.accountNo || VIETQR_MAC_DINH.accountNo;
  const template = config.template || 'compact2';
  const amount = config.amount || 0;
  const addInfo = encodeURIComponent(config.addInfo || VIETQR_MAC_DINH.addInfo);
  const accountName = encodeURIComponent(config.accountName || VIETQR_MAC_DINH.accountName);

  return `https://img.vietqr.io/image/${bank}-${stk}-${template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

/**
 * Sinh chuỗi VietQR Payload String (cho react-native-qrcode-svg vẽ mã QR trực tiếp)
 */
export function generateVietQRPayloadString(config: Partial<VietQRConfig>): string {
  const bankId = config.bankId || VIETQR_MAC_DINH.bankId;
  const bank = DANH_SACH_NGAN_HANG.find((b) => b.id === bankId) || DANH_SACH_NGAN_HANG[0];
  const stk = config.accountNo || VIETQR_MAC_DINH.accountNo;
  const amount = config.amount || 0;
  const addInfo = config.addInfo || VIETQR_MAC_DINH.addInfo;

  // VietQR URL QuickLink standard payload text
  return `https://qr.vietqr.io/${bank.bin}/${stk}?amount=${amount}&note=${encodeURIComponent(addInfo)}`;
}
