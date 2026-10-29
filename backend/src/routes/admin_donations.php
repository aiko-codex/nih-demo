<?php
declare(strict_types=1);

function admin_donation_filters(array $query): array
{
    $conditions = [];
    $values = [];
    $status = trim((string)($query['status'] ?? ''));
    if ($status !== '') {
        if (!in_array($status, ['pending', 'paid', 'failed', 'refunded'], true)) {
            fail('validation_error', 'Invalid donation status filter.', 422);
        }
        $conditions[] = 'd.status = ?';
        $values[] = $status;
    }
    $blockId = trim((string)($query['blockId'] ?? ''));
    if ($blockId !== '') {
        if (preg_match('/^\d+$/', $blockId) !== 1) {
            fail('validation_error', 'Invalid block filter.', 422);
        }
        $conditions[] = 'd.block_id = ?';
        $values[] = (int)$blockId;
    }
    $currency = strtoupper(trim((string)($query['currency'] ?? '')));
    if ($currency !== '') {
        if (!in_array($currency, ['USD', 'INR'], true)) {
            fail('validation_error', 'Invalid currency filter.', 422);
        }
        $conditions[] = 'd.currency = ?';
        $values[] = $currency;
    }
    $search = trim((string)($query['q'] ?? ''));
    if ($search !== '') {
        $conditions[] = '(d.donor_name LIKE ? OR d.donor_email LIKE ? OR d.donor_company LIKE ? OR b.code LIKE ? OR b.name LIKE ?)';
        $like = '%' . $search . '%';
        array_push($values, $like, $like, $like, $like, $like);
    }
    return [$conditions === [] ? '' : ' WHERE ' . implode(' AND ', $conditions), $values];
}

function admin_donation_query(array $query): array
{
    [$where, $values] = admin_donation_filters($query);
    $page = max(1, (int)($query['page'] ?? 1));
    $perPage = min(100, max(1, (int)($query['perPage'] ?? 25)));
    $count = db()->prepare('SELECT COUNT(*) FROM donations d JOIN blocks b ON b.id = d.block_id' . $where);
    $count->execute($values);
    $total = (int)$count->fetchColumn();
    $sql = 'SELECT d.id, d.public_token AS publicToken, d.block_id AS blockId, b.code AS blockCode, b.name AS blockName, d.donor_name AS name, d.donor_email AS email, d.donor_company AS company, d.show_publicly AS showPublicly, d.amount_minor AS amountMinor, d.tax_minor AS taxMinor, d.total_minor AS totalMinor, d.currency, d.gateway, d.gateway_order_id AS gatewayOrderId, d.gateway_payment_id AS gatewayPaymentId, d.status, d.created_at AS createdAt, d.paid_at AS paidAt FROM donations d JOIN blocks b ON b.id = d.block_id' . $where . ' ORDER BY d.created_at DESC, d.id DESC LIMIT ? OFFSET ?';
    $statement = db()->prepare($sql);
    $statement->execute([...$values, $perPage, ($page - 1) * $perPage]);
    return [
        'items' => $statement->fetchAll(),
        'page' => $page,
        'perPage' => $perPage,
        'total' => $total,
        'totalPages' => (int)ceil($total / $perPage),
    ];
}

function csv_safe_cell(mixed $value): string
{
    $text = (string)($value ?? '');
    return preg_match('/^[=+\-@]/', $text) === 1 ? "'" . $text : $text;
}

add_route('GET', '/admin/donations', static function (): never {
    require_admin();
    send_data(admin_donation_query($_GET));
});

add_route('GET', '/admin/donations/export.csv', static function (): never {
    require_admin();
    [$where, $values] = admin_donation_filters($_GET);
    $statement = db()->prepare(
        'SELECT d.id, d.donor_name, d.donor_email, d.donor_company, b.code AS block_code, b.name AS block_name, d.status, d.currency, d.amount_minor, d.tax_minor, d.total_minor, d.show_publicly, d.gateway, d.created_at, d.paid_at FROM donations d JOIN blocks b ON b.id = d.block_id' . $where . ' ORDER BY d.created_at DESC, d.id DESC'
    );
    $statement->execute($values);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="donations.csv"');
    $output = fopen('php://output', 'wb');
    if ($output === false) {
        fail('server_error', 'CSV export could not be created.', 500);
    }
    fputcsv($output, ['ID', 'Name', 'Email', 'Company', 'Block code', 'Block name', 'Status', 'Currency', 'Amount minor', 'Tax minor', 'Total minor', 'Shown publicly', 'Gateway', 'Created at', 'Paid at']);
    while ($row = $statement->fetch()) {
        fputcsv($output, array_map('csv_safe_cell', array_values($row)));
    }
    fclose($output);
    exit;
});

