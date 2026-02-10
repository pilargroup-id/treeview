<?php

namespace App\Repositories;

use App\Services\BigQueryService;
use Illuminate\Support\Facades\Log;

class ActivityPlanRepository
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
     * Get weekly summary of activity plans grouped by customer
     * 
     * @param array $filters
     * @return array
     */
    public function getWeeklySummary(array $filters = [])
    {
        $query = $this->buildWeeklySummaryQuery($filters);
        
        Log::info('BigQuery Weekly Summary Query', ['query' => $query]);
        
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
            'data' => $this->transformWeeklySummary($result['data'], $filters)
        ];
    }

    /**
     * Build SQL query for weekly summary
     * 
     * @param array $filters
     * @return string
     */
    protected function buildWeeklySummaryQuery(array $filters)
    {
        $projectDataset = "`{$this->projectId}.{$this->dataset}`";
        
        // Base conditions
        $conditions = [
            "ap.customer_id IS NOT NULL",
            "ap.deleted_at IS NULL"
        ];

        // Filter by months and year
        if (!empty($filters['months']) && !empty($filters['year'])) {
            $months = array_map('intval', $filters['months']);
            $monthsList = implode(',', $months);
            $year = intval($filters['year']);
            $conditions[] = "EXTRACT(MONTH FROM ap.plan_date) IN ({$monthsList})";
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

        // Filter by status
        if (!empty($filters['status'])) {
            $status = $this->escapeSqlString($filters['status']);
            $conditions[] = "LOWER(ap.status) = LOWER({$status})";
        } else {
            // Default: only done and missed
            $conditions[] = "LOWER(ap.status) IN ('done', 'missed')";
        }

        // Filter by tujuan
        if (!empty($filters['tujuan'])) {
            $tujuan = $this->escapeSqlString($filters['tujuan']);
            $conditions[] = "ap.tujuan = {$tujuan}";
        } else {
            // Default: only Visit and Follow Up
            $conditions[] = "ap.tujuan IN ('Visit', 'Follow Up')";
        }

        // Filter by customer_name (search)
        if (!empty($filters['customer_name'])) {
            $customerName = $this->escapeSqlString('%' . $filters['customer_name'] . '%');
            $conditions[] = "LOWER(mc.customer_name) LIKE LOWER({$customerName})";
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
                    ap.updated_at,
                    mc.customer_name,
                    mc.state as wilayah,
                    ms.name as sales_name,
                    EXTRACT(YEAR FROM ap.plan_date) as year,
                    EXTRACT(MONTH FROM ap.plan_date) as month,
                    EXTRACT(DAY FROM ap.plan_date) as day,
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
                    id, customer_id, plan_date, status, tujuan, 
                    customer_name, sales_name, wilayah, year, month, day
                FROM ranked_plans
                WHERE rn = 1
            ),
            week_calculation AS (
                SELECT 
                    *,
                    -- Calculate week number within month (excluding Sunday)
                    CASE 
                        WHEN EXTRACT(DAYOFWEEK FROM plan_date) = 1 THEN NULL -- Sunday = 1, exclude
                        ELSE FLOOR((day - 1 - 
                            -- Count Sundays before this day
                            (SELECT COUNT(*) 
                             FROM UNNEST(GENERATE_DATE_ARRAY(
                                 DATE_TRUNC(plan_date, MONTH), 
                                 plan_date, 
                                 INTERVAL 1 DAY
                             )) AS d 
                             WHERE EXTRACT(DAYOFWEEK FROM d) = 1 AND d < plan_date)
                        ) / 6) + 1
                    END as week_number
                FROM filtered_plans
            )
            SELECT 
                customer_id,
                customer_name,
                sales_name,
                wilayah,
                year,
                month,
                week_number,
                COUNT(*) as activity_count
            FROM week_calculation
            WHERE week_number IS NOT NULL -- Exclude Sundays
            GROUP BY customer_id, customer_name, sales_name, wilayah, year, month, week_number
            ORDER BY wilayah, sales_name, customer_name, year, month, week_number
        ";

        return $query;
    }

    /**
     * Transform query results into grouped format
     * 
     * @param array $data
     * @param array $filters
     * @return array
     */
    protected function transformWeeklySummary(array $data, array $filters)
    {
        $grouped = [];
        
        // Get all unique months from data
        $allMonths = [];
        foreach ($data as $row) {
            $monthKey = $row['year'] . '-' . str_pad($row['month'], 2, '0', STR_PAD_LEFT);
            if (!in_array($monthKey, $allMonths)) {
                $allMonths[] = $monthKey;
            }
        }
        sort($allMonths);

        // Group by customer
        foreach ($data as $row) {
            $customerId = $row['customer_id'];
            $salesName = $row['sales_name'] ?? null;
            $customerKey = $customerId . '|' . ($salesName ?? '');
            
            if (!isset($grouped[$customerKey])) {
                $grouped[$customerKey] = [
                    'wilayah' => $row['wilayah'],
                    'sales_name' => $row['sales_name'] ?? null,
                    'customer' => $row['customer_name'],
                    'months' => []
                ];
            }

            $monthKey = $row['year'] . '-' . str_pad($row['month'], 2, '0', STR_PAD_LEFT);
            $monthName = date('F', mktime(0, 0, 0, $row['month'], 1));
            
            if (!isset($grouped[$customerKey]['months'][$monthKey])) {
                $grouped[$customerKey]['months'][$monthKey] = [
                    'month_name' => $monthName,
                    'year' => $row['year'],
                    'weeks' => []
                ];
            }

            $weekKey = 'week' . $row['week_number'];
            $grouped[$customerKey]['months'][$monthKey]['weeks'][$weekKey] = $row['activity_count'];
        }

        // Convert to indexed array and ensure all weeks exist
        $result = [];
        foreach ($grouped as $customerData) {
            $months = [];
            
            foreach ($allMonths as $monthKey) {
                if (isset($customerData['months'][$monthKey])) {
                    $monthData = $customerData['months'][$monthKey];
                    
                    // Ensure all weeks (1-5) exist, set null if not present
                    $weeks = [
                        'week1' => $monthData['weeks']['week1'] ?? null,
                        'week2' => $monthData['weeks']['week2'] ?? null,
                        'week3' => $monthData['weeks']['week3'] ?? null,
                        'week4' => $monthData['weeks']['week4'] ?? null,
                        'week5' => $monthData['weeks']['week5'] ?? null,
                        'week6' => $monthData['weeks']['week6'] ?? null,
                    ];
                    
                    $months[] = array_merge(
                        [
                            'month_name' => $monthData['month_name'],
                            'year' => $monthData['year']
                        ],
                        $weeks
                    );
                } else {
                    // Month not in data, create empty structure
                    list($year, $month) = explode('-', $monthKey);
                    $months[] = [
                        'month_name' => date('F', mktime(0, 0, 0, intval($month), 1)),
                        'year' => intval($year),
                        'week1' => null,
                        'week2' => null,
                        'week3' => null,
                        'week4' => null,
                        'week5' => null,
                        'week6' => null,
                    ];
                }
            }
            
            $result[] = [
                'wilayah' => $customerData['wilayah'],
                'sales_name' => $customerData['sales_name'],
                'customer' => $customerData['customer'],
                'months' => $months
            ];
        }

        return $result;
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
