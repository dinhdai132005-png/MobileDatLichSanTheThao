// =====================================================================
// HẰNG SỐ NGHIỆP VỤ — Tham chiếu: Plant/AGENT.md mục 13 & 03-actors-functions.md
// =====================================================================

export const BUSINESS = {
  BOOKING_ADVANCE_DAYS: 14,            // BR-03: Đặt trước tối đa 14 ngày
  MIN_LEAD_MINUTES: 30,                // BR-03: Khung giờ đầu cách hiện tại >= 30 phút (cho APP)
  MAX_SLOTS_PER_BOOKING: 3,            // BR-02: Tối đa 3 khung giờ liền kề / đơn
  HOLD_MINUTES_BANK_TRANSFER: 30,      // BR-07: Giữ chỗ chuyển khoản 30 phút
  CANCEL_DEADLINE_HOURS: 6,            // BR-09: Khách hủy trước giờ bắt đầu >= 6 tiếng
  MAX_ACTIVE_BOOKINGS_PER_CUSTOMER: 3, // BR-08: Tối đa 3 đơn hoạt động cùng lúc / khách
  WEEKEND_DAYS: [0, 6],                // BR-01: Chủ nhật = 0, Thứ bảy = 6
  EXPIRE_JOB_INTERVAL_MS: 60_000,      // BR-07: Quét đơn hết hạn mỗi 60 giây
} as const;
