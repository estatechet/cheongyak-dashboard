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
  overflow: 'hidden',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '14px 20px 12px 20px',
  borderBottom: '1px solid #f0f0f0',
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

  const top12 = [...validItems]
    .sort((a, b) => parseFloat(b.CMPET_RATE) - parseFloat(a.CMPET_RATE))
    .slice(0, 12)
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
    .slice(0, 10);

  const typeMap = new Map<string, { total: number; count: number }>();
  validItems.forEach((i) => {
    const key = i.HOUSE_TY || '기타';
    const existing = typeMap.get(key) ?? { total: 0, count: 0 };
    typeMap.set(key, { total: existing.total + parseFloat(i.CMPET_RATE), count: existing.count + 1 });
  });
  const typeChart = Array.from(typeMap.entries())
    .map(([name, { total, count }]) => ({ name, rate: parseFloat((total / count).toFixed(1)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  const topReqItems = [...validItems]
    .sort((a, b) => Number(b.REQ_CNT) - Number(a.REQ_CNT))
    .slice(0, 8)
    .map((i, idx) => ({
      rank: idx + 1,
      type: i.HOUSE_TY || '-',
      region: i.RESIDE_SENM || '-',
      reqCnt: Number(i.REQ_CNT || 0),
      rate: parseFloat(i.CMPET_RATE).toFixed(1),
    }));

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      {/* Left: 2×2 grid */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {/* Panel 1: Top 12 bar chart */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>경쟁률 상위</h3>
            {!isLoading && !isError && (
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
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
          <div style={{ padding: '12px 16px 16px' }}>
            {isLoading ? (
              <PlaceholderBox />
            ) : isError || data?.error ? (
              <ErrorState message={data?.error ?? '오류'} />
            ) : top12.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={top12} margin={{ top: 4, right: 4, left: -22, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#7a7a7a' }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <Tooltip
                    formatter={(v) => [`${v}:1`, '경쟁률']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                    {top12.map((_, i) => (
                      <Cell key={i} fill={MONO_SHADES[i % MONO_SHADES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 2: Regional average */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>지역별 평균 경쟁률</h3>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            {isLoading ? (
              <PlaceholderBox />
            ) : regionChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={regionChart} layout="vertical" margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#7a7a7a' }} width={44} />
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

        {/* Panel 3: By house type */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>주택형별 평균 경쟁률</h3>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            {isLoading ? (
              <PlaceholderBox />
            ) : typeChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={typeChart} margin={{ top: 4, right: 4, left: -22, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#7a7a7a' }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <Tooltip
                    formatter={(v) => [`${v}:1`, '평균 경쟁률']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" fill="#555555" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 4: Top by request count */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>신청건수 상위</h3>
          </div>
          {isLoading ? (
            <div style={{ padding: '16px' }}><PlaceholderBox /></div>
          ) : topReqItems.length === 0 ? (
            <EmptyState />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f7' }}>
                <tr>
                  {['#', '주택형', '지역', '신청', '경쟁률'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7a7a7a', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topReqItems.map((item) => (
                  <tr key={item.rank} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px', color: '#b0b0b0', fontSize: '11px', fontWeight: 600 }}>{item.rank}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: '#1d1d1f' }}>{item.type}</td>
                    <td style={{ padding: '8px 10px', fontSize: '11px', color: '#7a7a7a' }}>{item.region}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: '#7a7a7a' }}>{item.reqCnt.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', fontSize: '12px', color: '#1d1d1f', fontWeight: parseFloat(item.rate) > 10 ? 700 : 400 }}>
                      {item.rate}:1
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: 전체 경쟁률 현황 */}
      <div style={{ ...panelStyle, width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>전체 경쟁률 현황</h3>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 178px)' }}>
          {isLoading ? (
            <div style={{ padding: '24px 16px' }}><LoadingState /></div>
          ) : isError || data?.error ? (
            <ErrorState message={data?.error ?? '오류'} />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f5f5f7', position: 'sticky', top: 0 }}>
                <tr>
                  {['주택형', '지역', '신청', '경쟁률'].map((h) => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7a7a7a', whiteSpace: 'nowrap' }}>
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#fafafc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '9px 12px', color: '#1d1d1f', fontSize: '12px' }}>{item.HOUSE_TY || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#7a7a7a', fontSize: '11px' }}>{item.RESIDE_SENM || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#7a7a7a', fontSize: '12px' }}>
                      {Number(item.REQ_CNT || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: '12px' }}>
                      <span style={{ fontWeight: parseFloat(item.CMPET_RATE) > 10 ? 700 : 400, color: '#1d1d1f' }}>
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

function PlaceholderBox() {
  return <div style={{ height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingState /></div>;
}

function LoadingState() {
  return <span style={{ fontSize: '11px', color: '#b0b0b0' }}>로딩 중...</span>;
}

function EmptyState() {
  return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: '11px', color: '#b0b0b0' }}>데이터가 없습니다.</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: '11px', color: '#7a7a7a' }}>{message}</span>
    </div>
  );
}
