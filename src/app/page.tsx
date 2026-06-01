'use client';

import { useState } from 'react';
import KpiCards from '@/components/KpiCards';
import SaleTab from '@/components/SaleTab';
import CompetitionTab from '@/components/CompetitionTab';
import WinnerTab from '@/components/WinnerTab';

const TABS = [
  { id: 'sale', label: '분양공고' },
  { id: 'competition', label: '경쟁률 현황' },
  { id: 'winner', label: '당첨자 분석' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const REGIONS = [
  '전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('sale');
  const [region, setRegion] = useState('전국');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">청약 대시보드</h1>
          <p className="text-blue-200 text-sm mt-1">공공데이터포털 청약홈 API 기반 실시간 현황</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* KPI Cards */}
        <KpiCards region={region} />

        {/* Region Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">지역 필터:</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                region === r
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'sale' && <SaleTab region={region} />}
        {activeTab === 'competition' && <CompetitionTab region={region} />}
        {activeTab === 'winner' && <WinnerTab region={region} />}
      </main>
    </div>
  );
}
