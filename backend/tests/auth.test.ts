// =====================================================================
// TEST SUITE 1: AUTHENTICATION, SECURITY & RBAC MATRIX (TC-01 -> TC-09, TC-40)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { getAdminToken, getStaffToken, getCustomerAToken, createTestCustomer } from './helpers';

describe('1. Kiểm thử Xác thực, Bảo mật & Phân quyền RBAC (TC-01 -> TC-09, TC-40)', () => {
  let adminToken: string;
  let staffToken: string;
  let customerAToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    staffToken = await getStaffToken();
    customerAToken = await getCustomerAToken();
  });

  it('TC-01: Đăng ký tài khoản khách hàng hợp lệ -> 201 Created (role=CUSTOMER)', async () => {
    const sdt = `0999${Math.floor(100000 + Math.random() * 900000)}`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        hoTen: 'Người Dùng Kiểm Thử TC-01',
        soDienThoai: sdt,
        email: `${sdt}@test.vn`,
        matKhau: '123456',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.role).toBe('CUSTOMER');
  });

  it('TC-02: Đăng ký trùng số điện thoại đã tồn tại -> 409 Conflict (PHONE_EXISTS)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        hoTen: 'Người Trùng Số',
        soDienThoai: '0911111111', // Số đã tồn tại trong DB seed
        email: 'trungso@test.vn',
        matKhau: '123456',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('PHONE_EXISTS');
  });

  it('TC-03: Đăng nhập sai mật khẩu -> 401 Unauthorized (INVALID_CREDENTIALS)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        soDienThoai: '0911111111',
        matKhau: 'sai_mat_khau_123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('TC-04: Admin khóa tài khoản khách, khách dùng token cũ gọi /auth/me -> 401 (ACCOUNT_LOCKED)', async () => {
    const cust = await createTestCustomer('KhachKhoa');

    // Admin khóa tài khoản
    const lockRes = await request(app)
      .patch(`/api/v1/admin/customers/${cust.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOCKED' });
    expect(lockRes.status).toBe(200);

    // Khách dùng token cũ truy cập
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${cust.token}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.errorCode).toBe('ACCOUNT_LOCKED');
  });

  it('TC-05: Khách hàng (CUSTOMER) gọi endpoint quản trị (/api/v1/admin/courts) -> 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/admin/courts')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ name: 'Sân Hack' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('TC-06: Truy cập API được bảo vệ (/api/v1/bookings/my) không có token -> 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/bookings/my');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('TC-07: Khách đổi mật khẩu với mật khẩu cũ sai -> 400 Bad Request (INVALID_OLD_PASSWORD)', async () => {
    const cust = await createTestCustomer('KhachDoiMK');
    const res = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        matKhauCu: 'sai_mat_khau_cu',
        matKhauMoi: '654321',
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_OLD_PASSWORD');
  });

  it('TC-08: Đăng ký tài khoản với định dạng số điện thoại sai -> 400 Validation Error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        hoTen: 'Số Điện Thoại Lỗi',
        soDienThoai: '12345', // Không bắt đầu bằng 0 và không đủ 10 số
        matKhau: '123456',
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('TC-09: Token JWT bị can thiệp chữ ký (tampered token) -> 401 Unauthorized', async () => {
    const tamperedToken = `${customerAToken.slice(0, -6)}XYZ123`;
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('TC-40: Khách hàng (CUSTOMER) truy cập endpoint nhân viên (/api/v1/staff/dashboard) -> 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/staff/dashboard')
      .set('Authorization', `Bearer ${customerAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ===================================================================
  // MA TRẬN PHÂN QUYỀN RBAC (Table-Driven Matrix Testing)
  // [GUEST, CUSTOMER, STAFF, ADMIN] x [Endpoints]
  // ===================================================================
  describe('Ma trận Phân quyền RBAC Đa vai trò', () => {
    const matrix = [
      {
        endpoint: '/api/v1/admin/courts',
        method: 'get',
        expected: { guest: 401, customer: 403, staff: 403, admin: 200 },
      },
      {
        endpoint: '/api/v1/staff/dashboard',
        method: 'get',
        expected: { guest: 401, customer: 403, staff: 200, admin: 200 },
      },
      {
        endpoint: '/api/v1/bookings/my',
        method: 'get',
        expected: { guest: 401, customer: 200, staff: 403, admin: 403 },
      },
    ];

    for (const route of matrix) {
      it(`RBAC Check: ${route.method.toUpperCase()} ${route.endpoint}`, async () => {
        // 1. Guest (Không token)
        const guestRes = await (request(app) as any)[route.method](route.endpoint);
        expect(guestRes.status).toBe(route.expected.guest);

        // 2. Customer
        const custRes = await (request(app) as any)[route.method](route.endpoint).set(
          'Authorization',
          `Bearer ${customerAToken}`
        );
        expect(custRes.status).toBe(route.expected.customer);

        // 3. Staff
        const staffRes = await (request(app) as any)[route.method](route.endpoint).set(
          'Authorization',
          `Bearer ${staffToken}`
        );
        expect(staffRes.status).toBe(route.expected.staff);

        // 4. Admin
        const adminRes = await (request(app) as any)[route.method](route.endpoint).set(
          'Authorization',
          `Bearer ${adminToken}`
        );
        expect(adminRes.status).toBe(route.expected.admin);
      });
    }
  });
});
