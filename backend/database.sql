-- ============================================================
-- CƠ SỞ DỮ LIỆU: ĐẶT LỊCH SÂN THỂ THAO
-- ============================================================

CREATE DATABASE IF NOT EXISTS `dat_lich_san_the_thao`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `dat_lich_san_the_thao`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `khuyen_mai_san`;
DROP TABLE IF EXISTS `voucher_don_dat`;
DROP TABLE IF EXISTS `voucher`;
DROP TABLE IF EXISTS `danh_gia`;
DROP TABLE IF EXISTS `chi_tiet_dung_cu`;
DROP TABLE IF EXISTS `dung_cu`;
DROP TABLE IF EXISTS `chi_tiet_fnb`;
DROP TABLE IF EXISTS `do_uong`;
DROP TABLE IF EXISTS `don_dat`;
DROP TABLE IF EXISTS `khung_gio_cau_hinh`;
DROP TABLE IF EXISTS `anh_san`;
DROP TABLE IF EXISTS `san`;
DROP TABLE IF EXISTS `loai_san`;
DROP TABLE IF EXISTS `nguoi_dung`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. BẢNG NGƯỜI DÙNG
CREATE TABLE `nguoi_dung` (
    `id` VARCHAR(191) NOT NULL,
    `hoTen` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `soDienThoai` VARCHAR(15) NOT NULL,
    `matKhauHash` VARCHAR(255) NOT NULL,
    `vaiTro` ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `capDoThanhVien` ENUM('THUONG', 'BAC', 'VANG', 'KIM_CUONG') NOT NULL DEFAULT 'THUONG',
    `tongLuotDat` INTEGER NOT NULL DEFAULT 0,
    `diemTichLuy` INTEGER NOT NULL DEFAULT 0,
    `avatarUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `nguoi_dung_email_key`(`email`),
    UNIQUE INDEX `nguoi_dung_soDienThoai_key`(`soDienThoai`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG LOẠI SÂN
CREATE TABLE `loai_san` (
    `id` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(50) NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,
    `mauSac` VARCHAR(10) NOT NULL,
    `thuTu` INTEGER NOT NULL DEFAULT 0,
    UNIQUE INDEX `loai_san_ten_key`(`ten`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG SÂN
CREATE TABLE `san` (
    `id` VARCHAR(191) NOT NULL,
    `tenSan` VARCHAR(150) NOT NULL,
    `loaiSanId` VARCHAR(191) NOT NULL,
    `diaChi` VARCHAR(300) NOT NULL,
    `viDo` DOUBLE NULL,
    `kinhDo` DOUBLE NULL,
    `gioMoCua` VARCHAR(5) NOT NULL,
    `gioDongCua` VARCHAR(5) NOT NULL,
    `soPhutMoiSlot` INTEGER NOT NULL DEFAULT 60,
    `hotline` VARCHAR(20) NULL,
    `moTa` TEXT NULL,
    `trangThai` ENUM('HOAT_DONG', 'BAO_TRI', 'DONG_CUA') NOT NULL DEFAULT 'HOAT_DONG',
    `giaTienThapDiem` INTEGER NOT NULL,
    `giaTienCaoDiem` INTEGER NOT NULL,
    `tienIch` JSON NOT NULL,
    `diemDanhGia` DOUBLE NOT NULL DEFAULT 0.0,
    `soLuotDanhGia` INTEGER NOT NULL DEFAULT 0,
    `soLuotDat` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `san_loaiSanId_idx`(`loaiSanId`),
    INDEX `san_trangThai_idx`(`trangThai`),
    PRIMARY KEY (`id`),
    CONSTRAINT `san_loaiSanId_fkey` FOREIGN KEY (`loaiSanId`) REFERENCES `loai_san`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG ẢNH SÂN
CREATE TABLE `anh_san` (
    `id` VARCHAR(191) NOT NULL,
    `sanId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `moTa` VARCHAR(200) NULL,
    `thuTu` INTEGER NOT NULL DEFAULT 0,
    INDEX `anh_san_sanId_idx`(`sanId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `anh_san_sanId_fkey` FOREIGN KEY (`sanId`) REFERENCES `san`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG KHUNG GIỜ CẤU HÌNH
CREATE TABLE `khung_gio_cau_hinh` (
    `id` VARCHAR(191) NOT NULL,
    `sanId` VARCHAR(191) NOT NULL,
    `ngayTrongTuan` INTEGER NOT NULL,
    `gioTu` VARCHAR(5) NOT NULL,
    `gioDen` VARCHAR(5) NOT NULL,
    `laCaoDiem` BOOLEAN NOT NULL DEFAULT true,
    INDEX `khung_gio_cau_hinh_sanId_idx`(`sanId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `khung_gio_cau_hinh_sanId_fkey` FOREIGN KEY (`sanId`) REFERENCES `san`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. BẢNG ĐƠN ĐẶT SÂN
CREATE TABLE `don_dat` (
    `id` VARCHAR(191) NOT NULL,
    `maDon` VARCHAR(191) NOT NULL,
    `sanId` VARCHAR(191) NOT NULL,
    `nguoiDungId` VARCHAR(191) NULL,
    `tenKhach` VARCHAR(100) NOT NULL,
    `soDienThoaiKhach` VARCHAR(15) NOT NULL,
    `ghiChu` TEXT NULL,
    `ngayDat` DATETIME(3) NOT NULL,
    `gioKhoa` VARCHAR(5) NOT NULL,
    `soGioThue` DOUBLE NOT NULL,
    `gioKetThuc` VARCHAR(5) NOT NULL,
    `donGia` INTEGER NOT NULL,
    `tongTienSan` INTEGER NOT NULL,
    `tongTienFnB` INTEGER NOT NULL DEFAULT 0,
    `tongTienDungCu` INTEGER NOT NULL DEFAULT 0,
    `giamGia` INTEGER NOT NULL DEFAULT 0,
    `tongCong` INTEGER NOT NULL,
    `trangThai` ENUM('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI', 'HOAN_THANH', 'DA_HUY', 'TU_CHOI') NOT NULL DEFAULT 'CHO_XAC_NHAN',
    `trangThaiThanhToan` ENUM('CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_TIEN') NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    `phuongThucThanhToan` ENUM('TIEN_MAT', 'MOMO', 'ZALO_PAY', 'VN_PAY', 'PAY_OS', 'CHUYEN_KHOAN') NOT NULL DEFAULT 'TIEN_MAT',
    `thoiGianGiuCho` DATETIME(3) NULL,
    `thoiGianXacNhan` DATETIME(3) NULL,
    `thoiGianCheckIn` DATETIME(3) NULL,
    `thoiGianKetThuc` DATETIME(3) NULL,
    `thoiGianHuy` DATETIME(3) NULL,
    `lyDoHuy` VARCHAR(500) NULL,
    `taoBoiNhanVienId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `don_dat_maDon_key`(`maDon`),
    INDEX `don_dat_sanId_idx`(`sanId`),
    INDEX `don_dat_nguoiDungId_idx`(`nguoiDungId`),
    INDEX `don_dat_ngayDat_gioKhoa_idx`(`ngayDat`, `gioKhoa`),
    INDEX `don_dat_trangThai_idx`(`trangThai`),
    INDEX `don_dat_thoiGianGiuCho_idx`(`thoiGianGiuCho`),
    PRIMARY KEY (`id`),
    CONSTRAINT `don_dat_sanId_fkey` FOREIGN KEY (`sanId`) REFERENCES `san`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `don_dat_nguoiDungId_fkey` FOREIGN KEY (`nguoiDungId`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG ĐỒ UỐNG F&B
CREATE TABLE `do_uong` (
    `id` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `danhMuc` VARCHAR(50) NOT NULL,
    `giaBan` INTEGER NOT NULL,
    `giaNhap` INTEGER NOT NULL DEFAULT 0,
    `tonKho` INTEGER NOT NULL DEFAULT 0,
    `nguongCanhBao` INTEGER NOT NULL DEFAULT 5,
    `anhUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. BẢNG CHI TIẾT F&B
CREATE TABLE `chi_tiet_fnb` (
    `id` VARCHAR(191) NOT NULL,
    `donDatId` VARCHAR(191) NOT NULL,
    `doUongId` VARCHAR(191) NOT NULL,
    `soLuong` INTEGER NOT NULL,
    `donGia` INTEGER NOT NULL,
    `thanhTien` INTEGER NOT NULL,
    INDEX `chi_tiet_fnb_donDatId_idx`(`donDatId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chi_tiet_fnb_donDatId_fkey` FOREIGN KEY (`donDatId`) REFERENCES `don_dat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chi_tiet_fnb_doUongId_fkey` FOREIGN KEY (`doUongId`) REFERENCES `do_uong`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG DỤNG CỤ THỂ THAO
CREATE TABLE `dung_cu` (
    `id` VARCHAR(191) NOT NULL,
    `maDungCu` VARCHAR(50) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `loai` VARCHAR(50) NOT NULL,
    `phiThuePerBuoi` INTEGER NOT NULL,
    `phiBoiThuong` INTEGER NOT NULL,
    `trangThai` VARCHAR(191) NOT NULL DEFAULT 'SAN_SANG',
    `ghiChu` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `dung_cu_maDungCu_key`(`maDungCu`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. BẢNG CHI TIẾT DỤNG CỤ
CREATE TABLE `chi_tiet_dung_cu` (
    `id` VARCHAR(191) NOT NULL,
    `donDatId` VARCHAR(191) NOT NULL,
    `dungCuId` VARCHAR(191) NOT NULL,
    `soLuong` INTEGER NOT NULL,
    `phiThue` INTEGER NOT NULL,
    `tinhTrangTra` VARCHAR(191) NULL,
    `phiBoiThuong` INTEGER NOT NULL DEFAULT 0,
    INDEX `chi_tiet_dung_cu_donDatId_idx`(`donDatId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `chi_tiet_dung_cu_donDatId_fkey` FOREIGN KEY (`donDatId`) REFERENCES `don_dat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `chi_tiet_dung_cu_dungCuId_fkey` FOREIGN KEY (`dungCuId`) REFERENCES `dung_cu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. BẢNG ĐÁNH GIÁ SÂN
CREATE TABLE `danh_gia` (
    `id` VARCHAR(191) NOT NULL,
    `donDatId` VARCHAR(191) NOT NULL,
    `sanId` VARCHAR(191) NOT NULL,
    `nguoiDungId` VARCHAR(191) NOT NULL,
    `soSao` INTEGER NOT NULL,
    `noiDung` TEXT NULL,
    `anhUrl` VARCHAR(500) NULL,
    `phanHoiAdmin` TEXT NULL,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `danh_gia_donDatId_key`(`donDatId`),
    INDEX `danh_gia_sanId_idx`(`sanId`),
    INDEX `danh_gia_nguoiDungId_idx`(`nguoiDungId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `danh_gia_donDatId_fkey` FOREIGN KEY (`donDatId`) REFERENCES `don_dat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `danh_gia_sanId_fkey` FOREIGN KEY (`sanId`) REFERENCES `san`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `danh_gia_nguoiDungId_fkey` FOREIGN KEY (`nguoiDungId`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. BẢNG VOUCHER
CREATE TABLE `voucher` (
    `id` VARCHAR(191) NOT NULL,
    `maVoucher` VARCHAR(30) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `loai` VARCHAR(20) NOT NULL,
    `giaTriGiam` INTEGER NOT NULL,
    `giaTriDonToiThieu` INTEGER NOT NULL DEFAULT 0,
    `soLanToiDa` INTEGER NOT NULL DEFAULT 1,
    `soLanDaSuDung` INTEGER NOT NULL DEFAULT 0,
    `ngayBatDau` DATETIME(3) NOT NULL,
    `ngayKetThuc` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `voucher_maVoucher_key`(`maVoucher`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. BẢNG VOUCHER ĐƠN ĐẶT
CREATE TABLE `voucher_don_dat` (
    `id` VARCHAR(191) NOT NULL,
    `donDatId` VARCHAR(191) NOT NULL,
    `voucherId` VARCHAR(191) NOT NULL,
    `soTienGiam` INTEGER NOT NULL,
    UNIQUE INDEX `voucher_don_dat_donDatId_key`(`donDatId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `voucher_don_dat_donDatId_fkey` FOREIGN KEY (`donDatId`) REFERENCES `don_dat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `voucher_don_dat_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `voucher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BẢNG KHUYẾN MÃI SÂN
CREATE TABLE `khuyen_mai_san` (
    `id` VARCHAR(191) NOT NULL,
    `sanId` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `phanTramGiam` INTEGER NOT NULL,
    `gioTu` VARCHAR(5) NOT NULL,
    `gioDen` VARCHAR(5) NOT NULL,
    `ngayBatDau` DATETIME(3) NOT NULL,
    `ngayKetThuc` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    INDEX `khuyen_mai_san_sanId_idx`(`sanId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `khuyen_mai_san_sanId_fkey` FOREIGN KEY (`sanId`) REFERENCES `san`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
