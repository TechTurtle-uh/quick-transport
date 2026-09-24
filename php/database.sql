-- =============================================
-- QUICK TRANSPORT — MySQL Database Schema
-- Run this in phpMyAdmin or MySQL CLI:
--   mysql -u root -p < database.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS quick_transport
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quick_transport;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  first_name     VARCHAR(50)  NOT NULL,
  last_name      VARCHAR(50)  NOT NULL DEFAULT '',
  email          VARCHAR(120) NOT NULL UNIQUE,
  phone          VARCHAR(20)  NOT NULL,
  password       VARCHAR(255) NOT NULL,
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  profile_pic    VARCHAR(255) DEFAULT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login     DATETIME     DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- =============================================
-- RIDES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS rides (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  booking_id     VARCHAR(30)  NOT NULL UNIQUE,
  user_id        INT          NOT NULL,
  pickup         VARCHAR(200) NOT NULL,
  dropoff        VARCHAR(200) NOT NULL,
  vehicle        ENUM('Bike','Auto','Car','SUV') NOT NULL DEFAULT 'Car',
  distance       DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'in km',
  fare           DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('Cash','UPI','Card','Wallet') NOT NULL DEFAULT 'Cash',
  driver_name    VARCHAR(100) DEFAULT NULL,
  driver_phone   VARCHAR(20)  DEFAULT NULL,
  vehicle_plate  VARCHAR(20)  DEFAULT NULL,
  status         ENUM('pending','ongoing','completed','cancelled') NOT NULL DEFAULT 'pending',
  rating         TINYINT      DEFAULT NULL COMMENT '1-5 stars',
  scheduled_at   DATETIME     DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_status (status),
  INDEX idx_date   (created_at)
) ENGINE=InnoDB;

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  ride_id    INT          DEFAULT NULL,
  type       ENUM('credit','debit','refund') NOT NULL,
  label      VARCHAR(200) NOT NULL,
  amount     DECIMAL(8,2) NOT NULL,
  method     VARCHAR(30)  NOT NULL DEFAULT 'Wallet',
  status     ENUM('success','pending','failed') NOT NULL DEFAULT 'success',
  ref_id     VARCHAR(64)  DEFAULT NULL COMMENT 'Payment gateway reference',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id)  ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_date (created_at)
) ENGINE=InnoDB;

-- =============================================
-- PROMO CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  type        ENUM('percent','flat','wallet') NOT NULL DEFAULT 'flat',
  value       DECIMAL(8,2) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  min_fare    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  max_uses    INT          DEFAULT NULL,
  used_count  INT          NOT NULL DEFAULT 0,
  valid_from  DATETIME     DEFAULT NULL,
  valid_until DATETIME     DEFAULT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- USER PROMO USAGE (prevent double-dipping)
-- =============================================
CREATE TABLE IF NOT EXISTS user_promos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  promo_id   INT         NOT NULL,
  used_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_promo (user_id, promo_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (promo_id) REFERENCES promo_codes(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- SAVED PAYMENT METHODS
-- =============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  type        ENUM('UPI','Card','NetBanking') NOT NULL,
  label       VARCHAR(100) NOT NULL COMMENT 'e.g. UPI ID or last4 digits',
  token       VARCHAR(255) DEFAULT NULL COMMENT 'Tokenized card/UPI reference',
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- SUPPORT TICKETS
-- =============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  ride_id     INT          DEFAULT NULL,
  subject     VARCHAR(100) NOT NULL,
  description TEXT         NOT NULL,
  status      ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- SEED: PROMO CODES
-- =============================================
INSERT IGNORE INTO promo_codes (code, type, value, description, min_fare) VALUES
  ('FIRST50', 'percent', 50, '50% off on your first ride (max ₹100)', 0),
  ('RIDE20',  'flat',    20, '₹20 flat off on any ride',             50),
  ('QT100',   'wallet',  100,'₹100 wallet bonus on adding ₹500+',   500);

-- =============================================
-- SEED: DEMO USER  (password: demo1234)
-- =============================================
INSERT IGNORE INTO users (first_name, last_name, email, phone, password, wallet_balance) VALUES
  ('Arjun','Sharma','demo@quicktransport.in','+91-9876543210',
   '$2y$10$YekaGpkfnSCPi0MmLqoElu3X4V56cRW07vgaxwFbH/kFxW7fSwFGS', 750.00);
