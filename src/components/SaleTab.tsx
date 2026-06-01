'use client';

import { useEffect, useState } from 'react';
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

interface SaleItem {
  HOUSE_NM: string;
  SUBSCRPT_AREA_CODE_NM: string;
  HSSPLY_ADRES: string;
  TOT_SUPLY_HSHLDCO: string;
  RCRIT_PBLANC_DE: string;
  SPSPLY_RCEPT_BGNDE: string;
  SPSPLY_RCEPT_ENDDE: string;
  GNRL_RNK1_CRSPAREA_RCPTDE: string;
  GNRL_RNK1_CRSPAREA_ENDDE: string;
  HOUSE_MANAGE_NO: string;
  BSNS_MBY_NM: string;
  CNSTRCT_ENTRPS_NM: string;
}

interface ApiResponse {
  totalCount?: number;
  data?: SaleItem[];
  error?: string;
}

// Gradient blues using primary #0066cc
const CHART_COLORS = ['#0066cc', '#2980d9', '#4d97e0', '#66a8e5', '#80b9ea', '#99caef'];

async function fetchSale(region: string, page: number): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'sale', page: String(page) });
  if (region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

async function fetchSaleChart(region: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'sale-chart' });
  if (region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '18px',
  padding: '24px',
};

export default function SaleTab({ region }: { region: string }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [region]);

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = useQuery({
    queryKey: ['sale', region, page],
    queryFn: () => fetchSale(region, page),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['sale-chart', region],
    queryFn: () => fetchSaleChart(region),
  });

  const items = listData?.data ?? [];
  const total = listData?.totalCount ?? 0;
  const totalPages = Math.ceil(total / 20);

  const regionMap = new Map<string, number>();
  (chartData?.data ?? []).forEach((item) => {
    const r = item.SUBSCRPT_AREA_CODE_NM || '기타';
    regionMap.set(r, (regionMap.get(r) ?? 0) + 1);
  });
  const regionChartData = Array.from(regionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const supplyBuckets: Record<string, number> = {
    '~100': 0,
    '101~300': 0,
    '301~500': 0,
    '501~1000': 0,
    '1001~': 0,
  };
  (chartData?.data ?? []).forEach((item) => {
    const n = Number(item.TOT_SUPLY_HSHLDCO || 0);
    if (n <= 100) supplyBuckets['~100']++;
    else if (n <= 300) supplyBuckets['101~300']++;
    else if (n <= 500) supplyBuckets['301~500']++;
    else if (n <= 1000) supplyBuckets['501~1000']++;
    else supplyBuckets['1001~']++;
  });
  const supplyChartData = Object.entries(supplyBuckets).map(([name, count]) => ({ name, count }));

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '21px',
            fontWeight: 600,
            letterSpacing: '0.231px',
            color: '#1d1d1f',
            margin: 0,
          }}
        >
          분양 공고
        </h2>
        <span style={{ fontSize: '14px', fontWeight: 400, color: '#7a7a7a' }}>
          총 {total.toLocaleString()}건
        </span>
      </div>

      {/* Charts */}
      {!chartLoading && regionChartData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
            marginBottom: '24px',
          }}
          className="lg:grid-cols-2-charts"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={cardStyle}>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  letterSpacing: '-0.374px',
                  color: '#1d1d1f',
                  marginBottom: '16px',
                  margin: '0 0 16px 0',
                }}
              >
                지역별 공고 수
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regionChartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}건`, '공고 수']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {regionChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                공급세대 규모 분포
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={supplyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}건`, '단지 수']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {listLoading ? (
        <Spinner />
      ) : listError || listData?.error ? (
        <ErrorBox message={listData?.error ?? '데이터를 불러오지 못했습니다.'} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ display: 'grid', gap: '16px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={cardStyle}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        letterSpacing: '-0.374px',
                        color: '#1d1d1f',
                        margin: 0,
                      }}
                    >
                      {item.HOUSE_NM}
                    </h3>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: '-0.224px',
                        color: '#7a7a7a',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {item.HSSPLY_ADRES}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#f5f5f7',
                      color: '#0066cc',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      padding: '4px 12px',
                    }}
                  >
                    {item.SUBSCRPT_AREA_CODE_NM}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginTop: '16px',
                  }}
                  className="sm:grid-cols-3-info"
                >
                  <InfoCell
                    label="총 공급세대"
                    value={`${Number(item.TOT_SUPLY_HSHLDCO || 0).toLocaleString()}세대`}
                  />
                  <InfoCell label="모집공고일" value={fmt(item.RCRIT_PBLANC_DE)} />
                  <InfoCell label="시행사" value={item.BSNS_MBY_NM || '-'} />
                  <InfoCell
                    label="특별공급 접수"
                    value={`${fmt(item.SPSPLY_RCEPT_BGNDE)} ~ ${fmt(item.SPSPLY_RCEPT_ENDDE)}`}
                  />
                  <InfoCell label="1순위(해당지역)" value={fmt(item.GNRL_RNK1_CRSPAREA_RCPTDE)} />
                  <InfoCell label="1순위 마감" value={fmt(item.GNRL_RNK1_CRSPAREA_ENDDE)} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 400,
                  border: 'none',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1,
                  transition: 'all 150ms',
                }}
              >
                이전
              </button>
              <span style={{ fontSize: '14px', color: '#7a7a7a' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 400,
                  border: 'none',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.4 : 1,
                  transition: 'all 150ms',
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: '#f5f5f7',
        borderRadius: '11px',
        padding: '12px',
      }}
    >
      <p style={{ fontSize: '12px', color: '#7a7a7a', margin: 0 }}>{label}</p>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '-0.224px',
          color: '#1d1d1f',
          margin: '4px 0 0 0',
        }}
      >
        {value || '-'}
      </p>
    </div>
  );
}

function fmt(d: string) {
  if (!d || d.length < 8) return '-';
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTopColor: '#0066cc',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
        className="animate-spin"
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: '#fff5f5',
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
