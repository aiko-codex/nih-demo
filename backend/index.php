<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

$configPath = __DIR__ . '/config.local.php';
if (!is_file($configPath)) {
    $configPath = __DIR__ . '/config.example.php';
}

$GLOBALS['NIH_CONFIG'] = require $configPath;
$GLOBALS['NIH_ROOT'] = __DIR__;
$GLOBALS['NIH_ROUTES'] = [];

function config(string $key, mixed $default = null): mixed
{
    return $GLOBALS['NIH_CONFIG'][$key] ?? $default;
}

function app_root(): string
{
    return $GLOBALS['NIH_ROOT'];
}

require __DIR__ . '/src/http.php';
require __DIR__ . '/src/db.php';
require __DIR__ . '/src/session.php';
require __DIR__ . '/src/settings.php';
require __DIR__ . '/src/validate.php';
require __DIR__ . '/src/blocks.php';
require __DIR__ . '/src/media.php';

require __DIR__ . '/src/routes/public.php';
require __DIR__ . '/src/routes/admin_auth.php';
require __DIR__ . '/src/routes/admin_blocks.php';
require __DIR__ . '/src/routes/admin_media.php';
require __DIR__ . '/src/routes/admin_settings.php';
require __DIR__ . '/src/routes/webhooks.php';
require __DIR__ . '/src/routes/admin_donations.php';
require __DIR__ . '/src/routes/donations_public.php';

dispatch_request();
