# Financial API Documentation

Dokumentasi lengkap untuk Financial API yang menggunakan data dari BigQuery (Financial GL, Invoice, Credit Memo, dan Bigseller).

---

## Table of Contents
1. [Overview](#overview)
2. [Endpoints](#endpoints)
   - [Monthly Revenue](#1-monthly-revenue)
   - [Invoice Sales](#2-invoice-sales)
   - [Last Update](#3-last-update)
3. [Business Units](#business-units)
4. [Date Filtering](#date-filtering)
5. [Response Format](#response-format)
6. [Example Usage](#example-usage)
7. [Caching](#caching)

---

## Overview

Financial API menyediakan 3 endpoint utama:
- **Monthly Revenue**: Revenue bulanan dari General Ledger
- **Invoice Sales**: Sales data dengan breakdown quantity, invoice count, dan credit memo
- **Last Update**: Informasi terakhir update data

**Base URL:** `/api/financial`

**Authentication:** None (sesuai dengan routes yang ada)

**Data Sources:**
- `even-gearbox-255203.ds_netbackup.financial_gl`
- `even-gearbox-255203.ds_netbackup.header_invoice`
- `even-gearbox-255203.ds_netbackup.detail_invoice`
- `even-gearbox-255203.ds_netbackup.credit_memo_item`
- `even-gearbox-255203.ds_bigseller.bigseller_orders_*`

---

## Endpoints

### 1. Monthly Revenue

**Endpoint:** `GET /api/financial/monthly-revenue`

**Description:** Mendapatkan revenue bulanan dari General Ledger berdasarkan account header tertentu.

**Query Parameters:**

| Parameter      | Type   | Required | Description                           | Example          |
|---------------|--------|----------|---------------------------------------|------------------|
| account_header| string | Yes      | Account header code                   | `4000.00.00`     |
| start_date    | string | Yes      | Start date (Y-m-d format)             | `2026-01-01`     |
| end_date      | string | Yes      | End date (Y-m-d format)               | `2026-12-31`     |
| business_units| array  | No       | Filter by business units              | `['Gosave']`     |

**Business Units Options:**
- `Gosave` (includes: Gosave GT, Gosave B2B, Gosave E-Com)
- `Goto` (includes: GOTO GT, Store, GOTO E-Com)

**Request Example:**
```
GET /api/financial/monthly-revenue?account_header=4000.00.00&start_date=2026-01-01&end_date=2026-12-31&business_units[]=Gosave
```

**Response Example:**
```json
{
  "status": "success",
  "data": [
    {
      "period": "2026-01",
      "period_label": "January 2026",
      "year": 2026,
      "month": 1,
      "total_credit": 15000000.50,
      "total_debit": 2000000.00,
      "total_difference": 13000000.50
    },
    {
      "period": "2026-02",
      "period_label": "February 2026",
      "year": 2026,
      "month": 2,
      "total_credit": 18000000.00,
      "total_debit": 3000000.00,
      "total_difference": 15000000.00
    }
  ]
}
```

**Field Explanation:**
- `period`: Format YYYY-MM untuk grouping
- `period_label`: Label bulan yang human-readable
- `total_credit`: Total credit dari GL
- `total_debit`: Total debit dari GL
- `total_difference`: Credit - Debit (revenue bersih)

**Validation Errors:**
```json
{
  "status": "error",
  "errors": {
    "account_header": ["The account header field is required."],
    "start_date": ["The start date must be a valid date."],
    "end_date": ["The end date must be a date after or equal to start date."]
  }
}
```

---

### 2. Invoice Sales

**Endpoint:** `GET /api/financial/invoice-sales`

**Description:** Mendapatkan data sales dengan breakdown:
- Revenue dari General Ledger
- Total quantity dari invoice details
- Credit memo quantity (retur)
- Invoice count (dari Gosave atau Bigseller)

**Query Parameters:**

| Parameter         | Type   | Required | Description                              | Example                    |
|------------------|--------|----------|------------------------------------------|----------------------------|
| business_units   | array  | No       | Main business units filter               | `['Gosave','Goto']`        |
| sub_business_units| array | No       | Specific departments (prioritized)       | `['Gosave GT','GOTO E-Com']`|
| date_type        | string | No       | Type of date filtering                   | `year`                     |
| years            | array  | No       | Filter by years (for date_type=year)     | `[2025,2026]`              |
| start_date       | string | No       | Start date (for date_type=range)         | `2026-01-01`               |
| end_date         | string | No       | End date (for date_type=range)           | `2026-01-31`               |
| specific_dates   | array  | No       | Array of specific dates (max 30)         | `['2026-01-15','2026-02-20']`|
| compare_dates    | array  | No       | Dates to compare (format: m-d)           | `['01-15','02-15']`        |
| compare_years    | array  | No       | Years for comparison                     | `[2025,2026]`              |
| date_ranges      | array  | No       | Multiple date ranges (max 5, max 31 days each) | See below            |

**Date Type Options:**

1. **`year`** - Monthly aggregation for selected years
2. **`range`** - Single date range
3. **`specific`** - Specific dates (max 30 dates)
4. **`compare_year`** - Compare same dates across different years
5. **`multi_range`** - Multiple date ranges (max 5 ranges, each max 31 days)

**Business Units vs Sub Business Units:**

| Main Unit | Sub Units                                    |
|-----------|----------------------------------------------|
| Gosave    | Gosave GT, Gosave B2B, Gosave E-Com          |
| Goto      | GOTO GT, Store, GOTO E-Com                   |

**Priority:** If `sub_business_units` provided, it overrides `business_units`

---

#### Request Examples:

**Example 1: Monthly data for 2026**
```
GET /api/financial/invoice-sales?date_type=year&years[]=2026&business_units[]=Gosave
```

**Example 2: Date range**
```
GET /api/financial/invoice-sales?date_type=range&start_date=2026-01-01&end_date=2026-01-31&business_units[]=Gosave&business_units[]=Goto
```

**Example 3: Specific sub business units**
```
GET /api/financial/invoice-sales?date_type=year&years[]=2026&sub_business_units[]=Gosave GT&sub_business_units[]=GOTO E-Com
```

**Example 4: Sub business units with date range**
```
GET /api/financial/invoice-sales?date_type=range&start_date=2026-01-01&end_date=2026-01-31&sub_business_units[]=Gosave%20GT&sub_business_units[]=Gosave%20B2B
```

**Example 5: Compare same dates across years**
```
GET /api/financial/invoice-sales?date_type=compare_year&compare_dates[]=01-15&compare_dates[]=02-20&compare_years[]=2025&compare_years[]=2026&business_units[]=Gosave
```

**Example 6: Multiple date ranges**
```json
{
  "date_type": "multi_range",
  "business_units": ["Gosave"],
  "date_ranges": [
    {
      "start": "2026-01-01",
      "end": "2026-01-15"
    },
    {
      "start": "2026-02-01",
      "end": "2026-02-15"
    }
  ]
}
```

**Response Example (Regular):**
```json
{
  "status": "success",
  "data": [
    {
      "period": "2026-01",
      "year": 2026,
      "business_unit": "Gosave GT",
      "month": 1,
      "total_sales": 50000000.00,
      "total_quantity": 1250,
      "credit_memo_qty": -50,
      "invoice_count": 320
    },
    {
      "period": "2026-01",
      "year": 2026,
      "business_unit": "GOTO E-Com",
      "month": 1,
      "total_sales": 35000000.00,
      "total_quantity": 890,
      "credit_memo_qty": -30,
      "invoice_count": 245
    }
  ]
}
```

**Response Example (Multi-Range):**
```json
{
  "status": "success",
  "data": [
    {
      "period": "Range 1: 01 Jan 2026 - 15 Jan 2026",
      "business_unit": "Gosave",
      "total_sales": 25000000.00,
      "total_quantity": 650,
      "credit_memo_qty": -20,
      "invoice_count": 180
    },
    {
      "period": "Range 2: 01 Feb 2026 - 15 Feb 2026",
      "business_unit": "Gosave",
      "total_sales": 28000000.00,
      "total_quantity": 720,
      "credit_memo_qty": -25,
      "invoice_count": 195
    }
  ]
}
```

**Field Explanation:**
- `period`: Period identifier (varies by date_type)
- `year`, `month`: Tahun dan bulan (if applicable)
- `business_unit`: Department name
- `total_sales`: Revenue dari GL (debit * -1 + credit)
- `total_quantity`: Total qty dari invoice details
- `credit_memo_qty`: Total qty credit memo (negative values)
- `invoice_count`: 
  - Gosave units: Count dari header_invoice
  - GOTO E-Com: Count dari bigseller_orders

**Account Headers Used for Revenue:**
```
'4000.00.00', '4000.01.00', '4000.08.00', '4000.01.10', 
'4000.01.11', '4000.01.12', '4000.01.13', '4000.02.00', 
'4000.03.00', '4000.04.00', '4000.05.00', '4000.06.00', 
'4000.07.00'
```

**Validation Rules:**
- `date_ranges`: Max 5 ranges
- Each range: Max 31 days
- `specific_dates`: Max 30 dates
- `years`: Must be between 2020-2030

---

### 3. Last Update

**Endpoint:** `GET /api/financial/last-update`

**Description:** Mendapatkan informasi tanggal terakhir data di-update.

**Query Parameters:** None

**Request Example:**
```
GET /api/financial/last-update
```

**Response Example:**
```json
{
  "status": "success",
  "data": [
    {
      "source_table": "Revenue",
      "last_date": "2026-02-10"
    }
  ]
}
```

---

## Business Units

### Main Business Units

```php
[
  'Gosave',  // Aggregates: Gosave GT, Gosave B2B, Gosave E-Com
  'Goto'     // Aggregates: GOTO GT, Store, GOTO E-Com
]
```

### Sub Business Units

```php
[
  // Gosave Sub-Units
  'Gosave GT',
  'Gosave B2B',
  'Gosave E-Com',
  
  // Goto Sub-Units
  'GOTO GT',
  'Store',
  'GOTO E-Com'
]
```

### Filtering Logic

**Scenario 1: Main business units only**
```
?business_units[]=Gosave
```
Result: Includes all Gosave sub-units (GT, B2B, E-Com)

**Scenario 2: Sub business units (prioritized)**
```
?sub_business_units[]=Gosave GT&sub_business_units[]=GOTO E-Com
```
Result: Only includes specified sub-units, ignores main business units

**Scenario 3: Mix of main and sub (sub takes priority)**
```
?business_units[]=Gosave&sub_business_units[]=GOTO E-Com
```
Result: Only includes GOTO E-Com (sub_business_units overrides business_units)

**Scenario 4: Multiple sub-units from same main unit**
```
?sub_business_units[]=Gosave GT&sub_business_units[]=Gosave B2B
```
Result: Only includes Gosave GT and Gosave B2B, excludes Gosave E-Com

**Scenario 5: All sub-units from Gosave**
```
?sub_business_units[]=Gosave GT&sub_business_units[]=Gosave B2B&sub_business_units[]=Gosave E-Com
```
Result: Same as `?business_units[]=Gosave` but explicitly specified

**Scenario 6: No filter**
```
No business_units or sub_business_units parameter
```
Result: Includes all business units

---

### Sub Business Units - Detailed Examples

#### Example 1: Single Sub-Unit Analysis
**Use Case:** Analyze only Gosave GT performance

```bash
# URL encoded version
GET /api/financial/invoice-sales?date_type=year&years[]=2026&sub_business_units[]=Gosave%20GT

# Or in JavaScript
const params = new URLSearchParams({
  date_type: 'year',
});
params.append('years[]', '2026');
params.append('sub_business_units[]', 'Gosave GT');

fetch(`/api/financial/invoice-sales?${params}`);
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "period": "2026-01",
      "year": 2026,
      "business_unit": "Gosave GT",
      "month": 1,
      "total_sales": 50000000.00,
      "total_quantity": 1250,
      "credit_memo_qty": -50,
      "invoice_count": 320
    }
  ]
}
```

#### Example 2: Compare Two Specific Sub-Units
**Use Case:** Compare Gosave GT vs GOTO E-Com

```bash
GET /api/financial/invoice-sales?date_type=range&start_date=2026-01-01&end_date=2026-01-31&sub_business_units[]=Gosave%20GT&sub_business_units[]=GOTO%20E-Com
```

**JavaScript:**
```javascript
const fetchSubUnitComparison = async () => {
  const params = new URLSearchParams({
    date_type: 'range',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
  });
  params.append('sub_business_units[]', 'Gosave GT');
  params.append('sub_business_units[]', 'GOTO E-Com');
  
  const response = await fetch(`/api/financial/invoice-sales?${params}`);
  const result = await response.json();
  
  // Group by business unit for comparison
  const comparison = {};
  result.data.forEach(item => {
    comparison[item.business_unit] = item;
  });
  
  console.log('Gosave GT:', comparison['Gosave GT']);
  console.log('GOTO E-Com:', comparison['GOTO E-Com']);
};
```

**Response:**
```json
{
  "data": [
    {
      "period": "2026-01-01",
      "business_unit": "Gosave GT",
      "total_sales": 25000000.00,
      "total_quantity": 650
    },
    {
      "period": "2026-01-01",
      "business_unit": "GOTO E-Com",
      "total_sales": 18000000.00,
      "total_quantity": 480
    }
  ]
}
```

#### Example 3: All Gosave Sub-Units (Explicit)
**Use Case:** Analyze all Gosave channels separately

```bash
GET /api/financial/invoice-sales?date_type=year&years[]=2026&sub_business_units[]=Gosave%20GT&sub_business_units[]=Gosave%20B2B&sub_business_units[]=Gosave%20E-Com
```

**React Component Example:**
```javascript
const GoSaveAnalysis = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams({ date_type: 'year' });
      params.append('years[]', '2026');
      params.append('sub_business_units[]', 'Gosave GT');
      params.append('sub_business_units[]', 'Gosave B2B');
      params.append('sub_business_units[]', 'Gosave E-Com');
      
      const response = await fetch(`/api/financial/invoice-sales?${params}`);
      const result = await response.json();
      setData(result.data);
    };
    
    fetchData();
  }, []);
  
  return (
    <div>
      {data.map(item => (
        <div key={item.business_unit}>
          <h3>{item.business_unit}</h3>
          <p>Sales: Rp {item.total_sales.toLocaleString()}</p>
          <p>Quantity: {item.total_quantity}</p>
        </div>
      ))}
    </div>
  );
};
```

#### Example 4: Monthly Revenue with Sub-Units
**Use Case:** Monthly revenue for specific department

```bash
GET /api/financial/monthly-revenue?account_header=4000.00.00&start_date=2026-01-01&end_date=2026-12-31&business_units[]=Gosave

# With sub_business_units (not applicable for monthly-revenue)
# Note: monthly-revenue endpoint uses business_units only, not sub_business_units
```

**Important:** `sub_business_units` parameter **ONLY** works for `/invoice-sales` endpoint, NOT for `/monthly-revenue`.

#### Example 5: Multi-Range with Sub-Units
**Use Case:** Compare promotional periods for specific channels

```javascript
const fetchCampaignBySub = async () => {
  const response = await fetch('/api/financial/invoice-sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_type: 'multi_range',
      sub_business_units: ['Gosave GT', 'GOTO E-Com'],
      date_ranges: [
        { start: '2026-01-01', end: '2026-01-15' },
        { start: '2026-02-01', end: '2026-02-15' },
      ]
    })
  });
  
  const result = await response.json();
  return result.data;
};
```

**Response:**
```json
{
  "data": [
    {
      "period": "Range 1: 01 Jan 2026 - 15 Jan 2026",
      "business_unit": "Gosave GT",
      "total_sales": 12000000.00
    },
    {
      "period": "Range 1: 01 Jan 2026 - 15 Jan 2026",
      "business_unit": "GOTO E-Com",
      "total_sales": 8000000.00
    },
    {
      "period": "Range 2: 01 Feb 2026 - 15 Feb 2026",
      "business_unit": "Gosave GT",
      "total_sales": 14000000.00
    },
    {
      "period": "Range 2: 01 Feb 2026 - 15 Feb 2026",
      "business_unit": "GOTO E-Com",
      "total_sales": 9000000.00
    }
  ]
}
```

---

### Sub Business Units - Common Patterns

#### Pattern 1: Department-Specific Dashboard
```javascript
// Show only Gosave GT data
const params = new URLSearchParams({
  date_type: 'year',
  'years[]': '2026',
  'sub_business_units[]': 'Gosave GT'
});
```

#### Pattern 2: Cross-Department Comparison
```javascript
// Compare GT channels across both brands
const params = new URLSearchParams({ date_type: 'range' });
params.set('start_date', '2026-01-01');
params.set('end_date', '2026-01-31');
params.append('sub_business_units[]', 'Gosave GT');
params.append('sub_business_units[]', 'GOTO GT');
```

#### Pattern 3: E-Commerce Focus
```javascript
// All E-Com channels
const params = new URLSearchParams({ date_type: 'year' });
params.append('years[]', '2026');
params.append('sub_business_units[]', 'Gosave E-Com');
params.append('sub_business_units[]', 'GOTO E-Com');
```

#### Pattern 4: Exclude Specific Channel
```javascript
// All Gosave except E-Com
const params = new URLSearchParams({ date_type: 'year' });
params.append('years[]', '2026');
params.append('sub_business_units[]', 'Gosave GT');
params.append('sub_business_units[]', 'Gosave B2B');
// Gosave E-Com excluded
```

---

### Query String Encoding

**URL Encoding for Sub-Units:**
```
Original: Gosave GT
Encoded:  Gosave%20GT

Original: GOTO E-Com
Encoded:  GOTO%20E-Com
```

**Full URL Examples:**
```bash
# Single sub-unit
/api/financial/invoice-sales?sub_business_units[]=Gosave%20GT

# Multiple sub-units
/api/financial/invoice-sales?sub_business_units[]=Gosave%20GT&sub_business_units[]=Gosave%20B2B

# With other parameters
/api/financial/invoice-sales?date_type=year&years[]=2026&sub_business_units[]=Gosave%20GT&sub_business_units[]=GOTO%20E-Com
```

**JavaScript Auto-Encoding:**
```javascript
// URLSearchParams handles encoding automatically
const params = new URLSearchParams();
params.append('sub_business_units[]', 'Gosave GT');  // Auto-encoded
params.append('sub_business_units[]', 'GOTO E-Com'); // Auto-encoded

console.log(params.toString());
// Output: sub_business_units[]=Gosave+GT&sub_business_units[]=GOTO+E-Com
```

---

### Validation Rules for Sub-Units

**Valid Values:**
```php
[
  'Gosave GT',
  'Gosave B2B', 
  'Gosave E-Com',
  'GOTO GT',
  'Store',
  'GOTO E-Com'
]
```

**Invalid Examples:**
```bash
# Wrong spelling
?sub_business_units[]=GoSave GT          # ❌ Case-sensitive
?sub_business_units[]=Gosave_GT          # ❌ Underscore instead of space

# Wrong value
?sub_business_units[]=Goto GT            # ❌ Should be "GOTO GT" (uppercase)
?sub_business_units[]=Gosave Ecom        # ❌ Should be "Gosave E-Com" (with hyphen)
```

**Error Response:**
```json
{
  "status": "error",
  "errors": {
    "sub_business_units.0": [
      "The selected sub_business_units.0 is invalid."
    ]
  }
}
```

---

## Date Filtering

### 1. Year (`date_type=year`)

**Use Case:** Monthly aggregation for specific years

**Parameters:**
```php
[
  'date_type' => 'year',
  'years' => [2025, 2026]
]
```

**Result Period Format:** `YYYY-MM` (e.g., "2026-01")

**Example:**
```
GET /api/financial/invoice-sales?date_type=year&years[]=2026
```

---

### 2. Range (`date_type=range`)

**Use Case:** Single continuous date range

**Parameters:**
```php
[
  'date_type' => 'range',
  'start_date' => '2026-01-01',
  'end_date' => '2026-01-31'
]
```

**Result Period Format:** `YYYY-MM-DD`

**Example:**
```
GET /api/financial/invoice-sales?date_type=range&start_date=2026-01-01&end_date=2026-01-31
```

---

### 3. Specific Dates (`date_type=specific`)

**Use Case:** Non-continuous specific dates (max 30 dates)

**Parameters:**
```php
[
  'date_type' => 'specific',
  'specific_dates' => ['2026-01-15', '2026-02-20', '2026-03-10']
]
```

**Result Period Format:** `YYYY-MM-DD`

**Example:**
```
GET /api/financial/invoice-sales?date_type=specific&specific_dates[]=2026-01-15&specific_dates[]=2026-02-20
```

---

### 4. Compare Year (`date_type=compare_year`)

**Use Case:** Compare same dates (MM-DD) across different years

**Parameters:**
```php
[
  'date_type' => 'compare_year',
  'compare_dates' => ['01-15', '02-20'],  // Format: MM-DD
  'compare_years' => [2025, 2026]
]
```

**Result Period Format:** `MM-DD` (e.g., "01-15")

**Example:**
```
GET /api/financial/invoice-sales?date_type=compare_year&compare_dates[]=01-15&compare_dates[]=02-20&compare_years[]=2025&compare_years[]=2026
```

**Response Structure:**
```json
{
  "data": [
    {
      "period": "01-15",
      "year": 2025,
      "business_unit": "Gosave GT",
      "total_sales": 5000000
    },
    {
      "period": "01-15",
      "year": 2026,
      "business_unit": "Gosave GT",
      "total_sales": 6000000
    }
  ]
}
```

---

### 5. Multi Range (`date_type=multi_range`)

**Use Case:** Compare multiple date ranges (max 5 ranges, each max 31 days)

**Parameters:**
```php
[
  'date_type' => 'multi_range',
  'date_ranges' => [
    ['start' => '2026-01-01', 'end' => '2026-01-15'],
    ['start' => '2026-02-01', 'end' => '2026-02-15']
  ]
]
```

**Result Period Format:** `Range X: DD Mon YYYY - DD Mon YYYY`

**Example (POST recommended for complex payload):**
```bash
curl -X GET "http://localhost:8000/api/financial/invoice-sales" \
  -H "Content-Type: application/json" \
  -d '{
    "date_type": "multi_range",
    "business_units": ["Gosave"],
    "date_ranges": [
      {"start": "2026-01-01", "end": "2026-01-15"},
      {"start": "2026-02-01", "end": "2026-02-15"}
    ]
  }'
```

**Validation:**
- Max 5 ranges
- Each range max 31 days
- Empty/invalid ranges are skipped

**Response Example:**
```json
{
  "data": [
    {
      "period": "Range 1: 01 Jan 2026 - 15 Jan 2026",
      "business_unit": "Gosave",
      "total_sales": 25000000.00
    },
    {
      "period": "Range 2: 01 Feb 2026 - 15 Feb 2026",
      "business_unit": "Gosave",
      "total_sales": 28000000.00
    }
  ]
}
```

---

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": [...]
}
```

### Error Response

**Validation Error (422):**
```json
{
  "status": "error",
  "errors": {
    "field_name": [
      "Error message"
    ]
  }
}
```

**Server Error (500):**
```json
{
  "status": "error",
  "message": "Error message from BigQuery"
}
```

---

## Example Usage

### Use Case 1: Monthly Revenue Report

**Goal:** Get monthly revenue for account 4000.00.00 in 2026 for Gosave

```bash
curl "http://localhost:8000/api/financial/monthly-revenue?account_header=4000.00.00&start_date=2026-01-01&end_date=2026-12-31&business_units[]=Gosave"
```

**Frontend Implementation (JavaScript):**
```javascript
const fetchMonthlyRevenue = async () => {
  const params = new URLSearchParams({
    account_header: '4000.00.00',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
  });
  params.append('business_units[]', 'Gosave');
  
  const response = await fetch(`/api/financial/monthly-revenue?${params}`);
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Revenue data:', data.data);
  }
};
```

---

### Use Case 2: Sales Comparison Between Gosave GT and GOTO E-Com

**Goal:** Compare sales performance of two specific departments in January 2026

```bash
curl "http://localhost:8000/api/financial/invoice-sales?date_type=range&start_date=2026-01-01&end_date=2026-01-31&sub_business_units[]=Gosave%20GT&sub_business_units[]=GOTO%20E-Com"
```

**Frontend Implementation (React):**
```javascript
const fetchSalesComparison = async () => {
  const params = new URLSearchParams({
    date_type: 'range',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
  });
  params.append('sub_business_units[]', 'Gosave GT');
  params.append('sub_business_units[]', 'GOTO E-Com');
  
  const response = await fetch(`/api/financial/invoice-sales?${params}`);
  const result = await response.json();
  
  return result.data;
};
```

---

### Use Case 3: Year-over-Year Comparison

**Goal:** Compare January 15 sales across 2025 and 2026

```bash
curl "http://localhost:8000/api/financial/invoice-sales?date_type=compare_year&compare_dates[]=01-15&compare_years[]=2025&compare_years[]=2026&business_units[]=Gosave"
```

**Frontend Implementation:**
```javascript
const fetchYoYComparison = async () => {
  const params = new URLSearchParams({
    date_type: 'compare_year',
  });
  params.append('compare_dates[]', '01-15');
  params.append('compare_years[]', '2025');
  params.append('compare_years[]', '2026');
  params.append('business_units[]', 'Gosave');
  
  const response = await fetch(`/api/financial/invoice-sales?${params}`);
  const result = await response.json();
  
  // Group by period for comparison
  const grouped = {};
  result.data.forEach(item => {
    if (!grouped[item.period]) {
      grouped[item.period] = {};
    }
    grouped[item.period][item.year] = item;
  });
  
  return grouped;
};
```

---

### Use Case 4: Multi-Range Campaign Analysis

**Goal:** Compare sales during 3 promotional periods

```javascript
const fetchCampaignAnalysis = async () => {
  const payload = {
    date_type: 'multi_range',
    business_units: ['Gosave', 'Goto'],
    date_ranges: [
      { start: '2026-01-01', end: '2026-01-15' }, // Campaign 1
      { start: '2026-02-01', end: '2026-02-14' }, // Campaign 2
      { start: '2026-03-01', end: '2026-03-15' }  // Campaign 3
    ]
  };
  
  const response = await fetch('/api/financial/invoice-sales', {
    method: 'POST', // or use GET with query params
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  return result.data;
};
```

---

## Caching

All financial endpoints use file-based caching with **30 minutes TTL** (1800 seconds).

**Cache Keys:**
- Monthly Revenue: `monthly_revenue_{account_header}_{start_date}_{end_date}_{business_units_hash}`
- Invoice Sales: `invoice_sales_gl_{params_hash}`
- Multi Range: `multi_range_comparison_gl_{params_hash}`
- Last Update: `last_update_info`

**Cache Storage:** `storage/framework/cache/data`

**Clear Cache:**
```bash
php artisan cache:clear
```

**Disable Cache (for testing):**
Edit `FinancialRepository.php`, comment out the cache wrapper:
```php
// return Cache::store('file')->remember($cacheKey, 1800, function () use ($query) {
    return $this->bigQueryService->runQuery($query);
// });
```

---

## Data Sources Details

### Tables Used

**1. financial_gl**
- Revenue calculations (credit - debit)
- Fields: `account_header`, `date`, `department_name`, `credit`, `debit`

**2. header_invoice**
- Invoice data for Gosave units
- Fields: `internal_id`, `invoice_number`, `date`, `department`, `approval_status`

**3. detail_invoice**
- Quantity details per invoice
- Fields: `invoice_number`, `quantity`

**4. credit_memo_item**
- Credit memo (retur) tracking
- Fields: `h_date`, `h_department_name`, `h_status`, `d_quantity`

**5. bigseller_orders_***
- GOTO E-Com order data from Bigseller
- Tables: 2023, 2024, 2025, 2026, 2027
- Fields: `nomor_pesanan`, `waktu_pesanan_dibuat`, `status_pesanan`

---

## Troubleshooting

### Issue: No data returned

**Possible causes:**
- Wrong `account_header` (for monthly-revenue)
- Date range outside available data
- Wrong business unit names
- Cache issue

**Solutions:**
1. Check if data exists in BigQuery
2. Verify date format (Y-m-d)
3. Clear cache: `php artisan cache:clear`
4. Check business unit spelling

---

### Issue: Validation error

**Common errors:**
```json
{
  "errors": {
    "end_date": ["The end date must be a date after or equal to start date."]
  }
}
```

**Solutions:**
- Check date format: Must be `Y-m-d` (e.g., 2026-01-15)
- Ensure `end_date >= start_date`
- For multi_range: Each range max 31 days
- For specific: Max 30 dates

---

### Issue: Slow response

**Causes:**
- Complex multi-range query
- Large date range
- Cache expired

**Solutions:**
- Use smaller date ranges
- Enable/verify caching
- Optimize date_type selection
- Use `year` instead of `specific` for monthly data

---

### Issue: Missing invoice_count for some business units

**Expected behavior:**
- `invoice_count` only populated for:
  - Gosave GT, Gosave B2B, Gosave E-Com (from header_invoice)
  - GOTO E-Com (from bigseller_orders)
- Other units will show `invoice_count: 0`

**Not a bug:** This is by design, as other units don't have invoice tracking in the current data sources.

---

## Testing with Postman

### Collection Setup

**Environment Variables:**
```
base_url: http://localhost:8000/api
```

### Test Scenarios

**1. Monthly Revenue - Basic**
```
GET {{base_url}}/financial/monthly-revenue
Params:
  account_header: 4000.00.00
  start_date: 2026-01-01
  end_date: 2026-12-31
```

**2. Invoice Sales - All Units**
```
GET {{base_url}}/financial/invoice-sales
Params:
  date_type: year
  years[]: 2026
```

**3. Invoice Sales - Specific Sub Units**
```
GET {{base_url}}/financial/invoice-sales
Params:
  date_type: range
  start_date: 2026-01-01
  end_date: 2026-01-31
  sub_business_units[]: Gosave GT
  sub_business_units[]: GOTO E-Com
```

**4. Invoice Sales - Multiple Gosave Sub-Units**
```
GET {{base_url}}/financial/invoice-sales
Params:
  date_type: year
  years[]: 2026
  sub_business_units[]: Gosave GT
  sub_business_units[]: Gosave B2B
  sub_business_units[]: Gosave E-Com
```

**5. Last Update Info**
```
GET {{base_url}}/financial/last-update
```

---

## Performance Notes

**Query Complexity:**
- `year`: Medium (monthly aggregation)
- `range`: Low (single range)
- `specific`: Medium (multiple date conditions)
- `compare_year`: High (cross-year comparison)
- `multi_range`: Very High (multiple independent queries + unions)

**Recommendations:**
- Use `year` for monthly reports
- Use `range` for single period analysis
- Limit `multi_range` to max 3 ranges when possible
- Always specify business_units filter when possible to reduce data volume

---

## Notes

1. **Revenue Calculation:**
   - Formula: `(debit * -1) + credit`
   - From financial_gl table
   - Multiple account headers summed together

2. **Credit Memo:**
   - Only `Fully Applied` status
   - Negative quantities only (`d_quantity < 0`)

3. **Invoice Count:**
   - Gosave: Count distinct invoice_number from header_invoice
   - GOTO E-Com: Count distinct nomor_pesanan from bigseller_orders
   - Filtered by `approval_status = 'Approved'` (Gosave) or `status_pesanan = 'Selesai'` (GOTO)

4. **Business Unit Mapping:**
   - Always uses department/department_name from respective tables
   - No hardcoded mapping in SELECT clause
   - Filtering done in WHERE clause

5. **Date Consistency:**
   - All dates use `DATE()` function for consistency
   - EXTRACT() for year/month components
   - FORMAT_DATE() for period labels