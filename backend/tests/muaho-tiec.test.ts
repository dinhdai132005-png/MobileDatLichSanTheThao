// =====================================================================
// KIỂM THỬ NGHIỆP VỤ TIỆC & HÓA ĐƠN MUA HỘ / ĐI CHỢ NGOÀI
// Kiểm thử 2 phương thức phục vụ tiệc:
// Cách 1: Phục vụ dịch vụ nội bộ (đồ uống, thuê thiết bị nội bộ)
// Cách 2: Đi chợ hộ / dịch vụ mua hộ bên ngoài kèm hóa đơn điện tử / chứng từ giấy
// =====================================================================
import request from 'supertest';
import { app } from '../src/app';
import { csdl } from '../src/config/csdl';
import { taoHoaDon, tinhLaiTienDichVu } from '../src/utils/hoadon';

describe('Kiểm thử Nghiệp vụ Tiệc & Hóa đơn Mua hộ Ngoài', () => {
  const sdtStaff = '0901234777';
  let tokenStaff: string;
  let donDatId: number;
  let hoaDonMuaHoId: number;

  beforeAll(async () => {
    // Tạo / đăng nhập Staff
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtStaff]);
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Tiệc & Mua Hộ',
      phone: sdtStaff,
      password: 'password123',
    });
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?", [sdtStaff]);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      phone: sdtStaff,
      password: 'password123',
    });
    tokenStaff = loginRes.body.data?.token || '';

    // Tạo đơn đặt tiệc mẫu để test (mã tối đa 12 ký tự)
    const maDon = 'TC' + Math.floor(100000 + Math.random() * 900000);
    const [donRes] = await csdl.execute<any>(
      `INSERT INTO don_dat (
        ma_don_dat, nguoi_dung_id, san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
        tien_san, tien_dich_vu, trang_thai, phuong_thuc_thanh_toan, nguon_don, ten_khach, so_dien_thoai_khach
      ) VALUES (
        ?, NULL, 1, CURDATE(), '17:00:00', '21:00:00',
        500000, 0, 'CONFIRMED', 'CASH', 'STAFF', 'Anh Tuấn - Tiệc BBQ Công Ty', '0988776655'
      )`,
      [maDon]
    );
    donDatId = donRes.insertId;
  });

  afterAll(async () => {
    if (donDatId) {
      await csdl.execute('DELETE FROM hoa_don_mua_ho WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id = ?)', [donDatId]);
      await csdl.execute('DELETE FROM yeu_cau_dich_vu WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM thanh_toan WHERE don_dat_id = ?', [donDatId]);
      await csdl.execute('DELETE FROM don_dat WHERE id = ?', [donDatId]);
    }
    await csdl.execute('DELETE FROM nguoi_dung WHERE so_dien_thoai = ?', [sdtStaff]);
  });

  it('1. Tạo hóa đơn mua hộ (Cách 2: Đi chợ mua hải sản & BBQ hộ khách) và kiểm tra tự động gộp vào tiền dịch vụ đơn', async () => {
    const res = await request(app)
      .post('/api/v1/staff/procurement-invoices')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        donDatId,
        loaiChiPhi: 'GROCERY',
        tenKhoanChi: 'Đi chợ mua hải sản & thịt nướng BBQ theo yêu cầu khách',
        nhaCungCap: 'Siêu thị Mega Market',
        soHoaDon: 'HD-MM-998822',
        loaiChungTu: 'ELECTRONIC',
        ngayHoaDon: '2026-10-13',
        tienHoaDon: 1500000,
        phiPhucVu: 150000,
        chiTietMon: '3kg Tôm càng xanh, 2kg Bò Úc, Rau củ quả ướp sẵn',
        ghiChu: 'Khách yêu cầu hóa đơn đỏ gửi qua Zalo',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tongTien).toBe(1650000);
    hoaDonMuaHoId = res.body.data.id;

    // Kiểm tra tiền dịch vụ trong don_dat đã được tính lại
    const [don] = await csdl.execute<any>('SELECT tien_dich_vu FROM don_dat WHERE id = ?', [donDatId]);
    expect(Number(don[0].tien_dich_vu)).toBe(1650000);
  });

  it('2. Lấy danh sách hóa đơn mua hộ và lọc theo đơn đặt', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/procurement-invoices?donDatId=${donDatId}`)
      .set('Authorization', `Bearer ${tokenStaff}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const item = res.body.data.find((x: any) => x.id === hoaDonMuaHoId);
    expect(item).toBeDefined();
    expect(item.supplier).toBe('Siêu thị Mega Market');
    expect(item.documentType).toBe('ELECTRONIC');
    expect(item.invoiceAmount).toBe(1500000);
    expect(item.serviceFee).toBe(150000);
    expect(item.totalAmount).toBe(1650000);
  });

  it('3. Thêm dịch vụ nội bộ (Cách 1) và kiểm tra hàm taoHoaDon tổng hợp đúng cả 2 cách', async () => {
    // Tạo 1 yêu cầu dịch vụ nội bộ DELIVERED trị giá 200,000đ (ví dụ nước uống tủ mát)
    const [yc] = await csdl.execute<any>(
      `INSERT INTO yeu_cau_dich_vu (don_dat_id, trang_thai, nguon, ngay_tao)
       VALUES (?, 'DELIVERED', 'STAFF', NOW())`,
      [donDatId]
    );
    const yeuCauId = yc.insertId;

    await csdl.execute<any>(
      `INSERT INTO chi_tiet_yeu_cau_dich_vu (yeu_cau_dich_vu_id, dich_vu_id, so_luong, don_gia)
       VALUES (?, 1, 10, 20000)`,
      [yeuCauId]
    );

    // Cập nhật lại cache tiền dịch vụ theo đúng quy trình
    await tinhLaiTienDichVu(csdl, donDatId);

    // Lấy hóa đơn tổng hợp
    const invoice = await taoHoaDon(csdl, donDatId);
    expect(invoice.courtAmount).toBe(500000);
    expect(invoice.inHouseServiceAmount).toBe(200000); // 10 lon nước * 20k
    expect(invoice.procurementAmount).toBe(1650000); // Tiền hóa đơn mua hộ ngoài
    expect(invoice.serviceAmount).toBe(1850000); // 200k + 1650k
    expect(invoice.grandTotal).toBe(2350000); // 500k tiền sân + 1850k dịch vụ
    expect(invoice.procurementInvoices.length).toBeGreaterThanOrEqual(1);
  });

  it('4. Cập nhật trạng thái và lấy báo cáo tổng hợp KPI mua hộ', async () => {
    const patchRes = await request(app)
      .patch(`/api/v1/staff/procurement-invoices/${hoaDonMuaHoId}/status`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({ trangThai: 'CONFIRMED' });

    expect(patchRes.status).toBe(200);

    const summaryRes = await request(app)
      .get('/api/v1/staff/procurement-invoices/summary')
      .set('Authorization', `Bearer ${tokenStaff}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalInvoices).toBeGreaterThanOrEqual(1);
    expect(summaryRes.body.data.grandProcurementTotal).toBeGreaterThanOrEqual(1650000);
  });
});
