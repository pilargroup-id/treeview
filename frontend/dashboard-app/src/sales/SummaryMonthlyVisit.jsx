import * as React from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlaceIcon from '@mui/icons-material/Place';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

const ACCENT_BLUE = '#6BA3D0';
const ACCENT_BLUE_BG = 'rgba(107, 163, 208, 0.12)';
const PALETTE = [ACCENT_BLUE, '#7AA4D3', '#8CB3D9', '#5B8AB8', '#4A709F'];

function toSafeNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

function toLabel(value) {
  const label = String(value ?? '').trim();
  return label || '-';
}

function buildBars(items, palette) {
  const maxValue = Math.max(...items.map((it) => it.value), 1);
  return items.map((it, idx) => ({
    ...it,
    percent: (it.value / maxValue) * 100,
    color: palette[idx % palette.length],
  }));
}

function formatPeriod(period) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period ?? ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

function groupSum(rows, key, valueFn) {
  const totals = new Map();
  for (const row of rows) {
    const label = toLabel(row?.[key]);
    const value = toSafeNumber(valueFn(row));
    totals.set(label, (totals.get(label) ?? 0) + value);
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

export default function SummarySales({ rows, filters, period, isLoading, loadError }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  const totalMissed = React.useMemo(() => {
    let sum = 0;
    for (const row of safeRows) sum += toSafeNumber(row?.missed_count);
    return sum;
  }, [safeRows]);

  const totalVisit = React.useMemo(() => {
    let sum = 0;
    for (const row of safeRows) sum += toSafeNumber(row?.visit_count);
    return sum;
  }, [safeRows]);

  const totalFollowUp = React.useMemo(() => {
    let sum = 0;
    for (const row of safeRows) sum += toSafeNumber(row?.follow_up_count);
    return sum;
  }, [safeRows]);

  const salesBars = React.useMemo(() => {
    const items = groupSum(
      safeRows,
      'sales_name',
      (row) => toSafeNumber(row?.missed_count),
    );
    return buildBars(items, PALETTE);
  }, [safeRows]);

  const wilayahBars = React.useMemo(() => {
    const items = groupSum(
      safeRows,
      'wilayah',
      (row) => toSafeNumber(row?.missed_count),
    );
    return buildBars(items, PALETTE);
  }, [safeRows]);

  const filterLabel = React.useMemo(() => {
    const parts = [];
    const periodLabel = formatPeriod(period);
    const wilayah = String(filters?.wilayah ?? 'ALL');
    const sales = String(filters?.sales ?? 'ALL');
    const query = String(filters?.query ?? '').trim();

    if (periodLabel) parts.push(`Periode: ${periodLabel}`);
    if (wilayah && wilayah !== 'ALL') parts.push(`Wilayah: ${wilayah}`);
    if (sales && sales !== 'ALL') parts.push(`Sales: ${sales}`);
    if (query) parts.push(`Cari: "${query}"`);

    return parts.length > 0 ? parts.join(' • ') : 'Semua data';
  }, [filters?.query, filters?.sales, filters?.wilayah, period]);

  const headerNote = loadError ? (
    <div style={{ marginBottom: 10, color: '#b42318' }}>{String(loadError)}</div>
  ) : isLoading ? (
    <div style={{ marginBottom: 10, color: '#6b7685' }}>Loading...</div>
  ) : null;

  const subtitle = `${filterLabel} • Total baris: ${formatNumber(safeRows.length)} • Total missed: ${formatNumber(totalMissed)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {headerNote}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: ACCENT_BLUE }}>Summary Sales</div>
        <div style={{ fontSize: 12, color: '#667085' }}>{subtitle}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <SmallStatCard
          title="Total Missed"
          value={totalMissed}
          subtitle={safeRows.length > 0 ? `Rata-rata: ${formatNumber(totalMissed / safeRows.length)} per baris` : null}
          accent="rgba(217, 45, 32, 0.10)"
          iconColor="#D92D20"
          icon={<ReportProblemIcon fontSize="medium" />}
        />
        <SmallStatCard
          title="Total Visit"
          value={totalVisit}
          subtitle={safeRows.length > 0 ? `Rata-rata: ${formatNumber(totalVisit / safeRows.length)} per baris` : null}
          accent={ACCENT_BLUE_BG}
          iconColor={ACCENT_BLUE}
          icon={<DirectionsWalkIcon fontSize="medium" />}
        />
        <SmallStatCard
          title="Total Follow Up"
          value={totalFollowUp}
          subtitle={safeRows.length > 0 ? `Rata-rata: ${formatNumber(totalFollowUp / safeRows.length)} per baris` : null}
          accent={ACCENT_BLUE_BG}
          iconColor={ACCENT_BLUE}
          icon={<PhoneInTalkIcon fontSize="medium" />}
        />
      </div>

      <VerticalBars
        title="Chart Sales"
        icon={<BarChartIcon />}
        totalLabel={`Total missed: ${formatNumber(totalMissed)}`}
        items={salesBars}
        emptyText="Tidak ada data sales."
      />

      <VerticalBars
        title="Chart Wilayah"
        icon={<PlaceIcon />}
        totalLabel={`Total missed: ${formatNumber(totalMissed)}`}
        items={wilayahBars}
        emptyText="Tidak ada data wilayah."
      />
    </div>
  );
}
