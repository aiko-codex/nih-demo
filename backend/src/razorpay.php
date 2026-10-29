<?php
declare(strict_types=1);

function razorpay_create_order(array $donation): array
{
    return razorpay_request('POST', 'https://api.razorpay.com/v1/orders', [
        'amount' => (int)$donation['total_minor'],
        'currency' => 'INR',
        'receipt' => (string)$donation['public_token'],
        'notes' => ['block_code' => (string)$donation['block_code']],
    ]);
}

function razorpay_request(string $method, string $url, array $payload): array
{
    $keyId = (string)config('razorpay_key_id', '');
    $keySecret = (string)config('razorpay_key_secret', '');
    if ($keyId === '' || $keySecret === '' || !function_exists('curl_init')) {
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    $handle = curl_init($url);
    if ($handle === false) {
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    curl_setopt_array($handle, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD => $keyId . ':' . $keySecret,
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 20,
    ]);
    $rawResponse = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    $response = is_string($rawResponse) ? json_decode($rawResponse, true) : null;
    if ($status < 200 || $status >= 300 || !is_array($response)) {
        error_log('[nih-api] Razorpay request failed with HTTP ' . $status);
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
    return $response;
}

function verify_razorpay_payment_signature(string $orderId, string $paymentId, string $signature, string $secret): bool
{
    if ($orderId === '' || $paymentId === '' || $secret === '' || preg_match('/^[a-f0-9]{64}$/i', $signature) !== 1) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', $orderId . '|' . $paymentId, $secret), strtolower($signature));
}

function verify_razorpay_webhook_signature(string $payload, string $header, string $secret): bool
{
    if ($secret === '' || preg_match('/^[a-f0-9]{64}$/i', $header) !== 1) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', $payload, $secret), strtolower($header));
}
