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
    public function getMonthlyRevenue($accountHeader, $startDate, $endDate)
    {
        $query = "
            SELECT
                date,
                cre - deb AS total
            FROM (
                SELECT
                    FORMAT_DATE('%B %Y', DATE(date)) AS date,
                    SUM(credit) AS cre,
                    SUM(debit) AS deb
                FROM
                    {$this->tablePath}
                WHERE
                    account_header = '{$accountHeader}'
                    AND DATE(date) BETWEEN '{$startDate}' AND '{$endDate}'
                GROUP BY
                    date
            )
            ORDER BY
                PARSE_DATE('%B %Y', date)
        ";

        $cacheKey = "monthly_revenue_{$accountHeader}_{$startDate}_{$endDate}";
        
        return Cache::remember($cacheKey, 1800, function () use ($query) {
            return $this->bigQueryService->runQuery($query);
        });
    }
}