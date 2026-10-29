<?php
declare(strict_types=1);

add_route('GET', '/building', function (array $params): void {
    send_data(building_payload());
});

add_route('GET', '/blocks/{code}', function (array $params): void {
    send_data(public_block_payload($params['code']));
});

add_route('GET', '/settings/public', function (array $params): void {
    send_data(public_settings_payload());
});