add_route('PUT', '/admin/donations/{id}', static function (array $params): never {
    require_admin_write();
    if (preg_match('/^\d+$/', (string)$params['id']) !== 1) {
        fail('not_found', 'Donation not found.', 404);
    }
    $donationId = (int)$params['id'];
    $input = read_json_body();
    if (array_key_exists('showPublicly', $input) && is_bool($input['showPublicly']) && count($input) === 1) {
        $update = db()->prepare('UPDATE donations SET show_publicly = ? WHERE id = ?');
        $update->execute([$input['showPublicly'] ? 1 : 0, $donationId]);
        if ($update->rowCount() === 0) {
            $exists = db()->prepare('SELECT id FROM donations WHERE id = ? LIMIT 1');
            $exists->execute([$donationId]);
            if ($exists->fetchColumn() === false) {
                fail('not_found', 'Donation not found.', 404);
            }
        }
        send_data(['updated' => true]);
    }
    if (($input['status'] ?? null) === 'refunded' && count($input) === 1) {
        $update = db()->prepare("UPDATE donations SET status = 'refunded' WHERE id = ? AND status = 'paid'");
        $update->execute([$donationId]);
        if ($update->rowCount() === 0) {
            $exists = db()->prepare('SELECT status FROM donations WHERE id = ? LIMIT 1');
            $exists->execute([$donationId]);
            $currentStatus = $exists->fetchColumn();
            if ($currentStatus === false) {
                fail('not_found', 'Donation not found.', 404);
            }
            fail('invalid_status', 'Only paid donations can be refunded.', 409);
        }
        send_data(['updated' => true, 'status' => 'refunded']);
    }
    fail('validation_error', 'Invalid donation update.', 422);
});

add_route('GET', '/admin/stats', static function (): never {
    require_admin();
    $totals = ['USD' => 0, 'INR' => 0];
    $sums = db()->query("SELECT currency, SUM(amount_minor) AS total_minor FROM donations WHERE status = 'paid' GROUP BY currency")->fetchAll();
    foreach ($sums as $sum) {
        if (isset($totals[$sum['currency']])) {
            $totals[$sum['currency']] = (int)$sum['total_minor'];
        }
    }
    $donationCount = (int)db()->query("SELECT COUNT(*) FROM donations WHERE status = 'paid'")->fetchColumn();
    $litBlocks = (int)db()->query("SELECT COUNT(DISTINCT block_id) FROM donations WHERE status = 'paid'")->fetchColumn();
    $totalBlocks = (int)db()->query('SELECT COUNT(*) FROM blocks')->fetchColumn();
    $days = [];
    $startDate = new DateTimeImmutable('today -29 days');
    for ($offset = 0; $offset < 30; $offset++) {
        $date = $startDate->modify('+' . $offset . ' days')->format('Y-m-d');
        $days[$date] = ['date' => $date, 'USD' => 0, 'INR' => 0];
    }
    $daily = db()->prepare("SELECT DATE(paid_at) AS day, currency, SUM(amount_minor) AS total_minor FROM donations WHERE status = 'paid' AND paid_at >= ? GROUP BY DATE(paid_at), currency ORDER BY DATE(paid_at)");
    $daily->execute([$startDate->format('Y-m-d 00:00:00')]);
    foreach ($daily->fetchAll() as $row) {
        $date = (string)$row['day'];
        if (isset($days[$date], $days[$date][$row['currency']])) {
            $days[$date][$row['currency']] = (int)$row['total_minor'];
        }
    }
    send_data([
        'totals' => $totals,
        'donationCount' => $donationCount,
        'litBlocks' => $litBlocks,
        'totalBlocks' => $totalBlocks,
        'last30Days' => array_values($days),
    ]);
});
