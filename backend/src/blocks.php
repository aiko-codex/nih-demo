<?php
declare(strict_types=1);

function face_widths(): array
{
    return [
        'left' => setting_int('windows_left', 6),
        'front' => setting_int('windows_front', 12),
        'right' => setting_int('windows_right', 6),
    ];
}

function block_cover_url(array $row): ?string
{
    $path = $row['cover_file_path'] ?? null;
    return is_string($path) && $path !== '' ? media_public_url($path) : null;
}

function public_block_media(int $blockId): array
{
    $stmt = db()->prepare(
        'SELECT id, kind, file_path, embed_url, caption, width, height FROM block_media WHERE block_id = ? ORDER BY sort_order ASC, id ASC'
    );
    $stmt->execute([$blockId]);

    $media = [];
    foreach ($stmt->fetchAll() as $row) {
        $media[] = [
            'id' => (int)$row['id'],
            'kind' => $row['kind'],
            'url' => $row['file_path'] !== null ? media_public_url((string)$row['file_path']) : null,
            'embedUrl' => $row['embed_url'],
            'caption' => $row['caption'],
            'width' => $row['width'] !== null ? (int)$row['width'] : null,
            'height' => $row['height'] !== null ? (int)$row['height'] : null,
        ];
    }
    return $media;
}

function public_block_donors(int $blockId, bool $emailVisible): array
{
    $stmt = db()->prepare(
        "SELECT donor_name, donor_company, donor_email FROM donations
         WHERE block_id = ? AND status = 'paid' AND show_publicly = 1
         ORDER BY COALESCE(paid_at, created_at) ASC, id ASC"
    );
    $stmt->execute([$blockId]);

    $donors = [];
    foreach ($stmt->fetchAll() as $row) {
        $donor = [
            'name' => $row['donor_name'],
            'company' => $row['donor_company'],
        ];
        if ($emailVisible) {
            $donor['email'] = $row['donor_email'];
        }
        $donors[] = $donor;
    }
    return $donors;
}

function building_payload(): array
{
    $sql = "SELECT b.*, cm.file_path AS cover_file_path,
            (SELECT COUNT(*) FROM donations d WHERE d.block_id = b.id AND d.status = 'paid') AS donor_count
            FROM blocks b
            LEFT JOIN block_media cm ON cm.id = b.cover_media_id
            WHERE b.is_published = 1
            ORDER BY b.floor ASC, FIELD(b.face, 'left', 'front', 'right'), b.window_start ASC, b.code ASC";

    $donationMode = get_setting('donation_mode', 'multiple');
    $blocks = [];
    foreach (db()->query($sql)->fetchAll() as $row) {
        $donorCount = (int)$row['donor_count'];
        $isLit = $donorCount > 0;
        $blocks[] = [
            'code' => $row['code'],
            'name' => $row['name'],
            'tagline' => $row['tagline'],
            'floor' => (int)$row['floor'],
            'face' => $row['face'],
            'windowStart' => (int)$row['window_start'],
            'windowSpan' => (int)$row['window_span'],
            'slotKey' => $row['slot_key'],
            'lit' => $isLit,
            'isLit' => $isLit,
            'donorCount' => $donorCount,
            'isClosed' => $donationMode === 'single' && $isLit,
            'coverUrl' => block_cover_url($row),
        ];
    }

    return [
        'floors' => 10,
        'faces' => face_widths(),
        'blocks' => $blocks,
    ];
}

