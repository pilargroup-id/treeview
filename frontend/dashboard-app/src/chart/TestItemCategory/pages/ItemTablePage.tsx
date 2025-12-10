import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import {
  DataGrid,
  GridApi,
  GridColDef,
  GridColumnVisibilityModel,
  GridRenderCellParams,
  useGridApiRef,
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportCsv,
  ExportPrint,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
} from '@mui/x-data-grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListItemText from '@mui/material/ListItemText';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import type { StockData } from '../types/stocks';
import FilterSection from '../components/FilterSection';
import StockDetailsPanel from '../components/StockDetailsPanel';
import { PageType } from '../components/PageSwitcher';

type OwnerState = {
  expanded: boolean;
};

const StyledQuickFilter = styled(QuickFilter)({
  display: 'grid',
  alignItems: 'center',
  minWidth: 0,
  position: 'relative',
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    width: 'min-content',
    height: 'min-content',
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? 'none' : 'auto',
    transition: theme.transitions.create(['opacity']),
  }),
);

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  overflowX: 'clip',
  width: ownerState.expanded ? 260 : 'var(--trigger-width)',
  opacity: ownerState.expanded ? 1 : 0,
  pointerEvents: ownerState.expanded ? 'auto' : 'none',
  transition: theme.transitions.create(['width', 'opacity']),
  '& .MuiInputBase-root': {
    height: '32px',
  },
}));

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;

  const width = 200;
  const height = 40;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth + padding;
    const y = chartHeight - ((value - min) / range) * chartHeight + padding;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface RangeDate {
  start: string;
  end: string;
  year: number;
}

interface ItemTablePageProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  allRows: StockData[];
  filteredRows: StockData[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onCategoryChange?: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  itemSearchQuery: string;
  onItemSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  categories: Array<{ name: string; count: number; dpp: number }>;
  rangeDates?: RangeDate[];
  onAddRange?: (range: RangeDate) => void;
  onRemoveRange?: (range: RangeDate) => void;
  availableYears?: number[];
  selectedYears?: number[];
  businessUnits?: string[];
  onBusinessUnitToggle?: (unit: string) => void;
  dataType?: 'both' | 'invoice' | 'payment';
  onDataTypeChange?: (type: 'both' | 'invoice' | 'payment') => void;
  invoiceData?: any[];
}

