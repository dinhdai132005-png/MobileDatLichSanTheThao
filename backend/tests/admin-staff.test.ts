// =====================================================================
// TEST SUITE 5: ADMIN & STAFF OPERATIONS (TC-32 -> TC-38)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { getAdminToken, getStaffToken, createTestCustomer, getFutureDateString, freeSlot } from './helpers';
import { pool } from '../src/config/db';
import { RowDataPacket } from 'mysql2/promise';

describe('5. Nghiệp vụ Quản trị & Vận hành Quầy (TC-32 -> TC-38)', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    staffToken = await getStaffToken();
  });

  it('TC-32: Nhân viên đặt tại quầy cho khách vãng lai, thu tiền ngay -> 201, CONFIRMED, PAID, source=STAFF', async () => {
    const ngayDat = getFutureDateString(3);
    const sanId = 1;
    const khungGioId = 11;
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
    // Sân 1 có đơn tương lai vừa tạo ở các test trước
    const res = await request(app)
      .patch('/api/v1/admin/courts/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'MAINTENANCE' });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('COURT_HAS_FUTURE_BOOKINGS');
  });

  it('TC-35: Admin cập nhật bảng giá ma trận -> Đơn cũ giữ nguyên giá snapshot, đơn mới nhận giá mới', async () => {
    const cust1 = await createTestCustomer('KhachTC35A');
    const cust2 = await createTestCustomer('KhachTC35B');

    // Tìm một ngày thứ 4 tuần tới (WEEKDAY)
    const d = new Date();
    d.setDate(d.getDate() + ((3 + 7 - d.getDay()) % 7 || 7));
    const ngayThuTu = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const sanId = 2; // Loại sân 1
    const khungGioId = 14; // 19:00 - 20:00
    await freeSlot(sanId, ngayThuTu, khungGioId);

    // 1. Lấy giá hiện tại trong DB
    const [pricesBefore] = await pool.execute<RowDataPacket[]>(
      'SELECT price FROM slot_prices WHERE court_type_id = 1 AND day_type = "WEEKDAY" AND time_slot_id = ?',
      [khungGioId]
    );
    const giaGoc = Number(pricesBefore[0].price);

    // 2. cust1 đặt đơn trước khi đổi giá
    const bookRes1 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust1.token}`)
      .send({ sanId, ngayDat: ngayThuTu, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
    expect(bookRes1.status).toBe(201);
    const donIdCu = bookRes1.body.data.id;

    // 3. Admin cập nhật giá mới (tăng thêm 50,000)
    const giaMoi = giaGoc + 50000;
    const updatePriceRes = await request(app)
      .put('/api/v1/admin/slot-prices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        danhSachGia: [
          {
            loaiSanId: 1,
            khungGioId,
            loaiNgay: 'WEEKDAY',
            giaTien: giaMoi,
          },
        ],
      });
    expect(updatePriceRes.status).toBe(200);

    // 4. Nhả slot để cust2 đặt tiếp cùng slot đó
    await freeSlot(sanId, ngayThuTu, khungGioId);
    const bookRes2 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust2.token}`)
      .send({ sanId, ngayDat: ngayThuTu, danhSachKhungGioId: [khungGioId], phuongThucThanhToan: 'CASH' });
    expect(bookRes2.status).toBe(201);
    const donIdMoi = bookRes2.body.data.id;

    // 5. Kiểm chứng tính toàn vẹn: Đơn cũ giữ nguyên snapshot giaGoc, đơn mới theo giaMoi
    const [slotCu] = await pool.execute<RowDataPacket[]>(
      'SELECT price FROM booking_slots WHERE booking_id = ?',
      [donIdCu]
    );
    const [slotMoi] = await pool.execute<RowDataPacket[]>(
      'SELECT price FROM booking_slots WHERE booking_id = ?',
      [donIdMoi]
    );

    expect(Number(slotCu[0].price)).toBe(giaGoc);
    expect(Number(slotMoi[0].price)).toBe(giaMoi);

    // Khôi phục giá gốc
    await pool.execute(
      'UPDATE slot_prices SET price = ? WHERE court_type_id = 1 AND day_type = "WEEKDAY" AND time_slot_id = ?',
      [giaGoc, khungGioId]
    );
  });

  it('TC-36: Admin tự khóa tài khoản chính mình hoặc khóa tài khoản admin cuối -> 409 Conflict (CANNOT_LOCK_SELF)', async () => {
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
        role: 'ADMIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('STAFF');
  });

  it('TC-38: Khách đánh giá đơn chưa hoàn thành (COMPLETED) -> 422 (BOOKING_NOT_COMPLETED)', async () => {
    const cust = await createTestCustomer('KhachTC38');
    const ngayDat = getFutureDateString(3);
    const sanId = 2;
    const khungGioId = 13;
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
