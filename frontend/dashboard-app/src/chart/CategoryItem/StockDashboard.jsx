import React from "react";
import { Box, Card, Typography, List, ListItem, ListItemButton, ListItemText, Divider } from "@mui/material";
import { 
  DataGrid, 
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter
} from "@mui/x-data-grid";
import { useStockData } from "./useStockData";
import { columns } from "./columns";
import { CATEGORIES } from "./data";

export default function StockDashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const { rows } = useStockData(selectedCategory);

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer sx={{ p: 2, gap: 1, borderBottom: '1px solid #E5E7EB' }}>
        <GridToolbarQuickFilter 
          placeholder="Search..."
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            }
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, #F5F7FA 0%, #F8F9FA 50%, #FAFBFC 100%)',
      pt: { xs: 3, sm: 4, md: 5 },
      px: { xs: 3, sm: 4, md: 5 },
      pb: { xs: 3, sm: 4, md: 5 },
      gap: { xs: 2, md: 3 },
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(107, 163, 208, 0.03) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      {/* Category Sidebar */}
      <Card sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E5E7EB',
        p: { xs: 2, md: 3 },
        width: { xs: '200px', md: '250px' },
        minWidth: { xs: '200px', md: '250px' },
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
          borderColor: '#D1D5DB',
        }
      }}>
        <Typography sx={{
          fontSize: { xs: '0.9375rem', md: '1.0625rem' },
          fontWeight: 600,
          color: '#212121',
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          mb: 2
        }}>
          Categories
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List sx={{ p: 0, flex: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#E3F2FD',
                  color: '#1976D2',
                  '&:hover': {
                    bgcolor: '#BBDEFB',
                  }
                },
                '&:hover': {
                  bgcolor: '#F5F5F5',
                }
              }}
            >
              <ListItemText 
                primary="All Categories" 
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: selectedCategory === null ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
          {CATEGORIES.map((category) => (
            <ListItem key={category} disablePadding>
              <ListItemButton
                selected={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: '#E3F2FD',
                    color: '#1976D2',
                    '&:hover': {
                      bgcolor: '#BBDEFB',
                    }
                  },
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                  }
                }}
              >
                <ListItemText 
                  primary={category} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: selectedCategory === category ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Card>

      {/* Card DataGrid */}
      <Card sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #E5E7EB',
        p: { xs: 3, md: 4 },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 350, md: 450 },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 1,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
          borderColor: '#D1D5DB',
          transform: 'translateY(-1px)'
        }
      }}>
        <Typography sx={{
          fontSize: { xs: '0.9375rem', md: '1.0625rem' },
          fontWeight: 600,
          color: '#212121',
          letterSpacing: '-0.01em',
          lineHeight: 1.4,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          mb: 3
        }}>
          Category Item Data {selectedCategory && `- ${selectedCategory}`}
        </Typography>

        <Box sx={{ height: '100%', width: '100%', flex: 1 }}>
          <DataGrid 
            rows={rows} 
            columns={columns} 
            disableRowSelectionOnClick
            slots={{
              toolbar: CustomToolbar,
            }}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '1px solid #E5E7EB',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      </Card>
    </Box>
  );
}
