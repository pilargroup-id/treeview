<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * Page A - IT Department only
     */
    public function pageA(Request $request)
    {
        $permissions = $request->attributes->get('user_permissions');

        return response()->json([
            'success' => true,
            'message' => 'Welcome to Page A (IT Only)',
            'page' => 'A',
            'user_permissions' => $permissions,
            'data' => [
                'content' => 'This is page A - restricted to IT department',
            ]
        ], 200);
    }

    /**
     * Page B - All access
     */
    public function pageB(Request $request)
    {
        $permissions = $request->attributes->get('user_permissions');

        return response()->json([
            'success' => true,
            'message' => 'Welcome to Page B (All Access)',
            'page' => 'B',
            'user_permissions' => $permissions,
            'data' => [
                'content' => 'This is page B - open for all',
            ]
        ], 200);
    }

    /**
     * Page C - Finance Department OR Manager role
     */
    public function pageC(Request $request)
    {
        $permissions = $request->attributes->get('user_permissions');

        return response()->json([
            'success' => true,
            'message' => 'Welcome to Page C (Finance or Manager)',
            'page' => 'C',
            'user_permissions' => $permissions,
            'data' => [
                'content' => 'This is page C - restricted to Finance department or Manager role',
            ]
        ], 200);
    }
}
