<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\ActivityDetailRepository;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ActivityDetailController extends Controller
{
    protected $activityDetailRepository;

    public function __construct(ActivityDetailRepository $activityDetailRepository)
    {
        $this->activityDetailRepository = $activityDetailRepository;
    }

    /**
     * Get activity details list
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            'state' => 'nullable|string|max:255',
            'sales_name' => 'nullable|string|max:255',
            'customer_name' => 'nullable|string|max:255',
            'tujuan' => 'nullable|string|in:Visit,Follow Up',
        ]);

        // Validate date range (max 1 month / 31 days)
        if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
            $startDate = Carbon::parse($validated['start_date']);
            $endDate = Carbon::parse($validated['end_date']);
            $daysDiff = $startDate->diffInDays($endDate);

            if ($daysDiff > 31) {
                return response()->json([
                    'success' => false,
                    'message' => 'Date range cannot exceed 1 month (31 days)',
                    'error' => 'Date range is ' . $daysDiff . ' days. Maximum is 31 days.'
                ], 422);
            }
        }

        // Build filters
        $filters = [
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'state' => $validated['state'] ?? null,
            'sales_name' => $validated['sales_name'] ?? null,
            'customer_name' => $validated['customer_name'] ?? null,
            'tujuan' => $validated['tujuan'] ?? null,
        ];

        // Get data from repository
        $result = $this->activityDetailRepository->getActivityDetails($filters);

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
