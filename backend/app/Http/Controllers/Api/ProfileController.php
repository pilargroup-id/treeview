<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    public function changeProfile(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_username'     => 'nullable|string|min:3',
            'new_password'     => 'nullable|string|min:6',
            'email'            => 'nullable|email',
            'phone'            => 'nullable|string|max:20',
        ]);

        if (!$request->input('new_username') && !$request->input('new_password') && 
            is_null($request->input('email')) && is_null($request->input('phone'))) {
            return response()->json(['success' => false, 'message' => 'Isi minimal satu field yang ingin diubah'], 422);
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

        if ($request->input('email') !== null) {
            $updates['email'] = $request->input('email');
            $changed[] = 'email';
        }

        if ($request->input('phone') !== null) {
            $updates['phone'] = $request->input('phone');
            $changed[] = 'phone';
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