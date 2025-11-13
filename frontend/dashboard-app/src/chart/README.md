# Chart Components Structure

Struktur folder untuk komponen chart yang modular dan scalable.

## Struktur Folder

```
chart/
├── ChartBulanan/              # Chart Monthly Revenue
│   ├── ChartBulanan.jsx       # Komponen utama
│   ├── index.js               # Export
│   ├── components/            # Komponen khusus chart ini
│   │   ├── ChartControls.jsx
│   │   └── LegendToggles.jsx
│   ├── hooks/                 # Hooks khusus chart ini
│   │   └── useChartData.js
│   ├── config/                # Konfigurasi chart
│   │   └── chartConfig.js
│   ├── services/              # Service API khusus
│   │   └── apiService.js
│   ├── utils.js               # Utils khusus chart
│   ├── plugin.js              # Plugin Chart.js khusus
│   └── styles.js              # Styles khusus chart
│
├── shared/                    # Resources yang bisa dipakai semua chart
│   ├── components/            # Komponen reusable
│   │   └── MonthPicker.jsx
│   ├── hooks/                 # Hooks reusable
│   │   └── useMonthPicker.js
│   ├── utils/                 # Utils reusable
│   │   ├── formatCurrency.js
│   │   ├── calculatePercentage.js
│   │   └── index.js
│   └── constants.js           # Konstanta global
│
└── README.md                  # Dokumentasi ini
```

## Cara Menambahkan Chart Baru

### 1. Buat Folder Chart Baru

Buat folder baru di `chart/`, contoh: `ChartTahunan/`

```bash
mkdir -p chart/ChartTahunan/{components,hooks,config,services}
```

### 2. Copy Template dari ChartBulanan

Copy struktur dari `ChartBulanan/` sebagai template:

```bash
# Copy struktur (adjust sesuai kebutuhan)
cp -r chart/ChartBulanan/* chart/ChartTahunan/
```

### 3. Update Import Paths

Update semua import di file baru untuk:
- Menggunakan shared resources: `../../shared/...`
- Menggunakan local resources: `./...`

### 4. Import di Halaman

```jsx
// Di DashboardLayoutBasic.jsx atau halaman lain
import ChartBulanan from './chart/ChartBulanan';
import ChartTahunan from './chart/ChartTahunan';

function DashboardPage() {
  return (
    <Box>
      <ChartBulanan />
      <ChartTahunan />
    </Box>
  );
}
```

## Menggunakan Shared Resources

### Menggunakan Utils

```javascript
import { formatCurrency, calculatePercentageChange } from '../../shared/utils';
```

### Menggunakan Components

```javascript
import MonthPicker from '../../shared/components/MonthPicker';
```

### Menggunakan Hooks

```javascript
import { useMonthPicker } from '../../shared/hooks/useMonthPicker';
```

### Menggunakan Constants

```javascript
import { API_URL, monthNames } from '../../shared/constants';
```

## Best Practices

1. **Isolasi**: Setiap chart punya folder sendiri dengan dependencies sendiri
2. **Reusability**: Gunakan shared resources untuk fungsi yang sama
3. **Naming**: Gunakan nama yang jelas dan konsisten
4. **Structure**: Ikuti struktur yang sama untuk semua chart
5. **Documentation**: Dokumentasikan chart spesifik di README chart tersebut

## Contoh: Multiple Charts di Satu Page

```jsx
import React from 'react';
import { Box } from '@mui/material';
import ChartBulanan from './chart/ChartBulanan';
import ChartTahunan from './chart/ChartTahunan';
import ChartKategori from './chart/ChartKategori';

function DashboardPage() {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <ChartBulanan />
      <ChartTahunan />
      <ChartKategori />
    </Box>
  );
}

export default DashboardPage;
```

## Struktur File Chart Spesifik

Setiap chart harus memiliki:

- `ChartName.jsx` - Komponen utama
- `index.js` - Export helper
- `styles.js` - Styles khusus chart
- `components/` - Komponen UI khusus
- `hooks/` - Custom hooks khusus
- `config/` - Konfigurasi chart
- `services/` - API calls khusus
- `utils.js` - Utility functions khusus (jika ada)

