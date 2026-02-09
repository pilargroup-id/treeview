# Activity Details API Documentation

## Routes Setup

### Tambahkan di file: routes/api.php

```php
use App\Http\Controllers\Api\ActivityDetailController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
    Route::get('/missed-summary', [MissedActivityController::class, 'index']);
    Route::get('/details', [ActivityDetailController::class, 'index']);
});
```

---

## Endpoint Details

### GET /api/activity-plans/details

**URL:** `http://your-domain.com/api/activity-plans/details`

**Method:** GET

**Description:** Menampilkan detail activity per row dengan informasi lengkap termasuk foto user

**Query Parameters:**

| Parameter     | Type   | Required | Description                                      | Example                           |
|--------------|--------|----------|--------------------------------------------------|-----------------------------------|
| start_date   | string | No       | Start date in Y-m-d format                       | `start_date=2026-02-01`           |
| end_date     | string | No       | End date in Y-m-d format (max 31 days from start)| `end_date=2026-02-28`             |
| state        | string | No       | Filter by wilayah from master_customer           | `state=Banten`                    |
| sales_name   | string | No       | Search sales name (partial, case-insensitive)    | `sales_name=John`                 |
| customer_name| string | No       | Search customer name (partial, case-insensitive) | `customer_name=BAJA`              |

**Validation Rules:**
- `start_date` and `end_date` must be valid date in `Y-m-d` format
- `end_date` must be after or equal to `start_date`
- Date range cannot exceed 31 days (1 month)
- Customer with `customer_id = NULL` are excluded
- Rows with `deleted_at IS NOT NULL` are excluded

---

## Example Requests

### 1. Get all activities (no filters)
```
GET /api/activity-plans/details
```

### 2. Filter by date range (February 2026)
```
GET /api/activity-plans/details?start_date=2026-02-01&end_date=2026-02-28
```

### 3. Filter by date range (1 week)
```
GET /api/activity-plans/details?start_date=2026-02-01&end_date=2026-02-07
```

### 4. Filter by sales name
```
GET /api/activity-plans/details?sales_name=John
```

### 5. Filter by customer name
```
GET /api/activity-plans/details?customer_name=BAJA
```

### 6. Filter by state (wilayah)
```
GET /api/activity-plans/details?state=Banten
```

### 7. Combined filters
```
GET /api/activity-plans/details?start_date=2026-02-01&end_date=2026-02-28&state=Banten&sales_name=John&customer_name=BAJA
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
      "sales_name": "John Doe",
      "wilayah": "Banten",
      "customer_name": "BAJA SAKTI",
      "plan_date": "Jumat, 06 Feb 2026",
      "result_location_accuracy": 15.5,
      "result": "Sudah bertemu dengan customer, deal untuk order bulan depan",
      "user_photo": "https://touchpoint.pilargroup.id/storage/user-photos/user-3355-1770258761.jpg"
    },
    {
      "sales_name": "Jane Smith",
      "wilayah": "DKI Jakarta",
      "customer_name": "MITRA LOGAM JAYA",
      "plan_date": "Kamis, 05 Feb 2026",
      "result_location_accuracy": 8.3,
      "result": "Customer sedang tidak ada, reschedule minggu depan",
      "user_photo": "https://touchpoint.pilargroup.id/storage/user-photos/user-4521-1770259832.jpg"
    },
    {
      "sales_name": "John Doe",
      "wilayah": "Jawa Barat",
      "customer_name": "CV ANUGRAH STEEL",
      "plan_date": "Rabu, 04 Feb 2026",
      "result_location_accuracy": null,
      "result": null,
      "user_photo": null
    }
  ],
  "filters_applied": {
    "start_date": "2026-02-01",
    "end_date": "2026-02-28",
    "state": "Banten"
  }
}
```

**Output Explanation:**
- **sales_name**: Nama sales dari `master_sales`
- **wilayah**: State/wilayah dari `master_customer.state`
- **customer_name**: Nama customer dari `master_customer`
- **plan_date**: Tanggal dalam format "Jumat, 06 Feb 2026"
- **result_location_accuracy**: Akurasi lokasi (float, bisa null)
- **result**: Hasil kunjungan/activity (text, bisa null)
- **user_photo**: Full URL foto user (null jika tidak ada)

**Photo URL Format:**
- Base URL: `https://touchpoint.pilargroup.id`
- Path dari database: `/storage/user-photos/user-3355-1770258761.jpg`
- Final URL: `https://touchpoint.pilargroup.id/storage/user-photos/user-3355-1770258761.jpg`

### Error Response (422 Validation Error - Date Range Too Long)

