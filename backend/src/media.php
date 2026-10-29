<?php
declare(strict_types=1);

function media_public_url(?string $relativePath): ?string
{
    if ($relativePath === null || $relativePath === '') {
        return null;
    }
    return public_base_url() . '/' . ltrim($relativePath, '/');
}

function block_upload_dir(int $blockId): string
{
    $dir = app_root() . '/uploads/blocks/' . $blockId;
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        fail('server_error', 'Could not create the upload directory.', 500);
    }
    return $dir;
}

function admin_media_list(int $blockId): array
{
    $stmt = db()->prepare('SELECT * FROM block_media WHERE block_id = ? ORDER BY sort_order ASC, id ASC');
    $stmt->execute([$blockId]);
    return array_map(
        static fn(array $row): array => admin_media_payload($row),
        $stmt->fetchAll()
    );
}

function admin_media_payload(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'blockId' => (int)$row['block_id'],
        'kind' => $row['kind'],
        'url' => $row['file_path'] !== null ? media_public_url((string)$row['file_path']) : null,
        'embedUrl' => $row['embed_url'],
        'caption' => $row['caption'],
        'width' => $row['width'] !== null ? (int)$row['width'] : null,
        'height' => $row['height'] !== null ? (int)$row['height'] : null,
        'sortOrder' => (int)$row['sort_order'],
        'createdAt' => $row['created_at'],
    ];
}

function find_media(int $mediaId): array
{
    $stmt = db()->prepare('SELECT * FROM block_media WHERE id = ? LIMIT 1');
    $stmt->execute([$mediaId]);
    $row = $stmt->fetch();
    if ($row === false) {
        fail('not_found', 'Media not found.', 404);
    }
    return $row;
}

function next_media_sort_order(int $blockId): int
{
    $stmt = db()->prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM block_media WHERE block_id = ?');
    $stmt->execute([$blockId]);
    return (int)$stmt->fetchColumn();
}

function insert_media_row(
    int $blockId,
    string $kind,
    ?string $filePath,
    ?string $embedUrl,
    ?int $width,
    ?int $height,
    string $caption = ''
): array {
    $stmt = db()->prepare(
        'INSERT INTO block_media (block_id, kind, file_path, embed_url, caption, width, height, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $blockId,
        $kind,
        $filePath,
        $embedUrl,
        $caption,
        $width,
        $height,
        next_media_sort_order($blockId),
    ]);
    return admin_media_payload(find_media((int)db()->lastInsertId()));
}

function create_media_entry(int $blockId): array
{
    $upload = $_FILES['file'] ?? null;
    if (is_array($upload) && (int)($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if ((int)$upload['error'] !== UPLOAD_ERR_OK) {
            fail('upload_failed', upload_error_message((int)$upload['error']), 422);
        }
        $tmpPath = (string)($upload['tmp_name'] ?? '');
        if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
            fail('upload_failed', 'No uploaded file was received.', 422);
        }
        $caption = mb_substr(trim((string)($_POST['caption'] ?? '')), 0, 255);
        return save_uploaded_media($blockId, $upload, $caption);
    }

    $body = read_json_body();
    field_enum($body, 'kind', ['embed'], true);
    $embedUrl = validate_embed_url((string)field_string($body, 'embedUrl', true, 500));
    $caption = field_string($body, 'caption', false, 255) ?? '';
    return insert_media_row($blockId, 'embed', null, $embedUrl, null, null, $caption);
}

function save_uploaded_media(int $blockId, array $upload, string $caption): array
{
    $tmpPath = (string)$upload['tmp_name'];
    $size = (int)$upload['size'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmpPath);
    $mime = is_string($mime) ? strtolower($mime) : '';

    if (in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        if ($size > 8 * 1024 * 1024) {
            fail('validation_error', 'Images must be 8 MB or smaller.', 422);
        }
        return store_image($blockId, $tmpPath, $caption);
    }

    if (in_array($mime, ['video/mp4', 'video/webm'], true)) {
        if ($size > 60 * 1024 * 1024) {
            fail('validation_error', 'Videos must be 60 MB or smaller.', 422);
        }
        return store_video($blockId, $tmpPath, $mime === 'video/mp4' ? 'mp4' : 'webm', $caption);
    }

    fail('validation_error', 'Unsupported file type. Use JPG, PNG, WebP, MP4 or WebM.', 422);
}

