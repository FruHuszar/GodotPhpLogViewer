<?php

declare(strict_types=1);

require_once __DIR__ . '/../app/Http/Controllers/LogController.php';

function respond_with_error(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode([
        'status' => 'error',
        'message' => $message,
    ]);
}

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$uriSegments = array_values(array_filter(explode('/', trim($requestUri, '/')), static fn (string $segment): bool => $segment !== ''));

$apiIndex = array_search('api', $uriSegments, true);

if ($apiIndex === false || ($uriSegments[$apiIndex + 1] ?? null) !== 'logs') {
    respond_with_error(404, 'Endpoint Not Found');
    return;
}

$idSegment = $uriSegments[$apiIndex + 2] ?? null;

if ($idSegment !== null && !ctype_digit($idSegment)) {
    respond_with_error(404, 'Endpoint Not Found');
    return;
}

$id = $idSegment !== null ? (int) $idSegment : null;

$controller = new LogController();

switch ($requestMethod) {
    case 'GET':
        if ($id !== null) {
            $controller->show($id);
        } else {
            $controller->index();
        }
        break;

    case 'POST':
        if ($id === null) {
            $controller->store();
        } else {
            respond_with_error(405, 'Method Not Allowed');
        }
        break;

    case 'DELETE':
        if ($id !== null) {
            $controller->destroy($id);
        } else {
            $controller->destroyAll();
        }
        break;

    default:
        respond_with_error(405, 'Method Not Allowed');
        break;
}
