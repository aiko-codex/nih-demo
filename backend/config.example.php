<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'nih_hub',
        'user' => 'root',
        'pass' => '',
    ],
    'app_url' => 'http://localhost:5173',
    'stripe_secret_key' => '',
    'stripe_webhook_secret' => '',
    'razorpay_key_id' => '',
    'razorpay_key_secret' => '',
    'razorpay_webhook_secret' => '',
    'allowed_origins' => ['http://localhost:5173'],
];
