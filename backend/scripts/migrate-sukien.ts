import { csdl } from '../src/config/csdl';

async function migrate() {
  console.log('⏳ Đang tạo bảng su_kien...');
  await csdl.execute(`
    CREATE TABLE IF NOT EXISTS su_kien (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      tieu_de       VARCHAR(255) NOT NULL,
      mo_ta_ngan    VARCHAR(500) NOT NULL,
      noi_dung      TEXT NOT NULL,
      hinh_anh      VARCHAR(500) NOT NULL,
      ngay_bat_dau  DATETIME NOT NULL,
      ngay_ket_thuc DATETIME NOT NULL,
      dia_diem      VARCHAR(255) NOT NULL,
      san_id        INT UNSIGNED NULL,
      phi_tham_gia  INT UNSIGNED NOT NULL DEFAULT 0,
      phan_thuong   VARCHAR(255) NULL,
      trang_thai    ENUM('UPCOMING','HAPPENING','FINISHED') NOT NULL DEFAULT 'UPCOMING',
      hotline_lh    VARCHAR(30) NOT NULL DEFAULT '0900000001',
      ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sukien_trangthai (trang_thai),
      KEY idx_sukien_ngay (ngay_bat_dau),
      CONSTRAINT fk_sukien_san FOREIGN KEY (san_id) REFERENCES san (id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  console.log('🌱 Đang chèn dữ liệu sự kiện mẫu của sân...');
  // Xóa cũ nếu đã tồn tại để nạp mới dữ liệu chuẩn
  await csdl.execute('TRUNCATE TABLE su_kien');

  await csdl.execute(`
    INSERT INTO su_kien (id, tieu_de, mo_ta_ngan, noi_dung, hinh_anh, ngay_bat_dau, ngay_ket_thuc, dia_diem, san_id, phi_tham_gia, phan_thuong, trang_thai, hotline_lh) VALUES
    (
      1,
      'Giải Vô Địch Cầu Lông Đôi Nam Nữ Sân 24/7 Mở Rộng 2026',
      'Giải đấu phong trào quy mô lớn nhất năm quy tụ 32 cặp VĐV xuất sắc toàn thành phố.',
      'Thể thức thi đấu vòng bảng loại trực tiếp theo chuẩn Liên đoàn Cầu lông. Mỗi bảng 4 cặp lấy 2 cặp nhất nhì vào tứ kết. Cơ sở tài trợ 100% nước uống, trái cây và hỗ trợ trọng tài chính thức. Cơ hội cọ xát, nâng cao kỹ chiến thuật và kết nối cộng đồng yêu cầu lông.',
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      '2026-10-25 08:00:00',
      '2026-10-25 18:30:00',
      'Nhà thi đấu Cầu lông (Sân CL1, CL2, CL3)',
      3,
      200000,
      'Cúp vô địch + Huy chương vàng + 10.000.000 ₫ tiền mặt',
      'UPCOMING',
      '0900000001'
    ),
    (
      2,
      'Cúp Tứ Hùng Bóng Đá Mini 5 Người - Mùa Thu 2026',
      'Giải đấu tranh cúp giao hữu giữa 8 câu lạc bộ thể thao phong trào cuối tuần sôi động.',
      'Đá knock-out trực tiếp hai hiệp 25 phút. Đội vô địch nhận cúp vàng danh giá và bộ trang phục thi đấu cao cấp. Có bình luận viên trực tiếp, quay phát livestream và chụp ảnh kỷ niệm chuyên nghiệp cho toàn bộ các trận đấu.',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      '2026-10-18 17:30:00',
      '2026-10-18 21:30:00',
      'Cụm Sân Bóng Đá Mini 5A & 5B',
      1,
      500000,
      'Cúp vàng + Cờ lưu niệm + 15.000.000 ₫ giải nhất',
      'HAPPENING',
      '0900000001'
    ),
    (
      3,
      'Workshop & Ngày Hội Giao Lưu Pickleball Miễn Phí',
      'Trải nghiệm môn thể thao hot nhất năm cùng Huấn luyện viên chuyên nghiệp có bằng quốc tế.',
      'Chương trình hoàn toàn MIỄN PHÍ dành cho người mới bắt đầu và người chơi muốn hoàn thiện cú dink, smash. Được mượn vợt Pickleball và bóng thi đấu miễn phí. Có mini game bốc thăm trúng thưởng vợt cao cấp cuối buổi.',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      '2026-10-22 15:00:00',
      '2026-10-22 18:00:00',
      'Khu Sân Pickleball 1 & 2',
      7,
      0,
      'Tặng 3 vợt Pickleball carbon cho người may mắn',
      'UPCOMING',
      '0900000002'
    ),
    (
      4,
      'Đêm Hội Thể Thao & Đại Tiệc Âm Nhạc BBQ Cuối Tuần',
      'Giao lưu thể thao kết hợp nướng BBQ sân vườn, ca nhạc Acoustic và rút thăm may mắn.',
      'Khách tham gia được chơi thể thao tự do (bóng đá, cầu lông, pickleball) từ 16h-18h, sau đó cùng thưởng thức tiệc BBQ hải sản nướng ngoài trời, bia tươi và thưởng thức đêm nhạc Acoustic lãng mạn dưới ánh đèn trang trí lung linh.',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      '2026-10-31 16:30:00',
      '2026-10-31 22:30:00',
      'Khu BBQ ngoài trời & Phòng tiệc A',
      9,
      350000,
      'Voucher 1.000.000 ₫ đặt sân & quà tặng lưu niệm',
      'UPCOMING',
      '0900000001'
    );
  `);

  console.log('🌱 Đang kiểm tra và bổ sung danh mục Gói Tiệc Trọn Gói trong dich_vu...');
  // Đảm bảo các gói tiệc trọn gói phong phú có sẵn trong bảng dich_vu
  await csdl.execute(`
    INSERT INTO dich_vu (id, ten, phan_loai, don_vi_tinh, don_gia, mo_ta, hinh_anh, trang_thai) VALUES
    (12, 'Gói Đại Tiệc BBQ Sân Vườn Hoàng Hôn', 'PACKAGE', 'gói', 2500000, 'Thịt bò Mỹ ướp sẵn, tôm càng nướng, xúc xích Đức, rau củ quả, bếp nướng than hoa, phục vụ bàn ghế sân vườn cho 15-25 khách', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
    (13, 'Gói Tiệc Sinh Nhật / Thôi Nôi Thể Thao', 'PACKAGE', 'gói', 3200000, 'Backdrop bóng bay thiết kế theo yêu cầu, bánh kem 3 tầng Tous Les Jours, nước ngọt, phòng tiệc máy lạnh riêng tư 20-35 khách', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
    (14, 'Gói Gala Dinner & Team Building Doanh Nghiệp', 'PACKAGE', 'gói', 5500000, 'Dàn âm thanh karaoke công suất lớn, MC dẫn chương trình thể thao, tiệc mặn 6 món thịnh soạn, sân khấu riêng 30-60 khách', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
    (15, 'Gói Tiệc Trà & Giao Lưu Thi Đấu', 'PACKAGE', 'gói', 800000, 'Trà hoa quả nhiệt đới, đĩa trái cây tươi nhập khẩu, bánh ngọt teabreak, không gian giao lưu ấm cúng cho 10-15 khách', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80', 'ACTIVE')
    ON DUPLICATE KEY UPDATE
      ten = VALUES(ten),
      don_gia = VALUES(don_gia),
      mo_ta = VALUES(mo_ta),
      hinh_anh = VALUES(hinh_anh),
      trang_thai = 'ACTIVE';
  `);

  console.log('🌱 Đang nạp số lượng tồn kho cho các gói tiệc 12, 13, 14, 15...');
  await csdl.execute(`
    INSERT INTO ton_kho_dich_vu (dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao) VALUES
      (12, 99, 0, 5),
      (13, 99, 0, 5),
      (14, 99, 0, 5),
      (15, 99, 0, 5)
    ON DUPLICATE KEY UPDATE so_luong = 99;
  `);

  console.log('✅ Hoàn tất migration bảng su_kien và cập nhật gói tiệc!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Lỗi migration sự kiện:', err);
  process.exit(1);
});
