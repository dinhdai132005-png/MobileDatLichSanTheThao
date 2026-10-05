// =====================================================================
// KIỂM THỬ DANH MỤC CÔNG KHAI — TC-10 -> TC-14
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';

describe('Kiểm thử Danh mục công khai (Catalog API)', () => {
  // TC-10: Lấy danh sách loại sân
  it('TC-10: GET /api/v1/court-types trả danh sách loại sân active', async () => {
    const res = await request(app).get('/api/v1/court-types');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const loaiSan = res.body.data[0];
    expect(loaiSan).toHaveProperty('id');
    expect(loaiSan).toHaveProperty('name');
    expect(loaiSan).toHaveProperty('category');
    expect(['SPORT', 'EVENT']).toContain(loaiSan.category);
  });

  // TC-11: Lấy danh sách sân
  it('TC-11: GET /api/v1/courts trả danh sách sân có đánh giá và capacity', async () => {
    const res = await request(app).get('/api/v1/courts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const san = res.body.data[0];
    expect(san).toHaveProperty('id');
    expect(san).toHaveProperty('name');
    expect(san).toHaveProperty('courtType');
    expect(san).toHaveProperty('rating');
  });

  // TC-12: Lấy lịch trống của sân
  it('TC-12: GET /api/v1/courts/:id/availability trả danh sách slots', async () => {
    // Tìm ngày mai để kiểm tra
    const ngayMai = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const res = await request(app).get(`/api/v1/courts/1/availability?date=${ngayMai}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('courtId', 1);
    expect(res.body.data).toHaveProperty('date', ngayMai);
    expect(res.body.data).toHaveProperty('slots');
    expect(Array.isArray(res.body.data.slots)).toBe(true);

    if (res.body.data.slots.length > 0) {
      const slot = res.body.data.slots[0];
      expect(slot).toHaveProperty('timeSlotId');
      expect(slot).toHaveProperty('startTime');
      expect(slot).toHaveProperty('endTime');
      expect(slot).toHaveProperty('status');
      expect(['AVAILABLE', 'BOOKED', 'PAST', 'MAINTENANCE', 'NO_PRICE']).toContain(slot.status);
    }
  });

  // TC-13: Lấy danh mục dịch vụ
  it('TC-13: GET /api/v1/services chỉ trả ACTIVE và OUT_OF_STOCK, không trả INACTIVE', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    for (const dv of res.body.data) {
      expect(['ACTIVE', 'OUT_OF_STOCK']).toContain(dv.status);
      expect(dv.status).not.toBe('INACTIVE');
    }
  });

  // TC-14: Lấy cấu hình công khai
  it('TC-14: GET /api/v1/config/public trả cấu hình đúng quy tắc BR', async () => {
    const res = await request(app).get('/api/v1/config/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      bookingAdvanceDays: 14,
      holdMinutes: 30,
      cancelDeadlineHours: 6,
      maxSlotsPerBooking: 3,
      maxActiveBookingsPerCustomer: 3,
      paymentMethods: ['CASH', 'BANK_TRANSFER'],
    });
  });
});
