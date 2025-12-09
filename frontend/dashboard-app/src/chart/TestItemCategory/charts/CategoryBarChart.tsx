import * as React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Card, Typography, IconButton, Tooltip as MuiTooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Custom plugin untuk menampilkan label DPP
const datalabelsPlugin = {
  id: 'datalabels',
  afterDraw: (chart: any) => {
    const { ctx, chartArea } = chart;
    const showDetail = chart.options.plugins?.datalabels?.display;
    
    if (!showDetail || !chartArea) return;
    
    ctx.save();
    ctx.font = '600 11px "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';
    ctx.fillStyle = '#212121';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const formatDpp = (val: number): string => {
      if (val >= 1000000000) {
        return `Rp ${(val / 1000000000).toFixed(1)}M`;
      }
      if (val >= 1000000) {
        return `Rp ${(val / 1000000).toFixed(1)}jt`;
      }
      if (val >= 1000) {
        return `Rp ${(val / 1000).toFixed(1)}k`;
      }
      return `Rp ${val.toLocaleString('id-ID')}`;
    };
    
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.data) return;
      
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;
        
        // Untuk horizontal bar chart dengan indexAxis: 'y'
        // bar.x adalah posisi ujung kanan bar
        // Untuk memastikan, kita bisa menggunakan bar.x + bar.width/2 tapi lebih baik langsung bar.x
        const barEndX = bar.x;
        const y = bar.y;
        const label = formatDpp(value);
        
        // Hitung lebar teks
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        
        // Padding dari ujung bar (di luar bar) - minimal 10px
        const padding = 10;
        
        // Posisikan label di luar bar, tepat setelah ujung kanan bar
        // Pastikan labelX > barEndX agar benar-benar di luar bar
        let labelX = barEndX + padding;
        
        // Pastikan label tidak keluar dari chart area yang sudah di-padding
        const maxX = chartArea.right - 5;
        if (labelX + textWidth > maxX) {
          // Jika tidak muat, geser ke kiri tapi tetap di luar bar
          labelX = Math.max(barEndX + 5, maxX - textWidth);
        }
        
        // Final check: pastikan label selalu di luar bar
        // Jika masih di dalam atau sama dengan barEndX, paksa ke luar
        if (labelX <= barEndX) {
          labelX = barEndX + 5; // Minimal 5px di luar bar
        }
        
        ctx.fillText(label, labelX, y);
      });
    });
    
    ctx.restore();
  }
};

ChartJS.register(datalabelsPlugin);

interface CategoryBarChartProps {
  categories: Array<{ name: string; count: number; dpp: number }>;
}

function CategoryBarChart({ categories }: CategoryBarChartProps) {
  const [showDetail, setShowDetail] = React.useState(false);

  const chartData = React.useMemo(() => {
    // Sort by DPP descending and take top 20
    const sortedCategories = [...categories]
      .sort((a, b) => b.dpp - a.dpp)
      .slice(0, 20);

    const labels = sortedCategories.map(cat => cat.name);
    const data = sortedCategories.map(cat => cat.dpp);

    // Generate colors based on DPP (gradient)
    const maxDpp = Math.max(...data, 1);
    const backgroundColor = data.map(dpp => {
      const intensity = dpp / maxDpp;
      return `rgba(107, 163, 208, ${0.4 + intensity * 0.4})`;
    });
    const borderColor = data.map(dpp => {
      const intensity = dpp / maxDpp;
      return `rgba(107, 163, 208, ${0.6 + intensity * 0.4})`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'DPP',
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [categories]);

  const formatDpp = (value: number): string => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`;
    }
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`;
    }
    if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(1)}k`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: showDetail ? 150 : 0, // Tambahkan padding kanan yang cukup untuk label
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          size: 13,
          weight: 600,
        },
        bodyFont: {
          family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          size: 12,
        },
        callbacks: {
          label: (context: any) => {
            return `Rp ${context.parsed.x.toLocaleString('id-ID')}`;
          },
        },
      },
      datalabels: {
        display: showDetail,
      },
    },
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: {
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            size: 11,
          },
          color: '#757575',
          callback: (value: any) => {
            return formatDpp(value);
          },
        },
        grid: {
          color: '#F0F0F0',
          lineWidth: 1,
        },
      },
      y: {
        ticks: {
          font: {
            family: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            size: 11,
          },
          color: '#757575',
        },
        grid: {
          display: false,
        },
      },
    },
  }), [showDetail]);

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
          borderColor: '#D1D5DB',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: '#E5E7EB',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontSize: { xs: '0.9375rem', md: '1.0625rem' },
                fontWeight: 600,
                color: '#212121',
                letterSpacing: '-0.01em',
                lineHeight: 1.4,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              }}
            >
              Distribusi Kategori
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: '#757575',
                mt: 0.5,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              }}
            >
              Top 20 kategori berdasarkan DPP
            </Typography>
          </Box>
          <MuiTooltip title={showDetail ? 'Sembunyikan Detail' : 'Tampilkan Detail'}>
            <IconButton
              onClick={() => setShowDetail(!showDetail)}
              size="small"
              sx={{
                color: showDetail ? '#6BA3D0' : '#757575',
                '&:hover': {
                  bgcolor: 'rgba(107, 163, 208, 0.08)',
                  color: '#6BA3D0',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {showDetail ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {categories.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9E9E9E',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
              }}
            >
              Tidak ada data kategori
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%', maxHeight: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default CategoryBarChart;

