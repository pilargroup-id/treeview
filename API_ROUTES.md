# API Routes untuk Activity Plans Weekly Summary

## Tambahkan di file: routes/api.php

```php
use App\Http\Controllers\Api\ActivityPlanController;

Route::prefix('activity-plans')->group(function () {
    Route::get('/weekly-summary', [ActivityPlanController::class, 'weeklySummary']);
});
```

## Endpoint Details

### GET /api/activity-plans/weekly-summary

**URL:** `http://your-domain.com/api/activity-plans/weekly-summary`

**Method:** GET

**Query Parameters:**

| Parameter      | Type    | Required | Description                                    | Example                    |
|---------------|---------|----------|------------------------------------------------|----------------------------|
| customer_name | string  | No       | Search customer name (partial, case-insensitive) | `customer_name=BAJA SAKTI` |
| months[]      | array   | No       | Array of months (1-12), max 3 months          | `months[]=1&months[]=2`    |
| year          | integer | No       | Year (2000-2100)                              | `year=2026`                |
| state         | string  | No       | Filter by wilayah from master_customer        | `state=Banten`             |
| status        | string  | No       | Filter by status: done or missed              | `status=done`              |
| tujuan        | string  | No       | Filter by tujuan: Visit or Follow Up          | `tujuan=Visit`             |

**Default Behavior (if not specified):**
- `status`: Only 'done' and 'missed' activities (both included)
- `tujuan`: Only 'Visit' and 'Follow Up' activities (both included)
- Other filters: No filter applied

---

## Example Requests

### 1. Get all data (no filters)
```
GET /api/activity-plans/weekly-summary
```

### 2. Filter by customer name
```
GET /api/activity-plans/weekly-summary?customer_name=BAJA
```

### 3. Filter by 3 months in 2026
```
GET /api/activity-plans/weekly-summary?months[]=1&months[]=2&months[]=3&year=2026
```

### 4. Filter by status done only
```
GET /api/activity-plans/weekly-summary?status=done
```

### 5. Filter by tujuan Visit only
```
GET /api/activity-plans/weekly-summary?tujuan=Visit
```

### 6. Filter by state (wilayah)
```
GET /api/activity-plans/weekly-summary?state=Banten
```

### 7. Combined filters
```
GET /api/activity-plans/weekly-summary?months[]=1&months[]=2&year=2026&status=done&tujuan=Visit&state=Banten&customer_name=BAJA
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [
    {
      "wilayah": "Banten",
      "customer": "BAJA SAKTI",
      "months": [
        {
          "month_name": "January",
          "year": 2026,
          "week1": 3,
          "week2": null,
          "week3": null,
          "week4": null,
          "week5": null
        },
        {
          "month_name": "February",
          "year": 2026,
          "week1": 8,
          "week2": 10,
          "week3": 15,
          "week4": null,
          "week5": null
        },
        {
          "month_name": "March",
          "year": 2026,
          "week1": null,
          "week2": null,
          "week3": null,
          "week4": 22,
          "week5": null
        }
      ]
    },
    {
      "wilayah": "DKI Jakarta",
      "customer": "MITRA LOGAM JAYA",
      "months": [
        {
          "month_name": "January",
          "year": 2026,
          "week1": null,
          "week2": 5,
          "week3": null,
          "week4": null,
          "week5": null
        }
      ]
    }
  ],
  "filters_applied": {
    "months": [1, 2, 3],
    "year": 2026,
    "status": "done"
  }
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
    "months": [
      "The months must not have more than 3 items."
    ],
    "status": [
      "The selected status is invalid."
    ]
  }
}
```

---

## Notes

1. **Week Calculation:** 
   - Week 1 starts from the first day of the month (excluding Sunday)
   - Each week contains 6 days (Monday-Saturday)
   - Sundays are excluded from calculation
   - A month can have 4-6 weeks depending on the calendar

2. **Null Values:** 
   - `null` means no activity in that week
   - Not represented as "-" or "0", just plain `null`

3. **Customer Filter:**
   - Customers with `customer_id = NULL` are excluded
   - Only customers from `master_customer` are included

4. **Default Filters:**
   - If `status` not specified: includes both 'done' and 'missed'
   - If `tujuan` not specified: includes both 'Visit' and 'Follow Up'

5. **State (Wilayah):**
   - Always taken from `master_customer.state`
   - `activity_plans.state` is ignored

6. **Sorting:**
   - Data sorted by: wilayah → customer_name → year → month → week

---

## Testing with Postman

1. **Import as Collection:**
   - Create new request
   - Set method: GET
   - URL: `{{base_url}}/api/activity-plans/weekly-summary`

2. **Add Query Params in Params tab:**
   ```
   Key: months[]    Value: 1
   Key: months[]    Value: 2
   Key: year        Value: 2026
   Key: status      Value: done
   Key: tujuan      Value: Visit
   ```

3. **Send Request** and check response