function ItemTablePage({
  currentPage,
  onPageChange,
  allRows,
  filteredRows,
  selectedCategories,
  onCategoryToggle,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  itemSearchQuery,
  onItemSearchChange,
  onRefresh,
  isLoading,
  categories,
  rangeDates = [],
  onAddRange,
  onRemoveRange,
  availableYears = [],
  selectedYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = []
}: ItemTablePageProps) {
  const apiRef = useGridApiRef();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getColumnVisibility = React.useCallback(() => {
    return {
      symbol: true,
      name: true,
      qty: true,
      trend: true,
    };
  }, [isSmallScreen]);

  const [columnVisibilityModel, setColumnVisibilityModel] =
    React.useState<GridColumnVisibilityModel>(getColumnVisibility());
  const [columnsMenuOpen, setColumnsMenuOpen] = React.useState(false);
  const columnsMenuAnchorRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setColumnVisibilityModel(getColumnVisibility());
  }, [isSmallScreen, getColumnVisibility]);

  const columns: GridColDef[] = React.useMemo(
    () => [
      {
        field: 'symbol',
        headerName: 'Display Name',
        flex: 0,
        width: 150,
        renderCell: (params: GridRenderCellParams<StockData>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {params.row.logoUrl && (
              <Box
                component="img"
                src={params.row.logoUrl}
                alt={`${params.row.name} logo`}
                sx={{
                  width: 24,
                  height: 24,
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'name',
        headerName: 'Name',
        flex: 2,
        minWidth: 300,
        maxWidth: 600,
      },
      {
        field: 'qty',
        type: 'number',
        headerName: 'QTY',
        flex: 0,
        width: 120,
        renderCell: (params: GridRenderCellParams<StockData>) => (
          <Typography sx={{ fontSize: '0.875rem' }}>
            {typeof params.value === 'number' ? params.value.toLocaleString() : params.value}
          </Typography>
        ),
      },
      {
        field: 'trend',
        headerName: 'Graph',
        flex: 1,
        minWidth: 200,
        maxWidth: 300,
        renderCell: (params: GridRenderCellParams<StockData>) => {
          const history = params.row.history;
          const historicalData: number[] = [];
          for (let i = 0; i < history.length; i += 10) {
            historicalData.push(history[i].price);
          }
          const firstPrice = historicalData[0];
          const lastPrice = historicalData[historicalData.length - 1];
          const isTrendUp = lastPrice > firstPrice;
          const color = isTrendUp ? '#2e7d32' : '#d32f2f';
          return (
            <Box sx={{ width: '100%', height: 40, display: 'flex', alignItems: 'center' }}>
              <SparkLine data={historicalData} color={color} />
            </Box>
          );
        },
      },
    ],
    [],
  );

  const CustomToolbar = React.useMemo(() => {
    const ToolbarComponent = () => {
      const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
      const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

      return (
        <Toolbar>
          <Typography fontWeight="medium" sx={{ flex: 1, mx: 0.5 }}>
            Stock Items
            {filteredRows.length !== allRows.length && (
              <Typography
                component="span"
                sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 400, color: '#757575' }}
              >
                ({filteredRows.length} dari {allRows.length})
              </Typography>
            )}
          </Typography>

          <Tooltip title="Columns">
            <ColumnsPanelTrigger render={<ToolbarButton />}>
              <ViewColumnIcon fontSize="small" />
            </ColumnsPanelTrigger>
          </Tooltip>

          <Tooltip title="Filters">
            <FilterPanelTrigger
              render={(props, state) => (
                <ToolbarButton {...props} color="default">
                  <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                    <FilterListIcon fontSize="small" />
                  </Badge>
                </ToolbarButton>
              )}
            />
          </Tooltip>

          <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />

          <Tooltip title="Export">
            <ToolbarButton
              ref={exportMenuTriggerRef}
              id="export-menu-trigger"
              aria-controls="export-menu"
              aria-haspopup="true"
              aria-expanded={exportMenuOpen ? 'true' : undefined}
              onClick={() => setExportMenuOpen(true)}
            >
              <FileDownloadIcon fontSize="small" />
            </ToolbarButton>
          </Tooltip>

          <Menu
            id="export-menu"
            anchorEl={exportMenuTriggerRef.current}
            open={exportMenuOpen}
            onClose={() => setExportMenuOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              list: {
                'aria-labelledby': 'export-menu-trigger',
              },
            }}
          >
            <ExportPrint render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
              Print
            </ExportPrint>
            <ExportCsv render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
              Download as CSV
            </ExportCsv>
          </Menu>

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 1 }}>
            <TextField
              size="small"
              placeholder="Search items..."
              value={itemSearchQuery}
              onChange={(e) => onItemSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: itemSearchQuery ? (
                  <InputAdornment position="end">
                    <Box
                      component="button"
                      onClick={() => onItemSearchChange('')}
                      sx={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        marginRight: -0.75,
                        color: 'inherit',
                        '&:hover': {
                          opacity: 0.7,
                        },
                      }}
                      aria-label="Clear search"
                    >
                      <CancelIcon fontSize="small" />
                    </Box>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: { xs: 200, sm: 280 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.875rem',
                  height: '32px',
                  '& fieldset': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#9CA3AF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366F1',
                    borderWidth: '1px',
                  },
                },
                input: {
                  color: '#212121',
                  padding: '8px 12px',
                  '&::placeholder': {
                    color: '#9CA3AF',
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Toolbar>
      );
    };
    return ToolbarComponent;
  }, [filteredRows.length, allRows.length, itemSearchQuery, onItemSearchChange]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2, md: 2.5 },
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1,
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Filter Section di Kiri */}
        <Box
          sx={{
            width: { xs: '100%', lg: 320 },
            minWidth: { xs: '100%', lg: 320 },
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FilterSection
            currentPage={currentPage}
            onPageChange={onPageChange}
            selectedCategories={selectedCategories}
            onCategoryToggle={onCategoryToggle}
            onCategoryChange={onCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onRefresh={onRefresh}
            isLoading={isLoading}
            categories={categories}
            rangeDates={rangeDates}
            onAddRange={onAddRange}
            onRemoveRange={onRemoveRange}
            availableYears={availableYears}
            selectedYears={selectedYears}
            businessUnits={businessUnits}
            onBusinessUnitToggle={onBusinessUnitToggle}
            dataType={dataType}
            onDataTypeChange={onDataTypeChange}
            invoiceData={invoiceData}
          />
        </Box>

        {/* Main DataGrid */}
        <Box
          sx={{
            flex: '1 1 55%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            minHeight: 0,
            overflow: 'visible',
            padding: '2px',
          }}
        >
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
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Manual Toolbar */}
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: '#E5E7EB',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 48,
                  flexShrink: 0,
                  gap: 2,
                }}
              >
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
                  Stock Items
                  {filteredRows.length !== allRows.length && (
                    <Typography
                      component="span"
                      sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 400, color: '#757575' }}
                    >
                      ({filteredRows.length} dari {allRows.length})
                    </Typography>
                  )}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Columns">
                    <IconButton
                      ref={columnsMenuAnchorRef}
                      size="small"
                      onClick={() => setColumnsMenuOpen(true)}
                      sx={{
                        color: '#757575',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          color: '#212121',
                        },
                      }}
                    >
                      <ViewColumnIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={columnsMenuAnchorRef.current}
                    open={columnsMenuOpen}
                    onClose={() => setColumnsMenuOpen(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        maxHeight: 400,
                        '& .MuiMenuItem-root': {
                          px: 1.5,
                        },
                      },
                    }}
                  >
                    <MenuItem disabled>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Toggle Columns
                      </Typography>
                    </MenuItem>
                    <Divider />
                    {columns.map((column) => (
                      <MenuItem
                        key={column.field}
                        onClick={() => {
                          setColumnVisibilityModel((prev) => ({
                            ...prev,
                            [column.field]: !prev[column.field],
                          }));
                        }}
                        dense
                      >
                        <Checkbox
                          checked={columnVisibilityModel[column.field] !== false}
                          size="small"
                          sx={{ py: 0 }}
                        />
                        <ListItemText primary={column.headerName || column.field} />
                      </MenuItem>
                    ))}
                  </Menu>

                  <Tooltip title="Filters">
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (apiRef.current) {
                          apiRef.current.showFilterPanel();
                        }
                      }}
                      sx={{
                        color: '#757575',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          color: '#212121',
                        },
                      }}
                    >
                      <FilterListIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5, height: 24 }} />

                  <Tooltip title="Export CSV">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const csvContent = [
                          ['Display Name', 'Name', 'QTY'].join(','),
                          ...filteredRows.map((row) => [row.symbol, row.name, row.qty].join(',')),
                        ].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'stock-items.csv';
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      sx={{
                        color: '#757575',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          color: '#212121',
                        },
                      }}
                    >
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <TextField
                    size="small"
                    placeholder="Search items..."
                    value={itemSearchQuery}
                    onChange={(e) => onItemSearchChange(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: itemSearchQuery ? (
                        <InputAdornment position="end">
                          <Box
                            component="button"
                            onClick={() => onItemSearchChange('')}
                            sx={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: 0,
                              marginRight: -0.75,
                              color: 'inherit',
                              '&:hover': {
                                opacity: 0.7,
                              },
                            }}
                            aria-label="Clear search"
                          >
                            <CancelIcon fontSize="small" />
                          </Box>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      width: { xs: 200, sm: 280 },
                      ml: 1,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.875rem',
                        height: '32px',
                        '& fieldset': {
                          borderColor: '#D1D5DB',
                        },
                        '&:hover fieldset': {
                          borderColor: '#9CA3AF',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366F1',
                          borderWidth: '1px',
                        },
                      },
                      input: {
                        color: '#212121',
                        padding: '8px 12px',
                        '&::placeholder': {
                          color: '#9CA3AF',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <DataGrid
                apiRef={apiRef}
                rows={filteredRows}
                columns={columns}
                loading={isLoading}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
                disableMultipleRowSelection
                getRowId={(row) => row.id}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 25,
                    },
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                sx={{
                  border: 'none',
                  flex: 1,
                  minHeight: 0,
                  '& .MuiDataGrid-columnHeaders': {
                    borderTop: 'none',
                    borderColor: '#E5E7EB',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                  '& .MuiDataGrid-root': {
                    border: 'none',
                  },
                  '& .MuiDataGrid-cell': {
                    borderColor: '#E5E7EB',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid',
                    borderColor: '#E5E7EB',
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    px: 2.5,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: '#E5E7EB',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '48px',
                  },
                  '& .MuiDataGrid-toolbar': {
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 1,
                  },
                }}
              />
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Chart Panel - Always visible */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          height: 320,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StockDetailsPanel
          apiRef={apiRef as React.RefObject<GridApi>}
          filteredRows={filteredRows}
          allRows={allRows}
        />
      </Box>
    </>
  );
}

export default ItemTablePage;