function public_block_payload(string $code): array
{
    $sql = "SELECT b.*, cm.file_path AS cover_file_path,
            (SELECT COUNT(*) FROM donations d WHERE d.block_id = b.id AND d.status = 'paid') AS donor_count
            FROM blocks b
            LEFT JOIN block_media cm ON cm.id = b.cover_media_id
            WHERE b.code = ? AND b.is_published = 1
            LIMIT 1";
    $stmt = db()->prepare($sql);
    $stmt->execute([strtoupper(trim($code))]);
    $row = $stmt->fetch();
    if ($row === false) {
        fail('not_found', 'Block not found.', 404);
    }

    $blockId = (int)$row['id'];
    $isLit = (int)$row['donor_count'] > 0;
    $isClosed = get_setting('donation_mode', 'multiple') === 'single' && $isLit;

    return [
        'code' => $row['code'],
        'name' => $row['name'],
        'tagline' => $row['tagline'],
        'floor' => (int)$row['floor'],
        'face' => $row['face'],
        'windowStart' => (int)$row['window_start'],
        'windowSpan' => (int)$row['window_span'],
        'storyHtml' => $row['story_html'],
        'isLit' => $isLit,
        'isClosed' => $isClosed,
        'media' => public_block_media($blockId),
        'donors' => public_block_donors($blockId, setting_bool('show_donor_email')),
    ];
}

function list_admin_blocks(): array
{
    $sql = "SELECT b.*, cm.file_path AS cover_file_path,
            (SELECT COUNT(*) FROM donations d WHERE d.block_id = b.id AND d.status = 'paid') AS donor_count,
            (SELECT COUNT(*) FROM block_media m WHERE m.block_id = b.id) AS media_count
            FROM blocks b
            LEFT JOIN block_media cm ON cm.id = b.cover_media_id
            ORDER BY b.floor ASC, FIELD(b.face, 'left', 'front', 'right'), b.window_start ASC, b.code ASC";

    return array_map(
        static fn(array $row): array => admin_block_payload($row),
        db()->query($sql)->fetchAll()
    );
}

function find_admin_block(int $blockId): array
{
    $sql = "SELECT b.*, cm.file_path AS cover_file_path,
            (SELECT COUNT(*) FROM donations d WHERE d.block_id = b.id AND d.status = 'paid') AS donor_count
            FROM blocks b
            LEFT JOIN block_media cm ON cm.id = b.cover_media_id
            WHERE b.id = ?
            LIMIT 1";
    $stmt = db()->prepare($sql);
    $stmt->execute([$blockId]);
    $row = $stmt->fetch();
    if ($row === false) {
        fail('not_found', 'Block not found.', 404);
    }
    return $row;
}

function admin_block_payload(array $row, bool $detailed = false): array
{
    $payload = [
        'id' => (int)$row['id'],
        'code' => $row['code'],
        'slotKey' => $row['slot_key'],
        'name' => $row['name'],
        'tagline' => $row['tagline'],
        'floor' => (int)$row['floor'],
        'face' => $row['face'],
        'windowStart' => (int)$row['window_start'],
        'windowSpan' => (int)$row['window_span'],
        'sortOrder' => (int)$row['sort_order'],
        'isPublished' => (bool)$row['is_published'],
        'donorCount' => (int)($row['donor_count'] ?? 0),
        'mediaCount' => isset($row['media_count'])
            ? (int)$row['media_count']
            : count(admin_media_list((int)$row['id'])),
        'coverMediaId' => $row['cover_media_id'] !== null ? (int)$row['cover_media_id'] : null,
        'coverUrl' => block_cover_url($row),
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];

    if ($detailed) {
        $payload['storyHtml'] = $row['story_html'];
        $payload['media'] = admin_media_list((int)$row['id']);
        $payload['mediaCount'] = count($payload['media']);
    }

    return $payload;
}

function merge_block_value(array $body, array $existing, string $apiKey, string $column, string $type = 'string'): mixed
{
    if (array_key_exists($apiKey, $body)) {
        return $body[$apiKey];
    }
    if ($existing === [] || !array_key_exists($column, $existing)) {
        return null;
    }
    $value = $existing[$column];
    return match ($type) {
        'int' => (int)$value,
        'bool' => (bool)$value,
        default => $value,
    };
}

