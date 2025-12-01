<?php

namespace App\Repositories;

use App\Services\BigQueryService;
use Illuminate\Support\Facades\Cache;

class FinancialRepository
{
    protected $bigQueryService;
    protected $tablePath = '`even-gearbox-255203.ds_netbackup.financial_gl`';

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    /**
     * Get Monthly Revenue (Credit - Debit)
     */
    public function getMonthlyRevenue($accountHeader, $startDate, $endDate, $businessUnits = null)
    {
        // Build business unit filter
        $businessUnitFilter = "";
        if (!empty($businessUnits)) {
            $businessUnitFilter = "AND " . $this->buildBusinessUnitConditionForFinancialGL($businessUnits);
        }
        
        $query = "
            SELECT
                FORMAT_DATE('%Y-%m', DATE(date)) AS period,
                FORMAT_DATE('%B %Y', DATE(date)) AS period_label,
                EXTRACT(YEAR FROM date) as year,
                EXTRACT(MONTH FROM date) as month,
                SUM(credit) AS total_credit,
                SUM(debit) AS total_debit,
                SUM(credit) - SUM(debit) AS total_difference
            FROM
                {$this->tablePath}
            WHERE
                account_header = '{$accountHeader}'
                AND DATE(date) BETWEEN '{$startDate}' AND '{$endDate}'
                {$businessUnitFilter}
            GROUP BY
                period, period_label, year, month
            ORDER BY
                year, month
        ";

        $cacheKey = "monthly_revenue_{$accountHeader}_{$startDate}_{$endDate}_" . md5(json_encode($businessUnits));
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }
    /**
     * Query 2: Invoice Sales & Quantity by Business Unit
     */
    public function getInvoiceSalesData($businessUnits, $years = null, $dateType = null, $dateParams = null)
    {
        // Build business unit condition (multi-select)
        $businessUnitCondition = $this->buildBusinessUnitCondition($businessUnits);
        
        // Build date filter
        $dateFilter = $this->buildDateFilter($years, $dateType, $dateParams);
        
        // Special handling for multi_range
        if ($dateType === 'multi_range' && !empty($dateParams)) {
            return $this->getMultiRangeComparison($businessUnits, $dateParams);
        }

        // Determine grouping based on date type
        if ($dateType === 'year') {
            $dateGrouping = "FORMAT_DATE('%Y-%m', a.date) as period";
            $selectYear = "a.year";
        } elseif ($dateType === 'compare_year') {
            $dateGrouping = "FORMAT_DATE('%m-%d', a.date) as period";
            $selectYear = "a.year";
        } else {
            $dateGrouping = "FORMAT_DATE('%Y-%m-%d', a.date) as period";
            $selectYear = "a.year";
        }
                
        $query = "
            WITH approved_invoices AS (
                SELECT
                    t1.internal_id,
                    t1.invoice_number,
                    t1.date,
                    t1.total as sales_total,
                    t1.department,
                    CASE 
                        WHEN t1.department IN ('Sales Offline', 'Sales B2B') THEN 'Gosave'
                        ELSE 'Goto'
                    END as business_unit,
                    EXTRACT(YEAR FROM t1.date) as year,
                    EXTRACT(MONTH FROM t1.date) as month
                FROM
                    `even-gearbox-255203.ds_netbackup.header_invoice` t1
                WHERE
                    t1.approval_status = 'Approved'
                    AND {$businessUnitCondition}
                    {$dateFilter}
            ),
            invoice_quantity AS (
                SELECT
                    t2.invoice_number,
                    SUM(t2.quantity) as total_quantity
                FROM
                    `even-gearbox-255203.ds_netbackup.detail_invoice` t2
                WHERE
                    t2.invoice_number IN (SELECT invoice_number FROM approved_invoices)
                GROUP BY
                    t2.invoice_number
            )
            SELECT
                {$dateGrouping},
                {$selectYear} as year,
                a.business_unit,
                a.month,
                SUM(a.sales_total) as total_sales,
                SUM(IFNULL(b.total_quantity, 0)) as total_quantity,
                COUNT(a.invoice_number) as invoice_count
            FROM
                approved_invoices a
            LEFT JOIN
                invoice_quantity b
            ON
                a.invoice_number = b.invoice_number
            GROUP BY
                period, year, a.business_unit, a.month
            ORDER BY
                year, a.month, a.business_unit
        ";
        
        $cacheKey = "invoice_sales_" . md5(json_encode($businessUnits) . json_encode($years) . $dateType . json_encode($dateParams));
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }

