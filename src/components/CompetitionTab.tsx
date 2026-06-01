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

const TOP_COLORS = [
  '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5',
  '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  '#065f46', '#059669', '#10b981', '#34d399', '#6ee7b7',
];

async function fetchCompetition(region: string): Promise<ApiResponse> {
  const params = new URLSearchParams({ type: 'competition' });
  if (region !== '전국') params.set('region', region);
  return fetch(`/api/subscription?${params}`).then((r) => r.json());
}

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

  // Top 15 chart
  const top15 = [...validItems]
    .sort((a, b) => parseFloat(b.CMPET_RATE) - parseFloat(a.CMPET_RATE))
    .slice(0, 15)
    .map((i) => ({
      name: i.HOUSE_TY
        ? `${i.HOUSE_MANAGE_NO?.slice(-4) ?? ''} ${i.HOUSE_TY}`
        : (i.HOUSE_MANAGE_NO?.slice(-6) ?? '-'),
      rate: parseFloat(i.CMPET_RATE),
    }));

  // Regional average
  const regionMap = new Map<string, { total: number; count: number }>();
  validItems.forEach((i) => {
    const key = i.RESIDE_SENM || '기타';
    const existing = regionMap.get(key) ?? { total: 0, count: 0 };
    regionMap.set(key, { total: existing.total + parseFloat(i.CMPET_RATE), count: existing.count + 1 });
  });
  const regionChart = Array.from(regionMap.entries())
    .map(([name, { total, count }]) => ({ name, rate: parseFloat((total / count).toFixed(1)) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 12);

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="최고 경쟁률" value={`${maxRate.toFixed(1)}:1`} color="text-red-600" />
        <StatCard label="평균 경쟁률" value={`${avgRate.toFixed(1)}:1`} color="text-blue-700" />
        <StatCard label="총 조회건수" value={`${total.toLocaleString()}건`} color="text-gray-700" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {top15.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">경쟁률 상위 15개</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top15} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}:1`, '경쟁률']} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {top15.map((_, i) => (
                    <Cell key={i} fill={TOP_COLORS[i % TOP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {regionChart.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">지역별 평균 경쟁률</h3>
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
                <Bar dataKey="rate" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">전체 경쟁률 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['공고번호', '주택형', '지역구분', '신청건수', '경쟁률'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.PBLANC_NO}</td>
                  <td className="px-4 py-3 text-gray-700">{item.HOUSE_TY || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.RESIDE_SENM || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {Number(item.REQ_CNT || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    <span
                      className={
                        parseFloat(item.CMPET_RATE) > 10 ? 'text-red-600' : 'text-blue-700'
                      }
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

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
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
