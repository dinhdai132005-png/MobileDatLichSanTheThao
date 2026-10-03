// =====================================================================
// TEST SUITE 3: ADVANCED CONCURRENCY & RACE CONDITION (TC-20)
// Áp dụng Barrier Pattern, Microsecond Synchronization & Direct DB Verification
// Tham chiếu: .agents/skills/concurrency-and-race-testing/SKILL.md
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { createTestCustomer, getFutureDateString, getStaffToken } from './helpers';
import { pool } from '../src/config/db';
import { RowDataPacket } from 'mysql2/promise';

describe('3. Kiểm thử Tranh chấp Đồng thời & Race Condition Chuyên sâu (TC-20)', () => {
  let staffToken: string;

  beforeAll(async () => {
    staffToken = await getStaffToken();
  });

  async function freeSlot(sanId: number, ngayDat: string, khungGioId: number) {
    await pool.execute(
      'UPDATE booking_slots SET is_locked = NULL WHERE court_id = ? AND slot_date = ? AND time_slot_id = ?',
      [sanId, ngayDat, khungGioId]
    );
  }

  // -------------------------------------------------------------------
  // KỊCH BẢN 1: 15 REQUEST TRANH CHẤP CÙNG 1 KHUNG GIỜ (BARRIER PATTERN)
  // -------------------------------------------------------------------
  it('TC-20A (15 Concurrency Requests): 15 khách gửi đồng thời đặt cùng 1 slot -> Đúng 1 thành công (201), 14 từ chối (409 SLOT_TAKEN), DB chỉ 1 dòng khóa', async () => {
    const SO_LUONG_WORKER = 15;
    const sanId = 4;
    const khungGioId = 5;
    const ngayDat = getFutureDateString(8);

    await freeSlot(sanId, ngayDat, khungGioId);

    // Chuẩn bị 15 khách hàng riêng biệt
    const customers = await Promise.all(
      Array.from({ length: SO_LUONG_WORKER }).map((_, idx) =>
        createTestCustomer(`Dua${idx}`)
      )
    );

    // Chuẩn bị Barrier Pattern: Giữ các request tại vạch xuất phát
    let releaseBarrier: () => void;
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    const tasks = customers.map(async (cust, idx) => {
      await barrier; // Chờ tín hiệu đồng bộ microsecond
      return request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({
          sanId,
          ngayDat,
          danhSachKhungGioId: [khungGioId],
          phuongThucThanhToan: idx % 2 === 0 ? 'CASH' : 'BANK_TRANSFER',
          ghiChu: `Concurrency Worker #${idx}`,
        });
    });

    // Phát lệnh bắn đồng loạt 15 request cùng 1 lúc
    releaseBarrier!();
    const responses = await Promise.all(tasks);

    // Kiểm tra kết quả tầng HTTP:
    const count201 = responses.filter((r) => r.status === 201).length;
    const count409 = responses.filter((r) => r.status === 409).length;

    expect(count201).toBe(1);
    expect(count409).toBe(SO_LUONG_WORKER - 1);

    // Mọi đơn bị từ chối đều mang đúng mã lỗi SLOT_TAKEN
    const failedCodes = responses
      .filter((r) => r.status === 409)
      .map((r) => r.body.errorCode);
    expect(failedCodes.every((c) => c === 'SLOT_TAKEN')).toBe(true);

    // Kiểm tra tính toàn vẹn tầng Database:
    const [danhSachKhoa] = await pool.execute<RowDataPacket[]>(
      `SELECT id, booking_id, court_id, slot_date, time_slot_id, is_locked
       FROM booking_slots
       WHERE court_id = ? AND slot_date = ? AND time_slot_id = ? AND is_locked = 1`,
      [sanId, ngayDat, khungGioId]
    );

    expect(danhSachKhoa.length).toBe(1);
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 2: DOUBLE CONFIRM THANH TOÁN (2 NHÂN VIÊN XÁC NHẬN CÙNG LÚC)
  // -------------------------------------------------------------------
  it('TC-20B (Double Confirm Payment): 2 request nhân viên xác nhận thanh toán cùng 1 giây -> Đúng 1 thành công (200), 1 bị từ chối 409 (ALREADY_PAID)', async () => {
    const cust = await createTestCustomer('KhachDoublePay');
    const sanId = 5;
    const khungGioId = 6;
    const ngayDat = getFutureDateString(8);
    await freeSlot(sanId, ngayDat, khungGioId);

    // Khách đặt đơn BANK_TRANSFER (PENDING)
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        phuongThucThanhToan: 'BANK_TRANSFER',
      });
    expect(bookRes.status).toBe(201);
    const donId = bookRes.body.data.id;

    // Hai nhân viên bấm duyệt thanh toán đồng thời
    let trigger: () => void;
    const gate = new Promise<void>((resolve) => { trigger = resolve; });

    const req1 = (async () => {
      await gate;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ phuongThucThanhToan: 'BANK_TRANSFER', ghiChu: 'Staff 1' });
    })();

    const req2 = (async () => {
      await gate;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ phuongThucThanhToan: 'BANK_TRANSFER', ghiChu: 'Staff 2' });
    })();

    trigger!();
    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const failedRes = res1.status === 409 ? res1 : res2;
    expect(failedRes.body.errorCode).toBe('ALREADY_PAID');

    // Database kiểm chứng: Chỉ có đúng 1 giao dịch SUCCESS trong bảng payments
    const [payments] = await pool.execute<RowDataPacket[]>(
      'SELECT id, status FROM payments WHERE booking_id = ? AND type = "PAYMENT"',
      [donId]
    );
    expect(payments.length).toBe(1);
    expect(payments[0].status).toBe('SUCCESS');
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 3: RACE CONDITION KHÁCH HỦY ĐƠN ĐỒNG THỜI NHÂN VIÊN DUYỆT ĐƠN
  // -------------------------------------------------------------------
  it('TC-20C (Cancel vs Payment Race): Khách bấm Hủy đồng thời Nhân viên bấm Duyệt -> 1 hành động thành công, hệ thống không bị xung đột trạng thái', async () => {
    const cust = await createTestCustomer('KhachRaceHuyDuyet');
    const sanId = 5;
    const khungGioId = 7;
    const ngayDat = getFutureDateString(8);
    await freeSlot(sanId, ngayDat, khungGioId);

    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        phuongThucThanhToan: 'CASH',
      });
    expect(bookRes.status).toBe(201);
    const donId = bookRes.body.data.id;

    // Bắn 2 request tranh chấp cùng lúc
    let fire: () => void;
    const ready = new Promise<void>((resolve) => { fire = resolve; });

    const cancelReq = (async () => {
      await ready;
      return request(app)
        .post(`/api/v1/bookings/${donId}/cancel`)
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ lyDoHuy: 'Khách muốn hủy' });
    })();

    const payReq = (async () => {
      await ready;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ phuongThucThanhToan: 'CASH', ghiChu: 'Thu tiền' });
    })();

    fire!();
    const [cancelRes, payRes] = await Promise.all([cancelReq, payReq]);

    // Một bên sẽ thành công 200, bên còn lại sẽ nhận phản hồi hợp lệ (hoặc 200 hoặc 4xx), không có crash 500
    expect([200, 409, 422]).toContain(cancelRes.status);
    expect([200, 409, 422]).toContain(payRes.status);
    expect(cancelRes.status === 200 || payRes.status === 200).toBe(true);

    // Kiểm tra trạng thái DB cuối cùng: Chỉ có thể là CONFIRMED hoặc CANCELLED, tuyệt đối không bị dở dang
    const [finalBooking] = await pool.execute<RowDataPacket[]>(
      'SELECT status, payment_status FROM bookings WHERE id = ?',
      [donId]
    );
    expect(['CONFIRMED', 'CANCELLED']).toContain(finalBooking[0].status);
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 4: KIỂM TRA ĐỘ BỀN VÀ LOẠI BỎ TEST CHẬP CHỜN (FLAKINESS TEST)
  // Lặp lại 5 vòng liên tiếp để đảm bảo 100% ổn định
  // -------------------------------------------------------------------
  it('TC-20D (Anti-Flakiness Loop): Chạy lặp lại tranh chấp 5 vòng liên tiếp -> 100% đạt không bị flaky', async () => {
    for (let round = 1; round <= 5; round++) {
      const cust1 = await createTestCustomer(`FlakyA${round}`);
      const cust2 = await createTestCustomer(`FlakyB${round}`);
      const sanId = 3;
      const khungGioId = 11;
      const ngayDat = getFutureDateString(9);
      await freeSlot(sanId, ngayDat, khungGioId);

      let release: () => void;
      const barrier = new Promise<void>((res) => { release = res; });

      const reqA = (async () => {
        await barrier;
        return request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${cust1.token}`)
          .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
      })();

      const reqB = (async () => {
        await barrier;
        return request(app)
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${cust2.token}`)
          .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
      })();

      release!();
      const [rA, rB] = await Promise.all([reqA, reqB]);

      const statuses = [rA.status, rB.status].sort();
      expect(statuses).toEqual([201, 409]);
    }
  });
});
