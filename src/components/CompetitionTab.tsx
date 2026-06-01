'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CompetitionItem {
  HOUSE_MANAGE_NO: string;
  PBLANC_NO: string;
  HOUSE_TY: string;
  CMPET_RATE: string;
  REQ_CNT: string;
  RESIDE_SECD: string;
  RESIDE_SENM: string;
  MODEL_NO: string;
}

interface ApiResponse {
  totalCount?: number;
  data?: CompetitionItem[];
  error?: string;
}

const MONO_SHADES = ['#1d1d1f', '#333333', '#555555', '#7a7a7a', '#999999', '#b0b0b0', '#c8c8c8', '#e0e0e0'];

async function fetchCompetition(region: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'competition' });
  if (region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '18px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '16px 20px 12px 20px',
  borderBottom: '1px solid #f0f0f0',
  flexShrink: 0,
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
  color: '#1d1d1f',
  margin: 0,
};

export default function CompetitionTab({ region }: { region: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['competition', region],
    queryFn: () => fetchCompetition(region),
  });

  const items = data?.data ?? [];
  const total = data?.totalCount ?? 0;

  const validItems = items.filter((i) => parseFloat(i.CMPET_RATE) > 0);
  const maxRate = validItems.length > 0 ? Math.max(...validItems.map((i) => parseFloat(i.CMPET_RATE))) : 0;
  const avgRate =
    validItems.length > 0
      ? validItems.reduce((s, i) => s + parseFloat(i.CMPET_RATE), 0) / validItems.length
      : 0;

  const top15 = [...validItems]
    .sort((a, b) => parseFloat(b.CMPET_RATE) - parseFloat(a.CMPET_RATE))
    .slice(0, 15)
    .map((i) => ({
      name: i.HOUSE_TY
        ? `${i.HOUSE_MANAGE_NO?.slice(-4) ?? ''} ${i.HOUSE_TY}`
        : (i.HOUSE_MANAGE_NO?.slice(-6) ?? '-'),
      rate: parseFloat(i.CMPET_RATE),
    }));

  const regionMap = new Map<string, { total: number; count: number }>();
  validItems.forEach((i) => {
    const key = i.RESIDE_SENM || '기타';
    const existing = regionMap.get(key) ?? { total: 0, count: 0 };
    regionMap.set(key, { total: existing.total + parseFloat(i.CMPET_RATE), count: existing.count + 1 });
  });
  const regionChart = Array.from(regionMap.entries())
    .map(([name, { total: t, count }]) => ({ name, rate: parseFloat((t / count).toFixed(1)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 12);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.5fr',
        gap: '12px',
        height: '100%',
      }}
    >
      {/* Panel 1: Top 15 bar chart */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>경쟁률 상위</h3>
          {!isLoading && !isError && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                최고 <b style={{ color: '#1d1d1f', fontSize: '13px' }}>{maxRate.toFixed(1)}:1</b>
              </span>
              <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                평균 <b style={{ color: '#1d1d1f', fontSize: '13px' }}>{avgRate.toFixed(1)}:1</b>
              </span>
              <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                조회 <b style={{ color: '#1d1d1f', fontSize: '13px' }}>{total.toLocaleString()}건</b>
              </span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: '16px', minHeight: 0 }}>
          {isLoading ? (
            <LoadingState />
          ) : isError || (data?.error) ? (
            <ErrorState message={data?.error ?? '오류'} />
          ) : top15.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top15} margin={{ top: 4, right: 8, left: -16, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#7a7a7a' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                <Tooltip
                  formatter={(v) => [`${v}:1`, '경쟁률']}
                  contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
                <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                  {top15.map((_, i) => (
                    <Cell key={i} fill={MONO_SHADES[i % MONO_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Panel 2: Regional average horizontal bar */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>지역별 평균 경쟁률</h3>
        </div>
        <div style={{ flex: 1, padding: '16px', minHeight: 0 }}>
          {isLoading ? (
            <LoadingState />
          ) : regionChart.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionChart}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 24, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#7a7a7a' }} width={48} />
                <Tooltip
                  formatter={(v) => [`${v}:1`, '평균 경쟁률']}
                  contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
                <Bar dataKey="rate" fill="#1d1d1f" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Panel 3: Full table */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>전체 경쟁률 현황</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {isLoading ? (
            <LoadingState />
          ) : isError || data?.error ? (
            <ErrorState message={data?.error ?? '오류'} />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f7', position: 'sticky', top: 0 }}>
                <tr>
                  {['공고번호', '주택형', '지역구분', '신청건수', '경쟁률'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '-0.1px',
                        color: '#7a7a7a',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderTop: '1px solid #f0f0f0' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '10px 16px', color: '#7a7a7a', fontFamily: 'monospace', fontSize: '11px' }}>
                      {item.PBLANC_NO}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#1d1d1f', fontSize: '12px' }}>{item.HOUSE_TY || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#7a7a7a', fontSize: '12px' }}>{item.RESIDE_SENM || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#7a7a7a', fontSize: '12px' }}>
                      {Number(item.REQ_CNT || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '12px' }}>
                      <span
                        style={{
                          fontWeight: parseFloat(item.CMPET_RATE) > 10 ? 700 : 400,
                          color: '#1d1d1f',
                        }}
                      >
                        {parseFloat(item.CMPET_RATE).toFixed(1)}:1
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span style={{ fontSize: '11px', color: '#b0b0b0' }}>로딩 중...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span style={{ fontSize: '11px', color: '#b0b0b0' }}>데이터가 없습니다.</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <span style={{ fontSize: '11px', color: '#7a7a7a' }}>{message}</span>
    </div>
  );
}
