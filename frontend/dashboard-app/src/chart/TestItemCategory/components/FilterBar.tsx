import * as React from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";

interface FilterBarProps {
  searchText: string;
  setSearchText: (text: string) => void;
}

export default function FilterBar({ searchText, setSearchText }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchText.trim() !== '') {
      setOpen(true);  
    }
  }, [searchText]);

  const handleClose = () => {
    setOpen(false);
    setSearchText("");
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {/* Search icon → membuka input */}
      {!open ? (
        <IconButton 
          onClick={() => setOpen(true)}
          size="small"
          sx={{
            color: '#757575',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              color: '#212121',
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 20 }} />
        </IconButton>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <TextField
            size="small"
            placeholder="Search items by name or symbol…"
            autoFocus
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: 200, sm: 280 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#FFFFFF',
                fontSize: '0.875rem',
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

          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: '#757575',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: '#212121',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

