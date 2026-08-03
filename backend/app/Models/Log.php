<?php

class Log
{
    private PDO $db;
    private string $table = 'logs';

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getAll(int $limit, string $type = '', string $search = ''): array
    {
        $conditions = [];
        $params = [];

        if ($type !== '') {
            $conditions[] = 'log_type = :type';
            $params[':type'] = $type;
        }

        if ($search !== '') {
            $conditions[] = '(message LIKE :search OR script_path LIKE :search)';
            $params[':search'] = '%' . addcslashes($search, '%_\\') . '%';
        }

        $where = $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions);

        $sql = "SELECT * FROM {$this->table} {$where} ORDER BY created_at DESC, id DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);

        foreach ($params as $name => $value) {
            $stmt->bindValue($name, $value, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getById(int $id): array|false
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function create(array $entry): int
    {
        $this->insert($this->db->prepare($this->insertSql()), $entry);

        return (int) $this->db->lastInsertId();
    }

    public function createMany(array $entries): int
    {
        $stmt = $this->db->prepare($this->insertSql());
        $this->db->beginTransaction();

        try {
            foreach ($entries as $entry) {
                $this->insert($stmt, $entry);
            }

            $this->db->commit();
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }

        return count($entries);
    }

    public function deleteById(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    public function deleteAll(): bool
    {
        return $this->db->prepare("DELETE FROM {$this->table}")->execute();
    }

    private function insertSql(): string
    {
        return "INSERT INTO {$this->table} (log_type, script_path, message)
                VALUES (:log_type, :script_path, :message)";
    }

    private function insert(PDOStatement $stmt, array $entry): void
    {
        $stmt->execute([
            ':log_type' => $entry['log_type'],
            ':script_path' => $entry['script_path'],
            ':message' => $entry['message'],
        ]);
    }
}
