import * as React from 'react';
import Box from '@mui/material/Box';

const TOOLBAR_URL = new URL('./ToolbarMonthlyReport.html', import.meta.url).href;

export default function ToolbarMonthlyReport() {
  const iframeRef = React.useRef(null);
  const [height, setHeight] = React.useState(120);

  const updateHeight = React.useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc?.body) return;
      const docHeight = doc.documentElement?.scrollHeight ?? 0;
      const bodyHeight = doc.body.scrollHeight ?? 0;
      const nextHeight = Math.max(docHeight, bodyHeight);
      if (Number.isFinite(nextHeight) && nextHeight > 0) {
        setHeight((prev) => (Math.abs(prev - nextHeight) > 2 ? nextHeight : prev));
      }
    } catch (error) {
      // Cross-origin access is blocked; keep the default height.
    }
  }, []);

  const handleLoad = React.useCallback(() => {
    updateHeight();
    setTimeout(updateHeight, 100);
  }, [updateHeight]);

  React.useEffect(() => {
    const handleResize = () => updateHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateHeight]);

  return (
    <Box sx={{ width: '100%', bgcolor: '#fff' }}>
      <iframe
        ref={iframeRef}
        src={TOOLBAR_URL}
        title="Toolbar Monthly Report"
        onLoad={handleLoad}
        style={{
          width: '100%',
          height,
          border: 0,
          display: 'block',
          background: 'transparent',
        }}
      />
    </Box>
  );
}
