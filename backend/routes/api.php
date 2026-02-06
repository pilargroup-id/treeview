<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\TreeViewAuthController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Api\ActivityPlanController;
use App\Http\Controllers\Api\MissedActivityController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('financial')->group(function () {
    Route::get('/monthly-revenue', [FinancialController::class, 'getMonthlyRevenue']);
    Route::get('/invoice-sales', [FinancialController::class, 'getInvoiceSales']);
    Route::get('/last-update', [FinancialController::class, 'getLastUpdate']);
});

Route::prefix('activity-plans')->group(function () {
    Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
    Route::get('/missed-summary', [MissedActivityController::class, 'index']);
});


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
