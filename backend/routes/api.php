<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinancialController;
use App\Http\Controllers\Api\TreeViewAuthController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ActivityPlanController;
use App\Http\Controllers\Api\MonthlyVisitController;
use App\Http\Controllers\Api\ActivityDetailController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public route - login
Route::prefix('tree-view')->group(function () {
    Route::post('/login', [TreeViewAuthController::class, 'login']);
});

// Semua route di bawah wajib login
Route::middleware('tree_view_auth')->group(function () {

    // Tree View - semua user yang login bisa akses
    Route::prefix('tree-view')->group(function () {
        Route::get('/user', [TreeViewAuthController::class, 'getCurrentUser']);
        Route::get('/permissions', [TreeViewAuthController::class, 'getPermissions']);
        Route::post('/logout', [TreeViewAuthController::class, 'logout']);
    });

    Route::prefix('financial')->group(function () {
        Route::get('/last-update', [FinancialController::class, 'getLastUpdate']);
    });

    // Financial - KECUALI Gosave GT dan Manager (hanya Board Of Director & IT)
    Route::prefix('financial')->middleware('check_permission:Board Of Director|IT')->group(function () {
        Route::get('/monthly-revenue', [FinancialController::class, 'getMonthlyRevenue']);
        Route::get('/invoice-sales', [FinancialController::class, 'getInvoiceSales']);
    });

    // Activity Plans - semua user yang login bisa akses (no check_permission)
    Route::prefix('activity-plans')->group(function () {
        Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
        Route::get('/monthly-visit', [MonthlyVisitController::class, 'index']);
        Route::get('/details', [ActivityDetailController::class, 'index']);
    });

});