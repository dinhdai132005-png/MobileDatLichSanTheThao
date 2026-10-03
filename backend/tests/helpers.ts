import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';

let adminTokenCache: string | null = null;
let staffTokenCache: string | null = null;
let customerATokenCache: string | null = null;
let customerBTokenCache: string | null = null;

export async function getAdminToken(): Promise<string> {
  if (adminTokenCache) return adminTokenCache;
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ soDienThoai: '0900000001', matKhau: 'admin123456' });
  adminTokenCache = res.body.data.token;
  return adminTokenCache!;
}

export async function getStaffToken(): Promise<string> {
  if (staffTokenCache) return staffTokenCache;
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ soDienThoai: '0900000002', matKhau: '123456' });
  staffTokenCache = res.body.data.token;
  return staffTokenCache!;
}

export async function getCustomerAToken(): Promise<string> {
  if (customerATokenCache) return customerATokenCache;
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ soDienThoai: '0911111111', matKhau: '123456' });
  customerATokenCache = res.body.data.token;
  return customerATokenCache!;
}

export async function getCustomerBToken(): Promise<string> {
  if (customerBTokenCache) return customerBTokenCache;
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ soDienThoai: '0922222222', matKhau: '123456' });
  customerBTokenCache = res.body.data.token;
  return customerBTokenCache!;
}

/**
 * Tạo một khách hàng kiểm thử mới độc lập (tránh đụng hạn mức 3 đơn đặt hoạt động)
 */
export async function createTestCustomer(namePrefix = 'TestKhach'): Promise<{ id: number; token: string; phone: string }> {
  const phone = `099${Math.floor(1000000 + Math.random() * 9000000)}`;
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      hoTen: `${namePrefix} ${phone.slice(-4)}`,
      soDienThoai: phone,
      email: `${phone}@test.vn`,
      matKhau: '123456',
    });
  return {
    id: res.body.data.user.id,
    token: res.body.data.token,
    phone,
  };
}

/**
 * Giải phóng slot kiểm thử (đưa is_locked về NULL)
 */
export async function freeSlot(sanId: number, ngayDat: string, khungGioId: number) {
  await pool.execute(
    'UPDATE booking_slots SET is_locked = NULL WHERE court_id = ? AND slot_date = ? AND time_slot_id = ?',
    [sanId, ngayDat, khungGioId]
  );
}

/**
 * Lấy chuỗi YYYY-MM-DD cách hôm nay N ngày (múi giờ Asia/Ho_Chi_Minh)
 */
export function getFutureDateString(daysAhead: number = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}


