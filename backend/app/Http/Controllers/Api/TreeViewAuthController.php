<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Validator;

class TreeViewAuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors()], 422);
        }

        $user = CentralUser::where('username', $request->input('username'))
            ->where('is_active', 1)
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json(['success' => false, 'message' => 'Username atau password salah'], 401);
        }

        // Cek akses treeview
        $apps = DB::connection('pilargroup')
            ->table('central_user_projects as cup')
            ->join('master_projects as mp', 'cup.project_id', '=', 'mp.id')
            ->where('cup.user_id', $user->id)
            ->pluck('mp.slug')
            ->toArray();

        if (!in_array('treeview', $apps)) {
            return response()->json(['success' => false, 'message' => 'Access denied for this application'], 403);
        }

        // Query department & job_level via relasi
        $primaryDept = DB::connection('pilargroup')
            ->table('central_user_departments as cud')
            ->join('master_departments as md', 'cud.department_id', '=', 'md.id')
            ->where('cud.user_id', $user->id)
            ->orderByDesc('cud.is_primary')
            ->select('md.name as department_name', 'md.id as department_id')
            ->first();

        $jobLevel = DB::connection('pilargroup')
            ->table('master_job_levels')
            ->where('id', $user->job_level_id)
            ->value('name');

        $token = JWTAuth::claims([
            'apps'         => $apps,
            'department'   => $primaryDept?->department_name,
            'department_id'=> $primaryDept?->department_id,
            'job_level'    => $jobLevel,
        ])->fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'token' => $token,
                'user'  => [
                    'id'           => $user->id,
                    'internal_id'  => $user->internal_id,
                    'username'     => $user->username,
                    'name'         => $user->name,
                    'department'   => $primaryDept?->department_name,
                    'job_position' => $user->job_position,
                    'job_level'    => $jobLevel,
                    'apps'         => $apps,
                ],
            ],
        ]);
    }

    public function getCurrentUser(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->auth_user,
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['success' => true, 'message' => 'Logout berhasil']);
    }

    public function getPermissions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'department'   => $request->department,
                'job_level'    => $request->job_level,
                'job_position' => $request->job_position,
                'apps'         => $request->apps,
            ],
        ]);
    }

    public function changeProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_username'     => 'nullable|string|min:3',
            'new_password'     => 'nullable|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (!$request->input('new_username') && !$request->input('new_password')) {
            return response()->json(['success' => false, 'message' => 'Isi minimal new_username atau new_password'], 422);
        }

        $userId = $request->user_id;

        $user = DB::connection('pilargroup')
            ->table('central_users')
            ->where('id', $userId)
            ->where('is_active', 1)
            ->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['success' => false, 'message' => 'Password saat ini salah'], 401);
        }

        $updates = ['updated_at' => now()->toDateTimeString()];
        $changed = [];

        if ($request->input('new_username')) {
            $exists = DB::connection('pilargroup')
                ->table('central_users')
                ->where('username', $request->input('new_username'))
                ->where('id', '!=', $userId)
                ->exists();

            if ($exists) {
                return response()->json(['success' => false, 'message' => 'Username sudah digunakan'], 422);
            }

            $updates['username'] = $request->input('new_username');
            $changed[] = 'username';
        }

        if ($request->input('new_password')) {
            $updates['password'] = Hash::make($request->input('new_password'));
            $changed[] = 'password';
        }

        DB::connection('pilargroup')
            ->table('central_users')
            ->where('id', $userId)
            ->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengubah ' . implode(' dan ', $changed),
        ]);
    }
}