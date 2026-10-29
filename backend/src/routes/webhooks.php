<?php
declare(strict_types=1);

add_route('POST', '/webhooks/stripe', static function (): never {
    $payload = file_get_contents('php://input');
    $payload = is_string($payload) ? $payload : '';
    $signature = (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
    if (!verify_stripe_signature($payload, $signature, (string)config('stripe_webhook_secret', ''), 300)) {
        fail('invalid_signature', 'Webhook signature is invalid.', 400);
    }
    $event = json_decode($payload, true);
    if (!is_array($event) || !is_string($event['id'] ?? null) || !is_string($event['type'] ?? null)) {
        fail('invalid_webhook', 'Webhook payload is invalid.', 400);
    }

    $connection = db();
    $connection->beginTransaction();
    try {
        $insert = $connection->prepare('INSERT INTO webhook_events (gateway, event_id) VALUES (?, ?)');
        $insert->execute(['stripe', $event['id']]);
    } catch (PDOException $exception) {
        $connection->rollBack();
        if ((string)$exception->getCode() === '23000') {
            send_data(['received' => true]);
        }
        throw $exception;
    }

    if ($event['type'] === 'checkout.session.completed') {
        $session = $event['data']['object'] ?? [];
        if (is_array($session) && ($session['payment_status'] ?? '') === 'paid') {
            $publicToken = (string)($session['metadata']['public_token'] ?? '');
            $donation = find_donation_by_token($publicToken);
            if ($donation !== null && $donation['gateway'] === 'stripe') {
                $paymentId = is_string($session['payment_intent'] ?? null) ? $session['payment_intent'] : (string)($session['id'] ?? '');
                mark_donation_paid((int)$donation['id'], $paymentId);
            }
        }
    }
    $connection->commit();
    send_data(['received' => true]);
});

add_route('POST', '/webhooks/razorpay', static function (): never {
    $payload = file_get_contents('php://input');
    $payload = is_string($payload) ? $payload : '';
    $signature = (string)($_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '');
    if (!verify_razorpay_webhook_signature($payload, $signature, (string)config('razorpay_webhook_secret', ''))) {
        fail('invalid_signature', 'Webhook signature is invalid.', 400);
    }
    $event = json_decode($payload, true);
    if (!is_array($event) || !is_string($event['id'] ?? null) || !is_string($event['event'] ?? null)) {
        fail('invalid_webhook', 'Webhook payload is invalid.', 400);
    }

    $connection = db();
    $connection->beginTransaction();
    try {
        $insert = $connection->prepare('INSERT INTO webhook_events (gateway, event_id) VALUES (?, ?)');
        $insert->execute(['razorpay', $event['id']]);
    } catch (PDOException $exception) {
        $connection->rollBack();
        if ((string)$exception->getCode() === '23000') {
            send_data(['received' => true]);
        }
        throw $exception;
    }

    if (in_array($event['event'], ['payment.captured', 'order.paid'], true)) {
        $payment = $event['payload']['payment']['entity'] ?? [];
        $order = $event['payload']['order']['entity'] ?? [];
        $orderId = is_array($payment) ? (string)($payment['order_id'] ?? '') : '';
        if ($orderId === '' && is_array($order)) {
            $orderId = (string)($order['id'] ?? '');
        }
        $paymentId = is_array($payment) ? (string)($payment['id'] ?? '') : '';
        if ($orderId !== '') {
            $query = $connection->prepare("SELECT id FROM donations WHERE gateway = 'razorpay' AND gateway_order_id = ? LIMIT 1");
            $query->execute([$orderId]);
            $donationId = $query->fetchColumn();
            if ($donationId !== false) {
                mark_donation_paid((int)$donationId, $paymentId !== '' ? $paymentId : $orderId);
            }
        }
    }
    $connection->commit();
    send_data(['received' => true]);
});
