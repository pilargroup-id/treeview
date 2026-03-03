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

    public function handle(Request $request, Closure $next, ...$params)
    {
        // Skip auth check untuk CORS preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            return $next($request);
        }

        // Ambil user_id yang sudah di-set oleh TreeViewAuthMiddleware
        $userId = $request->attributes->get('tree_view_user_id');

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

        // Board of Director & IT -> all access
        $fullAccessDepartments = ['Board Of Director', 'IT'];
        if (in_array($department, $fullAccessDepartments)) {
            $request->attributes->set('user_permissions', $permissions);
            return $next($request);
        }

        // Check permission berdasarkan params route
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