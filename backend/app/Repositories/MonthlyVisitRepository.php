<?php

namespace App\Repositories;

use App\Services\BigQueryService;
use Illuminate\Support\Facades\Log;

class MonthlyVisitRepository
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
     * Get monthly visit summary
     * 
     * @param array $filters
     * @return array
     */
    public function getMonthlyVisitSummary(array $filters = [])
    {
        $query = $this->buildMonthlyVisitQuery($filters);
        
        Log::info('BigQuery Monthly Visit Summary Query', ['query' => $query]);
        
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
            'data' => $this->transformMonthlyVisitData($result['data'])
        ];
    }

    /**
     * Build SQL query for monthly visit summary
     * 
     * @param array $filters
     * @return string
     */
    protected function buildMonthlyVisitQuery(array $filters)
    {
        $projectDataset = "`{$this->projectId}.{$this->dataset}`";
        
        // Base conditions
        $conditions = [
            "ap.customer_id IS NOT NULL",
            "ap.deleted_at IS NULL"
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
                    EXTRACT(YEAR FROM ap.plan_date) as year,
                    EXTRACT(MONTH FROM ap.plan_date) as month,
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
                    customer_id,
                    customer_name,
                    sales_name,
                    wilayah,
                    tujuan,
                    status,
                    year,
                    month
                FROM ranked_plans
                WHERE rn = 1
            )
            SELECT 
                customer_name,
                sales_name,
                wilayah,
                year,
                month,
                SUM(CASE WHEN LOWER(status) = 'done' AND LOWER(tujuan) = 'visit' THEN 1 ELSE 0 END) as done_visit_count,
                SUM(CASE WHEN LOWER(status) = 'done' AND LOWER(tujuan) = 'follow up' THEN 1 ELSE 0 END) as done_follow_up_count,
                SUM(CASE WHEN LOWER(status) = 'missed' THEN 1 ELSE 0 END) as missed_count
            FROM filtered_plans
            GROUP BY customer_name, sales_name, wilayah, year, month
            ORDER BY customer_name ASC, year DESC, month DESC
        ";

        return $query;
    }

    /**
     * Transform query results
     * 
     * @param array $data
     * @return array
     */
    protected function transformMonthlyVisitData(array $data)
    {
        $result = [];
        
        foreach ($data as $row) {
            // Format month name
            $monthName = date('F', mktime(0, 0, 0, $row['month'], 1));
            
            $result[] = [
                'customer_name' => $row['customer_name'],
                'sales_name' => $row['sales_name'],
                'wilayah' => $row['wilayah'],
                'year' => (int) $row['year'],
                'month' => (int) $row['month'],
                'month_name' => $monthName,
                'done_visit_count' => (int) $row['done_visit_count'],
                'done_follow_up_count' => (int) $row['done_follow_up_count'],
                'missed_count' => (int) $row['missed_count'],
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