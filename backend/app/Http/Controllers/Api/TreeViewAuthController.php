<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BigQueryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

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

        // Generate token dan simpan ke BigQuery
        $token = bin2hex(random_bytes(32));
        $this->bigQueryService->saveToken($user['id'], $token);

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
        $userId = $request->attributes->get('tree_view_user_id');
        $this->bigQueryService->deleteToken($userId);

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


    /**
     * Change profile (username and/or password)
     * PUT /api/tree-view/change-profile
     */
    public function changeProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_username'     => 'nullable|string|min:3',
            'new_password'     => 'nullable|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        if (!$request->new_username && !$request->new_password) {
            return response()->json([
                'success' => false,
                'message' => 'Isi minimal new_username atau new_password',
            ], 422);
        }

        $userId = $request->attributes->get('tree_view_user_id');

        // Ambil data user
        $userResult = $this->bigQueryService->getUserById($userId);
        if (!$userResult['success']) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        $user = $userResult['user'];

        // Verifikasi password saat ini
        if (!Hash::check($request->current_password, $user['password'])) {
            return response()->json(['success' => false, 'message' => 'Password saat ini salah'], 401);
        }

        $changed = [];

        // Ganti username
        if ($request->new_username) {
            $result = $this->bigQueryService->updateUsername($userId, $request->new_username);
            if (!$result['success']) {
                return response()->json(['success' => false, 'message' => $result['message']], 422);
            }
            $changed[] = 'username';
        }

        // Ganti password
        if ($request->new_password) {
            $newHashedPassword = Hash::make($request->new_password);
            $result = $this->bigQueryService->updatePassword($userId, $newHashedPassword);
            if (!$result['success']) {
                return response()->json(['success' => false, 'message' => $result['message']], 500);
            }
            $changed[] = 'password';
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengubah ' . implode(' dan ', $changed),
        ]);
    }
}
