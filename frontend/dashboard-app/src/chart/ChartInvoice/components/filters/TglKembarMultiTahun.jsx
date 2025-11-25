import React, { useMemo } from "react";
import { Box, Typography, Chip, Checkbox, FormControlLabel } from "@mui/material";
import { MONTH_OPTIONS, getIsSameDate } from './constants';

export const TglKembarMultiTahun = ({
  years,
  availableYears,
  specificDates,
  selectedYearsForTwinPreset,
  selectedMonthsForTwinPreset,
  toggleYearForTwinPreset,
  toggleMonthForTwinPreset,
  onAddDate,
  setShowMultiYearPreset,
  setSelectedYearsForTwinPreset,
  setSelectedMonthsForTwinPreset,
  setShowPicker,
  showWarning
}) => {
  return (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: '#FFFFFF',
      borderRadius: 2,
      border: '1px solid #E2E8F0',
      p: 1.5,
      flexShrink: 0,
      minHeight: '380px',
      height: 'fit-content',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.25
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flexShrink: 0
      }}>
        <Typography sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#475569',
          mb: 0.5,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          Pilih Tahun (Multi-Select):
        </Typography>
        <Box sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 0.5,
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 0.5,
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F1F5F9',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E1',
            borderRadius: '3px',
            '&:hover': {
              background: '#94A3B8',
            },
          },
        }}>
          {(availableYears.length > 0 ? years : years).map(yearOption => (
            <FormControlLabel
              key={yearOption}
              control={
                <Checkbox
                  checked={selectedYearsForTwinPreset.includes(yearOption)}
                  onChange={() => toggleYearForTwinPreset(yearOption)}
                  size="small"
                  sx={{
                    color: '#6BA3D0',
                    '&.Mui-checked': {
                      color: '#6BA3D0',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem'
                    },
                    py: 0.25,
                  }}
                />
              }
              label={
                <Typography sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#475569',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {yearOption}
                </Typography>
              }
              sx={{
                m: 0,
                mr: 0.75,
                py: 0.25,
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'rgba(107, 163, 208, 0.04)',
                  borderRadius: 0.5
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Pilih Bulan untuk Multi-Tahun Preset */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flexShrink: 0
      }}>
        <Typography sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#475569',
          mb: 0.5,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          Pilih Bulan:
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.75,
        }}>
          {MONTH_OPTIONS.map(monthOption => {
            const isSelected = selectedMonthsForTwinPreset.includes(monthOption.value);
            
            return (
              <Chip
                key={monthOption.value}
                label={monthOption.label}
                size="small"
                onClick={() => toggleMonthForTwinPreset(monthOption.value)}
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  height: '32px',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  bgcolor: isSelected ? '#6BA3D0' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? '#5A9FD0' : '#F8FAFC',
                    borderColor: isSelected ? 'none' : '#6BA3D0',
                    transform: 'translateY(-1px)',
                  }
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

// Export hook untuk mendapatkan remainingTwinDatesMultiYear dan handleAddTwinDatesPresetMultiYear
export const useTglKembarMultiTahun = ({
  availableYears,
  specificDates,
  selectedYearsForTwinPreset,
  selectedMonthsForTwinPreset,
  onAddDate,
  setShowMultiYearPreset,
  setSelectedYearsForTwinPreset,
  setSelectedMonthsForTwinPreset,
  setShowPicker,
  showWarning
}) => {
  // Hitung jumlah tanggal kembar yang akan ditambahkan untuk multi-tahun preset
  const remainingTwinDatesMultiYear = useMemo(() => {
    let count = 0;
    selectedYearsForTwinPreset.forEach(year => {
      selectedMonthsForTwinPreset.forEach(monthValue => {
        const monthOption = MONTH_OPTIONS.find(m => m.value === monthValue);
        if (monthOption) {
          const exists = specificDates.some(date => getIsSameDate(date, year, monthOption.monthDay));
          if (!exists) {
            count++;
          }
        }
      });
    });
    return count;
  }, [specificDates, selectedYearsForTwinPreset, selectedMonthsForTwinPreset]);

  // Fungsi untuk menambahkan preset tanggal kembar dengan multi-select tahun
  const handleAddTwinDatesPresetMultiYear = () => {
    try {
      if (selectedYearsForTwinPreset.length === 0) {
        showWarning('Pilih minimal satu tahun terlebih dahulu.');
        return;
      }

      if (selectedMonthsForTwinPreset.length === 0) {
        showWarning('Pilih minimal satu bulan terlebih dahulu.');
        return;
      }

      // Validasi tahun yang dipilih
      const invalidYears = selectedYearsForTwinPreset.filter(year => 
        availableYears.length > 0 && !availableYears.includes(year)
      );

      if (invalidYears.length > 0) {
        showWarning(`Tahun ${invalidYears.join(', ')} tidak tersedia. Pilih tahun yang ada di daftar.`);
        return;
      }

      // Generate tanggal kembar hanya untuk bulan yang dipilih
      const datesToAdd = [];
      selectedYearsForTwinPreset.forEach(year => {
        selectedMonthsForTwinPreset.forEach(monthValue => {
          // Cari preset yang sesuai dengan bulan yang dipilih
          const monthOption = MONTH_OPTIONS.find(m => m.value === monthValue);
          if (monthOption) {
            // Cek apakah tanggal ini sudah ada
            const exists = specificDates.some(date => getIsSameDate(date, year, monthOption.monthDay));
            if (!exists) {
              datesToAdd.push({ year, monthDay: monthOption.monthDay });
            }
          }
        });
      });

      if (datesToAdd.length === 0) {
        showWarning('Semua tanggal kembar untuk tahun dan bulan yang dipilih sudah ditambahkan.');
        return;
      }

      datesToAdd.forEach(date => onAddDate(date));
      setShowMultiYearPreset(false);
      setSelectedYearsForTwinPreset([]);
      setSelectedMonthsForTwinPreset([]);
      setShowPicker(false);
    } catch (error) {
      console.error('Unexpected error in handleAddTwinDatesPresetMultiYear:', error);
      showWarning('Terjadi error saat menambahkan preset tanggal kembar multi-tahun.');
    }
  };

  return { remainingTwinDatesMultiYear, handleAddTwinDatesPresetMultiYear };
};

export default TglKembarMultiTahun;
