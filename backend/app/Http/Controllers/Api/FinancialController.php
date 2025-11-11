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
}