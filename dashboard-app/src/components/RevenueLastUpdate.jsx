import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { API_URL } from '../config/api';
import { fetchWithAuth } from '../utils/fetchWithAuth';

function buildUpdateText(item) {
  const sourceTable = String(item?.source_table ?? '').trim();
  const lastDate = String(item?.last_date ?? '').trim();

  if (sourceTable && lastDate) {
    return `Last Update ${sourceTable}: ${lastDate}`;
  }

  if (lastDate) {
    return `Last Update ${lastDate}`;
  }

  if (sourceTable) {
    return `Last Update ${sourceTable}`;
  }

  return 'Last Update Tidak ada data';
}

export default function RevenueLastUpdate({ sx = {} }) {
  const [lastUpdates, setLastUpdates] = React.useState([]);
  const [isError, setIsError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(true);
  const cycleTimeoutRef = React.useRef();
  const fadeTimeoutRef = React.useRef();

  React.useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    fetchWithAuth(`${API_URL}/financial/last-update`, {
      method: 'GET',
    })
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;

        if (data.status === 'success' && Array.isArray(data.data)) {
          setLastUpdates(data.data);
          setIsError(false);
        } else {
          setLastUpdates([]);
          setIsError(true);
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLastUpdates([]);
        setIsError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const clearTimers = () => {
      clearTimeout(cycleTimeoutRef.current);
      clearTimeout(fadeTimeoutRef.current);
    };

    clearTimers();
    setCurrentIndex(0);
    setIsVisible(true);

    if (isLoading || isError || lastUpdates.length <= 1) {
      return clearTimers;
    }

    const scheduleCycle = () => {
      setIsVisible(false);
      fadeTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((previousIndex) => (previousIndex + 1) % lastUpdates.length);
        setIsVisible(true);
        cycleTimeoutRef.current = setTimeout(scheduleCycle, 2200);
      }, 220);
    };

    cycleTimeoutRef.current = setTimeout(scheduleCycle, 2200);

    return clearTimers;
  }, [isError, isLoading, lastUpdates]);

  let content = 'Last Update Memuat...';
  let textColor = '#64748B';

  if (!isLoading && isError) {
    content = 'Last Update Gagal mengambil data';
    textColor = '#DC2626';
  } else if (!isLoading && lastUpdates.length > 0) {
    content = buildUpdateText(lastUpdates[currentIndex]);
  } else if (!isLoading) {
    content = 'Last Updatearn Tidak ada data';
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        maxWidth: '100%',
        minWidth: 0,
        px: 1.1,
        py: 0.55,
        borderRadius: '999px',
        bgcolor: 'rgba(47, 111, 178, 0.08)',
        border: '1px solid rgba(47, 111, 178, 0.14)',
        ...sx,
      }}
    >
      <AccessTimeRoundedIcon
        sx={{
          fontSize: '0.95rem',
          color: '#2F6FB2',
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        title={content}
        sx={{
          minWidth: 0,
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.2,
          color: textColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        {content}
      </Typography>
    </Box>
  );
}