function validate_block_payload(array $body, array $existing = []): array
{
    $source = [
        'code' => merge_block_value($body, $existing, 'code', 'code'),
        'name' => merge_block_value($body, $existing, 'name', 'name'),
        'tagline' => merge_block_value($body, $existing, 'tagline', 'tagline'),
        'floor' => merge_block_value($body, $existing, 'floor', 'floor', 'int'),
        'face' => merge_block_value($body, $existing, 'face', 'face'),
        'windowStart' => merge_block_value($body, $existing, 'windowStart', 'window_start', 'int'),
        'windowSpan' => merge_block_value($body, $existing, 'windowSpan', 'window_span', 'int'),
        'slotKey' => merge_block_value($body, $existing, 'slotKey', 'slot_key'),
        'storyHtml' => merge_block_value($body, $existing, 'storyHtml', 'story_html'),
        'sortOrder' => merge_block_value($body, $existing, 'sortOrder', 'sort_order', 'int'),
        'isPublished' => merge_block_value($body, $existing, 'isPublished', 'is_published', 'bool'),
    ];

    $floor = field_int($source, 'floor', true, 1, 10);
    $face = (string)field_enum($source, 'face', ['left', 'front', 'right'], true);
    $windowStart = field_int($source, 'windowStart', true, 0, 1000);
    $windowSpan = field_int($source, 'windowSpan', true, 1, 1000);

    $faceWidth = face_widths()[$face];
    if ($windowStart + $windowSpan > $faceWidth) {
        fail(
            'validation_error',
            sprintf(
                'Window range %d-%d does not fit the %s face of floor %d (%d windows).',
                $windowStart,
                $windowStart + $windowSpan - 1,
                $face,
                $floor,
                $faceWidth
            ),
            422
        );
    }

    return [
        'code' => (string)field_code($source, 'code', true),
        'name' => (string)field_string($source, 'name', true, 120),
        'tagline' => field_string($source, 'tagline', false, 200) ?? '',
        'floor' => $floor,
        'face' => $face,
        'windowStart' => $windowStart,
        'windowSpan' => $windowSpan,
        'slotKey' => field_slot_key($source, 'slotKey'),
        'storyHtml' => field_string($source, 'storyHtml', false, 200000) ?? '',
        'sortOrder' => field_int($source, 'sortOrder', false, -1000000, 1000000) ?? 0,
        'isPublished' => field_bool($source, 'isPublished', false) ?? false,
    ];
}

function assert_window_free(int $floor, string $face, int $start, int $span, ?int $excludeId): void
{
    $sql = 'SELECT code FROM blocks WHERE floor = ? AND face = ? AND window_start < ? AND (window_start + window_span) > ?';
    $params = [$floor, $face, $start + $span, $start];
    if ($excludeId !== null) {
        $sql .= ' AND id <> ?';
        $params[] = $excludeId;
    }
    $stmt = db()->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);
    $code = $stmt->fetchColumn();
    if ($code !== false) {
        fail('window_overlap', 'Window range overlaps block ' . $code . ' on floor ' . $floor . '.', 409);
    }
}

function assert_slot_free(?string $slotKey, ?int $excludeId): void
{
    if ($slotKey === null) {
        return;
    }
    $sql = 'SELECT code FROM blocks WHERE slot_key = ?';
    $params = [$slotKey];
    if ($excludeId !== null) {
        $sql .= ' AND id <> ?';
        $params[] = $excludeId;
    }
    $stmt = db()->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);
    $code = $stmt->fetchColumn();
    if ($code !== false) {
        fail('slot_taken', 'Slot ' . $slotKey . ' is already used by block ' . $code . '.', 422);
    }
}

function is_duplicate_key(PDOException $exception): bool
{
    return (string)$exception->getCode() === '23000' || (int)($exception->errorInfo[1] ?? 0) === 1062;
}

function is_slot_conflict(PDOException $exception): bool
{
    return str_contains((string)($exception->errorInfo[2] ?? ''), 'uq_blocks_slot');
}

