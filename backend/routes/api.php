<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\TreeViewAuthController;
use App\Http\Controllers\PageController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/financial/monthly-revenue', [FinancialController::class, 'getMonthlyRevenue']);
Route::get('/financial/invoice-sales', [FinancialController::class, 'getInvoiceSales']);
Route::get('/financial/last-update', [FinancialController::class, 'getLastUpdate']);

// // Tree View Auth Routes
// Route::prefix('tree-view')->group(function () {
//     // Public routes
//     Route::post('/login', [TreeViewAuthController::class, 'login']);
    
//     // Protected routes
//     Route::middleware('tree_view_auth')->group(function () {
//         Route::get('/user', [TreeViewAuthController::class, 'getCurrentUser']);
//         Route::get('/permissions', [TreeViewAuthController::class, 'getPermissions']);
//         Route::post('/logout', [TreeViewAuthController::class, 'logout']);

//         // Pages dengan permission control
//         // Page A - IT Department only
//         Route::get('/page-a', [PageController::class, 'pageA'])
//             ->middleware('check_permission:IT');

//         // Page B - All access (no permission restriction)
//         Route::get('/page-b', [PageController::class, 'pageB']);

//         // Page C - Finance Department OR Manager role
//         Route::get('/page-c', [PageController::class, 'pageC'])
//             ->middleware('check_permission:Finance|Manager');
//     });
// });
