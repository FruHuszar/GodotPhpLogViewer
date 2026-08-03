<?php

class Database
{
    private ?PDO $connection = null;

    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private string $charset;

    public function __construct(Env $env)
    {
        $this->host = $env->get('DB_HOST', '127.0.0.1');
        $this->database = $env->get('DB_NAME', 'godot_log_viewer');
        $this->username = $env->get('DB_USER', 'root');
        $this->password = $env->get('DB_PASS');
        $this->charset = $env->get('DB_CHARSET', 'utf8mb4');
    }

    public function getConnection(): PDO
    {
        if ($this->connection !== null) {
            return $this->connection;
        }

        $dsn = "mysql:host={$this->host};dbname={$this->database};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            throw new RuntimeException(
                "Could not connect to database '{$this->database}' on '{$this->host}'. "
                . 'Check that MySQL is running and that backend/.env is correct.'
            );
        }

        return $this->connection;
    }
}
