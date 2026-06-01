'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface AgeStatItem {
  STAT_DE: string;
  AGE_30: string;
  AGE_40: string;
  AGE_50: string;
  AGE_60: string;
}

interface AreaStatItem {
  STAT_DE: string;
  AREA_NM: string;
  APPLY_CNT: string;
  PRZWNER_CNT: string;
  CMPET_RT: string;
}

interface CmpetAreaItem {
  STAT_DE: string;
  AREA_NM: string;
  CMPET_RT: string;
  APPLY_CNT?: string;
  PRZWNER_CNT?: string;
}

interface ApiResponse {
  ageData?: { totalCount?: number; data?: AgeStatItem[] };
  areaData?: { totalCount?: number; data?: AreaStatItem[] };
  cmpetAreaData?: { totalCount?: number; data?: CmpetAreaItem[] };
  error?: string;
}

const PIE_COLORS = ['#1d1d1f', '#7a7a7a', '#b0b0b0', '#e0e0e0'];

async function fetchWinner(): Promise<ApiResponse> {
  return fetch('/api/subscription?type=winner').then((r) => r.json());
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '18px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '12px 20px 10px 20px',
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

export default function WinnerTab({ region }: { region: string }) {
  void region;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['winner'],
    queryFn: fetchWinner,
  });

  const ageItems = data?.ageData?.data ?? [];
  const areaItems = data?.areaData?.data ?? [];
  const cmpetItems = data?.cmpetAreaData?.data ?? [];

  const latest = ageItems[ageItems.length - 1];
  const ageChartData = latest
    ? [
        { name: '30대', value: Number(latest.AGE_30 || 0) },
        { name: '40대', value: Number(latest.AGE_40 || 0) },
        { name: '50대', value: Number(latest.AGE_50 || 0) },
        { name: '60대+', value: Number(latest.AGE_60 || 0) },
      ].filter((d) => d.value > 0)
    : [];

  const areaMap = new Map<string, number>();
  areaItems.forEach((i) => {
    const key = i.AREA_NM || '기타';
    areaMap.set(key, (areaMap.get(key) ?? 0) + Number(i.PRZWNER_CNT || 0));
  });
  const areaChart = Array.from(areaMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const ageTotals = { '30대': 0, '40대': 0, '50대': 0, '60대+': 0 };
  ageItems.forEach((item) => {
    ageTotals['30대'] += Number(item.AGE_30 || 0);
    ageTotals['40대'] += Number(item.AGE_40 || 0);
    ageTotals['50대'] += Number(item.AGE_50 || 0);
    ageTotals['60대+'] += Number(item.AGE_60 || 0);
  });
  const ageTotalChart = Object.entries(ageTotals).map(([name, value]) => ({ name, value }));

  const cmpetAreaMap = new Map<string, { total: number; count: number }>();
  cmpetItems.forEach((i) => {
    const key = i.AREA_NM || '기타';
    const v = parseFloat(i.CMPET_RT || '0');
    if (v > 0) {
      const existing = cmpetAreaMap.get(key) ?? { total: 0, count: 0 };
      cmpetAreaMap.set(key, { total: existing.total + v, count: existing.count + 1 });
    }
  });
  const cmpetAreaChart = Array.from(cmpetAreaMap.entries())
    .map(([name, { total, count }]) => ({ name, rate: parseFloat((total / count).toFixed(1)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', height: '100%' }}>
      {/* Left: 2×2 grid */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '12px',
        }}
      >
        {/* Panel 1: Age pie chart */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>연령대별 당첨자 분포</h3>
            {latest && (
              <span style={{ fontSize: '10px', color: '#7a7a7a', marginTop: '2px', display: 'block' }}>
                기준일 {latest.STAT_DE}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {isLoading ? (
              <Spinner />
            ) : isError || data?.error ? (
              <ErrorState message={data?.error ?? '오류'} />
            ) : ageChartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="65%"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ageChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString() + '명', '당첨자']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 2: Regional winner horizontal bar */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>지역별 당첨자 수</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {isLoading ? (
              <Spinner />
            ) : areaChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaChart} layout="vertical" margin={{ top: 4, right: 12, left: 20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#7a7a7a' }} width={44} />
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString() + '명', '당첨자']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#1d1d1f" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 3: Aggregated age totals */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>연령대별 누계 당첨자</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {isLoading ? (
              <Spinner />
            ) : ageTotalChart.every((d) => d.value === 0) ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageTotalChart} margin={{ top: 4, right: 4, left: -12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString() + '명', '누계 당첨자']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#555555" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 4: Regional competition rate */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>지역별 평균 경쟁률</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {isLoading ? (
              <Spinner />
            ) : cmpetAreaChart.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cmpetAreaChart} layout="vertical" margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
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
      </div>

      {/* Right: 연령별+지역별 통계 — same height as left grid */}
      <div style={{ ...panelStyle, width: '320px', flexShrink: 0 }}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>연령별 + 지역별 통계</h3>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '24px 16px' }}><Spinner /></div>
          ) : isError || data?.error ? (
            <ErrorState message={data?.error ?? '오류'} />
          ) : (
            <>
              {ageItems.length > 0 && (
                <>
                  <div style={{ padding: '7px 16px 5px', fontSize: '10px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.05em', backgroundColor: '#f5f5f7' }}>
                    연령별 당첨자
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f5f5f7', position: 'sticky', top: 0 }}>
                      <tr>
                        {['기준일', '30대', '40대', '50대', '60대+'].map((h) => (
                          <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7a7a7a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ageItems.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '7px 10px', color: '#7a7a7a', fontSize: '11px' }}>{item.STAT_DE}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{Number(item.AGE_30).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{Number(item.AGE_40).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{Number(item.AGE_50).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{Number(item.AGE_60).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {areaItems.length > 0 && (
                <>
                  <div style={{ padding: '7px 16px 5px', fontSize: '10px', fontWeight: 600, color: '#7a7a7a', letterSpacing: '0.05em', backgroundColor: '#f5f5f7', borderTop: '1px solid #e0e0e0' }}>
                    지역별 당첨자
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f5f5f7' }}>
                      <tr>
                        {['기준일', '지역', '신청', '당첨', '경쟁률'].map((h) => (
                          <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7a7a7a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {areaItems.slice(0, 30).map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '7px 10px', color: '#7a7a7a', fontSize: '11px' }}>{item.STAT_DE}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{item.AREA_NM}</td>
                          <td style={{ padding: '7px 10px', color: '#7a7a7a', fontSize: '12px' }}>{Number(item.APPLY_CNT || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1d1d1f', fontSize: '12px' }}>{Number(item.PRZWNER_CNT || 0).toLocaleString()}</td>
                          <td style={{ padding: '7px 10px', color: '#1d1d1f', fontSize: '12px' }}>{parseFloat(item.CMPET_RT || '0').toFixed(1)}:1</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
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
