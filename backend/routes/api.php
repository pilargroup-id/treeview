<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FinancialController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/financial/monthly-revenue', [FinancialController::class, 'getMonthlyRevenue']);
Route::get('/financial/invoice-sales', [FinancialController::class, 'getInvoiceSales']);
