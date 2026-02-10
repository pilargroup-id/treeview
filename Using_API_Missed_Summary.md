# Monthly Visit Summary API Documentation

## Routes Setup

### Tambahkan di file: routes/api.php

```php
use App\Http\Controllers\Api\MonthlyVisitController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
    Route::get('/monthly-visit', [MonthlyVisitController::class, 'index']);
    Route::get('/details', [ActivityDetailController::class, 'index']);
});
```

**NOTE:** URL berubah dari `/missed-summary` menjadi `/monthly-visit`

---

## Endpoint Details

### GET /api/activity-plans/monthly-visit

**URL:** `http://your-domain.com/api/activity-plans/monthly-visit`

**Method:** GET

**Description:** Menampilkan summary aktivitas per customer per bulan dengan breakdown:
- Done Visit count (status = done, tujuan = Visit)
- Done Follow Up count (status = done, tujuan = Follow Up)
- Missed count (status = missed, semua tujuan)

**Query Parameters:**

| Parameter   | Type    | Required | Description                                      | Example              |
|------------|---------|----------|--------------------------------------------------|----------------------|
| sales_name | string  | No       | Search sales name (partial, case-insensitive)    | `sales_name=John`    |
| month      | integer | No       | Filter by month (1-12)                           | `month=2`            |
| year       | integer | No       | Filter by year (2000-2100)                       | `year=2026`          |
| state      | string  | No       | Filter by wilayah from master_customer           | `state=Banten`       |

**Notes:**
- Data diagregasi per customer per bulan
- Menghitung activities dengan status **done** (Visit & Follow Up terpisah)
- Menghitung activities dengan status **missed** (semua tujuan)
- Customer dengan `customer_id = NULL` excluded
- Data sorted by: `customer_name ASC, year DESC, month DESC`

---

## Example Requests

### 1. Get all monthly visit summaries
```
GET /api/activity-plans/monthly-visit
```

### 2. Filter by sales name
```
GET /api/activity-plans/monthly-visit?sales_name=John
```

### 3. Filter by specific month & year
```
GET /api/activity-plans/monthly-visit?month=2&year=2026
```

### 4. Filter by state (wilayah)
```
GET /api/activity-plans/monthly-visit?state=Banten
```

### 5. Combined filters
```
GET /api/activity-plans/monthly-visit?sales_name=John&month=2&year=2026&state=Banten
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
      "year": 2026,
      "month": 2,
      "month_name": "February",
      "done_visit_count": 8,
      "done_follow_up_count": 5,
      "missed_count": 3
    },
    {
      "customer_name": "CV ANUGRAH STEEL",
      "sales_name": "John Doe",
      "wilayah": "Jawa Barat",
      "year": 2026,
      "month": 2,
      "month_name": "February",
      "done_visit_count": 4,
      "done_follow_up_count": 6,
      "missed_count": 2
    },
    {
      "customer_name": "MITRA LOGAM JAYA",
      "sales_name": "Jane Smith",
      "wilayah": "DKI Jakarta",
      "year": 2026,
      "month": 1,
      "month_name": "January",
      "done_visit_count": 3,
      "done_follow_up_count": 2,
      "missed_count": 5
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
- **wilayah**: State/wilayah dari `master_customer`
- **year**: Tahun
- **month**: Bulan (1-12)
- **month_name**: Nama bulan (January, February, etc.)
- **done_visit_count**: Total activities dengan status = 'done' AND tujuan = 'Visit' di bulan tersebut
- **done_follow_up_count**: Total activities dengan status = 'done' AND tujuan = 'Follow Up' di bulan tersebut
- **missed_count**: Total activities dengan status = 'missed' (semua tujuan) di bulan tersebut

### Count Calculation Logic:

```sql
-- Done Visit
SUM(CASE WHEN status = 'done' AND tujuan = 'Visit' THEN 1 ELSE 0 END)

-- Done Follow Up
SUM(CASE WHEN status = 'done' AND tujuan = 'Follow Up' THEN 1 ELSE 0 END)

-- Missed (all tujuan)
SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END)
```

**Example Scenario:**

Customer "BAJA SAKTI" di bulan Februari 2026 punya:
- 8 activities: status = 'done', tujuan = 'Visit'
- 5 activities: status = 'done', tujuan = 'Follow Up'
- 2 activities: status = 'missed', tujuan = 'Visit'
- 1 activity: status = 'missed', tujuan = 'Follow Up'

Output:
```json
{
  "done_visit_count": 8,
  "done_follow_up_count": 5,
  "missed_count": 3
}
```

---

## Error Responses

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
   - **Name:** Get Monthly Visit Summary
   - **Method:** GET
   - **URL:** `{{base_url}}/api/activity-plans/monthly-visit`

2. **Add Query Params:**
   ```
   Key: sales_name    Value: John
   Key: month         Value: 2
   Key: year          Value: 2026
   Key: state         Value: Banten
   ```

3. **Send Request** and verify response

### Example Test Scenarios

#### Scenario 1: All monthly summaries
```
GET {{base_url}}/api/activity-plans/monthly-visit
```
Expected: All customers with their monthly activity counts

#### Scenario 2: Specific month
```
GET {{base_url}}/api/activity-plans/monthly-visit?month=2&year=2026
```
Expected: Only February 2026 data

#### Scenario 3: By sales
```
GET {{base_url}}/api/activity-plans/monthly-visit?sales_name=John
```
Expected: Only customers handled by sales containing "John"

---

## Installation Steps

### 1. Copy Files

```bash
# Copy Repository (NAMA FILE BERUBAH!)
cp MonthlyVisitRepository.php backend/app/Repositories/

