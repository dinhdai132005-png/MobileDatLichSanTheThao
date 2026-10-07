-- =====================================================================
-- DATABASE SCHEMA: HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN THỂ THAO (sport_booking)
-- Chuẩn hóa: Toàn bộ bảng và cột dùng TIẾNG VIỆT KHÔNG DẤU (snake_case)
-- Đầy đủ 13 bảng theo thiết kế plant v1.2 (P0 + P1 + P1★ Dịch vụ phát sinh)
-- Engine InnoDB, Charset utf8mb4, MySQL 8.0.16+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sport_booking
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sport_booking;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS bien_dong_kho;
DROP TABLE IF EXISTS ton_kho_dich_vu;
DROP TABLE IF EXISTS chi_tiet_yeu_cau_dich_vu;
DROP TABLE IF EXISTS yeu_cau_dich_vu;
DROP TABLE IF EXISTS dich_vu;
DROP TABLE IF EXISTS danh_gia;
DROP TABLE IF EXISTS nhat_ky_trang_thai_don;
DROP TABLE IF EXISTS thanh_toan;
DROP TABLE IF EXISTS chi_tiet_khung_gio_dat;
DROP TABLE IF EXISTS don_dat;
DROP TABLE IF EXISTS gia_khung_gio;
DROP TABLE IF EXISTS khung_gio;
DROP TABLE IF EXISTS san;
DROP TABLE IF EXISTS loai_san;
DROP TABLE IF EXISTS nguoi_dung;
-- Dọn dẹp cả tên bảng tiếng Anh cũ nếu còn tồn tại
DROP TABLE IF EXISTS service_order_items;
DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS booking_status_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_slots;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS slot_prices;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS courts;
DROP TABLE IF EXISTS court_types;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== 1. nguoi_dung (Tài khoản người dùng: khách, nhân viên, quản trị) =====
CREATE TABLE nguoi_dung (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ho_ten        VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15)  NOT NULL,
  email         VARCHAR(150) NULL,
  mat_khau_hash VARCHAR(255) NOT NULL,
  vai_tro       ENUM('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  trang_thai    ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',
  ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nguoi_dung_sdt (so_dien_thoai),
  UNIQUE KEY uq_nguoi_dung_email (email),
  KEY idx_nguoi_dung_vaitro_trangthai (vai_tro, trang_thai)
) ENGINE=InnoDB;

-- ===== 2. loai_san (Loại môn thể thao hoặc khu sự kiện / tiệc) =====
CREATE TABLE loai_san (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten           VARCHAR(100) NOT NULL,
  phan_loai     ENUM('SPORT','EVENT') NOT NULL DEFAULT 'SPORT', -- SPORT: sân thể thao, EVENT: khu tiệc/BBQ
  mo_ta         VARCHAR(500) NULL,
  hoat_dong     TINYINT(1) NOT NULL DEFAULT 1,
  ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_loai_san_ten (ten)
) ENGINE=InnoDB;

-- ===== 3. san (Sân thể thao cụ thể hoặc phòng tiệc, khu BBQ) =====
CREATE TABLE san (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loai_san_id   INT UNSIGNED NOT NULL,
  ten           VARCHAR(100) NOT NULL,
  mo_ta         VARCHAR(1000) NULL,
  hinh_anh      VARCHAR(500) NULL,
  suc_chua      SMALLINT UNSIGNED NULL, -- Số lượng người (cho khu sự kiện / tiệc)
  trang_thai    ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_san_ten (ten),
  KEY idx_san_loai_trangthai (loai_san_id, trang_thai),
  CONSTRAINT fk_san_loai_san FOREIGN KEY (loai_san_id) REFERENCES loai_san (id)
) ENGINE=InnoDB;

-- ===== 4. khung_gio (Các khung giờ cố định 1 tiếng: 06:00 -> 22:00) =====
CREATE TABLE khung_gio (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  hoat_dong   TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_khung_gio_bat_dau (gio_bat_dau),
  CONSTRAINT chk_khung_gio_hop_le CHECK (gio_ket_thuc > gio_bat_dau)
) ENGINE=InnoDB;

-- ===== 5. gia_khung_gio (Ma trận giá: Loại sân x Khung giờ x Loại ngày) =====
CREATE TABLE gia_khung_gio (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loai_san_id  INT UNSIGNED NOT NULL,
  khung_gio_id INT UNSIGNED NOT NULL,
  loai_ngay    ENUM('WEEKDAY','WEEKEND') NOT NULL,
  gia          INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gia_khung_gio (loai_san_id, khung_gio_id, loai_ngay),
  CONSTRAINT fk_gia_loai_san  FOREIGN KEY (loai_san_id)  REFERENCES loai_san (id),
  CONSTRAINT fk_gia_khung_gio FOREIGN KEY (khung_gio_id) REFERENCES khung_gio (id)
) ENGINE=InnoDB;

