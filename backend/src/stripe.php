<?php
declare(strict_types=1);

function stripe_create_checkout_session(array $donation): array
{
    $appUrl = rtrim((string)config('app_url', ''), '/');
    $blockCode = (string)$donation['block_code'];
    $fields = [
        'mode' => 'payment',
        'line_items[0][quantity]' => '1',
        'line_items[0][price_data][currency]' => 'usd',
        'line_items[0][price_data][unit_amount]' => (string)(int)$donation['total_minor'],
        'line_items[0][price_data][product_data][name]' => 'Donation: ' . (string)$donation['block_name'],
        'success_url' => $appUrl . '/donate/return?t=' . rawurlencode((string)$donation['public_token']),
        'cancel_url' => $appUrl . '/b/' . rawurlencode($blockCode),
        'metadata[public_token]' => (string)$donation['public_token'],
        'customer_email' => (string)$donation['donor_email'],
    ];
    $response = stripe_request('POST', 'https://api.stripe.com/v1/checkout/sessions', $fields);
    if (!isset($response['id'], $response['url']) || !is_string($response['id']) || !is_string($response['url'])) {
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    return $response;
}

function stripe_request(string $method, string $url, array $fields): array
{
    $secret = (string)config('stripe_secret_key', '');
    if ($secret === '' || !function_exists('curl_init')) {
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    $handle = curl_init($url);
    if ($handle === false) {
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    curl_setopt_array($handle, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_POSTFIELDS => http_build_query($fields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $secret, 'Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 20,
    ]);
    $rawResponse = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    $response = is_string($rawResponse) ? json_decode($rawResponse, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($response)) {
        error_log('[nih-api] Stripe request failed with HTTP ' . $status);
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    return $response;
}

function verify_stripe_signature(string $payload, string $header, string $secret, int $tolerance = 300): bool
{
    if ($secret === '' || $header === '') {
        return false;
    }
    $timestamp = null;
    $signatures = [];
    foreach (explode(',', $header) as $part) {
        $pair = explode('=', trim($part), 2);
        if (count($pair) !== 2) {
            continue;
        }
        if ($pair[0] === 't' && ctype_digit($pair[1])) {
            $timestamp = (int)$pair[1];
        } elseif ($pair[0] === 'v1' && preg_match('/^[a-f0-9]{64}$/i', $pair[1]) === 1) {
            $signatures[] = strtolower($pair[1]);
        }
    }
    if ($timestamp === null || $signatures === [] || abs(time() - $timestamp) > max(0, $tolerance)) {
        return false;
    }
    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, $signature)) {
            return true;
        }
    }
    return false;
}
