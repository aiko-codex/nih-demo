<?php
declare(strict_types=1);

add_route('POST', '/admin/blocks/{id}/media', function (array $params): void {
    require_admin_write();
    $blockId = route_id($params['id']);
    find_admin_block($blockId);
    send_data(create_media_entry($blockId), 201);
});

add_route('POST', '/admin/blocks/{id}/media/reorder', function (array $params): void {
    require_admin_write();
    $blockId = route_id($params['id']);
    $ids = field_int_list(read_json_body(), 'ids', true, 1, 4294967295) ?? [];
    send_data(reorder_block_media($blockId, $ids));
});

add_route('PUT', '/admin/media/{id}', function (array $params): void {
    require_admin_write();
    $body = read_json_body();
    $caption = field_string($body, 'caption', false, 255) ?? '';
    send_data(update_media_caption(route_id($params['id']), $caption));
});

add_route('DELETE', '/admin/media/{id}', function (array $params): void {
    require_admin_write();
    delete_media_entry(route_id($params['id']));
    send_data(['deleted' => true]);
});
