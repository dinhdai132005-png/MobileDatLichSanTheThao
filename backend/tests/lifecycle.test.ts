// =====================================================================
// TEST SUITE: BOOKING LIFECYCLE & STATE TRANSITIONS
// (TC-22, TC-23, TC-24, TC-25, TC-26, TC-27, TC-28, TC-29, TC-31)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { createTestCustomer, getStaffToken, getFutureDateString } from './helpers';
import { pool } from '../src/config/db';
import { RowDataPacket } from 'mysql2/promise';

describe('4. Kiểm thử Vòng đời Đơn đặt & Chuyển đổi trạng thái (TC-22 -> TC-31)', () => {
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

  it('TC-22: Nhân viên ghi nhận thanh toán cho đơn PENDING còn hạn -> CONFIRMED, PAID, expires_at=NULL', async () => {
    const cust = await createTestCustomer('KhachTC22');
    const sanId = 1;
    const khungGioId = 7;
    const ngayDat = getFutureDateString(3);
    await freeSlot(sanId, ngayDat, khungGioId);

    // 1. Khách đặt đơn BANK_TRANSFER (PENDING)
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
    expect(bookRes.body.data.trangThai).toBe('PENDING');

    // 2. Nhân viên ghi nhận thanh toán
    const payRes = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        phuongThucThanhToan: 'BANK_TRANSFER',
        maGiaoDichThamChieu: 'VNPAY_TEST_REF_123',
        ghiChu: 'Khách đã quét VietQR thành công',
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.trangThai).toBe('CONFIRMED');
    expect(payRes.body.data.trangThaiThanhToan).toBe('PAID');

    // Kiểm tra DB: expires_at phải bằng NULL
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT expires_at, status, payment_status FROM bookings WHERE id = ?',
      [donId]
    );
    expect(rows[0].expires_at).toBeNull();
    expect(rows[0].status).toBe('CONFIRMED');
    expect(rows[0].payment_status).toBe('PAID');
  });

  it('TC-23: Ghi nhận thanh toán đơn đã EXPIRED -> 422 Unprocessable (BOOKING_EXPIRED)', async () => {
    const cust = await createTestCustomer('KhachTC23');
    const sanId = 1;
    const khungGioId = 8;
    const ngayDat = getFutureDateString(3);
    await freeSlot(sanId, ngayDat, khungGioId);

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

    // Giả lập hệ thống cron đã chuyển sang EXPIRED
    await pool.execute('UPDATE bookings SET status = "EXPIRED" WHERE id = ?', [donId]);

    // Nhân viên cố tình thu tiền đơn đã hết hạn
    const payRes = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    expect(payRes.status).toBe(422);
    expect(payRes.body.errorCode).toBe('BOOKING_EXPIRED');
  });

  it('TC-24: Khách hủy đơn CONFIRMED còn > 6 giờ, chưa trả tiền -> CANCELLED, nhả slot, không hoàn tiền', async () => {
    const cust = await createTestCustomer('KhachTC24');
    const sanId = 2;
    const khungGioId = 5;
    const ngayDat = getFutureDateString(4);
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

    // Khách tự hủy
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ lyDoHuy: 'Tôi bận việc đột xuất' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.trangThai).toBe('CANCELLED');
    expect(cancelRes.body.data.choHoanTien).toBe(false);

    // Slot phải được nhả (is_locked = NULL)
    const [slots] = await pool.execute<RowDataPacket[]>(
      'SELECT is_locked FROM booking_slots WHERE booking_id = ?',
      [donId]
    );
    expect(slots[0].is_locked).toBeNull();
  });

  it('TC-25: Khách hủy đơn đã PAID còn > 6 giờ -> CANCELLED, có giao dịch hoàn tiền REFUND PENDING', async () => {
    const cust = await createTestCustomer('KhachTC25');
    const sanId = 2;
    const khungGioId = 6;
    const ngayDat = getFutureDateString(4);
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

    // Nhân viên xác nhận thanh toán trước
    await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    // Khách hủy đơn đã thanh toán
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ lyDoHuy: 'Đổi kế hoạch dã ngoại' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.trangThai).toBe('CANCELLED');
    expect(cancelRes.body.data.choHoanTien).toBe(true);

    // Kiểm tra có dòng payments loại REFUND trạng thái PENDING
    const [refunds] = await pool.execute<RowDataPacket[]>(
      'SELECT type, status, amount FROM payments WHERE booking_id = ? AND type = "REFUND"',
      [donId]
    );
    expect(refunds.length).toBe(1);
    expect(refunds[0].status).toBe('PENDING');
  });

  it('TC-26: Khách hủy đơn khi thời gian còn lại < 6 giờ -> 422 Unprocessable (CANCEL_DEADLINE_PASSED)', async () => {
    const cust = await createTestCustomer('KhachTC26');
    const sanId = 2;
    const khungGioId = 7;
    const ngayDat = getFutureDateString(4);
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

    // Giả lập đơn này bắt đầu trong vòng 2 tiếng tới (ngày hôm nay 04:00 -> 05:00, hiện tại đang là 02:xx sáng)
    const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    await pool.execute(
      'UPDATE bookings SET booking_date = ?, start_time = "04:00:00", end_time = "05:00:00" WHERE id = ?',
      [homNay, donId]
    );

    // Cố tình hủy khi cách giờ chơi < 6 tiếng
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ lyDoHuy: 'Hủy sát giờ' });

    expect(cancelRes.status).toBe(422);
    expect(cancelRes.body.errorCode).toBe('CANCEL_DEADLINE_PASSED');
  });

  it('TC-27: Nhân viên hủy đơn nhưng không cung cấp lý do (reason) -> 400 Validation Error', async () => {
    const cust = await createTestCustomer('KhachTC27');
    const sanId = 3;
    const khungGioId = 8;
    const ngayDat = getFutureDateString(5);
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

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({}); // Thiếu lyDoHuy / reason

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('TC-28: Hoàn thành đơn chưa thanh toán (UNPAID) -> 422 Unprocessable (NOT_PAID)', async () => {
    const cust = await createTestCustomer('KhachTC28');
    const sanId = 3;
    const khungGioId = 9;
    const ngayDat = getFutureDateString(5);
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

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('NOT_PAID');
  });

  it('TC-29: Hoàn thành đơn trước giờ bắt đầu -> 422 Unprocessable (TOO_EARLY)', async () => {
    const cust = await createTestCustomer('KhachTC29');
    const sanId = 3;
    const khungGioId = 10;
    const ngayDat = getFutureDateString(5);
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

    // Thanh toán trước
    await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    // Cố tình hoàn thành khi ngày chơi còn ở tương lai (cách 5 ngày)
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('TOO_EARLY');
  });

  it('TC-31: Nhân viên xác nhận hoàn tiền thành công; xác nhận lần 2 -> 409 Conflict (ALREADY_PAID)', async () => {
    // Tìm một bản ghi hoàn tiền PENDING trong DB
    const [pendingRefunds] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM payments WHERE type = "REFUND" AND status = "PENDING" LIMIT 1'
    );
    expect(pendingRefunds.length).toBeGreaterThan(0);
    const refundId = pendingRefunds[0].id;

    // Lần 1: Xác nhận hoàn tiền thành công -> 200
    const res1 = await request(app)
      .post(`/api/v1/staff/payments/${refundId}/confirm-refund`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Lần 2: Thao tác trùng lặp -> 409 ALREADY_PAID
    const res2 = await request(app)
      .post(`/api/v1/staff/payments/${refundId}/confirm-refund`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res2.status).toBe(409);
    expect(res2.body.errorCode).toBe('ALREADY_PAID');
  });
});
