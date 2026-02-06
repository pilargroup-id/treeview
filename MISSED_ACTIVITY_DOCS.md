# Missed Activities API Documentation

## Routes Setup

### Tambahkan di file: routes/api.php

```php
use App\Http\Controllers\Api\MissedActivityController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
    Route::get('/missed-summary', [MissedActivityController::class, 'index']);
});
```

---

## Endpoint Details

### GET /api/activity-plans/missed-summary

**URL:** `http://your-domain.com/api/activity-plans/missed-summary`

**Method:** GET

**Description:** Menampilkan list activity dengan status 'missed' per activity (1 row = 1 activity)

**Query Parameters:**

| Parameter   | Type    | Required | Description                              | Example              |
|------------|---------|----------|------------------------------------------|----------------------|
| sales_name | string  | No       | Search sales name (partial, case-insensitive) | `sales_name=John`    |
| month      | integer | No       | Filter by month (1-12), only 1 month    | `month=2`            |
| year       | integer | No       | Filter by year (2000-2100)              | `year=2026`          |
| state      | string  | No       | Filter by wilayah from master_customer  | `state=Banten`       |

**Notes:**
- Status hardcoded: hanya 'missed'
- Customer dengan `customer_id = NULL` excluded
- Ambil row dengan `updated_at` terbaru untuk ID yang sama
- Data sorted by: `plan_date DESC, customer_name ASC`

---

## Example Requests

### 1. Get all missed activities (no filters)
```
GET /api/activity-plans/missed-summary
```

### 2. Filter by sales name
```
GET /api/activity-plans/missed-summary?sales_name=John
```

### 3. Filter by month & year (hanya Februari 2026)
```
GET /api/activity-plans/missed-summary?month=2&year=2026
```

### 4. Filter by state (wilayah)
```
GET /api/activity-plans/missed-summary?state=Banten
```

### 5. Combined filters
```
GET /api/activity-plans/missed-summary?sales_name=John&month=2&year=2026&state=Banten
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "count": 3,
  "data": [
    {
      "customer_name": "BAJA SAKTI",
      "sales_name": "John Doe",
      "wilayah": "Banten",
      "tujuan": "Visit",
      "status": "missed",
      "plan_date": "Jumat, 06 Feb 2026",
      "visit_count": 1,
      "follow_up_count": 0
    },
    {
      "customer_name": "MITRA LOGAM JAYA",
      "sales_name": "Jane Smith",
      "wilayah": "DKI Jakarta",
      "tujuan": "Follow Up",
      "status": "missed",
      "plan_date": "Kamis, 05 Feb 2026",
      "visit_count": 0,
      "follow_up_count": 1
    },
    {
      "customer_name": "CV ANUGRAH STEEL",
      "sales_name": "John Doe",
      "wilayah": "Jawa Barat",
      "tujuan": "Visit",
      "status": "missed",
      "plan_date": "Rabu, 04 Feb 2026",
      "visit_count": 1,
      "follow_up_count": 0
    }
  ],
  "filters_applied": {
    "month": 2,
    "year": 2026
  }
}
```

**Output Explanation:**
- **customer_name**: Nama customer dari `master_customer`
- **sales_name**: Nama sales dari `master_sales`
- **wilayah**: State/wilayah dari `master_customer` (bukan dari `activity_plans`)
- **tujuan**: Tujuan activity (Visit / Follow Up)
- **status**: Status activity (selalu 'missed')
- **plan_date**: Tanggal dalam format "Jumat, 06 Feb 2026" (fallback ke yyyy-mm-dd jika format gagal)
- **visit_count**: 1 jika tujuan = 'Visit', 0 jika bukan
- **follow_up_count**: 1 jika tujuan = 'Follow Up', 0 jika bukan

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to fetch data",
  "error": "Error message from BigQuery"
}
```

### Validation Error (422 Unprocessable Entity)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "month": [
      "The month must be between 1 and 12."
    ],
    "year": [
      "The year must be between 2000 and 2100."
    ]
  }
}
```

---

## Testing with Postman

### Setup Collection

1. **Create new request:**
   - **Name:** Get Missed Activities
   - **Method:** GET
   - **URL:** `{{base_url}}/api/activity-plans/missed-summary`

2. **Add Query Params:**
   ```
   Key: sales_name    Value: John
   Key: month         Value: 2
   Key: year          Value: 2026
   Key: state         Value: Banten
   ```

3. **Send Request** and verify response

### Example Test Scenarios

#### Scenario 1: All missed activities
```
GET {{base_url}}/api/activity-plans/missed-summary
```
Expected: All missed activities without any filter

#### Scenario 2: Missed activities for specific month
```
GET {{base_url}}/api/activity-plans/missed-summary?month=2&year=2026
```
Expected: Only missed activities in February 2026

#### Scenario 3: Missed activities by sales
```
GET {{base_url}}/api/activity-plans/missed-summary?sales_name=John
```
Expected: Only missed activities handled by sales containing "John"

#### Scenario 4: Missed activities in specific region
```
GET {{base_url}}/api/activity-plans/missed-summary?state=Banten
```
Expected: Only missed activities for customers in Banten

---

## Installation Steps

### 1. Copy Files

```bash
# Copy Repository
cp MissedActivityRepository.php backend/app/Repositories/

# Copy Controller
cp MissedActivityController.php backend/app/Http/Controllers/Api/
```

### 2. Update Routes

Add to `backend/routes/api.php`:

```php
use App\Http\Controllers\Api\MissedActivityController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/missed-summary', [MissedActivityController::class, 'index']);
});
```

### 3. Clear Cache

```bash
cd backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 4. Test Endpoint

```bash
# Simple test
curl http://localhost:8000/api/activity-plans/missed-summary

# With filters
curl "http://localhost:8000/api/activity-plans/missed-summary?month=2&year=2026"
```

---

## Notes

### Count Logic
- **visit_count**: Bernilai 1 jika `tujuan = 'Visit'`, 0 jika selain itu
- **follow_up_count**: Bernilai 1 jika `tujuan = 'Follow Up'`, 0 jika selain itu
- Setiap row = 1 activity, jadi count selalu 0 atau 1

### Date Format
- Default format: **"Jumat, 06 Feb 2026"** (Hari, DD Bulan YYYY)
- Jika formatting gagal: fallback ke **yyyy-mm-dd**
- Format menggunakan nama hari & bulan dalam Bahasa Indonesia

### Data Filtering
- **Status**: Hardcoded hanya 'missed'
- **Duplicate ID**: Ambil row dengan `updated_at` paling baru
- **Null customer_id**: Diabaikan dari hasil
- **State**: Selalu dari `master_customer.state`, bukan dari `activity_plans.state`

### Sorting
- Primary: `plan_date DESC` (terbaru dulu)
- Secondary: `customer_name ASC` (A-Z)

---

## Troubleshooting

### No data returned
- Check apakah ada data dengan status = 'missed' di database
- Verify filter bulan/tahun sudah benar
- Coba tanpa filter dulu

### Date format wrong
- Check format `plan_date` di BigQuery (harus DATE type)
- Verify timezone settings di PHP

### Sales name not found
- Verify join dengan `master_sales` berhasil
- Check `sales_internal_id` di `activity_plans` match dengan `internal_id` di `master_sales`

### Duplicate results
- Verify logic ROW_NUMBER() sudah benar
- Check apakah ada multiple rows dengan `updated_at` sama persis
