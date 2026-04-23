import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ name: string; count: number; dpp: number }>;
  selectedCategories: string[];
  onToggle: (category: string) => void;
  onChange?: (categories: string[]) => void;
}

function CategoryModal({
  open,
  onClose,
  categories,
  selectedCategories,
  onToggle,
  onChange,
}: CategoryModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const handleSelectAll = () => {
    if (onChange) {
      onChange(filteredCategories.map((cat) => cat.name));
    } else {
      filteredCategories.forEach((cat) => {
        if (!selectedCategories.includes(cat.name)) {
          onToggle(cat.name);
        }
      });
    }
  };

  const handleClearAll = () => {
    if (onChange) {
      onChange([]);
    } else {
      selectedCategories.forEach((cat) => {
        if (selectedCategories.includes(cat)) {
          onToggle(cat);
        }
      });
    }
  };

  const allFilteredSelected = filteredCategories.length > 0 && 
    filteredCategories.every((cat) => selectedCategories.includes(cat.name));
  const someFilteredSelected = filteredCategories.some((cat) => selectedCategories.includes(cat.name));

  const handleSelectAllToggle = () => {
    if (allFilteredSelected) {
      if (onChange) {
        const remaining = selectedCategories.filter(
          (cat) => !filteredCategories.some((fc) => fc.name === cat)
        );
        onChange(remaining);
      } else {
        filteredCategories.forEach((cat) => {
          if (selectedCategories.includes(cat.name)) {
            onToggle(cat.name);
          }
        });
      }
    } else {
      handleSelectAll();
    }
  };

  React.useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          pt: 2.5,
          px: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#212121',
            letterSpacing: '-0.01em',
          }}
        >
          Atur Kategori
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#9E9E9E',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              color: '#212121',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search Field */}
          <TextField
            fullWidth
            size="medium"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9E9E9E', fontSize: '1.25rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                bgcolor: '#FFFFFF',
                transition: 'all 0.2s ease',
                '& fieldset': {
                  borderColor: '#E5E5E5',
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#E0E0E0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2F6FB2',
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                py: 1.125,
              },
            }}
          />

          {/* Select All / Clear All */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allFilteredSelected}
                  indeterminate={someFilteredSelected && !allFilteredSelected}
                  onChange={handleSelectAllToggle}
                  icon={<CheckBoxOutlineBlankIcon />}
                  checkedIcon={<CheckBoxIcon />}
                  sx={{
                    color: '#2F6FB2',
                    '&.Mui-checked': {
                      color: '#2F6FB2',
                    },
                    '&.MuiCheckbox-indeterminate': {
                      color: '#2F6FB2',
                    },
                  }}
                />
              }
              label={
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#757575',
                    ml: 0.5,
                  }}
                >
                  Pilih Semua
                </Typography>
              }
            />
            {selectedCategories.length > 0 && (
              <Button
                onClick={handleClearAll}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#2F6FB2',
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(47, 111, 178, 0.06)',
                  },
                }}
              >
                Hapus Semua
              </Button>
            )}
          </Box>

          {/* Category List */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              maxHeight: 400,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: '#F5F5F5',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#E0E0E0',
                borderRadius: '3px',
                '&:hover': {
                  bgcolor: '#BDBDBD',
                },
              },
            }}
          >
            {filteredCategories.length === 0 ? (
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  color: '#9E9E9E',
                  fontStyle: 'italic',
                  py: 2,
                  textAlign: 'center',
                }}
              >
                Tidak ada kategori yang cocok
              </Typography>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.name);
                return (
                  <FormControlLabel
                    key={category.name}
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggle(category.name)}
                        icon={<CheckBoxOutlineBlankIcon />}
                        checkedIcon={<CheckBoxIcon />}
                        sx={{
                          color: '#2F6FB2',
                          '&.Mui-checked': {
                            color: '#2F6FB2',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: '#212121',
                          }}
                        >
                          {category.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: '#9E9E9E',
                            fontWeight: 400,
                          }}
                        >
                          ({category.count})
                        </Typography>
                      </Box>
                    }
                    sx={{
                      m: 0,
                      py: 0.75,
                      px: 1,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(47, 111, 178, 0.04)',
                      },
                    }}
                  />
                );
              })
            )}
          </Box>

          {/* Selected Count */}
          {selectedCategories.length > 0 && (
            <Box
              sx={{
                pt: 1,
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.8125rem',
                  color: '#757575',
                  textAlign: 'center',
                }}
              >
                {selectedCategories.length} kategori dipilih
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#757575',
            px: 2,
            py: 0.75,
            borderRadius: '8px',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Tutup
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            bgcolor: '#2F6FB2',
            px: 2.5,
            py: 0.75,
            borderRadius: '8px',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#1F4E8C',
              boxShadow: '0 2px 8px rgba(47, 111, 178, 0.3)',
            },
          }}
        >
          Terapkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CategoryModal;

