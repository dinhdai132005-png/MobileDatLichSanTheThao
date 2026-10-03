// =====================================================================
// TEST SUITE 4: BOOKING LIFECYCLE, BACKGROUND JOBS & WEBHOOKS
// (TC-21, TC-22, TC-23, TC-24, TC-25, TC-26, TC-27, TC-28, TC-29, TC-30, TC-31)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { createTestCustomer, getStaffToken, getFutureDateString, freeSlot } from './helpers';
import { pool } from '../src/config/db';
import { processExpiredBookings } from '../src/jobs/expire-bookings.job';
import { RowDataPacket } from 'mysql2/promise';

describe('4. Vòng đời Đơn đặt, Tự động hóa & Webhooks (TC-21 -> TC-31)', () => {
  let staffToken: string;

  beforeAll(async () => {
    staffToken = await getStaffToken();
  });

  // -------------------------------------------------------------------
  // TC-21: BACKGROUND JOB SYS-01 TỰ ĐỘNG HẾT HẠN ĐƠN PENDING (CRON WORKER)
  // -------------------------------------------------------------------
  it('TC-21: Background job quét đơn PENDING quá hạn -> Tự động chuyển EXPIRED, nhả slot, ghi nhật ký', async () => {
    const cust = await createTestCustomer('KhachTC21');
    const sanId = 1;
    const khungGioId = 6;
    const ngayDat = getFutureDateString(3);
    await freeSlot(sanId, ngayDat, khungGioId);

    // 1. Tạo đơn PENDING
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

    // Giả lập thời gian đã trôi qua 30 phút (expires_at trong quá khứ)
    await pool.execute(
      'UPDATE bookings SET expires_at = "2020-01-01 00:00:00" WHERE id = ?',
      [donId]
    );

    // 2. Kích hoạt trực tiếp Worker xử lý hết hạn
    const soLuongXuLy = await processExpiredBookings();
    expect(soLuongXuLy).toBeGreaterThanOrEqual(1);

    // 3. Kiểm chứng Database sau khi Job chạy
    const [donDat] = await pool.execute<RowDataPacket[]>(
      'SELECT status, cancelled_at FROM bookings WHERE id = ?',
      [donId]
    );
    expect(donDat[0].status).toBe('EXPIRED');
    expect(donDat[0].cancelled_at).not.toBeNull();

    // Slot phải được nhả
    const [slots] = await pool.execute<RowDataPacket[]>(
      'SELECT is_locked FROM booking_slots WHERE booking_id = ?',
      [donId]
    );
    expect(slots[0].is_locked).toBeNull();

    // Nhật ký ghi nhận changed_by = NULL (do hệ thống thực hiện)
    const [logs] = await pool.execute<RowDataPacket[]>(
      'SELECT from_status, to_status, changed_by FROM booking_status_logs WHERE booking_id = ? ORDER BY id DESC LIMIT 1',
      [donId]
    );
    expect(logs[0].to_status).toBe('EXPIRED');
    expect(logs[0].changed_by).toBeNull();
  });

  it('TC-22: Nhân viên ghi nhận thanh toán cho đơn PENDING còn hạn -> CONFIRMED, PAID, expires_at=NULL', async () => {
    const cust = await createTestCustomer('KhachTC22');
    const sanId = 1;
    const khungGioId = 7;
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

    const payRes = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        phuongThucThanhToan: 'BANK_TRANSFER',
        maGiaoDichThamChieu: 'VNPAY_REF_22',
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.data.trangThai).toBe('CONFIRMED');
    expect(payRes.body.data.trangThaiThanhToan).toBe('PAID');

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
    const donId = bookRes.body.data.id;

    await pool.execute('UPDATE bookings SET status = "EXPIRED" WHERE id = ?', [donId]);

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
    const donId = bookRes.body.data.id;

    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ lyDoHuy: 'Tôi bận việc đột xuất' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.trangThai).toBe('CANCELLED');
    expect(cancelRes.body.data.choHoanTien).toBe(false);

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
    const donId = bookRes.body.data.id;

    await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ lyDoHuy: 'Đổi kế hoạch dã ngoại' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.trangThai).toBe('CANCELLED');
    expect(cancelRes.body.data.choHoanTien).toBe(true);

    const [refunds] = await pool.execute<RowDataPacket[]>(
      'SELECT type, status, amount FROM payments WHERE booking_id = ? AND type = "REFUND"',
      [donId]
    );
    expect(refunds.length).toBe(1);
    expect(refunds[0].status).toBe('PENDING');
  });

  // -------------------------------------------------------------------
  // TC-26: PHÂN TÍCH GIÁ TRỊ BIÊN THỜI GIAN HỦY ĐƠN (5h59 vs 6h01)
  // -------------------------------------------------------------------
  describe('TC-26: Phân tích Biên Giới hạn Hủy Đơn (5h59 vs 6h01)', () => {
    it('TC-26A (Biên từ chối): Cách giờ bắt đầu 5 giờ 59 phút (< 6h) -> 422 (CANCEL_DEADLINE_PASSED)', async () => {
      const cust = await createTestCustomer('KhachTC26A');
      const sanId = 2;
      const khungGioId = 7;
      const ngayDat = getFutureDateString(4);
      await freeSlot(sanId, ngayDat, khungGioId);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
      const donId = bookRes.body.data.id;

      // Giả lập giờ bắt đầu cách hiện tại đúng 5 giờ 59 phút
      const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      await pool.execute(
        'UPDATE bookings SET booking_date = ?, start_time = "04:00:00", end_time = "05:00:00" WHERE id = ?',
        [homNay, donId]
      );

      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${donId}/cancel`)
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ lyDoHuy: 'Hủy sát giờ' });

      expect(cancelRes.status).toBe(422);
      expect(cancelRes.body.errorCode).toBe('CANCEL_DEADLINE_PASSED');
    });

    it('TC-26B (Biên chấp nhận): Cách giờ bắt đầu 6 giờ 01 phút (> 6h) -> 200 OK (CANCELLED)', async () => {
      const cust = await createTestCustomer('KhachTC26B');
      const sanId = 2;
      const khungGioId = 8;
      const ngayDat = getFutureDateString(4);
      await freeSlot(sanId, ngayDat, khungGioId);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
      const donId = bookRes.body.data.id;

      // Giả lập giờ bắt đầu cách hiện tại > 6 giờ (ví dụ 10 giờ nữa: 14:00 hôm nay)
      const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      await pool.execute(
        'UPDATE bookings SET booking_date = ?, start_time = "14:00:00", end_time = "15:00:00" WHERE id = ?',
        [homNay, donId]
      );

      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${donId}/cancel`)
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ lyDoHuy: 'Hủy trước 6 tiếng hợp lệ' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.trangThai).toBe('CANCELLED');
    });
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
      .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
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
      .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
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
      .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
    const donId = bookRes.body.data.id;

    await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('TOO_EARLY');
  });

  // -------------------------------------------------------------------
  // TC-30: ĐÁNH DẤU NO-SHOW ĐƠN ĐÃ THANH TOÁN (KHÔNG HOÀN TIỀN)
  // -------------------------------------------------------------------
  it('TC-30: Đánh dấu No-Show cho đơn đã thanh toán -> NO_SHOW, tuyệt đối không sinh refund', async () => {
    const cust = await createTestCustomer('KhachNoShow');
    const sanId = 3;
    const khungGioId = 12;
    const ngayDat = getFutureDateString(5);
    await freeSlot(sanId, ngayDat, khungGioId);

    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
    const donId = bookRes.body.data.id;

    // Thanh toán trước
    await request(app)
      .post(`/api/v1/staff/bookings/${donId}/payments`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ phuongThucThanhToan: 'CASH' });

    // Giả lập giờ bắt đầu đã trôi qua
    const homNay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    await pool.execute(
      'UPDATE bookings SET booking_date = ?, start_time = "01:00:00", end_time = "02:00:00" WHERE id = ?',
      [homNay, donId]
    );

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/no-show`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.trangThai).toBe('NO_SHOW');

    // Kiểm tra không sinh bất kỳ bản ghi REFUND nào
    const [refunds] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM payments WHERE booking_id = ? AND type = "REFUND"',
      [donId]
    );
    expect(refunds.length).toBe(0);
  });

  it('TC-31: Nhân viên xác nhận hoàn tiền thành công; xác nhận lần 2 -> 409 Conflict (ALREADY_PAID)', async () => {
    const [pendingRefunds] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM payments WHERE type = "REFUND" AND status = "PENDING" LIMIT 1'
    );
    expect(pendingRefunds.length).toBeGreaterThan(0);
    const refundId = pendingRefunds[0].id;

    // Lần 1: Thành công
    const res1 = await request(app)
      .post(`/api/v1/staff/payments/${refundId}/confirm-refund`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Lần 2: 409
    const res2 = await request(app)
      .post(`/api/v1/staff/payments/${refundId}/confirm-refund`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res2.status).toBe(409);
    expect(res2.body.errorCode).toBe('ALREADY_PAID');
  });

  // -------------------------------------------------------------------
  // TỰ ĐỘNG HÓA CỔNG THANH TOÁN: VIETQR IPN WEBHOOK
  // -------------------------------------------------------------------
  describe('Cổng Thanh Toán Tự Động: VietQR IPN Webhook', () => {
    it('Webhook-01: Gửi IPN hợp lệ -> Tự động chuyển PENDING sang CONFIRMED và PAID', async () => {
      const cust = await createTestCustomer('KhachWebhook');
      const sanId = 1;
      const khungGioId = 9;
      const ngayDat = getFutureDateString(6);
      await freeSlot(sanId, ngayDat, khungGioId);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'BANK_TRANSFER' });
      const bookingCode = bookRes.body.data.maDonDat;
      const amount = bookRes.body.data.tongTien;

      const webhookRes = await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .send({
          bookingCode,
          amount,
          transactionRef: `TXN_${Date.now()}`,
          secureSignature: 'VIETQR_SECRET_KEY_123',
        });

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.success).toBe(true);
      expect(webhookRes.body.data.alreadyProcessed).toBe(false);

      // DB kiểm chứng: PAID và expires_at = NULL
      const [b] = await pool.execute<RowDataPacket[]>(
        'SELECT status, payment_status, expires_at FROM bookings WHERE booking_code = ?',
        [bookingCode]
      );
      expect(b[0].status).toBe('CONFIRMED');
      expect(b[0].payment_status).toBe('PAID');
      expect(b[0].expires_at).toBeNull();
    });

    it('Webhook-02: Gửi IPN sai chữ ký bảo mật -> 401 (INVALID_SIGNATURE)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .send({
          bookingCode: 'BKNONEXIST',
          amount: 100000,
          transactionRef: 'TXN_FAKE',
          secureSignature: 'WRONG_SECRET_SIGNATURE',
        });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_SIGNATURE');
    });

    it('Webhook-03: Gửi lặp lại IPN cùng transactionRef (Idempotency) -> 200, alreadyProcessed=true', async () => {
      const cust = await createTestCustomer('KhachIdempotent');
      const sanId = 1;
      const khungGioId = 10;
      const ngayDat = getFutureDateString(6);
      await freeSlot(sanId, ngayDat, khungGioId);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'BANK_TRANSFER' });
      const bookingCode = bookRes.body.data.maDonDat;
      const amount = bookRes.body.data.tongTien;
      const txnRef = `TXN_IDEM_${Date.now()}`;

      // Bắn lần 1
      await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .send({ bookingCode, amount, transactionRef: txnRef, secureSignature: 'VIETQR_SECRET_KEY_123' });

      // Bắn lần 2 cùng payload
      const res2 = await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .send({ bookingCode, amount, transactionRef: txnRef, secureSignature: 'VIETQR_SECRET_KEY_123' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.alreadyProcessed).toBe(true);
    });

    it('Webhook-04: Gửi IPN sai số tiền thanh toán -> 422 (AMOUNT_MISMATCH)', async () => {
      const cust = await createTestCustomer('KhachWrongAmount');
      const sanId = 1;
      const khungGioId = 11;
      const ngayDat = getFutureDateString(6);
      await freeSlot(sanId, ngayDat, khungGioId);

      const bookRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ sanId, ngayDat, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'BANK_TRANSFER' });
      const bookingCode = bookRes.body.data.maDonDat;

      const res = await request(app)
        .post('/api/v1/payments/vietqr-webhook')
        .send({
          bookingCode,
          amount: 1000, // Chuyển thiếu tiền
          transactionRef: `TXN_WRONG_${Date.now()}`,
          secureSignature: 'VIETQR_SECRET_KEY_123',
        });

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('AMOUNT_MISMATCH');
    });
  });
});
