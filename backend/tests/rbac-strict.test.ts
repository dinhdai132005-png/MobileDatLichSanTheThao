/// <reference types="jest" />
// =====================================================================
// KIỂM THỬ BẢO VỆ PHÂN QUYỀN RBAC NGHIÊM NGẶT (MASTER PROMPT PHẦN V & LV)
// Ngăn chặn leo thang đặc quyền: CUSTOMER, STAFF, ADMIN
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';

process.env.TZ = 'Asia/Ho_Chi_Minh';

describe('RBAC Nghiêm ngặt — Kiểm soát ranh giới phân quyền Actor', () => {
  const sdtKhach = '0984444441';
  const sdtStaff = '0904444442';
  const sdtAdmin = '0900000001'; // Seeding sẵn

  let tokenKhach: string;
  let tokenStaff: string;
  let tokenAdmin: string;
  let adminUserId: number;

  async function donDep() {
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
        SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (
          SELECT id FROM don_dat WHERE nguoi_dung_id IN (
            SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
          )
        )
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (
        SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `UPDATE thanh_toan SET nguoi_xu_ly_id = NULL WHERE nguoi_xu_ly_id IN (
        SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `UPDATE bien_dong_kho SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (
        SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
      )`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)`, [sdtKhach, sdtStaff]);
  }

  beforeAll(async () => {
    await donDep();

    // 1. Tạo Customer
    const resKhach = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng RBAC Test',
      phone: sdtKhach,
      password: 'password123',
    });
    tokenKhach = resKhach.body.data.token;

    // 2. Tạo Staff
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên RBAC Test',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute(`UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?`, [sdtStaff]);
    const resStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = resStaff.body.data.token;

    // 3. Đăng nhập Admin
    const resAdmin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = resAdmin.body.data.token;
    adminUserId = resAdmin.body.data.user.id;
  });

  afterAll(async () => {
    await donDep();
  });

  describe('1. Unauthenticated Request Guard (401)', () => {
    it('Truy cập endpoint customer không có token -> 401', async () => {
      const res = await request(app).get('/api/v1/bookings/my');
      expect(res.status).toBe(401);
    });

    it('Truy cập endpoint staff không có token -> 401', async () => {
      const res = await request(app).get('/api/v1/staff/dashboard');
      expect(res.status).toBe(401);
    });

    it('Truy cập endpoint admin không có token -> 401', async () => {
      const res = await request(app).get('/api/v1/admin/court-types');
      expect(res.status).toBe(401);
    });
  });

  describe('2. CUSTOMER Authorization Boundary', () => {
    it('CUSTOMER truy cập endpoint của mình -> 200', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/my')
        .set('Authorization', `Bearer ${tokenKhach}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('CUSTOMER cố truy cập STAFF dashboard -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${tokenKhach}`);
      expect(res.status).toBe(403);
    });

    it('CUSTOMER cố truy cập STAFF inventory -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenKhach}`);
      expect(res.status).toBe(403);
    });

    it('CUSTOMER cố truy cập ADMIN court-types -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/court-types')
        .set('Authorization', `Bearer ${tokenKhach}`);
      expect(res.status).toBe(403);
    });

    it('CUSTOMER cố truy cập ADMIN inventory -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${tokenKhach}`);
      expect(res.status).toBe(403);
    });
  });

  describe('3. STAFF Authorization Boundary (Ngăn chặn vượt quyền)', () => {
    it('STAFF truy cập dashboard vận hành -> 200', async () => {
      const res = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('STAFF xem danh sách tồn kho vận hành (/staff/inventory) -> 200', async () => {
      const res = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('STAFF cố truy cập ADMIN quản lý loại sân (Court Types) -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/court-types')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(403);
    });

    it('STAFF cố tạo loại sân mới -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/court-types')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          name: 'Sân Pickleball Mới',
          classification: 'SPORT',
          defaultPricePerHour: 150000,
        });
      expect(res.status).toBe(403);
    });

    it('STAFF cố truy cập quản lý bảng giá (Price Matrix) -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/slot-prices')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(403);
    });

    it('STAFF cố cập nhật bảng giá -> 403', async () => {
      const res = await request(app)
        .put('/api/v1/admin/slot-prices')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          prices: [{ courtTypeId: 1, timeSlotId: 1, price: 999999 }],
        });
      expect(res.status).toBe(403);
    });

    it('STAFF cố quản lý tài khoản nhân viên (Staff Accounts) -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(403);
    });

    it('STAFF cố đóng đơn công nợ (Debt Write-off) -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/bookings/999/close-with-debt')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ reason: 'Nhân viên muốn đóng đơn' });
      expect(res.status).toBe(403);
    });

    it('STAFF cố thực hiện Nhập kho (Admin Inventory Import) -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/import')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ serviceId: 1, quantity: 50, note: 'Staff nhập kho trái phép' });
      expect(res.status).toBe(403);
    });

    it('STAFF cố Điều chỉnh kho (Admin Inventory Adjust) -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ serviceId: 1, type: 'ADJUST_OUT', quantity: 5, reason: 'Staff xuất kho trái phép' });
      expect(res.status).toBe(403);
    });

    it('STAFF cố Cập nhật ngưỡng cảnh báo kho -> 403', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/inventory/1/threshold')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ threshold: 20 });
      expect(res.status).toBe(403);
    });

    it('STAFF cố Xem lịch sử biến động kho kiểm toán -> 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inventory/transactions')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(403);
    });
  });

  describe('4. ADMIN Privileges & Safety Invariants', () => {
    it('ADMIN truy cập các endpoints quản trị -> 200', async () => {
      const resCourtTypes = await request(app)
        .get('/api/v1/admin/court-types')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(resCourtTypes.status).toBe(200);

      const resInventory = await request(app)
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(resInventory.status).toBe(200);
    });

    it('ADMIN được phép thực thi nghiệp vụ vận hành của STAFF -> 200', async () => {
      const res = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
    });

    it('ADM-04: ADMIN không được tự khóa chính mình -> 409 CANNOT_LOCK_SELF', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/staff/${adminUserId}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'LOCKED' });
      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('CANNOT_LOCK_SELF');
    });

  });
});
