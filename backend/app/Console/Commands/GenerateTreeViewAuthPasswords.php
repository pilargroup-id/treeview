<?php

namespace App\Console\Commands;

use App\Services\BigQueryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class GenerateTreeViewAuthPasswords extends Command
{
    protected $signature = 'tree-view:generate-passwords {password=password123}';
    protected $description = 'Generate bcrypt passwords for tree_view_auth and update in BigQuery';

    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        parent::__construct();
        $this->bigQueryService = $bigQueryService;
    }

    public function handle()
    {
        $password = $this->argument('password');
        $projectId = env('BIGQUERY_PROJECT_ID');

        $this->info('Fetching all users from tree_view_auth...');

        // Get semua user
        $query = "SELECT id, username FROM `{$projectId}.ds_netbackup.tree_view_auth`";
        $result = $this->bigQueryService->runQuery($query);

        if (!$result['success'] || empty($result['data'])) {
            $this->error('No users found!');
            return 1;
        }

        $users = $result['data'];
        $this->info("Found " . count($users) . " users. Generating bcrypt passwords...");

        // Generate bcrypt hash
        $hashedPassword = Hash::make($password);

        // Update all passwords
        $updateQuery = "UPDATE `{$projectId}.ds_netbackup.tree_view_auth` 
                        SET password = '{$hashedPassword}', 
                            updated_at = CURRENT_DATETIME() 
                        WHERE is_active = true";

        try {
            $jobConfig = $this->bigQueryService->bigQuery->query($updateQuery);
            $this->bigQueryService->bigQuery->runQuery($jobConfig);

            $this->info('✓ Successfully updated all passwords to bcrypt!');
            $this->info('Bcrypt Hash: ' . $hashedPassword);
            $this->info('Password: ' . $password);

            return 0;
        } catch (\Exception $e) {
            $this->error('Error updating passwords: ' . $e->getMessage());
            return 1;
        }
    }
}
