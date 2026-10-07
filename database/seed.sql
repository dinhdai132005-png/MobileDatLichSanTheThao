-- =====================================================================
-- DỮ LIỆU MẪU (SEED): HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN THỂ THAO
-- Bảng và cột chuẩn hóa: TIẾNG VIỆT KHÔNG DẤU (snake_case)
-- Mật khẩu mẫu cho nhân viên và khách: 123456
-- Tài khoản ADMIN: chạy `npm run seed:admin`
-- =====================================================================

USE sport_booking;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bien_dong_kho;
TRUNCATE TABLE ton_kho_dich_vu;
TRUNCATE TABLE chi_tiet_yeu_cau_dich_vu;
TRUNCATE TABLE yeu_cau_dich_vu;
TRUNCATE TABLE dich_vu;
TRUNCATE TABLE danh_gia;
TRUNCATE TABLE nhat_ky_trang_thai_don;
TRUNCATE TABLE thanh_toan;
TRUNCATE TABLE chi_tiet_khung_gio_dat;
TRUNCATE TABLE don_dat;
TRUNCATE TABLE gia_khung_gio;
TRUNCATE TABLE san;
TRUNCATE TABLE loai_san;
TRUNCATE TABLE khung_gio;
TRUNCATE TABLE nguoi_dung;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Khung giờ cố định 1 giờ (16 khung: 06:00 -> 22:00)
INSERT INTO khung_gio (id, gio_bat_dau, gio_ket_thuc, hoat_dong) VALUES
(1,  '06:00:00', '07:00:00', 1),
(2,  '07:00:00', '08:00:00', 1),
(3,  '08:00:00', '09:00:00', 1),
(4,  '09:00:00', '10:00:00', 1),
(5,  '10:00:00', '11:00:00', 1),
(6,  '11:00:00', '12:00:00', 1),
(7,  '12:00:00', '13:00:00', 1),
(8,  '13:00:00', '14:00:00', 1),
(9,  '14:00:00', '15:00:00', 1),
(10, '15:00:00', '16:00:00', 1),
(11, '16:00:00', '17:00:00', 1),
(12, '17:00:00', '18:00:00', 1),
(13, '18:00:00', '19:00:00', 1),
(14, '19:00:00', '20:00:00', 1),
(15, '20:00:00', '21:00:00', 1),
(16, '21:00:00', '22:00:00', 1);

-- 2. Loại sân (4 loại thể thao + 1 khu sự kiện/tiệc, BR-30)
INSERT INTO loai_san (id, ten, phan_loai, mo_ta, hoat_dong) VALUES
(1, 'Bóng đá mini 5 người', 'SPORT', 'Mặt cỏ nhân tạo tiêu chuẩn, có hệ thống đèn chiếu sáng ban đêm.', 1),
(2, 'Cầu lông', 'SPORT', 'Thảm PVC chống trơn trượt, độ nảy chuẩn thi đấu.', 1),
(3, 'Tennis', 'SPORT', 'Sân cứng tiêu chuẩn, mặt sân phủ sơn Acrylic cao cấp.', 1),
(4, 'Pickleball', 'SPORT', 'Mặt sân đệm giảm chấn thương, hệ thống lưới và đèn đạt chuẩn.', 1),
(5, 'Khu sự kiện & tiệc', 'EVENT', 'Phòng tiệc, khu BBQ dùng cho sinh nhật, họp mặt, team building.', 1);