-- ===== 6. don_dat (Đơn đặt sân) =====
CREATE TABLE don_dat (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ma_don_dat            VARCHAR(12) NOT NULL,
  nguoi_dung_id         INT UNSIGNED NULL,
  ten_khach             VARCHAR(100) NULL,
  so_dien_thoai_khach   VARCHAR(15)  NULL,
  san_id                INT UNSIGNED NOT NULL,
  ngay_dat              DATE NOT NULL,
  gio_bat_dau           TIME NOT NULL,
  gio_ket_thuc          TIME NOT NULL,
  tien_san              INT UNSIGNED NOT NULL,           -- Tổng tiền khung giờ sân
  tien_dich_vu          INT UNSIGNED NOT NULL DEFAULT 0, -- Cache tổng dịch vụ ĐÃ GIAO (DELIVERED)
  dong_don_cong_no      TINYINT(1) NOT NULL DEFAULT 0,   -- 1 = ADMIN đóng đơn có công nợ (BR-33)
  trang_thai            ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW')
                        NOT NULL DEFAULT 'PENDING',
  phuong_thuc_thanh_toan ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL,
  trang_thai_thanh_toan ENUM('UNPAID','PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  nguon_don             ENUM('APP','STAFF') NOT NULL DEFAULT 'APP',
  ghi_chu               VARCHAR(500) NULL,
  het_han_luc           DATETIME NULL,
  huy_luc               DATETIME NULL,
  ly_do_huy             VARCHAR(500) NULL,
  nguoi_tao_id          INT UNSIGNED NULL,
  ngay_tao              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_don_dat_ma (ma_don_dat),
  KEY idx_don_dat_san_ngay (san_id, ngay_dat),
  KEY idx_don_dat_user_trangthai (nguoi_dung_id, trang_thai),
  KEY idx_don_dat_trangthai_hethan (trang_thai, het_han_luc),
  KEY idx_don_dat_ngay_trangthai (ngay_dat, trang_thai),
  CONSTRAINT fk_don_dat_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
  CONSTRAINT fk_don_dat_san        FOREIGN KEY (san_id)        REFERENCES san (id),
  CONSTRAINT fk_don_dat_nguoi_tao  FOREIGN KEY (nguoi_tao_id)  REFERENCES nguoi_dung (id),
  CONSTRAINT chk_don_dat_khach_hang CHECK (nguoi_dung_id IS NOT NULL OR so_dien_thoai_khach IS NOT NULL),
  CONSTRAINT chk_don_dat_thoi_gian CHECK (gio_ket_thuc > gio_bat_dau)
) ENGINE=InnoDB;

-- ===== 7. chi_tiet_khung_gio_dat (Từng giờ của đơn + Khóa chống trùng lịch) =====
CREATE TABLE chi_tiet_khung_gio_dat (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  don_dat_id   INT UNSIGNED NOT NULL,
  san_id       INT UNSIGNED NOT NULL,
  ngay_dat     DATE NOT NULL,
  khung_gio_id INT UNSIGNED NOT NULL,
  gia          INT UNSIGNED NOT NULL,
  dang_khoa    TINYINT NULL DEFAULT 1, -- 1 = đang giữ slot, NULL = đã nhả slot
  PRIMARY KEY (id),
  -- Ràng buộc chống trùng lịch tuyệt đối (ER_DUP_ENTRY -> 409 SLOT_TAKEN)
  UNIQUE KEY uq_slot_dang_khoa (san_id, ngay_dat, khung_gio_id, dang_khoa),
  KEY idx_ctkg_don_dat (don_dat_id),
  CONSTRAINT fk_ctkg_don_dat   FOREIGN KEY (don_dat_id)   REFERENCES don_dat (id),
  CONSTRAINT fk_ctkg_san       FOREIGN KEY (san_id)       REFERENCES san (id),
  CONSTRAINT fk_ctkg_khung_gio FOREIGN KEY (khung_gio_id) REFERENCES khung_gio (id)
) ENGINE=InnoDB;

-- ===== 8. thanh_toan (Lịch sử thu tiền sân, thu tiền dịch vụ, hoàn tiền) =====
CREATE TABLE thanh_toan (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  don_dat_id      INT UNSIGNED NOT NULL,
  loai_giao_dich  ENUM('PAYMENT','REFUND') NOT NULL,
  muc_dich        ENUM('COURT','SERVICE') NOT NULL DEFAULT 'COURT', -- COURT: tiền sân, SERVICE: dịch vụ
  phuong_thuc     ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL,
  so_tien         INT UNSIGNED NOT NULL,
  trang_thai      ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  ma_giao_dich    VARCHAR(100) NULL,
  nguoi_xu_ly_id  INT UNSIGNED NULL, -- Nhân viên xác nhận
  ghi_chu         VARCHAR(500) NULL, -- Với REFUND: chứa refundInfo (BR-34)
  ngay_tao        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_xu_ly      DATETIME NULL,     -- Thời điểm giao dịch thành công
  PRIMARY KEY (id),
  KEY idx_thanh_toan_don_dat (don_dat_id),
  KEY idx_thanh_toan_trangthai_loai (trang_thai, loai_giao_dich),
  KEY idx_thanh_toan_ngay_xu_ly (ngay_xu_ly),
  CONSTRAINT fk_thanh_toan_don_dat  FOREIGN KEY (don_dat_id)     REFERENCES don_dat (id),
  CONSTRAINT fk_thanh_toan_nhan_vien FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung (id)
) ENGINE=InnoDB;

-- ===== 9. nhat_ky_trang_thai_don (Truy vết chuyển trạng thái đơn đặt) =====
CREATE TABLE nhat_ky_trang_thai_don (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  don_dat_id        INT UNSIGNED NOT NULL,
  trang_thai_truoc  ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NULL,
  trang_thai_sau    ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NOT NULL,
  nguoi_thuc_hien_id INT UNSIGNED NULL, -- NULL = hệ thống (job tự hết hạn)
  ghi_chu           VARCHAR(500) NULL,
  ngay_tao          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nhat_ky_don_dat (don_dat_id),
  CONSTRAINT fk_nhat_ky_don_dat   FOREIGN KEY (don_dat_id)         REFERENCES don_dat (id),
  CONSTRAINT fk_nhat_ky_nguoi_dung FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES nguoi_dung (id)
) ENGINE=InnoDB;

-- ===== 10. danh_gia (Khách hàng đánh giá sân 1-5 sao sau khi chơi) =====
CREATE TABLE danh_gia (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  don_dat_id    INT UNSIGNED NOT NULL,
  nguoi_dung_id INT UNSIGNED NOT NULL,
  so_sao        TINYINT UNSIGNED NOT NULL,
  nhan_xet      VARCHAR(1000) NULL,
  ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_danh_gia_don_dat (don_dat_id),
  KEY idx_danh_gia_nguoi_dung (nguoi_dung_id),
  CONSTRAINT fk_danh_gia_don_dat   FOREIGN KEY (don_dat_id)    REFERENCES don_dat (id),
  CONSTRAINT fk_danh_gia_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
  CONSTRAINT chk_danh_gia_so_sao CHECK (so_sao BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ===== 11. dich_vu (Danh mục đồ uống, thuê đồ, gói tiệc) =====
CREATE TABLE dich_vu (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ten           VARCHAR(100) NOT NULL,
  phan_loai     ENUM('DRINK','RENTAL','PACKAGE') NOT NULL,
  don_vi_tinh   VARCHAR(30)  NOT NULL DEFAULT 'cái',
  don_gia       INT UNSIGNED NOT NULL,
  mo_ta         VARCHAR(500) NULL,
  hinh_anh      VARCHAR(500) NULL,
  trang_thai    ENUM('ACTIVE','OUT_OF_STOCK','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  ngay_tao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dich_vu_ten (ten),
  KEY idx_dich_vu_loai_trangthai (phan_loai, trang_thai)
) ENGINE=InnoDB;

-- ===== 12. yeu_cau_dich_vu (Một lần gọi dịch vụ gắn với đơn sân) =====
CREATE TABLE yeu_cau_dich_vu (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  don_dat_id      INT UNSIGNED NOT NULL,
  trang_thai      ENUM('REQUESTED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  nguon           ENUM('APP','STAFF') NOT NULL DEFAULT 'APP',
  ghi_chu         VARCHAR(500) NULL,
  nguoi_yeu_cau_id INT UNSIGNED NULL, -- Khách gọi hoặc nhân viên nhập hộ
  nguoi_giao_id   INT UNSIGNED NULL, -- Nhân viên mang ra
  giao_luc        DATETIME NULL,
  huy_luc         DATETIME NULL,
  ly_do_huy       VARCHAR(500) NULL,
  ngay_tao        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ycdv_don_dat (don_dat_id),
  KEY idx_ycdv_trangthai_ngay (trang_thai, ngay_tao),
  CONSTRAINT fk_ycdv_don_dat       FOREIGN KEY (don_dat_id)       REFERENCES don_dat (id),
  CONSTRAINT fk_ycdv_nguoi_yeu_cau FOREIGN KEY (nguoi_yeu_cau_id) REFERENCES nguoi_dung (id),
  CONSTRAINT fk_ycdv_nguoi_giao    FOREIGN KEY (nguoi_giao_id)    REFERENCES nguoi_dung (id)
) ENGINE=InnoDB;

-- ===== 13. chi_tiet_yeu_cau_dich_vu (Từng món dịch vụ trong một lần gọi) =====
CREATE TABLE chi_tiet_yeu_cau_dich_vu (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  yeu_cau_dich_vu_id INT UNSIGNED NOT NULL,
  dich_vu_id         INT UNSIGNED NOT NULL,
  so_luong           SMALLINT UNSIGNED NOT NULL,
  don_gia            INT UNSIGNED NOT NULL, -- Giá snapshot lúc gọi (BR-23)
  tra_luc            DATETIME NULL,         -- Áp dụng cho RENTAL (BR-27)
  nguoi_nhan_tra_id  INT UNSIGNED NULL,     -- Nhân viên nhận lại đồ thuê
  PRIMARY KEY (id),
  KEY idx_ctycdv_yeu_cau (yeu_cau_dich_vu_id),
  KEY idx_ctycdv_dich_vu (dich_vu_id),
  CONSTRAINT fk_ctycdv_yeu_cau   FOREIGN KEY (yeu_cau_dich_vu_id) REFERENCES yeu_cau_dich_vu (id),
  CONSTRAINT fk_ctycdv_dich_vu   FOREIGN KEY (dich_vu_id)         REFERENCES dich_vu (id),
  CONSTRAINT fk_ctycdv_nguoi_tra FOREIGN KEY (nguoi_nhan_tra_id)  REFERENCES nguoi_dung (id),
  CONSTRAINT chk_ctycdv_so_luong CHECK (so_luong BETWEEN 1 AND 20)
) ENGINE=InnoDB;

-- ===== 14. ton_kho_dich_vu (Quản lý số lượng tồn kho và giữ chỗ của dịch vụ) =====
CREATE TABLE ton_kho_dich_vu (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dich_vu_id          INT UNSIGNED NOT NULL,
  so_luong            INT NOT NULL DEFAULT 0,
  so_luong_dang_giu   INT NOT NULL DEFAULT 0,
  nguong_canh_bao     INT NOT NULL DEFAULT 5,
  ngay_tao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ton_kho_dich_vu (dich_vu_id),
  KEY idx_ton_kho_so_luong (so_luong, so_luong_dang_giu),
  CONSTRAINT fk_ton_kho_dich_vu FOREIGN KEY (dich_vu_id) REFERENCES dich_vu (id) ON DELETE CASCADE,
  CONSTRAINT chk_ton_kho_so_luong CHECK (so_luong >= 0),
  CONSTRAINT chk_ton_kho_dang_giu CHECK (so_luong_dang_giu >= 0),
  CONSTRAINT chk_ton_kho_nguong CHECK (nguong_canh_bao >= 0),
  CONSTRAINT chk_ton_kho_hop_le CHECK (so_luong_dang_giu <= so_luong)
) ENGINE=InnoDB;

-- ===== 15. bien_dong_kho (Nhật ký truy vết giao dịch biến động tồn kho) =====
CREATE TABLE bien_dong_kho (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ton_kho_dich_vu_id  INT UNSIGNED NOT NULL,
  dich_vu_id          INT UNSIGNED NOT NULL,
  loai_bien_dong      ENUM('IMPORT','ADJUST_IN','ADJUST_OUT','RESERVE','RELEASE','DELIVER','RETURN') NOT NULL,
  so_luong            INT NOT NULL,
  so_luong_truoc      INT NOT NULL,
  so_luong_sau        INT NOT NULL,
  don_dat_id          INT UNSIGNED NULL,
  yeu_cau_dich_vu_id  INT UNSIGNED NULL,
  nguoi_thuc_hien_id  INT UNSIGNED NULL,
  ghi_chu             VARCHAR(500) NULL,
  ngay_tao            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bdk_ton_kho (ton_kho_dich_vu_id),
  KEY idx_bdk_dich_vu (dich_vu_id),
  KEY idx_bdk_loai_ngay (loai_bien_dong, ngay_tao),
  CONSTRAINT fk_bdk_ton_kho FOREIGN KEY (ton_kho_dich_vu_id) REFERENCES ton_kho_dich_vu (id) ON DELETE CASCADE,
  CONSTRAINT fk_bdk_dich_vu FOREIGN KEY (dich_vu_id) REFERENCES dich_vu (id) ON DELETE CASCADE,
  CONSTRAINT fk_bdk_don_dat FOREIGN KEY (don_dat_id) REFERENCES don_dat (id) ON DELETE SET NULL,
  CONSTRAINT fk_bdk_yeu_cau FOREIGN KEY (yeu_cau_dich_vu_id) REFERENCES yeu_cau_dich_vu (id) ON DELETE SET NULL,
  CONSTRAINT fk_bdk_nguoi_dung FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES nguoi_dung (id) ON DELETE SET NULL
) ENGINE=InnoDB;

