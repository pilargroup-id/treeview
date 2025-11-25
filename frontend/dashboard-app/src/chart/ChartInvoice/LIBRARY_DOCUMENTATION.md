### 🎯 **Core Framework & UI**

#### 1. **React** (`^18.3.1`)
- **Fungsi**: Framework utama untuk membangun UI komponen
- **Penggunaan**: 
  - State management (`useState`, `useEffect`, `useRef`)
  - Component lifecycle management
  - Event handling
- **File yang menggunakan**: 
  - `ChartInvoice.jsx`
  - Semua file di folder `components/`

#### 2. **React DOM** (`^18.3.1`)
- **Fungsi**: Render React components ke DOM
- **Penggunaan**: Entry point aplikasi React

---

### 📊 **Charting Libraries**

#### 3. **Chart.js** (`^4.5.1`)
- **Fungsi**: Library utama untuk membuat chart/grafik
- **Komponen yang digunakan**:
  - `Chart` (core)
  - `CategoryScale` - untuk kategori data (bulan, tanggal)
  - `LinearScale` - untuk skala numerik
  - `LineElement` - untuk chart garis
  - `BarElement` - untuk chart bar
  - `PointElement` - untuk titik data
  - `Title` - judul chart
  - `Tooltip` - tooltip interaktif
  - `Legend` - legenda chart
  - `Filler` - fill area di bawah garis
- **File yang menggunakan**: 
  - `ChartInvoice.jsx` (line 2-13, 33-43)
  - `chartConfig.js` (konfigurasi chart)
- **Fitur khusus**: Custom plugin untuk data labels

#### 4. **react-chartjs-2** (`^5.3.1`)
- **Fungsi**: Wrapper React untuk Chart.js
- **Komponen yang digunakan**:
  - `<Line>` - Chart garis untuk data time series
  - `<Bar>` - Chart bar untuk data specific dates
- **File yang menggunakan**: 
  - `ChartInvoice.jsx` (line 14, 785-806)
- **Keuntungan**: Integrasi seamless dengan React lifecycle

---

### 🎨 **UI Component Library**

#### 5. **Material-UI (MUI)** 
- **Package**: `@mui/material` (via `@emotion/react` & `@emotion/styled`)
- **Fungsi**: Komponen UI yang siap pakai
- **Komponen yang digunakan**:
  - `Box` - Container layout
  - `Typography` - Teks styling
  - `Card` - Card container
  - `Button` - Tombol interaktif
  - `CircularProgress` - Loading indicator
  - `Fade` - Animasi fade
  - `Chip` - Tag/badge
  - `Paper` - Surface container
  - `Portal` - Render di luar DOM tree
  - `Backdrop` - Overlay background
- **Icons**: `@mui/icons-material` (`^7.3.5`)
  - `CalendarMonthRoundedIcon`
  - `BusinessIcon`
  - `CalendarMonthIcon`
  - `CheckCircleIcon`
  - `FilterListIcon`
- **File yang menggunakan**: 
  - `ChartInvoice.jsx` (line 16-22)
  - `components/filters/DateRangePickerWithPresets.jsx`
  - Semua komponen filter

---

### **Date/Time Libraries**

#### 6. **dayjs** (`^1.11.19`)
- **Fungsi**: Manipulasi dan format tanggal
- **Penggunaan**:
  - Validasi tanggal
  - Format tanggal
  - Perhitungan tanggal
- **File yang menggunakan**: 
  - `ChartInvoice.jsx` (line 23, 391, 480-481)
  - `apiService.js` (validasi tanggal)
- **Keuntungan**: Ringan, API mirip moment.js

#### 7. **react-date-range** (`^2.0.1`)
- **Fungsi**: Date range picker component
- **Komponen**: `<DateRangePicker>`
- **File yang menggunakan**: 
  - `components/filters/DateRangePickerWithPresets.jsx` (line 8-10)
- **Fitur**: 
  - Preset ranges (hari ini, minggu ini, bulan ini, dll)
  - Custom date selection
  - Multi-range support

