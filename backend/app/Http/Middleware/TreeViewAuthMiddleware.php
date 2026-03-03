<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\BigQueryService;

class TreeViewAuthMiddleware
{
    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        // Skip auth check untuk CORS preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            return $next($request);
        }

        // Ambil token dari header Authorization: Bearer {token}
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - missing token',
            ], 401);
        }

        $token = substr($authHeader, 7); // Hapus "Bearer "

        $result = $this->bigQueryService->validateToken($token);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 401);
        }

        // Set user_id ke request untuk dipakai controller/middleware berikutnya
        $request->attributes->set('tree_view_user_id', $result['user_id']);

        return $next($request);
    }
}