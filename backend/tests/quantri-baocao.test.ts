// =====================================================================
// KIỂM THỬ QUẢN TRỊ & BÁO CÁO — TC-40 -> TC-43
// Đáp ứng: plant/06-api.md mục 4.4, 5.10, 5.11, 5.12, 5.19, 5.21
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';

describe('Kiểm thử Quản trị & Báo cáo (Admin & Reports)', () => {
  const sdtAdmin = '0900000001';
  let tokenAdmin: string;

  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = res.body.data.token;
  });

  // TC-40: Quản lý loại sân
  let loaiSanMoiId: number;
  it('TC-40: ADMIN tạo và cập nhật loại sân thành công', async () => {
    const resTao = await request(app)
      .post('/api/v1/admin/court-types')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        name: 'Bóng Rổ Trong Nhà Test',
        category: 'SPORT',
        description: 'Mặt sàn gỗ tiêu chuẩn thi đấu',
      });

    expect(resTao.status).toBe(201);
    expect(resTao.body.success).toBe(true);
    expect(resTao.body.data).toHaveProperty('id');
    loaiSanMoiId = resTao.body.data.id;

    const resSua = await request(app)
      .put(`/api/v1/admin/court-types/${loaiSanMoiId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        description: 'Đã cập nhật mô tả',
      });

    expect(resSua.status).toBe(200);
    expect(resSua.body.success).toBe(true);
  });

  // TC-41: Quản lý bảng giá khung giờ hàng loạt
  it('TC-41: ADMIN cập nhật ma trận bảng giá hàng loạt thành công', async () => {
    const res = await request(app)
      .put('/api/v1/admin/slot-prices')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        courtTypeId: loaiSanMoiId,
        prices: [
          { timeSlotId: 1, dayType: 'WEEKDAY', price: 150000 },
          { timeSlotId: 1, dayType: 'WEEKEND', price: 200000 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TC-42: Quản trị tài khoản nhân viên
  let staffMoiId: number;
  it('TC-42: ADMIN tạo nhân viên và khóa/mở khóa tài khoản nhân viên', async () => {
    const sdtStaffMoi = '0909999888';
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtStaffMoi]);

    const resTao = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        fullName: 'Nhân Viên Thu Ngân',
        phone: sdtStaffMoi,
        password: 'password123',
        email: 'staff_thungan@example.com',
      });

    expect(resTao.status).toBe(201);
    expect(resTao.body.success).toBe(true);
    staffMoiId = resTao.body.data.id;

    // Khóa tài khoản
    const resKhoa = await request(app)
      .patch(`/api/v1/admin/staff/${staffMoiId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'LOCKED' });

    expect(resKhoa.status).toBe(200);
    expect(resKhoa.body.data.status).toBe('LOCKED');

    // Dọn dẹp
    await csdl.execute('DELETE FROM nguoi_dung WHERE id = ?', [staffMoiId]);
  });

  // TC-43: Báo cáo thống kê
  it('TC-43: ADMIN lấy 4 báo cáo tổng quan, doanh thu, lấp đầy sân, dịch vụ', async () => {
    // 1. Tổng quan
    const resSummary = await request(app)
      .get('/api/v1/admin/reports/summary')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resSummary.status).toBe(200);
    expect(resSummary.body.data).toHaveProperty('totalBookings');
    expect(resSummary.body.data).toHaveProperty('revenue');

    // 2. Doanh thu
    const resRev = await request(app)
      .get('/api/v1/admin/reports/revenue?from=2026-10-01&to=2026-10-31')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resRev.status).toBe(200);
    expect(resRev.body.data).toHaveProperty('totalRevenue');
    expect(resRev.body.data).toHaveProperty('courtRevenue');
    expect(resRev.body.data).toHaveProperty('serviceRevenue');

    // 3. Sử dụng sân
    const resUsage = await request(app)
      .get('/api/v1/admin/reports/court-usage?from=2026-10-01&to=2026-10-31')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resUsage.status).toBe(200);
    expect(Array.isArray(resUsage.body.data)).toBe(true);

    // 4. Dịch vụ
    const resServices = await request(app)
      .get('/api/v1/admin/reports/services')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(resServices.status).toBe(200);
    expect(resServices.body.data).toHaveProperty('byType');
    expect(resServices.body.data).toHaveProperty('topServices');
  });

  afterAll(async () => {
    if (loaiSanMoiId) {
      await csdl.execute('DELETE FROM gia_khung_gio WHERE loai_san_id = ?', [loaiSanMoiId]);
      await csdl.execute('DELETE FROM loai_san WHERE id = ?', [loaiSanMoiId]);
    }
  });
});
