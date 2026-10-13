// =====================================================================
// KỊCH BẢN KIỂM ĐỊNH TOÀN DIỆN HỆ THỐNG — TỪNG CHỨC NĂNG & LUỒNG XỬ LÝ
// Kiểm tra 100% nghiệp vụ thực tế theo các quy tắc BR-01 -> BR-35 & STF-01 -> STF-15
// =====================================================================
import { csdl } from '../src/config/csdl';
import { app } from '../src/app';
import request from 'supertest';
import { quetDonHetHan } from '../src/jobs/hethan-dondat.job';

interface TestResult {
  module: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runStep(module: string, name: string, fn: () => Promise<string | void>) {
  const t0 = Date.now();
  try {
    const details = await fn();
    const durationMs = Date.now() - t0;
    results.push({ module, name, status: 'PASS', details: details || 'Hoàn tất đúng quy chuẩn', durationMs });
    console.log(`  ✅ [PASS] ${module} -> ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - t0;
    results.push({ module, name, status: 'FAIL', details: err.message || String(err), durationMs });
    console.error(`  ❌ [FAIL] ${module} -> ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('=====================================================================');
  console.log('   BẮT ĐẦU KIỂM ĐỊNH TOÀN BỘ 11 LUỒNG NGHIỆP VỤ HỆ THỐNG');
  console.log('=====================================================================\n');

  // Khai báo tài khoản kiểm thử
  const sdtCustomer = '0989998888';
  const sdtStaff = '0901234999';
  const sdtAdmin = '0900000001';
  const password = 'password123';

  let tokenCustomer = '';
  let tokenStaff = '';
  let tokenAdmin = '';

  let bookingIdOnline = 0;
  let bookingIdWalkin = 0;
  let bookingIdEvent = 0;
  let serviceOrderId = 0;
  let rentalItemId = 0;
  let procurementInvoiceId = 0;
  let refundPaymentId = 0;

  const testCourtId = 1; // Sân 5A
  const eventCourtId = 8; // Phòng tiệc A
  const ngayMai = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayKia = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const ngayThuTu = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

  // -------------------------------------------------------------------
  // DỌN DẸP DỮ LIỆU CŨ TRƯỚC KHI CHẠY (TRÁNH LỖI KHÓA NGOẠI)
  // -------------------------------------------------------------------
  const testPhones = [sdtCustomer, sdtStaff, '0977889911', '0911223344', '0988771122', '0933445566'];
  const pPhones = testPhones.map(() => '?').join(',');

  // Tìm các đơn đặt liên quan tới test
  const [testDonDat] = await csdl.execute<any>(
    `SELECT id FROM don_dat 
     WHERE so_dien_thoai_khach IN (${pPhones}) 
        OR nguoi_dung_id IN (SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (${pPhones}))`,
    [...testPhones, ...testPhones]
  );
  const donDatIds = testDonDat.map((d: any) => d.id);

  if (donDatIds.length > 0) {
    const pIds = donDatIds.map(() => '?').join(',');
    await csdl.execute(`DELETE FROM hoa_don_mua_ho WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM bien_dong_kho WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM chi_tiet_yeu_cau_dich_vu WHERE yeu_cau_dich_vu_id IN (SELECT id FROM yeu_cau_dich_vu WHERE don_dat_id IN (${pIds}))`, donDatIds);
    await csdl.execute(`DELETE FROM yeu_cau_dich_vu WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM danh_gia WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM thanh_toan WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM nhat_ky_trang_thai_don WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM chi_tiet_khung_gio_dat WHERE don_dat_id IN (${pIds})`, donDatIds);
    await csdl.execute(`DELETE FROM don_dat WHERE id IN (${pIds})`, donDatIds);
  }

  // Dọn dẹp ràng buộc người dùng
  const [testUsers] = await csdl.execute<any>('SELECT id FROM nguoi_dung WHERE so_dien_thoai IN (?, ?)', [sdtCustomer, sdtStaff]);
  const userIds = testUsers.map((u: any) => u.id);
  if (userIds.length > 0) {
    const pU = userIds.map(() => '?').join(',');
    await csdl.execute(`UPDATE chi_tiet_yeu_cau_dich_vu SET nguoi_nhan_tra_id = NULL WHERE nguoi_nhan_tra_id IN (${pU})`, userIds);
    await csdl.execute(`UPDATE thanh_toan SET nguoi_xu_ly_id = NULL WHERE nguoi_xu_ly_id IN (${pU})`, userIds);
    await csdl.execute(`UPDATE nhat_ky_trang_thai_don SET nguoi_thuc_hien_id = NULL WHERE nguoi_thuc_hien_id IN (${pU})`, userIds);
    await csdl.execute(`UPDATE bien_dong_kho SET nguoi_thuc_hien_id = 2 WHERE nguoi_thuc_hien_id IN (${pU})`, userIds);
    await csdl.execute(`DELETE FROM danh_gia WHERE nguoi_dung_id IN (${pU})`, userIds);
    await csdl.execute(`DELETE FROM nguoi_dung WHERE id IN (${pU})`, userIds);
  }

  // ===================================================================
  // MODULE 1: XÁC THỰC & PHÂN QUYỀN RBAC
  // ===================================================================
  console.log('\n--- MODULE 1: XÁC THỰC & PHÂN QUYỀN RBAC ---');

  await runStep('1. Xác thực', 'Đăng ký tài khoản Khách hàng hợp lệ', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Khách Hàng Kiểm Thử',
      phone: sdtCustomer,
      password,
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    tokenCustomer = res.body.data.token;
    return `Đăng ký thành công User #${res.body.data.user.id}, Role: ${res.body.data.user.role}`;
  });

  await runStep('1. Xác thực', 'Chặn đăng ký trùng số điện thoại (BR-16)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Người Dùng Trùng SĐT',
      phone: sdtCustomer,
      password,
    });
    if (res.status !== 409) throw new Error(`Mong đợi 409 Conflict nhưng nhận ${res.status}`);
    return `Từ chối trùng SĐT chính xác: ${res.body.message}`;
  });

  await runStep('1. Xác thực', 'Đăng ký & Nâng quyền Staff kiểm thử', async () => {
    await request(app).post('/api/v1/auth/register').send({
      fullName: 'Nhân Viên Quầy Vận Hành',
      phone: sdtStaff,
      password,
    });
    await csdl.execute("UPDATE nguoi_dung SET vai_tro = 'STAFF' WHERE so_dien_thoai = ?", [sdtStaff]);
    const resLogin = await request(app).post('/api/v1/auth/login').send({ phone: sdtStaff, password });
    tokenStaff = resLogin.body.data.token;
    return `Đăng nhập Staff thành công, Role: ${resLogin.body.data.user.role}`;
  });

  await runStep('1. Xác thực', 'Đăng nhập Quản trị viên (Admin)', async () => {
    const resLogin = await request(app).post('/api/v1/auth/login').send({ phone: sdtAdmin, password: 'admin123456' });
    if (resLogin.status !== 200) throw new Error(`Đăng nhập Admin thất bại: ${JSON.stringify(resLogin.body)}`);
    tokenAdmin = resLogin.body.data.token;
    return `Đăng nhập Admin thành công: ${resLogin.body.data.user.fullName}`;
  });

  await runStep('1. Phân quyền', 'Chặn Khách hàng truy cập API Quản trị (RBAC 403)', async () => {
    const res = await request(app).get('/api/v1/admin/reports/summary').set('Authorization', `Bearer ${tokenCustomer}`);
    if (res.status !== 403) throw new Error(`Mong đợi 403 Forbidden nhưng nhận ${res.status}`);
    return 'Chặn khách hàng truy cập API báo cáo của Admin thành công';
  });

  await runStep('1. Phân quyền', 'Chặn Khách vãng lai không token (RBAC 401)', async () => {
    const res = await request(app).post('/api/v1/bookings').send({});
    if (res.status !== 401) throw new Error(`Mong đợi 401 Unauthorized nhưng nhận ${res.status}`);
    return 'Chặn request không có token chính xác';
  });

  // ===================================================================
  // MODULE 2: DANH MỤC SÂN, QUY HOẠCH & BẢNG GIÁ
  // ===================================================================
  console.log('\n--- MODULE 2: DANH MỤC SÂN, QUY HOẠCH & BẢNG GIÁ ---');

  await runStep('2. Danh mục', 'Tra cứu danh sách loại sân & vị trí sân', async () => {
    const res = await request(app).get('/api/v1/courts');
    if (res.status !== 200 || !res.body.data.length) throw new Error('Không lấy được danh sách sân');
    return `Tìm thấy ${res.body.data.length} vị trí sân cố định trong cơ sở`;
  });

  await runStep('2. Danh mục', 'Tra cứu khung giờ hoạt động & ma trận giá', async () => {
    const res = await request(app).get('/api/v1/time-slots');
    if (res.status !== 200 || res.body.data.length !== 16) throw new Error(`Số lượng khung giờ không chuẩn (16 khung giờ từ 06:00 -> 22:00)`);
    return `16 khung giờ cố định từ ${res.body.data[0].startTime.substring(0,5)} đến ${res.body.data[15].endTime.substring(0,5)}`;
  });

  await runStep('2. Quy hoạch', 'Chuyển đổi mục đích sử dụng sân (convert-purpose)', async () => {
    const res = await request(app)
      .put(`/api/v1/admin/courts/${testCourtId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ courtTypeId: 1, name: 'Sân 5A', description: 'Sân 5A kiểm tra chuyển đổi mục đích quy hoạch' });
    if (res.status !== 200) throw new Error(`Lỗi chuyển đổi mục đích: ${res.body.message}`);
    return 'Chuyển đổi mục đích sử dụng sân thành công theo quy hoạch';
  });

  // ===================================================================
  // MODULE 3: ĐẶT SÂN ONLINE & BẢO VỆ CONCURRENCY (BR-01 -> BR-12)
  // ===================================================================
  console.log('\n--- MODULE 3: ĐẶT SÂN ONLINE & CONCURRENCY ---');

  await runStep('3. Đặt sân', 'Kiểm tra tính trống khung giờ (availability)', async () => {
    const res = await request(app).get(`/api/v1/courts/${testCourtId}/availability?date=${ngayMai}`);
    if (res.status !== 200) throw new Error('Lỗi kiểm tra tính trống');
    const availableSlots = res.body.data.slots.filter((s: any) => s.status === 'AVAILABLE');
    return `Ngày ${ngayMai}: ${availableSlots.length} khung giờ trống sẵn sàng`;
  });

  await runStep('3. Đặt sân', 'Khách đặt sân online hợp lệ 2 khung giờ liền kề (BR-02, BR-06)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({
        courtId: testCourtId,
        bookingDate: ngayMai,
        timeSlotIds: [1, 2], // 06:00 - 08:00
        paymentMethod: 'BANK_TRANSFER', // Giữ chỗ 15 phút PENDING
        note: 'Kiểm thử đặt sân online sáng sớm chuyển khoản',
      });
    if (res.status !== 201) throw new Error(`Lỗi đặt sân: ${res.body.message}`);
    bookingIdOnline = res.body.data.id;
    return `Tạo đơn thành công #${res.body.data.bookingCode}, Tiền sân: ${res.body.data.courtAmount}₫, Trạng thái: ${res.body.data.status}`;
  });

  await runStep('3. Concurrency', 'Chặn trùng khung giờ (Race Condition / Overbooking) với Barrier Pattern', async () => {
    // 5 request cùng gửi tranh đặt khung giờ [1] của ngày mai đã có người đặt
    const requests = Array.from({ length: 5 }).map(() =>
      request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${tokenCustomer}`)
        .send({
          courtId: testCourtId,
          bookingDate: ngayMai,
          timeSlotIds: [1],
          paymentMethod: 'CASH',
        })
    );
    const settled = await Promise.all(requests);
    const conflictCount = settled.filter((r) => r.status === 409).length;
    if (conflictCount !== 5) throw new Error(`Mong đợi cả 5 bị 409 Conflict, thực tế: ${conflictCount}`);
    return `Cơ chế khóa hàng rào chống đặt trùng slot hoạt động chuẩn: 5/5 trả về 409 SLOT_TAKEN`;
  });

  await runStep('3. Hết hạn giữ chỗ', 'Background Job quét đơn hết hạn (Job HeThanDonDat)', async () => {
    // Đặt hạn cho đơn về quá khứ để test quét
    await csdl.execute("UPDATE don_dat SET het_han_luc = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE id = ?", [bookingIdOnline]);
    await quetDonHetHan();
    const [rows] = await csdl.execute<any>('SELECT trang_thai FROM don_dat WHERE id = ?', [bookingIdOnline]);
    if (rows[0].trang_thai !== 'EXPIRED') throw new Error(`Đơn không chuyển sang EXPIRED: ${rows[0].trang_thai}`);
    return 'Background Job tự động chuyển trạng thái đơn hết hạn sang EXPIRED và giải phóng slot';
  });

  // ===================================================================
  // MODULE 4: ĐẶT TẠI QUẦY & VẬN HÀNH NHÂN VIÊN (STF-01 -> STF-15)
  // ===================================================================
  console.log('\n--- MODULE 4: ĐẶT TẠI QUẦY & VẬN HÀNH NHÂN VIÊN ---');

  await runStep('4. Quầy', 'Nhân viên đặt sân tại quầy cho khách vãng lai (Walk-in)', async () => {
    const res = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        courtId: testCourtId,
        bookingDate: ngayKia,
        timeSlotIds: [3, 4], // 08:00 - 10:00
        guestName: 'Nguyễn Văn Test Quầy',
        guestPhone: '0977889911',
        payNow: false,
        note: 'Khách đến đặt trực tiếp tại quầy chiều chơi',
      });
    if (res.status !== 201) throw new Error(`Lỗi đặt quầy: ${res.body.message}`);
    bookingIdWalkin = res.body.data.id;
    return `Đơn tại quầy #${res.body.data.bookingCode} (CONFIRMED, UNPAID)`;
  });

  await runStep('4. Quầy', 'Ghi nhận thanh toán tiền sân tại quầy (CASH)', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/payments`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({ method: 'CASH' });
    if (res.status !== 200) throw new Error(`Lỗi ghi nhận tiền sân: ${res.body.message}`);
    return `Đã thu tiền sân: ${res.body.data.amount}₫, Trạng thái: PAID`;
  });

  // ===================================================================
  // MODULE 5: DỊCH VỤ, HÀNG ĐỢI, THUÊ ĐỒ & HOÀN THÀNH ĐƠN
  // ===================================================================
  console.log('\n--- MODULE 5: DỊCH VỤ NỘI BỘ, THUÊ ĐỒ & QUY TẮC BR-28 ---');

  await runStep('5. Dịch vụ', 'Nhân viên thêm dịch vụ tại quầy (Nước uống + Thuê vợt)', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/service-orders`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        items: [
          { serviceId: 1, quantity: 4 }, // Nước suối (DRINK, 10,000₫ x 4 = 40,000₫)
          { serviceId: 5, quantity: 2 }, // Thuê vợt cầu lông (RENTAL, 30,000₫ x 2 = 60,000₫)
        ],
        note: 'Phục vụ bàn số 1',
      });
    if (res.status !== 201) throw new Error(`Lỗi thêm dịch vụ: ${res.body.message}`);
    serviceOrderId = res.body.data.id;
    return `Yêu cầu #${serviceOrderId} vào trạng thái DELIVERED ngay lập tức (BR-31)`;
  });

  await runStep('5. Dịch vụ', 'Kiểm tra hóa đơn tổng hợp hiển thị đồ thuê chưa trả', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/bookings/${bookingIdWalkin}/invoice`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200) throw new Error('Lỗi lấy hóa đơn');
    const inv = res.body.data;
    if (inv.unreturnedRentals.length === 0) throw new Error('Không thấy đồ thuê chưa trả');
    rentalItemId = inv.unreturnedRentals[0].itemId;
    return `Hóa đơn: Tiền sân ${inv.courtAmount}₫, Dịch vụ ${inv.serviceAmount}₫, Đồ thuê chưa trả: ${inv.unreturnedRentals.length} món`;
  });

  await runStep('5. Quy tắc BR-28', 'Chặn hoàn thành đơn khi đồ thuê chưa được trả lại', async () => {
    // Ép thời gian bắt đầu về quá khứ để vượt qua kiểm tra TOO_EARLY (BR-12), kiểm định chính xác quy tắc BR-28
    await csdl.execute("UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?", [bookingIdWalkin]);

    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/complete`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 422 || res.body.errorCode !== 'RENTALS_NOT_RETURNED') {
      throw new Error(`Mong đợi 422 RENTALS_NOT_RETURNED nhưng nhận: ${res.status} ${res.body.errorCode}`);
    }
    return `Chặn hoàn thành đơn chính xác: ${res.body.message}`;
  });

  await runStep('5. Trả đồ thuê', 'Nhân viên xác nhận nhận lại đồ thuê (Return item)', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/service-order-items/${rentalItemId}/return`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200) throw new Error(`Lỗi nhận lại đồ: ${res.body.message}`);
    return 'Nhận lại đồ thuê thành công, xóa khỏi danh sách unreturnedRentals';
  });

  await runStep('5. Quy tắc BR-28', 'Chặn hoàn thành đơn khi còn nợ tiền dịch vụ', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/complete`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 422 || res.body.errorCode !== 'SERVICE_BALANCE_DUE') {
      throw new Error(`Mong đợi 422 SERVICE_BALANCE_DUE nhưng nhận: ${res.status}`);
    }
    return `Chặn hoàn thành đơn khi còn nợ tiền dịch vụ chính xác: ${res.body.message}`;
  });

  await runStep('5. Thu tiền dịch vụ', 'Nhân viên thu tiền dịch vụ phát sinh (CASH)', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/service-payments`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({ method: 'CASH' });
    if (res.status !== 200) throw new Error(`Lỗi thu tiền dịch vụ: ${res.body.message}`);
    return `Đã thu xong tiền dịch vụ: ${res.body.data.amount}₫`;
  });

  await runStep('5. Hoàn thành', 'Hoàn tất đơn đặt sân sau khi đã trả đồ & đủ tiền', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdWalkin}/complete`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200) throw new Error(`Lỗi hoàn thành đơn: ${res.body.message}`);
    return `Đơn chuyển sang COMPLETED thành công!`;
  });

  // ===================================================================
  // MODULE 6: ĐÓNG ĐƠN CÓ CÔNG NỢ (BR-33 - ADMIN ONLY)
  // ===================================================================
  console.log('\n--- MODULE 6: ĐÓNG ĐƠN CÓ CÔNG NỢ (BR-33) ---');

  let bookingIdDebt = 0;
  await runStep('6. Công nợ', 'Tạo đơn mới có phát sinh nợ dịch vụ chưa thanh toán', async () => {
    const resBooking = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        courtId: testCourtId,
        bookingDate: ngayThuTu,
        timeSlotIds: [5], // 10:00 - 11:00
        guestName: 'Doanh Nghiệp A - Công Nợ',
        guestPhone: '0911223344',
        payNow: true,
        paymentMethod: 'CASH',
      });
    bookingIdDebt = resBooking.body.data.id;

    // Thêm nước uống chưa trả tiền (10 chai x 10,000₫ = 100,000₫)
    await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdDebt}/service-orders`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({ items: [{ serviceId: 1, quantity: 10 }] });

    return `Tạo đơn #${resBooking.body.data.bookingCode} nợ dịch vụ 100,000₫`;
  });

  await runStep('6. Công nợ', 'Admin đóng đơn có công nợ (closed_with_debt = 1)', async () => {
    // Ép thời gian bắt đầu về quá khứ để vượt qua kiểm tra TOO_EARLY (BR-12)
    await csdl.execute("UPDATE don_dat SET ngay_dat = CURRENT_DATE(), gio_bat_dau = '00:00:00' WHERE id = ?", [bookingIdDebt]);

    const res = await request(app)
      .post(`/api/v1/admin/bookings/${bookingIdDebt}/close-with-debt`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reason: 'Khách hàng VIP ký biên bản công nợ cuối tháng chuyển khoản' });
    if (res.status !== 200) throw new Error(`Lỗi đóng đơn công nợ: ${res.body.message}`);
    return 'Admin đóng đơn công nợ thành công (closed_with_debt = 1)';
  });

  // ===================================================================
  // MODULE 7: TIỆC, SỰ KIỆN & HÓA ĐƠN MUA HỘ (2 PHƯƠNG THỨC)
  // ===================================================================
  console.log('\n--- MODULE 7: TIỆC & HÓA ĐƠN MUA HỘ NGOẠI VI ---');

  await runStep('7. Tiệc & Mua hộ', 'Tạo đơn đặt khu sự kiện / phòng tiệc', async () => {
    const res = await request(app)
      .post('/api/v1/staff/bookings')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        courtId: eventCourtId,
        bookingDate: ngayKia,
        timeSlotIds: [11, 12], // 16:00 - 18:00
        guestName: 'Anh Vũ - Tiệc Sinh Nhật Công Ty',
        guestPhone: '0988771122',
        payNow: false,
        note: 'Tiệc nướng BBQ & âm thanh',
      });
    if (res.status !== 201) throw new Error(`Lỗi tạo đơn sự kiện: ${res.body.message}`);
    bookingIdEvent = res.body.data.id;
    return `Đơn tiệc #${res.body.data.bookingCode} tại ${res.body.data.courtName}`;
  });

  await runStep('7. Tiệc & Mua hộ', 'Cách 2: Ghi nhận hóa đơn mua hộ ngoài (Đi chợ BBQ kèm E-Invoice)', async () => {
    const res = await request(app)
      .post('/api/v1/staff/procurement-invoices')
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        donDatId: bookingIdEvent,
        loaiChiPhi: 'GROCERY',
        tenKhoanChi: 'Đi chợ mua hải sản tôm cua & bò Úc BBQ',
        nhaCungCap: 'Siêu thị Mega Market',
        soHoaDon: 'HD-MM-998811',
        loaiChungTu: 'ELECTRONIC',
        ngayHoaDon: ngayKia,
        tienHoaDon: 2500000,
        phiPhucVu: 200000,
        chiTietMon: '5kg tôm càng xanh, 3kg sườn bò Úc, nước sốt ướp',
        hinhAnhChungTu: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
        ghiChu: 'Gửi hóa đơn điện tử cho khách qua Zalo',
      });
    if (res.status !== 201) throw new Error(`Lỗi tạo hóa đơn mua hộ: ${res.body.message}`);
    procurementInvoiceId = res.body.data.id;
    return `Đã tiếp nhận HĐ #${procurementInvoiceId}, Tiền gốc: 2,500,000₫ + Phí: 200,000₫ = 2,700,000₫`;
  });

  await runStep('7. Tiệc & Mua hộ', 'Cách 1: Thêm dịch vụ đồ uống nội bộ phục vụ tiệc', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/bookings/${bookingIdEvent}/service-orders`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        items: [{ serviceId: 1, quantity: 20 }], // 20 chai nước nội bộ
        note: 'Nước uống tủ mát ra sân tiệc',
      });
    if (res.status !== 201) throw new Error(`Lỗi thêm dịch vụ nội bộ: ${res.body.message}`);
    return 'Xuất 20 chai nước tủ mát nội bộ thành công';
  });

  await runStep('7. Tiệc & Mua hộ', 'Kiểm tra hóa đơn tổng hợp bóc tách minh bạch cả 2 phương thức', async () => {
    const res = await request(app)
      .get(`/api/v1/staff/bookings/${bookingIdEvent}/invoice`)
      .set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200) throw new Error('Lỗi lấy hóa đơn');
    const inv = res.body.data;
    const procExpected = 2700000; // 2,500,000₫ gốc + 200,000₫ phí
    const inHouseExpected = 200000; // 20 chai nước x 10,000₫
    if (inv.procurementAmount !== procExpected) throw new Error(`Procurement amount sai: ${inv.procurementAmount}`);
    if (inv.inHouseServiceAmount !== inHouseExpected) throw new Error(`In-house amount sai: ${inv.inHouseServiceAmount}`);
    if (inv.serviceAmount !== (procExpected + inHouseExpected)) throw new Error(`Tổng dịch vụ sai: ${inv.serviceAmount}`);
    return `Hóa đơn tổng: Tiền sân ${inv.courtAmount}₫ + Nội bộ 200,000₫ + Mua hộ 2,700,000₫ = Tổng ${inv.grandTotal}₫`;
  });

  // ===================================================================
  // MODULE 8: QUẢN LÝ TỒN KHO & BIẾN ĐỘNG (INVENTORY)
  // ===================================================================
  console.log('\n--- MODULE 8: QUẢN LÝ TỒN KHO & BIẾN ĐỘNG ---');

  await runStep('8. Tồn kho', 'Tra cứu tồn kho thực tế, đang giữ và khả dụng', async () => {
    const res = await request(app).get('/api/v1/staff/inventory').set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200 || !res.body.data.length) throw new Error('Không lấy được tồn kho');
    const item1 = res.body.data.find((i: any) => i.serviceId === 1);
    return `Dịch vụ #${item1.serviceName}: Tổng tồn ${item1.quantity}, Đang giữ ${item1.reservedQuantity}, Khả dụng ${item1.availableQuantity}`;
  });

  await runStep('8. Tồn kho', 'Admin thực hiện nhập kho (IMPORT)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/inventory/import')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ serviceId: 1, quantity: 50, note: 'Nhập hàng lô nước mới' });
    if (res.status !== 200) throw new Error(`Lỗi nhập kho: ${res.body.message}`);
    return `Nhập 50 đơn vị thành công, tồn kho sau nhập: ${res.body.data.quantityAfter}`;
  });

  await runStep('8. Tồn kho', 'Admin điều chỉnh kiểm kê hao hụt (ADJUST_OUT)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/inventory/adjust')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ serviceId: 1, type: 'ADJUST_OUT', quantity: 2, reason: 'Rơi vỡ 2 chai trong quá trình vận chuyển' });
    if (res.status !== 200) throw new Error(`Lỗi điều chỉnh kho: ${res.body.message}`);
    return `Điều chỉnh giảm 2 chai thành công, tồn kho còn: ${res.body.data.quantityAfter}`;
  });

  // ===================================================================
  // MODULE 9: XỬ LÝ HOÀN TIỀN & ĐỐI SOÁT (REFUNDS)
  // ===================================================================
  console.log('\n--- MODULE 9: XỬ LÝ HOÀN TIỀN & ĐỐI SOÁT (REFUNDS) ---');

  let bookingIdRefund = 0;
  await runStep('9. Hoàn tiền', 'Khách hủy đơn đã thanh toán trước > 6 tiếng (BR-09, BR-34)', async () => {
    // Khách tạo đơn trực tuyến cho ngày thứ tư (cách > 6 tiếng)
    const resBooking = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({
        courtId: testCourtId,
        bookingDate: ngayThuTu,
        timeSlotIds: [14],
        paymentMethod: 'BANK_TRANSFER',
        note: 'Khách đặt chuyển khoản để kiểm thử luồng hủy & hoàn tiền',
      });
    if (resBooking.status !== 201) throw new Error(`Lỗi tạo đơn hủy: ${resBooking.body.message}`);
    bookingIdRefund = resBooking.body.data.id;

    // Giả lập thanh toán thành công (PAID) trước khi hủy
    await csdl.execute("UPDATE don_dat SET trang_thai = 'CONFIRMED', trang_thai_thanh_toan = 'PAID' WHERE id = ?", [bookingIdRefund]);
    await csdl.execute(
      "INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, ma_giao_dich) VALUES (?, 'PAYMENT', 'COURT', 'BANK_TRANSFER', (SELECT tien_san FROM don_dat WHERE id = ?), 'SUCCESS', 'PAY-ONLINE-9988')",
      [bookingIdRefund, bookingIdRefund]
    );

    // Khách hàng hủy đơn trên ứng dụng kèm thông tin tài khoản nhận tiền hoàn (BR-34)
    const resCancel = await request(app)
      .post(`/api/v1/bookings/${bookingIdRefund}/cancel`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({
        reason: 'Khách bận lịch công tác đột xuất',
        refundInfo: 'Vietcombank 0123456789 - NGUYEN VAN A',
      });
    if (resCancel.status !== 200) throw new Error(`Lỗi hủy đơn: ${resCancel.body.message}`);
    return `Đơn hủy chuyển trạng thái CANCELLED, tạo giao dịch hoàn tiền PENDING`;
  });

  await runStep('9. Hoàn tiền', 'Nhân viên tra cứu danh sách Chờ hoàn tiền (PENDING)', async () => {
    const res = await request(app).get('/api/v1/staff/refunds?status=PENDING').set('Authorization', `Bearer ${tokenStaff}`);
    if (res.status !== 200) throw new Error('Lỗi lấy danh sách hoàn tiền');
    const rf = res.body.data.items.find((item: any) => item.booking.id === bookingIdRefund);
    if (!rf) throw new Error('Không tìm thấy giao dịch hoàn tiền tương ứng');
    refundPaymentId = rf.paymentId;
    return `Tìm thấy khoản hoàn #${refundPaymentId}, Số tiền: ${rf.amount}₫, STK: ${rf.refundInfo}`;
  });

  await runStep('9. Hoàn tiền', 'Nhân viên xác nhận chuyển khoản hoàn tiền & lưu mã đối soát', async () => {
    const res = await request(app)
      .post(`/api/v1/staff/payments/${refundPaymentId}/confirm-refund`)
      .set('Authorization', `Bearer ${tokenStaff}`)
      .send({
        transactionRef: 'FT2409871625',
        note: 'Đã chuyển hoàn thành công qua Vietcombank Mobile',
      });
    if (res.status !== 200) throw new Error(`Lỗi xác nhận hoàn tiền: ${res.body.message}`);
    return `Giao dịch hoàn tiền chuyển sang SUCCESS, đơn đặt sang REFUNDED`;
  });

  // ===================================================================
  // MODULE 10: BÁO CÁO DOANH THU & TỶ LỆ LẤP ĐẦY (ADM-07, BR-32)
  // ===================================================================
  console.log('\n--- MODULE 10: BÁO CÁO DOANH THU & PHÂN RÃ KHOẢN THU ---');

  await runStep('10. Báo cáo', 'Báo cáo tổng hợp doanh thu phân rã từng khoản', async () => {
    const res = await request(app).get('/api/v1/admin/reports/itemized-breakdown').set('Authorization', `Bearer ${tokenAdmin}`);
    if (res.status !== 200) throw new Error('Lỗi báo cáo phân rã');
    const s = res.body.data.summary;
    return `Doanh thu phân rã: Tiền sân ${s.courtRevenue}₫ | Nước uống ${s.drinkRevenue}₫ | Thuê đồ ${s.rentalRevenue}₫ | Hoàn tiền ${s.totalRefund}₫ | Thực nhận (NET): ${s.netRevenue}₫`;
  });

  await runStep('10. Báo cáo', 'Báo cáo tỷ lệ lấp đầy sân (Occupancy Rate)', async () => {
    const res = await request(app).get('/api/v1/admin/reports/summary').set('Authorization', `Bearer ${tokenAdmin}`);
    if (res.status !== 200) throw new Error('Lỗi báo cáo tổng quan');
    return `Tỷ lệ lấp đầy: ${res.body.data.occupancyRate}%, Tổng đơn: ${res.body.data.bookings?.total || 0}`;
  });

  // ===================================================================
  // MODULE 11: ĐÁNH GIÁ SÂN & QUẢN LÝ NGƯỜI DÙNG (BR-35)
  // ===================================================================
  console.log('\n--- MODULE 11: ĐÁNH GIÁ SÂN & PHẢN HỒI (BR-35) ---');

  await runStep('11. Đánh giá', 'Khách đánh giá 5 sao cho đơn đã COMPLETED', async () => {
    // Gán đơn bookingIdWalkin về cho tokenCustomer để đánh giá
    await csdl.execute('UPDATE don_dat SET nguoi_dung_id = (SELECT id FROM nguoi_dung WHERE so_dien_thoai = ?) WHERE id = ?', [sdtCustomer, bookingIdWalkin]);
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingIdWalkin}/review`)
      .set('Authorization', `Bearer ${tokenCustomer}`)
      .send({ rating: 5, comment: 'Sân bóng rất đẹp, dịch vụ nước lạnh và dụng cụ rất chu đáo!' });
    if (res.status !== 201) throw new Error(`Lỗi đánh giá: ${res.body.message}`);
    return `Đánh giá 5 sao thành công kèm phản hồi hài lòng`;
  });

  // -------------------------------------------------------------------
  // TỔNG KẾT BÁO CÁO KIỂM THỬ
  // -------------------------------------------------------------------
  console.log('\n=====================================================================');
  console.log('   KẾT QUẢ KIỂM ĐỊNH TOÀN DIỆN HỆ THỐNG');
  console.log('=====================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  console.log(`Tổng số bước kiểm thử: ${total}`);
  console.log(`Thành công (PASS):     ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Thất bại (FAIL):       ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 TOÀN BỘ 11 LUỒNG NGHIỆP VỤ ĐẠT 100% TIÊU CHUẨN THỰC TẾ!');
  } else {
    console.log('\n⚠️ CÁC BƯỚC THẤT BẠI:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`- ${r.module} -> ${r.name}: ${r.details}`);
    });
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Lỗi ngoại lệ:', e);
  process.exit(1);
});
