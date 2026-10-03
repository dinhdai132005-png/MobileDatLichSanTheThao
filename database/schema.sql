-- =====================================================================
-- DATABASE SCHEMA: HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN THỂ THAO (sport_booking)
-- Tham chiếu: Plant/01-database.md (10 bảng: P0 + P1)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sport_booking
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sport_booking;

-- Tắt kiểm tra khóa ngoại để drop lại bảng nếu cần tái khởi tạo
SET FOREIGN_KEY_CHECKS = 0;
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

-- ===== 1. users =====
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(15)  NOT NULL,
  email         VARCHAR(150) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  status        ENUM('ACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

-- ===== 2. court_types =====
CREATE TABLE court_types (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_court_types_name (name)
) ENGINE=InnoDB;

-- ===== 3. courts =====
CREATE TABLE courts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  court_type_id INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(1000) NULL,
  image_url     VARCHAR(500) NULL,
  status        ENUM('ACTIVE','MAINTENANCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courts_name (name),
  KEY idx_courts_type_status (court_type_id, status),
  CONSTRAINT fk_courts_type FOREIGN KEY (court_type_id) REFERENCES court_types (id)
) ENGINE=InnoDB;

-- ===== 4. time_slots =====
CREATE TABLE time_slots (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_time_slots_start (start_time),
  CONSTRAINT chk_time_slots_range CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- ===== 5. slot_prices =====
CREATE TABLE slot_prices (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  court_type_id INT UNSIGNED NOT NULL,
  time_slot_id  INT UNSIGNED NOT NULL,
  day_type      ENUM('WEEKDAY','WEEKEND') NOT NULL,
  price         INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slot_prices (court_type_id, time_slot_id, day_type),
  CONSTRAINT fk_sp_type FOREIGN KEY (court_type_id) REFERENCES court_types (id),
  CONSTRAINT fk_sp_slot FOREIGN KEY (time_slot_id)  REFERENCES time_slots (id)
) ENGINE=InnoDB;

-- ===== 6. bookings =====
CREATE TABLE bookings (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code   VARCHAR(12) NOT NULL,
  user_id        INT UNSIGNED NULL,
  guest_name     VARCHAR(100) NULL,
  guest_phone    VARCHAR(15)  NULL,
  court_id       INT UNSIGNED NOT NULL,
  booking_date   DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  total_amount   INT UNSIGNED NOT NULL,
  status         ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW')
                 NOT NULL DEFAULT 'PENDING',
  payment_method ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL,
  payment_status ENUM('UNPAID','PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  source         ENUM('APP','STAFF') NOT NULL DEFAULT 'APP',
  note           VARCHAR(500) NULL,
  expires_at     DATETIME NULL,
  cancelled_at   DATETIME NULL,
  cancel_reason  VARCHAR(500) NULL,
  created_by     INT UNSIGNED NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_code (booking_code),
  KEY idx_bookings_court_date (court_id, booking_date),
  KEY idx_bookings_user_status (user_id, status),
  KEY idx_bookings_status_expires (status, expires_at),
  KEY idx_bookings_date_status (booking_date, status),
  CONSTRAINT fk_bookings_user  FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT fk_bookings_court FOREIGN KEY (court_id)   REFERENCES courts (id),
  CONSTRAINT fk_bookings_staff FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT chk_bookings_customer CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL),
  CONSTRAINT chk_bookings_time CHECK (end_time > start_time)
) ENGINE=InnoDB;

-- ===== 7. booking_slots =====
CREATE TABLE booking_slots (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id   INT UNSIGNED NOT NULL,
  court_id     INT UNSIGNED NOT NULL,
  slot_date    DATE NOT NULL,
  time_slot_id INT UNSIGNED NOT NULL,
  price        INT UNSIGNED NOT NULL,
  is_locked    TINYINT NULL DEFAULT 1,   -- 1 = đang giữ slot, NULL = đã nhả (hủy/hết hạn)
  PRIMARY KEY (id),
  UNIQUE KEY uq_slot_active (court_id, slot_date, time_slot_id, is_locked),
  KEY idx_bs_booking (booking_id),
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id)   REFERENCES bookings (id),
  CONSTRAINT fk_bs_court   FOREIGN KEY (court_id)     REFERENCES courts (id),
  CONSTRAINT fk_bs_slot    FOREIGN KEY (time_slot_id) REFERENCES time_slots (id)
) ENGINE=InnoDB;

-- ===== 8. payments =====
CREATE TABLE payments (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id      INT UNSIGNED NOT NULL,
  type            ENUM('PAYMENT','REFUND') NOT NULL,
  method          ENUM('CASH','BANK_TRANSFER','VNPAY') NOT NULL,
  amount          INT UNSIGNED NOT NULL,
  status          ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  transaction_ref VARCHAR(100) NULL,
  processed_by    INT UNSIGNED NULL,      -- nhân viên xác nhận (NULL nếu hệ thống/cổng)
  note            VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at    DATETIME NULL,          -- lúc giao dịch thành công
  PRIMARY KEY (id),
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_status_type (status, type),
  KEY idx_payments_processed_at (processed_at),
  CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id)   REFERENCES bookings (id),
  CONSTRAINT fk_pay_staff   FOREIGN KEY (processed_by) REFERENCES users (id)
) ENGINE=InnoDB;

-- ===== 9. booking_status_logs (P1) =====
CREATE TABLE booking_status_logs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  INT UNSIGNED NOT NULL,
  from_status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NULL,
  to_status   ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','EXPIRED','NO_SHOW') NOT NULL,
  changed_by  INT UNSIGNED NULL,          -- NULL = hệ thống (job hết hạn)
  note        VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bsl_booking (booking_id),
  CONSTRAINT fk_bsl_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
  CONSTRAINT fk_bsl_user    FOREIGN KEY (changed_by) REFERENCES users (id)
) ENGINE=InnoDB;

-- ===== 10. reviews (P1) =====
CREATE TABLE reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_booking (booking_id),
  KEY idx_reviews_user (user_id),
  CONSTRAINT fk_rv_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
  CONSTRAINT fk_rv_user    FOREIGN KEY (user_id)    REFERENCES users (id),
  CONSTRAINT chk_rv_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;
