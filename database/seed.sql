-- =====================================================================
-- DỮ LIỆU MẪU (SEED): HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN THỂ THAO
-- Tham chiếu: Plant/01-database.md mục 8 & Plant/08-development-plan.md Task T04
-- =====================================================================

USE sport_booking;

-- 1. Xóa dữ liệu cũ theo thứ tự ràng buộc
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reviews;
TRUNCATE TABLE booking_status_logs;
TRUNCATE TABLE payments;
TRUNCATE TABLE booking_slots;
TRUNCATE TABLE bookings;
TRUNCATE TABLE slot_prices;
TRUNCATE TABLE courts;
TRUNCATE TABLE court_types;
TRUNCATE TABLE time_slots;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Khung giờ cố định 1 giờ (16 khung từ 06:00 đến 22:00)
INSERT INTO time_slots (id, start_time, end_time, is_active) VALUES
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

-- 3. Loại sân (4 loại phổ biến)
INSERT INTO court_types (id, name, description, is_active) VALUES
(1, 'Bóng đá mini 5 người', 'Mặt cỏ nhân tạo tiêu chuẩn FIFA, có dàn đèn chiếu sáng ban đêm hiện đại.', 1),
(2, 'Cầu lông', 'Thảm PVC chống trơn trượt chuyên nghiệp, độ nảy chuẩn thi đấu.', 1),
(3, 'Tennis', 'Sân cứng tiêu chuẩn US Open, mặt sân phủ sơn Acrylic cao cấp.', 1),
(4, 'Pickleball', 'Mặt sân đệm giảm chấn thương, hệ thống lưới và đèn đạt chuẩn quốc tế.', 1);

-- 4. Danh sách các sân
INSERT INTO courts (id, court_type_id, name, description, image_url, status) VALUES
(1, 1, 'Sân Bóng 5A', 'Sân ngoài trời gần cổng chính, mái che phụ bên lề.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(2, 1, 'Sân Bóng 5B', 'Sân cạnh khu dịch vụ căng-tin, hệ thống thoát nước ngầm.', 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(3, 2, 'Sân Cầu Lông 1', 'Sân số 1 trong nhà thi đấu có máy lạnh.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(4, 2, 'Sân Cầu Lông 2', 'Sân số 2 thảm chuẩn, khoảng cách biên rộng.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(5, 2, 'Sân Cầu Lông 3', 'Sân số 3 nhà thi đấu, ánh sáng chống chói.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(6, 3, 'Sân Tennis 1', 'Sân tennis có khán đài mini, đèn LED 1000W.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', 'ACTIVE'),
(7, 4, 'Sân Pickleball 1', 'Sân pickleball ngoài trời có mái che nắng.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', 'ACTIVE');

-- 5. Bảng giá slot_prices: mỗi loại sân x 16 khung giờ x 2 loại ngày (WEEKDAY, WEEKEND)
-- Giờ cao điểm: 17:00 - 21:00 (slot 12, 13, 14, 15)
-- Giá tham chiếu:
-- Bóng đá: Ngày thường: 180k (thường) / 250k (cao điểm). Cuối tuần: 220k (thường) / 300k (cao điểm).
-- Cầu lông: Ngày thường: 80k (thường) / 120k (cao điểm). Cuối tuần: 100k (thường) / 140k (cao điểm).
-- Tennis: Ngày thường: 200k (thường) / 280k (cao điểm). Cuối tuần: 250k (thường) / 350k (cao điểm).
-- Pickleball: Ngày thường: 120k (thường) / 160k (cao điểm). Cuối tuần: 150k (thường) / 200k (cao điểm).

INSERT INTO slot_prices (court_type_id, time_slot_id, day_type, price)
SELECT 1, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 250000 ELSE 180000 END FROM time_slots
UNION ALL
SELECT 1, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 300000 ELSE 220000 END FROM time_slots
UNION ALL
SELECT 2, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 120000 ELSE 80000 END FROM time_slots
UNION ALL
SELECT 2, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 140000 ELSE 100000 END FROM time_slots
UNION ALL
SELECT 3, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 280000 ELSE 200000 END FROM time_slots
UNION ALL
SELECT 3, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 350000 ELSE 250000 END FROM time_slots
UNION ALL
SELECT 4, id, 'WEEKDAY', CASE WHEN id IN (12,13,14,15) THEN 160000 ELSE 120000 END FROM time_slots
UNION ALL
SELECT 4, id, 'WEEKEND', CASE WHEN id IN (12,13,14,15) THEN 200000 ELSE 150000 END FROM time_slots;

-- 6. Mẫu người dùng (mật khẩu bcrypt mặc định: '123456' -> $2b$10$wN010l70qB6p4K7Dk8g6veW44d284QZ3s6mE.L9F1d8H2gN3qN9eS hoặc hash tương đương)
-- Mật khẩu thật của Admin sẽ được sinh bằng script seed:admin theo file .env
INSERT INTO users (id, full_name, phone, email, password_hash, role, status) VALUES
(1, 'Quản Trị Viên Hệ Thống', '0900000001', 'admin@sportbooking.vn', '$2a$10$iI8g5o3Wz0B60Pfx7bJgNu4sMv1r51H4qV1tCqX7d4kU2qA8g0L2W', 'ADMIN', 'ACTIVE'),
(2, 'Nguyễn Văn Nhân Viên', '0900000002', 'staff@sportbooking.vn', '$2a$10$iI8g5o3Wz0B60Pfx7bJgNu4sMv1r51H4qV1tCqX7d4kU2qA8g0L2W', 'STAFF', 'ACTIVE'),
(3, 'Trần Khách Hàng A', '0911111111', 'khach_a@gmail.com', '$2a$10$iI8g5o3Wz0B60Pfx7bJgNu4sMv1r51H4qV1tCqX7d4kU2qA8g0L2W', 'CUSTOMER', 'ACTIVE'),
(4, 'Lê Khách Hàng B', '0922222222', 'khach_b@gmail.com', '$2a$10$iI8g5o3Wz0B60Pfx7bJgNu4sMv1r51H4qV1tCqX7d4kU2qA8g0L2W', 'CUSTOMER', 'ACTIVE');
