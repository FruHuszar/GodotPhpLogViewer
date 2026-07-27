<?php 

require_once __DIR__ . '/../../config/Database.php';

class Log 
{
    private PDO $db;
    private string $table = 'logs';

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAll(int $limit = 500, string $type = '', string $search = ''): array
    {
        $conditions = [];
        $params = [];

        if ($type !== '') {
            $conditions[] = 'log_type = :type';
            $params[':type'] = $type;
        }

        if ($search !== '') {
            $needle = '%' . addcslashes($search, '%_\\') . '%';
            $conditions[] = '(message LIKE :search_message OR script_path LIKE :search_path)';
            $params[':search_message'] = $needle;
            $params[':search_path'] = $needle;
        }

        $where = $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions);

        $sql = "SELECT * FROM {$this->table} {$where} ORDER BY created_at DESC, id DESC LIMIT :limit";
        $stmt = $this->db->prepare($sql);

        foreach ($params as $name => $value) {
            $stmt->bindValue($name, $value, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $id): array|false
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

   public function create(string $logType, string $scriptPath, string $message): int|false 
    {
        $sql = "INSERT INTO {$this->table} (log_type, script_path, message) 
                  VALUES (:log_type, :script_path, :message)";
        
        $stmt = $this->db->prepare($sql);

        $success = $stmt->execute([
            ':log_type'    => $logType,
            ':script_path' => $scriptPath,
            ':message'     => $message
        ]);

        if ($success) {
            return (int) $this->db->lastInsertId();
        }

        return false;
    }

    public function createMany(array $entries): int
    {
        $sql = "INSERT INTO {$this->table} (log_type, script_path, message)
                  VALUES (:log_type, :script_path, :message)";

        $stmt = $this->db->prepare($sql);

        $this->db->beginTransaction();

        try {
            $inserted = 0;

            foreach ($entries as $entry) {
                $stmt->execute([
                    ':log_type'    => $entry['log_type'],
                    ':script_path' => $entry['script_path'],
                    ':message'     => $entry['message'],
                ]);
                $inserted++;
            }

            $this->db->commit();

            return $inserted;
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }
    }

    public function deleteById(int $id): bool 
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    public function deleteAll(): bool 
    {
        $sql = "DELETE FROM {$this->table}";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute();
    }
}