<?php

declare(strict_types=1);

require_once __DIR__ . '/Env.php';

class Database
{
    private static ?PDO $connection = null;

    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private string $charset;

    public function __construct()
    {
        Env::load(__DIR__ . '/../.env');

        $this->host = Env::get('DB_HOST', '127.0.0.1');
        $this->database = Env::get('DB_NAME', 'godot_log_viewer');
        $this->username = Env::get('DB_USER', 'root');
        $this->password = Env::get('DB_PASS', '') ?? '';
        $this->charset = Env::get('DB_CHARSET', 'utf8mb4');
    }

    public function getConnection(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $dsn = "mysql:host={$this->host};dbname={$this->database};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            self::$connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            error_log('Database: ' . $exception->getMessage());

            throw new RuntimeException(
                "Could not connect to database '{$this->database}' on '{$this->host}'. "
                . 'Check that MySQL is running and that backend/.env is correct.'
            );
        }

        return self::$connection;
    }
}