```json
{
  "success": false,
  "message": "Date range cannot exceed 1 month (31 days)",
  "error": "Date range is 45 days. Maximum is 31 days."
}
```

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
    "start_date": [
      "The start date does not match the format Y-m-d."
    ],
    "end_date": [
      "The end date must be a date after or equal to start date."
    ]
  }
}
```

---

## Testing with Postman

### Setup Collection

1. **Create new request:**
   - **Name:** Get Activity Details
   - **Method:** GET
   - **URL:** `{{base_url}}/api/activity-plans/details`

2. **Add Query Params:**
   ```
   Key: start_date      Value: 2026-02-01
   Key: end_date        Value: 2026-02-28
   Key: state           Value: Banten
   Key: sales_name      Value: John
   Key: customer_name   Value: BAJA
   ```

3. **Send Request** and verify response

### Example Test Scenarios

#### Scenario 1: All activities without filter
```
GET {{base_url}}/api/activity-plans/details
```
Expected: All activities without any filter

#### Scenario 2: Activities in specific date range
```
GET {{base_url}}/api/activity-plans/details?start_date=2026-02-01&end_date=2026-02-28
```
Expected: Only activities in February 2026

#### Scenario 3: Activities by sales
```
GET {{base_url}}/api/activity-plans/details?sales_name=John
```
Expected: Only activities handled by sales containing "John"

#### Scenario 4: Activities in specific region
```
GET {{base_url}}/api/activity-plans/details?state=Banten
```
Expected: Only activities for customers in Banten

#### Scenario 5: Date range validation (should fail)
```
GET {{base_url}}/api/activity-plans/details?start_date=2026-01-01&end_date=2026-03-01
```
Expected: 422 error - date range exceeds 31 days

---

## Installation Steps

### 1. Copy Files

```bash
# Copy Repository
cp ActivityDetailRepository.php backend/app/Repositories/

# Copy Controller
cp ActivityDetailController.php backend/app/Http/Controllers/Api/
```

### 2. Update Routes

Add to `backend/routes/api.php`:

```php
use App\Http\Controllers\Api\ActivityDetailController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/details', [ActivityDetailController::class, 'index']);
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
curl http://localhost:8000/api/activity-plans/details

# With filters
curl "http://localhost:8000/api/activity-plans/details?start_date=2026-02-01&end_date=2026-02-28"
```

---

## Notes

### Date Range Validation
- Maximum range: **31 days** (1 month)
- Both `start_date` and `end_date` must be provided to validate range
- Format must be `Y-m-d` (e.g., 2026-02-01)
- `end_date` must be >= `start_date`

### Photo URL Construction
- **Base URL**: `https://touchpoint.pilargroup.id` (hardcoded)
- **Database path**: `/storage/user-photos/user-3355-1770258761.jpg`
- **Final URL**: Base URL + Database path
- If `user_photo` is null/empty → return `null`
- If path already starts with `http` → return as is

### Date Format
- Default format: **"Jumat, 06 Feb 2026"** (Hari, DD Bulan YYYY)
- Fallback to **yyyy-mm-dd** if formatting fails
- Format menggunakan nama hari & bulan dalam Bahasa Indonesia

### Data Filtering
- **Duplicate ID**: Ambil row dengan `updated_at` paling baru
- **Null customer_id**: Diabaikan dari hasil
- **Deleted records**: `deleted_at IS NOT NULL` diabaikan
- **State**: Selalu dari `master_customer.state`

### Sorting
- Primary: `plan_date DESC` (terbaru dulu)
- Secondary: `customer_name ASC` (A-Z)

---

## Troubleshooting

### No data returned
- Check filter date range
- Verify ada data di table `activity_plans`
- Try without filters first

### Photo URL not accessible
- Check base URL: `https://touchpoint.pilargroup.id`
- Verify path in database has correct format
- Check if file exists on server

### Date range validation fails
- Verify both start_date and end_date are provided
- Check format is Y-m-d
- Ensure range is max 31 days

### Null values for result or photo
- Normal behavior - not all activities have result/photo
- Frontend should handle null values gracefully

---

## Frontend Integration Tips

### Display Photo
```javascript
// React example
{data.user_photo ? (
  <img src={data.user_photo} alt="User Photo" />
) : (
  <div>No Photo</div>
)}
```

### Date Range Picker
```javascript
// Validate date range on frontend before API call
const daysDiff = Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
if (daysDiff > 31) {
  alert('Date range cannot exceed 31 days');
  return;
}
```

### Handle Null Values
```javascript
// Check for null values
const result = data.result || 'No result available';
const accuracy = data.result_location_accuracy || 'N/A';
```