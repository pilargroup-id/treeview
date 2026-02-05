<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\BigQueryService;

class CheckPermission
{
    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    /**
     * Handle an incoming request.
     * 
     * Usage:
     * ->middleware('check_permission:IT') -> Check department IT
     * ->middleware('check_permission:Manager') -> Check job_level Manager
     * ->middleware('check_permission:Finance|Manager') -> Check Finance OR Manager
     * ->middleware('check_permission:IT,Manager') -> Check IT department AND Manager role
     */
    public function handle(Request $request, Closure $next, ...$params)
    {
        $userId = session('tree_view_auth_user');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No user session',
            ], 401);
        }

        // Get user permissions dari BigQuery
        $result = $this->bigQueryService->getUserPermissions($userId);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'User not found or inactive',
            ], 404);
        }

        $permissions = $result['data'];
        $department = $permissions['department'];
        $jobLevel = $permissions['job_level'];

        // Check if user has required permissions
        $hasPermission = false;

        // Parse parameters - misal: "Finance|Manager" atau "IT,Manager"
        foreach ($params as $param) {
            // Split by pipe (|) untuk OR logic
            $orConditions = explode('|', $param);

            foreach ($orConditions as $condition) {
                $condition = trim($condition);

                // Check if department matches
                if ($department === $condition) {
                    $hasPermission = true;
                    break;
                }

                // Check if job_level matches
                if ($jobLevel === $condition) {
                    $hasPermission = true;
                    break;
                }
            }

            if ($hasPermission) {
                break;
            }
        }

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden - Insufficient permissions',
                'user_permissions' => [
                    'department' => $department,
                    'job_level' => $jobLevel,
                ],
            ], 403);
        }

        // Store permissions di request untuk digunakan di controller
        $request->attributes->set('user_permissions', $permissions);

        return $next($request);
    }
}