# Copy Controller (NAMA FILE BERUBAH!)
cp MonthlyVisitController.php backend/app/Http/Controllers/Api/
```

### 2. Update Routes (URL BERUBAH!)

Edit `backend/routes/api.php`:

**HAPUS route lama:**
```php
Route::get('/missed-summary', [MissedActivityController::class, 'index']);
```

**TAMBAH route baru:**
```php
use App\Http\Controllers\Api\MonthlyVisitController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/monthly-visit', [MonthlyVisitController::class, 'index']);
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
curl http://localhost:8000/api/activity-plans/monthly-visit

# With filters
curl "http://localhost:8000/api/activity-plans/monthly-visit?month=2&year=2026"
```

---

## Migration Guide (from old endpoint)

### What Changed:

| Item | Old (missed-summary) | New (monthly-visit) |
|------|---------------------|---------------------|
| **URL** | `/api/activity-plans/missed-summary` | `/api/activity-plans/monthly-visit` |
| **Repository** | `MissedActivityRepository` | `MonthlyVisitRepository` |
| **Controller** | `MissedActivityController` | `MonthlyVisitController` |
| **Output Fields** | `visit_count`, `follow_up_count`, `missed_count` | `done_visit_count`, `done_follow_up_count`, `missed_count` |
| **Status Filter** | Hardcoded to 'missed' only | Includes both 'done' and 'missed' |

### Frontend Code Changes:

**Before:**
```javascript
const response = await fetch('/api/activity-plans/missed-summary?month=2&year=2026');
const data = response.data;
console.log(data.visit_count); // old field name
```

**After:**
```javascript
const response = await fetch('/api/activity-plans/monthly-visit?month=2&year=2026');
const data = response.data;
console.log(data.done_visit_count); // new field name
console.log(data.done_follow_up_count);
console.log(data.missed_count);
```

---

## Use Cases

### Use Case 1: Monthly Performance Dashboard
Show customer activities for a specific month
```
GET /api/activity-plans/monthly-visit?month=2&year=2026
```

Display in table:
```
Customer          | Sales    | Done Visit | Done Follow Up | Missed | Total
BAJA SAKTI        | John Doe | 8          | 5              | 3      | 16
CV ANUGRAH STEEL  | John Doe | 4          | 6              | 2      | 12
```

Calculate total: `done_visit_count + done_follow_up_count + missed_count`

### Use Case 2: Sales Performance
```
GET /api/activity-plans/monthly-visit?sales_name=John&year=2026
```

Aggregate by sales to see total performance across all customers.

### Use Case 3: Success Rate Analysis
```javascript
const successRate = (
  (data.done_visit_count + data.done_follow_up_count) / 
  (data.done_visit_count + data.done_follow_up_count + data.missed_count) * 100
).toFixed(1);
```

---

## Frontend Integration Tips

### Display in Table
```javascript
<table>
  <thead>
    <tr>
      <th>Customer</th>
      <th>Sales</th>
      <th>Wilayah</th>
      <th>Month</th>
      <th>Done Visit</th>
      <th>Done Follow Up</th>
      <th>Missed</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => (
      <tr key={`${row.customer_name}-${row.year}-${row.month}`}>
        <td>{row.customer_name}</td>
        <td>{row.sales_name}</td>
        <td>{row.wilayah}</td>
        <td>{row.month_name} {row.year}</td>
        <td>{row.done_visit_count}</td>
        <td>{row.done_follow_up_count}</td>
        <td>{row.missed_count}</td>
        <td>{row.done_visit_count + row.done_follow_up_count + row.missed_count}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Calculate Success Rate
```javascript
const total = row.done_visit_count + row.done_follow_up_count + row.missed_count;
const successCount = row.done_visit_count + row.done_follow_up_count;
const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : 0;
```

### Filter Component
```javascript
const [filters, setFilters] = useState({
  month: null,
  year: new Date().getFullYear(),
  sales_name: '',
  state: ''
});

const fetchData = async () => {
  const params = new URLSearchParams();
  if (filters.month) params.append('month', filters.month);
  if (filters.year) params.append('year', filters.year);
  if (filters.sales_name) params.append('sales_name', filters.sales_name);
  if (filters.state) params.append('state', filters.state);
  
  const response = await fetch(`/api/activity-plans/monthly-visit?${params}`);
  const data = await response.json();
};
```

---

## Troubleshooting

### No data returned
- Check if there are activities in the specified month/year
- Verify filter values are correct
- Try without filters first

### Counts seem wrong
- Verify `status` values in database (should be 'done' or 'missed')
- Verify `tujuan` values (should be 'Visit' or 'Follow Up')
- Check for duplicate IDs (should be handled by ROW_NUMBER)

### Old endpoint still accessible
- Clear routes cache: `php artisan route:clear`
- Check routes file for old endpoint definition
- Verify old controller/repository files are removed/renamed