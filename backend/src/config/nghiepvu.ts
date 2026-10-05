// =====================================================================
// HẰNG SỐ NGHIỆP VỤ — plant/AGENT.md mục 13, plant/03-actors-functions.md
// =====================================================================
export const NGHIEP_VU = {
  SO_NGAY_DAT_TRUOC_TOI_DA: 14,          // BR-03
  SO_PHUT_DAT_TRUOC_TOI_THIEU: 30,       // BR-03 (chỉ áp dụng cho đơn từ APP)
  SO_KHUNG_GIO_TOI_DA: 3,                // BR-02
  PHUT_GIU_CHO_CHUYEN_KHOAN: 30,         // BR-07
  SO_GIO_HAN_HUY: 6,                     // BR-09
  SO_DON_HOAT_DONG_TOI_DA: 3,            // BR-08
  NGAY_CUOI_TUAN: [0, 6],                // BR-01: Chủ nhật = 0, Thứ bảy = 6
  CHU_KY_JOB_HET_HAN_MS: 60_000,         // BR-07
  SO_DONG_TOI_DA_MOI_YEU_CAU: 10,        // BR-24
  SO_LUONG_TOI_DA_MOI_DONG: 20,          // BR-24
  DO_DAI_REFUND_INFO_TOI_DA: 300,        // BR-34
  SO_NGAY_BAO_CAO_TOI_DA: 366,           // ADM-07
  MAT_KHAU_TOI_THIEU: 6,                 // BR-21
  CHU_KY_LAM_MOI_MS: 30_000,             // 11-end-to-end-flows.md: POLL_INTERVAL_MS
} as const;
