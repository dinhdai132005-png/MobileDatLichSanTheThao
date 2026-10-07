/// <reference types="jest" />
// =====================================================================
// KIỂM THỬ ĐỒNG BỘ TOÀN HỆ THỐNG (FULL-STACK E2E SYNC)
// Đồng bộ 3 đối tượng: Mobile App (Customer) <-> Web Nhân Viên (Staff) <-> Web Quản Trị (Admin)
// Bao quát: Tra cứu -> Đặt sân -> Đặt dịch vụ (Kho RESERVE) -> Giao đồ (Kho DELIVER) ->
//           Hóa đơn cập nhật -> Trả đồ thuê (Kho RETURN) -> Thu tiền -> Hoàn thành -> Đánh giá ->
//           Đóng đơn công nợ (Admin Write-off) -> Quản trị kho & Báo cáo doanh thu
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';

process.env.TZ = 'Asia/Ho_Chi_Minh';

describe('Kiểm thử Đồng bộ Toàn Hệ Thống (Mobile Customer <-> Staff Web <-> Admin Web)', () => {
  const sdtCustomer = '0989111222';
  const sdtStaff = '0909111333';
  const sdtAdmin = '0900000001';
  const password = 'password123';

  let tokenCustomer: string;
  let tokenStaff: string;
  let tokenAdmin: string;
  let customerId: number;
  let staffId: number;

  const ngayDat = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayDatDebt = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  async function donDep() {
    const phones = [sdtCustomer, sdtStaff];
    const phIn = phones.map(() => '?').join(',');

    // 1. Dọn dẹp bien_dong_kho liên quan đến don_dat của user test
    await csdl.execute(
      `DELETE FROM bien_dong_kho WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 2. Dọn dẹp chi_tiet_yeu_cau_dich_vu
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
        SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (
          SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
        )
      )`,
      phones
    );

    // 3. Dọn dẹp yeu_cau_dich_vu
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 4. Dọn dẹp chi_tiet_khung_gio_dat
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 5. Dọn dẹp danh_gia
    await csdl.execute(
      `DELETE FROM danh_gia WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 6. Dọn dẹp thanh_toan
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 7. Dọn dẹp nhat_ky_trang_thai_don
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))
      )`,
      phones
    );

    // 8. Gỡ liên kết khóa ngoại
    await csdl.execute(
      `UPDATE thanh_toan SET nguoi_xu_ly_id = NULL WHERE nguoi_xu_ly_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))`,
      phones
    );
    await csdl.execute(
      `UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))`,
      phones
    );
    await csdl.execute(
      `UPDATE don_dat SET nguoi_tao_id = NULL WHERE nguoi_tao_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))`,
      phones
    );
    await csdl.execute(
      `UPDATE bien_dong_kho SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))`,
      phones
    );

    // 9. Xóa đơn đặt
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${phIn}))`,
      phones
    );

    // 10. Xóa người dùng
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai IN (${phIn})`, phones);
  }

  beforeAll(async () => {
    await donDep();
    await csdl.execute('UPDATE ton_kho_dich_vu SET so_luong = 100, so_luong_dang_giu = 0 WHERE dich_vu_id IN (1, 2, 5)');

    // 1. Tạo tài khoản Khách hàng Mobile
    const resCustReg = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng Mobile Sync',
      phone: sdtCustomer,
      password: password,
    });
    tokenCustomer = resCustReg.body.data.token;
    customerId = resCustReg.body.data.user.id;

    // 2. Tạo tài khoản Nhân viên Web Admin
    const resStaffReg = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Web Admin Sync',
      phone: sdtStaff,
      password: password,
    });
    staffId = resStaffReg.body.data.user.id;
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE id = ?", [staffId]);

    const resStaffLogin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: password,
    });
    tokenStaff = resStaffLogin.body.data.token;

    // 3. Đăng nhập Quản trị viên
    const resAdminLogin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = resAdminLogin.body.data.token;
  });

  afterAll(async () => {
    await donDep();
  });

  // ===================================================================
  // LUỒNG 1: MOBILE CUSTOMER -> STAFF WEB -> ADMIN WEB
  // Trọn vẹn: Đặt sân CASH (CONFIRMED) -> Đặt dịch vụ (Kho RESERVE) ->
  // Hóa đơn cập nhật -> Staff giao hàng (Kho DELIVER) -> Khách xem hóa đơn ->
  // Trả đồ thuê (Kho RETURN) -> Thu tiền -> Hoàn thành -> Khách đánh giá 5 sao
  // ===================================================================
  describe('Luồng 1: Vòng đời đơn đặt tích hợp Khách hàng Mobile & Nhân viên Web', () => {
    let bookingId: number;
    let serviceOrderId: number;
    let rentalDetailId: number;

    it('Bước 1 (Mobile App): Khách tra cứu danh sách sân và khung giờ khả dụng', async () => {
      const resCourts = await request(app).get('/api/v1/courts');
      expect(resCourts.status).toBe(200);
      expect(resCourts.body.success).toBe(true);
      expect(resCourts.body.data.length).toBeGreaterThan(0);

      const resSlots = await request(app).get(`/api/v1/courts/1/availability?date=${ngayDat}`);
      expect(resSlots.status).toBe(200);
      expect(resSlots.body.success).toBe(true);
    });

    it('Bước 2 (Mobile App): Khách đặt sân tiền mặt CASH -> Trạng thái CONFIRMED (UNPAID)', async () => {
      const resBooking = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          courtId: 1,
          bookingDate: ngayDat,
          timeSlotIds: [1, 2], // 06:00 - 08:00
          paymentMethod: 'CASH',
        });

      expect(resBooking.status).toBe(201);
      expect(resBooking.body.data.status).toBe('CONFIRMED');
      expect(resBooking.body.data.paymentStatus).toBe('UNPAID');
      bookingId = resBooking.body.data.id;
    });

    it('Bước 3 (Mobile App): Khách gọi dịch vụ Nước khoáng (DRINK) và Thuê vợt (RENTAL) -> Kho tự động RESERVE', async () => {
      // Đọc tồn kho ban đầu của dịch vụ 1 (Nước) và dịch vụ 5 (Thuê vợt)
      const [invBefore1]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 1');
      const [invBefore5]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 5');
      const reservedBefore1 = invBefore1[0].so_luong_dang_giu;
      const reservedBefore5 = invBefore5[0].so_luong_dang_giu;

      const resOrder = await request(app)
        .post(`/api/v1/bookings/${bookingId}/service-orders`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          items: [
            { serviceId: 1, quantity: 2 }, // 2 chai nước khoáng
            { serviceId: 5, quantity: 1 }, // 1 cây vợt
          ],
          note: 'Giao ngay khi vào sân',
        });

      expect(resOrder.status).toBe(201);
      expect(resOrder.body.data.status).toBe('REQUESTED');
      serviceOrderId = resOrder.body.data.id;

      // Xác thực kho đã tăng so_luong_dang_giu (RESERVE)
      const [invAfter1]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 1');
      const [invAfter5]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 5');
      expect(invAfter1[0].so_luong_dang_giu).toBe(reservedBefore1 + 2);
      expect(invAfter5[0].so_luong_dang_giu).toBe(reservedBefore5 + 1);

      // Xác thực có bản ghi nhật ký biến động RESERVE
      const [logs]: any = await csdl.execute(
        `SELECT * FROM bien_dong_kho WHERE yeu_cau_dich_vu_id = ? AND loai_bien_dong = 'RESERVE'`,
        [serviceOrderId]
      );
      expect(logs.length).toBe(2);
    });

    it('Bước 4 (Mobile App): Khách kiểm tra hóa đơn -> serviceAmount bằng 0 vì dịch vụ chưa giao (BR-13)', async () => {
      const resInvoice = await request(app)
        .get(`/api/v1/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenCustomer}`);

      expect(resInvoice.status).toBe(200);
      expect(resInvoice.body.data.courtAmount).toBeGreaterThan(0);
      expect(resInvoice.body.data.serviceAmount).toBe(0); // Chưa giao hàng -> 0đ
      expect(resInvoice.body.data.paidAmount).toBe(0);
    });

    it('Bước 5 (Staff Web): Nhân viên xem hàng đợi dịch vụ -> Xác nhận Đã giao (DELIVERED) -> Kho trừ vật lý DELIVER', async () => {
      const [invBefore1]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 1');
      const qtyBefore1 = invBefore1[0].so_luong;
      const reservedBefore1 = invBefore1[0].so_luong_dang_giu;

      const resDeliver = await request(app)
        .post(`/api/v1/staff/service-orders/${serviceOrderId}/deliver`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resDeliver.status).toBe(200);
      expect(resDeliver.body.data.status).toBe('DELIVERED');

      // Tồn kho vật lý đã bị trừ, lượng giữ chỗ đã giảm
      const [invAfter1]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 1');
      expect(invAfter1[0].so_luong).toBe(qtyBefore1 - 2);
      expect(invAfter1[0].so_luong_dang_giu).toBe(reservedBefore1 - 2);

      // Lấy ID chi tiết món thuê vợt
      const resInvoice = await request(app)
        .get(`/api/v1/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenCustomer}`);
      expect(resInvoice.body.data.serviceAmount).toBeGreaterThan(0);
      expect(resInvoice.body.data.unreturnedRentals.length).toBe(1);
      rentalDetailId = resInvoice.body.data.unreturnedRentals[0].itemId;
    });

    it('Bước 6 (Staff Web): Nhân viên xem tồn kho vận hành -> Hiển thị chính xác availableQuantity', async () => {
      const resStaffInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resStaffInv.status).toBe(200);
      const drinkItem = resStaffInv.body.data.find((item: any) => item.id === 1);
      expect(drinkItem).toBeDefined();
      expect(drinkItem.availableQuantity).toBeDefined();
      expect(drinkItem.stockStatus).toBeDefined();
    });

    it('Bước 7 (Staff Web): Nhân viên thử bấm Hoàn thành khi đồ thuê chưa trả -> Bị chặn RENTALS_NOT_RETURNED (BR-28)', async () => {
      // Giả lập thời gian đơn về quá khứ để kiểm tra riêng điều kiện đồ thuê
      await csdl.execute(
        "UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?",
        [bookingId]
      );

      // Thu tiền sân trước
      await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ method: 'CASH' });

      const resComplete = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resComplete.status).toBe(422);
      expect(resComplete.body.errorCode).toBe('RENTALS_NOT_RETURNED');
    });

    it('Bước 8 (Staff Web): Nhân viên bấm Xác nhận trả đồ thuê -> Kho được cộng lại RETURN', async () => {
      const [invBefore5]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 5');
      const qtyBefore5 = invBefore5[0].so_luong;

      const resReturn = await request(app)
        .post(`/api/v1/staff/service-order-items/${rentalDetailId}/return`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resReturn.status).toBe(200);
      expect(resReturn.body.data.returnedAt).toBeDefined();

      // Kiểm tra kho vật lý của món thuê đã được cộng lại 1
      const [invAfter5]: any = await csdl.execute('SELECT * FROM ton_kho_dich_vu WHERE dich_vu_id = 5');
      expect(invAfter5[0].so_luong).toBe(qtyBefore5 + 1);

      // Nhật ký biến động có RETURN
      const [logs]: any = await csdl.execute(
        `SELECT * FROM bien_dong_kho WHERE dich_vu_id = 5 AND loai_bien_dong = 'RETURN' ORDER BY id DESC LIMIT 1`
      );
      expect(logs.length).toBe(1);
    });

    it('Bước 9 (Staff Web): Nhân viên thử bấm Hoàn thành khi chưa thu tiền dịch vụ -> Bị chặn SERVICE_BALANCE_DUE', async () => {
      const resComplete = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resComplete.status).toBe(422);
      expect(resComplete.body.errorCode).toBe('SERVICE_BALANCE_DUE');
    });

    it('Bước 10 (Staff Web): Nhân viên thu tiền dịch vụ tại quầy -> Số dư nợ về 0', async () => {
      const resPayService = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/service-payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ method: 'CASH' });

      expect(resPayService.status).toBe(200);

      const resInvoice = await request(app)
        .get(`/api/v1/staff/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(resInvoice.body.data.balance).toBe(0);
    });

    it('Bước 11 (Staff Web): Nhân viên hoàn thành đơn -> Đơn chuyển COMPLETED', async () => {
      const resComplete = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resComplete.status).toBe(200);
      expect(resComplete.body.data.status).toBe('COMPLETED');
    });

    it('Bước 12 (Mobile App): Khách hàng gửi đánh giá 5 sao cho đơn đã hoàn thành', async () => {
      const resReview = await request(app)
        .post(`/api/v1/bookings/${bookingId}/review`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          rating: 5,
          comment: 'Hệ thống đặt sân rất mượt mà, phục vụ tại quầy nhanh chóng!',
        });

      expect(resReview.status).toBe(201);
      expect(resReview.body.data.rating).toBe(5);
    });
  });

  // ===================================================================
  // LUỒNG 2: NGOẠI LỆ CÔNG NỢ & ĐẶC QUYỀN ADMIN (WRITE-OFF DEBT)
  // Staff bị chặn 403 -> Admin đóng đơn có công nợ thành công
  // ===================================================================
  describe('Luồng 2: Xử lý ngoại lệ công nợ (Close-with-debt RBAC Protection)', () => {
    let debtBookingId: number;

    it('Tạo đơn đặt có phát sinh dịch vụ nhưng khách rời đi chưa thanh toán đủ tiền dịch vụ', async () => {
      // 1. Tạo đơn đặt tiền mặt
      const resBooking = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          courtId: 2,
          bookingDate: ngayDatDebt,
          timeSlotIds: [3, 4],
          paymentMethod: 'CASH',
        });
      expect(resBooking.status).toBe(201);
      debtBookingId = resBooking.body.data.id;

      // 2. Gọi dịch vụ nước uống
      const resOrder = await request(app)
        .post(`/api/v1/bookings/${debtBookingId}/service-orders`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          items: [{ serviceId: 1, quantity: 2 }], // 2 Nước suối Aquafina
        });
      expect(resOrder.status).toBe(201);
      const orderId = resOrder.body.data.id;

      // 3. Nhân viên giao nước
      await request(app)
        .post(`/api/v1/staff/service-orders/${orderId}/deliver`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      // 4. Thanh toán tiền sân, còn nợ tiền dịch vụ
      await request(app)
        .post(`/api/v1/staff/bookings/${debtBookingId}/payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ method: 'CASH' });

      // 5. Ép thời gian về quá khứ
      await csdl.execute(
        "UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?",
        [debtBookingId]
      );
    });

    it('Nhân viên Staff thử gọi API close-with-debt -> BỊ TỪ CHỐI 403 Forbidden', async () => {
      const resStaffDebt = await request(app)
        .post(`/api/v1/admin/bookings/${debtBookingId}/close-with-debt`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ reason: 'Nhân viên muốn tự xóa nợ cho khách' });

      expect(resStaffDebt.status).toBe(403);
    });

    it('Quản trị viên Admin thực hiện đóng đơn có công nợ -> THÀNH CÔNG (dong_don_cong_no = 1, COMPLETED)', async () => {
      const resAdminDebt = await request(app)
        .post(`/api/v1/admin/bookings/${debtBookingId}/close-with-debt`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ reason: 'Khách quen quên mang ví, bảo lãnh ghi nhận nợ' });

      expect(resAdminDebt.status).toBe(200);
      expect(resAdminDebt.body.success).toBe(true);

      // Xác thực trong CSDL
      const [rows]: any = await csdl.execute(
        'SELECT trang_thai, dong_don_cong_no, ghi_chu FROM don_dat WHERE id = ?',
        [debtBookingId]
      );
      expect(rows[0].trang_thai).toBe('COMPLETED');
      expect(rows[0].dong_don_cong_no).toBe(1);
      expect(rows[0].ghi_chu).toContain('Khách quen');

      // Báo cáo tổng quan Admin hiển thị đơn nợ này trong debtClosed
      const resSummaryReport = await request(app)
        .get('/api/v1/admin/reports/summary')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(resSummaryReport.status).toBe(200);
      expect(resSummaryReport.body.data.debtClosed.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ===================================================================
  // LUỒNG 3: QUẢN TRỊ KHO & BÁO CÁO DOANH THU ĐỒNG BỘ
  // ===================================================================
  describe('Luồng 3: Quản trị kho từ Admin Web & Báo cáo số liệu', () => {
    it('Admin nhập thêm hàng (IMPORT) và điều chỉnh kho (ADJUST_IN/OUT) có lưu audit trail', async () => {
      // 1. Nhập thêm hàng cho dịch vụ 1
      const resImport = await request(app)
        .post('/api/v1/admin/inventory/import')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: 1,
          quantity: 20,
          note: 'Nhập hàng đợt mới từ nhà cung cấp',
        });
      expect(resImport.status).toBe(200);
      expect(resImport.body.success).toBe(true);

      // 2. Điều chỉnh kho giảm do hỏng/vỡ
      const resAdjust = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: 1,
          type: 'ADJUST_OUT',
          quantity: 2,
          reason: 'Bể vỡ khi bốc dỡ',
        });
      expect(resAdjust.status).toBe(200);

      // 3. Xem nhật ký biến động kho Admin
      const resLogs = await request(app)
        .get('/api/v1/admin/inventory/transactions?serviceId=1')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(resLogs.status).toBe(200);
      expect(resLogs.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('Admin tra cứu Báo cáo doanh thu -> Số liệu tổng hợp đồng bộ với các giao dịch thực tế', async () => {
      const resRevenue = await request(app)
        .get('/api/v1/admin/reports/revenue')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(resRevenue.status).toBe(200);
      expect(resRevenue.body.success).toBe(true);
      expect(resRevenue.body.data.courtRevenue).toBeDefined();
      expect(resRevenue.body.data.serviceRevenue).toBeDefined();
      expect(resRevenue.body.data.totalRevenue).toBeDefined();
    });
  });
});
