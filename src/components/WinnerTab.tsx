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

// Apple-aligned palette: primary, on-dark, indigo, muted
const PIE_COLORS = ['#0066cc', '#2997ff', '#6366f1', '#7a7a7a'];

async function fetchWinner(): Promise<ApiResponse> {
  return fetch('/api/subscription?type=winner').then((r) => r.json());
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '18px',
  padding: '24px',
};

export default function WinnerTab({ region }: { region: string }) {
  void region;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['winner'],
    queryFn: fetchWinner,
  });

  if (isLoading) return <Spinner />;
  if (isError || data?.error) return <ErrorBox message={data?.error ?? '데이터를 불러오지 못했습니다.'} />;

  const ageItems = data?.ageData?.data ?? [];
  const areaItems = data?.areaData?.data ?? [];
  const cmpetAreaItems = data?.cmpetAreaData?.data ?? [];

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
    .slice(0, 12);

  const cmpetMap = new Map<string, { total: number; count: number }>();
  cmpetAreaItems.forEach((i) => {
    const key = i.AREA_NM || '기타';
    const r = parseFloat(i.CMPET_RT || '0');
    if (r > 0) {
      const ex = cmpetMap.get(key) ?? { total: 0, count: 0 };
      cmpetMap.set(key, { total: ex.total + r, count: ex.count + 1 });
    }
  });
  const cmpetChart = Array.from(cmpetMap.entries())
    .map(([name, { total, count }]) => ({ name, rate: parseFloat((total / count).toFixed(1)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 12);

  return (
    <div>
      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.224px', color: '#7a7a7a', margin: 0 }}>
            연령 통계 기준일
          </p>
          <p style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.374px', color: '#0066cc', margin: '8px 0 0 0' }}>
            {latest?.STAT_DE || '-'}
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.224px', color: '#7a7a7a', margin: 0 }}>
            지역 데이터 건수
          </p>
          <p style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.374px', color: '#7a7a7a', margin: '8px 0 0 0' }}>
            {areaItems.length}건
          </p>
        </div>
      </div>

      {/* Charts row 1: Pie + Area bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={cardStyle}>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.374px',
              color: '#1d1d1f',
              margin: '0 0 16px 0',
            }}
          >
            연령대별 당첨자 분포
          </h3>
          {ageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={ageChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {ageChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [Number(v).toLocaleString() + '명', '당첨자']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#7a7a7a', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>데이터 없음</p>
          )}
        </div>

        <div style={cardStyle}>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.374px',
              color: '#1d1d1f',
              margin: '0 0 16px 0',
            }}
          >
            지역별 당첨자 수
          </h3>
          {areaChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={areaChart}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString() + '명', '당첨자']} />
                <Bar dataKey="value" fill="#0066cc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#7a7a7a', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>데이터 없음</p>
          )}
        </div>
      </div>

      {/* Charts row 2: regional competition rate */}
      {cmpetChart.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.374px',
              color: '#1d1d1f',
              margin: '0 0 16px 0',
            }}
          >
            지역별 평균 경쟁률
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cmpetChart} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}:1`, '평균 경쟁률']} />
              <Bar dataKey="rate" fill="#0066cc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Age table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.374px',
                color: '#1d1d1f',
                margin: 0,
              }}
            >
              연령별 당첨자 통계
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f5f5f7' }}>
                <tr>
                  {['기준일', '30대', '40대', '50대', '60대+'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.224px',
                        color: '#1d1d1f',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageItems.map((item, idx) => (
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
                    <td style={{ padding: '10px 12px', color: '#7a7a7a', fontSize: '12px' }}>{item.STAT_DE}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0066cc' }}>{Number(item.AGE_30).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0066cc' }}>{Number(item.AGE_40).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0066cc' }}>{Number(item.AGE_50).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0066cc' }}>{Number(item.AGE_60).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Area table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.374px',
                color: '#1d1d1f',
                margin: 0,
              }}
            >
              지역별 당첨자 통계
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f5f5f7' }}>
                <tr>
                  {['기준일', '지역명', '신청건수', '당첨자수', '경쟁률'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.224px',
                        color: '#1d1d1f',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areaItems.slice(0, 20).map((item, idx) => (
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
                    <td style={{ padding: '10px 12px', color: '#7a7a7a', fontSize: '12px' }}>{item.STAT_DE}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1d1d1f' }}>{item.AREA_NM}</td>
                    <td style={{ padding: '10px 12px', color: '#7a7a7a' }}>{Number(item.APPLY_CNT || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0066cc' }}>{Number(item.PRZWNER_CNT || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#6366f1' }}>{parseFloat(item.CMPET_RT || '0').toFixed(1)}:1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div
        className="animate-spin"
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTopColor: '#0066cc',
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '18px',
        padding: '24px',
        color: '#1d1d1f',
      }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>오류</p>
      <p style={{ fontSize: '14px', marginTop: '4px', color: '#7a7a7a' }}>{message}</p>
    </div>
  );
}
