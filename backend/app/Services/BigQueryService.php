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
        $this->projectId = env('BIGQUERY_PROJECT_ID');
        
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
     * Login user - cari user dan verify password
     */
    public function loginUser($username, $password)
    {
        try {
            // Query user dari tree_view_auth
            $query = "SELECT * FROM `{$this->projectId}.ds_netbackup.tree_view_auth` 
                      WHERE username = '{$username}' AND is_active = true LIMIT 1";
            
            $result = $this->runQuery($query);

            if (!$result['success'] || empty($result['data'])) {
                return [
                    'success' => false,
                    'message' => 'Username atau password salah'
                ];
            }

            $user = $result['data'][0];

            // Verify password
            if (!password_verify($password, $user['password'])) {
                return [
                    'success' => false,
                    'message' => 'Username atau password salah'
                ];
            }

            // Get employee data dari master_employee
            $empQuery = "SELECT * FROM `{$this->projectId}.ds_netbackup.master_employee` 
                         WHERE internal_id = {$user['internal_id']} LIMIT 1";
            
            $empResult = $this->runQuery($empQuery);
            $employee = $empResult['success'] && !empty($empResult['data']) ? $empResult['data'][0] : null;

            return [
                'success' => true,
                'user' => [
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
            Log::error('BigQuery Login Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan sistem'
            ];
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
}