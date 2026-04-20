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
import { Line, Bar } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Card,
  Button,
  CircularProgress,
  Fade,
  Drawer,
  IconButton,
  Chip,
  Paper,
  Portal,
  Backdrop
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import dayjs from 'dayjs';
import { DateRange } from 'react-date-range';
import { enGB } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import FilterSection from '../components/filters/FilterSection';
import YearsCardBU from '../../ChartBU/YearsCardBU';
import RangeDateFilter from '../components/filters/RangeTanggal/RangeDateFilter';
import SpecificDateFilter from '../components/filters/TanggalTertentu/SpecificDateFilter';
import SummaryCard from '../components/filters/SummaryCard';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import { formatCurrency, formatShortNumber, getAvailableYears } from '../utils';
import { loadYearSummary, loadInvoiceSales, refreshData } from '../apiService';
import { generateChartConfig } from '../chartConfig';
import { useMobile } from './useMobile';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RevenueLastUpdate from '../../../components/RevenueLastUpdate';

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

function ChartInvoiceMobile() {
  const [businessUnits, setBusinessUnits] = useState(['Gosave', 'Goto']);
  const [dateFilterType, setDateFilterType] = useState('year');
  const [dataType, setDataType] = useState('both'); 
  const [years, setYears] = useState([]);
  const [rangeDates, setRangeDates] = useState([]);
  const [specificDates, setSpecificDates] = useState([]);
  const [specificDateRanges, setSpecificDateRanges] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [yearSummary, setYearSummary] = useState({}); 
  const [yearSummaryLoading, setYearSummaryLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [yearCardsDrawerOpen, setYearCardsDrawerOpen] = useState(false);
  const [additionalFiltersDrawerOpen, setAdditionalFiltersDrawerOpen] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });
  const [showMultiRangePicker, setShowMultiRangePicker] = useState(false);
  const [multiRangeSelection, setMultiRangeSelection] = useState({
    startDate: null,
    endDate: null,
    key: 'selection',
  });
  const [validatedMultiRanges, setValidatedMultiRanges] = useState([]);
  const invoiceChartRef = useRef(null);
  const showDetailRef = useRef(showDetail);
  const isMountedRef = useRef(true);
  const pickerRef = useRef(null);
  const { alertState, showAlert, showError, showWarning, closeAlert } = useAlert();
  const isMobile = useMobile();
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    showDetailRef.current = showDetail;
    if (invoiceChartRef.current) {
      invoiceChartRef.current.update();
    }
  }, [showDetail]);

  useEffect(() => {
    if (invoiceChartRef.current) {
      invoiceChartRef.current.update();
    }
  }, [invoiceData]);

  const availableYears = getAvailableYears();
  
  // Garis vertikal saat hover tooltip
  useEffect(() => {
    const hoverGuideLinePlugin = {
      id: 'hoverGuideLine',
      afterDatasetsDraw: (chart, _args, pluginOptions) => {
        const { ctx, chartArea, tooltip } = chart;
        const activeElements = tooltip?.getActiveElements?.() || tooltip?._active || [];
        if (!activeElements.length || !chartArea) return;

        const activePoint = activeElements[0];
        const x = activePoint?.element?.x;
        if (typeof x !== 'number') return;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.lineWidth = pluginOptions?.lineWidth ?? 1.2;
        ctx.strokeStyle = pluginOptions?.color ?? 'rgba(47, 111, 178, 0.55)';
        ctx.setLineDash(pluginOptions?.dashPattern ?? [6, 4]);
        ctx.stroke();
        ctx.restore();
      }
    };

    ChartJS.register(hoverGuideLinePlugin);
    return () => {
      ChartJS.unregister(hoverGuideLinePlugin);
    };
  }, []);

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
        ctx.font = isMobile ? 'bold 9px Segoe UI, sans-serif' : 'bold 11px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelPadding = isMobile ? 4 : 6;
        const labelHeight = isMobile ? 16 : 20;
        const labelSpacing = isMobile ? 3 : 4;
        const minXDistance = isMobile ? 40 : 50; 
        const maxLabelWidth = isMobile ? 60 : 80; 
        
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
            
            const baseOffset = isNearTop ? 20 : -20;
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
              adjustedY = label.baseY + 30;
              label.isNearTop = false;
              hasAnyCollision = true; 
            }
            else if (labelBottom > chartArea.bottom - 10) {
              adjustedY = label.baseY - 30;
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
          
          const radius = isMobile ? 3 : 4;
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
  }, [isMobile]);

  useEffect(() => {
    loadYearSummary(availableYears, setYearSummary, setYearSummaryLoading, businessUnits);
  }, [businessUnits]);

  useEffect(() => {
    if (dateFilterType !== 'year' && years.length > 1) {
      setYears(prev => prev.length > 0 ? [prev[0]] : []);
    }
  }, [dateFilterType]);

  useEffect(() => {
    if (rangeDates.length > 0) {
      setSelectionRange({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      });
    }
  }, [rangeDates]);

  // Handler untuk multi range comparison
  const handleMultiRangeSelect = (ranges) => {
    setMultiRangeSelection(ranges.selection);
  };

  const handleAddMultiRange = () => {
    try {
      if (!multiRangeSelection.startDate || !multiRangeSelection.endDate) {
        showWarning('Pilih range tanggal terlebih dahulu');
        return;
      }
      
      const startDate = new Date(multiRangeSelection.startDate);
      const endDate = new Date(multiRangeSelection.endDate);
      
      if (startDate > endDate) {
        showWarning('Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir');
        return;
      }

      const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 31) {
        showWarning('Range maksimal 31 hari');
        return;
      }

      if (validatedMultiRanges.length >= 5) {
        showWarning('Maksimum 5 range untuk perbandingan');
        return;
      }

      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatDateDisplayForMulti = (date) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${day} ${monthNames[month - 1]} ${year}`;
      };

      const displayLabel = formatDateDisplayForMulti(startDate) + 
        (startDate.getTime() !== endDate.getTime() ? ` - ${formatDateDisplayForMulti(endDate)}` : '');

      const newRange = {
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
        display: displayLabel,
        days: diffDays,
        validated: true
      };

      const isDuplicate = validatedMultiRanges.some(range => 
        range.startDate === newRange.startDate && range.endDate === newRange.endDate
      );

      if (isDuplicate) {
        showWarning('Range tanggal ini sudah ditambahkan');
        return;
      }

      setValidatedMultiRanges(prev => [...prev, newRange]);
      
      setMultiRangeSelection({
        startDate: null,
        endDate: null,
        key: 'selection',
      });
    } catch (error) {
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveMultiRange = (rangeToRemove) => {
    setValidatedMultiRanges(prev => prev.filter(r => 
      !(r.startDate === rangeToRemove.startDate && r.endDate === rangeToRemove.endDate)
    ));
  };

  const handleClearAllMultiRanges = () => {
    setValidatedMultiRanges([]);
    setMultiRangeSelection({
      startDate: null,
      endDate: null,
      key: 'selection',
    });
  };

  // Update specificDateRanges ketika validatedMultiRanges berubah (dari mobile picker)
  useEffect(() => {
    if (dateFilterType === 'specific' && validatedMultiRanges.length > 0) {
      setSpecificDateRanges(validatedMultiRanges);
    } else if (dateFilterType === 'specific' && validatedMultiRanges.length === 0) {
      setSpecificDateRanges([]);
    }
  }, [validatedMultiRanges, dateFilterType]);

  // Sync validatedMultiRanges ketika specificDateRanges berubah dari drawer
  useEffect(() => {
    if (dateFilterType === 'specific') {
      const rangesStr = JSON.stringify(specificDateRanges);
      const validatedStr = JSON.stringify(validatedMultiRanges);
      if (rangesStr !== validatedStr) {
        setValidatedMultiRanges(specificDateRanges || []);
      }
    }
  }, [specificDateRanges, dateFilterType]);

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
      setYearSummaryLoading,
      showAlert
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
    try {
      let dateWithYear;
      
      if (typeof dateObj === 'string') {
        const parts = dateObj.split('-');
        if (parts.length !== 2) {
          showWarning('Format tanggal tidak valid');
          return;
        }
        const currentYear = new Date().getFullYear();
        dateWithYear = { year: currentYear, monthDay: dateObj };
      } else if (typeof dateObj === 'object' && dateObj.year && dateObj.monthDay) {
        dateWithYear = dateObj;
      } else {
        showWarning('Format tanggal tidak valid');
        return;
      }
      
      const parts = dateWithYear.monthDay.split('-');
      if (parts.length !== 2) {
        showWarning('Format tanggal tidak valid. Gunakan format MM-DD (contoh: 12-25)');
        return;
      }
      
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      
      if (isNaN(month) || month < 1 || month > 12) {
        showWarning('Bulan tidak valid');
        return;
      }
      
      if (isNaN(day) || day < 1 || day > 31) {
        showWarning('Hari tidak valid');
        return;
      }
      
      const dateExists = specificDates.some(date => {
        if (typeof date === 'string') {
          return date === dateWithYear.monthDay;
        }
        return date.year === dateWithYear.year && date.monthDay === dateWithYear.monthDay;
      });
      
      if (dateExists) {
        showWarning(`Tanggal ${day}/${month}/${dateWithYear.year} sudah dipilih`);
        return;
      }
      
      const testDate = dayjs(`${dateWithYear.year}-${dateWithYear.monthDay}`);
      if (!testDate.isValid() || testDate.month() !== (month - 1) || testDate.date() !== day) {
        showWarning(`Tanggal ${day}/${month}/${dateWithYear.year} tidak valid. Silakan pilih tanggal yang valid.`);
        return;
      }
      
      setSpecificDates(prev => {
        try {
          const newDates = [...prev, dateWithYear];
          const sorted = newDates.sort((a, b) => {
            const aYear = typeof a === 'string' ? 0 : a.year;
            const bYear = typeof b === 'string' ? 0 : b.year;
            if (aYear !== bYear) return aYear - bYear;
            
            const aMonthDay = typeof a === 'string' ? a : a.monthDay;
            const bMonthDay = typeof b === 'string' ? b : b.monthDay;
            return aMonthDay.localeCompare(bMonthDay);
          });
          return sorted;
        } catch (sortError) {
          return [...prev, dateWithYear];
        }
      });
    } catch (error) {
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
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
      if (!range || !range.start || !range.end || !range.year) {
        showWarning('Format range tidak valid. Pastikan tahun sudah dipilih dari card tahun.');
        return;
      }
      
      const isValidMonthDay = (value) => {
        if (!value || typeof value !== 'string') return false;
        const parts = value.split('-');
        if (parts.length !== 2) return false;
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        return !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31;
      };
      
      if (!isValidMonthDay(range.start) || !isValidMonthDay(range.end)) {
        showWarning('Format tanggal tidak valid. Gunakan format MM-DD (contoh: 12-25)');
        return;
      }
      
      const MAX_RANGE_DATES = 1;
      if (rangeDates.length >= MAX_RANGE_DATES) {
        showWarning(`Maksimal ${MAX_RANGE_DATES} range yang bisa dipilih. Hapus range yang ada terlebih dahulu.`);
        return;
      }
      
      const rangeExists = rangeDates.some(r => 
        r.start === range.start && r.end === range.end && r.year === range.year
      );
      
      if (rangeExists) {
        showWarning(`Range tanggal ini untuk tahun ${range.year} sudah dipilih`);
        return;
      }
      
      const testStartDate = dayjs(`${range.year}-${range.start}`);
      const testEndDate = dayjs(`${range.year}-${range.end}`);
      
      if (!testStartDate.isValid() || !testEndDate.isValid()) {
        showWarning('Tanggal tidak valid. Silakan pilih tanggal yang valid.');
        return;
      }
      
      if (testEndDate.isBefore(testStartDate)) {
        showWarning('Tanggal akhir harus lebih besar atau sama dengan tanggal mulai');
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
          return [...prev, range];
        }
      });
    } catch (error) {
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const removeRangeDate = (range) => {
    setRangeDates(prev => prev.filter(r => 
      !(r.start === range.start && r.end === range.end && r.year === range.year)
    ));
  };

  // Handler untuk date range picker mobile
  const handleRangeSelect = (ranges) => {
    setSelectionRange(ranges.selection);
  };

  const handleAddRangeFromPicker = () => {
    try {
      if (!selectionRange.startDate || !selectionRange.endDate) {
        showWarning('Pilih tanggal mulai dan akhir terlebih dahulu');
        return;
      }
      
      const year = selectionRange.startDate.getFullYear();
      const startMonth = String(selectionRange.startDate.getMonth() + 1).padStart(2, '0');
      const startDay = String(selectionRange.startDate.getDate()).padStart(2, '0');
      const endMonth = String(selectionRange.endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(selectionRange.endDate.getDate()).padStart(2, '0');
      
      const startMonthDay = `${startMonth}-${startDay}`;
      const endMonthDay = `${endMonth}-${endDay}`;
      
      const testStartDate = new Date(year, parseInt(startMonth) - 1, parseInt(startDay));
      const testEndDate = new Date(year, parseInt(endMonth) - 1, parseInt(endDay));
      
      if (testStartDate.getMonth() !== (parseInt(startMonth) - 1) || 
          testStartDate.getDate() !== parseInt(startDay)) {
        showWarning('Tanggal mulai tidak valid');
        return;
      }
      
      if (testEndDate.getMonth() !== (parseInt(endMonth) - 1) || 
          testEndDate.getDate() !== parseInt(endDay)) {
        showWarning('Tanggal akhir tidak valid');
        return;
      }
      
      if (testEndDate < testStartDate) {
        showWarning('Tanggal akhir harus >= tanggal mulai');
        return;
      }
      
      const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
      const diffInDays = Math.floor((testEndDate - testStartDate) / MILLISECONDS_PER_DAY) + 1;
      if (diffInDays > 31) {
        showWarning('Range tanggal maksimal 31 hari');
        return;
      }
      
      const rangeExists = rangeDates.some(range => 
        range.start === startMonthDay && range.end === endMonthDay && range.year === year
      );
      
      if (rangeExists) {
        showWarning('Range dengan tanggal ini sudah ada');
        return;
      }
      
      if (rangeDates.length >= 1) {
        showWarning('Maksimal 1 range yang bisa dipilih. Hapus range yang ada terlebih dahulu.');
        return;
      }
      
      addRangeDate({ start: startMonthDay, end: endMonthDay, year });
      
      setSelectionRange({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      });
      
      setShowRangePicker(false);
    } catch (error) {
      showError('Terjadi error: ' + (error.message || 'Unknown error'));
    }
  };

  const getMinDate = () => {
    if (availableYears.length === 0) return new Date();
    const minYear = Math.min(...availableYears);
    return new Date(minYear, 0, 1);
  };

  const getMaxDate = () => {
    if (availableYears.length === 0) return new Date();
    const maxYear = Math.max(...availableYears);
    return new Date(maxYear, 11, 31);
  };

  const handleLoadInvoiceSales = async () => {
    const effectiveDateType = (dateFilterType === 'specific' && specificDateRanges.length > 0) 
      ? 'multi_range' 
      : dateFilterType;
    
    const effectiveRangeDates = (dateFilterType === 'specific' && specificDateRanges.length > 0) 
      ? specificDateRanges.map(r => ({ start: r.startDate, end: r.endDate }))
      : rangeDates;
    
    const effectiveSpecificDates = (dateFilterType === 'specific' && specificDateRanges.length > 0) 
      ? [] 
      : specificDates;
    
    await loadInvoiceSales({
      businessUnits,
      dateFilterType: effectiveDateType,
      years,
      rangeDates: effectiveRangeDates,
      specificDates: effectiveSpecificDates,
      availableYears,
      setInvoiceData,
      setInvoiceLoading,
      showAlert
    });
    
    // Tutup drawer setelah load data
    setFilterDrawerOpen(false);
  };

  const isYearFilter = dateFilterType === 'year';
  const isSpecificDate = dateFilterType === 'specific';
  
  const effectiveDateType = (dateFilterType === 'specific' && specificDateRanges.length > 0) 
    ? 'multi_range' 
    : dateFilterType;
  
  const effectiveSpecificDates = (effectiveDateType === 'multi_range') 
    ? [] 
    : specificDates;
  
  const { chartData: invoiceChartData, chartOptions: baseChartOptions } = generateChartConfig({
    dateFilterType: effectiveDateType,
    invoiceData,
    businessUnits,
    years,
    specificDates: effectiveSpecificDates,
    dataType
  });

  // Chart >> Mobile
  const invoiceChartOptions = React.useMemo(() => {
    if (!baseChartOptions) return baseChartOptions;
    
    const mobileOptions = JSON.parse(JSON.stringify(baseChartOptions)); 
    
    // Resize Mobile
    if (mobileOptions.plugins) {
      if (mobileOptions.plugins.legend && mobileOptions.plugins.legend.labels) {
        mobileOptions.plugins.legend.labels.font = {
          ...mobileOptions.plugins.legend.labels.font,
          size: 10
        };
        mobileOptions.plugins.legend.labels.padding = 12;
      }
      
      if (mobileOptions.plugins.tooltip) {
        if (mobileOptions.plugins.tooltip.titleFont) {
          mobileOptions.plugins.tooltip.titleFont.size = 10;
        }
        if (mobileOptions.plugins.tooltip.bodyFont) {
          mobileOptions.plugins.tooltip.bodyFont.size = 10;
        }
        mobileOptions.plugins.tooltip.padding = 8;
      }
    }
    
    // Ubah bentuk mobile
    if (mobileOptions.scales) {
      Object.keys(mobileOptions.scales).forEach(scaleKey => {
        const scale = mobileOptions.scales[scaleKey];
        if (scale && scale.ticks && scale.ticks.font) {
          scale.ticks.font.size = scale.ticks.font.size ? scale.ticks.font.size - 2 : 9;
        }
        if (scale && scale.title && scale.title.font) {
          scale.title.font.size = scale.title.font.size ? scale.title.font.size - 2 : 10;
        }
      });
    }
    
    return mobileOptions;
  }, [baseChartOptions, isMobile]);

  const yearTotals = { ...yearSummary };

  // Helper function untuk format tanggal
  const formatDateDisplay = (monthDay, year) => {
    const [month, day] = monthDay.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dateStr = `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
    return year ? `${dateStr} ${year}` : dateStr;
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)',
      pt: 2,
      px: 2,
      pb: 2,
      gap: 2,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'auto', 
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(47, 111, 178, 0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      {/* Revenue Invoice dan Pilih Tahun - Bersampingan */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        width: '100%'
      }}>
        {/* Revenue Invoice Header Card */}
        <Card sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #E5E7EB',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          flex: 1,
          minWidth: 0
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2
          }}>
            <Typography sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              Revenue Invoice
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              size="small"
              sx={{
                color: '#2F6FB2',
                bgcolor: 'rgba(47, 111, 178, 0.1)',
                ml: 1,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'rgba(47, 111, 178, 0.2)'
                }
              }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Box>
        </Card>

        {/* Year Cards Button - Opens Drawer */}
        <Card sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #E5E7EB',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: 0,
          '&:hover': {
            bgcolor: 'rgba(47, 111, 178, 0.05)',
            borderColor: '#2F6FB2'
          },
          '&:active': {
            transform: 'scale(0.98)'
          }
        }}
        onClick={() => setYearCardsDrawerOpen(true)}
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2
          }}>
            <Typography sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#212121',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              Pilih Tahun
            </Typography>
            <IconButton size="small" sx={{ color: '#2F6FB2', ml: 1, flexShrink: 0 }}>
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        </Card>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <YearsCardBU
          availableYears={availableYears}
          selectedYears={years}
          yearTotals={yearTotals}
          onToggleYear={toggleYear}
          isLoading={yearSummaryLoading}
          dateFilterType={dateFilterType}
        />
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '90vh',
            pb: 2
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#212121',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}>
            Filter
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, overflow: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
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
      </Drawer>

      {/* Year Cards Drawer */}
      <Drawer
        anchor="bottom"
        open={yearCardsDrawerOpen}
        onClose={() => setYearCardsDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '90vh',
            pb: 2
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#212121',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}>
            Pilih Tahun
          </Typography>
          <IconButton onClick={() => setYearCardsDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, overflow: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          <YearsCardBU
            availableYears={availableYears}
            selectedYears={years}
            yearTotals={yearTotals}
            onToggleYear={(year) => {
              toggleYear(year);
              if (dateFilterType !== 'year') {
                setYearCardsDrawerOpen(false);
              }
            }}
            isLoading={yearSummaryLoading}
            dateFilterType={dateFilterType}
          />
        </Box>
      </Drawer>

      {/* Additional Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={additionalFiltersDrawerOpen}
        onClose={() => setAdditionalFiltersDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '90vh',
            pb: 2
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#212121',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}>
            {dateFilterType === 'range' ? 'Range Tanggal' : 'Tanggal Tertentu'}
          </Typography>
          <IconButton onClick={() => setAdditionalFiltersDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, overflow: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          {dateFilterType === 'range' && (
            <RangeDateFilter
              rangeDates={rangeDates}
              onAddRange={addRangeDate}
              onRemoveRange={removeRangeDate}
              availableYears={availableYears}
              selectedYears={years}
              businessUnits={businessUnits}
              onBusinessUnitToggle={toggleBusinessUnit}
              dataType={dataType}
              onDataTypeChange={setDataType}
              invoiceData={invoiceData}
            />
          )}

          {dateFilterType === 'specific' && (
            <SpecificDateFilter
              specificDates={specificDates}
              onAddDate={addSpecificDate}
              onRemoveDate={removeSpecificDate}
              availableYears={availableYears}
              businessUnits={businessUnits}
              onBusinessUnitToggle={toggleBusinessUnit}
              dataType={dataType}
              onDataTypeChange={setDataType}
              invoiceData={invoiceData}
              onValidatedRangesChange={(ranges) => {
                setSpecificDateRanges(ranges);
                setSpecificDates([]);
                setInvoiceData([]);
              }}
            />
          )}
        </Box>
      </Drawer>

      {/* Summary Card untuk Year Filter - Tetap seperti awal */}
      {dateFilterType === 'year' && (
        <SummaryCard
          businessUnits={businessUnits}
          selectedYears={years}
          dateFilterType={dateFilterType}
          invoiceData={invoiceData}
        />
      )}

      {/* Summary Card untuk Range Tanggal - Langsung ditampilkan */}
      {dateFilterType === 'range' && (
        <>
          <Card sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            p: 2
          }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mb: 1.5
            }}
          >
            <Typography sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#0F172A',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              letterSpacing: '-0.01em',
              lineHeight: 1.3
            }}>
              Ringkasan Data
            </Typography>
            <RevenueLastUpdate
              sx={{
                maxWidth: '100%',
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(4, 1fr)' 
            },
            gap: { xs: 1, md: 1.25 }
          }}>
            {/* Business Unit */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <BusinessIcon />
                  </Box>
                  BUSINESS UNIT
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {businessUnits && businessUnits.length > 0 ? businessUnits.join(', ') : 'Belum dipilih'}
              </Typography>
            </Card>

            {/* Range Tanggal */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <CalendarMonthIcon />
                  </Box>
                  RANGE TANGGAL
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {rangeDates && rangeDates.length > 0 
                  ? rangeDates.map(range => `${formatDateDisplay(range.start, range.year)} - ${formatDateDisplay(range.end, range.year)}`).join(', ')
                  : 'Belum dipilih'}
              </Typography>
            </Card>

            {/* Status Data */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <CheckCircleIcon />
                  </Box>
                  STATUS DATA
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: invoiceData && invoiceData.length > 0 ? '#2F6FB2' : '#BDBDBD',
                    flexShrink: 0
                  }}
                />
                {invoiceData && invoiceData.length > 0 ? 'Dimuat' : 'Belum dimuat'}
              </Typography>
            </Card>

            {/* Tipe Filter */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <FilterListIcon />
                  </Box>
                  TIPE FILTER
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                Range Tanggal (Bulan & Hari)
              </Typography>
            </Card>
          </Box>

          {/* Tombol Picker - Di bawah 4 card */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowRangePicker(!showRangePicker)}
              disabled={rangeDates.length >= 1}
              startIcon={
                <CalendarMonthRoundedIcon 
                  sx={{ 
                    fontSize: '1.1rem',
                    color: showRangePicker ? '#2F6FB2' : '#64748B',
                    transition: 'color 0.2s ease'
                  }} 
                />
              }
              sx={{
                borderColor: showRangePicker ? '#2F6FB2' : '#E2E8F0',
                color: showRangePicker ? '#2F6FB2' : '#475569',
                bgcolor: showRangePicker ? 'rgba(47, 111, 178, 0.08)' : 'transparent',
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: showRangePicker ? 600 : 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                borderRadius: 1.5,
                px: 2,
                py: 0.875,
                width: '100%',
                height: '40px',
                boxShadow: showRangePicker ? '0 2px 4px rgba(47, 111, 178, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#2F6FB2',
                  bgcolor: showRangePicker ? 'rgba(47, 111, 178, 0.12)' : 'rgba(47, 111, 178, 0.06)',
                  boxShadow: showRangePicker ? '0 2px 6px rgba(47, 111, 178, 0.2)' : 'none',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                '&:disabled': {
                  borderColor: '#E2E8F0',
                  color: '#94A3B8',
                  bgcolor: '#F8FAFC',
                  transform: 'none',
                  cursor: 'not-allowed'
                }
              }}
            >
              {showRangePicker ? 'Tutup Kalender' : 'Pilih Range Tanggal'}
            </Button>
          </Box>

          {/* Daftar Range yang Sudah Ditambahkan - Multi Range */}
          {rangeDates.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.75, 
              mt: 2,
              pt: 2,
              borderTop: '1px solid #F1F5F9'
            }}>
              <Typography sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#0F172A',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                width: '100%',
                mb: 0.5
              }}>
                Multi Range
              </Typography>
              {rangeDates.map((range, index) => (
                <Chip
                  key={`${range.start}_${range.end}_${range.year}_${index}`}
                  label={`${formatDateDisplay(range.start, range.year)} - ${formatDateDisplay(range.end, range.year)}`}
                  onDelete={() => removeRangeDate(range)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    height: 28,
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      bgcolor: '#F8FAFC'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: '#94A3B8',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#64748B'
                      }
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Card>

        {/* Date Range Picker Modal untuk Mobile */}
        {showRangePicker && (
          <Portal>
            <Backdrop
              open={showRangePicker}
              onClick={() => setShowRangePicker(false)}
              sx={{
                zIndex: 1299,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
            <Fade in={showRangePicker} timeout={300}>
              <Paper
                ref={pickerRef}
                elevation={8}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1300,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'white',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                  width: { xs: '95%', sm: '90%', md: '600px' },
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& *': {
                    boxSizing: 'border-box',
                  },
                  '& .rdr-DefinedRangesWrapper': {
                    display: 'none !important',
                  },
                  '& .rdr-DateRangePicker': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                  },
                  '& .rdr-DateRange': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                    display: 'flex !important',
                    flexDirection: 'column !important',
                  },
                  '& .rdr-CalendarWrapper': {
                    display: 'flex !important',
                    flexDirection: 'column !important',
                    width: '100% !important',
                  },
                  '& .rdr-Calendar': {
                    borderRadius: 3,
                    width: '100% !important',
                    maxWidth: '100% !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Month': {
                    width: '100% !important',
                    maxWidth: '100% !important',
                    padding: '0.75rem !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Day': {
                    fontSize: '0.875rem !important',
                    height: '36px !important',
                    width: '36px !important',
                    maxWidth: '36px !important',
                    maxHeight: '36px !important',
                    lineHeight: '36px !important',
                    margin: '2px !important',
                    padding: '0 !important',
                  },
                  '& .rdr-DayNumber': {
                    fontSize: '0.875rem !important',
                    padding: '0 !important',
                    lineHeight: '36px !important',
                  },
                  '& .rdr-MonthAndYearWrapper': {
                    paddingTop: '0.75rem !important',
                    paddingBottom: '0.75rem !important',
                    paddingLeft: '0.75rem !important',
                    paddingRight: '0.75rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-MonthAndYearPickers': {
                    fontSize: '1rem !important',
                    fontWeight: '600 !important',
                    padding: '0 !important',
                  },
                  '& .rdr-WeekDay': {
                    fontSize: '0.75rem !important',
                    fontWeight: '600 !important',
                    padding: '0.5rem !important',
                    height: 'auto !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Days': {
                    padding: '0.5rem !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplay': {
                    padding: '0.75rem !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-DateDisplayItem': {
                    padding: '0.5rem 0.75rem !important',
                    fontSize: '0.875rem !important',
                    lineHeight: '1.5 !important',
                  },
                  '& .rdr-WeekDays': {
                    padding: '0.5rem 0 !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplayWrapper': {
                    padding: '0.75rem !important',
                    margin: '0 !important',
                  }
                }}
              >
                {/* Header */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: '1px solid #F1F5F9',
                  bgcolor: '#FAFBFC'
                }}>
                  <Typography sx={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Pilih Range Tanggal
                  </Typography>
                  <IconButton
                    onClick={() => {
                      setShowRangePicker(false);
                      setSelectionRange({
                        startDate: new Date(),
                        endDate: new Date(),
                        key: 'selection',
                      });
                    }}
                    size="small"
                    sx={{
                      color: '#64748B',
                      '&:hover': {
                        bgcolor: '#F1F5F9',
                        color: '#0F172A'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Date Range Picker - Mobile: 1 bulan saja */}
                <Box sx={{
                  p: 2,
                  bgcolor: 'white',
                }}>
                  <DateRange
                    ranges={[selectionRange]}
                    onChange={(ranges) => handleRangeSelect(ranges)}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    months={1}
                    direction="vertical"
                    showDateDisplay={true}
                    showMonthAndYearPickers={true}
                    locale={enGB}
                  />
                  
                  {/* Tombol Batal dan Tambah Range */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid #F1F5F9',
                    justifyContent: 'flex-end'
                  }}>
                    <Button 
                      variant="outlined" 
                      size="medium" 
                      onClick={() => {
                        setShowRangePicker(false);
                        setSelectionRange({
                          startDate: new Date(),
                          endDate: new Date(),
                          key: 'selection',
                        });
                      }}
                      sx={{
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 2.5,
                        py: 0.75,
                        minWidth: '100px',
                        height: '40px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: '#2F6FB2',
                          color: '#2F6FB2',
                          bgcolor: 'rgba(47, 111, 178, 0.08)',
                          boxShadow: '0 2px 4px rgba(47, 111, 178, 0.15)',
                        }
                      }}
                    >
                      Batal
                    </Button>
                    <Button 
                      variant="contained" 
                      size="medium" 
                      onClick={handleAddRangeFromPicker}
                      disabled={rangeDates.length >= 1}
                      sx={{
                        bgcolor: '#2F6FB2',
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 3,
                        py: 0.75,
                        minWidth: '140px',
                        height: '40px',
                        boxShadow: '0 2px 4px rgba(47, 111, 178, 0.2)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: '#1F4E8C',
                          boxShadow: '0 4px 8px rgba(47, 111, 178, 0.3)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 4px rgba(47, 111, 178, 0.25)'
                        },
                        '&:disabled': {
                          bgcolor: '#E2E8F0',
                          color: '#94A3B8',
                          boxShadow: 'none',
                          transform: 'none',
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      Tambah Range
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Portal>
        )}
        </>
      )}

      {/* Summary Card untuk Tanggal Tertentu (Multi Range Comparison) - Langsung ditampilkan */}
      {dateFilterType === 'specific' && (
        <>
          <Card sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #E5E7EB',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            p: 2
          }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mb: 1.5
            }}
          >
            <Typography sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              color: '#0F172A',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              letterSpacing: '-0.01em',
              lineHeight: 1.3
            }}>
              Ringkasan Data
            </Typography>
            <RevenueLastUpdate
              sx={{
                maxWidth: '100%',
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(4, 1fr)' 
            },
            gap: { xs: 1, md: 1.25 }
          }}>
            {/* Business Unit */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <BusinessIcon />
                  </Box>
                  BUSINESS UNIT
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {businessUnits && businessUnits.length > 0 ? businessUnits.join(', ') : 'Belum dipilih'}
              </Typography>
            </Card>

            {/* Multi Range */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <CalendarMonthIcon />
                  </Box>
                  MULTI RANGE
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {validatedMultiRanges && validatedMultiRanges.length > 0 
                  ? `${validatedMultiRanges.length} range dipilih`
                  : 'Belum dipilih'}
              </Typography>
            </Card>

            {/* Status Data */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <CheckCircleIcon />
                  </Box>
                  STATUS DATA
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: invoiceData && invoiceData.length > 0 ? '#2F6FB2' : '#BDBDBD',
                    flexShrink: 0
                  }}
                />
                {invoiceData && invoiceData.length > 0 ? 'Dimuat' : 'Belum dimuat'}
              </Typography>
            </Card>

            {/* Tipe Filter */}
            <Card sx={{ 
              bgcolor: '#FAFAFA', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #E5E7EB',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                borderColor: '#D1D5DB',
                bgcolor: '#FFFFFF',
                transform: 'translateY(-1px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
              }}>
                <Typography sx={{ 
                  fontSize: '0.6875rem', 
                  color: '#757575',
                  fontWeight: 500,
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ 
                    color: '#9E9E9E',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem'
                  }}>
                    <FilterListIcon />
                  </Box>
                  TIPE FILTER
                </Typography>
              </Box>
              <Typography sx={{ 
                fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
                fontWeight: 600, 
                color: '#212121',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {validatedMultiRanges.length > 0 ? 'Multi Range Comparison' : 'Tanggal Tertentu'}
              </Typography>
            </Card>
          </Box>

          {/* Tombol Picker - Di bawah 4 card */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowMultiRangePicker(!showMultiRangePicker)}
              disabled={validatedMultiRanges.length >= 5}
              startIcon={
                <CalendarMonthRoundedIcon 
                  sx={{ 
                    fontSize: '1.1rem',
                    color: showMultiRangePicker ? '#2F6FB2' : '#64748B',
                    transition: 'color 0.2s ease'
                  }} 
                />
              }
              sx={{
                borderColor: showMultiRangePicker ? '#2F6FB2' : '#E2E8F0',
                color: showMultiRangePicker ? '#2F6FB2' : '#475569',
                bgcolor: showMultiRangePicker ? 'rgba(47, 111, 178, 0.08)' : 'transparent',
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: showMultiRangePicker ? 600 : 500,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                borderRadius: 1.5,
                px: 2,
                py: 0.875,
                width: '100%',
                height: '40px',
                boxShadow: showMultiRangePicker ? '0 2px 4px rgba(47, 111, 178, 0.15)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#2F6FB2',
                  bgcolor: showMultiRangePicker ? 'rgba(47, 111, 178, 0.12)' : 'rgba(47, 111, 178, 0.06)',
                  boxShadow: showMultiRangePicker ? '0 2px 6px rgba(47, 111, 178, 0.2)' : 'none',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                '&:disabled': {
                  borderColor: '#E2E8F0',
                  color: '#94A3B8',
                  bgcolor: '#F8FAFC',
                  transform: 'none',
                  cursor: 'not-allowed'
                }
              }}
            >
              {showMultiRangePicker ? 'Tutup Kalender' : 'Pilih Multi Range Comparison'}
            </Button>
          </Box>

          {/* Daftar Multi Range yang Sudah Ditambahkan */}
          {validatedMultiRanges.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.75, 
              mt: 2,
              pt: 2,
              borderTop: '1px solid #F1F5F9'
            }}>
              <Typography sx={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#0F172A',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                width: '100%',
                mb: 0.5
              }}>
                Range yang Akan Dibandingkan
              </Typography>
              {validatedMultiRanges.map((range, index) => (
                <Chip
                  key={`${range.startDate}_${range.endDate}_${index}`}
                  label={`Range ${index + 1}: ${range.display} (${range.days} hari)`}
                  onDelete={() => handleRemoveMultiRange(range)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: '#E2E8F0',
                    color: '#475569',
                    fontSize: '0.75rem',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    height: 28,
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      bgcolor: '#F8FAFC'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: '#94A3B8',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#64748B'
                      }
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Card>

        {/* Multi Range Picker Modal untuk Mobile */}
        {showMultiRangePicker && (
          <Portal>
            <Backdrop
              open={showMultiRangePicker}
              onClick={() => setShowMultiRangePicker(false)}
              sx={{
                zIndex: 1299,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            
            <Fade in={showMultiRangePicker} timeout={300}>
              <Paper
                elevation={8}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1300,
                  borderRadius: 3,
                  overflow: 'hidden',
                  bgcolor: 'white',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                  width: { xs: '95%', sm: '90%', md: '600px' },
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& *': {
                    boxSizing: 'border-box',
                  },
                  '& .rdr-DefinedRangesWrapper': {
                    display: 'none !important',
                  },
                  '& .rdr-DateRangePicker': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                  },
                  '& .rdr-DateRange': {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: '100%',
                    display: 'flex !important',
                    flexDirection: 'column !important',
                  },
                  '& .rdr-CalendarWrapper': {
                    display: 'flex !important',
                    flexDirection: 'column !important',
                    width: '100% !important',
                  },
                  '& .rdr-Calendar': {
                    borderRadius: 3,
                    width: '100% !important',
                    maxWidth: '100% !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Month': {
                    width: '100% !important',
                    maxWidth: '100% !important',
                    padding: '0.75rem !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Day': {
                    fontSize: '0.875rem !important',
                    height: '36px !important',
                    width: '36px !important',
                    maxWidth: '36px !important',
                    maxHeight: '36px !important',
                    lineHeight: '36px !important',
                    margin: '2px !important',
                    padding: '0 !important',
                  },
                  '& .rdr-DayNumber': {
                    fontSize: '0.875rem !important',
                    padding: '0 !important',
                    lineHeight: '36px !important',
                  },
                  '& .rdr-MonthAndYearWrapper': {
                    paddingTop: '0.75rem !important',
                    paddingBottom: '0.75rem !important',
                    paddingLeft: '0.75rem !important',
                    paddingRight: '0.75rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-MonthAndYearPickers': {
                    fontSize: '1rem !important',
                    fontWeight: '600 !important',
                    padding: '0 !important',
                  },
                  '& .rdr-WeekDay': {
                    fontSize: '0.75rem !important',
                    fontWeight: '600 !important',
                    padding: '0.5rem !important',
                    height: 'auto !important',
                    minHeight: 'auto !important',
                  },
                  '& .rdr-Days': {
                    padding: '0.5rem !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplay': {
                    padding: '0.75rem !important',
                    fontSize: '0.875rem !important',
                    minHeight: 'auto !important',
                    maxHeight: 'none !important',
                  },
                  '& .rdr-DateDisplayItem': {
                    padding: '0.5rem 0.75rem !important',
                    fontSize: '0.875rem !important',
                    lineHeight: '1.5 !important',
                  },
                  '& .rdr-WeekDays': {
                    padding: '0.5rem 0 !important',
                    margin: '0 !important',
                  },
                  '& .rdr-DateDisplayWrapper': {
                    padding: '0.75rem !important',
                    margin: '0 !important',
                  }
                }}
              >
                {/* Header */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderBottom: '1px solid #F1F5F9',
                  bgcolor: '#FAFBFC'
                }}>
                  <Typography sx={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    letterSpacing: '-0.01em'
                  }}>
                    Multi Range Comparison
                  </Typography>
                  <IconButton
                    onClick={() => {
                      setShowMultiRangePicker(false);
                      setMultiRangeSelection({
                        startDate: null,
                        endDate: null,
                        key: 'selection',
                      });
                    }}
                    size="small"
                    sx={{
                      color: '#64748B',
                      '&:hover': {
                        bgcolor: '#F1F5F9',
                        color: '#0F172A'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Date Range Picker - Mobile: 1 bulan saja */}
                <Box sx={{
                  p: 2,
                  bgcolor: 'white',
                }}>
                  <DateRange
                    ranges={[multiRangeSelection]}
                    onChange={(ranges) => handleMultiRangeSelect(ranges)}
                    minDate={getMinDate()}
                    maxDate={getMaxDate()}
                    months={1}
                    direction="vertical"
                    showDateDisplay={true}
                    showMonthAndYearPickers={true}
                    locale={enGB}
                  />
                  
                  {/* Preview Validated Ranges */}
                  {validatedMultiRanges.length > 0 && (
                    <Box sx={{ 
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid #F1F5F9'
                    }}>
                      <Typography sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        mb: 1,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                      }}>
                        Range yang Sudah Ditambahkan ({validatedMultiRanges.length}/5)
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {validatedMultiRanges.map((range, idx) => (
                          <Box
                            key={`${range.startDate}-${range.endDate}-${idx}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              py: 0.75,
                              px: 1.25,
                              borderRadius: 1.25,
                              bgcolor: 'rgba(47, 111, 178, 0.08)',
                              border: '1px solid rgba(47, 111, 178, 0.3)',
                            }}
                          >
                            <Typography sx={{
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              color: '#0F172A',
                              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                              flex: 1
                            }}>
                              Range {idx + 1}: {range.display} ({range.days} hari)
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMultiRange(range)}
                              sx={{
                                width: '24px',
                                height: '24px',
                                p: 0.5,
                                color: '#2F6FB2',
                                '&:hover': {
                                  bgcolor: 'rgba(47, 111, 178, 0.1)',
                                  color: '#1F4E8C'
                                }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: '0.875rem' }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Tombol Batal, Tambah Range, dan Gunakan */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid #F1F5F9',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="medium" 
                        onClick={() => {
                          setShowMultiRangePicker(false);
                          setMultiRangeSelection({
                            startDate: null,
                            endDate: null,
                            key: 'selection',
                          });
                        }}
                        sx={{
                          borderColor: '#CBD5E1',
                          color: '#475569',
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          borderRadius: 1.5,
                          px: 2.5,
                          py: 0.75,
                          flex: 1,
                          height: '40px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            borderColor: '#2F6FB2',
                            color: '#2F6FB2',
                            bgcolor: 'rgba(47, 111, 178, 0.08)',
                            boxShadow: '0 2px 4px rgba(47, 111, 178, 0.15)',
                          }
                        }}
                      >
                        Batal
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="medium" 
                        onClick={handleAddMultiRange}
                        disabled={!multiRangeSelection.startDate || !multiRangeSelection.endDate || validatedMultiRanges.length >= 5}
                        sx={{
                          borderColor: '#2F6FB2',
                          color: '#2F6FB2',
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          borderRadius: 1.5,
                          px: 2.5,
                          py: 0.75,
                          flex: 1,
                          height: '40px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'rgba(47, 111, 178, 0.08)',
                            boxShadow: '0 2px 4px rgba(47, 111, 178, 0.15)',
                          },
                          '&:disabled': {
                            borderColor: '#E2E8F0',
                            color: '#94A3B8',
                            bgcolor: '#F8FAFC',
                            transform: 'none',
                            cursor: 'not-allowed'
                          }
                        }}
                      >
                        Tambah Range
                      </Button>
                    </Box>
                    <Button 
                      variant="contained" 
                      size="medium" 
                      onClick={() => {
                        if (validatedMultiRanges.length > 0) {
                          setShowMultiRangePicker(false);
                        }
                      }}
                      disabled={validatedMultiRanges.length === 0}
                      sx={{
                        bgcolor: '#2F6FB2',
                        color: 'white',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        borderRadius: 1.5,
                        px: 3,
                        py: 0.75,
                        width: '100%',
                        height: '40px',
                        boxShadow: '0 2px 4px rgba(47, 111, 178, 0.2)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          bgcolor: '#1F4E8C',
                          boxShadow: '0 4px 8px rgba(47, 111, 178, 0.3)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 4px rgba(47, 111, 178, 0.25)'
                        },
                        '&:disabled': {
                          bgcolor: '#E2E8F0',
                          color: '#94A3B8',
                          boxShadow: 'none',
                          transform: 'none',
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      Gunakan {validatedMultiRanges.length} Range untuk Perbandingan
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Portal>
        )}
        </>
      )}

      {/* Chart Card */}
      <Card sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E5E7EB',
        pt: 1.75,
        px: 1.75,
        pb: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 360,
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5
        }}>
          <Typography sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
          }}>
            Grafik Penjualan & Quantity
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setShowDetail(!showDetail)}
            size="small"
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#2F6FB2',
              borderColor: '#2F6FB2',
              borderWidth: '1px',
              borderRadius: '8px',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              boxShadow: 'none',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              '&:hover': {
                borderColor: '#1F4E8C',
                backgroundColor: 'rgba(47, 111, 178, 0.06)',
                borderWidth: '1px'
              }
            }}
          >
            {showDetail ? 'Sembunyikan' : 'Detail'}
          </Button>
        </Box>

        <Box sx={{
          width: '100%',
          flex: 1,
          position: 'relative',
          minHeight: 290
        }}>
          {dateFilterType === 'specific' ? (
            <Bar
              ref={invoiceChartRef}
              data={invoiceChartData}
              options={invoiceChartOptions}
              style={{
                height: '100%',
                opacity: invoiceLoading ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: invoiceLoading ? 'none' : 'auto'
              }}
            />
          ) : (
            <Line
              ref={invoiceChartRef}
              data={invoiceChartData}
              options={invoiceChartOptions}
              style={{
                height: '100%',
                opacity: invoiceLoading ? 0.3 : 1,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: invoiceLoading ? 'none' : 'auto'
              }}
            />
          )}
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
                  size={40} 
                  thickness={3.5}
                  sx={{
                    color: '#2F6FB2',
                    mb: 1.5
                  }}
                />
                <Typography sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#757575',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif'
                }}>
                  Memuat data...
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      </Card>

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        severity={alertState.severity}
      />
    </Box>
  );
}

export default ChartInvoiceMobile;

