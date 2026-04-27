<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class CheckPermission
{
    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    public function handle(Request $request, Closure $next, ...$params)
    {
        $department = $request->department;
        $jobLevel   = $request->job_level;

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No user session',
            ], 401);
        }

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

        $hasPermission = false;

        foreach ($params as $param) {
            $orConditions = explode('|', $param);
            foreach ($orConditions as $condition) {
                $condition = trim($condition);
                if ($department === $condition || $jobLevel === $condition) {
                    $hasPermission = true;
                    break;
                }
            }
            if ($hasPermission) break;
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

        $request->attributes->set('user_permissions', $permissions);
        return $next($request);
    }   
}