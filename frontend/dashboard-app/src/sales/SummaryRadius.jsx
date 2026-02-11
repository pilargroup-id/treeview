import * as React from 'react';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import NoPhotographyIcon from '@mui/icons-material/NoPhotography';
import GroupsIcon from '@mui/icons-material/Groups';
import PlaceIcon from '@mui/icons-material/Place';

const ACCENT_BLUE = '#6BA3D0';
const ACCENT_BLUE_BG = 'rgba(107, 163, 208, 0.12)';

function formatNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

function toLabel(value) {
  const label = String(value ?? '').trim();
  return label || '-';
}

function formatDateDmy(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;

  const dmyMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmyMatch) return `${dmyMatch[1]}-${dmyMatch[2]}-${dmyMatch[3]}`;

  return raw;
}

function buildBars(items, palette) {
  const maxValue = Math.max(...items.map((it) => it.value), 1);
  return items.map((it, idx) => ({
    ...it,
    percent: (it.value / maxValue) * 100,
    color: palette[idx % palette.length],
  }));
}

function groupCounts(rows, key) {
  const totals = new Map();
  for (const row of rows) {
    const label = toLabel(row?.[key]);
    totals.set(label, (totals.get(label) ?? 0) + 1);
  }
  const items = Array.from(totals, ([label, value]) => ({ label, value }));
  items.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  return items;
}

function SmallStatCard({ title, icon, value, subtitle, accent, iconColor }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 1px 2px rgba(16,24,40,0.06)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: ACCENT_BLUE, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT_BLUE, fontVariantNumeric: 'tabular-nums' }}>
          {formatNumber(value)}
        </div>
        {subtitle ? <div style={{ fontSize: 12, color: '#98A2B3' }}>{subtitle}</div> : null}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: accent ?? '#F2F4F7',
          color: iconColor ?? ACCENT_BLUE,
          flex: '0 0 auto',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
    </div>
  );
}

function VerticalBars({ title, icon, totalLabel, items, emptyText }) {
  const sectionTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 18,
    fontWeight: 800,
    color: ACCENT_BLUE,
    letterSpacing: 0.1,
  };

  const sectionIconStyle = { fontSize: 20, color: ACCENT_BLUE };

  if (!items || items.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={sectionTitleStyle}>
            {React.cloneElement(icon, { style: sectionIconStyle })}
            <span>{title}</span>
          </div>
          {totalLabel ? <div style={{ fontSize: 13, color: ACCENT_BLUE }}>{totalLabel}</div> : null}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: '#667085' }}>{emptyText ?? 'Tidak ada data.'}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={sectionTitleStyle}>
          {React.cloneElement(icon, { style: sectionIconStyle })}
          <span>{title}</span>
        </div>
        {totalLabel ? <div style={{ fontSize: 13, color: ACCENT_BLUE }}>{totalLabel}</div> : null}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#667085', marginBottom: 10 }}>(Scroll ke samping jika item banyak)</div>
        <div
          style={{
            border: '1px solid #EAECF0',
            borderRadius: 8,
            padding: 12,
            background: '#FFFFFF',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: 220, paddingBottom: 4 }}>
            {items.map((bar) => (
              <div
                key={bar.label}
                title={`${bar.label}: ${formatNumber(bar.value)}`}
                style={{ width: 72, flex: '0 0 72px', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div
                  style={{
                    height: 180,
                    background: '#F2F4F7',
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #EAECF0',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: `${bar.percent}%`,
                      background: bar.color,
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 8,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#344054',
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: '0 1px 0 rgba(255,255,255,0.65)',
                      padding: '0 6px',
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatNumber(bar.value)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: ACCENT_BLUE,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {bar.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryResult({ rows, filters, isLoading, loadError }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const photoCount = React.useMemo(() => {
    let count = 0;
    for (const row of safeRows) {
      const url = String(row?.user_photo ?? '').trim();
      if (url) count += 1;
    }
    return count;
  }, [safeRows]);

  const noPhotoCount = safeRows.length - photoCount;

  const periodLabel = React.useMemo(() => {
    const startDate = formatDateDmy(filters?.start_date);
    const endDate = formatDateDmy(filters?.end_date);
    if (startDate && endDate) return `Dari ${startDate} sampai ${endDate}`;
    if (startDate) return `Dari ${startDate}`;
    if (endDate) return `Sampai ${endDate}`;
    return 'Semua';
  }, [filters?.end_date, filters?.start_date]);

  const palette = [ACCENT_BLUE, '#7AA4D3', '#8CB3D9', '#5B8AB8', '#4A709F'];

  const salesBars = React.useMemo(() => {
    const items = groupCounts(safeRows, 'sales_name');
    return buildBars(items, palette);
  }, [palette, safeRows]);

  const wilayahBars = React.useMemo(() => {
    const items = groupCounts(safeRows, 'wilayah');
    return buildBars(items, palette);
  }, [palette, safeRows]);

  const headerNote = loadError ? (
    <div style={{ marginBottom: 10, color: '#b42318' }}>{String(loadError)}</div>
  ) : isLoading ? (
    <div style={{ marginBottom: 10, color: '#6b7685' }}>Loading...</div>
  ) : null;

  const subtitle = [`Periode: ${periodLabel}`, `Total baris: ${formatNumber(safeRows.length)}`].join(' | ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {headerNote}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT_BLUE }}>Summary Result</div>
        <div style={{ fontSize: 12, fontWeight: 400, color: '#667085' }}>{subtitle}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <SmallStatCard
          title="Dengan Foto"
          value={photoCount}
          subtitle={safeRows.length > 0 ? `${Math.round((photoCount / safeRows.length) * 100)}% dari total` : null}
          accent={ACCENT_BLUE_BG}
          iconColor={ACCENT_BLUE}
          icon={<PhotoCameraIcon style={{ fontSize: 22 }} />}
        />
        <SmallStatCard
          title="Tanpa Foto"
          value={noPhotoCount}
          subtitle={safeRows.length > 0 ? `${Math.round((noPhotoCount / safeRows.length) * 100)}% dari total` : null}
          accent="#F2F4F7"
          icon={<NoPhotographyIcon style={{ fontSize: 22 }} />}
        />
      </div>

      <VerticalBars
        title="Sales"
        icon={<GroupsIcon />}
        totalLabel={`Total Sales: ${formatNumber(new Set(salesBars.map((b) => b.label)).size)}`}
        items={salesBars}
        emptyText="Tidak ada data sales."
      />

      <VerticalBars
        title="Wilayah"
        icon={<PlaceIcon />}
        totalLabel={`Total Wilayah: ${formatNumber(new Set(wilayahBars.map((b) => b.label)).size)}`}
        items={wilayahBars}
        emptyText="Tidak ada data wilayah."
      />
    </div>
  );
}
