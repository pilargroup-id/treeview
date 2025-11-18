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
}