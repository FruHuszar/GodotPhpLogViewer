<?php

class LogRoutes
{
    private LogController $controller;
    private string $method;
    private array $segments = [];

    public function __construct(LogController $controller)
    {
        $this->controller = $controller;
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->segments = $this->uriSegments();
    }

    public function handleRequest(): void
    {
        if (!$this->isLogsEndpoint()) {
            $this->fail(404, 'Endpoint Not Found');
        }

        $id = $this->id();

        switch ($this->method) {
            case 'GET':
                $id === null ? $this->controller->index() : $this->controller->show($id);
                break;

            case 'POST':
                if ($id !== null) {
                    $this->fail(405, 'Method Not Allowed');
                }
                $this->controller->store();
                break;

            case 'DELETE':
                $id === null ? $this->controller->destroyAll() : $this->controller->destroy($id);
                break;

            default:
                $this->fail(405, 'Method Not Allowed');
                break;
        }
    }

    private function uriSegments(): array
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

        return array_values(array_filter(explode('/', trim($path, '/')), fn (string $segment): bool => $segment !== ''));
    }

    private function isLogsEndpoint(): bool
    {
        $apiIndex = array_search('api', $this->segments, true);

        if ($apiIndex === false || ($this->segments[$apiIndex + 1] ?? null) !== 'logs') {
            return false;
        }

        $idSegment = $this->segments[$apiIndex + 2] ?? null;

        return $idSegment === null || ctype_digit($idSegment);
    }

    private function id(): ?int
    {
        $apiIndex = (int) array_search('api', $this->segments, true);
        $idSegment = $this->segments[$apiIndex + 2] ?? null;

        return $idSegment === null ? null : (int) $idSegment;
    }

    private function fail(int $status, string $message): void
    {
        http_response_code($status);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
        ]);
        exit;
    }
}