#### 8. **date-fns** (`^3.0.0`)
- **Fungsi**: Utility functions untuk manipulasi tanggal
- **Penggunaan**: Formatting, parsing, dan operasi tanggal
- **File yang menggunakan**: 
  - Komponen date picker

---

###**API & Network**

#### 9. **Fetch API** (Native Browser API)
- **Fungsi**: HTTP requests ke backend
- **Penggunaan**: 
  - GET requests untuk data invoice
  - Error handling
  - Response parsing
- **File yang menggunakan**: 
  - `apiService.js` (line 153, 264, 338)
- **Endpoint**: `http://localhost:8000/api/financial/invoice-sales`

---

### 🛠️ **Build Tools & Development**

#### 10. **Vite** (`^5.0.0`)
- **Fungsi**: Build tool dan development server
- **Plugin**: `@vitejs/plugin-react` (`^4.3.1`)
- **Fitur**: 
  - Hot Module Replacement (HMR)
  - Fast builds
  - Optimized production builds

---

## 📋 Ringkasan Library

| No | Library | Versi | Kategori | Fungsi Utama |
|---|---|---|---|---|
| 1 | React | ^18.3.1 | Framework | UI Framework |
| 2 | React DOM | ^18.3.1 | Framework | DOM Rendering |
| 3 | Chart.js | ^4.5.1 | Charting | Chart Engine |
| 4 | react-chartjs-2 | ^5.3.1 | Charting | React Wrapper |
| 5 | @mui/material | - | UI Library | Komponen UI |
| 6 | @mui/icons-material | ^7.3.5 | Icons | Icon Set |
| 7 | dayjs | ^1.11.19 | Date/Time | Date Manipulation |
| 8 | react-date-range | ^2.0.1 | Date/Time | Date Picker |
| 9 | date-fns | ^3.0.0 | Date/Time | Date Utilities |
| 10 | Vite | ^5.0.0 | Build Tool | Development Server |

---

## Penggunaan Library per Fitur

### **Chart Visualization**
- **Chart.js** + **react-chartjs-2**: Line chart & Bar chart
- **Custom Plugin**: Data labels dengan collision detection

### **Date Filtering**
- **dayjs**: Validasi dan format tanggal
- **react-date-range**: Range date picker dengan presets
- **date-fns**: Utility functions untuk tanggal

### **UI Components**
- **Material-UI**: Semua komponen UI (cards, buttons, inputs)
- **@mui/icons-material**: Icons untuk UI

### **State Management**
- **React Hooks**: `useState`, `useEffect`, `useRef`

### **API Integration**
- **Fetch API**: Komunikasi dengan backend Laravel

---

## Dependencies Tree

```
ChartInvoice/
├── React (Core)
│   ├── React DOM
│   └── React Hooks
├── Chart.js
│   └── react-chartjs-2 (Wrapper)
├── Material-UI
│   ├── @emotion/react
│   ├── @emotion/styled
│   └── @mui/icons-material
├── Date Libraries
│   ├── dayjs
│   ├── react-date-range
│   └── date-fns
└── Build Tools
    └── Vite + React Plugin
```

---

## Konfigurasi Khusus

### Chart.js Registration
```javascript
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
```

### Custom Chart Plugin
- Plugin `dataLabels` untuk menampilkan nilai di chart
- Collision detection untuk label yang overlap
- Dynamic positioning berdasarkan chart area

---
  
## Catatan 

1. **Chart.js 4.x**: Menggunakan versi terbaru dengan tree-shaking support
2. **Material-UI**: Menggunakan Emotion untuk styling (CSS-in-JS)
3. **Date Libraries**: Menggunakan kombinasi dayjs (ringan) dan react-date-range (UI)
4. **No State Management Library**: Menggunakan React hooks murni
5. **Native Fetch**: Tidak menggunakan axios, menggunakan Fetch API native

---

## Instalasi

Semua library sudah terinstall via `package.json`. Untuk install ulang:

```bash
cd frontend/dashboard-app
npm install
```

---

