// =====================================================================
// SERVER ENTRY POINT — Tham chiếu: Plant/07-architecture.md mục 3.1
// Khởi động HTTP Server và Background Job hết hạn giữ chỗ (SYS-01)
// =====================================================================
import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { testDbConnection } from './config/db';
import { startExpireBookingsJob, stopExpireBookingsJob } from './jobs/expire-bookings.job';
import { initSocket } from './socket';

async function bootstrap() {
  try {
    // 1. Kiểm tra kết nối MySQL
    await testDbConnection();

    // 2. Khởi động background job hết hạn giữ chỗ (BR-07)
    startExpireBookingsJob();

    // 3. Khởi tạo HTTP Server & gắn Socket.io Gateway
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(ENV.PORT, () => {
      console.log(`🚀 [Server] Backend đang chạy tại: http://localhost:${ENV.PORT}`);
      console.log(`📍 [Health] Kiểm tra trạng thái: http://localhost:${ENV.PORT}/health`);
      console.log(`📡 [API v1] Base URL: http://localhost:${ENV.PORT}/api/v1`);
      console.log(`⚙️ [Admin UI] Trang quản trị: http://localhost:${ENV.PORT}/admin`);
      console.log(`⚡ [Socket.io] Gateway WebSocket đã sẵn sàng`);
    });

    // Xử lý dừng máy chủ an toàn
    const gracefulShutdown = () => {
      console.log('\n🛑 [Server] Đang đóng các kết nối và dừng dịch vụ...');
      stopExpireBookingsJob();
      httpServer.close(() => {
        console.log('👋 [Server] Đã dừng server hoàn tất');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('💥 [Server Bootstrap Error] Không thể khởi động server:', error);
    process.exit(1);
  }
}

bootstrap();
