CREATE TABLE IF NOT EXISTS request_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64),
  type       ENUM('execute','simulate_pendulum','simulate_ballbeam') NOT NULL,
  command    TEXT,
  params     JSON,
  status     ENUM('success','error') NOT NULL,
  error      TEXT,
  ip         VARCHAR(45),
  city       VARCHAR(100),
  country    VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animation_stats (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  animation  ENUM('pendulum','ballbeam') NOT NULL,
  user_token VARCHAR(64) NOT NULL,
  ip         VARCHAR(45),
  city       VARCHAR(100),
  country    VARCHAR(100),
  used_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token      VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
