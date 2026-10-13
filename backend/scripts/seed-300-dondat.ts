// =====================================================================
// SCRIPT TẠO 300 BẢN GHI ĐƠN ĐẶT SÂN MẪU (SEED 300 BOOKINGS)
// Dữ liệu thực tế: Đủ các trạng thái (COMPLETED, CONFIRMED, CANCELLED, NO_SHOW)
// Đủ các khoản thu: Tiền sân (SPORT/EVENT), Nước uống (DRINK), Thuê đồ (RENTAL), Gói tiệc (PACKAGE)
// Đủ thanh toán (CASH, BANK_TRANSFER, VNPAY), hoàn tiền, đánh giá sao và nhật ký
// =====================================================================
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.join(__dirname, '../.env') });

const CAU_HINH = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sport_booking',
};

function sinhMaDon(): string {
  const kyTu = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ma = 'BK';
  for (let i = 0; i < 8; i++) {
    ma += kyTu[crypto.randomInt(0, kyTu.length)];
  }
  return ma;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DANH_SACH_KHACH = [
  { name: 'Trần Khách Hàng A', phone: '0911111111', userId: 3 },
  { name: 'Lê Khách Hàng B', phone: '0922222222', userId: 4 },
  { name: 'Nguyễn Hoàng Nam', phone: '0933112233', userId: null },
  { name: 'Đỗ Minh Tuấn', phone: '0944223344', userId: null },
  { name: 'Phạm Quỳnh Trang', phone: '0955334455', userId: null },
  { name: 'Vũ Đình Hùng', phone: '0966445566', userId: null },
  { name: 'Hoàng Thu Thảo', phone: '0977556677', userId: null },
  { name: 'Bùi Gia Huy', phone: '0988667788', userId: null },
  { name: 'Đinh Công Thành', phone: '0912345678', userId: null },
  { name: 'Trịnh Lan Anh', phone: '0923456789', userId: null },
  { name: 'Mai Đức Trọng', phone: '0934567890', userId: null },
  { name: 'Đoàn Thu Hà', phone: '0945678901', userId: null },
  { name: 'Lương Bảo Ngọc', phone: '0956789012', userId: null },
  { name: 'Phan Quốc Bảo', phone: '0967890123', userId: null },
  { name: 'Trương Hải Đăng', phone: '0978901234', userId: null },
];

const NHAN_XET_MAU = [
  'Sân bóng đá cỏ nhân tạo rất êm, đèn chiếu sáng ban đêm cực kỳ rõ nét!',
  'Sân cầu lông thảm sạch sẽ, độ bám tốt, không bị trơn trượt.',
  'Dịch vụ nước uống lạnh phục vụ tận sân rất chu đáo và nhanh nhẹn.',
  'Thuê vợt và giày thể thao mới tinh, chất lượng tốt hơn mong đợi.',
  'Phòng tiệc máy lạnh mát rượi, không gian thoáng đãng tổ chức sinh nhật rất vui.',
  'Khu nướng BBQ ngoài trời cực chill, đồ nướng ướp đậm đà, bạn bè rất thích.',
  'Nhân viên hỗ trợ nhiệt tình, check-in quét mã nhanh chóng.',
  'Giá cả hợp lý so với cơ sở vật chất 5 sao, chắc chắn sẽ quay lại thường xuyên.',
  'Sân tennis chuẩn thi đấu, khán đài mini sạch đẹp.',
  'Sân pickleball mái che mát mẻ, chơi giữa trưa không bị nắng gắt.',
];

async function chaySeed() {
  console.log('⏳ [Seed 300 Đơn] Đang kết nối MySQL...');
  const conn = await mysql.createConnection(CAU_HINH);

  try {
    // 1. Lấy bảng giá khung giờ và thông tin sân
    const [priceRows] = await conn.execute<RowDataPacket[]>(
      'SELECT loai_san_id, khung_gio_id, loai_ngay, gia FROM gia_khung_gio'
    );
    const priceMap = new Map<string, number>();
    priceRows.forEach((r) => {
      priceMap.set(`${r.loai_san_id}_${r.khung_gio_id}_${r.loai_ngay}`, Number(r.gia));
    });

    const [courtRows] = await conn.execute<RowDataPacket[]>(
      'SELECT id, loai_san_id, ten FROM san WHERE trang_thai = "ACTIVE"'
    );
    const [slotRows] = await conn.execute<RowDataPacket[]>(
      'SELECT id, gio_bat_dau, gio_ket_thuc FROM khung_gio ORDER BY id ASC'
    );
    const [serviceRows] = await conn.execute<RowDataPacket[]>(
      'SELECT id, ten, phan_loai, don_gia, don_vi_tinh FROM dich_vu WHERE trang_thai = "ACTIVE"'
    );

    // Lấy các slot đã được đặt từ trước để tránh trùng lặp
    const [existingSlots] = await conn.execute<RowDataPacket[]>(
      'SELECT san_id, DATE_FORMAT(ngay_dat, "%Y-%m-%d") as d, khung_gio_id FROM chi_tiet_khung_gio_dat WHERE dang_khoa = 1'
    );
    const usedSlots = new Set<string>();
    existingSlots.forEach((r) => {
      usedSlots.add(`${r.san_id}_${r.d}_${r.khung_gio_id}`);
    });

    console.log(`📊 Số slot đã bị chiếm trước đó: ${usedSlots.size}`);

    // Chuẩn bị danh sách ngày từ 2026-09-01 đến 2026-10-13 (43 ngày)
    const dates: string[] = [];
    const startDate = new Date('2026-09-01');
    const endDate = new Date('2026-10-13');
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().substring(0, 10));
    }

    console.log(`📅 Trải đều dữ liệu trong ${dates.length} ngày (từ 01/09/2026 đến 13/10/2026)`);

    let countCreated = 0;
    const TARGET = 300;

    // Bắt đầu tạo 300 đơn
    for (let i = 0; i < TARGET; i++) {
      const dateStr = dates[i % dates.length];
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType = isWeekend ? 'WEEKEND' : 'WEEKDAY';

      // Chọn sân ngẫu nhiên
      const court = randomChoice(courtRows);
      const courtId = court.id;
      const courtTypeId = court.loai_san_id;

      // Tìm khung giờ trống cho sân này vào ngày này
      const availableSlotIds: number[] = [];
      for (let sId = 1; sId <= 16; sId++) {
        if (!usedSlots.has(`${courtId}_${dateStr}_${sId}`)) {
          availableSlotIds.push(sId);
        }
      }

      if (availableSlotIds.length === 0) {
        continue; // Ngày này sân này đã kín, sang lượt sau
      }

      // Chọn 1 hoặc 2 slot liên tiếp
      const startSlotId = randomChoice(availableSlotIds);
      const wantTwoSlots = Math.random() < 0.45 && availableSlotIds.includes(startSlotId + 1);
      const selectedSlotIds = wantTwoSlots ? [startSlotId, startSlotId + 1] : [startSlotId];

      // Đánh dấu slot đã dùng
      selectedSlotIds.forEach((sId) => usedSlots.add(`${courtId}_${dateStr}_${sId}`));

      const firstSlot = slotRows.find((s) => s.id === selectedSlotIds[0])!;
      const lastSlot = slotRows.find((s) => s.id === selectedSlotIds[selectedSlotIds.length - 1])!;
      const startTime = firstSlot.gio_bat_dau;
      const endTime = lastSlot.gio_ket_thuc;

      // Tính tiền sân
      let tienSan = 0;
      const slotPriceList: { slotId: number; price: number }[] = [];
      for (const sId of selectedSlotIds) {
        const p = priceMap.get(`${courtTypeId}_${sId}_${dayType}`) || 150000;
        tienSan += p;
        slotPriceList.push({ slotId: sId, price: p });
      }

      // Chọn khách hàng
      const customer = randomChoice(DANH_SACH_KHACH);

      // Phân bổ trạng thái:
      // ~75% COMPLETED, 13% CONFIRMED, 7% CANCELLED, 4% NO_SHOW, 1% DEBT_CLOSED
      const randStatus = Math.random();
      let status: 'COMPLETED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' = 'COMPLETED';
      let isDebtClosed = 0;
      let paymentStatus: 'PAID' | 'UNPAID' | 'REFUNDED' = 'PAID';
      let paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'VNPAY' = randomChoice(['CASH', 'BANK_TRANSFER', 'VNPAY']);

      if (randStatus < 0.74) {
        status = 'COMPLETED';
        paymentStatus = 'PAID';
      } else if (randStatus < 0.87) {
        status = 'CONFIRMED';
        paymentStatus = Math.random() < 0.8 ? 'PAID' : 'UNPAID';
      } else if (randStatus < 0.94) {
        status = 'CANCELLED';
        paymentStatus = Math.random() < 0.5 ? 'REFUNDED' : 'UNPAID';
      } else if (randStatus < 0.98) {
        status = 'NO_SHOW';
        paymentStatus = 'PAID';
      } else {
        status = 'COMPLETED';
        isDebtClosed = 1;
        paymentStatus = 'PAID';
      }

      const bookingCode = sinhMaDon();
      const createdAt = `${dateStr} ${String(randomInt(7, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}:00`;

      // 1. Chèn đơn đặt
      const [resDon] = await conn.execute<ResultSetHeader>(
        `INSERT INTO don_dat (
           ma_don_dat, nguoi_dung_id, ten_khach, so_dien_thoai_khach,
           san_id, ngay_dat, gio_bat_dau, gio_ket_thuc,
           tien_san, tien_dich_vu, dong_don_cong_no,
           trang_thai, phuong_thuc_thanh_toan, trang_thai_thanh_toan,
           nguon_don, ghi_chu, ngay_tao
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingCode,
          customer.userId,
          customer.name,
          customer.phone,
          courtId,
          dateStr,
          startTime,
          endTime,
          tienSan,
          isDebtClosed,
          status,
          paymentMethod,
          paymentStatus,
          customer.userId ? 'APP' : 'STAFF',
          isDebtClosed ? 'Đơn đóng có công nợ được Admin duyệt theo quy tắc BR-33' : null,
          createdAt,
        ]
      );

      const bookingId = resDon.insertId;

      // 2. Chèn chi tiết khung giờ
      const isSlotLocked = status === 'CANCELLED' ? null : 1;
      for (const sp of slotPriceList) {
        await conn.execute(
          `INSERT INTO chi_tiet_khung_gio_dat (don_dat_id, san_id, ngay_dat, khung_gio_id, gia, dang_khoa)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [bookingId, courtId, dateStr, sp.slotId, sp.price, isSlotLocked]
        );
      }

      // 3. Thanh toán tiền sân
      if (paymentStatus === 'PAID') {
        await conn.execute(
          `INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, nguoi_xu_ly_id, ngay_tao, ngay_xu_ly)
           VALUES (?, 'PAYMENT', 'COURT', ?, ?, 'SUCCESS', 2, ?, ?)`,
          [bookingId, paymentMethod, tienSan, createdAt, createdAt]
        );
      } else if (paymentStatus === 'REFUNDED') {
        // Đã thanh toán rồi hoàn tiền lại
        await conn.execute(
          `INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, nguoi_xu_ly_id, ngay_tao, ngay_xu_ly)
           VALUES (?, 'PAYMENT', 'COURT', ?, ?, 'SUCCESS', 2, ?, ?)`,
          [bookingId, paymentMethod, tienSan, createdAt, createdAt]
        );
        const refundTime = `${dateStr} 20:00:00`;
        await conn.execute(
          `INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, nguoi_xu_ly_id, ghi_chu, ngay_tao, ngay_xu_ly)
           VALUES (?, 'REFUND', 'COURT', ?, ?, 'SUCCESS', 2, 'Hoàn tiền hủy đơn trước 12h theo BR-34', ?, ?)`,
          [bookingId, paymentMethod, Math.round(tienSan * 0.9), refundTime, refundTime]
        );
      }

      // 4. Sinh dịch vụ đi kèm (Đồ uống, Thuê đồ, Gói tiệc)
      // Khoảng 60% đơn có phát sinh dịch vụ
      let tongTienDichVu = 0;
      const hasServices = (status === 'COMPLETED' || status === 'CONFIRMED') && Math.random() < 0.62;

      if (hasServices) {
        // Lựa chọn dịch vụ phù hợp loại sân
        let candidateServices = serviceRows;
        if (courtTypeId === 5) {
          // Khu sự kiện/tiệc -> ưu tiên gói tiệc và đồ uống
          candidateServices = serviceRows.filter((s) => s.phan_loai === 'PACKAGE' || s.phan_loai === 'DRINK');
        } else {
          // Sân thể thao -> nước uống và thuê dụng cụ
          candidateServices = serviceRows.filter((s) => s.phan_loai === 'DRINK' || s.phan_loai === 'RENTAL');
        }

        // Chọn 1-3 món
        const numItems = randomInt(1, Math.min(3, candidateServices.length));
        const selectedSvList: any[] = [];
        for (let k = 0; k < numItems; k++) {
          const sv = randomChoice(candidateServices);
          if (!selectedSvList.some((x) => x.id === sv.id)) {
            const qty = sv.phan_loai === 'PACKAGE' ? 1 : randomInt(1, 4);
            selectedSvList.push({ ...sv, qty });
          }
        }

        if (selectedSvList.length > 0) {
          // Tạo yeu_cau_dich_vu
          const serviceTime = `${dateStr} ${startTime}`;
          const [resYc] = await conn.execute<ResultSetHeader>(
            `INSERT INTO yeu_cau_dich_vu (don_dat_id, trang_thai, nguon, nguoi_yeu_cau_id, nguoi_giao_id, giao_luc, ngay_tao)
             VALUES (?, 'DELIVERED', 'APP', ?, 2, ?, ?)`,
            [bookingId, customer.userId || 2, serviceTime, serviceTime]
          );
          const ycId = resYc.insertId;

          for (const sv of selectedSvList) {
            const itemTotal = sv.qty * sv.don_gia;
            tongTienDichVu += itemTotal;
            await conn.execute(
              `INSERT INTO chi_tiet_yeu_cau_dich_vu (yeu_cau_dich_vu_id, dich_vu_id, so_luong, don_gia, tra_luc, nguoi_nhan_tra_id)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                ycId,
                sv.id,
                sv.qty,
                sv.don_gia,
                sv.phan_loai === 'RENTAL' ? `${dateStr} ${endTime}` : null,
                sv.phan_loai === 'RENTAL' ? 2 : null,
              ]
            );
          }

          // Cập nhật lại tien_dich_vu trong don_dat
          await conn.execute('UPDATE don_dat SET tien_dich_vu = ? WHERE id = ?', [tongTienDichVu, bookingId]);

          // Thu tiền dịch vụ
          if (status === 'COMPLETED' && !isDebtClosed) {
            await conn.execute(
              `INSERT INTO thanh_toan (don_dat_id, loai_giao_dich, muc_dich, phuong_thuc, so_tien, trang_thai, nguoi_xu_ly_id, ngay_tao, ngay_xu_ly)
               VALUES (?, 'PAYMENT', 'SERVICE', ?, ?, 'SUCCESS', 2, ?, ?)`,
              [bookingId, paymentMethod, tongTienDichVu, serviceTime, serviceTime]
            );
          }
        }
      }

      // 5. Ghi nhật ký trạng thái
      await conn.execute(
        `INSERT INTO nhat_ky_trang_thai_don (don_dat_id, trang_thai_truoc, trang_thai_sau, nguoi_thuc_hien_id, ghi_chu, ngay_tao)
         VALUES (?, NULL, 'PENDING', ?, 'Khách hàng tạo đơn đặt sân', ?)`,
        [bookingId, customer.userId || 2, createdAt]
      );
      if (status !== 'PENDING') {
        await conn.execute(
          `INSERT INTO nhat_ky_trang_thai_don (don_dat_id, trang_thai_truoc, trang_thai_sau, nguoi_thuc_hien_id, ghi_chu, ngay_tao)
           VALUES (?, 'PENDING', ?, 2, ?, ?)`,
          [bookingId, status, `Hệ thống chuyển trạng thái sang ${status}`, createdAt]
        );
      }

      // 6. Đánh giá khách hàng (khoảng 35% các đơn COMPLETED có khách đánh giá)
      if (status === 'COMPLETED' && customer.userId && Math.random() < 0.4) {
        const rating = randomChoice([4, 5, 5, 5]);
        const comment = randomChoice(NHAN_XET_MAU);
        await conn.execute(
          `INSERT IGNORE INTO danh_gia (don_dat_id, nguoi_dung_id, so_sao, nhan_xet, ngay_tao)
           VALUES (?, ?, ?, ?, ?)`,
          [bookingId, customer.userId, rating, comment, `${dateStr} 21:30:00`]
        );
      }

      countCreated++;
      if (countCreated % 50 === 0 || countCreated === TARGET) {
        console.log(`✅ Đã tạo thành công ${countCreated}/${TARGET} đơn đặt sân...`);
      }
    }

    console.log(`\n🎉 HOÀN TẤT TẠO ${countCreated} ĐƠN ĐẶT SÂN THÀNH CÔNG!`);

    // Tổng kết dữ liệu sau khi seed
    const [statTotal] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as c FROM don_dat');
    const [statSlots] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as c FROM chi_tiet_khung_gio_dat');
    const [statPayments] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as c, SUM(so_tien) as total FROM thanh_toan WHERE trang_thai = "SUCCESS"');
    const [statServices] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as c FROM chi_tiet_yeu_cau_dich_vu');
    const [statReviews] = await conn.execute<RowDataPacket[]>('SELECT COUNT(*) as c, AVG(so_sao) as avg_rating FROM danh_gia');

    console.log('================ BẢNG TỔNG KẾT HỆ THỐNG SAU KHI SEED ================');
    console.log(`📁 Tổng số đơn đặt (don_dat):                 ${statTotal[0].c}`);
    console.log(`🏟️ Tổng số slot sân đã đặt:                   ${statSlots[0].c}`);
    console.log(`💳 Tổng số giao dịch thanh toán thành công:   ${statPayments[0].c} (Doanh số: ${Number(statPayments[0].total).toLocaleString('vi-VN')} ₫)`);
    console.log(`🥤 Tổng số món dịch vụ đã phục vụ:            ${statServices[0].c}`);
    console.log(`⭐ Tổng số đánh giá sao của khách:            ${statReviews[0].c} (Điểm TB: ${Number(statReviews[0].avg_rating).toFixed(1)}/5 sao)`);
    console.log('=====================================================================');
  } catch (err) {
    console.error('❌ Lỗi khi tạo dữ liệu seed:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

chaySeed();
