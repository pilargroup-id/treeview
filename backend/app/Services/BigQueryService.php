<?php

namespace App\Services;

use Google\Cloud\BigQuery\BigQueryClient;
use Google\Cloud\BigQuery\Numeric;
use Illuminate\Support\Facades\Log;

class BigQueryService
{
    public $bigQuery;
    protected $projectId;

    public function __construct()
    {
        $keyFilePath = storage_path('app/google/even-gearbox-255203-10881c36321f.json');
        $this->projectId = config('bigquery.project_id');
        
        $this->bigQuery = new BigQueryClient([
            'projectId' => $this->projectId,
            'keyFilePath' => $keyFilePath,
        ]);
    }

    public function runQuery($query)
    {
        try {
            $jobConfig = $this->bigQuery->query($query);
            $queryResults = $this->bigQuery->runQuery($jobConfig);

            $rows = [];
            foreach ($queryResults as $row) {
                $rows[] = $this->convertRow($row);
            }

            return [
                'success' => true,
                'data' => $rows,
                'count' => count($rows)
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    protected function convertRow($row)
    {
        $converted = [];
        foreach ($row as $key => $value) {
            if ($value instanceof Numeric) {
                $converted[$key] = (float) $value->get();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Date) {
                // Convert Date object to string (Y-m-d format)
                $converted[$key] = $value->formatAsString();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Timestamp) {
                // Convert Timestamp to datetime string
                $converted[$key] = $value->get()->format('Y-m-d H:i:s');
            } elseif (is_null($value)) {
                $converted[$key] = 0;
            } else {
                $converted[$key] = $value;
            }
        }
        return $converted;
    }

    /**
     * Generate username dari full_name
     * Format: lowercase, spasi diganti dengan dot
     * Contoh: "Budi Santoso" -> "budi.santoso"
     */
    public function generateUsername($fullName)
    {
        $username = strtolower(str_replace(' ', '.', $fullName));
        
        // Check if username already exists
        $query = "SELECT COUNT(*) as count FROM `{$this->projectId}.ds_netbackup.tree_view_auth` 
                  WHERE username = '{$username}'";
        
        $result = $this->runQuery($query);
        
        if ($result['success'] && $result['data'][0]['count'] > 0) {
            $count = $result['data'][0]['count'];
            $username = $username . '.' . ($count + 1);
        }

        return $username;
    }

    /**
     * Login user - dengan validasi department/job_level
     */
    public function loginUser($username, $password)
    {
        try {
            $query = "SELECT * FROM `{$this->projectId}.ds_netbackup.tree_view_auth` 
                    WHERE username = '{$username}' AND is_active = true LIMIT 1";
            
            $result = $this->runQuery($query);

            if (!$result['success'] || empty($result['data'])) {
                return ['success' => false, 'message' => 'Username atau password salah'];
            }

            $user = $result['data'][0];

            if (!password_verify($password, $user['password'])) {
                return ['success' => false, 'message' => 'Username atau password salah'];
            }

            // Get employee data
            $empQuery = "SELECT * FROM `{$this->projectId}.ds_netbackup.master_employee` 
                        WHERE internal_id = {$user['internal_id']} LIMIT 1";
            
            $empResult = $this->runQuery($empQuery);
            $employee = $empResult['success'] && !empty($empResult['data']) ? $empResult['data'][0] : null;

            $department = $employee['department'] ?? null;
            $jobLevel = $employee['job_level'] ?? null;

            // Validasi hak akses login
            $allowedDepartments = ['Board Of Director', 'IT', 'Gosave GT'];
            $allowedJobLevels = ['Manager'];

            $isAllowed = in_array($department, $allowedDepartments) || in_array($jobLevel, $allowedJobLevels);

            if (!$isAllowed) {
                return [
                    'success' => false,
                    'message' => 'Akun Anda tidak memiliki akses ke aplikasi ini'
                ];
            }

            return [
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'email' => $employee['email'] ?? null,
                    'internal_id' => $user['internal_id'],
                    'job_level' => $jobLevel,
                    'job_position' => $employee['job_position'] ?? null,
                    'department' => $department,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Login Error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Terjadi kesalahan sistem'];
        }
    }

public function saveToken($userId, $token)
{
    try {
        $expiredAt = now()->addMonth();
        
        $oldToken = cache()->get("user_token_{$userId}");
        if ($oldToken) {
            cache()->forget("auth_token_{$oldToken}");
        }

        cache()->put("auth_token_{$token}", $userId, $expiredAt);
        cache()->put("user_token_{$userId}", $token, $expiredAt);

        $this->updateLastLogin($userId);

        return ['success' => true];

    } catch (\Exception $e) {
        Log::error('Save Token Error: ' . $e->getMessage());
        return ['success' => false];
    }
}

public function validateToken($token)
{
    try {
        $userId = cache()->get("auth_token_{$token}");

        if (!$userId) {
            return ['success' => false, 'message' => 'Token invalid atau expired'];
        }

        return ['success' => true, 'user_id' => $userId];

    } catch (\Exception $e) {
        Log::error('Validate Token Error: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Terjadi kesalahan sistem'];
    }
}

public function deleteToken($userId)
{
    try {
        $token = cache()->get("user_token_{$userId}");
        if ($token) {
            cache()->forget("auth_token_{$token}");
            cache()->forget("user_token_{$userId}");
        }

        return ['success' => true];

    } catch (\Exception $e) {
        Log::error('Delete Token Error: ' . $e->getMessage());
        return ['success' => false];
    }
}

    /**
     * Get user with permissions by ID
     */
    public function getUserWithPermissions($userId)
    {
        try {
            // Query user
            $query = "SELECT * FROM `{$this->projectId}.ds_netbackup.tree_view_auth` 
                      WHERE id = '{$userId}' AND is_active = true LIMIT 1";
            
            $result = $this->runQuery($query);

            if (!$result['success'] || empty($result['data'])) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }

            $user = $result['data'][0];

            // Get employee data
            $empQuery = "SELECT * FROM `{$this->projectId}.ds_netbackup.master_employee` 
                         WHERE internal_id = {$user['internal_id']} LIMIT 1";
            
            $empResult = $this->runQuery($empQuery);
            $employee = $empResult['success'] && !empty($empResult['data']) ? $empResult['data'][0] : null;

            return [
                'success' => true,
                'data' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'],
                    'email' => $employee['email'] ?? null,
                    'internal_id' => $user['internal_id'],
                    'job_level' => $employee['job_level'] ?? null,
                    'job_position' => $employee['job_position'] ?? null,
                    'department' => $employee['department'] ?? null,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Get User Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan sistem'
            ];
        }
    }

    /**
     * Get user permissions
     */
    public function getUserPermissions($userId)
    {
        try {
            // Query user
            $query = "SELECT internal_id FROM `{$this->projectId}.ds_netbackup.tree_view_auth` 
                      WHERE id = '{$userId}' AND is_active = true LIMIT 1";
            
            $result = $this->runQuery($query);

            if (!$result['success'] || empty($result['data'])) {
                return [
                    'success' => false,
                    'message' => 'User not found'
                ];
            }

            $user = $result['data'][0];

            // Get employee data
            $empQuery = "SELECT job_level, job_position, department FROM `{$this->projectId}.ds_netbackup.master_employee` 
                         WHERE internal_id = {$user['internal_id']} LIMIT 1";
            
            $empResult = $this->runQuery($empQuery);
            $employee = $empResult['success'] && !empty($empResult['data']) ? $empResult['data'][0] : null;

            return [
                'success' => true,
                'data' => [
                    'job_level' => $employee['job_level'] ?? null,
                    'job_position' => $employee['job_position'] ?? null,
                    'department' => $employee['department'] ?? null,
                ]
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Get Permissions Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan sistem'
            ];
        }
    }

    /**
     * Update last_login
     */
    public function updateLastLogin($userId)
    {
        try {
            $now = now()->format('Y-m-d H:i:s');
            
            $query = "UPDATE `{$this->projectId}.ds_netbackup.tree_view_auth` 
                      SET last_login = TIMESTAMP('{$now}') 
                      WHERE id = '{$userId}'";
            
            $jobConfig = $this->bigQuery->query($query);
            $this->bigQuery->runQuery($jobConfig);

            return [
                'success' => true,
                'message' => 'Last login updated'
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Update Last Login Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to update last login'
            ];
        }
    }

    public function updateUsername($userId, $newUsername)
    {
        try {
            $dataset = config('bigquery.dataset');
            $project = config('bigquery.project_id');
            $now = now()->toDateTimeString();
            $table = "`{$project}.{$dataset}.tree_view_auth`";

            // Cek username sudah dipakai
            $checkQuery = "SELECT id FROM {$table} WHERE username = '{$newUsername}' AND id <> '{$userId}' LIMIT 1";
            $existing = $this->runQuery($checkQuery);
            if (!empty($existing['data'])) {
                return ['success' => false, 'message' => 'Username sudah digunakan'];
            }

            $updateQuery = "UPDATE {$table} SET username = '{$newUsername}', updated_at = '{$now}' WHERE id = '{$userId}'";
            $jobConfig = $this->bigQuery->query($updateQuery);
            $this->bigQuery->runQuery($jobConfig);

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('BigQuery Update Username Error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function updatePassword($userId, $newHashedPassword)
    {
        try {
            $dataset = config('bigquery.dataset');
            $project = config('bigquery.project_id');
            $now = now()->toDateTimeString();
            $table = "`{$project}.{$dataset}.tree_view_auth`";

            $updateQuery = "UPDATE {$table} SET password = '{$newHashedPassword}', updated_at = '{$now}' WHERE id = '{$userId}'";
            $jobConfig = $this->bigQuery->query($updateQuery);
            $this->bigQuery->runQuery($jobConfig);

            return ['success' => true];
        } catch (\Exception $e) {
            Log::error('BigQuery Update Password Error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function getUserById($userId)
    {
        try {
            $dataset = config('bigquery.dataset');
            $project = config('bigquery.project_id');

            $query = "
                SELECT id, username, password, is_active
                FROM `{$project}.{$dataset}.tree_view_auth`
                WHERE id = '{$userId}'
                LIMIT 1
            ";

            $result = $this->runQuery($query);
            if (!$result['success'] || empty($result['data'])) {
                return ['success' => false, 'message' => 'User not found'];
            }

            return ['success' => true, 'user' => $result['data'][0]];
        } catch (\Exception $e) {
            Log::error('BigQuery Get User Error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}