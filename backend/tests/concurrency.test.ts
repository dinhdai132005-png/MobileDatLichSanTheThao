// =====================================================================
// TEST SUITE: HIGH CONCURRENCY RACE CONDITION TEST (TC-20)
// Tham chiếu: Plant/08-development-plan.md mục 3 & mục 4
// "Cơ chế chống trùng lịch và test TC-20, vì đây là câu hỏi bảo vệ chắc chắn xuất hiện"
// =====================================================================
import request from 'supertest';
import app from '../src/app';
import { createTestCustomer, getFutureDateString } from './helpers';
import { pool } from '../src/config/db';
import { RowDataPacket } from 'mysql2/promise';

describe('3. Kiểm thử Tranh chấp Đồng thời / Race Condition (TC-20)', () => {
  it('TC-20: Hai khách gửi đồng thời đặt cùng một sân, cùng ngày, cùng khung giờ -> Đúng 1 thành công (201), 1 bị từ chối 409 (SLOT_TAKEN)', async () => {
    // 1. Chuẩn bị 2 khách hàng riêng biệt
    const customerA = await createTestCustomer('KhachDua1');
    const customerB = await createTestCustomer('KhachDua2');

    const sanId = 4; // Sân Cầu Lông 2
    const khungGioId = 5; // 10:00 - 11:00
    const ngayDat = getFutureDateString(8);

    // Đảm bảo slot chưa bị ai đặt trước đó trong DB
    await pool.execute(
      'DELETE FROM booking_slots WHERE court_id = ? AND slot_date = ? AND time_slot_id = ?',
      [sanId, ngayDat, khungGioId]
    );

    // 2. Chuẩn bị 2 request đồng thời
    const request1 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerA.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        phuongThucThanhToan: 'CASH',
        ghiChu: 'TC-20 Concurrency Request 1',
      });

    const request2 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerB.token}`)
      .send({
        sanId,
        ngayDat,
        danhSachKhungGioId: [khungGioId],
        phuongThucThanhToan: 'BANK_TRANSFER',
        ghiChu: 'TC-20 Concurrency Request 2',
      });

    // 3. Bắn 2 request song song cùng một thời điểm qua Promise.all
    const [res1, res2] = await Promise.all([request1, request2]);

    const statuses = [res1.status, res2.status].sort();
    const errorCodes = [res1.body.errorCode, res2.body.errorCode].filter(Boolean);

    // 4. Kiểm tra: Phải có đúng 1 request thành công 201 và 1 request thất bại 409
    expect(statuses).toEqual([201, 409]);
    expect(errorCodes).toContain('SLOT_TAKEN');

    // 5. Kiểm tra tính toàn vẹn trong Database:
    // Bảng booking_slots chỉ được phép có DUY NHẤT 1 dòng khóa is_locked = 1
    const [danhSachKhoa] = await pool.execute<RowDataPacket[]>(
      `SELECT id, booking_id, court_id, slot_date, time_slot_id, is_locked
       FROM booking_slots
       WHERE court_id = ? AND slot_date = ? AND time_slot_id = ? AND is_locked = 1`,
      [sanId, ngayDat, khungGioId]
    );

    expect(danhSachKhoa.length).toBe(1);
  });
});
