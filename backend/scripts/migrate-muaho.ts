import { csdl } from '../src/config/csdl';

async function migrate() {
  console.log('⏳ Đang tạo bảng hoa_don_mua_ho...');
  await csdl.execute(`
    CREATE TABLE IF NOT EXISTS hoa_don_mua_ho (
      id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
      don_dat_id          INT UNSIGNED NOT NULL,
      loai_chi_phi        ENUM('GROCERY','CATERING','EQUIPMENT','OTHER') NOT NULL DEFAULT 'GROCERY',
      ten_khoan_chi       VARCHAR(255) NOT NULL,
      nha_cung_cap        VARCHAR(150) NULL,
      so_hoa_don          VARCHAR(100) NULL,
      loai_chung_tu       ENUM('ELECTRONIC','PAPER') NOT NULL DEFAULT 'PAPER',
      ngay_hoa_don        DATE NOT NULL,
      hinh_anh_chung_tu   VARCHAR(500) NULL,
      tien_hoa_don        INT UNSIGNED NOT NULL,
      phi_phuc_vu         INT UNSIGNED NOT NULL DEFAULT 0,
      tong_tien           INT UNSIGNED NOT NULL,
      chi_tiet_mon        TEXT NULL,
      ghi_chu             VARCHAR(500) NULL,
      trang_thai          ENUM('PENDING','CONFIRMED','BILLED','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
      nguoi_tao_id        INT UNSIGNED NOT NULL,
      ngay_tao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ngay_cap_nhat       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_hdmh_don_dat (don_dat_id),
      KEY idx_hdmh_trangthai (trang_thai),
      KEY idx_hdmh_ngay (ngay_hoa_don),
      CONSTRAINT fk_hdmh_don_dat FOREIGN KEY (don_dat_id) REFERENCES don_dat (id) ON DELETE CASCADE,
      CONSTRAINT fk_hdmh_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung (id)
    ) ENGINE=InnoDB;
  `);

  // Tạo một số hóa đơn mua hộ mẫu cho các đơn phòng tiệc / BBQ
  console.log('🌱 Đang chèn hóa đơn mua hộ mẫu cho đơn tiệc...');
  const [partyBookings]: any = await csdl.execute(`
    SELECT dd.id, dd.ngay_dat, dd.ma_don_dat, s.ten as ten_san
    FROM don_dat dd
    JOIN san s ON s.id = dd.san_id
    WHERE s.loai_san_id = 5 AND dd.trang_thai IN ('CONFIRMED', 'COMPLETED')
    ORDER BY dd.id DESC
    LIMIT 3
  `);

  if (partyBookings && partyBookings.length > 0) {
    const b1 = partyBookings[0];
    await csdl.execute(`
      INSERT INTO hoa_don_mua_ho (
        don_dat_id, loai_chi_phi, ten_khoan_chi, nha_cung_cap, so_hoa_don,
        loai_chung_tu, ngay_hoa_don, hinh_anh_chung_tu, tien_hoa_don, phi_phuc_vu,
        tong_tien, chi_tiet_mon, ghi_chu, trang_thai, nguoi_tao_id
      ) VALUES (
        ?, 'GROCERY', 'Thịt bò tảng Mỹ & Hải sản nướng BBQ', 'Siêu thị WinMart Times City', 'HDDT-2026-WM9921',
        'ELECTRONIC', ?, 'https://images.unsplash.com/photo-1554415707-9e49017aed81?auto=format&fit=crop&w=600&q=80',
        1450000, 100000, 1550000,
        '2kg sườn bò Mỹ (700k), 1.5kg tôm sú tươi (450k), 1kg mực lá (300k)',
        'Đã có file hóa đơn điện tử VAT gửi qua email khách hàng', 'BILLED', 2
      )
    `, [b1.id, b1.ngay_dat]);

    if (partyBookings.length > 1) {
      const b2 = partyBookings[1];
      await csdl.execute(`
        INSERT INTO hoa_don_mua_ho (
          don_dat_id, loai_chi_phi, ten_khoan_chi, nha_cung_cap, so_hoa_don,
          loai_chung_tu, ngay_hoa_don, hinh_anh_chung_tu, tien_hoa_don, phi_phuc_vu,
          tong_tien, chi_tiet_mon, ghi_chu, trang_thai, nguoi_tao_id
        ) VALUES (
          ?, 'CATERING', 'Bánh kem sinh nhật 3 tầng & Trái cây nhập khẩu', 'Tiệm bánh Tous Les Jours', 'BL-88301',
          'PAPER', ?, 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
          550000, 50000, 600000,
          '1 bánh kem bắp sinh nhật CLB (420k), giỏ nho mẫu đơn + táo Envy (130k)',
          'Hóa đơn giấy bán lẻ kèm phiếu giao hàng của tiệm bánh', 'CONFIRMED', 2
        )
      `, [b2.id, b2.ngay_dat]);
    }
  }

  console.log('✅ Bảng hoa_don_mua_ho và dữ liệu mẫu đã sẵn sàng!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Lỗi migration:', err);
  process.exit(1);
});
