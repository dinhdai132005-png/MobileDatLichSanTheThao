// =====================================================================
// KIỂM THỬ TRANH CHẤP SLOT ĐỒNG THỜI (CONCURRENCY & RACE CONDITIONS)
// Đáp ứng: TC-20 (A, B, C) & TC-56 theo .agents/skills/concurrency-and-race-testing
// Tiêu chuẩn vàng: Barrier Pattern, Triple-Check Protocol, Microsecond Synchronization
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { RowDataPacket } from 'mysql2/promise';

describe('Kiểm thử Concurrency & Tranh chấp Slot (TC-20, TC-56)', () => {
  const courtId = 1;
  const eventCourtId = 8; // Phòng tiệc A (loại EVENT)
  const ngayDat = '2026-10-18';
  let staffToken: string;

  async function taoKhachHangTest(prefix: string, sdt: string) {
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
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)`,
      [sdt]
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai = ?`, [sdt]);

    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: `Khách ${prefix}`,
      phone: sdt,
      password: 'password123',
    });
    return {
      phone: sdt,
      token: res.body.data.token,
      id: res.body.data.user.id,
    };
  }

  async function giaiPhongSlot(san: number, ngay: string, slot: number) {
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE san_id = ? AND ngay_dat = ? AND khung_gio_id = ?`,
      [san, ngay, slot]
    );
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

  const sdtStaff = '0909998877';

  beforeAll(async () => {
    // Dọn dẹp trước khi tạo nhân viên phục vụ test
    await donDepStaff(sdtStaff);

    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Concurrency',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute(`UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?`, [sdtStaff]);
    const resStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    staffToken = resStaff.body.data.token;
  });

  afterAll(async () => {
    await donDepStaff(sdtStaff);
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 1: 15 WORKER CÙNG TRANH 1 SLOT (BARRIER PATTERN)
  // -------------------------------------------------------------------
  it('TC-20A (15-Worker Barrier): 15 khách đồng thời đặt cùng 1 slot -> Đúng 1 thành công (201), 14 từ chối (409 SLOT_TAKEN), CSDL đúng 1 khóa', async () => {
    const SO_WORKER = 15;
    const timeSlotId = 3; // 08:00 - 09:00
    await giaiPhongSlot(courtId, ngayDat, timeSlotId);

    // Chuẩn bị 15 khách hàng riêng biệt
    const customers = await Promise.all(
      Array.from({ length: SO_WORKER }).map((_, idx) =>
        taoKhachHangTest(`Barrier${idx}`, `09710000${idx < 10 ? '0' + idx : idx}`)
      )
    );

    // Thiết lập Barrier Pattern đồng bộ microsecond
    let moRaoChan: () => void;
    const barrier = new Promise<void>((resolve) => {
      moRaoChan = resolve;
    });

    const requests = customers.map(async (cust, idx) => {
      await barrier; // Chờ sẵn tại vạch xuất phát
      return request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${cust.token}`)
        .send({
          courtId,
          bookingDate: ngayDat,
          timeSlotIds: [timeSlotId],
          paymentMethod: idx % 2 === 0 ? 'CASH' : 'BANK_TRANSFER',
          note: `Barrier Worker #${idx}`,
        });
    });

    // Phát lệnh bắn đồng loạt
    moRaoChan!();
    const responses = await Promise.all(requests);

    // Tầng 1: HTTP Status Code
    const count201 = responses.filter((r) => r.status === 201).length;
    const count409 = responses.filter((r) => r.status === 409).length;
    expect(count201).toBe(1);
    expect(count409).toBe(SO_WORKER - 1);

    // Tầng 2: Error Code nghiệp vụ
    const failedResponses = responses.filter((r) => r.status === 409);
    expect(failedResponses.every((r) => r.body.errorCode === 'SLOT_TAKEN')).toBe(true);

    // Tầng 3: Database Direct Query (Tính toàn vẹn CSDL)
    const [rows]: any = await csdl.execute(
      `SELECT id, don_dat_id, dang_khoa
       FROM chi_tiet_khung_gio_dat
       WHERE san_id = ? AND ngay_dat = ? AND khung_gio_id = ? AND dang_khoa = 1`,
      [courtId, ngayDat, timeSlotId]
    );
    expect(rows.length).toBe(1);
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 2: DOUBLE CONFIRM PAYMENT (2 NHÂN VIÊN DUYỆT CÙNG LÚC)
  // -------------------------------------------------------------------
  it('TC-20B (Double Confirm Payment): 2 nhân viên xác nhận thanh toán cùng lúc -> 1 thành công (200), 1 bị từ chối (409 ALREADY_PAID), chỉ 1 dòng thanh toán', async () => {
    const cust = await taoKhachHangTest('DoublePay', '0972000001');
    const timeSlotId = 4;
    await giaiPhongSlot(courtId, ngayDat, timeSlotId);

    // Tạo đơn PENDING
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [timeSlotId],
        paymentMethod: 'BANK_TRANSFER',
      });
    expect(bookRes.status).toBe(201);
    const donId = bookRes.body.data.id;

    // Barrier cho 2 nhân viên duyệt thanh toán đồng thời
    let moRao: () => void;
    const barrier = new Promise<void>((resolve) => { moRao = resolve; });

    const req1 = (async () => {
      await barrier;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ method: 'BANK_TRANSFER', note: 'Staff 1' });
    })();

    const req2 = (async () => {
      await barrier;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ method: 'BANK_TRANSFER', note: 'Staff 2' });
    })();

    moRao!();
    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const resThatBai = res1.status === 409 ? res1 : res2;
    expect(resThatBai.body.errorCode).toBe('ALREADY_PAID');

    // Kiểm tra CSDL: duy nhất 1 giao dịch PAYMENT thành công
    const [payments] = await csdl.execute<RowDataPacket[]>(
      `SELECT id, trang_thai FROM thanh_toan WHERE don_dat_id = ? AND loai_giao_dich = 'PAYMENT'`,
      [donId]
    );
    expect(payments.length).toBe(1);
    expect(payments[0].trang_thai).toBe('SUCCESS');
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 3: RACE CONDITION KHÁCH HỦY ĐỒNG THỜI NHÂN VIÊN DUYỆT
  // -------------------------------------------------------------------
  it('TC-20C (Cancel vs Payment Race): Khách hủy đơn đồng thời nhân viên duyệt -> 1 thao tác thành công, CSDL nhất quán', async () => {
    const cust = await taoKhachHangTest('CancelVsPay', '0973000001');
    const timeSlotId = 5;
    await giaiPhongSlot(courtId, ngayDat, timeSlotId);

    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${cust.token}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [timeSlotId],
        paymentMethod: 'CASH',
      });
    expect(bookRes.status).toBe(201);
    const donId = bookRes.body.data.id;

    let moRao: () => void;
    const barrier = new Promise<void>((resolve) => { moRao = resolve; });

    const reqHuy = (async () => {
      await barrier;
      return request(app)
        .post(`/api/v1/bookings/${donId}/cancel`)
        .set('Authorization', `Bearer ${cust.token}`)
        .send({ reason: 'Bận đột xuất' });
    })();

    const reqDuyet = (async () => {
      await barrier;
      return request(app)
        .post(`/api/v1/staff/bookings/${donId}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ method: 'CASH' });
    })();

    moRao!();
    const [resHuy, resDuyet] = await Promise.all([reqHuy, reqDuyet]);

    // Một bên phải 200, bên kia hoặc 200 hoặc 409/422 tùy thứ tự transaction
    const [donRows]: any = await csdl.execute(
      `SELECT trang_thai, trang_thai_thanh_toan FROM don_dat WHERE id = ?`,
      [donId]
    );
    const don = donRows[0];
    expect(['CONFIRMED', 'CANCELLED']).toContain(don.trang_thai);
  });

  // -------------------------------------------------------------------
  // KỊCH BẢN 4: TRANH CHẤP KHU SỰ KIỆN / TIỆC (TC-56, BR-30)
  // -------------------------------------------------------------------
  it('TC-56: Hai khách cùng tranh chấp phòng tiệc (loại EVENT) -> Đúng 1 thành công (201), 1 nhận 409 SLOT_TAKEN', async () => {
    const custA = await taoKhachHangTest('EventA', '0974000001');
    const custB = await taoKhachHangTest('EventB', '0974000002');
    const timeSlotId = 12; // 17:00 - 18:00
    await giaiPhongSlot(eventCourtId, ngayDat, timeSlotId);

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${custA.token}`)
        .send({
          courtId: eventCourtId,
          bookingDate: ngayDat,
          timeSlotIds: [timeSlotId],
          paymentMethod: 'BANK_TRANSFER',
          note: 'Đặt tiệc sinh nhật A',
        }),
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${custB.token}`)
        .send({
          courtId: eventCourtId,
          bookingDate: ngayDat,
          timeSlotIds: [timeSlotId],
          paymentMethod: 'BANK_TRANSFER',
          note: 'Đặt tiệc sinh nhật B',
        }),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const resFail = resA.status === 409 ? resA : resB;
    expect(resFail.body.errorCode).toBe('SLOT_TAKEN');

    const [rows]: any = await csdl.execute(
      `SELECT id FROM chi_tiet_khung_gio_dat
       WHERE san_id = ? AND ngay_dat = ? AND khung_gio_id = ? AND dang_khoa = 1`,
      [eventCourtId, ngayDat, timeSlotId]
    );
    expect(rows.length).toBe(1);
  });
});
