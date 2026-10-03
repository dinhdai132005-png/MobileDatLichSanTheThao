// =====================================================================
// TEST SUITE: AUTHENTICATION & RBAC (TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-40)
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { getAdminToken, getCustomerAToken } from './helpers';

describe('1. Kiểm thử Xác thực & Phân quyền (TC-01 -> TC-06, TC-40)', () => {
  const soDienThoaiMoi = `0999${Math.floor(100000 + Math.random() * 900000)}`;

  it('TC-01: Đăng ký tài khoản khách hàng hợp lệ -> 201 Created', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        hoTen: 'Người Dùng Kiểm Thử TC-01',
        soDienThoai: soDienThoaiMoi,
        email: `${soDienThoaiMoi}@test.vn`,
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
        soDienThoai: soDienThoaiMoi,
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
    // 1. Đăng ký khách hàng mới để test khóa
    const sdtKhoa = `0998${Math.floor(100000 + Math.random() * 900000)}`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        hoTen: 'Khách Sắp Bị Khóa',
        soDienThoai: sdtKhoa,
        matKhau: '123456',
      });
    const tokenKhach = regRes.body.data.token;
    const khachId = regRes.body.data.user.id;

    // 2. Admin gọi API khóa tài khoản khách này
    const adminToken = await getAdminToken();
    const lockRes = await request(app)
      .patch(`/api/v1/admin/customers/${khachId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOCKED' });
    expect(lockRes.status).toBe(200);

    // 3. Khách dùng token cũ gọi /auth/me -> Bị chặn 401 ACCOUNT_LOCKED
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenKhach}`);

    expect(meRes.status).toBe(401);
    expect(meRes.body.errorCode).toBe('ACCOUNT_LOCKED');
  });

  it('TC-05: Khách hàng (CUSTOMER) gọi endpoint quản trị (/api/v1/admin/courts) -> 403 Forbidden', async () => {
    const tokenKhach = await getCustomerAToken();
    const res = await request(app)
      .post('/api/v1/admin/courts')
      .set('Authorization', `Bearer ${tokenKhach}`)
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

  it('TC-40: Khách hàng (CUSTOMER) truy cập endpoint nhân viên (/api/v1/staff/dashboard) -> 403 Forbidden', async () => {
    const tokenKhach = await getCustomerAToken();
    const res = await request(app)
      .get('/api/v1/staff/dashboard')
      .set('Authorization', `Bearer ${tokenKhach}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