    /**
     * Get multi-range comparison data
     * Each range is treated as a separate group for comparison
     */
    private function getMultiRangeComparison($businessUnits, $ranges)
    {
        $businessUnitCondition = $this->buildBusinessUnitCondition($businessUnits);
        
        // Build CASE WHEN for range grouping
        $rangeCases = [];
        foreach ($ranges as $index => $range) {
            $rangeLabel = "Range " . ($index + 1) . ": " . date('d M Y', strtotime($range['start'])) . " - " . date('d M Y', strtotime($range['end']));
            $rangeCases[] = "WHEN DATE(t1.date) BETWEEN '{$range['start']}' AND '{$range['end']}' THEN '{$rangeLabel}'";
        }
        $rangeCaseStatement = implode(" ", $rangeCases);
        
        // Build date conditions for Bigseller
        $bigsellerDateConditions = [];
        foreach ($ranges as $index => $range) {
            $rangeLabel = "Range " . ($index + 1) . ": " . date('d M Y', strtotime($range['start'])) . " - " . date('d M Y', strtotime($range['end']));
            $bigsellerDateConditions[] = "WHEN DATE(waktu_pesanan_dibuat) BETWEEN '{$range['start']}' AND '{$range['end']}' THEN '{$rangeLabel}'";
        }
        $bigsellerRangeCaseStatement = implode(" ", $bigsellerDateConditions);
        
        $bigsellerDateFilter = implode(" OR ", array_map(function($r) {
            return "DATE(waktu_pesanan_dibuat) BETWEEN '{$r['start']}' AND '{$r['end']}'";
        }, $ranges));
        
        $query = "
            WITH approved_invoices AS (
                SELECT
                    t1.internal_id,
                    t1.invoice_number,
                    t1.date,
                    t1.total as sales_total,
                    t1.department,
                    CASE 
                        WHEN t1.department IN ('Sales Offline', 'Sales B2B') THEN 'Gosave'
                        ELSE 'Goto'
                    END as business_unit,
                    CASE
                        {$rangeCaseStatement}
                        ELSE NULL
                    END as range_group
                FROM
                    `even-gearbox-255203.ds_netbackup.header_invoice` t1
                WHERE
                    t1.approval_status = 'Approved'
                    AND {$businessUnitCondition}
                    AND (
                        " . implode(" OR ", array_map(function($r) {
                            return "DATE(t1.date) BETWEEN '{$r['start']}' AND '{$r['end']}'";
                        }, $ranges)) . "
                    )
            ),
            invoice_quantity AS (
                SELECT
                    t2.invoice_number,
                    SUM(t2.quantity) as total_quantity
                FROM
                    `even-gearbox-255203.ds_netbackup.detail_invoice` t2
                WHERE
                    t2.invoice_number IN (SELECT invoice_number FROM approved_invoices WHERE range_group IS NOT NULL)
                GROUP BY
                    t2.invoice_number
            ),
            -- Invoice count untuk GOSAVE (dari header_invoice)
            gosave_invoice_count AS (
                SELECT
                    CASE
                        {$rangeCaseStatement}
                        ELSE NULL
                    END as range_group,
                    COUNT(DISTINCT invoice_number) as invoice_count
                FROM
                    `even-gearbox-255203.ds_netbackup.header_invoice`
                WHERE
                    approval_status = 'Approved'
                    AND department IN ('Sales Offline', 'Sales B2B')
                    AND (
                        " . implode(" OR ", array_map(function($r) {
                            return "DATE(date) BETWEEN '{$r['start']}' AND '{$r['end']}'";
                        }, $ranges)) . "
                    )
                GROUP BY
                    range_group
            ),
            -- Invoice count untuk GOTO (dari bigseller_orders)
            goto_invoice_count AS (
                SELECT
                    CASE
                        {$bigsellerRangeCaseStatement}
                        ELSE NULL
                    END as range_group,
                    COUNT(DISTINCT nomor_pesanan) as invoice_count
                FROM (
                    SELECT nomor_pesanan, waktu_pesanan_dibuat, status_pesanan 
                    FROM `even-gearbox-255203.ds_bigseller.bigseller_orders_2025`
                    UNION ALL
                    SELECT nomor_pesanan, waktu_pesanan_dibuat, status_pesanan 
                    FROM `even-gearbox-255203.ds_bigseller.bigseller_orders_2024`
                    UNION ALL
                    SELECT nomor_pesanan, waktu_pesanan_dibuat, status_pesanan 
                    FROM `even-gearbox-255203.ds_bigseller.bigseller_orders_2023`
                )
                WHERE
                    status_pesanan = 'Selesai'
                    AND (
                        {$bigsellerDateFilter}
                    )
                GROUP BY
                    range_group
            )
            SELECT
                a.range_group as period,
                a.business_unit,
                SUM(a.sales_total) as total_sales,
                SUM(IFNULL(b.total_quantity, 0)) as total_quantity,
                -- Conditional invoice count based on business unit
                CASE 
                    WHEN a.business_unit = 'Gosave' THEN 
                        MAX(IFNULL(gc.invoice_count, 0))
                    WHEN a.business_unit = 'Goto' THEN 
                        MAX(IFNULL(gtc.invoice_count, 0))
                    ELSE 0
                END as invoice_count
            FROM
                approved_invoices a
            LEFT JOIN
                invoice_quantity b
            ON
                a.invoice_number = b.invoice_number
            LEFT JOIN
                gosave_invoice_count gc
            ON
                a.range_group = gc.range_group
                AND a.business_unit = 'Gosave'
            LEFT JOIN
                goto_invoice_count gtc
            ON
                a.range_group = gtc.range_group
                AND a.business_unit = 'Goto'
            WHERE
                a.range_group IS NOT NULL
            GROUP BY
                a.range_group, a.business_unit
            ORDER BY
                a.range_group, a.business_unit
        ";
        
        $cacheKey = "multi_range_comparison_" . md5(json_encode($businessUnits) . json_encode($ranges));
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }

    /**
     * Helper: Build date filter based on selected filters
     */
    private function buildDateFilter($years, $dateType, $dateParams)
    {
        $filters = [];
        
        // Filter by years (monthly aggregation)
        if (!empty($years) && $dateType === 'year') {
            $yearList = implode(',', $years);
            $filters[] = "EXTRACT(YEAR FROM t1.date) IN ({$yearList})";
        }
        
        // Filter for compare by year
        if ($dateType === 'compare_year' && !empty($dateParams)) {
            $dateConditions = [];
            foreach ($dateParams['dates'] as $date) {
                $dateObj = \DateTime::createFromFormat('m-d', $date);
                $month = $dateObj->format('m');
                $day = $dateObj->format('d');
                $dateConditions[] = "(EXTRACT(MONTH FROM t1.date) = {$month} AND EXTRACT(DAY FROM t1.date) = {$day})";
            }
            $filters[] = "(" . implode(" OR ", $dateConditions) . ")";
            
            // Filter years
            if (!empty($dateParams['years'])) {
                $yearList = implode(',', $dateParams['years']);
                $filters[] = "EXTRACT(YEAR FROM t1.date) IN ({$yearList})";
            }
        }
        // Filter by date range
        if ($dateType === 'range' && !empty($dateParams)) {
            $startDate = $dateParams['start'];
            $endDate = $dateParams['end'];
            $filters[] = "DATE(t1.date) BETWEEN '{$startDate}' AND '{$endDate}'";
        }
        
        // Filter by specific dates
        if ($dateType === 'specific' && !empty($dateParams)) {
            $dateList = "'" . implode("','", $dateParams) . "'";
            $filters[] = "DATE(t1.date) IN ({$dateList})";
        }

        if ($dateType === 'multi_range' && !empty($dateParams)) {
            $rangeConditions = [];
            foreach ($dateParams as $range) {
                if (!empty($range['start']) && !empty($range['end'])) {
                    $rangeConditions[] = "(DATE(t1.date) BETWEEN '{$range['start']}' AND '{$range['end']}')";
                }
            }
            if (!empty($rangeConditions)) {
                $filters[] = "(" . implode(" OR ", $rangeConditions) . ")";
            }
        }
        
        if (empty($filters)) {
            return "";
        }
        
        return "AND " . implode(" AND ", $filters);
    }

    private function buildBusinessUnitCondition($businessUnits)
    {
        if (empty($businessUnits)) {
            return "1=1"; // No filter
        }
        
        $conditions = [];
        foreach ($businessUnits as $unit) {
            if ($unit === 'Gosave') {
                $conditions[] = "t1.department IN ('Sales Offline', 'Sales B2B')";
            } elseif ($unit === 'Goto') {
                $conditions[] = "t1.department NOT IN ('Sales Offline', 'Sales B2B')";
            }
        }
        
        if (empty($conditions)) {
            return "1=1";
        }
        
        return "(" . implode(" OR ", $conditions) . ")";
    }

    /**
    * Build business unit condition for financial_gl table (uses department_name)
    */
    private function buildBusinessUnitConditionForFinancialGL($businessUnits)
    {
        if (empty($businessUnits)) {
            return "1=1";
        }
        
        $conditions = [];
        foreach ($businessUnits as $unit) {
            if ($unit === 'Gosave') {
                $conditions[] = "department_name IN ('Sales Offline', 'Sales B2B')";
            } elseif ($unit === 'Goto') {
                $conditions[] = "department_name NOT IN ('Sales Offline', 'Sales B2B')";
            }
        }
        
        if (empty($conditions)) {
            return "1=1";
        }
        
        return "(" . implode(" OR ", $conditions) . ")";
    }

    /**
     * Get last update info from all tables
     */
    public function getLastUpdateInfo()
    {
        $query = "
            SELECT 'Revenue' AS source_table, MAX(date) AS last_date
            FROM `even-gearbox-255203.ds_netbackup.financial_gl`
            WHERE date IS NOT NULL

            UNION ALL

            SELECT 'Revenue Invoice' AS source_table, MAX(date) AS last_date
            FROM `even-gearbox-255203.ds_netbackup.header_invoice`
            WHERE date IS NOT NULL;
        ";

        $cacheKey = "last_update_info";
        
        return Cache::remember($cacheKey, 3600, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }
}