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
  AreaChart,
  Area,
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

async function fetchSale(region: string, houseSecd: string, page: number): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'sale', page: String(page) });
  if (region !== '전국') params.set('region', region);
  if (houseSecd) params.set('houseSecd', houseSecd);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

async function fetchSaleChart(region: string, houseSecd: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'sale-chart' });
  if (region !== '전국') params.set('region', region);
  if (houseSecd) params.set('houseSecd', houseSecd);
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

export default function SaleTab({ region, houseSecd }: { region: string; houseSecd: string }) {
  const [page, setPage] = useState(1);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
    setExpandedIdx(null);
  }, [region, houseSecd]);

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = useQuery({
    queryKey: ['sale', region, houseSecd, page],
    queryFn: () => fetchSale(region, houseSecd, page),
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['sale-chart', region, houseSecd],
    queryFn: () => fetchSaleChart(region, houseSecd),
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
    .slice(0, 10);

  const supplyBuckets: Record<string, number> = {
    '~100': 0, '~300': 0, '~500': 0, '~1000': 0, '1001+': 0,
  };
  (chartData?.data ?? []).forEach((item) => {
    const n = Number(item.TOT_SUPLY_HSHLDCO || 0);
    if (n <= 100) supplyBuckets['~100']++;
    else if (n <= 300) supplyBuckets['~300']++;
    else if (n <= 500) supplyBuckets['~500']++;
    else if (n <= 1000) supplyBuckets['~1000']++;
    else supplyBuckets['1001+']++;
  });
  const supplyChartData = Object.entries(supplyBuckets).map(([name, count]) => ({ name, count }));

  const monthMap = new Map<string, number>();
  (chartData?.data ?? []).forEach((item) => {
    const d = item.RCRIT_PBLANC_DE;
    if (d && d.length >= 6) {
      const m = `${d.slice(0, 4)}.${d.slice(4, 6)}`;
      monthMap.set(m, (monthMap.get(m) ?? 0) + 1);
    }
  });
  const monthChartData = Array.from(monthMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const builderMap = new Map<string, number>();
  (chartData?.data ?? []).forEach((item) => {
    const raw = item.CNSTRCT_ENTRPS_NM ?? '';
    const b = raw.split(/[,/]/)[0].trim() || '기타';
    builderMap.set(b, (builderMap.get(b) ?? 0) + 1);
  });
  const builderList = Array.from(builderMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count], i) => ({ rank: i + 1, name, count }));

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', height: '100%' }}>
      {/* Left: 2×2 grid fills all height equally */}
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
        {/* Panel 1: Region chart */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>지역별 공고 수</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {chartLoading ? (
              <Spinner />
            ) : regionChartData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData} margin={{ top: 4, right: 4, left: -22, bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#7a7a7a' }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
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
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {chartLoading ? (
              <Spinner />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyChartData} margin={{ top: 4, right: 4, left: -22, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#7a7a7a' }} interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
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

        {/* Panel 3: Monthly trend */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>월별 공고 추이</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px' }}>
            {chartLoading ? (
              <Spinner />
            ) : monthChartData.length === 0 ? (
              <EmptyState />
            ) : monthChartData.length === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#b0b0b0' }}>{monthChartData[0].name}</span>
                <span style={{ fontSize: '44px', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-2px', lineHeight: 1 }}>
                  {monthChartData[0].count}
                </span>
                <span style={{ fontSize: '13px', color: '#7a7a7a' }}>건 공고</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthChartData} margin={{ top: 4, right: 8, left: -22, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#7a7a7a' }} interval={0} />
                  <YAxis tick={{ fontSize: 9, fill: '#7a7a7a' }} />
                  <Tooltip
                    formatter={(v) => [`${v}건`, '공고 수']}
                    contentStyle={{ fontSize: '11px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#555555" strokeWidth={2} fill="#555555" fillOpacity={0.12} dot={{ r: 4, fill: '#555555', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Panel 4: Builder ranking */}
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h3 style={panelTitleStyle}>시공사 공급 현황</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {chartLoading ? (
              <div style={{ padding: '16px' }}><Spinner /></div>
            ) : builderList.length === 0 ? (
              <EmptyState />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {builderList.map((item) => (
                    <tr key={item.rank} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px', width: '24px', color: '#b0b0b0', fontSize: '11px', fontWeight: 600 }}>
                        {item.rank}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1d1d1f' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#7a7a7a', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {item.count}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right: 공고 목록 — same height as left grid */}
      <div style={{ ...panelStyle, width: '320px', flexShrink: 0 }}>
        <div style={{ ...panelHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={panelTitleStyle}>공고 목록</h3>
          <span style={{ fontSize: '11px', color: '#7a7a7a' }}>총 {total.toLocaleString()}건</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px' }}>
          {listLoading ? (
            <div style={{ padding: '24px 0' }}><Spinner /></div>
          ) : listError || listData?.error ? (
            <ErrorState message={listData?.error ?? '데이터를 불러오지 못했습니다.'} />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {items.map((item, idx) => {
                const isExpanded = expandedIdx === idx;
                return (
                  <div key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div
                      onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      style={{ paddingTop: '10px', paddingBottom: '10px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{
                          fontSize: '13px', fontWeight: 600, color: '#1d1d1f',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        }}>
                          {item.HOUSE_NM}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: '#7a7a7a' }}>{item.SUBSCRPT_AREA_CODE_NM}</span>
                          <span style={{ fontSize: '9px', color: '#b0b0b0' }}>{isExpanded ? '▾' : '▸'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#7a7a7a' }}>{Number(item.TOT_SUPLY_HSHLDCO || 0).toLocaleString()}세대</span>
                        <span style={{ fontSize: '11px', color: '#7a7a7a' }}>공고 {fmt(item.RCRIT_PBLANC_DE)}</span>
                        <span style={{ fontSize: '11px', color: '#7a7a7a' }}>1순위 {fmt(item.GNRL_RNK1_CRSPAREA_RCPTDE)}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{
                        backgroundColor: '#f5f5f7', borderRadius: '10px',
                        padding: '10px 12px', marginBottom: '10px',
                        display: 'flex', flexDirection: 'column', gap: '5px',
                      }}>
                        {item.HSSPLY_ADRES && <DetailRow label="주소" value={item.HSSPLY_ADRES} />}
                        {item.BSNS_MBY_NM && <DetailRow label="사업주체" value={item.BSNS_MBY_NM} />}
                        {item.CNSTRCT_ENTRPS_NM && <DetailRow label="시공사" value={item.CNSTRCT_ENTRPS_NM} />}
                        {item.SPSPLY_RCEPT_BGNDE && (
                          <DetailRow label="특별공급" value={`${fmt(item.SPSPLY_RCEPT_BGNDE)} ~ ${fmt(item.SPSPLY_RCEPT_ENDDE)}`} />
                        )}
                        <DetailRow label="1순위" value={`${fmt(item.GNRL_RNK1_CRSPAREA_RCPTDE)} ~ ${fmt(item.GNRL_RNK1_CRSPAREA_ENDDE)}`} />
                      </div>
                    )}
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); setExpandedIdx(null); }}
                    disabled={page === 1}
                    style={{ backgroundColor: page === 1 ? '#f0f0f0' : '#1d1d1f', color: page === 1 ? '#b0b0b0' : '#fff', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                  >이전</button>
                  <span style={{ fontSize: '11px', color: '#7a7a7a' }}>{page} / {totalPages}</span>
                  <button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setExpandedIdx(null); }}
                    disabled={page === totalPages}
                    style={{ backgroundColor: page === totalPages ? '#f0f0f0' : '#1d1d1f', color: page === totalPages ? '#b0b0b0' : '#fff', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                  >다음</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span style={{ fontSize: '11px', color: '#7a7a7a', flexShrink: 0, minWidth: '48px' }}>{label}</span>
      <span style={{ fontSize: '11px', color: '#1d1d1f', lineHeight: '1.5', wordBreak: 'keep-all' }}>{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="spinner" />
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
