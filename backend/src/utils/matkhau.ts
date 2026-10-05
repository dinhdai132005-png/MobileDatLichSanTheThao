// =====================================================================
// MẬT KHẨU — bcryptjs cost 10 (AGENT.md mục 6)
// =====================================================================
import bcrypt from 'bcryptjs';

const DO_PHUC_TAP = 10;

export function bamMatKhau(matKhau: string): Promise<string> {
  return bcrypt.hash(matKhau, DO_PHUC_TAP);
}

export function soSanhMatKhau(matKhau: string, bam: string): Promise<boolean> {
  return bcrypt.compare(matKhau, bam);
}
