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

// Progressive opacity from primary for top bar chart
function topBarColor(i: number): string {
  const opacity = Math.max(0.3, 1 - i * 0.055);
  return `rgba(0, 102, 204, ${opacity})`;
}

async function fetchCompetition(region: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'competition' });
  if (region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '18px',
  padding: '24px',
};

export default function CompetitionTab({ region }: { region: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['competition', region],
    queryFn: () => fetchCompetition(region),
  });

  if (isLoading) return <Spinner />;
  if (isError || data?.error) return <ErrorBox message={data?.error ?? '데이터를 불러오지 못했습니다.'} />;

  const items = data?.data ?? [];
  const total = data?.totalCount ?? 0;

  if (items.length === 0) return <EmptyState />;

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
    <div>
      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.224px', color: '#7a7a7a', margin: 0 }}>
            최고 경쟁률
          </p>
          <p style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.374px', color: '#1d1d1f', margin: '8px 0 0 0' }}>
            {maxRate.toFixed(1)}:1
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.224px', color: '#7a7a7a', margin: 0 }}>
            평균 경쟁률
          </p>
          <p style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.374px', color: '#0066cc', margin: '8px 0 0 0' }}>
            {avgRate.toFixed(1)}:1
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.224px', color: '#7a7a7a', margin: 0 }}>
            총 조회건수
          </p>
          <p style={{ fontSize: '34px', fontWeight: 600, letterSpacing: '-0.374px', color: '#7a7a7a', margin: '8px 0 0 0' }}>
            {total.toLocaleString()}건
          </p>
        </div>
      </div>

      {/* Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {top15.length > 0 && (
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
              경쟁률 상위 15개
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top15} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}:1`, '경쟁률']} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {top15.map((_, i) => (
                    <Cell key={i} fill={topBarColor(i)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {regionChart.length > 0 && (
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
              지역별 평균 경쟁률
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={regionChart}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={55} />
                <Tooltip formatter={(v) => [`${v}:1`, '평균 경쟁률']} />
                <Bar dataKey="rate" fill="#0066cc" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Full Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h3
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.374px',
              color: '#1d1d1f',
              margin: 0,
            }}
          >
            전체 경쟁률 현황
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ backgroundColor: '#f5f5f7' }}>
              <tr>
                {['공고번호', '주택형', '지역구분', '신청건수', '경쟁률'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px 16px',
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
                  <td style={{ padding: '12px 16px', color: '#7a7a7a', fontFamily: 'monospace', fontSize: '12px' }}>
                    {item.PBLANC_NO}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#1d1d1f' }}>{item.HOUSE_TY || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7a7a' }}>{item.RESIDE_SENM || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#7a7a7a' }}>
                    {Number(item.REQ_CNT || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontWeight: parseFloat(item.CMPET_RATE) > 10 ? 700 : 400,
                        color: parseFloat(item.CMPET_RATE) > 10 ? '#1d1d1f' : '#0066cc',
                      }}
                    >
                      {parseFloat(item.CMPET_RATE).toFixed(1)}:1
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function EmptyState() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '18px',
        padding: '40px',
        textAlign: 'center',
        color: '#7a7a7a',
        fontSize: '14px',
      }}
    >
      데이터가 없습니다.
    </div>
  );
}
