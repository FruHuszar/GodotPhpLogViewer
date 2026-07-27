<?php

declare(strict_types=1);

require_once __DIR__ . '/../../Models/Log.php';

class LogController
{
    private const ALLOWED_TYPES = ['ERROR', 'WARNING', 'INFO'];
    private const MAX_SCRIPT_PATH_LENGTH = 255;
    private const DEFAULT_LIMIT = 500;
    private const MAX_LIMIT = 5000;

    private ?Log $logModel = null;

    public function index(): void
    {
        $this->run(function (): void {
            $limit = self::DEFAULT_LIMIT;

            if (isset($_GET['limit']) && ctype_digit((string) $_GET['limit'])) {
                $limit = max(1, min(self::MAX_LIMIT, (int) $_GET['limit']));
            }

            $type = strtoupper(trim((string) ($_GET['type'] ?? '')));

            if ($type !== '' && !in_array($type, self::ALLOWED_TYPES, true)) {
                $type = '';
            }

            $search = trim((string) ($_GET['q'] ?? ''));

            $logs = $this->model()->getAll($limit, $type, $search);

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'data' => $logs,
            ]);
        });
    }

    public function show(int $id): void
    {
        $this->run(function () use ($id): void {
            $log = $this->model()->getById($id);

            if (!$log) {
                $this->fail(404, 'Log not found');
                return;
            }

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'data' => $log,
            ]);
        });
    }

    public function store(): void
    {
        $this->run(function (): void {
            $raw = file_get_contents('php://input');
            $inputData = json_decode($raw !== false ? $raw : '', true);

            if (!is_array($inputData)) {
                $this->fail(400, 'Request body must be a JSON object or an array of them');
                return;
            }

            if (self::isList($inputData)) {
                $this->storeMany($inputData);
                return;
            }

            $entry = $this->validate($inputData);

            if (is_string($entry)) {
                $this->fail(400, $entry);
                return;
            }

            $newId = $this->model()->create(
                $entry['log_type'],
                $entry['script_path'],
                $entry['message']
            );

            if (!$newId) {
                $this->fail(500, 'Failed to create log entry');
                return;
            }

            http_response_code(201);
            echo json_encode([
                'status' => 'success',
                'data' => $this->model()->getById($newId),
            ]);
        });
    }

    private function storeMany(array $entries): void
    {
        if ($entries === []) {
            $this->fail(400, 'The batch is empty');
            return;
        }

        $valid = [];
        $rejected = [];

        foreach ($entries as $index => $candidate) {
            if (!is_array($candidate)) {
                $rejected[] = "#{$index}: not an object";
                continue;
            }

            $entry = $this->validate($candidate);

            if (is_string($entry)) {
                $rejected[] = "#{$index}: {$entry}";
                continue;
            }

            $valid[] = $entry;
        }

        if ($valid === []) {
            $this->fail(400, 'No valid entries in the batch: ' . implode('; ', $rejected));
            return;
        }

        $inserted = $this->model()->createMany($valid);

        http_response_code(201);
        echo json_encode([
            'status' => 'success',
            'inserted' => $inserted,
            'rejected' => $rejected,
        ]);
    }

    private function validate(array $input): array|string
    {
        $logType = strtoupper(trim((string) ($input['log_type'] ?? '')));
        $scriptPath = trim((string) ($input['script_path'] ?? ''));
        $message = trim((string) ($input['message'] ?? ''));

        if ($logType === '' || $message === '') {
            return 'Missing required fields: log_type, script_path, message';
        }

        if (!in_array($logType, self::ALLOWED_TYPES, true)) {
            return 'log_type must be one of: ' . implode(', ', self::ALLOWED_TYPES);
        }

        return [
            'log_type' => $logType,
            'script_path' => self::truncate($scriptPath, self::MAX_SCRIPT_PATH_LENGTH),
            'message' => $message,
        ];
    }

    public function destroy(int $id): void
    {
        $this->run(function () use ($id): void {
            if (!$this->model()->deleteById($id)) {
                $this->fail(404, 'Log not found or already deleted');
                return;
            }

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Log deleted successfully',
            ]);
        });
    }

    public function destroyAll(): void
    {
        $this->run(function (): void {
            $this->model()->deleteAll();

            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'All logs deleted successfully',
            ]);
        });
    }

    private static function isList(array $value): bool
    {
        if (function_exists('array_is_list')) {
            return array_is_list($value);
        }

        return $value === [] || array_keys($value) === range(0, count($value) - 1);
    }

    private static function truncate(string $value, int $limit): string
    {
        if (function_exists('mb_substr')) {
            return mb_substr($value, 0, $limit);
        }

        $matches = [];

        if (preg_match('/^.{0,' . $limit . '}/us', $value, $matches) === 1) {
            return $matches[0];
        }

        return substr($value, 0, $limit);
    }

    private function model(): Log
    {
        if ($this->logModel === null) {
            $this->logModel = new Log();
        }

        return $this->logModel;
    }

    private function run(callable $action): void
    {
        try {
            $action();
        } catch (Throwable $exception) {
            error_log((string) $exception);
            $this->fail(500, $exception->getMessage());
        }
    }

    private function fail(int $status, string $message): void
    {
        http_response_code($status);
        echo json_encode([
            'status' => 'error',
            'message' => $message,
        ]);
    }
}