function create_admin_block(array $body): array
{
    $input = validate_block_payload($body);
    assert_window_free($input['floor'], $input['face'], $input['windowStart'], $input['windowSpan'], null);
    assert_slot_free($input['slotKey'], null);

    $stmt = db()->prepare(
        'INSERT INTO blocks (code, name, tagline, floor, face, window_start, window_span, slot_key, story_html, sort_order, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    try {
        $stmt->execute([
            $input['code'],
            $input['name'],
            $input['tagline'],
            $input['floor'],
            $input['face'],
            $input['windowStart'],
            $input['windowSpan'],
            $input['slotKey'],
            $input['storyHtml'],
            $input['sortOrder'],
            $input['isPublished'] ? 1 : 0,
        ]);
    } catch (PDOException $exception) {
        if (is_duplicate_key($exception)) {
            if (is_slot_conflict($exception)) {
                fail('slot_taken', 'That slot is already assigned to another block.', 422);
            }
            fail('code_taken', 'A block with this code already exists.', 409);
        }
        throw $exception;
    }

    return admin_block_payload(find_admin_block((int)db()->lastInsertId()), true);
}

function update_admin_block(int $blockId, array $body): array
{
    $existing = find_admin_block($blockId);
    $input = validate_block_payload($body, $existing);
    assert_window_free($input['floor'], $input['face'], $input['windowStart'], $input['windowSpan'], $blockId);
    assert_slot_free($input['slotKey'], $blockId);

    $stmt = db()->prepare(
        'UPDATE blocks SET code = ?, name = ?, tagline = ?, floor = ?, face = ?, window_start = ?,
         window_span = ?, slot_key = ?, story_html = ?, sort_order = ?, is_published = ? WHERE id = ?'
    );
    try {
        $stmt->execute([
            $input['code'],
            $input['name'],
            $input['tagline'],
            $input['floor'],
            $input['face'],
            $input['windowStart'],
            $input['windowSpan'],
            $input['slotKey'],
            $input['storyHtml'],
            $input['sortOrder'],
            $input['isPublished'] ? 1 : 0,
            $blockId,
        ]);
    } catch (PDOException $exception) {
        if (is_duplicate_key($exception)) {
            if (is_slot_conflict($exception)) {
                fail('slot_taken', 'That slot is already assigned to another block.', 422);
            }
            fail('code_taken', 'A block with this code already exists.', 409);
        }
        throw $exception;
    }

    return admin_block_payload(find_admin_block($blockId), true);
}

function update_block_cover(int $blockId, ?int $mediaId): array
{
    find_admin_block($blockId);
    if ($mediaId !== null) {
        $stmt = db()->prepare('SELECT id FROM block_media WHERE id = ? AND block_id = ? LIMIT 1');
        $stmt->execute([$mediaId, $blockId]);
        if ($stmt->fetchColumn() === false) {
            fail('validation_error', 'Media does not belong to this block.', 422);
        }
    }
    db()->prepare('UPDATE blocks SET cover_media_id = ? WHERE id = ?')->execute([$mediaId, $blockId]);
    return admin_block_payload(find_admin_block($blockId), true);
}

function delete_admin_block(int $blockId): void
{
    find_admin_block($blockId);
    if (block_donor_count($blockId) > 0) {
        fail('conflict', 'This block has paid donations and cannot be deleted.', 409);
    }

    $stmt = db()->prepare('SELECT file_path FROM block_media WHERE block_id = ?');
    $stmt->execute([$blockId]);
    foreach ($stmt->fetchAll() as $row) {
        if ($row['file_path'] !== null) {
            remove_media_file((string)$row['file_path']);
        }
    }

    db()->prepare('DELETE FROM blocks WHERE id = ?')->execute([$blockId]);

    $dir = app_root() . '/uploads/blocks/' . $blockId;
    if (is_dir($dir)) {
        @rmdir($dir);
    }
}

function block_donor_count(int $blockId): int
{
    $stmt = db()->prepare("SELECT COUNT(*) FROM donations WHERE block_id = ? AND status = 'paid'");
    $stmt->execute([$blockId]);
    return (int)$stmt->fetchColumn();
}
