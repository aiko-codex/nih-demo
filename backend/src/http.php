<?php
declare(strict_types=1);

final class ApiException extends RuntimeException
{
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 400
    ) {
        parent::__construct($message);
    }
}

function fail(string $code, string $message, int $status = 400): never
{
    throw new ApiException($code, $message, $status);
}

function send_json(mixed $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function send_data(mixed $data, int $status = 200): never
{
    send_json(['data' => $data], $status);
}

function send_error(string $code, string $message, int $status = 400): never
{
    send_json(['error' => ['code' => $code, 'message' => $message]], $status);
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fail('invalid_json', 'Request body must be a JSON object.', 400);
    }
    return $decoded;
}

function request_method(): string
{
    return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function api_base_path(): string
{
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    if (str_ends_with($script, '/index.php')) {
        $script = substr($script, 0, -strlen('/index.php'));
    }
    return rtrim($script, '/');
}

function request_path(): string
{
    $uri = str_replace('\\', '/', (string)($_SERVER['REQUEST_URI'] ?? '/'));
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        $path = '/';
    }

    $base = api_base_path();
    if ($base !== '' && str_starts_with($path, $base)) {
        $path = substr($path, strlen($base));
    }
    if ($path === '/index.php' || str_starts_with($path, '/index.php/')) {
        $path = substr($path, strlen('/index.php'));
    }
    if (preg_match('#^/api(/|$)#', $path) === 1) {
        $path = substr($path, strlen('/api'));
    }
    if ($path === '') {
        $path = '/';
    }

    return '/' . trim($path, '/');
}

function public_base_url(): string
{
    $forwardedProto = strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProto === 'https';
    $scheme = $isHttps ? 'https' : 'http';
    $host = (string)($_SERVER['HTTP_HOST'] ?? 'localhost');
    return $scheme . '://' . $host . api_base_path();
}

function apply_cors(): void
{
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    $allowed = config('allowed_origins', []);
    if ($origin !== '' && is_array($allowed) && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');
        header('Access-Control-Max-Age: 600');
    }
}

function add_route(string $method, string $pattern, callable $handler): void
{
    $GLOBALS['NIH_ROUTES'][] = [
        'method' => strtoupper($method),
        'pattern' => $pattern,
        'handler' => $handler,
    ];
}

function route_regex(string $pattern): string
{
    $parts = preg_split('/(\{[A-Za-z]+\})/', $pattern, -1, PREG_SPLIT_DELIM_CAPTURE);
    $regex = '';
    foreach ($parts === false ? [] : $parts as $part) {
        if (preg_match('/^\{([A-Za-z]+)\}$/', $part, $name) === 1) {
            $regex .= '(?P<' . $name[1] . '>[^/]+)';
        } else {
            $regex .= preg_quote($part, '#');
        }
    }
    return '#^' . $regex . '$#';
}

function dispatch_request(): void
{
    apply_cors();

    if (request_method() === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    $path = request_path();
    $routes = $GLOBALS['NIH_ROUTES'] ?? [];
    $pathMatched = false;

    foreach ($routes as $route) {
        if (preg_match(route_regex((string)$route['pattern']), $path, $matches) !== 1) {
            continue;
        }
        $pathMatched = true;
        if ($route['method'] !== request_method()) {
            continue;
        }

        $params = [];
        foreach ($matches as $name => $value) {
            if (is_string($name)) {
                $params[$name] = urldecode((string)$value);
            }
        }

        try {
            ($route['handler'])($params);
        } catch (ApiException $exception) {
            send_error($exception->errorCode, $exception->getMessage(), $exception->status);
        } catch (Throwable $exception) {
            error_log('[nih-api] ' . $exception->getMessage());
            send_error('server_error', 'Something went wrong.', 500);
        }
        return;
    }

    if ($pathMatched) {
        send_error('method_not_allowed', 'Method not allowed for this route.', 405);
    }
    send_error('not_found', 'Route not found.', 404);
}
