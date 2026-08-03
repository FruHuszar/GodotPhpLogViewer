<?php

class Env
{
    private array $variables = [];

    public function load(string $filePath): void
    {
        if (!is_readable($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode('=', $line, 2));

            if ($key !== '') {
                $this->variables[$key] = trim($value, "\"'");
            }
        }
    }

    public function get(string $key, string $default = ''): string
    {
        $value = $this->variables[$key] ?? '';

        return $value === '' ? $default : $value;
    }
}
