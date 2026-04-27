<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class TreeViewAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->getMethod() === 'OPTIONS') {
            return $next($request);
        }

        try {
            $payload = JWTAuth::parseToken()->getPayload();

            $apps = (array) ($payload->get('apps') ?? []);
            if (!in_array('treeview', $apps)) {
                return response()->json(['success' => false, 'message' => 'Access denied for this application'], 403);
            }

            $request->merge([
                'auth_user'         => $payload->toArray(),
                'user_id'           => $payload->get('sub'),
                'tree_view_user_id' => $payload->get('sub'),
                'internal_id'       => $payload->get('internal_id'),
                'auth_username'     => $payload->get('username'),
                'auth_name'         => $payload->get('name'),
                'department'        => $payload->get('department'),
                'job_position'      => $payload->get('job_position'),
                'job_level'         => $payload->get('job_level'),
                'apps'              => $apps,
            ]);

            $request->attributes->set('tree_view_user_id', $payload->get('sub'));

        } catch (TokenExpiredException $e) {
            return response()->json(['success' => false, 'message' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Unauthorized - missing token'], 401);
        }

        return $next($request);
    }
}