<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/Env.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../app/Models/Log.php';
require_once __DIR__ . '/../app/Http/Controllers/LogController.php';
require_once __DIR__ . '/../routes/api.php';

try {
    $env = new Env();
    $env->load(__DIR__ . '/../.env');

    $routes = new LogRoutes(
        new LogController(
            new Log(
                (new Database($env))->getConnection()
            )
        )
    );

    $routes->handleRequest();
} catch (Throwable $exception) {
    error_log((string) $exception);

    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $exception->getMessage(),
    ]);
}
