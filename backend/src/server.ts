// =====================================================================
// SERVER ENTRY POINT — Lắng nghe HTTP và quản lý vòng đời ứng dụng
// =====================================================================
import { app } from './app';
import { MOI_TRUONG } from './config/moitruong';
import { khoiDongJobQuetHetHan, dungJobQuetHetHan } from './jobs/hethan-dondat.job';

const PORT = MOI_TRUONG.PORT;

const server = app.listen(PORT, () => {
  console.log(`[Máy chủ] Đang lắng nghe tại cổng http://localhost:${PORT}`);
  console.log(`[API V1] Base URL: http://localhost:${PORT}/api/v1`);

  // Khởi động job tự động quét đơn hết hạn (BR-07)
  khoiDongJobQuetHetHan(30000);
});

// Xử lý dừng máy chủ an toàn
function dungMayChu(tinHieu: string) {
  console.log(`\n[Máy chủ] Nhận tín hiệu ${tinHieu}, đang đóng các kết nối...`);
  dungJobQuetHetHan();
  server.close(() => {
    console.log('[Máy chủ] Đã đóng máy chủ an toàn.');
    process.exit(0);
  });
}

process.on('SIGINT', () => dungMayChu('SIGINT'));
process.on('SIGTERM', () => dungMayChu('SIGTERM'));
