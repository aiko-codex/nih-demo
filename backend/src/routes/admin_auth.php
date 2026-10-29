<?php
declare(strict_types=1);

function admin_payload(array $admin): array
{
    return [
        'id' => (int)$admin['id'],
        'name' => $admin['name'],
        'email' => $admin['email'],
    ];
}

add_route('POST', '/admin/login', function (array $params): void {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    login_rate_limit_check($ip);

    $body = read_json_body();
    $email = strtolower((string)field_email($body, 'email', true));
    $password = (string)field_string($body, 'password', true, 200);

    $stmt = db()->prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin === false || !password_verify($password, (string)$admin['password_hash'])) {
        login_rate_limit_hit($ip);
        fail('invalid_credentials', 'Email or password is incorrect.', 401);
    }

    login_rate_limit_clear($ip);
    $csrfToken = admin_login_session((int)$admin['id']);
    send_data(['admin' => admin_payload($admin), 'csrfToken' => $csrfToken]);
});

add_route('POST', '/admin/logout', function (array $params): void {
    require_admin_write();
    admin_logout_session();
    send_data(['ok' => true]);
});

add_route('GET', '/admin/me', function (array $params): void {
    $admin = require_admin();
    send_data(['admin' => admin_payload($admin), 'csrfToken' => csrf_token()]);
});
