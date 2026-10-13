// =====================================================================
// KIỂM THỬ ĐỘ ỔN ĐỊNH VÀ TẢI TOÀN HỆ THỐNG (STABILITY & LOAD TESTING)
// Kiểm định khi cơ sở dữ liệu có 300+ đơn đặt sân và 400+ giao dịch
// Tuân thủ kỹ năng: mutation-and-flakiness-testing & concurrency-and-race-testing
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { RowDataPacket } from 'mysql2/promise';

describe('Kiểm thử Độ Ổn Định & Tính Toàn Vẹn Hệ Thống (300+ Bookings)', () => {
  const sdtAdmin = '0900000001';
  let tokenAdmin: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = res.body.data.token;
  });

  // 1. Kiểm tra tính toàn vẹn dữ liệu ở tầng cơ sở dữ liệu
  describe('1. Kiểm định Tính Toàn Vẹn & Nhất Quán CSDL (Data Invariants)', () => {
    it('DB-01: Tuyệt đối không có bất kỳ slot nào bị trùng lịch (dang_khoa = 1)', async () => {
      const [duplicateSlots] = await csdl.execute<RowDataPacket[]>(
        `SELECT san_id, ngay_dat, khung_gio_id, COUNT(*) as cnt
         FROM chi_tiet_khung_gio_dat
         WHERE dang_khoa = 1
         GROUP BY san_id, ngay_dat, khung_gio_id
         HAVING cnt > 1`
      );
      expect(duplicateSlots.length).toBe(0);
    });

    it('DB-02: Không có bản ghi mồ côi (Orphan records) giữa các bảng liên kết', async () => {
      // Slot không có đơn
      const [orphanSlots] = await csdl.execute<RowDataPacket[]>(
        `SELECT ct.id FROM chi_tiet_khung_gio_dat ct
         LEFT JOIN don_dat dd ON dd.id = ct.don_dat_id
         WHERE dd.id IS NULL`
      );
      expect(orphanSlots.length).toBe(0);

      // Thanh toán không có đơn
      const [orphanPays] = await csdl.execute<RowDataPacket[]>(
        `SELECT tt.id FROM thanh_toan tt
         LEFT JOIN don_dat dd ON dd.id = tt.don_dat_id
         WHERE dd.id IS NULL`
      );
      expect(orphanPays.length).toBe(0);

      // Chi tiết dịch vụ không có yêu cầu
      const [orphanServices] = await csdl.execute<RowDataPacket[]>(
        `SELECT ct.id FROM chi_tiet_yeu_cau_dich_vu ct
         LEFT JOIN yeu_cau_dich_vu yc ON yc.id = ct.yeu_cau_dich_vu_id
         WHERE yc.id IS NULL`
      );
      expect(orphanServices.length).toBe(0);
    });

    it('DB-03: Khớp 100% giữa tiền dịch vụ trong don_dat và tổng các món DELIVERED', async () => {
      const [mismatches] = await csdl.execute<RowDataPacket[]>(
        `SELECT dd.id, dd.tien_dich_vu,
                COALESCE(SUM(ct.so_luong * ct.don_gia), 0) AS calculated_service
         FROM don_dat dd
         LEFT JOIN yeu_cau_dich_vu yc ON yc.don_dat_id = dd.id AND yc.trang_thai = 'DELIVERED'
         LEFT JOIN chi_tiet_yeu_cau_dich_vu ct ON ct.yeu_cau_dich_vu_id = yc.id
         GROUP BY dd.id, dd.tien_dich_vu
         HAVING dd.tien_dich_vu != calculated_service`
      );
      expect(mismatches.length).toBe(0);
    });

    it('DB-04: Đảm bảo số lượng đơn đặt đạt tối thiểu 300 bản ghi', async () => {
      const [countRows] = await csdl.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM don_dat');
      expect(Number(countRows[0].total)).toBeGreaterThanOrEqual(300);
    });
  });

  // 2. Kiểm thử hiệu năng & độ trễ (Latency Benchmark) dưới tải dữ liệu lớn
  describe('2. Kiểm thử Hiệu Năng & Độ Trễ API Báo Cáo', () => {
    it('PERF-01: API Báo cáo chi tiết từng khoản phản hồi nhanh < 500ms', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/v1/admin/reports/itemized-breakdown?from=2026-09-01&to=2026-10-13')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(duration).toBeLessThan(500); // Phản hồi dưới nửa giây
      expect(res.body.data.summary.courtRevenue).toBeGreaterThan(0);
      expect(res.body.data.summary.drinkRevenue).toBeGreaterThan(0);
      expect(res.body.data.summary.rentalRevenue).toBeGreaterThan(0);
    });

    it('PERF-02: API Doanh thu theo ngày nhóm dữ liệu 43 ngày phản hồi < 400ms', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/v1/admin/reports/revenue?from=2026-09-01&to=2026-10-13&groupBy=day')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(400);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(30);
    });
  });

  // 3. Kiểm thử tải đồng thời (Stress Test - 20 Concurrent Requests)
  describe('3. Kiểm thử Tải Đồng Thời (20 Concurrent Requests)', () => {
    it('CONC-01: 20 requests đồng thời tra cứu báo cáo và lịch sân đều trả về 200 OK', async () => {
      const start = Date.now();
      const promises = Array.from({ length: 20 }).map((_, idx) => {
        const url = idx % 2 === 0
          ? '/api/v1/admin/reports/itemized-breakdown?from=2026-09-01&to=2026-10-13'
          : '/api/v1/admin/reports/summary?from=2026-09-01&to=2026-10-13';
        return request(app)
          .get(url)
          .set('Authorization', `Bearer ${tokenAdmin}`);
      });

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - start;

      // Tất cả 20 request đều phải 200 OK
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      console.log(`⚡ [Benchmark] 20 concurrent requests hoàn tất trong ${totalTime}ms (TB: ${Math.round(totalTime / 20)}ms/req)`);
      expect(totalTime).toBeLessThan(3000); // Tổng thời gian dưới 3 giây
    });
  });

  // 4. Kiểm thử chống chập chờn Flakiness (5 Rounds Repetition Test)
  describe('4. Kiểm thử Chống Flakiness (5 Lần Lặp Liên Tiếp)', () => {
    it('FLAKE-01: Lặp lại 5 lần liên tiếp API Báo cáo chi tiết, số liệu đồng nhất 100%', async () => {
      let firstNetRevenue = 0;

      for (let round = 1; round <= 5; round++) {
        const res = await request(app)
          .get('/api/v1/admin/reports/itemized-breakdown?from=2026-09-01&to=2026-10-13')
          .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        const netRev = res.body.data.summary.netRevenue;
        expect(netRev).toBeGreaterThan(0);

        if (round === 1) {
          firstNetRevenue = netRev;
        } else {
          // Các vòng lặp sau kết quả phải tuyệt đối đồng nhất, không có sai số hoặc chập chờn
          expect(netRev).toBe(firstNetRevenue);
        }
      }
    });
  });
});
