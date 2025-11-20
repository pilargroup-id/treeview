import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Card,
  Button,
  CircularProgress,
  Fade
} from '@mui/material';
import dayjs from 'dayjs';
import FilterSection from './components/filters/FilterSection';
import YearCards from './components/filters/YearCards';
import RangeDateFilter from './components/filters/RangeDateFilter';
import SpecificDateFilter from './components/filters/SpecificDateFilter';
import SummaryCard from './components/filters/SummaryCard';
import { formatCurrency, formatShortNumber, getAvailableYears } from './utils';
import { loadYearSummary, loadInvoiceSales, refreshData } from './apiService';
import { generateChartConfig } from './chartConfig';

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


function ChartInvoice() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [dateFilterType, setDateFilterType] = useState('year');
  const [dataType, setDataType] = useState('both'); 
  const [years, setYears] = useState([]);
  const [rangeDates, setRangeDates] = useState([]);
  const [specificDates, setSpecificDates] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [yearSummary, setYearSummary] = useState({}); 
  const [yearSummaryLoading, setYearSummaryLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const invoiceChartRef = useRef(null);
  const showDetailRef = useRef(showDetail);
  
  useEffect(() => {
    showDetailRef.current = showDetail;
    if (invoiceChartRef.current) {
      invoiceChartRef.current.update();
    }
  }, [showDetail]);
  
  // Plugin 
  useEffect(() => {
    const dataLabelsPlugin = {
      id: 'dataLabels',
      afterDatasetsDraw: (chart) => {
        if (!showDetailRef.current) return;
        
        const ctx = chart.ctx;
        const datasets = chart.data.datasets;
        const chartArea = chart.chartArea;
        
        const yScale = chart.scales.y || chart.scales.y1;
        if (!yScale) return;
        
        const labelsByX = new Map();
        
        datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.data) return;
          
          // Cek apakah dataset visible 
          if (meta.hidden || !chart.isDatasetVisible(datasetIndex)) return;
          
          meta.data.forEach((point, index) => {
            const value = dataset.data[index];
            if (value === null || value === undefined || value === 0) return;
            
            const x = Math.round(point.x); 
            const baseY = point.y;
            
            if (!labelsByX.has(x)) {
              labelsByX.set(x, []);
            }
            
            labelsByX.get(x).push({
              x: point.x,
              baseY: baseY,
              value: value,
              color: dataset.borderColor || '#212121',
              datasetIndex: datasetIndex
            });
          });
        });
        
        ctx.save();
        ctx.font = 'bold 11px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelPadding = 6;
        const labelHeight = 20;
        const labelSpacing = 4;
        const minXDistance = 50; 
        const maxLabelWidth = 80; 
        
        const allLabels = [];
        
        labelsByX.forEach((labels, x) => {
          labels.sort((a, b) => a.baseY - b.baseY);
          
          labels.forEach((label, index) => {
            const labelText = formatShortNumber(label.value);
            const textMetrics = ctx.measureText(labelText);
            const textWidth = textMetrics.width;
            
            const chartTop = chartArea.top;
            const chartBottom = chartArea.bottom;
            const isNearTop = label.baseY < (chartTop + (chartBottom - chartTop) * 0.3);
            
            const baseOffset = isNearTop ? 25 : -25;
            const offsetY = baseOffset + (index * (labelHeight + labelSpacing) * (isNearTop ? 1 : -1));
            let initialY = label.baseY + offsetY;
            
            allLabels.push({
              x: label.x,
              y: initialY,
              baseY: label.baseY,
              text: labelText,
              color: label.color,
              width: textWidth,
              height: labelHeight,
              isNearTop: isNearTop,
              xGroup: x
            });
          });
        });
        
        allLabels.sort((a, b) => a.y - b.y);
        
        for (let i = 0; i < allLabels.length; i++) {
          const label = allLabels[i];
          let adjustedY = label.y;
          let adjustedX = label.x;
          let maxIterations = 30;
          let iteration = 0;
          let hasAnyCollision = true;
          
          while (hasAnyCollision && iteration < maxIterations) {
            hasAnyCollision = false;
            
            for (let j = 0; j < i; j++) {
              const otherLabel = allLabels[j];
              const xDiff = Math.abs(otherLabel.x - adjustedX);
              const yDiff = Math.abs(otherLabel.y - adjustedY);
              
              const minYDistance = (label.height + otherLabel.height) / 2 + labelSpacing;
              if (xDiff < minXDistance && yDiff < minYDistance) {
                hasAnyCollision = true;
                
                const yDirection = adjustedY < otherLabel.y ? -1 : 1;
                const xDirection = adjustedX < otherLabel.x ? -1 : 1;
                
                adjustedY = otherLabel.y + (yDirection * minYDistance);
                
                const newYDiff = Math.abs(otherLabel.y - adjustedY);
                if (xDiff < minXDistance && newYDiff < minYDistance) {
                  adjustedX = otherLabel.x + (xDirection * (minXDistance - xDiff + 5));
                }
                
                break; 
              }
            }
            
            const labelTop = adjustedY - label.height / 2;
            const labelBottom = adjustedY + label.height / 2;
            const labelLeft = adjustedX - label.width / 2 - labelPadding;
            const labelRight = adjustedX + label.width / 2 + labelPadding;
            
            if (labelTop < chartArea.top + 10) {
              adjustedY = label.baseY + 35;
              label.isNearTop = false;
              hasAnyCollision = true; 
            }
            else if (labelBottom > chartArea.bottom - 10) {
              adjustedY = label.baseY - 35;
              label.isNearTop = true;
              hasAnyCollision = true; 
            }
            
            if (labelLeft < chartArea.left + 5) {
              adjustedX = Math.max(chartArea.left + label.width / 2 + labelPadding + 5, label.x);
              hasAnyCollision = true;
            } else if (labelRight > chartArea.right - 5) {
              adjustedX = Math.min(chartArea.right - label.width / 2 - labelPadding - 5, label.x);
              hasAnyCollision = true;
            }
            
            iteration++;
          }
          
          label.x = adjustedX;
          label.y = adjustedY;
        }
        
        allLabels.forEach(label => {
          const labelWidth = label.width + (labelPadding * 2);
          const labelHeight = label.height;
          const x = label.x;
          const y = label.y;
          
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.strokeStyle = label.color;
          ctx.lineWidth = 1.5;
          
          const radius = 4;
          ctx.beginPath();
          ctx.moveTo(x - labelWidth / 2 + radius, y - labelHeight / 2);
          ctx.lineTo(x + labelWidth / 2 - radius, y - labelHeight / 2);
          ctx.quadraticCurveTo(x + labelWidth / 2, y - labelHeight / 2, x + labelWidth / 2, y - labelHeight / 2 + radius);
          ctx.lineTo(x + labelWidth / 2, y + labelHeight / 2 - radius);
          ctx.quadraticCurveTo(x + labelWidth / 2, y + labelHeight / 2, x + labelWidth / 2 - radius, y + labelHeight / 2);
          ctx.lineTo(x - labelWidth / 2 + radius, y + labelHeight / 2);
          ctx.quadraticCurveTo(x - labelWidth / 2, y + labelHeight / 2, x - labelWidth / 2, y + labelHeight / 2 - radius);
          ctx.lineTo(x - labelWidth / 2, y - labelHeight / 2 + radius);
          ctx.quadraticCurveTo(x - labelWidth / 2, y - labelHeight / 2, x - labelWidth / 2 + radius, y - labelHeight / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // Draw text
          ctx.fillStyle = label.color;
          ctx.fillText(label.text, x, y);
          
          ctx.restore();
        });
        
        ctx.restore();
      }
    };
    
    ChartJS.register(dataLabelsPlugin);
    
    return () => {
      ChartJS.unregister(dataLabelsPlugin);
    };
  }, []);

  const availableYears = getAvailableYears();

  // Load summary
  useEffect(() => {
    loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading);
  }, []);

  useEffect(() => {
    if (dateFilterType !== 'year' && years.length > 1) {
      setYears(prev => prev.length > 0 ? [prev[0]] : []);
    }
  }, [dateFilterType]);

  // Refresh data
  const handleRefreshData = async () => {
    await refreshData({
      businessUnits,
      dateFilterType,
      years,
      rangeDates,
      specificDates,
      availableYears,
      setInvoiceData,
      setInvoiceLoading,
      setYearSummary,
      setYearSummaryLoading
    });
  };

  const toggleBusinessUnit = (unit) => {
    setBusinessUnits(prev => {
      if (prev.includes(unit)) {
        return prev.filter(u => u !== unit);
      } else {
        return [...prev, unit];
      }
    });
  };

  const toggleYear = (year) => {
    if (dateFilterType === 'year') {
      setYears(prev => {
        if (prev.includes(year)) {
          return prev.filter(y => y !== year); 
        } else {
          return [...prev, year].sort((a, b) => a - b); 
        }
      });
    } else {
      setYears(prev => {
        if (prev.includes(year)) {
          return [];
        } else {
          return [year]; 
        }
      });
    }
  };

  const addSpecificDate = (dateObj) => {
    console.log('addSpecificDate called with:', dateObj);
    console.log('Current specificDates:', specificDates);
    
    try {
      let dateWithYear;
      
      if (typeof dateObj === 'string') {
        const parts = dateObj.split('-');
        if (parts.length !== 2) {
          console.error('Invalid dateObj format:', dateObj);
          alert('Format tanggal tidak valid');
          return;
        }
        const currentYear = new Date().getFullYear();
        dateWithYear = { year: currentYear, monthDay: dateObj };
      } else if (typeof dateObj === 'object' && dateObj.year && dateObj.monthDay) {
        dateWithYear = dateObj;
      } else {
        console.error('Invalid dateObj:', dateObj);
        alert('Format tanggal tidak valid');
        return;
      }
      
      const parts = dateWithYear.monthDay.split('-');
      if (parts.length !== 2) {
        console.error('Invalid monthDay format:', dateWithYear.monthDay);
        alert('Format tanggal tidak valid. Gunakan format MM-DD (contoh: 12-25)');
        return;
      }
      
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      
      if (isNaN(month) || month < 1 || month > 12) {
        console.error('Invalid month:', month);
        alert('Bulan tidak valid');
        return;
      }
      
      if (isNaN(day) || day < 1 || day > 31) {
        console.error('Invalid day:', day);
        alert('Hari tidak valid');
        return;
      }
      
      // Validasi jumlah tanggal
      const MAX_SPECIFIC_DATES = 30;
      if (specificDates.length >= MAX_SPECIFIC_DATES) {
        alert(`Maksimal ${MAX_SPECIFIC_DATES} tanggal yang bisa dipilih untuk menghindari error`);
        return;
      }
      
      // Cek apakah tanggal dengan tahun ini sudah ada
      const dateExists = specificDates.some(date => {
        if (typeof date === 'string') {
          return date === dateWithYear.monthDay;
        }
        return date.year === dateWithYear.year && date.monthDay === dateWithYear.monthDay;
      });
      
      if (dateExists) {
        alert(`Tanggal ${day}/${month}/${dateWithYear.year} sudah dipilih`);
        return;
      }
      
      const testDate = dayjs(`${dateWithYear.year}-${dateWithYear.monthDay}`);
      if (!testDate.isValid() || testDate.month() !== (month - 1) || testDate.date() !== day) {
        alert(`Tanggal ${day}/${month}/${dateWithYear.year} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      setSpecificDates(prev => {
        console.log('Setting specificDates, prev:', prev);
        console.log('Adding dateWithYear:', dateWithYear);
        try {
          const newDates = [...prev, dateWithYear];
          console.log('newDates before sort:', newDates);
          const sorted = newDates.sort((a, b) => {
            const aYear = typeof a === 'string' ? 0 : a.year;
            const bYear = typeof b === 'string' ? 0 : b.year;
            if (aYear !== bYear) return aYear - bYear;
            
            const aMonthDay = typeof a === 'string' ? a : a.monthDay;
            const bMonthDay = typeof b === 'string' ? b : b.monthDay;
            return aMonthDay.localeCompare(bMonthDay);
          });
          console.log('sorted dates:', sorted);
          return sorted;
        } catch (sortError) {
          console.error('Error sorting dates:', sortError);
          return [...prev, dateWithYear];
        }
      });
    } catch (error) {
      console.error('Unexpected error in addSpecificDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const removeSpecificDate = (date) => {
    setSpecificDates(prev => {
      if (typeof date === 'string') {
        return prev.filter(d => {
          if (typeof d === 'string') return d !== date;
          return d.monthDay !== date;
        });
      }

      return prev.filter(d => {
        if (typeof d === 'string') return false;
        return !(d.year === date.year && d.monthDay === date.monthDay);
      });
    });
  };

  const addRangeDate = (range) => {
    try {
      // Validasi input
      if (!range || !range.start || !range.end || !range.year) {
        console.error('Invalid range:', range);
        alert('Format range tidak valid. Pastikan tahun sudah dipilih dari card tahun.');
        return;
      }
      
      // Validasi format MM-DD
      const isValidMonthDay = (value) => {
        if (!value || typeof value !== 'string') return false;
        const parts = value.split('-');
        if (parts.length !== 2) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      };
      
      if (!isValidMonthDay(range.start) || !isValidMonthDay(range.end)) {
        alert('Format tanggal tidak valid. Gunakan format MM-DD (contoh: 12-25)');
        return;
      }
      
      const MAX_RANGE_DATES = 1;
      if (rangeDates.length >= MAX_RANGE_DATES) {
        alert(`Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih. Hapus range yang ada terlebih dahulu.`);
        return;
      }
      
      const rangeExists = rangeDates.some(r => 
        r.start === range.start && r.end === range.end && r.year === range.year
      );
      
      if (rangeExists) {
        alert(`Range tanggal ini untuk tahun ${range.year} sudah dipilih`);
        return;
      }
      
      const testStartDate = dayjs(`${range.year}-${range.start}`);
      const testEndDate = dayjs(`${range.year}-${range.end}`);
      
      if (!testStartDate.isValid() || !testEndDate.isValid()) {
        alert('Tanggal tidak valid. Silakan pilih tanggal yang valid.');
        return;
      }
      
      if (testEndDate.isBefore(testStartDate)) {
        alert('Tanggal akhir harus lebih besar atau sama dengan tanggal mulai');
        return;
      }
      
      setRangeDates(prev => {
        try {
          const newRanges = [...prev, range];
          return newRanges.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            const aStart = dayjs(`${a.year}-${a.start}`);
            const bStart = dayjs(`${b.year}-${b.start}`);
            if (aStart.isBefore(bStart)) return -1;
            if (aStart.isAfter(bStart)) return 1;
            const aEnd = dayjs(`${a.year}-${a.end}`);
            const bEnd = dayjs(`${b.year}-${b.end}`);
            if (aEnd.isBefore(bEnd)) return -1;
            if (aEnd.isAfter(bEnd)) return 1;
            return 0;
          });
        } catch (sortError) {
          console.error('Error sorting ranges:', sortError);
          return [...prev, range];
        }
      });
    } catch (error) {
      console.error('Unexpected error in addRangeDate:', error);
      alert('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const removeRangeDate = (range) => {
    setRangeDates(prev => prev.filter(r => 
      !(r.start === range.start && r.end === range.end && r.year === range.year)
    ));
  };

  const handleLoadInvoiceSales = async () => {
    await loadInvoiceSales({
      businessUnits,
      dateFilterType,
      years,
      rangeDates,
      specificDates,
      availableYears,
      setInvoiceData,
      setInvoiceLoading
    });
  };

  const isYearFilter = dateFilterType === 'year';
  const isSpecificDate = dateFilterType === 'specific';
  
  // Generate chart 
  const { chartData: invoiceChartData, chartOptions: invoiceChartOptions } = generateChartConfig({
    dateFilterType,
    invoiceData,
    businessUnits,
    years,
    specificDates,
    dataType
  });

  const yearTotals = { ...yearSummary };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'white',
      p: { xs: 2, sm: 3, md: 4 },
      gap: { xs: 2.5, md: 3 }
    }}>
      {/* Baris Atas: Filter Section, YearCards, dan Card Filter Tambahan */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2.5, md: 3 },
        alignItems: 'stretch'
      }}>
        {/* Filter Section di Kiri */}
        <Box sx={{
          width: { xs: '100%', lg: 320 },
          minWidth: { xs: '100%', lg: 320 },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <FilterSection
            dateFilterType={dateFilterType}
            onDateFilterTypeChange={setDateFilterType}
            businessUnits={businessUnits}
            onBusinessUnitToggle={toggleBusinessUnit}
            dataType={dataType}
            onDataTypeChange={setDataType}
            onLoadData={handleLoadInvoiceSales}
            onRefreshData={handleRefreshData}
            isLoading={invoiceLoading}
            selectedYears={years}
            rangeDates={rangeDates}
            specificDates={specificDates}
          />
        </Box>

        {/* Filter Tambahan */}
        <Box sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2.5, md: 3 },
          height: '100%'
        }}>
          {/* YearCards di Atas */}
          <Box sx={{
            display: 'flex',
            alignItems: 'start',
            flexShrink: 0
          }}>
            <YearCards
              availableYears={availableYears}
              selectedYears={years}
              yearTotals={yearTotals}
              onToggleYear={toggleYear}
              isLoading={yearSummaryLoading}
              dateFilterType={dateFilterType}
            />
          </Box>

          {/* Filter Tambahan (Range, Specific, Compare Year)*/}
          <Card sx={{
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0',
            p: { xs: 2, md: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            flex: 1,
            minHeight: 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15), 0 2px 8px rgba(0,0,0,0.1)',
              borderColor: '#bdbdbd',
              transform: 'translateY(-2px)'
            }
          }}>
            {dateFilterType === 'range' && (
              <RangeDateFilter
                rangeDates={rangeDates}
                onAddRange={addRangeDate}
                onRemoveRange={removeRangeDate}
                availableYears={availableYears}
                selectedYears={years}
              />
            )}

            {dateFilterType === 'specific' && (
              <SpecificDateFilter
                specificDates={specificDates}
                onAddDate={addSpecificDate}
                onRemoveDate={removeSpecificDate}
                availableYears={availableYears}
              />
            )}

            {dateFilterType === 'year' && (
              <SummaryCard
                businessUnits={businessUnits}
                selectedYears={years}
                dateFilterType={dateFilterType}
                invoiceData={invoiceData}
              />
            )}
          </Card>
        </Box>
      </Box>

      {/* Card Chart*/}
      <Card sx={{
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        p: { xs: 2.5, md: 3.5 },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 350, md: 450 },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(25, 118, 210, 0.15), 0 4px 12px rgba(0,0,0,0.1)',
          borderColor: '#bdbdbd',
          transform: 'translateY(-2px)'
        }
      }}>
        <Box sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography sx={{
            fontSize: { xs: '0.9375rem', md: '1.0625rem' },
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4
          }}>
            Grafik Penjualan & Quantity
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setShowDetail(!showDetail)}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1976d2',
              borderColor: '#1976d2',
              borderWidth: 2,
              borderRadius: 1.5,
              minWidth: 'auto',
              px: 2.5,
              py: 0.75,
              boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#1565c0',
                borderWidth: 2,
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                transform: 'translateY(-2px) scale(1.05)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)',
                transition: 'all 0.1s ease'
              }
            }}
          >
            {showDetail ? 'Sembunyikan Detail' : 'Show Detail'}
          </Button>
        </Box>

        <Box sx={{
          width: '100%',
          flex: 1,
          position: 'relative',
          minHeight: { xs: 280, md: 350 }
        }}>
          <Line
            ref={invoiceChartRef}
            data={invoiceChartData}
            options={invoiceChartOptions}
            style={{
              opacity: invoiceLoading ? 0.3 : 1,
              transition: 'opacity 0.3s ease-in-out',
              pointerEvents: invoiceLoading ? 'none' : 'auto'
            }}
          />
          {invoiceLoading && (
            <Fade in={invoiceLoading}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                zIndex: 10,
                borderRadius: 2,
                backdropFilter: 'blur(4px)'
              }}>
                <CircularProgress 
                  size={56} 
                  thickness={4}
                  sx={{
                    color: '#1976d2',
                    mb: 2,
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    }
                  }}
                />
                <Typography sx={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: '#1976d2',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  letterSpacing: '-0.01em',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1
                    },
                    '50%': {
                      opacity: 0.6
                    }
                  }
                }}>
                  Memuat data...
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default ChartInvoice;
