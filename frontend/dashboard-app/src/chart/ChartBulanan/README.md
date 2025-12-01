# ChartBulanan - Monthly Revenue Comparison

Chart untuk membandingkan revenue bulanan antara tahun 2024 dan 2025.

## Fitur

- Filter berdasarkan bulan
- Toggle untuk menampilkan/menyembunyikan data 2024, 2025, dan persentase
- Loading state dengan spinner
- Tooltip dengan informasi detail
- Percentage labels di chart

## Struktur

```
ChartBulanan/
├── ChartBulanan.jsx       # Komponen utama
├── index.js               # Export
├── components/
│   ├── ChartControls.jsx  # Controls (account input, month picker, load button)
│   └── LegendToggles.jsx  # Toggle untuk legend items
├── hooks/
│   └── useChartData.js    # Hook untuk mengelola data chart
├── config/
│   └── chartConfig.js     # Konfigurasi Chart.js dengan memoization
├── services/
│   └── apiService.js      # Service untuk API calls
├── chartHelpers.js        # Helper functions dan hooks
├── styles/                # Styles folder
│   └── styles.js          # Styles khusus chart
└── README.md              # Dokumentasi
```

## Dependencies

- Menggunakan shared resources:
  - `shared/components/MonthPicker` - Month picker component
  - `shared/hooks/useMonthPicker` - Hook untuk month picker
  - `shared/utils/formatCurrency` - Format currency
  - `shared/utils/calculatePercentage` - Calculate percentage change
  - `shared/constants` - Constants (API_URL, monthNames, dll)

## Usage

```jsx
import ChartBulanan from './chart/ChartBulanan';

function MyPage() {
  return <ChartBulanan />;
}
```

## API Endpoints

- `GET /api/financial/monthly-revenue?account_header={account}&start_date={start}&end_date={end}`

