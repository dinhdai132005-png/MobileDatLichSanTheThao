// =====================================================================
// KIỂM THỬ ĐƠN ĐẶT & NGHIỆP VỤ NHÂN VIÊN — TC-21 -> TC-27
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { quetDonHetHan } from '../src/jobs/hethan-dondat.job';

describe('Kiểm thử Đơn đặt & Nghiệp vụ Nhân viên (TC-21 -> TC-27)', () => {
  const sdtKhach = '0985554433';
  const sdtStaff = '0901234567';
  let tokenKhach: string;
  let tokenStaff: string;

  // Cách 2 ngày (luôn đảm bảo > 6 tiếng theo BR-09)
  const ngayDat = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const courtId = 1;

  async function donDep() {
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)))`,
      [sdtKhach]
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdtKhach]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdtKhach]
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdtKhach]
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?))`,
      [sdtKhach]
    );
    await csdl.execute(
      `UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?))`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `UPDATE chi_tiet_yeu_cau_dich_vu SET nguoi_nhan_tra_id = NULL WHERE nguoi_nhan_tra_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?))`,
      [sdtKhach, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)`,
      [sdtKhach]
    );
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)', [sdtKhach, sdtStaff]);
  }

  beforeAll(async () => {
    await donDep();

    // 1. Tạo khách hàng
    const resKhach = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng Nghiệp Vụ',
      phone: sdtKhach,
      password: 'password123',
    });
    tokenKhach = resKhach.body.data.token;

    // 2. Tạo và lấy token staff độc lập
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Test Nghiệp Vụ',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?", [sdtStaff]);

    const resStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = resStaff.body.data.token;
  });

  afterAll(async () => {
    await donDep();
  });

  // TC-21: Chọn quá 3 khung giờ
  it('TC-21: Đặt quá 3 khung giờ bị từ chối validate đầu vào (400 VALIDATION_ERROR)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [1, 2, 3, 4],
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TC-22: Chọn khung giờ không liên tiếp
  it('TC-22: Chọn khung giờ không liên tiếp bị từ chối (422 SLOTS_NOT_CONSECUTIVE)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [1, 3], // 06:00-07:00 và 08:00-09:00 (cách quãng)
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('SLOTS_NOT_CONSECUTIVE');
  });

  // TC-23: Khách hủy đơn trong hạn hủy
  let donHuyId: number;
  it('TC-23: Khách hủy đơn chưa thanh toán thành công, slot được giải phóng (dang_khoa = NULL)', async () => {
    // Đặt 1 đơn hợp lệ
    const resDat = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [5], // 10:00-11:00
        paymentMethod: 'BANK_TRANSFER',
      });

    expect(resDat.status).toBe(201);
    donHuyId = resDat.body.data.id;

    // Hủy đơn
    const resHuy = await request(app)
      .post(`/api/v1/bookings/${donHuyId}/cancel`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        reason: 'Có việc bận đột xuất',
      });

    expect(resHuy.status).toBe(200);
    expect(resHuy.body.success).toBe(true);

    // Kiểm tra slot trong DB đã giải phóng (dang_khoa = NULL)
    const [rows]: any = await csdl.execute(
      `SELECT dang_khoa FROM chi_tiet_khung_gio_dat WHERE don_dat_id = ?`,
      [donHuyId]
    );
    expect(rows[0].dang_khoa).toBeNull();
  });

  // TC-24: Khách hủy đơn đã PAID -> yêu cầu refundInfo và chuyển sang REFUND_PENDING
  it('TC-24: Khách hủy đơn đã PAID yêu cầu thông tin hoàn tiền (BR-34)', async () => {
    // 1. Tạo đơn mới
    const resDat = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [6], // 11:00-12:00
        paymentMethod: 'BANK_TRANSFER',
      });
    const donPaidId = resDat.body.data.id;

    // 2. Nhân viên xác nhận thanh toán tiền sân
    await request(app)
      .post(`/api/v1/staff/bookings/${donPaidId}/payments`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        method: 'BANK_TRANSFER',
        transactionRef: 'FT12345678',
      });

    // 3. Khách hủy mà không có refundInfo -> bị từ chối 422 REFUND_INFO_REQUIRED
    const resHuyLoi = await request(app)
      .post(`/api/v1/bookings/${donPaidId}/cancel`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        reason: 'Khách muốn hủy',
      });
    expect(resHuyLoi.status).toBe(422);
    expect(resHuyLoi.body.errorCode).toBe('REFUND_INFO_REQUIRED');

    // 4. Khách hủy kèm thông tin hoàn tiền -> thành công
    const resHuyOK = await request(app)
      .post(`/api/v1/bookings/${donPaidId}/cancel`)
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        reason: 'Khách muốn hủy',
        refundInfo: 'Vietcombank 0123456789 NGUYEN VAN KHACH',
      });
    expect(resHuyOK.status).toBe(200);
    expect(resHuyOK.body.data.refundPending).toBe(true);

    // 5. Kiểm tra hàng đợi hoàn tiền của nhân viên
    const resRefunds = await request(app)
      .get('/api/v1/staff/refunds?status=PENDING')
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(resRefunds.status).toBe(200);
    expect(resRefunds.body.data.items.length).toBeGreaterThan(0);

    const refundItem = resRefunds.body.data.items.find((i: any) => i.booking.id === donPaidId);
    expect(refundItem).toBeDefined();

    // 6. Nhân viên xác nhận đã hoàn tiền
    const resConfirm = await request(app)
      .post(`/api/v1/staff/payments/${refundItem.paymentId}/confirm-refund`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        transactionRef: 'REFUND_TXN_9999',
      });
    expect(resConfirm.status).toBe(200);
    expect(resConfirm.body.success).toBe(true);
  });

  // TC-25: Quét đơn PENDING hết hạn (BR-07)
  it('TC-25: Job quét đơn hết hạn tự động chuyển trạng thái đơn sang EXPIRED và nhả slot', async () => {
    // Tạo 1 đơn đặt PENDING
    const resDat = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [7], // 12:00-13:00
        paymentMethod: 'BANK_TRANSFER',
      });
    const donHetHanId = resDat.body.data.id;

    // Giả lập đơn đã quá hạn het_han_luc
    await csdl.execute(
      `UPDATE don_dat SET het_han_luc = DATE_SUB(NOW(), INTERVAL 5 MINUTE) WHERE id = ?`,
      [donHetHanId]
    );

    // Kích hoạt quét đơn hết hạn
    const soLuong = await quetDonHetHan();
    expect(soLuong).toBeGreaterThanOrEqual(1);

    // Kiểm tra đơn đã thành EXPIRED
    const [donRows]: any = await csdl.execute(
      `SELECT trang_thai FROM don_dat WHERE id = ?`,
      [donHetHanId]
    );
    expect(donRows[0].trang_thai).toBe('EXPIRED');

    // Kiểm tra slot đã nhả (dang_khoa = NULL)
    const [slotRows]: any = await csdl.execute(
      `SELECT dang_khoa FROM chi_tiet_khung_gio_dat WHERE don_dat_id = ?`,
      [donHetHanId]
    );
    expect(slotRows[0].dang_khoa).toBeNull();
  });

  // TC-26: Nhân viên xem Dashboard & Schedule
  it('TC-26: Nhân viên truy cập Dashboard và Lịch lưới sân thành công', async () => {
    const resDash = await request(app)
      .get('/api/v1/staff/dashboard')
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(resDash.status).toBe(200);
    expect(resDash.body.data).toHaveProperty('bookings');
    expect(resDash.body.data).toHaveProperty('revenue');
    expect(resDash.body.data).toHaveProperty('overdueBookings');

    const resSched = await request(app)
      .get(`/api/v1/staff/schedule?date=${ngayDat}`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(resSched.status).toBe(200);
    expect(resSched.body.data).toHaveProperty('timeSlots');
    expect(resSched.body.data).toHaveProperty('courts');
  });

  // TC-63: Đơn quá giờ kết thúc (overdue=true) hiển thị trên Dashboard và danh sách lọc
  it('TC-63: Đơn CONFIRMED đã qua giờ kết thúc được lọc đúng khi overdue=true và xuất hiện trên Dashboard', async () => {
    // 1. Tạo đơn quá hạn hôm qua
    const homQua = '2026-01-01';
    const [donRes]: any = await csdl.execute(
      `INSERT INTO don_dat (
         ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
         tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan, trang_thai_thanh_toan,
         nguon_don
       ) VALUES ('BKOVERDUE1', (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?), ?, ?, '07:00:00', '08:00:00', 100000, 0, 'CONFIRMED', 'CASH', 'PAID', 'APP')`,
      [sdtKhach, courtId, homQua]
    );
    const donId = donRes.insertId;

    // 2. Kiểm tra lọc overdue=true
    const resOverdue = await request(app)
      .get('/api/v1/staff/bookings?overdue=true')
      .set('Authorization', `Bearer ${tokenStaff}`);

    expect(resOverdue.status).toBe(200);
    const coDonTrongDanhSach = resOverdue.body.data.items.some((b: any) => b.id === donId);
    expect(coDonTrongDanhSach).toBe(true);

    // 3. Hoàn thành đơn đó và kiểm tra đơn biến mất khỏi danh sách overdue=true
    const resComplete = await request(app)
      .post(`/api/v1/staff/bookings/${donId}/complete`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(resComplete.status).toBe(200);

    const resOverdueSau = await request(app)
      .get('/api/v1/staff/bookings?overdue=true')
      .set('Authorization', `Bearer ${tokenStaff}`);
    const conDonTrongDanhSach = resOverdueSau.body.data.items.some((b: any) => b.id === donId);
    expect(conDonTrongDanhSach).toBe(false);

    // Dọn dẹp
    await csdl.execute('DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id = ?', [donId]);
    await csdl.execute('DELETE FROM don_dat WHERE id = ?', [donId]);
  });
});
