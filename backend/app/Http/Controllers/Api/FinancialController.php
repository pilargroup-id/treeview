<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\FinancialRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FinancialController extends Controller
{
    protected $financialRepo;

    public function __construct(FinancialRepository $financialRepo)
    {
        $this->financialRepo = $financialRepo;
    }

    /**
     * GET /api/financial/monthly-revenue
     * Params: account_header, start_date, end_date
     */
    public function getMonthlyRevenue(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_header' => 'required|string',
            'start_date' => 'required|date|date_format:Y-m-d',
            'end_date' => 'required|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $result = $this->financialRepo->getMonthlyRevenue(
            $request->account_header,
            $request->start_date,
            $request->end_date
        );

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['data']
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['error']
        ], 500);
    }

    /**
     * GET /api/financial/invoice-sales
     * Params: business_unit, years[], dates[], date_range[]
    */
    public function getInvoiceSales(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'business_units' => 'required|array|min:1',
            'business_units.*' => 'in:Gosave,Goto',
            'date_type' => 'nullable|in:year,range,specific,compare_year',
            'years' => 'nullable|array',
            'years.*' => 'integer|min:2020|max:2030',
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            'specific_dates' => 'nullable|array|max:30',
            'specific_dates.*' => 'date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prepare date params based on type
        $dateType = $request->input('date_type');
        $dateParams = null;

        if ($dateType === 'range') {
            $dateParams = [
                'start' => $request->start_date,
                'end' => $request->end_date
            ];
        } elseif ($dateType === 'specific') {
            $dateParams = $request->specific_dates;
        } elseif ($dateType === 'compare_year') {
            $dateParams = [
                'dates' => $request->input('compare_dates', []),
                'years' => $request->input('compare_years', [])
            ];
        }

        $result = $this->financialRepo->getInvoiceSalesData(
            $request->business_units,
            $request->input('years', null),
            $dateType,
            $dateParams
        );

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['data']
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['error']
        ], 500);
    }

}