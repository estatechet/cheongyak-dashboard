'use client';

import { useQuery } from '@tanstack/react-query';

interface KpiData {
  saleCount: number;
  maxRate: number;
  avgRate: number;
  topAge: string;
  error?: string;
}

function fetchKpi(region: string): Promise<KpiData> {
  const params = new URLSearchParams({ type: 'kpi' });
  if (region && region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

export default function KpiSlimBar({ region }: { region: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kpi', region],
    queryFn: () => fetchKpi(region),
  });

  const dash = '—';
  const saleCount = isLoading ? dash : isError ? dash : `${(data?.saleCount ?? 0).toLocaleString()}건`;
  const maxRate = isLoading ? dash : isError ? dash : `${(data?.maxRate ?? 0).toFixed(1)}:1`;
  const avgRate = isLoading ? dash : isError ? dash : `${(data?.avgRate ?? 0).toFixed(1)}:1`;
  const topAge = isLoading ? dash : isError ? dash : (data?.topAge ?? dash);

  const loading = isLoading;

  return (
    <div
      style={{
        height: '52px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        gap: 0,
        flexShrink: 0,
      }}
    >
      <KpiItem label="이번달 공고" value={saleCount} loading={loading} />
      <Divider />
      <KpiItem label="최고경쟁률" value={maxRate} loading={loading} />
      <Divider />
      <KpiItem label="평균경쟁률" value={avgRate} loading={loading} />
      <Divider />
      <KpiItem label="최다당첨" value={topAge} loading={loading} />
    </div>
  );
}

function KpiItem({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
      <span style={{ fontSize: '12px', color: '#7a7a7a' }}>{label}</span>
      <span
        style={{
          fontSize: '17px',
          fontWeight: 700,
          color: loading ? '#b0b0b0' : '#1d1d1f',
          marginLeft: '8px',
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span
      style={{
        color: '#e0e0e0',
        marginLeft: '28px',
        marginRight: '28px',
        fontSize: '13px',
        userSelect: 'none',
      }}
    >
      |
    </span>
  );
}
