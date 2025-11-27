import React, { useMemo } from "react";
import { Box, Typography, Select, MenuItem, Chip, IconButton } from "@mui/material";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { TWIN_DATE_PRESETS, MONTH_OPTIONS, getIsSameDate } from '../constants';

export const TglKembarTahun = ({
  activePresetYear,
  setPresetYearOverride,
  years,
  availableYears,
  specificDates,
  selectedMonthsForSingleYear,
  toggleMonthForSingleYear,
  toggleAllMonthsForSingleYear,
  onAddDate,
  setShowPicker,
  showWarning
}) => {
  const remainingTwinDates = useMemo(() => {
    // Jika ada bulan yang dipilih, hanya hitung bulan yang dipilih
    if (selectedMonthsForSingleYear.length > 0) {
      return MONTH_OPTIONS
        .filter(monthOption => selectedMonthsForSingleYear.includes(monthOption.value))
        .filter(monthOption => 
          !specificDates.some(date => getIsSameDate(date, activePresetYear, monthOption.monthDay))
        );
    }
    // Jika tidak ada bulan yang dipilih, hitung semua
    return TWIN_DATE_PRESETS.filter(preset => 
      !specificDates.some(date => getIsSameDate(date, activePresetYear, preset.monthDay))
    );
  }, [specificDates, activePresetYear, selectedMonthsForSingleYear]);

  const handleAddTwinDatesPreset = () => {
    try {
      const year = activePresetYear;

      if (availableYears.length > 0 && !availableYears.includes(year)) {
        showWarning(`Tahun ${year} tidak tersedia. Pilih tahun yang ada di daftar terlebih dahulu.`);
        return;
      }

      // Jika ada bulan yang dipilih, hanya tambahkan bulan yang dipilih
      let datesToAdd = [];
      if (selectedMonthsForSingleYear.length > 0) {
        // Sort bulan yang dipilih untuk memastikan urutan benar
        const sortedMonths = [...selectedMonthsForSingleYear].sort((a, b) => a - b);
        sortedMonths.forEach(monthValue => {
          const monthOption = MONTH_OPTIONS.find(m => m.value === monthValue);
          if (monthOption) {
            const exists = specificDates.some(date => getIsSameDate(date, year, monthOption.monthDay));
            if (!exists) {
              datesToAdd.push({ year, monthDay: monthOption.monthDay });
            }
          }
        });
      } else {
        // Jika tidak ada bulan yang dipilih, tambahkan semua
        datesToAdd = TWIN_DATE_PRESETS
          .filter(preset => !specificDates.some(date => getIsSameDate(date, year, preset.monthDay)))
          .map(preset => ({ year, monthDay: preset.monthDay }));
      }

      if (datesToAdd.length === 0) {
        if (selectedMonthsForSingleYear.length > 0) {
          showWarning(`Semua tanggal kembar untuk bulan yang dipilih pada tahun ${year} sudah ditambahkan.`);
        } else {
          showWarning(`Semua tanggal kembar untuk tahun ${year} sudah ditambahkan.`);
        }
        return;
      }

      datesToAdd.forEach(date => onAddDate(date));
      setShowPicker(false);
    } catch (error) {
      console.error('Unexpected error in handleAddTwinDatesPreset:', error);
      showWarning('Terjadi error saat menambahkan preset tanggal kembar.');
    }
  };

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
        alignItems: 'center',
        gap: 1,
        flexShrink: 0
      }}>
        <CalendarTodayIcon sx={{ 
          fontSize: '1.125rem', 
          color: '#6BA3D0' 
        }} />
        <Typography sx={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: '#0F172A',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          letterSpacing: '-0.01em'
        }}>
          Preset Tanggal Kembar
        </Typography>
      </Box>

      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexShrink: 0
      }}>
        <Select
          size="small"
          value={activePresetYear || ''}
          displayEmpty
          onChange={(e) => {
            const value = e.target.value;
            setPresetYearOverride(value === '' ? null : Number(value));
          }}
          sx={{
            flex: 1,
            fontSize: '0.8125rem',
            fontWeight: 500,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 1.5,
            '& .MuiSelect-select': {
              py: 0.875,
              px: 1.5,
            },
            '&:hover': {
              borderColor: '#6BA3D0',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E2E8F0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6BA3D0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6BA3D0',
            }
          }}
          renderValue={(selected) => {
            if (!selected) {
              return <span style={{ color: '#94A3B8' }}>Pilih Tahun</span>;
            }
            return `Tahun ${selected}`;
          }}
        >
          {(availableYears.length > 0 ? years : years).map(yearOption => (
            <MenuItem key={yearOption} value={yearOption}>
              Tahun {yearOption}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Pilih Bulan untuk Satu Tahun Preset */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flexShrink: 0
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5,
        }}>
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#475569',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
            Pilih Bulan:
          </Typography>
          <IconButton
            size="small"
            onClick={toggleAllMonthsForSingleYear}
            sx={{
              width: '24px',
              height: '24px',
              p: 0.5,
              color: selectedMonthsForSingleYear.length === MONTH_OPTIONS.length ? '#6BA3D0' : '#94A3B8',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: '#6BA3D0',
                bgcolor: 'rgba(107, 163, 208, 0.08)',
                transform: 'scale(1.1)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
            title={selectedMonthsForSingleYear.length === MONTH_OPTIONS.length ? 'Hapus Semua' : 'Pilih Semua'}
          >
            <DoneAllIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0.75,
        }}>
          {MONTH_OPTIONS.map(monthOption => {
            const isSelected = selectedMonthsForSingleYear.includes(monthOption.value);
            
            return (
              <Chip
                key={monthOption.value}
                label={monthOption.label}
                size="small"
                onClick={() => toggleMonthForSingleYear(monthOption.value)}
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

// Export hook untuk mendapatkan remainingTwinDates dan handleAddTwinDatesPreset
export const useTglKembarTahun = ({
  activePresetYear,
  availableYears,
  specificDates,
  selectedMonthsForSingleYear,
  onAddDate,
  setShowPicker,
  showWarning
}) => {
  const remainingTwinDates = useMemo(() => {
    if (selectedMonthsForSingleYear.length > 0) {
      return MONTH_OPTIONS
        .filter(monthOption => selectedMonthsForSingleYear.includes(monthOption.value))
        .filter(monthOption => 
          !specificDates.some(date => getIsSameDate(date, activePresetYear, monthOption.monthDay))
        );
    }
    return TWIN_DATE_PRESETS.filter(preset => 
      !specificDates.some(date => getIsSameDate(date, activePresetYear, preset.monthDay))
    );
  }, [specificDates, activePresetYear, selectedMonthsForSingleYear]);

  const handleAddTwinDatesPreset = () => {
    try {
      const year = activePresetYear;

      if (availableYears.length > 0 && !availableYears.includes(year)) {
        showWarning(`Tahun ${year} tidak tersedia. Pilih tahun yang ada di daftar terlebih dahulu.`);
        return;
      }

      let datesToAdd = [];
      if (selectedMonthsForSingleYear.length > 0) {
        const sortedMonths = [...selectedMonthsForSingleYear].sort((a, b) => a - b);
        sortedMonths.forEach(monthValue => {
          const monthOption = MONTH_OPTIONS.find(m => m.value === monthValue);
          if (monthOption) {
            const exists = specificDates.some(date => getIsSameDate(date, year, monthOption.monthDay));
            if (!exists) {
              datesToAdd.push({ year, monthDay: monthOption.monthDay });
            }
          }
        });
      } else {
        datesToAdd = TWIN_DATE_PRESETS
          .filter(preset => !specificDates.some(date => getIsSameDate(date, year, preset.monthDay)))
          .map(preset => ({ year, monthDay: preset.monthDay }));
      }

      if (datesToAdd.length === 0) {
        if (selectedMonthsForSingleYear.length > 0) {
          showWarning(`Semua tanggal kembar untuk bulan yang dipilih pada tahun ${year} sudah ditambahkan.`);
        } else {
          showWarning(`Semua tanggal kembar untuk tahun ${year} sudah ditambahkan.`);
        }
        return;
      }

      datesToAdd.forEach(date => onAddDate(date));
      setShowPicker(false);
    } catch (error) {
      console.error('Unexpected error in handleAddTwinDatesPreset:', error);
      showWarning('Terjadi error saat menambahkan preset tanggal kembar.');
    }
  };

  return { remainingTwinDates, handleAddTwinDatesPreset };
};

export default TglKembarTahun;

