import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
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
  Card
} from '@mui/material';
import FilterSection from './components/filters/FilterSection';
import YearCards from './components/filters/YearCards';
import RangeDateFilter from './components/filters/RangeDateFilter';
import SpecificDateFilter from './components/filters/SpecificDateFilter';
import CompareYearFilter from './components/filters/CompareYearFilter';
import SummaryCard from './components/filters/SummaryCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = 'http://localhost:8000/api';

function formatCurrency(num) {
  const value = parseFloat(num);
  if (isNaN(value)) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function ChartInvoice() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [dateFilterType, setDateFilterType] = useState('year');
  const [dataType, setDataType] = useState('both'); 
  const [years, setYears] = useState([]);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [specificDates, setSpecificDates] = useState([]);
  const [compareDates, setCompareDates] = useState([]);
  const [compareYears, setCompareYears] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [yearSummary, setYearSummary] = useState({}); 
  const [yearSummaryLoading, setYearSummaryLoading] = useState(false);
  const invoiceChartRef = useRef(null);

  const availableYears = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    availableYears.push(currentYear - i);
  }

  const loadYearSummary = async () => {
    try {
      setYearSummaryLoading(true);
      const params = new URLSearchParams();
      // Load BU
      params.append('business_units[]', 'Gosave');
      params.append('business_units[]', 'Goto');
      params.append('date_type', 'year');
      // Load All Years
      availableYears.forEach(year => {
        params.append('years[]', year);
      });
      
      const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        const summary = {};
        result.data.forEach(item => {
          const year = parseInt(item.year) || item.year;
          if (year) {
            if (!summary[year]) {
              summary[year] = { sales: 0, quantity: 0 };
            }
            const sales = parseFloat(item.total_sales) || 0;
            const quantity = parseFloat(item.total_quantity) || 0;
            summary[year].sales += sales;
            summary[year].quantity += quantity;
          }
        });
        setYearSummary(summary);
      }
    } catch (error) {
      console.error('Error loading year summary:', error);
    } finally {
      setYearSummaryLoading(false);
    }
  };

  // Load summary data tahun saat komponen mount
  useEffect(() => {
    loadYearSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fungsi refresh data seperti pertama kali page load
  const refreshData = async () => {
    try {
      setInvoiceLoading(true);
      setInvoiceData([]);

      await loadYearSummary();
      if (businessUnits.length > 0) {
        const canLoadData = 
          (dateFilterType === 'year' && years.length > 0) ||
          (dateFilterType === 'range' && rangeStart && rangeEnd && years.length === 1) ||
          (dateFilterType === 'specific' && specificDates.length > 0 && years.length > 0) ||
          (dateFilterType === 'compare_year' && compareDates.length > 0 && compareYears.length > 0);
        
        if (canLoadData) {
          try {
            const params = new URLSearchParams();
            businessUnits.forEach(unit => params.append('business_units[]', unit));
            params.append('date_type', dateFilterType);
            
            if (dateFilterType === 'year') {
              years.forEach(year => params.append('years[]', year));
            } else if (dateFilterType === 'range') {
              if (years.length > 0) {
                const year = years[0];
                const startDate = `${year}-${rangeStart}`;
                const endDate = `${year}-${rangeEnd}`;
                params.append('start_date', startDate);
                params.append('end_date', endDate);
              }
            } else if (dateFilterType === 'specific') {
              years.forEach(year => {
                specificDates.forEach(monthDay => {
                  const fullDate = `${year}-${monthDay}`;
                  params.append('specific_dates[]', fullDate);
                });
              });
            } else if (dateFilterType === 'compare_year') {
              compareDates.forEach(date => {
                params.append('compare_dates[]', date);
              });
              compareYears.forEach(year => {
                params.append('compare_years[]', year);
              });
            }
            
            const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.status === 'success' && Array.isArray(result.data)) {
              setInvoiceData(result.data);
            }
          } catch (error) {
            console.error('Error loading invoice data on refresh:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setInvoiceLoading(false);
    }
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
    // Untuk specific date, hanya bisa pilih 1 tahun
    if (dateFilterType === 'specific') {
      setYears(prev => {
        // Jika tahun yang sama diklik, reset (unselect)
        if (prev.includes(year)) {
          return [];
        } else {
          // Pilih tahun baru (hanya 1 tahun)
          return [year];
        }
      });
    } else {
      setYears(prev => {
        if (prev.includes(year)) {
          return prev.filter(y => y !== year);
        } else {
          return [...prev, year];
        }
      });
    }
  };

  const toggleCompareYear = (year) => {
    setCompareYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year];
      }
    });
  };

  const addSpecificDate = (monthDay) => {
    if (specificDates.length >= 30) {
      alert('Maksimal 30 tanggal');
      return;
    }
    
    if (specificDates.includes(monthDay)) {
      alert('Tanggal sudah dipilih');
      return;
    }
    
    setSpecificDates(prev => [...prev, monthDay].sort());
    // Reset tahun yang dipilih agar user bisa memilih tahun baru untuk menambah tanggal lagi
    setYears([]);
  };

  const removeSpecificDate = (date) => {
    setSpecificDates(prev => prev.filter(d => d !== date));
  };

  const addCompareDate = (monthDay) => {
    if (compareDates.includes(monthDay)) {
      alert('Tanggal & bulan ini sudah dipilih');
      return;
    }
    
    setCompareDates(prev => [...prev, monthDay]);
  };

  const removeCompareDate = (monthDay) => {
    setCompareDates(prev => prev.filter(d => d !== monthDay));
  };

  const loadInvoiceSales = async () => {
    if (businessUnits.length === 0) {
      alert('Pilih minimal 1 Business Unit');
      return;
    }
    
    if (dateFilterType === 'year' && years.length === 0) {
      alert('Pilih minimal 1 tahun');
      return;
    }
    
    if (dateFilterType === 'range') {
      if (!rangeStart || !rangeEnd) {
        alert('Pilih tanggal mulai dan akhir');
        return;
      }
      if (years.length === 0) {
        alert('Pilih minimal 1 tahun dari card tahun');
        return;
      }
      if (years.length > 1) {
        alert('Range tanggal hanya bisa menggunakan 1 tahun. Pilih 1 tahun saja dari card tahun.');
        return;
      }
    }
    
    if (dateFilterType === 'specific' && specificDates.length === 0) {
      alert('Tambahkan minimal 1 tanggal');
      return;
    }
    
    if (dateFilterType === 'specific' && years.length === 0) {
      alert('Pilih minimal 1 tahun dari card tahun');
      return;
    }
    
    if (dateFilterType === 'compare_year') {
      if (compareDates.length === 0) {
        alert('Tambahkan minimal 1 tanggal');
        return;
      }
      if (compareYears.length === 0) {
        alert('Pilih minimal 1 tahun untuk perbandingan');
        return;
      }
    }
    
    try {
      setInvoiceLoading(true);
      
      const params = new URLSearchParams();
      businessUnits.forEach(unit => params.append('business_units[]', unit));
      params.append('date_type', dateFilterType);
      
      if (dateFilterType === 'year') {
        years.forEach(year => params.append('years[]', year));
      } else if (dateFilterType === 'range') {
        if (years.length > 0) {
          const year = years[0];
          const startDate = `${year}-${rangeStart}`;
          const endDate = `${year}-${rangeEnd}`;
          params.append('start_date', startDate);
          params.append('end_date', endDate);
        }
      } else if (dateFilterType === 'specific') {
        years.forEach(year => {
          specificDates.forEach(monthDay => {
            const fullDate = `${year}-${monthDay}`;
            params.append('specific_dates[]', fullDate);
          });
        });
      } else if (dateFilterType === 'compare_year') {
        compareDates.forEach(date => {
          params.append('compare_dates[]', date);
        });
        compareYears.forEach(year => {
          params.append('compare_years[]', year);
        });
      }
      
      const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('Invoice Data dari API:', result.data);
        console.log('Jumlah data:', result.data ? result.data.length : 0);
        
        // Pastikan data adalah array dan sesuai struktur API
        if (Array.isArray(result.data)) {
          setInvoiceData(result.data);
        } else {
          console.error('Data dari API bukan array:', result.data);
          alert('Format data tidak valid dari server');
        }
      } else {
        alert('Error: ' + (result.message || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Invoice chart data - gunakan data langsung dari API
  const isCompareYear = dateFilterType === 'compare_year';
  const isYearFilter = dateFilterType === 'year';
  
  // Untuk filter tahun, gunakan bulan sebagai label
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let periods = [];
  if (isYearFilter) {
    // Untuk filter tahun, selalu gunakan 12 bulan
    periods = monthLabels;
  } else {
    periods = invoiceData.length > 0 
      ? [...new Set(invoiceData.map(item => item.period))].sort()
      : getDefaultLabels();
  }
  
  // Debug: log data untuk memastikan struktur sesuai API
  if (invoiceData.length > 0) {
    console.log('Invoice Data untuk Chart:', invoiceData);
    console.log('Periods:', periods);
  }
  
  let invoiceChartData = { labels: periods, datasets: [] };
  let invoiceChartOptions = {};

  function getDefaultLabels() {
    if (dateFilterType === 'year') {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    } else if (dateFilterType === 'specific') {
      return specificDates.length > 0 ? specificDates.sort() : ['No data'];
    } else if (dateFilterType === 'compare_year') {
      if (compareDates.length > 0) {
        return compareDates.sort().map(monthDay => {
          const [month, day] = monthDay.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
        });
      }
      return ['No data'];
    } else {
      return ['No data'];
    }
  }

  if (isCompareYear) {
    const invoiceYears = invoiceData.length > 0
      ? [...new Set(invoiceData.map(item => parseInt(item.year) || item.year))].sort((a, b) => a - b)
      : compareYears.length > 0 ? compareYears.sort((a, b) => a - b) : [];
    // Palet warna dengan 5 variasi berbeda namun tetap harmonis dengan hitam
    const colorPalette = [
      { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },           // 1. Hitam & abu-abu gelap
      { sales: 'rgb(13, 71, 161)', quantity: 'rgb(30, 136, 229)' },     // 2. Biru navy gelap (lebih kontras)
      { sales: 'rgb(0, 77, 64)', quantity: 'rgb(0, 150, 136)' },          // 3. Teal/hijau gelap (lebih kontras)
      { sales: 'rgb(74, 20, 140)', quantity: 'rgb(103, 58, 183)' },      // 4. Ungu gelap (lebih kontras)
      { sales: 'rgb(109, 76, 65)', quantity: 'rgb(141, 110, 99)' }       // 5. Coklat gelap (lebih kontras)
    ];
    
    if (invoiceYears.length === 0 && compareYears.length > 0) {
      compareYears.sort().forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        if (dataType === 'penjualan' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${year} - Penjualan`,
            data: periods.map(() => 0),
            borderColor: colorSet.sales,
            backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        if (dataType === 'quantity' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${year} - Quantity`,
            data: periods.map(() => 0),
            borderColor: colorSet.quantity,
            backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    } else if (invoiceYears.length === 0 && compareYears.length === 0) {
      invoiceChartData.datasets.push({
        label: 'No data',
        data: periods.map(() => null),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        pointRadius: 0,
        borderWidth: 0
      });
    } else {
      invoiceYears.forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        
        // Sales dataset - parse nilai numerik dari API
        if (dataType === 'penjualan' || dataType === 'both') {
          const salesData = periods.map(period => {
            const record = invoiceData.find(d => {
              const recordYear = parseInt(d.year) || d.year;
              return d.period === period && recordYear === year;
            });
            if (record && record.total_sales !== null && record.total_sales !== undefined) {
              return parseFloat(record.total_sales) || 0;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${year} - Penjualan`,
            data: salesData,
            borderColor: colorSet.sales,
            backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        
        // Quantity dataset 
        if (dataType === 'quantity' || dataType === 'both') {
          const quantityData = periods.map(period => {
            const record = invoiceData.find(d => {
              const recordYear = parseInt(d.year) || d.year;
              return d.period === period && recordYear === year;
            });
            if (record && record.total_quantity !== null && record.total_quantity !== undefined) {
              return parseFloat(record.total_quantity) || 0;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${year} - Quantity`,
            data: quantityData,
            borderColor: colorSet.quantity,
            backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    }
    
    invoiceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        title: { display: false },
        legend: { 
          display: true, 
          position: 'top', 
          labels: { 
            usePointStyle: true, 
            padding: 12, 
            font: { size: 12 },
            color: '#424242'
          } 
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += label.includes('Penjualan') 
                  ? formatCurrency(context.parsed.y)
                  : context.parsed.y.toLocaleString() + ' unit';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: { 
          display: true, 
          grid: {
            color: '#f5f5f5'
          },
          title: { display: true, text: 'Tanggal', font: { size: 12, weight: 500 }, color: '#616161' },
          ticks: {
            font: { size: 11 },
            color: '#757575',
            callback: function(value, index) {
              const label = this.getLabelForValue(value);
              const [month, day] = label.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
            }
          }
        },
        y: {
          type: 'linear',
          display: false,
          position: 'left',
          grid: {
            color: '#f5f5f5'
          }
        },
        y1: {
          type: 'linear',
          display: false,
          position: 'right',
          grid: { 
            drawOnChartArea: false,
            color: '#f5f5f5'
          }
        }
      }
    };
  } else if (isYearFilter) {
    // Filter Per Tahun (Bulanan) - kelompokkan berdasarkan tahun
    const invoiceYears = invoiceData.length > 0
      ? [...new Set(invoiceData.map(item => parseInt(item.year) || item.year))].sort((a, b) => a - b)
      : years.length > 0 ? years.sort((a, b) => a - b) : [];
    
    // Palet warna dengan 5 variasi berbeda namun tetap harmonis dengan hitam
    const colorPalette = [
      { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },           // 1. Hitam & abu-abu gelap
      { sales: 'rgb(13, 71, 161)', quantity: 'rgb(30, 136, 229)' },     // 2. Biru navy gelap (lebih kontras)
      { sales: 'rgb(0, 77, 64)', quantity: 'rgb(0, 150, 136)' },          // 3. Teal/hijau gelap (lebih kontras)
      { sales: 'rgb(74, 20, 140)', quantity: 'rgb(103, 58, 183)' },      // 4. Ungu gelap (lebih kontras)
      { sales: 'rgb(109, 76, 65)', quantity: 'rgb(141, 110, 99)' }       // 5. Coklat gelap (lebih kontras)
    ];
    
    if (invoiceYears.length === 0 && years.length > 0) {
      years.sort((a, b) => a - b).forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        if (dataType === 'penjualan' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${year} - Penjualan`,
            data: periods.map(() => 0),
            borderColor: colorSet.sales,
            backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        if (dataType === 'quantity' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${year} - Quantity`,
            data: periods.map(() => 0),
            borderColor: colorSet.quantity,
            backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    } else if (invoiceYears.length === 0 && years.length === 0) {
      invoiceChartData.datasets.push({
        label: 'No data',
        data: periods.map(() => null),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        pointRadius: 0,
        borderWidth: 0
      });
    } else {
      invoiceYears.forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        
        // Sales dataset - parse nilai numerik dari API
        if (dataType === 'penjualan' || dataType === 'both') {
          const salesData = periods.map((monthLabel, monthIndex) => {
            // Konversi bulan label ke format period (YYYY-MM)
            const monthNum = String(monthIndex + 1).padStart(2, '0');
            const period = `${year}-${monthNum}`;
            
            // Cari data yang sesuai dengan period dan year, dan gabungkan semua business unit
            const records = invoiceData.filter(d => {
              const recordYear = parseInt(d.year) || d.year;
              return d.period === period && recordYear === year;
            });
            
            if (records.length > 0) {
              const total = records.reduce((sum, record) => {
                const sales = parseFloat(record.total_sales) || 0;
                return sum + sales;
              }, 0);
              return total;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${year} - Penjualan`,
            data: salesData,
            borderColor: colorSet.sales,
            backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        
        // Quantity dataset 
        if (dataType === 'quantity' || dataType === 'both') {
          const quantityData = periods.map((monthLabel, monthIndex) => {
            // Konversi bulan label ke format period (YYYY-MM)
            const monthNum = String(monthIndex + 1).padStart(2, '0');
            const period = `${year}-${monthNum}`;
            
            // Cari data yang sesuai dengan period dan year, dan gabungkan semua business unit
            const records = invoiceData.filter(d => {
              const recordYear = parseInt(d.year) || d.year;
              return d.period === period && recordYear === year;
            });
            
            if (records.length > 0) {
              const total = records.reduce((sum, record) => {
                const quantity = parseFloat(record.total_quantity) || 0;
                return sum + quantity;
              }, 0);
              return total;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${year} - Quantity`,
            data: quantityData,
            borderColor: colorSet.quantity,
            backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    }
    
    invoiceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 12,
            font: { size: 12 },
            color: '#424242'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (label.includes('Penjualan')) {
                  label += formatCurrency(context.parsed.y);
                } else {
                  label += context.parsed.y.toLocaleString() + ' unit';
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: '#f5f5f5'
          },
          title: {
            display: true,
            text: 'Bulan',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575'
          }
        },
        y: {
          type: 'linear',
          display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
          position: dataType === 'quantity' ? 'left' : 'left',
          grid: {
            color: '#f5f5f5'
          },
          title: {
            display: true,
            text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575',
            callback: function(value) {
              if (dataType === 'quantity') {
                return value.toLocaleString();
              }
              return formatCurrency(value);
            }
          }
        },
        y1: {
          type: 'linear',
          display: dataType === 'both',
          position: 'right',
          title: {
            display: dataType === 'both',
            text: 'Quantity (Unit)',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          grid: {
            drawOnChartArea: false,
            color: '#f5f5f5'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575',
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    };
  } else {
    const invoiceBusinessUnits = invoiceData.length > 0
      ? [...new Set(invoiceData.map(item => item.business_unit))]
      : businessUnits.length > 0 ? businessUnits : [];

    const colors = {
      'Gosave': { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },   
      'Goto': { sales: 'rgb(66, 66, 66)', quantity: 'rgb(117, 117, 117)' }  
    };
    
    if (invoiceBusinessUnits.length === 0 && businessUnits.length === 0) {
      invoiceChartData.datasets.push({
        label: 'No data',
        data: periods.map(() => null),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        pointRadius: 0,
        borderWidth: 0
      });
    } else if (invoiceBusinessUnits.length === 0 && businessUnits.length > 0) {
      businessUnits.forEach(unit => {
        if (dataType === 'penjualan' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${unit} - Penjualan`,
            data: periods.map(() => 0),
            borderColor: colors[unit]?.sales || 'rgb(75, 192, 192)',
            backgroundColor: (colors[unit]?.sales || 'rgb(75, 192, 192)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: 'y',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        if (dataType === 'quantity' || dataType === 'both') {
          invoiceChartData.datasets.push({
            label: `${unit} - Quantity`,
            data: periods.map(() => 0),
            borderColor: colors[unit]?.quantity || 'rgb(54, 162, 235)',
            backgroundColor: (colors[unit]?.quantity || 'rgb(54, 162, 235)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: dataType === 'both' ? 'y1' : 'y',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    } else {
      invoiceBusinessUnits.forEach(unit => {
        // Sales dataset - parse nilai numerik dari API
        if (dataType === 'penjualan' || dataType === 'both') {
          const salesData = periods.map(period => {
            const record = invoiceData.find(d => d.period === period && d.business_unit === unit);
            if (record && record.total_sales !== null && record.total_sales !== undefined) {
              return parseFloat(record.total_sales) || 0;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${unit} - Penjualan`,
            data: salesData,
            borderColor: colors[unit]?.sales || 'rgb(75, 192, 192)',
            backgroundColor: (colors[unit]?.sales || 'rgb(75, 192, 192)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: 'y',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          });
        }
        
        // Quantity dataset - parse nilai numerik dari API
        if (dataType === 'quantity' || dataType === 'both') {
          const quantityData = periods.map(period => {
            const record = invoiceData.find(d => d.period === period && d.business_unit === unit);
            if (record && record.total_quantity !== null && record.total_quantity !== undefined) {
              return parseFloat(record.total_quantity) || 0;
            }
            return 0;
          });
          
          invoiceChartData.datasets.push({
            label: `${unit} - Quantity`,
            data: quantityData,
            borderColor: colors[unit]?.quantity || 'rgb(54, 162, 235)',
            backgroundColor: (colors[unit]?.quantity || 'rgb(54, 162, 235)').replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: dataType === 'both' ? 'y1' : 'y',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
          });
        }
      });
    }
    
    invoiceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 12,
            font: { size: 12 },
            color: '#424242'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (label.includes('Penjualan')) {
                  label += formatCurrency(context.parsed.y);
                } else {
                  label += context.parsed.y.toLocaleString() + ' unit';
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: '#f5f5f5'
          },
          title: {
            display: true,
            text: 'Periode',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575'
          }
        },
        y: {
          type: 'linear',
          display: dataType === 'penjualan' || dataType === 'quantity' || dataType === 'both',
          position: dataType === 'quantity' ? 'left' : 'left',
          grid: {
            color: '#f5f5f5'
          },
          title: {
            display: true,
            text: dataType === 'quantity' ? 'Quantity (Unit)' : 'Penjualan (Rp)',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575',
            callback: function(value) {
              if (dataType === 'quantity') {
                return value.toLocaleString();
              }
              return formatCurrency(value);
            }
          }
        },
        y1: {
          type: 'linear',
          display: dataType === 'both',
          position: 'right',
          title: {
            display: dataType === 'both',
            text: 'Quantity (Unit)',
            font: { size: 12, weight: 500 },
            color: '#616161'
          },
          grid: {
            drawOnChartArea: false,
            color: '#f5f5f5'
          },
          ticks: {
            font: { size: 11 },
            color: '#757575',
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      }
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const calculateYearTotals = () => {
    const totals = { ...yearSummary };
    
    return totals;
  };

  const yearTotals = calculateYearTotals();

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      height: '100%',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
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
            onLoadData={loadInvoiceSales}
            onRefreshData={refreshData}
            isLoading={invoiceLoading}
            selectedYears={years}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            specificDates={specificDates}
            compareDates={compareDates}
            compareYears={compareYears}
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
            />
          </Box>

          {/* Filter Tambahan (Range, Specific, Compare Year)*/}
          <Card sx={{ 
            bgcolor: 'white', 
            borderRadius: 2, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #e0e0e0',
            p: { xs: 2, md: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            flex: 1,
            minHeight: 0,
            transition: 'box-shadow 0.2s ease'
          }}>
            {dateFilterType === 'range' && (
              <RangeDateFilter
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeStartChange={setRangeStart}
                onRangeEndChange={setRangeEnd}
                selectedYear={years.length === 1 ? years[0] : null}
              />
            )}

            {dateFilterType === 'specific' && (
              <SpecificDateFilter
                specificDates={specificDates}
                onAddDate={addSpecificDate}
                onRemoveDate={removeSpecificDate}
                selectedYear={years.length > 0 ? years[0] : null}
                availableYears={availableYears}
                onToggleYear={toggleYear}
              />
            )}

            {dateFilterType === 'compare_year' && (
              <CompareYearFilter
                compareDates={compareDates}
                onAddCompareDate={addCompareDate}
                onRemoveCompareDate={removeCompareDate}
                compareYears={compareYears}
                availableYears={availableYears}
                onToggleCompareYear={toggleCompareYear}
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #e0e0e0',
        p: { xs: 2.5, md: 3.5 },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 350, md: 450 },
        transition: 'box-shadow 0.2s ease'
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ 
            fontSize: { xs: '0.9375rem', md: '1.0625rem' }, 
            fontWeight: 600, 
            color: '#212121',
            letterSpacing: '-0.01em',
            lineHeight: 1.4
          }}>
            Grafik Penjualan & Quantity
          </Typography>
        </Box>
        <Box sx={{ 
          width: '100%', 
          flex: 1,
          position: 'relative',
          minHeight: { xs: 280, md: 350 }
        }}>
          <Line ref={invoiceChartRef} data={invoiceChartData} options={invoiceChartOptions} />
        </Box>
      </Card>
    </Box>
  );
}

export default ChartInvoice;
