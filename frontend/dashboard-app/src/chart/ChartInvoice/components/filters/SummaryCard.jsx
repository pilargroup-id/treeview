import React from 'react';
import { Box, Typography, Card } from '@mui/material';

function SummaryCard({ businessUnits, selectedYears, dateFilterType, invoiceData }) {
  // Fungsi untuk mendapatkan label tipe filter
  const getFilterTypeLabel = (type) => {
    const labels = {
      'year': 'Per Tahun (Bulanan)',
      'range': 'Range Tanggal',
      'specific': 'Tanggal Tertentu',
      'compare_year': 'Compare by Year'
    };
    return labels[type] || 'Belum dipilih';
  };

  // Fungsi untuk mendapatkan status data
  const getDataStatus = () => {
    if (invoiceData && invoiceData.length > 0) {
      return 'Dimuat';
    }
    return 'Belum dimuat';
  };

  // Fungsi untuk mendapatkan business unit yang dipilih
  const getBusinessUnitText = () => {
    if (businessUnits && businessUnits.length > 0) {
      return businessUnits.join(', ');
    }
    return 'Belum dipilih';
  };

  // Fungsi untuk mendapatkan tahun yang dipilih
  const getSelectedYearText = () => {
    if (selectedYears && selectedYears.length > 0) {
      return selectedYears.sort((a, b) => b - a).join(', ');
    }
    return 'Belum dipilih';
  };

  const summaryItems = [
    {
      label: 'BUSINESS UNIT',
      value: getBusinessUnitText()
    },
    {
      label: 'TAHUN TERPILIH',
      value: getSelectedYearText()
    },
    {
      label: 'STATUS DATA',
      value: getDataStatus()
    },
    {
      label: 'TIPE FILTER',
      value: getFilterTypeLabel(dateFilterType)
    }
  ];

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      <Typography sx={{ 
        fontSize: { xs: '0.9375rem', md: '1.0625rem' }, 
        fontWeight: 600, 
        color: '#212121',
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
        mb: 0.5
      }}>
        Ringkasan Data
      </Typography>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: 'repeat(2, 1fr)', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        },
        gap: { xs: 1.5, md: 2 }
      }}>
        {summaryItems.map((item, index) => (
          <Card 
            key={index}
            sx={{ 
              bgcolor: 'white', 
              borderRadius: 2, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #e0e0e0',
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              transition: 'box-shadow 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            <Typography sx={{ 
              fontSize: '0.75rem', 
              color: '#757575',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.2,
              mb: 0.5
            }}>
              {item.label}
            </Typography>
            <Typography sx={{ 
              fontSize: { xs: '0.875rem', md: '0.9375rem' }, 
              fontWeight: 600, 
              color: '#212121',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}>
              {item.value}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* Pesan instruksi */}
      {/* <Typography sx={{ 
        fontSize: '0.75rem', 
        color: '#9e9e9e',
        lineHeight: 1.5,
        mt: 0.5
      }}>
        Pilih <Box component="span" sx={{ fontWeight: 500, color: '#757575' }}>Tipe Filter</Box> di panel kiri untuk menampilkan opsi filter tambahan seperti Range Tanggal, Tanggal Tertentu, atau Compare by Year. Klik <Box component="span" sx={{ fontWeight: 500, color: '#757575' }}>Muat Data</Box> setelah memilih filter untuk melihat grafik.
      </Typography> */}
    </Box>
  );
}

export default SummaryCard;


