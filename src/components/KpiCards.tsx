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
      color: 'bg-blue-700',
      textColor: 'text-white',
    },
    {
      label: '최고 경쟁률',
      value: isLoading ? '...' : isError ? '-' : `${(data?.maxRate ?? 0).toFixed(1)}:1`,
      sub: '전국 기준',
      color: 'bg-red-500',
      textColor: 'text-white',
    },
    {
      label: '평균 경쟁률',
      value: isLoading ? '...' : isError ? '-' : `${(data?.avgRate ?? 0).toFixed(1)}:1`,
      sub: '전체 평균',
      color: 'bg-indigo-500',
      textColor: 'text-white',
    },
    {
      label: '최다 당첨 연령대',
      value: isLoading ? '...' : isError ? '-' : (data?.topAge ?? '-'),
      sub: '최신 통계 기준',
      color: 'bg-emerald-500',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className={`${card.color} rounded-xl shadow-sm p-5`}>
          <p className={`text-xs font-medium opacity-80 ${card.textColor}`}>{card.label}</p>
          <p className={`text-2xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
          <p className={`text-xs mt-1 opacity-70 ${card.textColor}`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
