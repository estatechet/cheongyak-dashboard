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

const PIE_COLORS = ['#1d4ed8', '#7c3aed', '#db2777', '#d97706', '#059669', '#0891b2'];

async function fetchWinner(): Promise<ApiResponse> {
  return fetch('/api/subscription?type=winner').then((r) => r.json());
}

export default function WinnerTab({ region }: { region: string }) {
  // region prop kept for future use; currently winner API doesn't support region filter
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

  // Age chart - use latest entry
  const latest = ageItems[ageItems.length - 1];
  const ageChartData = latest
    ? [
        { name: '30대', value: Number(latest.AGE_30 || 0) },
        { name: '40대', value: Number(latest.AGE_40 || 0) },
        { name: '50대', value: Number(latest.AGE_50 || 0) },
        { name: '60대+', value: Number(latest.AGE_60 || 0) },
      ].filter((d) => d.value > 0)
    : [];

  // Area winner chart - aggregate by region
  const areaMap = new Map<string, number>();
  areaItems.forEach((i) => {
    const key = i.AREA_NM || '기타';
    areaMap.set(key, (areaMap.get(key) ?? 0) + Number(i.PRZWNER_CNT || 0));
  });
  const areaChart = Array.from(areaMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  // Regional competition rate chart
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
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">연령 통계 기준일</p>
          <p className="text-lg font-bold text-blue-700 mt-1">{latest?.STAT_DE || '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-500">지역 데이터 건수</p>
          <p className="text-lg font-bold text-gray-700 mt-1">{areaItems.length}건</p>
        </div>
      </div>

      {/* Charts row 1: Pie + Area bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">연령대별 당첨자 분포</h3>
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
            <p className="text-gray-400 text-sm py-10 text-center">데이터 없음</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">지역별 당첨자 수</h3>
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
                <Bar dataKey="value" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-10 text-center">데이터 없음</p>
          )}
        </div>
      </div>

      {/* Charts row 2: regional competition rate */}
      {cmpetChart.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">지역별 평균 경쟁률</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cmpetChart} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}:1`, '평균 경쟁률']} />
              <Bar dataKey="rate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">연령별 당첨자 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['기준일', '30대', '40대', '50대', '60대+'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageItems.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{item.STAT_DE}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-700">{Number(item.AGE_30).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-700">{Number(item.AGE_40).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-700">{Number(item.AGE_50).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-700">{Number(item.AGE_60).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Area table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">지역별 당첨자 통계</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['기준일', '지역명', '신청건수', '당첨자수', '경쟁률'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areaItems.slice(0, 20).map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{item.STAT_DE}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{item.AREA_NM}</td>
                    <td className="px-3 py-2.5 text-gray-600">{Number(item.APPLY_CNT || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-semibold text-blue-700">{Number(item.PRZWNER_CNT || 0).toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-bold text-purple-700">{parseFloat(item.CMPET_RT || '0').toFixed(1)}:1</td>
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
