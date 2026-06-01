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

const MONO_SHADES = ['#1d1d1f', '#333333', '#555555', '#7a7a7a', '#999999', '#b0b0b0', '#c8c8c8', '#e0e0e0'];

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

function fmt(d: string) {
  if (!d || d.length < 8) return '-';
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.5fr',
        gap: '12px',
        alignItems: 'start',
      }}
    >
      {/* Panel 1: Region chart */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>지역별 공고 수</h3>
        </div>
        <div style={{ flex: 1, padding: '16px', minHeight: 0 }}>
          {chartLoading ? (
            <LoadingState />
          ) : regionChartData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={regionChartData} margin={{ top: 4, right: 8, left: -16, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#7a7a7a' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                <Tooltip
                  formatter={(v) => [`${v}건`, '공고 수']}
                  contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {regionChartData.map((_, i) => (
                    <Cell key={i} fill={MONO_SHADES[i % MONO_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Panel 2: Supply size distribution */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <h3 style={panelTitleStyle}>공급세대 규모 분포</h3>
        </div>
        <div style={{ flex: 1, padding: '16px', minHeight: 0 }}>
          {chartLoading ? (
            <LoadingState />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={supplyChartData} margin={{ top: 4, right: 8, left: -16, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7a7a7a' }} />
                <Tooltip
                  formatter={(v) => [`${v}건`, '단지 수']}
                  contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#1d1d1f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Panel 3: List */}
      <div style={panelStyle}>
        <div style={{ ...panelHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={panelTitleStyle}>공고 목록</h3>
          <span style={{ fontSize: '11px', color: '#7a7a7a' }}>총 {total.toLocaleString()}건</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', minHeight: 0 }}>
          {listLoading ? (
            <LoadingState />
          ) : listError || listData?.error ? (
            <ErrorState message={listData?.error ?? '데이터를 불러오지 못했습니다.'} />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderBottom: idx < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: '12px',
                        flex: 1,
                      }}
                    >
                      {item.HOUSE_NM}
                    </span>
                    <span style={{ fontSize: '11px', color: '#7a7a7a', flexShrink: 0 }}>
                      {item.SUBSCRPT_AREA_CODE_NM}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                      {Number(item.TOT_SUPLY_HSHLDCO || 0).toLocaleString()}세대
                    </span>
                    <span style={{ fontSize: '11px', color: '#7a7a7a' }}>공고 {fmt(item.RCRIT_PBLANC_DE)}</span>
                    <span style={{ fontSize: '11px', color: '#7a7a7a' }}>1순위 {fmt(item.GNRL_RNK1_CRSPAREA_RCPTDE)}</span>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 0',
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      backgroundColor: page === 1 ? '#f0f0f0' : '#1d1d1f',
                      color: page === 1 ? '#b0b0b0' : '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    이전
                  </button>
                  <span style={{ fontSize: '11px', color: '#7a7a7a' }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      backgroundColor: page === totalPages ? '#f0f0f0' : '#1d1d1f',
                      color: page === totalPages ? '#b0b0b0' : '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      border: 'none',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
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