-- 3. Danh sách sân
INSERT INTO san (id, loai_san_id, ten, mo_ta, hinh_anh, suc_chua, trang_thai) VALUES
(1, 1, 'Sân 5A', 'Sân ngoài trời gần cổng chính, có mái che phụ bên lề.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(2, 1, 'Sân 5B', 'Sân cạnh khu căng-tin, hệ thống thoát nước ngầm.', 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(3, 2, 'Sân CL1', 'Sân số 1 trong nhà thi đấu có máy lạnh.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(4, 2, 'Sân CL2', 'Sân số 2 thảm chuẩn, khoảng cách biên rộng.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(5, 2, 'Sân CL3', 'Sân số 3 nhà thi đấu, ánh sáng chống chói.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(6, 3, 'Sân Tennis 1', 'Sân tennis có khán đài mini, đèn LED.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(7, 4, 'Sân Pickleball 1', 'Sân pickleball ngoài trời có mái che nắng.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', NULL, 'ACTIVE'),
(8, 5, 'Phòng tiệc A', 'Phòng tiệc máy lạnh, âm thanh, bàn ghế cho tối đa 30 khách.', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80', 30, 'ACTIVE'),
(9, 5, 'Khu BBQ ngoài trời', 'Khu nướng BBQ ngoài trời, có mái che và đèn trang trí.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', 50, 'ACTIVE');

-- 4. Bảng giá: mỗi loại sân x 16 khung x 2 day_type. Giờ cao điểm: 17:00-21:00 (slot 12..15)
INSERT INTO gia_khung_gio (loai_san_id, khung_gio_id, loai_ngay, gia)
SELECT 1, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 250000 ELSE 180000 END FROM khung_gio
UNION ALL SELECT 1, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 300000 ELSE 220000 END FROM khung_gio
UNION ALL SELECT 2, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 120000 ELSE 80000 END FROM khung_gio
UNION ALL SELECT 2, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 140000 ELSE 100000 END FROM khung_gio
UNION ALL SELECT 3, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 280000 ELSE 200000 END FROM khung_gio
UNION ALL SELECT 3, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 350000 ELSE 250000 END FROM khung_gio
UNION ALL SELECT 4, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 160000 ELSE 120000 END FROM khung_gio
UNION ALL SELECT 4, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 200000 ELSE 150000 END FROM khung_gio
UNION ALL SELECT 5, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 500000 ELSE 350000 END FROM khung_gio
UNION ALL SELECT 5, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 650000 ELSE 450000 END FROM khung_gio;

-- 5. Danh mục dịch vụ (DRINK / RENTAL / PACKAGE)
INSERT INTO dich_vu (id, ten, phan_loai, don_vi_tinh, don_gia, mo_ta, hinh_anh, trang_thai) VALUES
(1,  'Nước suối',            'DRINK',   'chai', 10000, 'Chai 500ml', NULL, 'ACTIVE'),
(2,  'Nước tăng lực',        'DRINK',   'lon',  20000, 'Lon 330ml', NULL, 'ACTIVE'),
(3,  'Trà đá',               'DRINK',   'ly',    8000, 'Ly lớn', NULL, 'ACTIVE'),
(4,  'Bia lon',              'DRINK',   'lon',  25000, 'Lon 330ml', NULL, 'ACTIVE'),
(5,  'Thuê vợt cầu lông',    'RENTAL',  'cây',  30000, 'Tính một lần theo buổi', NULL, 'ACTIVE'),
(6,  'Thuê giày',            'RENTAL',  'đôi',  40000, 'Tính một lần theo buổi', NULL, 'ACTIVE'),
(7,  'Thuê bóng',            'RENTAL',  'quả',  30000, 'Tính một lần theo buổi', NULL, 'ACTIVE'),
(8,  'Áo bib',               'RENTAL',  'cái',  10000, 'Tính một lần theo buổi', NULL, 'ACTIVE'),
(9,  'Gói tiệc nước 10 người','PACKAGE', 'gói', 300000, 'Nước ngọt, trà đá, nước suối cho 10 người', NULL, 'ACTIVE'),
(10, 'Gói BBQ 10 người',     'PACKAGE', 'gói', 1200000, 'Thịt nướng, rau củ, đồ uống cho 10 người', NULL, 'ACTIVE'),
(11, 'Trang trí sinh nhật',  'PACKAGE', 'gói', 500000, 'Bóng bay, banner, bàn tiệc', NULL, 'ACTIVE');

-- 6. Người dùng mẫu (Mật khẩu: 123456)
INSERT INTO nguoi_dung (id, ho_ten, so_dien_thoai, email, mat_khau_hash, vai_tro, trang_thai) VALUES
(2, 'Nguyễn Văn Nhân Viên', '0900000002', 'staff@sportbooking.vn', '$2b$10$ekRWDm2FiINV0o1EKLPOYO.1dEriRVNCRZSPWs2fmkRnRvGP8kFKK', 'STAFF', 'ACTIVE'),
(3, 'Trần Khách Hàng A', '0911111111', 'khach_a@gmail.com', '$2b$10$ekRWDm2FiINV0o1EKLPOYO.1dEriRVNCRZSPWs2fmkRnRvGP8kFKK', 'CUSTOMER', 'ACTIVE'),
(4, 'Lê Khách Hàng B', '0922222222', 'khach_b@gmail.com', '$2b$10$ekRWDm2FiINV0o1EKLPOYO.1dEriRVNCRZSPWs2fmkRnRvGP8kFKK', 'CUSTOMER', 'ACTIVE');

-- 7. Khởi tạo tồn kho ban đầu cho 11 dịch vụ
INSERT INTO ton_kho_dich_vu (id, dich_vu_id, so_luong, so_luong_dang_giu, nguong_canh_bao) VALUES
(1,  1,  100, 0, 10), -- Nước suối
(2,  2,  50,  0, 5),  -- Nước tăng lực
(3,  3,  200, 0, 20), -- Trà đá
(4,  4,  80,  0, 10), -- Bia lon
(5,  5,  20,  0, 5),  -- Thuê vợt cầu lông
(6,  6,  15,  0, 3),  -- Thuê giày
(7,  7,  10,  0, 2),  -- Thuê bóng
(8,  8,  30,  0, 5),  -- Áo bib
(9,  9,  10,  0, 2),  -- Gói tiệc nước 10 người
(10, 10, 5,   0, 1),  -- Gói BBQ 10 người
(11, 11, 5,   0, 1);  -- Trang trí sinh nhật

-- 8. Ghi nhận giao dịch nhập kho ban đầu (IMPORT)
INSERT INTO bien_dong_kho (ton_kho_dich_vu_id, dich_vu_id, loai_bien_dong, so_luong, so_luong_truoc, so_luong_sau, nguoi_thuc_hien_id, ghi_chu)
SELECT id, dich_vu_id, 'IMPORT', so_luong, 0, so_luong, 2, 'Khởi tạo tồn kho ban đầu của hệ thống'
FROM ton_kho_dich_vu;

