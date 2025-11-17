import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box, GlobalStyles } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  useChartData,
  useMonthPicker,
  getFilteredData,
  createPercentageLabelsPlugin,
  useChartConfig,
  monthNames
} from './chartHelpers';
import { styles } from './styles/styles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const globalStyles = (
  <GlobalStyles
    styles={{
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    }}
  />
);

const MonthPicker = ({
  selectedMonths,
  tempSelectedMonths,
  monthPickerOpen,
  monthPickerRef,
  onMonthToggle,
  onApply,
  onCancel,
  onOpen
}) => {
  const getMonthPickerLabel = () => {
    if (selectedMonths.size === 0) {
      return 'Pilih Bulan';
    } else if (selectedMonths.size === 1) {
      return Array.from(selectedMonths)[0];
    } else {
      return `${selectedMonths.size} Bulan`;
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }} ref={monthPickerRef}>
      <Box
        component="button"
        onClick={onOpen}
        sx={{ ...styles.btn }}
      >
        <CalendarTodayIcon sx={{ fontSize: 16 }} />
        <Box component="span">{getMonthPickerLabel()}</Box>
        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
      </Box>

      <Box
        sx={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          zIndex: 100,
          width: '280px',
          maxHeight: '360px',
          display: 'flex',
          flexDirection: 'column',
          opacity: monthPickerOpen ? 1 : 0,
          visibility: monthPickerOpen ? 'visible' : 'hidden',
          transform: monthPickerOpen ? 'translateY(0)' : 'translateY(-6px)',
          transition: '0.2s',
        }}
      >
        <Box sx={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span">Pilih Periode</Box>
          <Box
            component="button"
            onClick={onCancel}
            sx={{ ...styles.btn, border: 'none', background: 'transparent', padding: '4px', minWidth: 'auto' }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>

        <Box sx={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {monthNames.map((month) => (
              <Box
                key={month}
                component="button"
                onClick={() => onMonthToggle(month)}
                sx={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '16px',
                  fontSize: '13px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: tempSelectedMonths.has(month) ? '#6D94C5' : 'white',
                  color: tempSelectedMonths.has(month) ? 'white' : 'inherit',
                  fontFamily: 'Segoe UI, sans-serif',
                  outline: 'none',
                  textDecoration: 'none',
                  '&:hover': {
                    background: tempSelectedMonths.has(month) ? '#5a7da8' : '#f8f9fa',
                  },
                }}
              >
                {month.substring(0, 3)}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ padding: '12px 16px', borderTop: '1px solid #e9ecef', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'white' }}>
          <Box
            component="button"
            onClick={onCancel}
            sx={styles.btn}
          >
            Batal
          </Box>
          <Box
            component="button"
            onClick={() => onApply(tempSelectedMonths)}
            sx={{ ...styles.btn, ...styles.btnPrimary }}
          >
            Terapkan
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const ChartControls = ({
  accountHeader,
  onAccountHeaderChange,
  loading,
  onLoadData,
  monthPickerProps
}) => {
  return (
    <Box sx={styles.controlBar}>
      <Box sx={styles.cardTitle}>Monthly Revenue Comparison (2024 vs 2025)</Box>

      <Box sx={styles.controlActions}>
        <Box sx={styles.inputGroup}>
          <Box component="label" sx={styles.inputGroupLabel}>Account:</Box>
          <Box
            component="input"
            type="text"
            value={accountHeader}
            onChange={(e) => onAccountHeaderChange(e.target.value)}
            sx={styles.inputGroupInput}
          />
        </Box>
        
        <MonthPicker {...monthPickerProps} />
        
        <Box
          component="button"
          onClick={onLoadData}
          disabled={loading}
          sx={{ ...styles.btn, ...styles.btnPrimary }}
        >
          <RefreshIcon sx={{ fontSize: 16 }} />
          Load Data
        </Box>
      </Box>
    </Box>
  );
};

const LegendToggles = ({ show2024, show2025, showPercentage, onToggle2024, onToggle2025, onTogglePercentage }) => {
  return (
    <Box sx={styles.legendToggles}>
      <Box
        onClick={onToggle2024}
        sx={{
          ...styles.legendItem,
          ...(!show2024 && styles.legendItemInactive)
        }}
      >
        <Box
          sx={{
            ...styles.legendIndicator,
            ...styles.legendIndicator2024,
            ...(!show2024 && styles.legendIndicatorInactive)
          }}
        />
        <Box component="span" sx={styles.legendLabel}>2024 Revenue</Box>
      </Box>
      
      <Box
        onClick={onToggle2025}
        sx={{
          ...styles.legendItem,
          ...(!show2025 && styles.legendItemInactive)
        }}
      >
        <Box
          sx={{
            ...styles.legendIndicator,
            ...styles.legendIndicator2025,
            ...(!show2025 && styles.legendIndicatorInactive)
          }}
        />
        <Box component="span" sx={styles.legendLabel}>2025 Revenue</Box>
      </Box>
      
      <Box
        onClick={onTogglePercentage}
        sx={{
          ...styles.legendItem,
          ...(!showPercentage && styles.legendItemInactive)
        }}
      >
        <Box
          sx={{
            ...styles.legendIndicator,
            ...styles.legendIndicatorPercentage,
            ...(!showPercentage && styles.legendIndicatorInactive)
          }}
        />
        <Box component="span" sx={styles.legendLabel}>Persentase</Box>
      </Box>
    </Box>
  );
};

function ChartBulanan() {
  const [selectedMonths, setSelectedMonths] = useState(new Set());
  const [showPercentage, setShowPercentage] = useState(false);
  const [show2024, setShow2024] = useState(true);
  const [show2025, setShow2025] = useState(true);
  
  const chartRef = useRef(null);
  const stateRef = useRef({ showPercentage, show2024, show2025, filteredData: { data2024: [], data2025: [] } });

  const {
    accountHeader,
    setAccountHeader,
    allData,
    loading,
    loadRevenue
  } = useChartData('4000.01.00');

  const {
    tempSelectedMonths,
    monthPickerOpen,
    monthPickerRef,
    handleMonthToggle,
    handleCancelMonths,
    handleOpenMonthPicker
  } = useMonthPicker(selectedMonths);

  const filteredData = getFilteredData(allData, selectedMonths);

  useEffect(() => {
    stateRef.current = { showPercentage, show2024, show2025, filteredData };
  }, [showPercentage, show2024, show2025, filteredData]);

  useEffect(() => {
    const plugin = createPercentageLabelsPlugin(stateRef);
    ChartJS.register(plugin);

    return () => {
      ChartJS.unregister(plugin);
    };
  }, []);

  const { chartData, chartOptions } = useChartConfig(
    filteredData,
    show2024,
    show2025,
    showPercentage
  );

  const handleApplyMonthsWrapper = (newMonths) => {
    setSelectedMonths(new Set(newMonths));
  };

  return (
    <>
      {globalStyles}
      <Box sx={styles.dashboardContainer}>
        <Box sx={styles.card}>
          <ChartControls
            accountHeader={accountHeader}
            onAccountHeaderChange={setAccountHeader}
            loading={loading}
            onLoadData={loadRevenue}
            monthPickerProps={{
              selectedMonths,
              tempSelectedMonths,
              monthPickerOpen,
              monthPickerRef,
              onMonthToggle: handleMonthToggle,
              onApply: handleApplyMonthsWrapper,
              onCancel: handleCancelMonths,
              onOpen: handleOpenMonthPicker
            }}
          />

          <Box sx={styles.cardBody}>
            <LegendToggles
              show2024={show2024}
              show2025={show2025}
              showPercentage={showPercentage}
              onToggle2024={() => setShow2024(!show2024)}
              onToggle2025={() => setShow2025(!show2025)}
              onTogglePercentage={() => setShowPercentage(!showPercentage)}
            />
            
            <Box sx={styles.chartArea}>
              {loading && (
                <Box sx={styles.loadingOverlay}>
                  <Box sx={styles.spinner} />
                </Box>
              )}
              
              {allData.data2024.length > 0 ? (
                <Bar 
                  ref={chartRef} 
                  data={chartData} 
                  options={chartOptions}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                  Klik "Load Data" untuk memuat chart
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default ChartBulanan;
