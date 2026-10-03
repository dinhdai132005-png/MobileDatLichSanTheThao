// =====================================================================
// TEST SUITE: ADMIN & STAFF OPERATIONS
// (TC-32, TC-33, TC-34, TC-36, TC-37, TC-38)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { getAdminToken, getStaffToken, createTestCustomer, getFutureDateString } from './helpers';
import { pool } from '../src/config/db';

describe('5. Nghiệp vụ Quản trị & Vận hành Quầy (TC-32 -> TC-38)', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    staffToken = await getStaffToken();
  });

  async function freeSlot(sanId: number, ngayDat: string, khungGioId: number) {
    await pool.execute(
      'UPDATE booking_slots SET is_locked = NULL WHERE court_id = ? AND slot_date = ? AND time_slot_id = ?',
      [sanId, ngayDat, khungGioId]
    );
  }

  it('TC-32: Nhân viên đặt tại quầy cho khách vãng lai, thu tiền ngay -> 201, CONFIRMED, PAID, source=STAFF', async () => {
    const ngayDat = getFutureDateString(3);
    const sanId = 1;
    const khungGioId = 11; // 16:00 - 17:00
    await freeSlot(sanId, ngayDat, khungGioId);

    const res = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        tenKhachHang: 'Anh Hoàng Vãng Lai',
        soDienThoaiKhach: '0988776655',
        phuongThucThanhToan: 'CASH',
        thanhToanNgay: true,
        ghiChu: 'Khách đến quầy thanh toán tiền mặt',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trangThai).toBe('CONFIRMED');
    expect(res.body.data.trangThaiThanhToan).toBe('PAID');
    expect(res.body.data.nguonDon).toBe('STAFF');
  });

  it('TC-33: Đặt tại quầy thiếu cả customerId và guestPhone -> 400 Validation Error', async () => {
    const ngayDat = getFutureDateString(3);
    const res = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        sanId: 1,
        ngayDat,
        danhSachKhungGioId: [12],
        phuongThucThanhToan: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('TC-34: Admin chuyển sân sang bảo trì khi đang có đơn tương lai -> 409 Conflict (COURT_HAS_FUTURE_BOOKINGS)', async () => {
    // Sân 1 hiện tại chắc chắn có các đơn đặt tương lai vừa tạo ở các test trước
    const res = await request(app)
      .patch('/api/v1/admin/courts/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'MAINTENANCE' });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('COURT_HAS_FUTURE_BOOKINGS');
  });

  it('TC-36: Admin tự khóa tài khoản chính mình hoặc khóa tài khoản admin cuối -> 409 Conflict (CANNOT_LOCK_SELF)', async () => {
    // Admin 1 gọi API khóa chính tài khoản ID = 1
    const res = await request(app)
      .patch('/api/v1/admin/staff/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOCKED' });

    expect(res.status).toBe(409);
    expect(['CANNOT_LOCK_SELF', 'LAST_ADMIN']).toContain(res.body.errorCode);
  });

  it('TC-37: Admin tạo nhân viên: role luôn là STAFF dù client gửi role khác', async () => {
    const phone = `090${Math.floor(1000000 + Math.random() * 9000000)}`;
    const res = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hoTen: 'Nhân Viên Kiểm Thử TC-37',
        soDienThoai: phone,
        email: `${phone}@nv.vn`,
        matKhau: '123456',
        role: 'ADMIN', // Cố tình gửi role ADMIN
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('STAFF'); // Hệ thống bắt buộc ép về STAFF
  });

  it('TC-38: Khách đánh giá đơn chưa hoàn thành (COMPLETED) -> 422 (BOOKING_NOT_COMPLETED)', async () => {
    const cust = await createTestCustomer('KhachTC38');
    const ngayDat = getFutureDateString(3);
    const sanId = 2;
    const khungGioId = 13;
    await freeSlot(sanId, ngayDat, khungGioId);

    // Khách tạo 1 đơn đặt CONFIRMED
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

    // Cố tình đánh giá khi đơn chưa COMPLETED
    const reviewRes = await request(app)
      .post(`/api/v1/bookings/${donId}/review`)
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        soSao: 5,
        noiDungDanhGia: 'Sân đẹp, phục vụ tốt!',
      });

    expect(reviewRes.status).toBe(422);
    expect(reviewRes.body.errorCode).toBe('BOOKING_NOT_COMPLETED');
  });
});
