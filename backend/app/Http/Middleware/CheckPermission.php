<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, ...$params)
    {
        $department = $request->department;
        $jobLevel   = $request->job_level;

        if (!$department) {
            return response()->json(['success' => false, 'message' => 'Unauthorized - No user session'], 401);
        }

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
                    'job_level'  => $jobLevel,
                ],
            ], 403);
        }

        return $next($request);
    }
}