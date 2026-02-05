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
            'business_units' => 'nullable|array',
            'business_units.*' => 'in:Gosave,Goto',
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
            $request->end_date,
            $request->input('business_units', null)
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
            'business_units' => 'nullable|array',
            'business_units.*' => 'in:Gosave,Goto',
            'sub_business_units' => 'nullable|array',  // Tambah validasi ini
            'sub_business_units.*' => 'in:Gosave GT,Gosave B2B,Gosave E-Com,GOTO GT,Store,GOTO E-Com',  // Tambah validasi ini
            'date_type' => 'nullable|in:year,range,specific,compare_year,multi_range',
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
        } elseif ($dateType === 'multi_range') {
            $ranges = $request->input('date_ranges', []);
            
            // Validate each range
            $validRanges = [];
            foreach ($ranges as $range) {
                if (!empty($range['start']) && !empty($range['end'])) {
                    $start = new \DateTime($range['start']);
                    $end = new \DateTime($range['end']);
                    $diff = $start->diff($end)->days;
                    
                    if ($diff > 31) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Setiap range maksimal 31 hari'
                        ], 422);
                    }
                    
                    $validRanges[] = [
                        'start' => $range['start'],
                        'end' => $range['end']
                    ];
                }
            }
            
            if (count($validRanges) > 5) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Maksimal 5 range tanggal'
                ], 422);
            }
            
            $dateParams = $validRanges;
        }

        $result = $this->financialRepo->getInvoiceSalesData(
            $request->input('business_units', []),  // Bisa empty array
            $request->input('years', null),
            $dateType,
            $dateParams,
            $request->input('sub_business_units', null)  // Tambah parameter ini
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
     * GET /api/financial/last-update
     */
    public function getLastUpdate()
    {
        $result = $this->financialRepo->getLastUpdateInfo();

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