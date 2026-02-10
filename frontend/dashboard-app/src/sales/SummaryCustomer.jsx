import * as React from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaceIcon from '@mui/icons-material/Place';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';

function toSafeNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

export default function SummaryCustomer({ rows, visibleMonths, monthLabels, isLoading, loadError }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const months = Array.isArray(visibleMonths) ? visibleMonths : [];
  const labels = Array.isArray(monthLabels) ? monthLabels : [];
  const accentBlue = '#6BA3D0';

  const sectionTitleStyle = React.useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 18,
      fontWeight: 800,
      color: accentBlue,
      letterSpacing: 0.1,
    }),
    [accentBlue],
  );

  const sectionIconStyle = React.useMemo(() => ({ fontSize: 20, color: accentBlue }), [accentBlue]);

  const wilayahBars = React.useMemo(() => {
    const totalsByWilayah = new Map();

    for (const row of safeRows) {
      const wilayahRaw = row?.wilayah;
      const wilayah = String(wilayahRaw ?? '').trim() || '-';
      totalsByWilayah.set(wilayah, (totalsByWilayah.get(wilayah) ?? 0) + 1);
    }

    const items = Array.from(totalsByWilayah, ([label, value]) => ({ label, value }));
    items.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    const maxValue = Math.max(...items.map((it) => it.value), 1);
    const palette = ['#6BA3D0', '#7AA4D3', '#8CB3D9', '#5B8AB8', '#4A709F'];

    return items.map((it, idx) => ({
      ...it,
      percent: (it.value / maxValue) * 100,
      color: palette[idx % palette.length],
    }));
  }, [safeRows]);

  const { totals, grand } = React.useMemo(() => {
    const monthTotals = months.map((monthIndex) => {
      const acc = { monthIndex, week1: 0, week2: 0, week3: 0, week4: 0, total: 0 };

      for (const row of safeRows) {
        const md = row?.monthsByIndex?.[monthIndex];
        if (!md) continue;
        acc.week1 += toSafeNumber(md.week1);
        acc.week2 += toSafeNumber(md.week2);
        acc.week3 += toSafeNumber(md.week3);
        acc.week4 += toSafeNumber(md.week4);
      }

      acc.total = acc.week1 + acc.week2 + acc.week3 + acc.week4;
      return acc;
    });

    const grandTotal = monthTotals.reduce(
      (acc, t) => {
        acc.week1 += t.week1;
        acc.week2 += t.week2;
        acc.week3 += t.week3;
        acc.week4 += t.week4;
        acc.total += t.total;
        return acc;
      },
      { week1: 0, week2: 0, week3: 0, week4: 0, total: 0 },
    );

    return { totals: monthTotals, grand: grandTotal };
  }, [months, safeRows]);

  const monthLabel = React.useMemo(() => {
    if (months.length === 0) return '-';
    return months.map((m) => labels[m] ?? `Bulan ${String(m + 1)}`).join(', ');
  }, [months, labels]);

  const colors = ['#6BA3D0', '#7AA4D3', '#5B8AB8', '#4A709F'];
  const chartBars = React.useMemo(() => {
    const maxValue = Math.max(grand.week1, grand.week2, grand.week3, grand.week4, 1);
    return [
      { label: 'Week 1', value: grand.week1, percent: (grand.week1 / maxValue) * 100 },
      { label: 'Week 2', value: grand.week2, percent: (grand.week2 / maxValue) * 100 },
      { label: 'Week 3', value: grand.week3, percent: (grand.week3 / maxValue) * 100 },
      { label: 'Week 4', value: grand.week4, percent: (grand.week4 / maxValue) * 100 },
    ];
  }, [grand.week1, grand.week2, grand.week3, grand.week4]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {loadError ? <div style={{ marginBottom: 10, color: '#b42318' }}>{String(loadError)}</div> : null}

      {months.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div style={sectionTitleStyle}>
              <CalendarMonthIcon style={sectionIconStyle} />
              <span>Total per Bulan</span>
            </div>
            <div style={{ fontSize: 13, color: accentBlue }}>
              Bulan terpilih: <span style={{ fontWeight: 700, color: accentBlue }}>{monthLabel}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {totals.map((t) => (
              <div
                key={t.monthIndex}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #EAECF0',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 14, color: accentBlue, marginBottom: 8 }}>
                  {labels[t.monthIndex] ?? `Bulan ${String(t.monthIndex + 1)}`}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#344054',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatNumber(t.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={sectionTitleStyle}>
            <PlaceIcon style={sectionIconStyle} />
            <span>Wilayah</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: accentBlue }}>
            <GroupsIcon style={{ ...sectionIconStyle, fontSize: 18 }} />
            <span style={{ fontWeight: 700, color: accentBlue }}>Total Customer</span>
            <span style={{ fontWeight: 800, color: accentBlue, fontVariantNumeric: 'tabular-nums' }}>
              {formatNumber(safeRows.length)}
            </span>
          </div>
        </div>

        {wilayahBars.length === 0 ? (
          <div style={{ marginTop: 10, fontSize: 13, color: '#667085' }}>Tidak ada data.</div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 10 }}>(Scroll ke samping jika wilayah banyak)</div>
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
                {wilayahBars.map((bar) => (
                  <div
                    key={bar.label}
                    title={`${bar.label}: ${formatNumber(bar.value)}`}
                    style={{ width: 64, flex: '0 0 64px', display: 'flex', flexDirection: 'column', gap: 8 }}
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
                          fontWeight: 600,
                          color: '#344054',
                          fontVariantNumeric: 'tabular-nums',
                          textShadow: '0 1px 0 rgba(255,255,255,0.65)',
                          padding: '0 6px',
                          pointerEvents: 'none',
                        }}
                      >
                        {formatNumber(bar.value)}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: accentBlue,
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
        )}
      </div>

      <div>
        <div style={{ ...sectionTitleStyle, marginBottom: 16 }}>
          <BarChartIcon style={sectionIconStyle} />
          <span>Distribusi per Week</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chartBars.map((bar, idx) => (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 60, fontSize: 13, color: accentBlue }}>{bar.label}</div>
              <div
                style={{
                  flex: 1,
                  background: '#F2F4F7',
                  borderRadius: 4,
                  height: 32,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${bar.percent}%`,
                    background: colors[idx],
                    transition: 'width 0.3s ease',
                    borderRadius: 4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#344054',
                    background: 'rgba(249, 250, 251, 0.9)',
                    border: '1px solid rgba(234, 236, 240, 0.9)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontVariantNumeric: 'tabular-nums',
                    zIndex: 1,
                  }}
                >
                  {formatNumber(bar.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