function store_image(int $blockId, string $tmpPath, string $caption): array
{
    if (!function_exists('imagewebp')) {
        fail('server_error', 'WebP support is missing on the server.', 500);
    }

    [$image, $width, $height] = load_resized_image($tmpPath);
    $name = bin2hex(random_bytes(16)) . '.webp';
    $target = block_upload_dir($blockId) . DIRECTORY_SEPARATOR . $name;
    $saved = imagewebp($image, $target, 82);
    imagedestroy($image);
    if (!$saved) {
        fail('server_error', 'Could not save the image.', 500);
    }

    $relativePath = 'uploads/blocks/' . $blockId . '/' . $name;
    return insert_media_row($blockId, 'image', $relativePath, null, $width, $height, $caption);
}

function store_video(int $blockId, string $tmpPath, string $extension, string $caption): array
{
    $name = bin2hex(random_bytes(16)) . '.' . $extension;
    $target = block_upload_dir($blockId) . DIRECTORY_SEPARATOR . $name;
    if (!move_uploaded_file($tmpPath, $target)) {
        fail('server_error', 'Could not save the video.', 500);
    }

    $relativePath = 'uploads/blocks/' . $blockId . '/' . $name;
    return insert_media_row($blockId, 'video', $relativePath, null, null, null, $caption);
}

function load_resized_image(string $tmpPath): array
{
    $contents = file_get_contents($tmpPath);
    $image = $contents === false ? false : @imagecreatefromstring($contents);
    if ($image === false) {
        fail('invalid_file', 'The image could not be read.', 422);
    }

    $width = imagesx($image);
    $height = imagesy($image);
    $maxSide = 1920;

    if ($width > $maxSide || $height > $maxSide) {
        $scale = $maxSide / max($width, $height);
        $newWidth = max(1, (int)round($width * $scale));
        $newHeight = max(1, (int)round($height * $scale));
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
        imagefilledrectangle($resized, 0, 0, $newWidth, $newHeight, $transparent);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);
        $image = $resized;
        $width = $newWidth;
        $height = $newHeight;
    }

    return [$image, $width, $height];
}

function update_media_caption(int $mediaId, string $caption): array
{
    find_media($mediaId);
    db()->prepare('UPDATE block_media SET caption = ? WHERE id = ?')->execute([$caption, $mediaId]);
    return admin_media_payload(find_media($mediaId));
}

function delete_media_entry(int $mediaId): void
{
    $media = find_media($mediaId);
    if ($media['file_path'] !== null) {
        remove_media_file((string)$media['file_path']);
    }
    db()->prepare('UPDATE blocks SET cover_media_id = NULL WHERE cover_media_id = ?')->execute([$mediaId]);
    db()->prepare('DELETE FROM block_media WHERE id = ?')->execute([$mediaId]);
}

function reorder_block_media(int $blockId, array $ids): array
{
    find_admin_block($blockId);

    $stmt = db()->prepare('SELECT id FROM block_media WHERE block_id = ?');
    $stmt->execute([$blockId]);
    $current = array_map('intval', array_column($stmt->fetchAll(), 'id'));

    $sortedCurrent = $current;
    $sortedIds = $ids;
    sort($sortedCurrent);
    sort($sortedIds);

    if (count(array_unique($ids)) !== count($ids) || $sortedCurrent !== $sortedIds) {
        fail('validation_error', 'ids must list every media item of this block exactly once.', 422);
    }

    $update = db()->prepare('UPDATE block_media SET sort_order = ? WHERE id = ? AND block_id = ?');
    foreach ($ids as $index => $mediaId) {
        $update->execute([$index + 1, $mediaId, $blockId]);
    }

    return admin_media_list($blockId);
}

function validate_embed_url(string $url): string
{
    $parts = parse_url($url);
    if ($parts === false || !isset($parts['scheme'], $parts['host'])) {
        fail('validation_error', 'embedUrl must be a valid URL.', 422);
    }
    if (strtolower((string)$parts['scheme']) !== 'https') {
        fail('validation_error', 'embedUrl must use https.', 422);
    }

    $host = strtolower((string)$parts['host']);
    $allowedHost = false;
    foreach (['youtube.com', 'youtu.be', 'vimeo.com'] as $root) {
        if ($host === $root || str_ends_with($host, '.' . $root)) {
            $allowedHost = true;
            break;
        }
    }
    if (!$allowedHost) {
        fail('validation_error', 'Only YouTube and Vimeo embeds are allowed.', 422);
    }

    return $url;
}

function remove_media_file(string $relativePath): void
{
    $normalized = str_replace('\\', '/', ltrim($relativePath, '/'));
    if (!str_starts_with($normalized, 'uploads/') || str_contains($normalized, '..')) {
        return;
    }
    $fullPath = app_root() . '/' . $normalized;
    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}

function upload_error_message(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The file is larger than the server allows.',
        UPLOAD_ERR_PARTIAL => 'The file was only partially uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'The server is missing a temporary upload folder.',
        UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded file.',
        default => 'The upload failed.',
    };
}
