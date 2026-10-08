// =====================================================================
// KIỂM THỬ TÍCH HỢP TOÀN DIỆN END-TO-END (E1 -> E5)
// Theo đặc tả tài liệu Plant/11-end-to-end-flows.md
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { quetDonHetHan } from '../src/jobs/hethan-dondat.job';

describe('Luồng Tích Hợp End-to-End Vận Hành (E1 -> E5 - Plant/11)', () => {
  const sdtKhachE1 = '0981111111';
  const sdtKhachE2 = '0982222222';
  const sdtKhachE3 = '0983333333';
  const sdtStaff = '0907777777';
  const sdtVangLai = '0977889900';
  const matKhauChung = 'password123';

  let tokenKhachE1: string;
  let tokenKhachE2: string;
  let tokenKhachE3: string;
  let tokenStaff: string;

  // Sử dụng ngày cách hôm nay 2 ngày để luôn hợp lệ trong dải BR-03 (14 ngày)
  const ngayDat = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayDatE2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayDatE3 = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayDatE5 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  const danhSachNgay = [ngayDat, ngayDatE2, ngayDatE3, ngayDatE5];
  const ngayIn = danhSachNgay.map(() => '?').join(',');

  async function donDep() {
    const sdts = [sdtKhachE1, sdtKhachE2, sdtKhachE3, sdtStaff];
    const sdtIn = sdts.map(() => '?').join(',');

    // 1. Xóa toàn bộ dữ liệu đơn của khách vãng lai
    await csdl.execute(
      `DELETE FROM bien_dong_kho WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
        SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (
          SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
        )
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE so_dien_thoai_khach = ?
      )`,
      [sdtVangLai]
    );
    await csdl.execute(
      `DELETE FROM don_dat WHERE so_dien_thoai_khach = ?`,
      [sdtVangLai]
    );

    // 2. Xóa toàn bộ dữ liệu đơn của các khách hàng test
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
        SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (
          SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
        )
      )`,
      sdts
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
      )`,
      sdts
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
      )`,
      sdts
    );
    await csdl.execute(
      `DELETE FROM danh_gia WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
      )`,
      sdts
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
      )`,
      sdts
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))
      )`,
      sdts
    );

    // 3. Gỡ các khóa ngoại tham chiếu đến nguoi_dung
    await csdl.execute(
      `UPDATE thanh_toan SET nguoi_xu_ly_id = NULL WHERE nguoi_xu_ly_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      sdts
    );
    await csdl.execute(
      `UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      sdts
    );
    await csdl.execute(
      `UPDATE chi_tiet_yeu_cau_dich_vu SET nguoi_nhan_tra_id = NULL WHERE nguoi_nhan_tra_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      sdts
    );
    await csdl.execute(
      `UPDATE yeu_cau_dich_vu SET nguoi_giao_id = NULL, nguoi_yeu_cau_id = NULL WHERE nguoi_giao_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn})) OR nguoi_yeu_cau_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      [...sdts, ...sdts]
    );
    await csdl.execute(
      `UPDATE don_dat SET nguoi_tao_id = NULL WHERE nguoi_tao_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      sdts
    );

    // 4. Xóa đơn đặt và tài khoản test
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn}))`,
      sdts
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai IN (${sdtIn})`, sdts);
  }

  beforeAll(async () => {
    await donDep();
    await csdl.execute("UPDATE dich_vu SET trang_thai = 'ACTIVE' WHERE id IN (1, 2, 5)");
    await csdl.execute('UPDATE ton_kho_dich_vu SET so_luong = 100, so_luong_dang_giu = 0 WHERE dich_vu_id IN (1, 2, 5)');

    // 1. Tạo Khách E1
    const resE1 = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng E1',
      phone: sdtKhachE1,
      password: matKhauChung,
    });
    tokenKhachE1 = resE1.body.data.token;

    // 2. Tạo Khách E2
    const resE2 = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng E2',
      phone: sdtKhachE2,
      password: matKhauChung,
    });
    tokenKhachE2 = resE2.body.data.token;

    // 3. Tạo Khách E3
    const resE3 = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng E3',
      phone: sdtKhachE3,
      password: matKhauChung,
    });
    tokenKhachE3 = resE3.body.data.token;

    // 4. Tạo Staff
    const resStaff = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Vận Hành E2E',
      phone: sdtStaff,
      password: matKhauChung,
    });
    tokenStaff = resStaff.body.data.token;

    // Cập nhật vai trò thành STAFF
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?", [sdtStaff]);

    // Đăng nhập lại để lấy token có role STAFF
    const resLoginStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: matKhauChung,
    });
    tokenStaff = resLoginStaff.body.data.token;
  });

  afterAll(async () => {
    await donDep();
  });

  // ===================================================================
  // KỊCH BẢN E1: Buổi chơi trọn vẹn có dịch vụ
  // Đặt CASH -> Gọi dịch vụ -> Giao đồ -> Trả đồ thuê -> Thu tiền -> Hoàn thành -> Đánh giá
  // ===================================================================
  describe('E1: Buổi chơi trọn vẹn có dịch vụ và đánh giá', () => {
    let bookingId: number;
    let serviceOrderId: number;
    let rentalItemId: number;

    it('Bước 1-3: Khách đặt sân CASH (CONFIRMED / UNPAID)', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachE1}`)
        .send({
          courtId: 1,
          bookingDate: ngayDat,
          timeSlotIds: [1, 2], // 06:00 - 08:00
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.paymentStatus).toBe('UNPAID');
      bookingId = res.body.data.id;
    });

    it('Bước 4: Khách gọi dịch vụ (Nước uống + Thuê vợt) -> serviceAmount ban đầu là 0 (chưa giao - BR-13)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/service-orders`)
        .set('Authorization', `Bearer ${tokenKhachE1}`)
        .send({
          items: [
            { serviceId: 1, quantity: 2 }, // Nước suối (DRINK)
            { serviceId: 5, quantity: 1 }, // Thuê vợt cầu lông (RENTAL)
          ],
          note: 'Mang thêm khăn lạnh nếu có',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('REQUESTED');
      serviceOrderId = res.body.data.id;

      // Hóa đơn lúc này chưa tính tiền dịch vụ do chưa giao (BR-13)
      const resInvoice = await request(app)
        .get(`/api/v1/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenKhachE1}`);
      expect(resInvoice.body.data.serviceAmount).toBe(0);
    });

    it('Bước 5: Nhân viên bấm Đã giao (DELIVERED) -> serviceAmount tăng lên và xuất hiện trong unreturnedRentals', async () => {
      const res = await request(app)
        .post(`/api/v1/staff/service-orders/${serviceOrderId}/deliver`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DELIVERED');

      // Kiểm tra hóa đơn đã tính tiền dịch vụ
      const resInvoice = await request(app)
        .get(`/api/v1/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenKhachE1}`);
      expect(resInvoice.body.data.serviceAmount).toBeGreaterThan(0);

      // Lấy id của món đồ thuê để trả ở bước tiếp
      const rentals = resInvoice.body.data.unreturnedRentals;
      expect(rentals.length).toBeGreaterThan(0);
      rentalItemId = rentals[0].itemId;
    });

    it('Bước 6: Nhân viên thử bấm Hoàn thành trước khi trả đồ thuê -> Bị chặn RENTALS_NOT_RETURNED (BR-28)', async () => {
      // Ép thời gian đơn về quá khứ để test riêng điều kiện đồ thuê (tránh bị chặn bởi TOO_EARLY trước)
      await csdl.execute(
        "UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?",
        [bookingId]
      );

      // Thanh toán tiền sân trước
      await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ method: 'CASH' });

      const res = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('RENTALS_NOT_RETURNED');
    });

    it('Bước 7: Nhân viên nhận lại đồ thuê', async () => {
      const res = await request(app)
        .post(`/api/v1/staff/service-order-items/${rentalItemId}/return`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(res.status).toBe(200);
      expect(res.body.data.returnedAt).toBeDefined();
    });

    it('Bước 8: Nhân viên thử Hoàn thành trước khi thu tiền dịch vụ -> Bị chặn SERVICE_BALANCE_DUE (BR-28)', async () => {
      const res = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('SERVICE_BALANCE_DUE');
    });

    it('Bước 9-10: Nhân viên thu tiền dịch vụ CASH -> balance còn thiếu về 0', async () => {
      const res = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/service-payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          method: 'CASH',
        });

      expect(res.status).toBe(200);

      // Kiểm tra hóa đơn: balance phải bằng 0
      const resInvoiceAfter = await request(app)
        .get(`/api/v1/staff/bookings/${bookingId}/invoice`)
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(resInvoiceAfter.body.data.balance).toBe(0);
    });

    it('Bước 11: Nhân viên bấm Hoàn thành (COMPLETED) thành công', async () => {
      const res = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('Bước 12: Khách hàng đánh giá sân 5 sao sau khi đơn COMPLETED', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/review`)
        .set('Authorization', `Bearer ${tokenKhachE1}`)
        .send({
          rating: 5,
          comment: 'Sân đẹp, phục vụ nước và vợt rất chu đáo!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(5);
    });
  });

  // ===================================================================
  // KỊCH BẢN E2: Đặt sân chuyển khoản (BANK_TRANSFER)
  // Nhánh 1: Xác nhận thanh toán -> CONFIRMED/PAID
  // Nhánh 2: Quá hạn 30 phút -> Job quét hủy tự động EXPIRED
  // ===================================================================
  describe('E2: Đặt chuyển khoản BANK_TRANSFER & Job quét hết hạn', () => {
    it('E2a: Đặt BANK_TRANSFER -> Trạng thái PENDING, có expiresAt -> Nhân viên xác nhận thanh toán -> CONFIRMED', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachE2}`)
        .send({
          courtId: 1,
          bookingDate: ngayDatE2,
          timeSlotIds: [3, 4], // 08:00 - 10:00
          paymentMethod: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.paymentStatus).toBe('UNPAID');
      expect(res.body.data.expiresAt).toBeDefined();

      const bookingId = res.body.data.id;

      // Nhân viên xác nhận thanh toán
      const resPay = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          method: 'BANK_TRANSFER',
          transactionRef: 'VCB-E2-998877',
        });

      expect(resPay.status).toBe(200);
      expect(resPay.body.data.status).toBe('CONFIRMED');
      expect(resPay.body.data.paymentStatus).toBe('PAID');
    });

    it('E2b: Đơn BANK_TRANSFER quá hạn giữ chỗ -> Background Job quét và hủy thành EXPIRED, mở lại slot', async () => {
      // 1. Tạo đơn đặt BANK_TRANSFER
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachE2}`)
        .send({
          courtId: 2,
          bookingDate: ngayDatE2,
          timeSlotIds: [5], // 10:00 - 11:00
          paymentMethod: 'BANK_TRANSFER',
        });

      expect(res.status).toBe(201);
      const bookingId = res.body.data.id;

      // 2. Ép het_han_luc lùi về 10 phút trước trong DB để giả lập quá hạn
      await csdl.execute(
        'UPDATE don_dat SET het_han_luc = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
        [bookingId]
      );

      // 3. Kích hoạt job quét đơn hết hạn
      const soDon = await quetDonHetHan();
      expect(soDon).toBeGreaterThanOrEqual(1);

      // 4. Kiểm tra trạng thái đơn đã đổi thành EXPIRED
      const [rows]: any = await csdl.execute('SELECT trang_thai FROM don_dat WHERE id = ?', [bookingId]);
      expect(rows[0].trang_thai).toBe('EXPIRED');

      // 5. Kiểm tra slot đã được mở khóa (dang_khoa = NULL)
      const [slotRows]: any = await csdl.execute(
        'SELECT dang_khoa FROM chi_tiet_khung_gio_dat WHERE don_dat_id = ?',
        [bookingId]
      );
      expect(slotRows[0].dang_khoa).toBeNull();
    });
  });

  // ===================================================================
  // KỊCH BẢN E3: Khách hủy đơn đã thanh toán & Quy trình hoàn tiền
  // ===================================================================
  describe('E3: Khách hủy đơn đã thanh toán kèm refundInfo & Nhân viên hoàn tiền', () => {
    let bookingId: number;

    it('Tạo đơn CASH và đã thanh toán trước', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachE3}`)
        .send({
          courtId: 2,
          bookingDate: ngayDatE3,
          timeSlotIds: [6, 7], // 11:00 - 13:00
          paymentMethod: 'CASH',
        });
      expect(res.status).toBe(201);
      bookingId = res.body.data.id;

      // Xác nhận thanh toán
      await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({ method: 'CASH' });
    });

    it('Nhánh lỗi: Khách hủy đơn đã trả tiền nhưng KHÔNG gửi refundInfo -> 422 REFUND_INFO_REQUIRED (BR-34)', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${tokenKhachE3}`)
        .send({
          reason: 'Bận việc đột xuất',
        });

      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('REFUND_INFO_REQUIRED');
    });

    it('Nhánh thành công: Khách hủy có refundInfo -> Đơn CANCELLED, tạo bản ghi REFUND PENDING', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${tokenKhachE3}`)
        .send({
          reason: 'Bận việc gia đình',
          refundInfo: 'MB Bank - 0983333333 - NGUYEN VAN E3',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Kiểm tra trong bảng thanh toán có dòng REFUND PENDING
      const [pRows]: any = await csdl.execute(
        "SELECT loai_giao_dich, trang_thai, ghi_chu FROM thanh_toan WHERE don_dat_id = ? AND loai_giao_dich = 'REFUND'",
        [bookingId]
      );
      expect(pRows.length).toBe(1);
      expect(pRows[0].trang_thai).toBe('PENDING');
      expect(pRows[0].ghi_chu).toContain('MB Bank');
    });

    it('Nhân viên xem danh sách Chờ hoàn tiền -> Xác nhận hoàn tiền (confirm-refund)', async () => {
      // 1. Lấy danh sách refund PENDING
      const resList = await request(app)
        .get('/api/v1/staff/refunds?status=PENDING')
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resList.status).toBe(200);
      const items = resList.body.data.items || [];
      const refundItem = items.find((r: any) => r.booking?.id === bookingId);
      expect(refundItem).toBeDefined();

      // 2. Xác nhận hoàn tiền
      const resConfirm = await request(app)
        .post(`/api/v1/staff/payments/${refundItem.paymentId}/confirm-refund`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          transactionRef: 'REFUND-MB-888999',
        });

      expect(resConfirm.status).toBe(200);
      expect(resConfirm.body.success).toBe(true);

      // 3. Kiểm tra payment_status của đơn đặt đổi thành REFUNDED
      const [bRows]: any = await csdl.execute('SELECT trang_thai_thanh_toan FROM don_dat WHERE id = ?', [bookingId]);
      expect(bRows[0].trang_thai_thanh_toan).toBe('REFUNDED');
    });
  });

  // ===================================================================
  // KỊCH BẢN E4: Đặt tại quầy (Walk-in) & Thêm dịch vụ trực tiếp
  // ===================================================================
  describe('E4: Đặt tại quầy bởi Nhân viên (Walk-in) & Thêm dịch vụ DELIVERED (BR-31)', () => {
    it('Nhân viên tạo đơn tại quầy cho khách và thêm dịch vụ vào thẳng DELIVERED', async () => {
      // 1. Đặt tại quầy
      const resBooking = await request(app)
        .post('/api/v1/staff/bookings')
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          courtId: 3,
          bookingDate: ngayDat,
          timeSlotIds: [8, 9], // 13:00 - 15:00
          guestName: 'Khách Vãng Lai Trực Tiếp',
          guestPhone: sdtVangLai,
          payNow: true,
          paymentMethod: 'CASH',
        });

      expect(resBooking.status).toBe(201);
      expect(resBooking.body.data.status).toBe('CONFIRMED');
      expect(resBooking.body.data.paymentStatus).toBe('PAID');
      expect(resBooking.body.data.source).toBe('STAFF');

      const bookingId = resBooking.body.data.id;

      // 2. Thêm dịch vụ tại quầy -> Theo BR-31 vào thẳng trạng thái DELIVERED
      const resService = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/service-orders`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          items: [
            { serviceId: 2, quantity: 3 }, // Nước tăng lực Redbull
          ],
          note: 'Khách lấy trực tiếp tại quầy',
        });

      expect(resService.status).toBe(201);
      expect(resService.body.data.status).toBe('DELIVERED');

      // 3. Thu tiền dịch vụ
      await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/service-payments`)
        .set('Authorization', `Bearer ${tokenStaff}`)
        .send({
          method: 'CASH',
        });

      // 4. Ép thời gian về quá khứ để hoàn thành theo BR-12
      await csdl.execute(
        "UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?",
        [bookingId]
      );

      // 5. Hoàn thành đơn
      const resComplete = await request(app)
        .post(`/api/v1/staff/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${tokenStaff}`);

      expect(resComplete.status).toBe(200);
      expect(resComplete.body.data.status).toBe('COMPLETED');
    });
  });

  // ===================================================================
  // KỊCH BẢN E5: Khu sự kiện / Tiệc (EVENT Category)
  // ===================================================================
  describe('E5: Đặt Khu Sự Kiện / Tiệc (Category EVENT)', () => {
    it('Lấy danh sách sân category EVENT và đặt 3 slot liên tiếp', async () => {
      // 1. Lọc sân category EVENT
      const resCourts = await request(app).get('/api/v1/courts?category=EVENT');
      expect(resCourts.status).toBe(200);
      expect(resCourts.body.data.length).toBeGreaterThan(0);

      const eventCourt = resCourts.body.data[0];
      expect(eventCourt.category).toBe('EVENT');
      expect(eventCourt.capacity).toBeDefined();

      // 2. Khách đặt 3 slot liên tiếp phòng sự kiện
      const resBooking = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenKhachE1}`)
        .send({
          courtId: eventCourt.id,
          bookingDate: ngayDatE5,
          timeSlotIds: [10, 11, 12], // 15:00 - 18:00
          paymentMethod: 'CASH',
        });

      expect(resBooking.status).toBe(201);
      expect(resBooking.body.data.status).toBe('CONFIRMED');
      expect(resBooking.body.data.slots.length).toBe(3);
    });
  });
});
