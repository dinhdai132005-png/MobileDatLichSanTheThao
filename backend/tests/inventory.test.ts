/// <reference types="jest" />
// =====================================================================
// KIỂM THỬ TOÀN DIỆN HỆ THỐNG QUẢN LÝ TỒN KHO & ĐỒNG THỜI (CONCURRENCY)
// Đáp ứng: MASTER PROMPT Phần XII -> XVII, LVI, LVII
// Kiểm tra: Import, Adjust, Reserve, Release, Deliver, Return, Threshold, Concurrency
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { RowDataPacket } from 'mysql2/promise';

process.env.TZ = 'Asia/Ho_Chi_Minh';

describe('Quản lý Tồn kho & Kiểm thử tranh chấp đồng thời (Inventory Concurrency)', () => {
  const sdtCustomer = '0985555551';
  const sdtStaff = '0905555552';
  const sdtAdmin = '0900000001';

  let tokenCustomer: string;
  let tokenStaff: string;
  let tokenAdmin: string;
  let customerId: number;
  let staffId: number;

  let testServiceId: number;
  let testDonDatId: number;

  async function donDep() {
    if (testDonDatId) {
      await csdl.execute('DELETE FROM bien_dong_kho WHERE don_dat_id = ?', [testDonDatId]);
      await csdl.execute(
        `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
          SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ?
        )`,
        [testDonDatId]
      );
      await csdl.execute('DELETE FROM yeu_cau_dich_vu WHERE don_dat_id = ?', [testDonDatId]);
      await csdl.execute('DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id = ?', [testDonDatId]);
      await csdl.execute('DELETE FROM thanh_toan WHERE don_dat_id = ?', [testDonDatId]);
      await csdl.execute('DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id = ?', [testDonDatId]);
      await csdl.execute('DELETE FROM don_dat WHERE id = ?', [testDonDatId]);
    }

    await csdl.execute(
      `DELETE FROM bien_dong_kho WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten IN ('Vợt Tennis Thử Nghiệm', 'Nước Chanh Muối Giới Hạn'))`
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten IN ('Vợt Tennis Thử Nghiệm', 'Nước Chanh Muối Giới Hạn'))`
    );
    await csdl.execute(
      `DELETE FROM ton_kho_dich_vu WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten IN ('Vợt Tennis Thử Nghiệm', 'Nước Chanh Muối Giới Hạn'))`
    );
    await csdl.execute(`DELETE FROM dich_vu WHERE ten IN ('Vợt Tennis Thử Nghiệm', 'Nước Chanh Muối Giới Hạn')`);

    await csdl.execute(
      `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (
        SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (
          SELECT id FROM don_dat WHERE nguoi_dung_id IN (
            SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
          )
        )
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM thanh_toan WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (
        SELECT id FROM don_dat WHERE nguoi_dung_id IN (
          SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
        )
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `DELETE FROM don_dat WHERE nguoi_dung_id IN (
        SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(
      `UPDATE bien_dong_kho SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (
        SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)
      )`,
      [sdtCustomer, sdtStaff]
    );
    await csdl.execute(`DELETE FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)`, [sdtCustomer, sdtStaff]);
  }

  beforeAll(async () => {
    await donDep();

    // 1. Tạo Customer
    const resCust = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng Inventory Test',
      phone: sdtCustomer,
      password: 'password123',
    });
    tokenCustomer = resCust.body.data.token;
    customerId = resCust.body.data.user.id;

    // 2. Tạo Staff
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Inventory Test',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute(`UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?`, [sdtStaff]);
    const resStaff = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = resStaff.body.data.token;
    staffId = resStaff.body.data.user.id;

    // 3. Đăng nhập Admin
    const resAdmin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = resAdmin.body.data.token;

    // 4. Tạo dịch vụ mẫu riêng cho test: "Vợt Tennis Cao Cấp" (RENTAL)
    const resSvc = await request(app)
      .post('/api/v1/admin/services')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        name: 'Vợt Tennis Thử Nghiệm',
        type: 'RENTAL',
        unit: 'cây',
        price: 50000,
        description: 'Vợt phục vụ kiểm thử kho',
      });
    testServiceId = resSvc.body.data.id;

    // 5. Tạo 1 booking CONFIRMED của khách để test gọi dịch vụ
    const [donRes] = await csdl.execute<any>(
      `INSERT INTO don_dat (
         ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
         tien_san, phuong_thuc_thanh_toan, trang_thai, trang_thai_thanh_toan
       ) VALUES ('BKTSTINV01', ?, 1, '2026-10-25', '08:00', '09:00', 100000, 'BANK_TRANSFER', 'CONFIRMED', 'PAID')`,
      [customerId]
    );
    testDonDatId = donRes.insertId;

    await csdl.execute(
      `INSERT INTO chi_tiet_khung_gio_dat (don_dat_id, san_id, khung_gio_id, ngay_dat, gia)
       VALUES (?, 1, 1, '2026-10-25', 100000)`,
      [testDonDatId]
    );
  });

  afterAll(async () => {
    await donDep();
  });

  describe('1. Khởi tạo Tồn kho & Trạng thái Ban đầu', () => {
    it('Dịch vụ mới tạo có bản ghi ton_kho_dich_vu với so_luong = 0', async () => {
      const res = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(res.status).toBe(200);

      const item = res.body.data.find((d: any) => d.id === testServiceId);
      expect(item).toBeDefined();
      expect(item.quantity).toBe(0);
      expect(item.reservedQuantity).toBe(0);
      expect(item.availableQuantity).toBe(0);
      expect(item.stockStatus).toBe('OUT_OF_STOCK');
    });

    it('Khách hàng xem danh mục dịch vụ chỉ thấy isAvailable (ẩn chi tiết số lượng kho)', async () => {
      const res = await request(app).get('/api/v1/services');
      expect(res.status).toBe(200);

      const item = res.body.data.find((d: any) => d.id === testServiceId);
      expect(item).toBeDefined();
      expect(item.isAvailable).toBe(false); // Hết hàng vì số lượng = 0
      // Đảm bảo không lộ thông tin số lượng tồn hoặc ngưỡng cảnh báo cho khách
      expect(item.quantity).toBeUndefined();
      expect(item.reservedQuantity).toBeUndefined();
      expect(item.threshold).toBeUndefined();
    });
  });

  describe('2. Nhập kho & Điều chỉnh kho (Admin Operations)', () => {
    it('Admin Nhập kho (IMPORT) 20 đơn vị -> Tồn kho tăng lên 20 và ghi log IMPORT', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/import')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: testServiceId,
          quantity: 20,
          note: 'Nhập lô hàng vợt mới về',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(20);
      expect(res.body.data.availableQuantity).toBe(20);

      // Kiểm tra biến động kho
      const [logs] = await csdl.execute<RowDataPacket[]>(
        `SELECT * FROM bien_dong_kho WHERE dich_vu_id = ? AND loai_bien_dong = 'IMPORT' ORDER BY id DESC LIMIT 1`,
        [testServiceId]
      );
      expect(logs.length).toBe(1);
      expect(logs[0].so_luong).toBe(20);
      expect(logs[0].so_luong_truoc).toBe(0);
      expect(logs[0].so_luong_sau).toBe(20);
    });

    it('Admin Điều chỉnh kho tăng (ADJUST_IN) 5 đơn vị -> Tồn kho thành 25', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: testServiceId,
          type: 'ADJUST_IN',
          quantity: 5,
          reason: 'Kiểm kê thực tế dư 5 cây',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(25);
      expect(res.body.data.availableQuantity).toBe(25);
    });

    it('Admin Điều chỉnh kho giảm (ADJUST_OUT) 3 đơn vị -> Tồn kho thành 22', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: testServiceId,
          type: 'ADJUST_OUT',
          quantity: 3,
          reason: '3 cây bị gãy trong kho',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.quantity).toBe(22);
      expect(res.body.data.availableQuantity).toBe(22);
    });

    it('Admin Điều chỉnh kho giảm vượt số lượng khả dụng -> 422 INSUFFICIENT_STOCK', async () => {
      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: testServiceId,
          type: 'ADJUST_OUT',
          quantity: 999,
          reason: 'Xuất vượt tồn',
        });
      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('INSUFFICIENT_STOCK');
    });

    it('Admin Cập nhật ngưỡng cảnh báo kho -> Thành công', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/inventory/${testServiceId}/threshold`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ threshold: 25 });
      expect(res.status).toBe(200);
      expect(res.body.data.threshold).toBe(25);

      // Hiện tại có 22 cây <= 25 (ngưỡng) -> stockStatus phải là LOW_STOCK
      const resInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      const item = resInv.body.data.find((d: any) => d.id === testServiceId);
      expect(item.stockStatus).toBe('LOW_STOCK');
    });
  });

  describe('3. Đặt dịch vụ & Giữ chỗ kho (RESERVE, RELEASE, DELIVER, RETURN)', () => {
    let orderId: number;
    let orderItemId: number;

    it('Khách hàng yêu cầu đặt dịch vụ (5 cây) -> RESERVE 5, Available giảm còn 17', async () => {
      const resOrder = await request(app)
        .post(`/api/v1/bookings/${testDonDatId}/service-orders`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          items: [{ serviceId: testServiceId, quantity: 5 }],
        });
      expect(resOrder.status).toBe(201);
      orderId = resOrder.body.data.id;

      // Kiểm tra kho
      const resInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      const item = resInv.body.data.find((d: any) => d.id === testServiceId);
      expect(item.quantity).toBe(22);
      expect(item.reservedQuantity).toBe(5);
      expect(item.availableQuantity).toBe(17);

      // Kiểm tra nhật ký biến động kho có RESERVE
      const [logs] = await csdl.execute<RowDataPacket[]>(
        `SELECT * FROM bien_dong_kho WHERE yeu_cau_dich_vu_id = ? AND loai_bien_dong = 'RESERVE'`,
        [orderId]
      );
      expect(logs.length).toBe(1);
      expect(logs[0].so_luong).toBe(5);
    });

    it('Khách hàng đặt vượt quá số lượng khả dụng (yêu cầu 18 cây khi chỉ còn 17) -> 422 INSUFFICIENT_STOCK', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testDonDatId}/service-orders`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          items: [{ serviceId: testServiceId, quantity: 18 }],
        });
      expect(res.status).toBe(422);
      expect(res.body.errorCode).toBe('INSUFFICIENT_STOCK');
    });

    it('Khách hàng Hủy yêu cầu đang REQUESTED -> RELEASE 5 cây, Available phục hồi 22', async () => {
      const resCancel = await request(app)
        .post(`/api/v1/bookings/${testDonDatId}/service-orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({ reason: 'Khách đổi ý không thuê nữa' });
      expect(resCancel.status).toBe(200);

      // Kiểm tra kho phục hồi
      const resInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      const item = resInv.body.data.find((d: any) => d.id === testServiceId);
      expect(item.quantity).toBe(22);
      expect(item.reservedQuantity).toBe(0);
      expect(item.availableQuantity).toBe(22);

      // Kiểm tra nhật ký biến động kho có RELEASE
      const [logs] = await csdl.execute<RowDataPacket[]>(
        `SELECT * FROM bien_dong_kho WHERE yeu_cau_dich_vu_id = ? AND loai_bien_dong = 'RELEASE'`,
        [orderId]
      );
      expect(logs.length).toBe(1);
      expect(logs[0].so_luong).toBe(5);
    });

    it('Tạo yêu cầu mới và Staff Giao hàng (DELIVER) -> Trừ kho thực tế và giảm reserved', async () => {
      // 1. Tạo lại yêu cầu 4 cây
      const resNewOrder = await request(app)
        .post(`/api/v1/bookings/${testDonDatId}/service-orders`)
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          items: [{ serviceId: testServiceId, quantity: 4 }],
        });
      expect(resNewOrder.status).toBe(201);
      const newOrderId = resNewOrder.body.data.id;

      // 2. Staff xác nhận giao hàng
      const resDeliver = await request(app)
        .post(`/api/v1/staff/service-orders/${newOrderId}/deliver`)
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(resDeliver.status).toBe(200);

      // Tồn kho: tổng 22 - 4 = 18, reserved = 0, available = 18
      const resInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      const item = resInv.body.data.find((d: any) => d.id === testServiceId);
      expect(item.quantity).toBe(18);
      expect(item.reservedQuantity).toBe(0);
      expect(item.availableQuantity).toBe(18);

      // Lấy id chi tiết dịch vụ đồ thuê để test trả đồ
      const [items] = await csdl.execute<RowDataPacket[]>(
        `SELECT id FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id = ? LIMIT 1`,
        [newOrderId]
      );
      orderItemId = items[0].id;
    });

    it('Khách trả đồ thuê (RETURN) -> Hoàn trả tồn kho thực tế (+4 cây)', async () => {
      const resReturn = await request(app)
        .post(`/api/v1/staff/service-order-items/${orderItemId}/return`)
        .set('Authorization', `Bearer ${tokenStaff}`);
      expect(resReturn.status).toBe(200);

      // Tồn kho phục hồi về 22 (18 + 4)
      const resInv = await request(app)
        .get('/api/v1/staff/inventory')
        .set('Authorization', `Bearer ${tokenStaff}`);
      const item = resInv.body.data.find((d: any) => d.id === testServiceId);
      expect(item.quantity).toBe(22);
      expect(item.reservedQuantity).toBe(0);
      expect(item.availableQuantity).toBe(22);

      // Kiểm tra nhật ký biến động kho có RETURN
      const [logs] = await csdl.execute<RowDataPacket[]>(
        `SELECT * FROM bien_dong_kho WHERE dich_vu_id = ? AND loai_bien_dong = 'RETURN'`,
        [testServiceId]
      );
      expect(logs.length).toBe(1);
      expect(logs[0].so_luong).toBe(4);
    });

    it('Admin xem danh sách lịch sử biến động kho kiểm toán (/admin/inventory/transactions) -> Đầy đủ các loại', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/inventory/transactions?serviceId=${testServiceId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(5);

      const types = res.body.data.items.map((i: any) => i.type);
      expect(types).toContain('IMPORT');
      expect(types).toContain('ADJUST_IN');
      expect(types).toContain('ADJUST_OUT');
      expect(types).toContain('RESERVE');
      expect(types).toContain('RELEASE');
      expect(types).toContain('DELIVER');
      expect(types).toContain('RETURN');
    });
  });

  describe('4. Tranh chấp đồng thời (Concurrency Test - 15 requests cho 10 suất tồn)', () => {
    let limitedServiceId: number;

    beforeAll(async () => {
      // Dọn dẹp trước nếu còn tồn tại
      await csdl.execute(
        `DELETE FROM bien_dong_kho WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten = 'Nước Chanh Muối Giới Hạn')`
      );
      await csdl.execute(
        `DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten = 'Nước Chanh Muối Giới Hạn')`
      );
      await csdl.execute(
        `DELETE FROM ton_kho_dich_vu WHERE dich_vu_id IN (SELECT id FROM dich_vu WHERE ten = 'Nước Chanh Muối Giới Hạn')`
      );
      await csdl.execute(`DELETE FROM dich_vu WHERE ten = 'Nước Chanh Muối Giới Hạn'`);

      // Tạo một dịch vụ có đúng 10 sản phẩm
      const resSvc = await request(app)
        .post('/api/v1/admin/services')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          name: 'Nước Chanh Muối Giới Hạn',
          type: 'DRINK',
          unit: 'chai',
          price: 15000,
        });
      limitedServiceId = resSvc.body.data.id;

      // Nhập kho đúng 10 chai
      await request(app)
        .post('/api/v1/admin/inventory/import')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          serviceId: limitedServiceId,
          quantity: 10,
          note: 'Lô hàng có hạn 10 chai',
        });
    });

    afterAll(async () => {
      if (limitedServiceId) {
        await csdl.execute('DELETE FROM bien_dong_kho WHERE dich_vu_id = ?', [limitedServiceId]);
        await csdl.execute('DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE dich_vu_id = ?', [limitedServiceId]);
        await csdl.execute('DELETE FROM ton_kho_dich_vu WHERE dich_vu_id = ?', [limitedServiceId]);
        await csdl.execute('DELETE FROM dich_vu WHERE id = ?', [limitedServiceId]);
      }
    });

    it('15 yêu cầu đặt đồng thời (mỗi đơn 1 chai, tồn 10 chai) -> Đúng 10 thành công, 5 bị từ chối 422, tồn kho không âm', async () => {
      // Gửi 15 request đồng thời bằng Promise.all
      const requests = Array.from({ length: 15 }, () =>
        request(app)
          .post(`/api/v1/bookings/${testDonDatId}/service-orders`)
          .set('Authorization', `Bearer ${tokenCustomer}`)
          .send({
            items: [{ serviceId: limitedServiceId, quantity: 1 }],
          })
      );

      const results = await Promise.all(requests);

      const thanhCong = results.filter((r) => r.status === 201);
      const thatBai = results.filter((r) => r.status === 422 && r.body.errorCode === 'INSUFFICIENT_STOCK');

      expect(thanhCong.length).toBe(10);
      expect(thatBai.length).toBe(5);

      // Kiểm tra trạng thái tồn kho cuối cùng trong DB
      const [tkRows] = await csdl.execute<RowDataPacket[]>(
        `SELECT so_luong, so_luong_dang_giu FROM ton_kho_dich_vu WHERE dich_vu_id = ?`,
        [limitedServiceId]
      );
      expect(tkRows.length).toBe(1);
      const soLuong = Number(tkRows[0].so_luong);
      const dangGiu = Number(tkRows[0].so_luong_dang_giu);

      expect(soLuong).toBe(10);
      expect(dangGiu).toBe(10);
      expect(soLuong - dangGiu).toBe(0); // Không bị âm!

      // Số lượng bản ghi RESERVE trong bien_dong_kho phải chính xác là 10
      const [logs] = await csdl.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM bien_dong_kho WHERE dich_vu_id = ? AND loai_bien_dong = 'RESERVE'`,
        [limitedServiceId]
      );
      expect(Number(logs[0].total)).toBe(10);
    });
  });
});
