<?php
declare(strict_types=1);

function get_settings(): array
{
    if (isset($GLOBALS['NIH_SETTINGS_CACHE']) && is_array($GLOBALS['NIH_SETTINGS_CACHE'])) {
        return $GLOBALS['NIH_SETTINGS_CACHE'];
    }

    $settings = [];
    foreach (db()->query('SELECT setting_key, setting_value FROM settings')->fetchAll() as $row) {
        $settings[(string)$row['setting_key']] = (string)$row['setting_value'];
    }
    $GLOBALS['NIH_SETTINGS_CACHE'] = $settings;
    return $settings;
}

function clear_settings_cache(): void
{
    unset($GLOBALS['NIH_SETTINGS_CACHE']);
}

function get_setting(string $key, ?string $default = null): ?string
{
    $settings = get_settings();
    return array_key_exists($key, $settings) ? $settings[$key] : $default;
}

function setting_int(string $key, int $default = 0): int
{
    $value = get_setting($key);
    if ($value === null || preg_match('/^-?\d+$/', $value) !== 1) {
        return $default;
    }
    return (int)$value;
}

function setting_bool(string $key, bool $default = false): bool
{
    $value = get_setting($key);
    if ($value === null) {
        return $default;
    }
    return in_array($value, ['1', 'true', 'yes', 'on'], true);
}

function setting_json(string $key, array $default = []): array
{
    $value = get_setting($key);
    if ($value === null) {
        return $default;
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : $default;
}

function public_settings_payload(): array
{
    return [
        'donationMode' => get_setting('donation_mode', 'multiple'),
        'maxDonorsPerBlock' => setting_int('max_donors_per_block', 1),
        'minimums' => [
            'USD' => setting_int('min_amount_usd', 10),
            'INR' => setting_int('min_amount_inr', 500),
        ],
        'presets' => [
            'USD' => array_values(array_map('intval', setting_json('preset_amounts_usd', []))),
            'INR' => array_values(array_map('intval', setting_json('preset_amounts_inr', []))),
        ],
        'gst' => [
            'enabled' => setting_bool('gst_enabled'),
            'percent' => setting_int('gst_percent', 18),
        ],
    ];
}

function admin_settings_payload(): array
{
    return [
        'donationMode' => get_setting('donation_mode', 'multiple'),
        'maxDonorsPerBlock' => setting_int('max_donors_per_block', 1),
        'showDonorEmail' => setting_bool('show_donor_email'),
        'gstEnabled' => setting_bool('gst_enabled'),
        'gstPercent' => setting_int('gst_percent', 18),
        'minAmountUsd' => setting_int('min_amount_usd', 10),
        'minAmountInr' => setting_int('min_amount_inr', 500),
        'presetAmountsUsd' => array_values(array_map('intval', setting_json('preset_amounts_usd', []))),
        'presetAmountsInr' => array_values(array_map('intval', setting_json('preset_amounts_inr', []))),
        'usReceiptNote' => get_setting('us_receipt_note', '') ?? '',
        'windowsLeft' => setting_int('windows_left', 6),
        'windowsFront' => setting_int('windows_front', 12),
        'windowsRight' => setting_int('windows_right', 6),
    ];
}

function save_setting(string $key, string $value): void
{
    $stmt = db()->prepare(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    $stmt->execute([$key, $value]);
    clear_settings_cache();
}
