<?php

//backend/app/Repositories/FinancialRepository.php

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
                COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) AS total_difference
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
     * Query 2: Invoice Sales & Quantity by Business Unit (Revenue from GL)
     */
    public function getInvoiceSalesData($businessUnits, $years = null, $dateType = null, $dateParams = null)
    {
        // Build business unit condition for GL
        $businessUnitCondition = $this->buildBusinessUnitConditionForFinancialGL($businessUnits);
        
        // Build date filter for GL
        $dateFilter = $this->buildDateFilterForGL($years, $dateType, $dateParams);
        
        // Special handling for multi_range
        if ($dateType === 'multi_range' && !empty($dateParams)) {
            return $this->getMultiRangeComparison($businessUnits, $dateParams);
        }

        // Determine grouping based on date type
        if ($dateType === 'year') {
            $dateGrouping = "FORMAT_DATE('%Y-%m', DATE(date))";
            $selectYear = "EXTRACT(YEAR FROM date)";
            $selectMonth = "EXTRACT(MONTH FROM date)";
            $gosaveGrouping = "FORMAT_DATE('%Y-%m', DATE(date))";
            $bigsellerGrouping = "FORMAT_DATE('%Y-%m', DATE(waktu_pesanan_dibuat))";
        } elseif ($dateType === 'compare_year') {
            $dateGrouping = "FORMAT_DATE('%m-%d', DATE(date))";
            $selectYear = "EXTRACT(YEAR FROM date)";
            $selectMonth = "EXTRACT(MONTH FROM date)";
            $gosaveGrouping = "FORMAT_DATE('%m-%d', DATE(date))";
            $bigsellerGrouping = "FORMAT_DATE('%m-%d', DATE(waktu_pesanan_dibuat))";
        } else {
            $dateGrouping = "FORMAT_DATE('%Y-%m-%d', DATE(date))";
            $selectYear = "EXTRACT(YEAR FROM date)";
            $selectMonth = "EXTRACT(MONTH FROM date)";
            $gosaveGrouping = "FORMAT_DATE('%Y-%m-%d', DATE(date))";
            $bigsellerGrouping = "FORMAT_DATE('%Y-%m-%d', DATE(waktu_pesanan_dibuat))";
        }

        // Build Bigseller date filter
        $bigsellerDateFilter = $this->buildBigsellerDateFilter($years, $dateType, $dateParams);
        // Build Gosave date filter
        $gosaveDateFilter = $this->buildGosaveDateFilter($years, $dateType, $dateParams);

        $query = "
            WITH gl_revenue AS (
                SELECT
                    {$dateGrouping} as period,
                    {$selectYear} as year,
                    {$selectMonth} as month,
                    CASE 
                        WHEN department_name IN ('Sales Offline', 'Sales B2B') THEN 'Gosave'
                        ELSE 'Goto'
                    END as business_unit,
                    SUM(debit) * -1 + SUM(credit) as total_sales
                FROM
                    {$this->tablePath}
                WHERE
                    account_header IN ('4000.00.00', '4000.01.00', '4000.08.00', '4000.01.10', '4000.01.11', '4000.01.12', '4000.01.13', '4000.02.00', '4000.03.00', '4000.04.00', '4000.05.00', '4000.06.00', '4000.07.00')
                    AND {$businessUnitCondition}
                    {$dateFilter}
                GROUP BY
                    period, year, month, business_unit
            ),
            approved_invoices AS (
                SELECT
                    t1.internal_id,
                    t1.invoice_number,
                    t1.date,
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
                    AND " . $this->buildBusinessUnitCondition($businessUnits) . "
                    " . $this->buildDateFilter($years, $dateType, $dateParams) . "
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
            ),
            quantity_summary AS (
                SELECT
                    {$dateGrouping} as period,
                    a.business_unit,
                    SUM(IFNULL(b.total_quantity, 0)) as total_quantity
                FROM
                    approved_invoices a
                LEFT JOIN
                    invoice_quantity b
                ON
                    a.invoice_number = b.invoice_number
                GROUP BY
                    period, a.business_unit
            ),
            gosave_invoice_count AS (
                SELECT
                    {$gosaveGrouping} as period,
                    COUNT(DISTINCT invoice_number) as invoice_count
                FROM
                    `even-gearbox-255203.ds_netbackup.header_invoice`
                WHERE
                    approval_status = 'Approved'
                    AND department IN ('Sales Offline', 'Sales B2B')
                    {$gosaveDateFilter}
                GROUP BY
                    period
            ),
            goto_invoice_count AS (
                SELECT
                    {$bigsellerGrouping} as period,
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
                ) bigseller_data
                WHERE
                    status_pesanan = 'Selesai'
                    {$bigsellerDateFilter}
                GROUP BY
                    period
            )
            SELECT
                gl.period,
                gl.year,
                gl.business_unit,
                gl.month,
                gl.total_sales,
                IFNULL(qs.total_quantity, 0) as total_quantity,
                CASE 
                    WHEN gl.business_unit = 'Gosave' THEN 
                        IFNULL(gc.invoice_count, 0)
                    WHEN gl.business_unit = 'Goto' THEN 
                        IFNULL(gtc.invoice_count, 0)
                    ELSE 0
                END as invoice_count
            FROM
                gl_revenue gl
            LEFT JOIN
                quantity_summary qs
            ON
                gl.period = qs.period
                AND gl.business_unit = qs.business_unit
            LEFT JOIN
                gosave_invoice_count gc
            ON
                gl.period = gc.period
                AND gl.business_unit = 'Gosave'
            LEFT JOIN
                goto_invoice_count gtc
            ON
                gl.period = gtc.period
                AND gl.business_unit = 'Goto'
            ORDER BY
                gl.year, gl.month, gl.business_unit
        ";
        
        $cacheKey = "invoice_sales_gl_" . md5(json_encode($businessUnits) . json_encode($years) . $dateType . json_encode($dateParams));
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }

    /**
     * Get multi-range comparison data (Revenue from GL)
     */
    private function getMultiRangeComparison($businessUnits, $ranges)
    {
        $businessUnitCondition = $this->buildBusinessUnitConditionForFinancialGL($businessUnits);
        
        // Build CASE WHEN for range grouping (untuk GL)
        $rangeCases = [];
        foreach ($ranges as $index => $range) {
            $rangeLabel = "Range " . ($index + 1) . ": " . date('d M Y', strtotime($range['start'])) . " - " . date('d M Y', strtotime($range['end']));
            $rangeCases[] = "WHEN DATE(date) BETWEEN '{$range['start']}' AND '{$range['end']}' THEN '{$rangeLabel}'";
        }
        $rangeCaseStatement = implode(" ", $rangeCases);
        
        // Build CASE WHEN untuk approved_invoices (dengan t1 alias)
        $invoiceRangeCases = [];
        foreach ($ranges as $index => $range) {
            $rangeLabel = "Range " . ($index + 1) . ": " . date('d M Y', strtotime($range['start'])) . " - " . date('d M Y', strtotime($range['end']));
            $invoiceRangeCases[] = "WHEN DATE(t1.date) BETWEEN '{$range['start']}' AND '{$range['end']}' THEN '{$rangeLabel}'";
        }
        $invoiceRangeCaseStatement = implode(" ", $invoiceRangeCases);
        
        // Build CASE WHEN untuk gosave_invoice_count (tanpa alias)
        $gosaveRangeCases = [];
        foreach ($ranges as $index => $range) {
            $rangeLabel = "Range " . ($index + 1) . ": " . date('d M Y', strtotime($range['start'])) . " - " . date('d M Y', strtotime($range['end']));
            $gosaveRangeCases[] = "WHEN DATE(date) BETWEEN '{$range['start']}' AND '{$range['end']}' THEN '{$rangeLabel}'";
        }
        $gosaveRangeCaseStatement = implode(" ", $gosaveRangeCases);
        
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
            WITH gl_revenue AS (
                SELECT
                    CASE
                        {$rangeCaseStatement}
                        ELSE NULL
                    END as range_group,
                    CASE 
                        WHEN department_name IN ('Sales Offline', 'Sales B2B') THEN 'Gosave'
                        ELSE 'Goto'
                    END as business_unit,
                    SUM(debit) * -1 + SUM(credit) as total_sales
                FROM
                    {$this->tablePath}
                WHERE
                    account_header IN ('4000.00.00', '4000.01.00', '4000.08.00', '4000.01.10', '4000.01.11', '4000.01.12', '4000.01.13', '4000.02.00', '4000.03.00', '4000.04.00', '4000.05.00', '4000.06.00', '4000.07.00')
                    AND {$businessUnitCondition}
                    AND (
                        " . implode(" OR ", array_map(function($r) {
                            return "DATE(date) BETWEEN '{$r['start']}' AND '{$r['end']}'";
                        }, $ranges)) . "
                    )
                GROUP BY
                    range_group, business_unit
            ),
            approved_invoices AS (
                SELECT
                    t1.internal_id,
                    t1.invoice_number,
                    t1.date,
                    t1.department,
                    CASE 
                        WHEN t1.department IN ('Sales Offline', 'Sales B2B') THEN 'Gosave'
                        ELSE 'Goto'
                    END as business_unit,
                    CASE
                        {$invoiceRangeCaseStatement}
                        ELSE NULL
                    END as range_group
                FROM
                    `even-gearbox-255203.ds_netbackup.header_invoice` t1
                WHERE
                    t1.approval_status = 'Approved'
                    AND " . $this->buildBusinessUnitCondition($businessUnits) . "
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
            quantity_summary AS (
                SELECT
                    a.range_group,
                    a.business_unit,
                    SUM(IFNULL(b.total_quantity, 0)) as total_quantity
                FROM
                    approved_invoices a
                LEFT JOIN
                    invoice_quantity b
                ON
                    a.invoice_number = b.invoice_number
                WHERE
                    a.range_group IS NOT NULL
                GROUP BY
                    a.range_group, a.business_unit
            ),
            gosave_invoice_count AS (
                SELECT
                    CASE
                        {$gosaveRangeCaseStatement}
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
                gl.range_group as period,
                gl.business_unit,
                gl.total_sales,
                IFNULL(qs.total_quantity, 0) as total_quantity,
                CASE 
                    WHEN gl.business_unit = 'Gosave' THEN 
                        IFNULL(gc.invoice_count, 0)
                    WHEN gl.business_unit = 'Goto' THEN 
                        IFNULL(gtc.invoice_count, 0)
                    ELSE 0
                END as invoice_count
            FROM
                gl_revenue gl
            LEFT JOIN
                quantity_summary qs
            ON
                gl.range_group = qs.range_group
                AND gl.business_unit = qs.business_unit
            LEFT JOIN
                gosave_invoice_count gc
            ON
                gl.range_group = gc.range_group
                AND gl.business_unit = 'Gosave'
            LEFT JOIN
                goto_invoice_count gtc
            ON
                gl.range_group = gtc.range_group
                AND gl.business_unit = 'Goto'
            WHERE
                gl.range_group IS NOT NULL
            ORDER BY
                gl.range_group, gl.business_unit
        ";
        
        $cacheKey = "multi_range_comparison_gl_" . md5(json_encode($businessUnits) . json_encode($ranges));
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }

    /**
     * Helper: Build date filter for GL table
     */
    private function buildDateFilterForGL($years, $dateType, $dateParams)
    {
        $filters = [];
        
        // Filter by years (monthly aggregation)
        if (!empty($years) && $dateType === 'year') {
            $yearList = implode(',', $years);
            $filters[] = "EXTRACT(YEAR FROM date) IN ({$yearList})";
        }
        
        // Filter for compare by year
        if ($dateType === 'compare_year' && !empty($dateParams)) {
            $dateConditions = [];
            foreach ($dateParams['dates'] as $date) {
                $dateObj = \DateTime::createFromFormat('m-d', $date);
                $month = $dateObj->format('m');
                $day = $dateObj->format('d');
                $dateConditions[] = "(EXTRACT(MONTH FROM date) = {$month} AND EXTRACT(DAY FROM date) = {$day})";
            }
            $filters[] = "(" . implode(" OR ", $dateConditions) . ")";
            
            // Filter years
            if (!empty($dateParams['years'])) {
                $yearList = implode(',', $dateParams['years']);
                $filters[] = "EXTRACT(YEAR FROM date) IN ({$yearList})";
            }
        }
        
        // Filter by date range
        if ($dateType === 'range' && !empty($dateParams)) {
            $startDate = $dateParams['start'];
            $endDate = $dateParams['end'];
            $filters[] = "DATE(date) BETWEEN '{$startDate}' AND '{$endDate}'";
        }
        
        // Filter by specific dates
        if ($dateType === 'specific' && !empty($dateParams)) {
            $dateList = "'" . implode("','", $dateParams) . "'";
            $filters[] = "DATE(date) IN ({$dateList})";
        }

        if ($dateType === 'multi_range' && !empty($dateParams)) {
            $rangeConditions = [];
            foreach ($dateParams as $range) {
                if (!empty($range['start']) && !empty($range['end'])) {
                    $rangeConditions[] = "(DATE(date) BETWEEN '{$range['start']}' AND '{$range['end']}')";
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

    /**
     * Helper: Build date filter based on selected filters (for invoice table with t1 alias)
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

    /**
     * Build date filter for Bigseller tables
     */
    private function buildBigsellerDateFilter($years, $dateType, $dateParams)
    {
        $filters = [];
        
        // Filter by years
        if (!empty($years) && $dateType === 'year') {
            $yearList = implode(',', $years);
            $filters[] = "EXTRACT(YEAR FROM waktu_pesanan_dibuat) IN ({$yearList})";
        }
        
        // Filter by date range
        if ($dateType === 'range' && !empty($dateParams)) {
            $startDate = $dateParams['start'];
            $endDate = $dateParams['end'];
            $filters[] = "DATE(waktu_pesanan_dibuat) BETWEEN '{$startDate}' AND '{$endDate}'";
        }
        
        // Filter by specific dates
        if ($dateType === 'specific' && !empty($dateParams)) {
            $dateList = "'" . implode("','", $dateParams) . "'";
            $filters[] = "DATE(waktu_pesanan_dibuat) IN ({$dateList})";
        }
        
        // Filter for compare by year
        if ($dateType === 'compare_year' && !empty($dateParams)) {
            $dateConditions = [];
            foreach ($dateParams['dates'] as $date) {
                $dateObj = \DateTime::createFromFormat('m-d', $date);
                $month = $dateObj->format('m');
                $day = $dateObj->format('d');
                $dateConditions[] = "(EXTRACT(MONTH FROM waktu_pesanan_dibuat) = {$month} AND EXTRACT(DAY FROM waktu_pesanan_dibuat) = {$day})";
            }
            $filters[] = "(" . implode(" OR ", $dateConditions) . ")";
            
            // Filter years
            if (!empty($dateParams['years'])) {
                $yearList = implode(',', $dateParams['years']);
                $filters[] = "EXTRACT(YEAR FROM waktu_pesanan_dibuat) IN ({$yearList})";
            }
        }
        
        if (empty($filters)) {
            return "";
        }
        
        return "AND " . implode(" AND ", $filters);
    }

    /**
     * Build date filter for gosave_invoice_count CTE (no t1 alias)
     */
    private function buildGosaveDateFilter($years, $dateType, $dateParams)
    {
        $filters = [];
        
        // Filter by years
        if (!empty($years) && $dateType === 'year') {
            $yearList = implode(',', $years);
            $filters[] = "EXTRACT(YEAR FROM date) IN ({$yearList})";
        }
        
        // Filter by date range
        if ($dateType === 'range' && !empty($dateParams)) {
            $startDate = $dateParams['start'];
            $endDate = $dateParams['end'];
            $filters[] = "DATE(date) BETWEEN '{$startDate}' AND '{$endDate}'";
        }
        
        // Filter by specific dates
        if ($dateType === 'specific' && !empty($dateParams)) {
            $dateList = "'" . implode("','", $dateParams) . "'";
            $filters[] = "DATE(date) IN ({$dateList})";
        }
        
        // Filter for compare by year
        if ($dateType === 'compare_year' && !empty($dateParams)) {
            $dateConditions = [];
            foreach ($dateParams['dates'] as $date) {
                $dateObj = \DateTime::createFromFormat('m-d', $date);
                $month = $dateObj->format('m');
                $day = $dateObj->format('d');
                $dateConditions[] = "(EXTRACT(MONTH FROM date) = {$month} AND EXTRACT(DAY FROM date) = {$day})";
            }
            $filters[] = "(" . implode(" OR ", $dateConditions) . ")";
            
            // Filter years
            if (!empty($dateParams['years'])) {
                $yearList = implode(',', $dateParams['years']);
                $filters[] = "EXTRACT(YEAR FROM date) IN ({$yearList})";
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
            FROM `even-gearbox-255203.ds_netbackup.header_invoice`
            WHERE date IS NOT NULL;
        ";

        $cacheKey = "last_update_info";
        
        return Cache::remember($cacheKey, 3600, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }
}