// =====================================================================
// KIỂM THỬ XÁC THỰC — TC-01 -> TC-06: Đăng ký, đăng nhập, khóa tài khoản, me
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';

describe('Kiểm thử Xác thực (Auth API)', () => {
  const sdtTest = '0988776655';
  const matKhauTest = 'password123';
  let tokenKhach: string;

  beforeAll(async () => {
    // Dọn dẹp dữ liệu test cũ nếu có
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtTest]);
  });

  afterAll(async () => {
    // Dọn dẹp sau khi test
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtTest]);
  });

  // TC-01: Đăng ký thành công
  it('TC-01: Đăng ký tài khoản khách hàng mới thành công', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Nguyễn Văn Test',
        phone: sdtTest,
        password: matKhauTest,
        email: 'test_auth@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      fullName: 'Nguyễn Văn Test',
      phone: sdtTest,
      email: 'test_auth@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    expect(res.body.data.user).not.toHaveProperty('mat_khau_hash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  // TC-02: Đăng ký trùng số điện thoại
  it('TC-02: Đăng ký trùng số điện thoại báo lỗi 409 PHONE_EXISTS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Nguyễn Trùng Số',
        phone: sdtTest,
        password: 'anotherpassword',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('PHONE_EXISTS');
  });

  // TC-03: Đăng nhập thành công
  it('TC-03: Đăng nhập đúng thông tin nhận token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: sdtTest,
        password: matKhauTest,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.phone).toBe(sdtTest);

    tokenKhach = res.body.data.token;
  });

  // TC-04: Đăng nhập sai mật khẩu
  it('TC-04: Đăng nhập sai mật khẩu báo lỗi 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: sdtTest,
        password: 'saimatkhauroi',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  // TC-05: Đăng nhập tài khoản bị khóa
  it('TC-05: Tài khoản bị khóa không thể đăng nhập (401 ACCOUNT_LOCKED)', async () => {
    // Khóa tài khoản
    await csdl.execute("UPDATE nguoi_dung SET trang_thai = 'LOCKED' WHERE so_dien_thoai = ?", [sdtTest]);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: sdtTest,
        password: matKhauTest,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('ACCOUNT_LOCKED');

    // Mở khóa lại để test tiếp
    await csdl.execute("UPDATE nguoi_dung SET trang_thai = 'ACTIVE' WHERE so_dien_thoai = ?", [sdtTest]);
  });

  // TC-06: Xem thông tin tài khoản qua Bearer token
  it('TC-06: Xem thông tin tài khoản GET /auth/me thành công', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenKhach}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(sdtTest);
    expect(res.body.data.fullName).toBe('Nguyễn Văn Test');
  });
});
