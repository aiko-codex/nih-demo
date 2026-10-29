<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/donations.php';
require_once dirname(__DIR__) . '/stripe.php';
require_once dirname(__DIR__) . '/razorpay.php';

add_route('POST', '/donations', static function (): never {
    $donation = create_pending_donation(read_json_body());
    try {
        if ($donation['currency'] === 'USD') {
            $session = stripe_create_checkout_session($donation);
            set_donation_gateway_order((int)$donation['id'], (string)$session['id']);
            send_data([
                'gateway' => 'stripe',
                'checkoutUrl' => $session['url'],
                'publicToken' => $donation['public_token'],
            ], 201);
        }

        $order = razorpay_create_order($donation);
        if (!isset($order['id']) || !is_string($order['id'])) {
            fail('payment_unavailable', 'Payment service is unavailable.', 502);
        }
        set_donation_gateway_order((int)$donation['id'], $order['id']);
        send_data([
            'gateway' => 'razorpay',
            'orderId' => $order['id'],
            'keyId' => (string)config('razorpay_key_id', ''),
            'amountMinor' => (int)($order['amount'] ?? $donation['total_minor']),
            'currency' => 'INR',
            'publicToken' => $donation['public_token'],
            'prefill' => ['name' => $donation['donor_name'], 'email' => $donation['donor_email']],
        ], 201);
    } catch (Throwable $exception) {
        mark_donation_failed((int)$donation['id']);
        if ($exception instanceof ApiException) {
            throw $exception;
        }
        error_log('[nih-api] Donation checkout could not be created: ' . $exception->getMessage());
        fail('payment_unavailable', 'Payment service is unavailable.', 502);
    }
});

add_route('POST', '/donations/razorpay/verify', static function (): never {
    $input = read_json_body();
    $publicToken = (string)($input['publicToken'] ?? '');
    $orderId = (string)($input['razorpayOrderId'] ?? '');
    $paymentId = (string)($input['razorpayPaymentId'] ?? '');
    $signature = (string)($input['razorpaySignature'] ?? '');
    $donation = find_donation_by_token($publicToken);
    if ($donation === null) {
        fail('donation_not_found', 'Donation not found.', 404);
    }
    if ($donation['gateway'] !== 'razorpay' || $orderId === '' || !hash_equals((string)$donation['gateway_order_id'], $orderId)) {
        fail('payment_invalid', 'Payment could not be verified.', 422);
    }
    if (!verify_razorpay_payment_signature($orderId, $paymentId, $signature, (string)config('razorpay_key_secret', ''))) {
        fail('payment_invalid', 'Payment could not be verified.', 422);
    }
    mark_donation_paid((int)$donation['id'], $paymentId);
    send_data(['verified' => true]);
});

add_route('GET', '/donations/{publicToken}/status', static function (array $params): never {
    $donation = find_donation_by_token((string)$params['publicToken']);
    if ($donation === null) {
        fail('donation_not_found', 'Donation not found.', 404);
    }
    send_data(['status' => $donation['status'], 'blockCode' => $donation['block_code']]);
});
