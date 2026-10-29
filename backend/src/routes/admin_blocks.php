<?php
declare(strict_types=1);

add_route('GET', '/admin/blocks', function (array $params): void {
    require_admin();
    send_data(list_admin_blocks());
});

add_route('POST', '/admin/blocks', function (array $params): void {
    require_admin_write();
    send_data(create_admin_block(read_json_body()), 201);
});

add_route('GET', '/admin/blocks/{id}', function (array $params): void {
    require_admin();
    $block = find_admin_block(route_id($params['id']));
    send_data(admin_block_payload($block, true));
});

add_route('PUT', '/admin/blocks/{id}', function (array $params): void {
    require_admin_write();
    send_data(update_admin_block(route_id($params['id']), read_json_body()));
});

add_route('DELETE', '/admin/blocks/{id}', function (array $params): void {
    require_admin_write();
    delete_admin_block(route_id($params['id']));
    send_data(['deleted' => true]);
});

add_route('PUT', '/admin/blocks/{id}/cover', function (array $params): void {
    require_admin_write();
    $blockId = route_id($params['id']);
    $body = read_json_body();
    if (!array_key_exists('mediaId', $body)) {
        fail('validation_error', 'Field "mediaId" is required.', 422);
    }
    $mediaId = $body['mediaId'] === null
        ? null
        : field_int(['mediaId' => $body['mediaId']], 'mediaId', true, 1, 4294967295);
    send_data(update_block_cover($blockId, $mediaId));
});
