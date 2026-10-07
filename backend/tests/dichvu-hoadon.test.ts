// =====================================================================
// KIỂM THỬ DỊCH VỤ, HÓA ĐƠN & ĐÓNG ĐƠN CÔNG NỢ — TC-30 -> TC-36
// Đáp ứng: plant/06-api.md mục 5.13, 5.14, 5.15, 5.21; BR-24 -> BR-33
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';

describe('Kiểm thử Dịch vụ, Hóa đơn & Đóng đơn công nợ', () => {
  const sdtStaff = '0901234888';
  const sdtAdmin = '0900000001';
  let tokenStaff: string;
  let tokenAdmin: string;
  let donDatId: number;

  const ngayDat = '2026-10-18';
  const courtId = 2;
  const timeSlotId = 3;

  async function donDep() {
    if (donDatId) {
      await csdl.execute('DELETE FROM bien_dong_kho WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ?)', [donDatId]);
      await csdl.execute('DELETE FROM yeu_cau_dich_vu WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM thanh_toan WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM don_dat WHERE id = ?', [donDatId]);
    }
    await csdl.execute('UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)', [sdtStaff]);
    await csdl.execute('UPDATE chi_tiet_yeu_cau_dich_vu SET nguoi_nhan_tra_id = NULL WHERE nguoi_nhan_tra_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?)', [sdtStaff]);
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtStaff]);
  }

  beforeAll(async () => {
    // 1. Dọn dẹp trước
    await donDep();

    // 2. Tạo hoặc lấy token staff
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Test',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?", [sdtStaff]);

    const resStaffLogin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = resStaffLogin.body.data.token;

    // 3. Lấy token admin
    const resAdminLogin = await request(app).post('/api/v1/auth/login').send({
      phone: sdtAdmin,
      password: 'admin123456',
    });
    tokenAdmin = resAdminLogin.body.data.token;

    // 4. Nhân viên đặt sân tại quầy (payNow = true -> tiền sân đã PAID)
    const resBooking = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        courtId,
        bookingDate: ngayDat,
        timeSlotIds: [timeSlotId],
        guestName: 'Khách Quầy',
        guestPhone: '0977665544',
        payNow: true,
        paymentMethod: 'CASH',
      });

    donDatId = resBooking.body.data.id;
  });

  afterAll(async () => {
    await donDep();
  });

  // TC-30: Thêm dịch vụ tại quầy -> vào thẳng DELIVERED (BR-31)
  let rentalItemId: number;
  it('TC-30: Nhân viên thêm dịch vụ tại quầy, trạng thái là DELIVERED và cộng ngay vào tiền dịch vụ', async () => {
    // Lấy 1 dịch vụ DRINK và 1 dịch vụ RENTAL từ DB
    const [dvList]: any = await csdl.execute(
      "SELECT id, phan_loai FROM dich_vu WHERE trang_thai = 'ACTIVE' ORDER BY id"
    );
    const drink = dvList.find((d: any) => d.phan_loai === 'DRINK');
    const rental = dvList.find((d: any) => d.phan_loai === 'RENTAL');

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donDatId}/service-orders`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        items: [
          { serviceId: drink.id, quantity: 2 },
          { serviceId: rental.id, quantity: 1 },
        ],
        note: 'Dịch vụ mang ra sân',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DELIVERED');
    expect(res.body.data.source).toBe('STAFF');
    expect(res.body.data.items.length).toBe(2);

    const rentalItem = res.body.data.items.find((i: any) => i.type === 'RENTAL');
    expect(rentalItem).toBeDefined();
    rentalItemId = rentalItem.id;
  });

  // TC-31: Lấy hóa đơn đơn đặt
  it('TC-31: Hóa đơn GET .../invoice tính đúng grandTotal, balance, unreturnedRentals', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/bookings/${donDatId}/invoice`)
      .set('Authorization', `Bearer ${tokenStaff}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const invoice = res.body.data;

    expect(invoice.courtAmount).toBeGreaterThan(0);
    expect(invoice.serviceAmount).toBeGreaterThan(0);
    expect(invoice.grandTotal).toBe(invoice.courtAmount + invoice.serviceAmount);
    expect(invoice.paidAmount).toBe(invoice.courtAmount); // Tiền sân đã trả lúc đặt
    expect(invoice.balance).toBe(invoice.serviceAmount); // Còn nợ tiền dịch vụ
    expect(invoice.serviceBalance).toBe(invoice.serviceAmount);

    // Kiểm tra đồ thuê chưa trả
    expect(invoice.unreturnedRentals.length).toBeGreaterThan(0);
  });

  // TC-32: Nhận lại đồ thuê
  it('TC-32: Nhân viên xác nhận trả đồ thuê POST .../return thành công', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/service-order-items/${rentalItemId}/return`)
      .set('Authorization', `Bearer ${tokenStaff}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.returnedAt).not.toBeNull();

    // Hóa đơn cập nhật không còn đồ thuê chưa trả
    const resInv = await request(app)
      .get(`/api/v1/staff/bookings/${donDatId}/invoice`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    expect(resInv.body.data.unreturnedRentals.length).toBe(0);
  });

  // TC-33: Thu tiền dịch vụ
  it('TC-33: Nhân viên thu tiền dịch vụ POST .../service-payments', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${donDatId}/service-payments`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        method: 'CASH',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const invoice = res.body.data;
    expect(invoice.serviceBalance).toBe(0);
    expect(invoice.balance).toBe(0);
  });

  // TC-34: Đóng đơn công nợ (ADMIN, BR-33, close-with-debt)
  it('TC-34: ADMIN đóng đơn có công nợ thành công nếu khách còn nợ', async () => {
    // Thêm một order dịch vụ mới chưa trả tiền để tạo công nợ
    const [dvList]: any = await csdl.execute("SELECT id FROM dich_vu WHERE phan_loai = 'DRINK' LIMIT 1");
    await request(app)
      .post(`/api/v1/staff/bookings/${donDatId}/service-orders`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        items: [{ serviceId: dvList[0].id, quantity: 1 }],
      });

    // Cập nhật ngày và giờ bắt đầu về quá khứ để thỏa mãn điều kiện thời gian của BR-33 (đã đến hoặc qua giờ bắt đầu)
    await csdl.execute("UPDATE don_dat SET ngay_dat = '2026-10-01', gio_bat_dau = '06:00:00' WHERE id = ?", [donDatId]);

    // ADMIN gọi đóng đơn có công nợ
    const res = await request(app)
      .post(`/api/v1/admin/bookings/${donDatId}/close-with-debt`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        reason: 'Khách hàng về sớm, quên thanh toán tiền nước thêm',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.closedWithDebt).toBe(true);
    expect(res.body.data.balance).toBeGreaterThan(0);
  });
});
