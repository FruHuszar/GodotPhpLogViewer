<?php

class LogController
{
    private Log $model;

    private array $allowedTypes = ['ERROR', 'WARNING', 'INFO'];
    private int $maxScriptPathLength = 255;
    private int $defaultLimit = 500;
    private int $maxLimit = 5000;

    public function __construct(Log $model)
    {
        $this->model = $model;
    }

    public function index(): void
    {
        $logs = $this->model->getAll($this->limit(), $this->type(), $this->search());

        $this->jsonResponse([
            'status' => 'success',
            'data' => $logs,
        ]);
    }

    public function show(int $id): void
    {
        $log = $this->model->getById($id);

        if (!$log) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Log not found',
            ], 404);
        }

        $this->jsonResponse([
            'status' => 'success',
            'data' => $log,
        ]);
    }

    public function store(): void
    {
        $inputData = json_decode((string) file_get_contents('php://input'), true);

        if (!is_array($inputData)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Request body must be a JSON object or an array of them',
            ], 400);
        }

        if (array_is_list($inputData)) {
            $this->storeMany($inputData);
        }

        $entry = $this->validate($inputData);

        if (is_string($entry)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => $entry,
            ], 400);
        }

        $newId = $this->model->create($entry);

        $this->jsonResponse([
            'status' => 'success',
            'data' => $this->model->getById($newId),
        ], 201);
    }

    public function destroy(int $id): void
    {
        if (!$this->model->deleteById($id)) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'Log not found or already deleted',
            ], 404);
        }

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'Log deleted successfully',
        ]);
    }

    public function destroyAll(): void
    {
        $this->model->deleteAll();

        $this->jsonResponse([
            'status' => 'success',
            'message' => 'All logs deleted successfully',
        ]);
    }

    private function storeMany(array $entries): void
    {
        if ($entries === []) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'The batch is empty',
            ], 400);
        }

        $valid = [];
        $rejected = [];

        foreach ($entries as $index => $candidate) {
            $entry = is_array($candidate) ? $this->validate($candidate) : 'not an object';

            if (is_string($entry)) {
                $rejected[] = "#{$index}: {$entry}";
                continue;
            }

            $valid[] = $entry;
        }

        if ($valid === []) {
            $this->jsonResponse([
                'status' => 'error',
                'message' => 'No valid entries in the batch: ' . implode('; ', $rejected),
            ], 400);
        }

        $this->jsonResponse([
            'status' => 'success',
            'inserted' => $this->model->createMany($valid),
            'rejected' => $rejected,
        ], 201);
    }

    private function validate(array $input): array|string
    {
        $logType = strtoupper(trim((string) ($input['log_type'] ?? '')));
        $scriptPath = trim((string) ($input['script_path'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if ($logType === '' || $message === '') {
            return 'Missing required fields: log_type, script_path, message';
        }

        if (!in_array($logType, $this->allowedTypes, true)) {
            return 'log_type must be one of: ' . implode(', ', $this->allowedTypes);
        }

        return [
            'log_type' => $logType,
            'script_path' => $this->truncate($scriptPath),
            'message' => $message,
        ];
    }

    private function truncate(string $value): string
    {
        preg_match('/^.{0,' . $this->maxScriptPathLength . '}/us', $value, $matches);

        return $matches[0] ?? $value;
    }

    private function limit(): int
    {
        if (!isset($_GET['limit']) || !ctype_digit((string) $_GET['limit'])) {
            return $this->defaultLimit;
        }

        return max(1, min($this->maxLimit, (int) $_GET['limit']));
    }

    private function type(): string
    {
        $type = strtoupper(trim((string) ($_GET['type'] ?? '')));

        return in_array($type, $this->allowedTypes, true) ? $type : '';
    }

    private function search(): string
    {
        return trim((string) ($_GET['q'] ?? ''));
    }

    private function jsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
