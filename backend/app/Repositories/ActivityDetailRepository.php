<?php

namespace App\Repositories;

use App\Services\BigQueryService;
use Illuminate\Support\Facades\Log;

class ActivityDetailRepository
{
    protected $bigQueryService;
    protected $projectId;
    protected $dataset;
    protected $basePhotoUrl = 'https://touchpoint.pilargroup.id';

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
        $this->projectId = env('BIGQUERY_PROJECT_ID');
        $this->dataset = env('BIGQUERY_DATASET');
    }

    /**
     * Get activity details list
     * 
     * @param array $filters
     * @return array
     */
    public function getActivityDetails(array $filters = [])
    {
        $query = $this->buildActivityDetailsQuery($filters);
        
        Log::info('BigQuery Activity Details Query', ['query' => $query]);
        
        $result = $this->bigQueryService->runQuery($query);
        
        if (!$result['success']) {
            return [
                'success' => false,
                'error' => $result['error'],
                'data' => []
            ];
        }

        return [
            'success' => true,
            'data' => $this->transformActivityDetails($result['data'])
        ];
    }

    /**
     * Build SQL query for activity details
     * 
     * @param array $filters
     * @return string
     */
    protected function buildActivityDetailsQuery(array $filters)
    {
        $projectDataset = "`{$this->projectId}.{$this->dataset}`";
        
        // Base conditions
        $conditions = [
            "ap.deleted_at IS NULL"
        ];

        // Filter by date range (max 1 month)
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $startDate = $this->escapeSqlString($filters['start_date']);
            $endDate = $this->escapeSqlString($filters['end_date']);
            $conditions[] = "ap.plan_date BETWEEN {$startDate} AND {$endDate}";
        }

        // Filter by state (from master_customer; fallback to activity_plans.state for CheckIn rows)
        if (!empty($filters['state'])) {
            $state = $this->escapeSqlString($filters['state']);
            $conditions[] = "COALESCE(NULLIF(TRIM(CAST(mc.state AS STRING)), ''), NULLIF(TRIM(CAST(ap.state AS STRING)), '')) = {$state}";
        }

        // Filter by sales_name
        if (!empty($filters['sales_name'])) {
            $salesName = $this->escapeSqlString('%' . $filters['sales_name'] . '%');
            $conditions[] = "LOWER(ms.name) LIKE LOWER({$salesName})";
        }

        // Filter by customer_name
        if (!empty($filters['customer_name'])) {
            $customerName = $this->escapeSqlString('%' . $filters['customer_name'] . '%');
            $conditions[] = "
                LOWER(
                    CASE
                        WHEN NULLIF(TRIM(CAST(ap.customer_id AS STRING)), '') IS NULL
                          OR TRIM(CAST(ap.customer_id AS STRING)) = '0' THEN 'checkin'
                        ELSE COALESCE(mc.customer_name, '')
                    END
                ) LIKE LOWER({$customerName})
            ";
        }

        $whereClause = implode(' AND ', $conditions);

        $query = "
            WITH ranked_plans AS (
                SELECT 
                    ap.id,
                    ap.plan_no,
                    ap.customer_id,
                    ap.plan_date,
                    ap.result,
                    ap.result_location_lat,
                    ap.result_location_lng,
                    ap.result_location_accuracy,
                    ap.user_photo,
                    ap.sales_internal_id,
                    ap.updated_at,
                    CASE
                        WHEN NULLIF(TRIM(CAST(ap.customer_id AS STRING)), '') IS NULL
                          OR TRIM(CAST(ap.customer_id AS STRING)) = '0' THEN 'CheckIn'
                        ELSE COALESCE(mc.customer_name, 'Unknown Customer')
                    END as customer_name,
                    CASE
                        WHEN NULLIF(TRIM(CAST(ap.customer_id AS STRING)), '') IS NULL
                          OR TRIM(CAST(ap.customer_id AS STRING)) = '0'
                          THEN COALESCE(NULLIF(TRIM(CAST(ap.state AS STRING)), ''), 'CHECKIN')
                        ELSE COALESCE(NULLIF(TRIM(CAST(mc.state AS STRING)), ''), '-')
                    END as wilayah,
                    COALESCE(ms.name, '-') as sales_name,
                    ROW_NUMBER() OVER (PARTITION BY ap.id ORDER BY ap.updated_at DESC) as rn
                FROM {$projectDataset}.activity_plans ap
                LEFT JOIN {$projectDataset}.master_customer mc 
                    ON ap.customer_id = mc.id
                LEFT JOIN {$projectDataset}.master_sales ms 
                    ON ap.sales_internal_id = ms.internal_id
                WHERE {$whereClause}
            ),
            filtered_plans AS (
                SELECT 
                    sales_name,
                    wilayah,
                    customer_name,
                    plan_no,
                    plan_date,
                    result_location_lat,
                    result_location_lng,
                    result_location_accuracy,
                    result,
                    user_photo
                FROM ranked_plans
                WHERE rn = 1
            )
            SELECT 
                sales_name,
                wilayah,
                customer_name,
                plan_no,
                plan_date,
                result_location_lat,
                result_location_lng,
                result_location_accuracy,
                result,
                user_photo
            FROM filtered_plans
            ORDER BY plan_date DESC, customer_name ASC
        ";

        return $query;
    }

    /**
     * Transform query results
     * 
     * @param array $data
     * @return array
     */
    protected function transformActivityDetails(array $data)
    {
        $result = [];
        
        foreach ($data as $row) {
            $result[] = [
                'sales_name' => $row['sales_name'],
                'wilayah' => $row['wilayah'],
                'customer_name' => $row['customer_name'],
                'plan_no' => $row['plan_no'] ?? null,
                'plan_date' => $this->formatDate($row['plan_date']),
                'result_location_lat' => $row['result_location_lat'] ?? null,
                'result_location_lng' => $row['result_location_lng'] ?? null,
                'result_location_accuracy' => $row['result_location_accuracy'],
                'result' => $row['result'],
                'user_photo' => $this->buildPhotoUrl($row['user_photo']),
            ];
        }

        return $result;
    }

    /**
     * Build full photo URL
     * 
     * @param string|null $photoPath
     * @return string|null
     */
    protected function buildPhotoUrl($photoPath)
    {
        if (empty($photoPath)) {
            return null;
        }

        // If already starts with http, return as is
        if (strpos($photoPath, 'http') === 0) {
            return $photoPath;
        }

        // Remove leading slash if exists
        $photoPath = ltrim($photoPath, '/');

        return $this->basePhotoUrl . '/' . $photoPath;
    }

    /**
     * Format date to Indonesian format
     * 
     * @param string $date
     * @return string
     */
    protected function formatDate($date)
    {
        try {
            // Array hari dalam bahasa Indonesia
            $days = [
                'Sunday' => 'Minggu',
                'Monday' => 'Senin',
                'Tuesday' => 'Selasa',
                'Wednesday' => 'Rabu',
                'Thursday' => 'Kamis',
                'Friday' => 'Jumat',
                'Saturday' => 'Sabtu'
            ];

            // Array bulan dalam bahasa Indonesia (singkat)
            $months = [
                '01' => 'Jan', '02' => 'Feb', '03' => 'Mar', '04' => 'Apr',
                '05' => 'Mei', '06' => 'Jun', '07' => 'Jul', '08' => 'Agu',
                '09' => 'Sep', '10' => 'Okt', '11' => 'Nov', '12' => 'Des'
            ];

            // Parse date
            $timestamp = strtotime($date);
            
            // Get day name in English
            $dayNameEn = date('l', $timestamp);
            $dayNameId = $days[$dayNameEn];
            
            // Get day number
            $day = date('d', $timestamp);
            
            // Get month
            $monthNum = date('m', $timestamp);
            $monthName = $months[$monthNum];
            
            // Get year
            $year = date('Y', $timestamp);
            
            // Format: "Jumat, 06 Feb 2026"
            return "{$dayNameId}, {$day} {$monthName} {$year}";
            
        } catch (\Exception $e) {
            // Fallback to original format if error
            return $date;
        }
    }

    /**
     * Escape string for SQL query
     * 
     * @param string $value
     * @return string
     */
    protected function escapeSqlString($value)
    {
        return "'" . str_replace("'", "\\'", $value) . "'";
    }
}
