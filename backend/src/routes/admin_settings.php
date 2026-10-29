<?php
declare(strict_types=1);

function update_admin_settings(array $body): array
{
    $allowedKeys = [
        'donationMode',
        'maxDonorsPerBlock',
        'showDonorEmail',
        'gstEnabled',
        'gstPercent',
        'minAmountUsd',
        'minAmountInr',
        'presetAmountsUsd',
        'presetAmountsInr',
        'usReceiptNote',
        'windowsLeft',
        'windowsFront',
        'windowsRight',
    ];

    foreach (array_keys($body) as $key) {
        if (!in_array($key, $allowedKeys, true)) {
            fail('validation_error', 'Unknown setting "' . $key . '".', 422);
        }
    }
    if ($body === []) {
        fail('validation_error', 'No settings were supplied.', 422);
    }

    $changes = [];

    if (array_key_exists('donationMode', $body)) {
        $changes['donation_mode'] = (string)field_enum($body, 'donationMode', ['single', 'multiple'], true);
    }
    if (array_key_exists('maxDonorsPerBlock', $body)) {
        $changes['max_donors_per_block'] = (string)field_int($body, 'maxDonorsPerBlock', true, 1);
    }
    if (array_key_exists('showDonorEmail', $body)) {
        $changes['show_donor_email'] = field_bool($body, 'showDonorEmail', true) ? '1' : '0';
    }
    if (array_key_exists('gstEnabled', $body)) {
        $changes['gst_enabled'] = field_bool($body, 'gstEnabled', true) ? '1' : '0';
    }
    if (array_key_exists('gstPercent', $body)) {
        $changes['gst_percent'] = (string)field_int($body, 'gstPercent', true, 0, 100);
    }
    if (array_key_exists('minAmountUsd', $body)) {
        $changes['min_amount_usd'] = (string)field_int($body, 'minAmountUsd', true, 1, 1000000);
    }
    if (array_key_exists('minAmountInr', $body)) {
        $changes['min_amount_inr'] = (string)field_int($body, 'minAmountInr', true, 1, 100000000);
    }
    if (array_key_exists('presetAmountsUsd', $body)) {
        $presets = field_int_list($body, 'presetAmountsUsd', true, 1, 10000000) ?? [];
        if (count($presets) > 20) {
            fail('validation_error', 'presetAmountsUsd may hold at most 20 values.', 422);
        }
        $changes['preset_amounts_usd'] = (string)json_encode(array_values($presets));
    }
    if (array_key_exists('presetAmountsInr', $body)) {
        $presets = field_int_list($body, 'presetAmountsInr', true, 1, 100000000) ?? [];
        if (count($presets) > 20) {
            fail('validation_error', 'presetAmountsInr may hold at most 20 values.', 422);
        }
        $changes['preset_amounts_inr'] = (string)json_encode(array_values($presets));
    }
    if (array_key_exists('usReceiptNote', $body)) {
        $changes['us_receipt_note'] = field_string($body, 'usReceiptNote', false, 500) ?? '';
    }
    if (array_key_exists('windowsLeft', $body)) {
        $changes['windows_left'] = (string)field_int($body, 'windowsLeft', true, 1, 60);
    }
    if (array_key_exists('windowsFront', $body)) {
        $changes['windows_front'] = (string)field_int($body, 'windowsFront', true, 1, 60);
    }
    if (array_key_exists('windowsRight', $body)) {
        $changes['windows_right'] = (string)field_int($body, 'windowsRight', true, 1, 60);
    }

    foreach ($changes as $key => $value) {
        save_setting($key, $value);
    }

    return admin_settings_payload();
}

add_route('GET', '/admin/settings', function (array $params): void {
    require_admin();
    send_data(admin_settings_payload());
});

add_route('PUT', '/admin/settings', function (array $params): void {
    require_admin_write();
    send_data(update_admin_settings(read_json_body()));
});
