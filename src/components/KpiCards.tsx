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

export default function KpiCards({ region }: { region: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kpi', region],
    queryFn: () => fetchKpi(region),
  });

  const cards = [
    {
      label: '이번달 공고 건수',
      value: isLoading ? '...' : isError ? '-' : `${(data?.saleCount ?? 0).toLocaleString()}건`,
      sub: '분양 공고 총계',
      valueColor: '#0066cc',
    },
    {
      label: '최고 경쟁률',
      value: isLoading ? '...' : isError ? '-' : `${(data?.maxRate ?? 0).toFixed(1)}:1`,
      sub: '전국 기준',
      valueColor: '#1d1d1f',
    },
    {
      label: '평균 경쟁률',
      value: isLoading ? '...' : isError ? '-' : `${(data?.avgRate ?? 0).toFixed(1)}:1`,
      sub: '전체 평균',
      valueColor: '#1d1d1f',
    },
    {
      label: '최다 당첨 연령대',
      value: isLoading ? '...' : isError ? '-' : (data?.topAge ?? '-'),
      sub: '최신 통계 기준',
      valueColor: '#0066cc',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '32px',
      }}
      className="lg:grid-cols-4-kpi"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '18px',
            padding: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.224px',
              color: '#7a7a7a',
              margin: 0,
            }}
          >
            {card.label}
          </p>
          <p
            style={{
              fontSize: '34px',
              fontWeight: 600,
              letterSpacing: '-0.374px',
              color: card.valueColor,
              marginTop: '8px',
              marginBottom: 0,
            }}
          >
            {card.value}
          </p>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '-0.12px',
              color: '#7a7a7a',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
