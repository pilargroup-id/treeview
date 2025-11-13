# Contoh: Multiple Charts di Satu Page

## Cara Menggunakan Multiple Charts

### 1. Import Semua Chart yang Diperlukan

```jsx
import React from 'react';
import { Box } from '@mui/material';
import ChartBulanan from './chart/ChartBulanan';
// import ChartTahunan from './chart/ChartTahunan';
// import ChartKategori from './chart/ChartKategori';

function DashboardPage() {
  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <ChartBulanan />
      {/* <ChartTahunan /> */}
      {/* <ChartKategori /> */}
    </Box>
  );
}

export default DashboardPage;
```

### 2. Layout dengan Grid (Optional)

```jsx
import React from 'react';
import { Box, Grid } from '@mui/material';
import ChartBulanan from './chart/ChartBulanan';
// import ChartTahunan from './chart/ChartTahunan';

function DashboardPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ChartBulanan />
        </Grid>
        {/* <Grid item xs={12} md={6}>
          <ChartTahunan />
        </Grid> */}
      </Grid>
    </Box>
  );
}

export default DashboardPage;
```

### 3. Conditional Rendering

```jsx
import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import ChartBulanan from './chart/ChartBulanan';
// import ChartTahunan from './chart/ChartTahunan';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab label="Monthly Revenue" />
        {/* <Tab label="Annual Revenue" /> */}
      </Tabs>
      
      {activeTab === 0 && <ChartBulanan />}
      {/* {activeTab === 1 && <ChartTahunan />} */}
    </Box>
  );
}

export default DashboardPage;
```

## Tips

1. **Isolasi State**: Setiap chart memiliki state sendiri, tidak saling mempengaruhi
2. **Performance**: Chart hanya render ketika diperlukan
3. **Layout**: Gunakan Grid atau Flexbox untuk layout yang responsif
4. **Loading**: Setiap chart memiliki loading state sendiri

