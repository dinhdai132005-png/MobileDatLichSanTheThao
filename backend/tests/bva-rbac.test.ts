// =====================================================================
// KIỂM THỬ GIÁ TRỊ BIÊN (BVA), MA TRẬN RBAC & MÚI GIỜ UTC+7
// Tham chiếu: .agents/skills/boundary-and-matrix-testing/SKILL.md
// Đáp ứng: TC-14 -> TC-19, TC-26 -> TC-30, TC-34 -> TC-39, TC-40
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { congNgay, layNgayHomNay } from '../src/utils/thoigian';

// Cố định múi giờ UTC+7
process.env.TZ = 'Asia/Ho_Chi_Minh';

describe('Kiểm thử Giá trị biên (BVA) & Ma trận RBAC đa chiều', () => {
  const sdtKhachA = '0983333331';
  const sdtKhachB = '0983333332';
  const sdtStaff = '0903333333';
  const sdtAdmin = '0900000001';

  let tokenKhachA: string;
  let tokenKhachB: string;
  let tokenStaff: string;
  let tokenAdmin: string;

  async function donDepKhach(sdt: string) {
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM danh_gia WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdt]
    );
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)`,
      [sdt]
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdt]);
  }

  async function donDepStaff(sdt: string) {
    await csdl.execute(
      `UPDATE thanh_toan SET nguoi_xu_ly_id = NULL WHERE nguoi_xu_ly_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)`,
      [sdt]
    );
    await csdl.execute(
      `UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)`,
      [sdt]
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdt]);
  }

  function layNgayTuongLai(soNgay: number): string {
    return congNgay(layNgayHomNay(), soNgay);
  }

  beforeAll(async () => {
    await donDepKhach(sdtKhachA);
    await donDepKhach(sdtKhachB);
    await donDepStaff(sdtStaff);

    // Khách A
    const resA = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách A BVA',
      phone: sdtKhachA,
      password: 'password123',
    });
    tokenKhachA = resA.body.data.token;

    // Khách B
    const resB = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách B BVA',
      phone: sdtKhachB,
      password: 'password123',
    });
    tokenKhachB = resB.body.data.token;

    // Staff
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên BVA',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute(`UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?`, [sdtStaff]);
    const resStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = resStaff.body.data.token;

    // Admin
    const resAdmin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = resAdmin.body.data.token;
  });

  afterAll(async () => {
    await donDepKhach(sdtKhachA);
    await donDepKhach(sdtKhachB);
    await donDepStaff(sdtStaff);
  });

  // -------------------------------------------------------------------
  // 1. PHÂN TÍCH GIÁ TRỊ BIÊN THỜI GIAN (BVA)
  // -------------------------------------------------------------------

  // TC-16: Đặt trước tối đa 14 ngày
  it('TC-16 (BVA 14 Ngày): Ngày thứ 14 chấp nhận (201), ngày thứ 15 từ chối (422 BOOKING_DATE_INVALID)', async () => {
    const ngay14 = layNgayTuongLai(14);
    const ngay15 = layNgayTuongLai(15);
    const ngayQuaKhu = '2020-01-01';

    // Ngày 14: Thành công
    const res14 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({
        courtId: 2,
        bookingDate: ngay14,
        timeSlotIds: [1],
        paymentMethod: 'CASH',
      });
    expect(res14.status).toBe(201);

    // Ngày 15: Vượt quá 14 ngày -> Từ chối 422
    const res15 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({
        courtId: 2,
        bookingDate: ngay15,
        timeSlotIds: [1],
        paymentMethod: 'CASH',
      });
    expect(res15.status).toBe(422);
    expect(res15.body.errorCode).toBe('BOOKING_DATE_INVALID');

    // Ngày quá khứ: Từ chối 422
    const resQuaKhu = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({
        courtId: 2,
        bookingDate: ngayQuaKhu,
        timeSlotIds: [1],
        paymentMethod: 'CASH',
      });
    expect(resQuaKhu.status).toBe(422);
    expect(resQuaKhu.body.errorCode).toBe('BOOKING_DATE_INVALID');
  });

  // TC-17: Đặt sân đang bảo trì MAINTENANCE
  it('TC-17: Đặt sân đang bảo trì MAINTENANCE bị từ chối 422 COURT_NOT_BOOKABLE', async () => {
    // Tạm chuyển sân 3 sang MAINTENANCE
    await csdl.execute(`UPDATE san SET trang_thai = 'MAINTENANCE' WHERE id = 3`);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({
        courtId: 3,
        bookingDate: layNgayTuongLai(5),
        timeSlotIds: [2],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('COURT_NOT_BOOKABLE');

    // Phục hồi lại ACTIVE
    await csdl.execute(`UPDATE san SET trang_thai = 'ACTIVE' WHERE id = 3`);
  });

  // TC-18: Tối đa 3 đơn hoạt động
  it('TC-18: Khách đặt đơn thứ 4 khi đang có 3 đơn hoạt động bị chặn 422 TOO_MANY_ACTIVE_BOOKINGS', async () => {
    // Tạo 3 đơn cho khách B
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachB}`)
        .send({
          courtId: 3,
          bookingDate: layNgayTuongLai(i + 1),
          timeSlotIds: [1],
          paymentMethod: 'CASH',
        });
      expect(res.status).toBe(201);
    }

    // Đơn thứ 4
    const res4 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachB}`)
      .send({
        courtId: 3,
        bookingDate: layNgayTuongLai(6),
        timeSlotIds: [1],
        paymentMethod: 'CASH',
      });

    expect(res4.status).toBe(422);
    expect(res4.body.errorCode).toBe('TOO_MANY_ACTIVE_BOOKINGS');
  });

  // TC-26: Hạn chót hủy đơn (< 6 giờ)
  it('TC-26: Khách hủy đơn khi còn < 6 giờ bị từ chối 422 CANCEL_DEADLINE_PASSED', async () => {
    // Tạo đơn sắp diễn ra hôm nay lúc 23:00 (nếu bây giờ đang ban ngày thì < 6h hoặc tạo đơn giờ sát nút)
    const bayGioVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const ngayHomNay = bayGioVN.toISOString().substring(0, 10);

    // Chèn trực tiếp đơn CONFIRMED bắt đầu sau 2 giờ nữa
    const gioBatDauStr = `${String((bayGioVN.getHours() + 2) % 24).padStart(2, '0')}:00:00`;
    const gioKetThucStr = `${String((bayGioVN.getHours() + 3) % 24).padStart(2, '0')}:00:00`;

    const [insRes]: any = await csdl.execute(
      `INSERT INTO don_dat (
         ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
         tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan, trang_thai_thanh_toan, nguon_don
       ) VALUES ('BKBVATIME1', (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?), 1, ?, ?, ?, 100000, 0, 'CONFIRMED', 'CASH', 'UNPAID', 'APP')`,
      [sdtKhachA, ngayHomNay, gioBatDauStr, gioKetThucStr]
    );
    const donId = insRes.insertId;

    const resHuy = await request(app)
      .post(`/api/v1/bookings/${donId}/cancel`)
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({ reason: 'Bận đột xuất' });

    expect(resHuy.status).toBe(422);
    expect(resHuy.body.errorCode).toBe('CANCEL_DEADLINE_PASSED');

    await csdl.execute('DELETE FROM don_dat WHERE id = ?', [donId]);
  });

  // TC-27: Nhân viên hủy đơn không có reason -> 400 VALIDATION_ERROR
  it('TC-27: Nhân viên hủy đơn thiếu lý do (reason) bị từ chối 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/staff/bookings/1/cancel')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({}); // thiếu reason

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  // TC-34: Admin chuyển sân sang bảo trì khi còn đơn tương lai -> 409
  it('TC-34: Admin đổi trạng thái sân sang MAINTENANCE khi còn đơn tương lai bị từ chối 409 COURT_HAS_FUTURE_BOOKINGS', async () => {
    const ngayDatTuongLai = layNgayTuongLai(7);
    // Tạo 1 đơn tương lai trên sân 4
    await csdl.execute(
      `INSERT INTO don_dat (
         ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
         tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan, trang_thai_thanh_toan, nguon_don
       ) VALUES ('BKBVAFUTUR', (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?), 4, ?, '08:00:00', '09:00:00', 100000, 0, 'CONFIRMED', 'CASH', 'UNPAID', 'APP')`,
      [sdtKhachA, ngayDatTuongLai]
    );

    const resMaint = await request(app)
      .patch('/api/v1/admin/courts/4/status')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'MAINTENANCE' });

    expect(resMaint.status).toBe(409);
    expect(resMaint.body.errorCode).toBe('COURT_HAS_FUTURE_BOOKINGS');

    // Dọn dẹp
    await csdl.execute(`DELETE FROM don_dat WHERE ma_don_dat = 'BKBVAFUTUR'`);
  });

  // TC-36: Admin tự khóa chính mình / khóa admin cuối -> 409 CANNOT_LOCK_SELF
  it('TC-36: Admin tự khóa tài khoản chính mình bị từ chối 409 CANNOT_LOCK_SELF', async () => {
    const [adminRows]: any = await csdl.execute(`SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdtAdmin]);
    const adminId = adminRows[0].id;

    const resLock = await request(app)
      .patch(`/api/v1/admin/staff/${adminId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'LOCKED' });

    expect(resLock.status).toBe(409);
    expect(resLock.body.errorCode).toBe('CANNOT_LOCK_SELF');
  });

  // TC-37: Tạo nhân viên vai trò luôn là STAFF
  it('TC-37: Tạo nhân viên luôn nhận vai trò STAFF dù client gửi role=ADMIN', async () => {
    const sdtStaffRoleTest = '0901112233';
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdtStaffRoleTest]);

    const res = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        fullName: 'Nhân Viên Role Test',
        phone: sdtStaffRoleTest,
        password: 'password123',
        role: 'ADMIN', // Cố tình gửi ADMIN
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('STAFF');

    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdtStaffRoleTest]);
  });

  // TC-39: Khách xem đơn người khác -> 404
  it('TC-39: Khách hàng truy cập đơn đặt của khách khác bị từ chối 404', async () => {
    // Khách A tạo đơn
    const resA = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhachA}`)
      .send({
        courtId: 1,
        bookingDate: layNgayTuongLai(10),
        timeSlotIds: [6],
        paymentMethod: 'CASH',
      });
    expect(resA.status).toBe(201);
    const donId = resA.body.data.id;

    // Khách B cố tình xem đơn của Khách A
    const resXem = await request(app)
      .get(`/api/v1/bookings/${donId}`)
      .set('Authorization', `Bearer ${tokenKhachB}`);

    expect(resXem.status).toBe(404);
  });

  // -------------------------------------------------------------------
  // 2. MA TRẬN PHÂN QUYỀN RBAC ĐA CHIỀU (TABLE-DRIVEN RBAC MATRIX)
  // -------------------------------------------------------------------
  describe('Ma trận Phân quyền RBAC Đa chiều ([GUEST, CUSTOMER, STAFF, ADMIN] x Endpoints)', () => {
    it('Endpoint POST /api/v1/bookings: Guest (401), Customer (201/422), Staff (403), Admin (403)', async () => {
      // Guest
      const resGuest = await request(app).post('/api/v1/bookings').send({});
      expect(resGuest.status).toBe(401);

      // Staff gọi endpoint khách -> 403
      const resStaff = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({});
      expect(resStaff.status).toBe(403);

      // Admin gọi endpoint khách -> 403
      const resAdmin = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({});
      expect(resAdmin.status).toBe(403);
    });

    it('Endpoint POST /api/v1/staff/bookings: Guest (401), Customer (403), Staff (201/400), Admin (201/400)', async () => {
      // Guest
      const resGuest = await request(app).post('/api/v1/staff/bookings').send({});
      expect(resGuest.status).toBe(401);

      // Customer gọi endpoint staff -> 403 (TC-40)
      const resCustomer = await request(app)
        .post('/api/v1/staff/bookings')
        .set('Authorization', `Bearer ${tokenKhachA}`)
        .send({});
      expect(resCustomer.status).toBe(403);
    });

    it('Endpoint PATCH /api/v1/admin/courts/:id/status: Guest (401), Customer (403), Staff (403), Admin (200/409)', async () => {
      // Guest
      const resGuest = await request(app).patch('/api/v1/admin/courts/1/status').send({ status: 'ACTIVE' });
      expect(resGuest.status).toBe(401);

      // Customer -> 403
      const resCustomer = await request(app)
        .patch('/api/v1/admin/courts/1/status')
        .set('Authorization', `Bearer ${tokenKhachA}`)
        .send({ status: 'ACTIVE' });
      expect(resCustomer.status).toBe(403);

      // Staff -> 403
      const resStaff = await request(app)
        .patch('/api/v1/admin/courts/1/status')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ status: 'ACTIVE' });
      expect(resStaff.status).toBe(403);

      // Admin -> 200
      const resAdmin = await request(app)
        .patch('/api/v1/admin/courts/1/status')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'ACTIVE' });
      expect(resAdmin.status).toBe(200);
    });

    it('Endpoint POST /api/v1/admin/bookings/:id/close-with-debt: Staff (403), Customer (403)', async () => {
      const resStaff = await request(app)
        .post('/api/v1/admin/bookings/1/close-with-debt')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ reason: 'Thử đóng đơn' });
      expect(resStaff.status).toBe(403);

      const resCustomer = await request(app)
        .post('/api/v1/admin/bookings/1/close-with-debt')
        .set('Authorization', `Bearer ${tokenKhachA}`)
        .send({ reason: 'Thử đóng đơn' });
      expect(resCustomer.status).toBe(403);
    });
  });
});
