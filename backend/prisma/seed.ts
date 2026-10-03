// ============================================================
// PRISMA SEED — Dữ liệu mẫu ban đầu
// Chạy: npm run db:seed
// ============================================================
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // --- 1. Loại sân ---
  const loaiSanData = [
    { ten: 'Cầu Lông',    emoji: '🏸', mauSac: '#00C896', thuTu: 1 },
    { ten: 'Bóng Đá',     emoji: '⚽', mauSac: '#4CAF50', thuTu: 2 },
    { ten: 'Tennis',      emoji: '🎾', mauSac: '#FF9800', thuTu: 3 },
    { ten: 'Bóng Rổ',     emoji: '🏀', mauSac: '#F44336', thuTu: 4 },
    { ten: 'Pickleball',  emoji: '🏓', mauSac: '#9C27B0', thuTu: 5 },
    { ten: 'Bơi Lội',     emoji: '🏊', mauSac: '#2196F3', thuTu: 6 },
    { ten: 'Bóng Chuyền', emoji: '🏐', mauSac: '#FF5722', thuTu: 7 },
  ];

  const loaiSanCreated: Record<string, string> = {};
  for (const ls of loaiSanData) {
    const created = await prisma.loaiSan.upsert({
      where: { ten: ls.ten },
      update: {},
      create: ls,
    });
    loaiSanCreated[ls.ten] = created.id;
  }
  console.log('✅ Đã tạo', Object.keys(loaiSanCreated).length, 'loại sân');

  // --- 2. Tài khoản mẫu ---
  const matKhauHash = await bcrypt.hash('Abc@123456', 12);

  // Đổi email cũ sang @gmail.com nếu đã tồn tại trong DB
  await prisma.nguoiDung.updateMany({
    where: { email: 'admin@santhethao.vn' },
    data: { email: 'admin@gmail.com' },
  });
  await prisma.nguoiDung.updateMany({
    where: { email: 'nhanvien@santhethao.vn' },
    data: { email: 'nhanvien@gmail.com' },
  });

  await prisma.nguoiDung.upsert({
    where: { soDienThoai: '0901234567' },
    update: { email: 'admin@gmail.com', matKhauHash, vaiTro: 'ADMIN' },
    create: {
      hoTen: 'Quản Trị Viên',
      email: 'admin@gmail.com',
      soDienThoai: '0901234567',
      matKhauHash,
      vaiTro: 'ADMIN',
    },
  });

  await prisma.nguoiDung.upsert({
    where: { soDienThoai: '0912345678' },
    update: { email: 'nhanvien@gmail.com', matKhauHash, vaiTro: 'STAFF' },
    create: {
      hoTen: 'Nguyễn Văn A (Nhân Viên)',
      email: 'nhanvien@gmail.com',
      soDienThoai: '0912345678',
      matKhauHash,
      vaiTro: 'STAFF',
    },
  });

  await prisma.nguoiDung.upsert({
    where: { soDienThoai: '0987654321' },
    update: { email: 'khachhang@gmail.com', matKhauHash, vaiTro: 'CUSTOMER' },
    create: {
      hoTen: 'Trần Văn B',
      email: 'khachhang@gmail.com',
      soDienThoai: '0987654321',
      matKhauHash,
      vaiTro: 'CUSTOMER',
    },
  });
  console.log('✅ Đã tạo 3 tài khoản mẫu (Admin / Staff / Customer) với định dạng @gmail.com');
  console.log('   📧 Email: admin@gmail.com | nhanvien@gmail.com | khachhang@gmail.com');
  console.log('   🔑 Mật khẩu chung: Abc@123456');

  // --- 3. Sân mẫu ---
  const sanCauLong = await prisma.san.upsert({
    where: { id: 'san-cau-long-phu-tho' },
    update: {},
    create: {
      id: 'san-cau-long-phu-tho',
      tenSan: 'Sân Cầu Lông Phú Thọ',
      loaiSanId: loaiSanCreated['Cầu Lông'],
      diaChi: '112 Lý Thường Kiệt, Phường 8, Quận 10, TP.HCM',
      viDo: 10.7626,
      kinhDo: 106.6603,
      gioMoCua: '06:00',
      gioDongCua: '22:00',
      soPhutMoiSlot: 60,
      hotline: '028 3862 1234',
      moTa: 'Sân cầu lông tiêu chuẩn quốc tế, mái che kiên cố, hệ thống đèn LED hiện đại.',
      giaTienThapDiem: 80000,
      giaTienCaoDiem: 120000,
      tienIch: JSON.stringify(['Đèn chiếu sáng', 'Phòng thay đồ', 'Cho thuê vợt', 'Bãi đỗ xe', 'WiFi', 'Căng-tin']),
      diemDanhGia: 4.8,
      soLuotDanhGia: 128,
    },
  });

  // Cấu hình Peak Hours cho sân cầu lông
  await prisma.khungGioCauHinh.deleteMany({ where: { sanId: sanCauLong.id } });
  await prisma.khungGioCauHinh.createMany({
    data: [
      // T2–T6: 17:00–21:00 là cao điểm
      { sanId: sanCauLong.id, ngayTrongTuan: 1, gioTu: '17:00', gioDen: '21:00', laCaoDiem: true },
      { sanId: sanCauLong.id, ngayTrongTuan: 2, gioTu: '17:00', gioDen: '21:00', laCaoDiem: true },
      { sanId: sanCauLong.id, ngayTrongTuan: 3, gioTu: '17:00', gioDen: '21:00', laCaoDiem: true },
      { sanId: sanCauLong.id, ngayTrongTuan: 4, gioTu: '17:00', gioDen: '21:00', laCaoDiem: true },
      { sanId: sanCauLong.id, ngayTrongTuan: 5, gioTu: '17:00', gioDen: '21:00', laCaoDiem: true },
      // T7–CN: cả ngày cao điểm
      { sanId: sanCauLong.id, ngayTrongTuan: 6, gioTu: '06:00', gioDen: '22:00', laCaoDiem: true },
      { sanId: sanCauLong.id, ngayTrongTuan: 0, gioTu: '06:00', gioDen: '22:00', laCaoDiem: true },
    ],
  });

  await prisma.san.upsert({
    where: { id: 'san-tennis-tan-binh' },
    update: {},
    create: {
      id: 'san-tennis-tan-binh',
      tenSan: 'Sân Tennis Tân Bình Sport',
      loaiSanId: loaiSanCreated['Tennis'],
      diaChi: '45 Hoàng Văn Thụ, Phường 8, Quận Tân Bình, TP.HCM',
      gioMoCua: '06:00',
      gioDongCua: '21:00',
      soPhutMoiSlot: 60,
      hotline: '028 3845 6789',
      giaTienThapDiem: 150000,
      giaTienCaoDiem: 220000,
      tienIch: JSON.stringify(['Đèn chiếu sáng', 'Phòng thay đồ', 'Máy lạnh', 'Cho thuê vợt', 'Bãi đỗ xe']),
      diemDanhGia: 4.5,
      soLuotDanhGia: 76,
    },
  });

  await prisma.san.upsert({
    where: { id: 'san-bong-da-go-vap' },
    update: {},
    create: {
      id: 'san-bong-da-go-vap',
      tenSan: 'Sân Bóng Đá Mini Gò Vấp',
      loaiSanId: loaiSanCreated['Bóng Đá'],
      diaChi: '213 Nguyễn Văn Nghi, Phường 7, Quận Gò Vấp, TP.HCM',
      gioMoCua: '06:00',
      gioDongCua: '23:00',
      soPhutMoiSlot: 60,
      hotline: '028 3891 2345',
      giaTienThapDiem: 200000,
      giaTienCaoDiem: 300000,
      tienIch: JSON.stringify(['Đèn chiếu sáng', 'Phòng thay đồ', 'Căng-tin', 'Bãi đỗ xe']),
      diemDanhGia: 4.3,
      soLuotDanhGia: 215,
    },
  });
  console.log('✅ Đã tạo 3 sân mẫu');

  // --- 4. Đồ uống mẫu ---
  const doUongData = [
    { ten: 'Nước suối Lavie 500ml',  danhMuc: 'Nước suối',  giaBan: 10000, giaNhap: 5000,  tonKho: 100 },
    { ten: 'Pocari Sweat 500ml',     danhMuc: 'Thể thao',   giaBan: 20000, giaNhap: 12000, tonKho: 50  },
    { ten: 'Revive Chanh 500ml',     danhMuc: 'Thể thao',   giaBan: 18000, giaNhap: 10000, tonKho: 60  },
    { ten: 'Pepsi 330ml (lon)',       danhMuc: 'Nước ngọt',  giaBan: 15000, giaNhap: 8000,  tonKho: 80  },
    { ten: 'Trà xanh C2 500ml',      danhMuc: 'Nước ngọt',  giaBan: 12000, giaNhap: 7000,  tonKho: 70  },
    { ten: 'Cà phê đá (tự pha)',      danhMuc: 'Cà phê',     giaBan: 25000, giaNhap: 8000,  tonKho: 30  },
    { ten: 'Nước ép cam tươi',        danhMuc: 'Nước ép',    giaBan: 35000, giaNhap: 15000, tonKho: 20  },
  ];

  for (const du of doUongData) {
    await prisma.doUong.upsert({
      where: { id: du.ten.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: { ...du, id: du.ten.toLowerCase().replace(/\s/g, '-'), nguongCanhBao: 10 },
    });
  }
  console.log('✅ Đã tạo', doUongData.length, 'sản phẩm đồ uống mẫu');

  // --- 5. Voucher mẫu ---
  await prisma.voucher.upsert({
    where: { maVoucher: 'KHAICUONG2026' },
    update: {},
    create: {
      maVoucher: 'KHAICUONG2026',
      ten: 'Khai trương - Giảm 50.000đ',
      loai: 'FIXED',
      giaTriGiam: 50000,
      giaTriDonToiThieu: 100000,
      soLanToiDa: 100,
      ngayBatDau: new Date('2026-01-01'),
      ngayKetThuc: new Date('2026-12-31'),
    },
  });

  await prisma.voucher.upsert({
    where: { maVoucher: 'GIAM10PCT' },
    update: {},
    create: {
      maVoucher: 'GIAM10PCT',
      ten: 'Giảm 10% cho đơn từ 200k',
      loai: 'PERCENT',
      giaTriGiam: 10,
      giaTriDonToiThieu: 200000,
      soLanToiDa: 50,
      ngayBatDau: new Date('2026-01-01'),
      ngayKetThuc: new Date('2026-12-31'),
    },
  });
  console.log('✅ Đã tạo 2 voucher mẫu: KHAICUONG2026 | GIAM10PCT');

  console.log('\n🎉 Seed hoàn tất! Backend sẵn sàng hoạt động.\n');
}

main()
  .catch((e) => { console.error('❌ Seed thất bại:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
