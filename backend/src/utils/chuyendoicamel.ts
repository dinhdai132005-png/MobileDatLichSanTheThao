// =====================================================================
// CHUYỂN snake_case (DB) -> camelCase (JSON), AGENT.md mục 3
//  - Cột TIME  "17:00:00"            -> "17:00"                 (khóa kết thúc bằng Time)
//  - DATETIME  "2026-10-05 18:10:00" -> "2026-10-05T18:10:00+07:00" (khóa kết thúc bằng At)
// Ngày (DATE) giữ nguyên "YYYY-MM-DD" vì mysql2 chạy với dateStrings: true.
// =====================================================================

const MAU_GIO = /^\d{2}:\d{2}:\d{2}$/;
const MAU_NGAY_GIO = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function snakeSangCamel(chuoi: string): string {
  return chuoi.replace(/_([a-z0-9])/g, (_, kyTu: string) => kyTu.toUpperCase());
}

function chuanHoaGiaTri(khoa: string, giaTri: unknown): unknown {
  if (typeof giaTri !== 'string') return giaTri;
  if (khoa.endsWith('Time') && MAU_GIO.test(giaTri)) return giaTri.substring(0, 5);
  if (khoa.endsWith('At') && MAU_NGAY_GIO.test(giaTri)) return `${giaTri.replace(' ', 'T')}+07:00`;
  return giaTri;
}

export function chuyenCamel<T = any>(doiTuong: unknown): T {
  if (Array.isArray(doiTuong)) {
    return doiTuong.map((phanTu) => chuyenCamel(phanTu)) as unknown as T;
  }
  if (doiTuong !== null && typeof doiTuong === 'object' && !(doiTuong instanceof Date)) {
    const ketQua: Record<string, unknown> = {};
    for (const [khoa, giaTri] of Object.entries(doiTuong as Record<string, unknown>)) {
      const khoaCamel = snakeSangCamel(khoa);
      ketQua[khoaCamel] = chuanHoaGiaTri(khoaCamel, chuyenCamel(giaTri));
    }
    return ketQua as T;
  }
  return doiTuong as T;
}

/** Cắt "17:00:00" -> "17:00" cho giá trị TIME đơn lẻ */
export function catGio(gio: string): string {
  return gio.substring(0, 5);
}
