<?php
declare(strict_types=1);

function create_pending_donation(array $input): array
{
    $blockCode = trim((string)($input['blockCode'] ?? ''));
    if ($blockCode === '') {
        fail('validation_error', 'Choose a valid window.', 422);
    }

    $blockQuery = db()->prepare('SELECT id, code, name FROM blocks WHERE code = ? AND is_published = 1 LIMIT 1');
    $blockQuery->execute([$blockCode]);
    $block = $blockQuery->fetch();
    if ($block === false) {
        fail('block_not_found', 'Window not found.', 404);
    }

    if (get_setting('donation_mode', 'multiple') === 'single') {
        $paidQuery = db()->prepare("SELECT id FROM donations WHERE block_id = ? AND status = 'paid' LIMIT 1");
        $paidQuery->execute([(int)$block['id']]);
        if ($paidQuery->fetch() !== false) {
            fail('block_closed', 'This window is fully lit.', 409);
        }
    }

    $currency = strtoupper(trim((string)($input['currency'] ?? '')));
    if (!in_array($currency, ['USD', 'INR'], true)) {
        fail('validation_error', 'Choose USD or INR.', 422);
    }

    $amount = $input['amount'] ?? null;
    if (!is_numeric($amount) || !is_finite((float)$amount) || (float)$amount <= 0) {
        fail('validation_error', 'Enter a valid donation amount.', 422);
    }
    $minimumKey = $currency === 'USD' ? 'min_amount_usd' : 'min_amount_inr';
    $minimumAmount = setting_int($minimumKey, $currency === 'USD' ? 10 : 500);
    if ((float)$amount < $minimumAmount) {
        fail('amount_too_small', 'Donation is below the minimum amount.', 422);
    }

    $name = trim((string)($input['name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 120) {
        fail('validation_error', 'Enter your name.', 422);
    }
    $email = trim((string)($input['email'] ?? ''));
    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || mb_strlen($email) > 190) {
        fail('validation_error', 'Enter a valid email address.', 422);
    }

    $companyValue = trim((string)($input['company'] ?? ''));
    if (mb_strlen($companyValue) > 120) {
        fail('validation_error', 'Company name is too long.', 422);
    }
    if (!is_bool($input['showPublicly'] ?? null)) {
        fail('validation_error', 'Choose whether your name can be shown.', 422);
    }

    $amountMinor = (int)round((float)$amount * 100);
    if ($amountMinor <= 0) {
        fail('validation_error', 'Enter a valid donation amount.', 422);
    }
    $taxMinor = calculate_donation_tax_minor(
        $amountMinor,
        $currency,
        setting_bool('gst_enabled'),
        setting_int('gst_percent', 18)
    );
    $totalMinor = $amountMinor + $taxMinor;
    $publicToken = bin2hex(random_bytes(16));
    $gateway = $currency === 'USD' ? 'stripe' : 'razorpay';

    $insert = db()->prepare(
        "INSERT INTO donations (public_token, block_id, donor_name, donor_email, donor_company, show_publicly, amount_minor, tax_minor, total_minor, currency, gateway, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $insert->execute([
        $publicToken,
        (int)$block['id'],
        $name,
        $email,
        $companyValue === '' ? null : $companyValue,
        $input['showPublicly'] ? 1 : 0,
        $amountMinor,
        $taxMinor,
        $totalMinor,
        $currency,
        $gateway,
    ]);

    $donationId = (int)db()->lastInsertId();
    $select = db()->prepare(
        'SELECT d.*, b.code AS block_code, b.name AS block_name FROM donations d JOIN blocks b ON b.id = d.block_id WHERE d.id = ? LIMIT 1'
    );
    $select->execute([$donationId]);
    $donation = $select->fetch();
    if ($donation === false) {
        fail('server_error', 'Donation could not be created.', 500);
    }
    return $donation;
}

function calculate_donation_tax_minor(int $amountMinor, string $currency, bool $gstEnabled, int $gstPercent): int
{
    if ($currency !== 'INR' || !$gstEnabled || $amountMinor <= 0 || $gstPercent <= 0) {
        return 0;
    }
    return (int)round($amountMinor * $gstPercent / 100);
}

function mark_donation_paid(int $donationId, string $gatewayPaymentId): bool
{
    $update = db()->prepare(
        "UPDATE donations SET status = 'paid', gateway_payment_id = ?, paid_at = NOW() WHERE id = ? AND status = 'pending'"
    );
    $update->execute([$gatewayPaymentId, $donationId]);
    if ($update->rowCount() > 0) {
        return true;
    }

    $current = db()->prepare('SELECT status FROM donations WHERE id = ? LIMIT 1');
    $current->execute([$donationId]);
    return $current->fetchColumn() === 'paid';
}

function mark_donation_failed(int $donationId): void
{
    $update = db()->prepare("UPDATE donations SET status = 'failed' WHERE id = ? AND status = 'pending'");
    $update->execute([$donationId]);
}

function set_donation_gateway_order(int $donationId, string $orderId): void
{
    $update = db()->prepare("UPDATE donations SET gateway_order_id = ? WHERE id = ? AND status = 'pending'");
    $update->execute([$orderId, $donationId]);
}

function find_donation_by_token(string $publicToken): ?array
{
    if (preg_match('/^[a-f0-9]{32}$/i', $publicToken) !== 1) {
        return null;
    }
    $query = db()->prepare(
        'SELECT d.*, b.code AS block_code, b.name AS block_name FROM donations d JOIN blocks b ON b.id = d.block_id WHERE d.public_token = ? LIMIT 1'
    );
    $query->execute([strtolower($publicToken)]);
    $donation = $query->fetch();
    return $donation === false ? null : $donation;
}
