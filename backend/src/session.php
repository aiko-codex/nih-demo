<?php
declare(strict_types=1);

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('nih_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => api_base_path() . '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $isHttps,
    ]);
    session_start();
}

function current_admin(): ?array
{
    admin_session_start();
    $adminId = $_SESSION['admin_id'] ?? null;
    if (!is_int($adminId) && !(is_string($adminId) && ctype_digit($adminId))) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, name, email, created_at FROM admins WHERE id = ? LIMIT 1');
    $stmt->execute([(int)$adminId]);
    $admin = $stmt->fetch();
    if ($admin === false) {
        unset($_SESSION['admin_id']);
        return null;
    }
    return $admin;
}

function require_admin(): array
{
    $admin = current_admin();
    if ($admin === null) {
        fail('unauthorized', 'Sign in required.', 401);
    }
    return $admin;
}

function csrf_token(): string
{
    admin_session_start();
    if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function require_admin_write(): array
{
    $admin = require_admin();
    $provided = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $expected = (string)($_SESSION['csrf'] ?? '');
    if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
        fail('csrf_invalid', 'Missing or invalid CSRF token.', 403);
    }
    return $admin;
}

function admin_login_session(int $adminId): string
{
    admin_session_start();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function admin_logout_session(): void
{
    admin_session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
}

function login_rate_limit_path(string $ip): string
{
    return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'nih_admin_login_' . sha1($ip) . '.json';
}

function login_attempt_times(string $ip): array
{
    $file = login_rate_limit_path($ip);
    if (!is_file($file)) {
        return [];
    }
    $raw = file_get_contents($file);
    if ($raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [];
    }

    $now = time();
    $times = [];
    foreach ($data as $value) {
        if (is_int($value) && $value > $now - 60) {
            $times[] = $value;
        }
    }
    return $times;
}

function login_rate_limit_check(string $ip): void
{
    if (count(login_attempt_times($ip)) >= 5) {
        fail('rate_limited', 'Too many login attempts. Try again in a minute.', 429);
    }
}

function login_rate_limit_hit(string $ip): void
{
    $times = login_attempt_times($ip);
    $times[] = time();
    @file_put_contents(login_rate_limit_path($ip), json_encode($times), LOCK_EX);
}

function login_rate_limit_clear(string $ip): void
{
    @unlink(login_rate_limit_path($ip));
}
