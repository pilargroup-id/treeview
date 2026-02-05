<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ActivityPlanRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActivityPlanController extends Controller
{
    protected $activityPlanRepository;

    public function __construct(ActivityPlanRepository $activityPlanRepository)
    {
        $this->activityPlanRepository = $activityPlanRepository;
    }

    /**
     * Get weekly summary of activity plans
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function weeklySummary(Request $request): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'months' => 'nullable|array|max:3',
            'months.*' => 'integer|min:1|max:12',
            'year' => 'nullable|integer|min:2000|max:2100',
            'state' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:done,missed',
            'tujuan' => 'nullable|string|in:Visit,Follow Up',
        ]);

        // Build filters
        $filters = [
            'customer_name' => $validated['customer_name'] ?? null,
            'months' => $validated['months'] ?? null,
            'year' => $validated['year'] ?? null,
            'state' => $validated['state'] ?? null,
            'status' => $validated['status'] ?? null,
            'tujuan' => $validated['tujuan'] ?? null,
        ];

        // Get data from repository
        $result = $this->activityPlanRepository->getWeeklySummary($filters);

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
            'filters_applied' => array_filter($filters, function($value) {
                return $value !== null;
            })
        ]);
    }
}