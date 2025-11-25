import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';

function ChartMonthlyHTML() {
  const iframeRef = React.useRef(null);
  const [showChart, setShowChart] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  // Settings state
  const [account, setAccount] = React.useState('4000.01.00');
  const [startDate, setStartDate] = React.useState('2024-01-01');
  const [endDate, setEndDate] = React.useState('2025-12-31');
  const [businessUnits, setBusinessUnits] = React.useState({
    Gosave: true,
    Goto: true
  });

  const handleBusinessUnitToggle = (unit) => {
    setBusinessUnits(prev => ({
      ...prev,
      [unit]: !prev[unit]
    }));
  };

  const handleLoadChart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Baca file HTML, CSS, dan JS menggunakan import dengan ?raw
      let htmlContent = '';
      let cssContent = '';
      let jsContent = '';
      
      try {
        // Import HTML menggunakan ?raw (Vite support)
        const htmlModule = await import('./index.html?raw');
        htmlContent = htmlModule.default;
        console.log('HTML loaded successfully');
      } catch (e) {
        console.error('Gagal import HTML dengan ?raw:', e);
        // Fallback: coba dengan fetch menggunakan path absolut
        try {
          const baseUrl = window.location.origin;
          const response = await fetch(`${baseUrl}/src/chart/ChartMonthly/index.html`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          htmlContent = await response.text();
          console.log('HTML loaded dengan fetch');
        } catch (fetchError) {
          console.error('Gagal fetch HTML:', fetchError);
          throw new Error('Tidak bisa memuat file HTML. Pastikan file index.html ada di src/chart/ChartMonthly/');
        }
      }
      
      try {
        // Import CSS menggunakan ?raw
        const cssModule = await import('./style.css?raw');
        cssContent = cssModule.default;
        console.log('CSS loaded successfully');
      } catch (e) {
        console.warn('Gagal import CSS dengan ?raw:', e);
        // Fallback dengan fetch
        try {
          const baseUrl = window.location.origin;
          const response = await fetch(`${baseUrl}/src/chart/ChartMonthly/style.css`);
          if (response.ok) {
            cssContent = await response.text();
            console.log('CSS loaded dengan fetch');
          }
        } catch (fetchError) {
          console.warn('Gagal fetch CSS:', fetchError);
        }
      }
      
      try {
        // Import JS menggunakan ?raw
        const jsModule = await import('./main.js?raw');
        jsContent = jsModule.default;
        console.log('JS loaded successfully');
      } catch (e) {
        console.warn('Gagal import JS dengan ?raw:', e);
        // Fallback dengan fetch
        try {
          const baseUrl = window.location.origin;
          const response = await fetch(`${baseUrl}/src/chart/ChartMonthly/main.js`);
          if (response.ok) {
            jsContent = await response.text();
            console.log('JS loaded dengan fetch');
          }
        } catch (fetchError) {
          console.warn('Gagal fetch JS:', fetchError);
        }
      }
      
      // Suntikkan CSS langsung ke HTML
      if (cssContent) {
        htmlContent = htmlContent.replace(
          /<link rel="stylesheet" href="style\.css">/,
          `<style>${cssContent}</style>`
        );
      }
      
      // Suntikkan JS langsung ke HTML
      if (jsContent) {
        htmlContent = htmlContent.replace(
          /<script type="module" src="main\.js"><\/script>/,
          `<script type="module">${jsContent}</script>`
        );
      }
      
      // Set nilai default untuk form di HTML
      htmlContent = htmlContent.replace(
        /id="account_header" value="[^"]*"/,
        `id="account_header" value="${account}"`
      );
      htmlContent = htmlContent.replace(
        /id="start_date" value="[^"]*"/,
        `id="start_date" value="${startDate}"`
      );
      htmlContent = htmlContent.replace(
        /id="end_date" value="[^"]*"/,
        `id="end_date" value="${endDate}"`
      );
      
      // Buat blob URL
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      if (iframeRef.current) {
        iframeRef.current.src = url;
        setShowChart(true);
        setIsLoading(false);
      }
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error loading HTML:', error);
      setError(`Gagal memuat file HTML: ${error.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Tampilkan form setting jika chart belum ditampilkan
  if (!showChart) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100%',
        p: 3,
        overflow: 'auto'
      }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Konfigurasi Chart Monthly Revenue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Silakan konfigurasi pengaturan berikut sebelum memuat chart
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="4000.01.00"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Tanggal Mulai"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Tanggal Akhir"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Business Unit:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={businessUnits.Gosave}
                        onChange={() => handleBusinessUnitToggle('Gosave')}
                      />
                    }
                    label="Gosave"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={businessUnits.Goto}
                        onChange={() => handleBusinessUnitToggle('Goto')}
                      />
                    }
                    label="Goto"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleLoadChart}
                  disabled={isLoading}
                  sx={{ minWidth: 150 }}
                >
                  {isLoading ? 'Memuat...' : 'Load Chart'}
                </Button>
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Typography color="error">{error}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Tampilkan chart setelah setting dikonfigurasi
  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Button
        variant="outlined"
        onClick={() => setShowChart(false)}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        Kembali ke Setting
      </Button>
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Chart Monthly"
      />
    </Box>
  );
}

export default ChartMonthlyHTML;

