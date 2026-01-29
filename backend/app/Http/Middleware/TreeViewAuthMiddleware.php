<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TreeViewAuthMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = session('tree_view_auth_user');
        $token = session('tree_view_auth_token');

        if (!$userId || !$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - missing token',
            ], 401);
        }

        $request->attributes->set('tree_view_user_id', $userId);
        $request->attributes->set('tree_view_token', $token);

        return $next($request);
    }
}
