SET NAMES utf8mb4;

INSERT INTO admins (name, email, password_hash)
VALUES ('Admin', 'admin@nih.local', '$2y$10$pc1LdD31BSoOEs4vbmh1XOq4mXT0c3595sSCgxfqESwwSq8q1oJwK')
ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash);
