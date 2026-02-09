<?php

/**
 * Standalone Script to Insert Dummy Missed Activities
 * 
 * Usage:
 * 1. Put this file in backend/ folder
 * 2. Run: php insert_dummy_data.php
 */

require __DIR__ . '/vendor/autoload.php';

use Google\Cloud\BigQuery\BigQueryClient;
use Dotenv\Dotenv;

// Load environment
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$keyFilePath = __DIR__ . '/storage/app/google/even-gearbox-255203-10881c36321f.json';
$projectId = $_ENV['BIGQUERY_PROJECT_ID'];
$dataset = $_ENV['BIGQUERY_DATASET'];

// Initialize BigQuery
$bigQuery = new BigQueryClient([
    'projectId' => $projectId,
    'keyFilePath' => $keyFilePath,
]);

echo "Connecting to BigQuery...\n";

// Get customers
echo "Fetching customers...\n";
$customerQuery = "
    SELECT 
        id,
        customer_name,
        address,
        city,
        state
    FROM `{$projectId}.{$dataset}.master_customer`
    WHERE id IS NOT NULL
    LIMIT 20
";

$customersResult = $bigQuery->runQuery($bigQuery->query($customerQuery));
$customers = [];
foreach ($customersResult as $row) {
    $customers[] = [
        'id' => $row['id'],
        'customer_name' => $row['customer_name'],
        'address' => $row['address'] ?? '',
        'city' => $row['city'] ?? '',
        'state' => $row['state'] ?? '',
    ];
}

if (empty($customers)) {
    echo "ERROR: No customers found!\n";
    exit(1);
}

echo "Found " . count($customers) . " customers\n";

// Get sales
echo "Fetching sales...\n";
$salesQuery = "
    SELECT 
        internal_id,
        name,
        department,
        location
    FROM `{$projectId}.{$dataset}.master_sales`
    WHERE internal_id IS NOT NULL
    LIMIT 10
";

$salesResult = $bigQuery->runQuery($bigQuery->query($salesQuery));
$sales = [];
foreach ($salesResult as $row) {
    $sales[] = [
        'internal_id' => $row['internal_id'],
        'name' => $row['name'],
        'department' => $row['department'] ?? '',
        'location' => $row['location'] ?? '',
    ];
}

if (empty($sales)) {
    echo "ERROR: No sales found!\n";
    exit(1);
}

echo "Found " . count($sales) . " sales\n";

// Generate dummy data
echo "\nGenerating dummy data...\n";

$tujuanOptions = ['Visit', 'Follow Up'];
$currentYear = date('Y');
$dummyData = [];

for ($i = 0; $i < 30; $i++) {
    $customer = $customers[array_rand($customers)];
    $sale = $sales[array_rand($sales)];
    $tujuan = $tujuanOptions[array_rand($tujuanOptions)];
    
    // Random date in current year, before today
    $startDate = "{$currentYear}-01-01";
    $endDate = date('Y-m-d', strtotime('-1 day'));
    
    $randomTimestamp = strtotime($startDate) + rand(0, strtotime($endDate) - strtotime($startDate));
    $planDate = date('Y-m-d', $randomTimestamp);
    
    $dummyData[] = [
        'id' => 'DUMMY_' . uniqid() . '_' . $i,
        'plan_no' => 'PLAN-DUMMY-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
        'sales_internal_id' => $sale['internal_id'],
        'sales_name' => $sale['name'],
        'customer_id' => $customer['id'],
        'customer_name' => $customer['customer_name'],
        'customer_address' => $customer['address'],
        'plan_date' => $planDate,
        'tujuan' => $tujuan,
        'keterangan_tambahan' => 'Dummy data for testing',
        'status' => 'done',
        'city' => $customer['city'],
        'state' => $customer['state'],
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s'),
    ];
}

echo "Generated " . count($dummyData) . " records\n\n";

// Insert data
echo "Inserting data to BigQuery...\n";

$escapeString = function($value) {
    if (is_null($value) || $value === '') {
        return 'NULL';
    }
    return "'" . str_replace("'", "\\'", $value) . "'";
};

$successCount = 0;
$failCount = 0;

foreach ($dummyData as $index => $data) {
    $query = "
        INSERT INTO `{$projectId}.{$dataset}.activity_plans`
        (
            id,
            plan_no,
            sales_internal_id,
            sales_name,
            customer_id,
            customer_name,
            customer_address,
            plan_date,
            tujuan,
            keterangan_tambahan,
            status,
            city,
            state,
            created_at,
            updated_at
        )
        VALUES (
            {$escapeString($data['id'])},
            {$escapeString($data['plan_no'])},
            {$escapeString($data['sales_internal_id'])},
            {$escapeString($data['sales_name'])},
            {$escapeString($data['customer_id'])},
            {$escapeString($data['customer_name'])},
            {$escapeString($data['customer_address'])},
            '{$data['plan_date']}',
            {$escapeString($data['tujuan'])},
            {$escapeString($data['keterangan_tambahan'])},
            {$escapeString($data['status'])},
            {$escapeString($data['city'])},
            {$escapeString($data['state'])},
            DATETIME('{$data['created_at']}'),
            DATETIME('{$data['updated_at']}')
        )
    ";

    try {
        $bigQuery->runQuery($bigQuery->query($query));
        $successCount++;
        echo "[" . ($index + 1) . "/" . count($dummyData) . "] ✓ Inserted: {$data['customer_name']} - {$data['plan_date']}\n";
    } catch (\Exception $e) {
        $failCount++;
        echo "[" . ($index + 1) . "/" . count($dummyData) . "] ✗ Failed: " . $e->getMessage() . "\n";
    }
    
    // Small delay to avoid rate limit
    usleep(200000); // 0.2 second
}

echo "\n=================================\n";
echo "SUMMARY:\n";
echo "Total: " . count($dummyData) . "\n";
echo "Success: {$successCount}\n";
echo "Failed: {$failCount}\n";
echo "=================================\n";
echo "\nDone!\n";
