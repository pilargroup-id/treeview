<?php

namespace App\Services;

use Google\Cloud\BigQuery\BigQueryClient;
use Google\Cloud\BigQuery\Numeric;
use Illuminate\Support\Facades\Log;

class BigQueryService
{
    protected $bigQuery;
    protected $projectId;

    public function __construct()
    {
        $keyFilePath = storage_path('app/google/even-gearbox-255203-10881c36321f.json');
        $this->projectId = env('BIGQUERY_PROJECT_ID');
        
        $this->bigQuery = new BigQueryClient([
            'projectId' => $this->projectId,
            'keyFilePath' => $keyFilePath,
        ]);
    }

    public function runQuery($query)
    {
        try {
            $jobConfig = $this->bigQuery->query($query);
            $queryResults = $this->bigQuery->runQuery($jobConfig);

            $rows = [];
            foreach ($queryResults as $row) {
                $rows[] = $this->convertRow($row);
            }

            return [
                'success' => true,
                'data' => $rows,
                'count' => count($rows)
            ];

        } catch (\Exception $e) {
            Log::error('BigQuery Error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    protected function convertRow($row)
    {
        $converted = [];
        foreach ($row as $key => $value) {
            if ($value instanceof Numeric) {
                $converted[$key] = (float) $value->get();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Date) {
                // Convert Date object to string (Y-m-d format)
                $converted[$key] = $value->formatAsString();
            } elseif ($value instanceof \Google\Cloud\BigQuery\Timestamp) {
                // Convert Timestamp to datetime string
                $converted[$key] = $value->get()->format('Y-m-d H:i:s');
            } elseif (is_null($value)) {
                $converted[$key] = 0;
            } else {
                $converted[$key] = $value;
            }
        }
        return $converted;
    }
}