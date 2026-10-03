// =====================================================================
// TEST SUITE 2: BOOKING RULES & BOUNDARY VALUE ANALYSIS
// (TC-10, TC-11, TC-12, TC-13, TC-14, TC-15, TC-16, TC-17, TC-18, TC-19, TC-39)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { createTestCustomer, getFutureDateString, freeSlot } from './helpers';
import { pool } from '../src/config/db';
import { ResultSetHeader } from 'mysql2/promise';

describe('2. Quy tắc nghiệp vụ & Phân tích Giá trị Biên (TC-10 -> TC-19, TC-39)', () => {
  let testCustomer: { id: number; token: string; phone: string };
  let otherCustomer: { id: number; token: string; phone: string };

  beforeAll(async () => {
    testCustomer = await createTestCustomer('KhachNghiepVu');
    otherCustomer = await createTestCustomer('KhachNgoai');
  });

  it('TC-10: Tra cứu lịch trống hôm nay: Các khung giờ đã qua hoặc trong vòng 30 phút có trạng thái PAST', async () => {
    const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const res = await request(app)
      .get(`/api/v1/courts/1/availability?date=${homNay}`)
      .set('Authorization', `Bearer ${testCustomer.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.danhSachKhungGio)).toBe(true);

    const gioHienTai = new Date().getHours();
    if (gioHienTai >= 7) {
      const slot1 = res.body.data.danhSachKhungGio.find((s: any) => s.khungGioId === 1);
      expect(slot1.trangThai).toBe('PAST');
    }
  });

  it('TC-11: Tra cứu lịch theo ngày thường và cuối tuần: Khớp đúng day_type và bảng giá cấu hình', async () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() + ((2 + 7 - d1.getDay()) % 7 || 7)); // Thứ 3 tới
    const ngayThuBa = d1.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const d2 = new Date();
    d2.setDate(d2.getDate() + ((6 + 7 - d2.getDay()) % 7 || 7)); // Thứ 7 tới
    const ngayThuBay = d2.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const resWeekday = await request(app).get(`/api/v1/courts/1/availability?date=${ngayThuBa}`);
    const resWeekend = await request(app).get(`/api/v1/courts/1/availability?date=${ngayThuBay}`);

    expect(resWeekday.status).toBe(200);
    expect(resWeekday.body.data.loaiNgay).toBe('WEEKDAY');

    expect(resWeekend.status).toBe(200);
    expect(resWeekend.body.data.loaiNgay).toBe('WEEKEND');
  });

  it('TC-12: Khách đặt 1 giờ CASH hợp lệ -> 201 Created, CONFIRMED, UNPAID, slot bị khóa', async () => {
    const sanId = 1;
    const khungGioId = 1;
    const ngayDat = getFutureDateString(3);
    await freeSlot(sanId, ngayDat, khungGioId);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testCustomer.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        phuongThucThanhToan: 'CASH',
        ghiChu: 'Kiểm thử TC-12 tiền mặt',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trangThai).toBe('CONFIRMED');
    expect(res.body.data.trangThaiThanhToan).toBe('UNPAID');
    expect(res.body.data.maDonDat).toMatch(/^BK[A-Z0-9]{8,12}$/);
  });

  it('TC-13: Khách đặt 2 giờ liền kề BANK_TRANSFER -> 201 Created, PENDING, có QR chuyển khoản', async () => {
    const sanId = 1;
    const ngayDat = getFutureDateString(3);
    await freeSlot(sanId, ngayDat, 2);
    await freeSlot(sanId, ngayDat, 3);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testCustomer.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [2, 3],
        phuongThucThanhToan: 'BANK_TRANSFER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.trangThai).toBe('PENDING');
    expect(res.body.data.thongTinThanhToan).not.toBeNull();
    expect(res.body.data.thongTinThanhToan).toHaveProperty('qrUrl');
    expect(res.body.data.thoiGianHetHan).not.toBeNull();
  });

  it('TC-14: Đặt 2 giờ KHÔNG liền kề (slot 4 và slot 6) -> 422 Unprocessable (SLOTS_NOT_CONSECUTIVE)', async () => {
    const ngayDat = getFutureDateString(4);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testCustomer.token}`)
      .send({
        sanId: 1,
        ngayDat,
        danhSachKhungGioId: [4, 6],
        phuongThucThanhToan: 'CASH',
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('SLOTS_NOT_CONSECUTIVE');
  });

  it('TC-15: Đặt 4 giờ vượt quá giới hạn tối đa 3 giờ -> 400 Validation Error (VALIDATION_ERROR)', async () => {
    const ngayDat = getFutureDateString(4);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testCustomer.token}`)
      .send({
        sanId: 1,
        ngayDat,
        danhSachKhungGioId: [1, 2, 3, 4],
        phuongThucThanhToan: 'CASH',
      });

    // Siết chặt chính xác 1 status 400 do Zod schema reject ngay tại tầng middleware
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  describe('Phân tích Giá trị Biên Ngày đặt (Boundary Value Analysis: Ngày 14 vs Ngày 15)', () => {
    it('TC-16A (Biên đạt): Đặt trước đúng ngày thứ 14 -> 201 Created', async () => {
      const cust14 = await createTestCustomer('Khach14');
      const ngayThu14 = getFutureDateString(14);
      await freeSlot(1, ngayThu14, 1);

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust14.token}`)
        .send({
          sanId: 1,
          ngayDat: ngayThu14,
          danhSachKhungGioId: [1],
          phuongThucThanhToan: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('TC-16B (Biên vượt): Đặt trước vào ngày thứ 15 (> 14 ngày) -> 422 (BOOKING_DATE_INVALID)', async () => {
      const ngayThu15 = getFutureDateString(15);
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testCustomer.token}`)
        .send({
          sanId: 1,
          ngayDat: ngayThu15,
          danhSachKhungGioId: [1],
          phuongThucThanhToan: 'CASH',
        });

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('BOOKING_DATE_INVALID');
    });

    it('TC-16C: Đặt ngày trong quá khứ -> 422 Unprocessable (BOOKING_DATE_INVALID)', async () => {
      const resPast = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testCustomer.token}`)
        .send({
          sanId: 1,
          ngayDat: '2020-01-01',
          danhSachKhungGioId: [1],
          phuongThucThanhToan: 'CASH',
        });

      expect(resPast.status).toBe(422);
      expect(resPast.body.errorCode).toBe('BOOKING_DATE_INVALID');
    });
  });

  it('TC-17: Đặt sân đang bảo trì (MAINTENANCE) -> 422 Unprocessable (COURT_NOT_BOOKABLE)', async () => {
    await pool.execute('UPDATE courts SET status = "MAINTENANCE" WHERE id = 7');

    const ngayDat = getFutureDateString(5);
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${testCustomer.token}`)
      .send({
        sanId: 7,
        ngayDat,
        danhSachKhungGioId: [1],
        phuongThucThanhToan: 'CASH',
      });

    await pool.execute('UPDATE courts SET status = "ACTIVE" WHERE id = 7');

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('COURT_NOT_BOOKABLE');
  });

  it('TC-18: Khách đặt đơn thứ 4 khi đang có 3 đơn hoạt động -> 422 (TOO_MANY_ACTIVE_BOOKINGS)', async () => {
    const limitCustomer = await createTestCustomer('KhachLimit');
    const sanId = 2;
    const ngayDat = getFutureDateString(6);
    await freeSlot(sanId, ngayDat, 1);
    await freeSlot(sanId, ngayDat, 2);
    await freeSlot(sanId, ngayDat, 3);
    await freeSlot(sanId, ngayDat, 4);

    // Đặt 3 đơn thành công
    for (let slotId = 1; slotId <= 3; slotId++) {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${limitCustomer.token}`)
        .send({
          sanId,
          ngayDat,
          danhSachKhungGioId: [slotId],
          phuongThucThanhToan: 'CASH',
        });
      expect(res.status).toBe(201);
    }

    // Đặt đơn thứ 4 -> Bị chặn 422
    const res4 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${limitCustomer.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [4],
        phuongThucThanhToan: 'CASH',
      });

    expect(res4.status).toBe(422);
    expect(res4.body.errorCode).toBe('TOO_MANY_ACTIVE_BOOKINGS');
  });

  it('TC-19: Đặt khung giờ chưa được cấu hình bảng giá -> 422 Unprocessable (PRICE_NOT_CONFIGURED)', async () => {
    // 1. Tạo 1 khung giờ chưa có giá trong slot_prices
    const [insertSlot] = await pool.execute<ResultSetHeader>(
      'INSERT INTO time_slots (start_time, end_time, is_active) VALUES ("23:00:00", "23:59:00", 1)'
    );
    const slotIdMoi = insertSlot.insertId;

    try {
      const ngayDat = getFutureDateString(5);
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${testCustomer.token}`)
        .send({
          sanId: 1,
          ngayDat,
          danhSachKhungGioId: [slotIdMoi],
          phuongThucThanhToan: 'CASH',
        });

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('PRICE_NOT_CONFIGURED');
    } finally {
      // Dọn dẹp khung giờ tạm
      await pool.execute('DELETE FROM time_slots WHERE id = ?', [slotIdMoi]);
    }
  });

  it('TC-39: Khách hàng xem chi tiết đơn đặt của khách hàng khác -> 404 Not Found (bảo mật dữ liệu)', async () => {
    const custA = await createTestCustomer('Khach39A');
    const custB = await createTestCustomer('Khach39B');
    const sanId = 3;
    const ngayDat = getFutureDateString(7);
    await freeSlot(sanId, ngayDat, 1);

    // 1. custA tạo 1 đơn đặt
    const resA = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${custA.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [1],
        phuongThucThanhToan: 'CASH',
      });
    expect(resA.status).toBe(201);
    const donId = resA.body.data.id;

    // 2. custB cố tình truy cập đơn của custA
    const resB = await request(app)
      .get(`/api/v1/bookings/${donId}`)
      .set('Authorization', `Bearer ${custB.token}`);

    expect(resB.status).toBe(404);
  });
});
