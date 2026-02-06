<?php

namespace App\Repositories;

use App\Services\BigQueryService;
use Illuminate\Support\Facades\Log;

class MissedActivityRepository
{
    protected $bigQueryService;
    protected $projectId;
    protected $dataset;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
        $this->projectId = env('BIGQUERY_PROJECT_ID');
        $this->dataset = env('BIGQUERY_DATASET');
    }

    /**
     * Get missed activities list
     * 
     * @param array $filters
     * @return array
     */
    public function getMissedActivities(array $filters = [])
    {
        $query = $this->buildMissedActivitiesQuery($filters);
        
        Log::info('BigQuery Missed Activities Query', ['query' => $query]);
        
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
            'data' => $this->transformMissedActivities($result['data'])
        ];
    }

    /**
     * Build SQL query for missed activities
     * 
     * @param array $filters
     * @return string
     */
    protected function buildMissedActivitiesQuery(array $filters)
    {
        $projectDataset = "`{$this->projectId}.{$this->dataset}`";
        
        // Base conditions
        $conditions = [
            "ap.customer_id IS NOT NULL",
            "ap.deleted_at IS NULL",
            "LOWER(ap.status) = 'missed'"
        ];

        // Filter by month and year
        if (!empty($filters['month']) && !empty($filters['year'])) {
            $month = intval($filters['month']);
            $year = intval($filters['year']);
            $conditions[] = "EXTRACT(MONTH FROM ap.plan_date) = {$month}";
            $conditions[] = "EXTRACT(YEAR FROM ap.plan_date) = {$year}";
        } elseif (!empty($filters['year'])) {
            $year = intval($filters['year']);
            $conditions[] = "EXTRACT(YEAR FROM ap.plan_date) = {$year}";
        }

        // Filter by state (from master_customer)
        if (!empty($filters['state'])) {
            $state = $this->escapeSqlString($filters['state']);
            $conditions[] = "mc.state = {$state}";
        }

        // Filter by sales_name
        if (!empty($filters['sales_name'])) {
            $salesName = $this->escapeSqlString('%' . $filters['sales_name'] . '%');
            $conditions[] = "LOWER(ms.name) LIKE LOWER({$salesName})";
        }

        $whereClause = implode(' AND ', $conditions);

        $query = "
            WITH ranked_plans AS (
                SELECT 
                    ap.id,
                    ap.customer_id,
                    ap.plan_date,
                    ap.status,
                    ap.tujuan,
                    ap.sales_internal_id,
                    ap.updated_at,
                    mc.customer_name,
                    mc.state as wilayah,
                    ms.name as sales_name,
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
                    id,
                    customer_id,
                    customer_name,
                    sales_name,
                    wilayah,
                    tujuan,
                    status,
                    plan_date
                FROM ranked_plans
                WHERE rn = 1
            )
            SELECT 
                customer_name,
                sales_name,
                wilayah,
                tujuan,
                status,
                plan_date,
                CASE WHEN LOWER(tujuan) = 'visit' THEN 1 ELSE 0 END as visit_count,
                CASE WHEN LOWER(tujuan) = 'follow up' THEN 1 ELSE 0 END as follow_up_count
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
    protected function transformMissedActivities(array $data)
    {
        $result = [];
        
        foreach ($data as $row) {
            $result[] = [
                'customer_name' => $row['customer_name'],
                'sales_name' => $row['sales_name'],
                'wilayah' => $row['wilayah'],
                'tujuan' => $row['tujuan'],
                'status' => $row['status'],
                'plan_date' => $this->formatDate($row['plan_date']),
                'visit_count' => (int) $row['visit_count'],
                'follow_up_count' => (int) $row['follow_up_count'],
            ];
        }

        return $result;
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