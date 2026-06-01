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

const CHART_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

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

export default function SaleTab({ region }: { region: string }) {
  const [page, setPage] = useState(1);

  // Reset page when region changes
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

  // Build region count chart
  const regionMap = new Map<string, number>();
  (chartData?.data ?? []).forEach((item) => {
    const r = item.SUBSCRPT_AREA_CODE_NM || '기타';
    regionMap.set(r, (regionMap.get(r) ?? 0) + 1);
  });
  const regionChartData = Array.from(regionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Build supply distribution buckets
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">APT 분양공고</h2>
        <span className="text-sm text-gray-500">총 {total.toLocaleString()}건</span>
      </div>

      {/* Charts */}
      {!chartLoading && regionChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">지역별 공고 수</h3>
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

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">공급세대 규모 분포</h3>
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
          <div className="grid gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.HOUSE_NM}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.HSSPLY_ADRES}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {item.SUBSCRPT_AREA_CODE_NM}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
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
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '-'}</p>
    </div>
  );
}

function fmt(d: string) {
  if (!d || d.length < 8) return '-';
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-transparent" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
      <p className="font-semibold">오류</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl p-10 text-center text-gray-400">데이터가 없습니다.</div>
  );
}
