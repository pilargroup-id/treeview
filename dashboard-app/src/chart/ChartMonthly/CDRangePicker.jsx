import React from 'react';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const CDRangePicker = ({ value = [null, null], onChange }) => {
  const [startDate, endDate] = value;

  const handleStartDateChange = (nextStartDate) => {
    if (!onChange) return;
    if (endDate && nextStartDate && endDate.isBefore(nextStartDate, 'day')) {
      onChange([nextStartDate, nextStartDate]);
      return;
    }
    onChange([nextStartDate, endDate]);
  };

  const handleEndDateChange = (nextEndDate) => {
    if (!onChange) return;
    if (startDate && nextEndDate && nextEndDate.isBefore(startDate, 'day')) {
      onChange([startDate, startDate]);
      return;
    }
    onChange([startDate, nextEndDate]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: 1
        }}
      >
        <DatePicker
          label="Tanggal Mulai"
          value={startDate}
          onChange={handleStartDateChange}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small'
            }
          }}
        />
        <DatePicker
          label="Tanggal Akhir"
          value={endDate}
          onChange={handleEndDateChange}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small'
            }
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CDRangePicker;
