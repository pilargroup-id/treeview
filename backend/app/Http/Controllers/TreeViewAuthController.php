<?php

namespace App\Http\Controllers;

use App\Services\BigQueryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TreeViewAuthController extends Controller
{
    protected $bigQueryService;

    public function __construct(BigQueryService $bigQueryService)
    {
        $this->bigQueryService = $bigQueryService;
    }

    /**
     * Login endpoint
     * POST /api/tree-view/login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $loginResult = $this->bigQueryService->loginUser($request->username, $request->password);

        if (!$loginResult['success']) {
            return response()->json([
                'success' => false,
                'message' => $loginResult['message'],
            ], 401);
        }

        $user = $loginResult['user'];

        // Update last_login
        $this->bigQueryService->updateLastLogin($user['id']);

        // Generate token (simple token based on session)
        $token = bin2hex(random_bytes(32));
        session(['tree_view_auth_token' => $token]);
        session(['tree_view_auth_user' => $user['id']]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 200);
    }

    /**
     * Get current user data
     * GET /api/tree-view/user
     */
    public function getCurrentUser(Request $request)
    {
        $userId = session('tree_view_auth_user');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $result = $this->bigQueryService->getUserWithPermissions($userId);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Logout endpoint
     * POST /api/tree-view/logout
     */
    public function logout(Request $request)
    {
        session()->forget(['tree_view_auth_token', 'tree_view_auth_user']);

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ], 200);
    }

    /**
     * Get user permissions (dari master_employee)
     * GET /api/tree-view/permissions
     */
    public function getPermissions(Request $request)
    {
        $userId = session('tree_view_auth_user');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $result = $this->bigQueryService->getUserPermissions($userId);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $result['data'],
        ], 200);
    }
}
