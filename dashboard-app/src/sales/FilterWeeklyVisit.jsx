import * as React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const roundedFieldSx = {
  minWidth: 180,
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'var(--accent-teal-dark)',
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'common.white',
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--accent-teal-dark)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(35, 133, 122, 0.35)',
    },
  },
}

export default function FilterWeeklyVisit({
  filters,
  visibleMonths,
  monthLabels,
  yearOptions,
  salesOptions,
  stateOptions,
  isLoading,
  filteredCount,
  onQueryChange,
  onMonthsChange,
  onYearChange,
  onSalesChange,
  onWilayahChange,
  onRefresh,
  onExport,
}) {
  const salesItems = React.useMemo(
    () => [
      { label: 'Semua', value: 'ALL' },
      ...salesOptions.map((option) => ({ label: option, value: option })),
    ],
    [salesOptions],
  )

  const wilayahItems = React.useMemo(
    () => [
      { label: 'Semua', value: 'ALL' },
      ...stateOptions.map((option) => ({ label: option, value: option })),
    ],
    [stateOptions],
  )

  const safeYearOptions = React.useMemo(() => {
    const currentYear = Number(filters.year)
    const uniqueYears = new Set(
      [...(Array.isArray(yearOptions) ? yearOptions : []), currentYear].filter((value) =>
        Number.isInteger(Number(value)),
      ),
    )

    return Array.from(uniqueYears).sort((left, right) => Number(right) - Number(left))
  }, [filters.year, yearOptions])

  const selectedSales =
    salesItems.find((option) => option.value === filters.sales) ?? salesItems[0] ?? null
  const selectedWilayah =
    wilayahItems.find((option) => option.value === filters.wilayah) ?? wilayahItems[0] ?? null

  return (
    <Box
      sx={{
        p: { xs: 1.25, md: 1.5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'rgba(35, 133, 122, 0.12)',
        background:
          'linear-gradient(180deg, rgba(35,133,122,0.08) 0%, rgba(35,133,122,0.02) 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent-teal-dark)',
              backgroundColor: 'rgba(35, 133, 122, 0.12)',
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>Filter Weekly Visit</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {filteredCount} data sesuai filter aktif
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh data"
          sx={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: '1px solid rgba(35, 133, 122, 0.2)',
            backgroundColor: 'rgba(35, 133, 122, 0.08)',
            color: 'var(--accent-teal-dark)',
            '&:hover': {
              backgroundColor: 'rgba(35, 133, 122, 0.14)',
            },
          }}
        >
          <RefreshRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'minmax(240px, 1.35fr) minmax(280px, 1.35fr) repeat(3, minmax(150px, 1fr)) auto',
          },
          gap: 1.25,
          alignItems: 'start',
        }}
      >
        <TextField
          label="Cari"
          placeholder="Wilayah / sales / customer"
          value={filters.query}
          onChange={(event) => onQueryChange(event.target.value)}
          size="small"
          sx={{ ...roundedFieldSx, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          label="Bulan"
          value={visibleMonths}
          onChange={(event) => onMonthsChange(event.target.value)}
          size="small"
          sx={{ ...roundedFieldSx, minWidth: 240 }}
          SelectProps={{
            multiple: true,
            renderValue: (selected) =>
              (Array.isArray(selected) ? selected : [])
                .map((monthIndex) => monthLabels[Number(monthIndex)])
                .filter(Boolean)
                .join(', '),
          }}
          helperText="Maksimal 3 bulan aktif sekaligus."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthRoundedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        >
          {monthLabels.map((label, monthIndex) => {
            const checked = visibleMonths.includes(monthIndex)
            const disabled = !checked && visibleMonths.length >= 3

            return (
              <MenuItem key={label} value={monthIndex} disabled={disabled}>
                {checked ? '\u2713 ' : ''}
                {label}
              </MenuItem>
            )
          })}
        </TextField>

        <TextField
          select
          label="Tahun"
          value={filters.year}
          onChange={(event) => onYearChange(event.target.value)}
          size="small"
          sx={roundedFieldSx}
        >
          {safeYearOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          options={salesItems}
          value={selectedSales}
          onChange={(_, value) => onSalesChange(value?.value ?? 'ALL')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          size="small"
          sx={roundedFieldSx}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sales"
              placeholder="Cari sales"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <GroupsRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          options={wilayahItems}
          value={selectedWilayah}
          onChange={(_, value) => onWilayahChange(value?.value ?? 'ALL')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          size="small"
          sx={roundedFieldSx}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Wilayah"
              placeholder="Cari wilayah"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <PlaceRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: { xs: 'stretch', xl: 'flex-end' },
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            onClick={onExport}
            disabled={isLoading || filteredCount === 0}
            startIcon={<DownloadRoundedIcon />}
            sx={{
              borderRadius: 999,
              minHeight: 40,
              px: 2,
              backgroundColor: 'var(--accent-teal-dark)',
              boxShadow: '0 10px 24px rgba(35, 133, 122, 0.22)',
              '&:hover': {
                backgroundColor: 'var(--accent-teal-dark)',
                boxShadow: '0 14px 28px rgba(35, 133, 122, 0.3)',
              },
            }}
          >
            Export XLSX
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
