SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blocks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(12) NOT NULL,
  name VARCHAR(120) NOT NULL,
  tagline VARCHAR(200) NOT NULL DEFAULT '',
  floor TINYINT UNSIGNED NOT NULL,
  face ENUM('left','front','right') NOT NULL,
  window_start SMALLINT UNSIGNED NOT NULL,
  window_span SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  story_html MEDIUMTEXT NOT NULL,
  cover_media_id INT UNSIGNED NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blocks_code (code),
  KEY idx_blocks_floor_face (floor, face, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS block_media (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id INT UNSIGNED NOT NULL,
  kind ENUM('image','video','embed') NOT NULL,
  file_path VARCHAR(255) NULL,
  embed_url VARCHAR(500) NULL,
  caption VARCHAR(255) NOT NULL DEFAULT '',
  width SMALLINT UNSIGNED NULL,
  height SMALLINT UNSIGNED NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_block_media_block (block_id, sort_order),
  CONSTRAINT fk_block_media_block FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS donations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_token CHAR(32) NOT NULL,
  block_id INT UNSIGNED NOT NULL,
  donor_name VARCHAR(120) NOT NULL,
  donor_email VARCHAR(190) NOT NULL,
  donor_company VARCHAR(120) NULL,
  show_publicly TINYINT(1) NOT NULL DEFAULT 1,
  amount_minor INT UNSIGNED NOT NULL,
  tax_minor INT UNSIGNED NOT NULL DEFAULT 0,
  total_minor INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL,
  gateway ENUM('stripe','razorpay') NOT NULL,
  gateway_order_id VARCHAR(120) NOT NULL DEFAULT '',
  gateway_payment_id VARCHAR(120) NULL,
  status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_donations_public_token (public_token),
  KEY idx_donations_block_status (block_id, status),
  KEY idx_donations_status (status),
  CONSTRAINT fk_donations_block FOREIGN KEY (block_id) REFERENCES blocks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_events (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  gateway VARCHAR(20) NOT NULL,
  event_id VARCHAR(120) NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_webhook_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(64) NOT NULL,
  setting_value TEXT NOT NULL,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
