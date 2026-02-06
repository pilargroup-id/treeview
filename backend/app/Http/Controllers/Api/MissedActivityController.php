<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\MissedActivityRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MissedActivityController extends Controller
{
    protected $missedActivityRepository;

    public function __construct(MissedActivityRepository $missedActivityRepository)
    {
        $this->missedActivityRepository = $missedActivityRepository;
    }

    /**
     * Get list of missed activities
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'sales_name' => 'nullable|string|max:255',
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2000|max:2100',
            'state' => 'nullable|string|max:255',
        ]);

        // Build filters
        $filters = [
            'sales_name' => $validated['sales_name'] ?? null,
            'month' => $validated['month'] ?? null,
            'year' => $validated['year'] ?? null,
            'state' => $validated['state'] ?? null,
        ];

        // Get data from repository
        $result = $this->missedActivityRepository->getMissedActivities($filters);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch data',
                'error' => $result['error']
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data retrieved successfully',
            'data' => $result['data'],
            'count' => count($result['data']),
            'filters_applied' => array_filter($filters, function($value) {
                return $value !== null;
            })
        ]);
    }
}