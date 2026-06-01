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
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>
      {/* Global Nav */}
      <header
        style={{
          backgroundColor: '#000000',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '22px',
          paddingRight: '22px',
        }}
      >
        <div
          style={{
            maxWidth: '980px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '-0.12px',
            }}
          >
            청약
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px' }}>
        {/* KPI Cards */}
        <KpiCards region={region} />

        {/* Region Filter */}
        <div style={{ marginBottom: '16px' }}>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#1d1d1f',
              letterSpacing: '-0.224px',
              marginBottom: '10px',
            }}
          >
            지역
          </p>
          <div
            className="scrollbar-hide"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: region === r ? 600 : 400,
                  color: region === r ? '#ffffff' : '#333333',
                  backgroundColor: region === r ? '#0066cc' : '#ffffff',
                  border: region === r ? '2px solid #0066cc' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Segment Control */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '18px',
            padding: '4px',
            display: 'inline-flex',
            marginBottom: '24px',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: activeTab === tab.id ? '11px' : '11px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#ffffff' : '#7a7a7a',
                backgroundColor: activeTab === tab.id ? '#0066cc' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'sale' && <SaleTab region={region} />}
        {activeTab === 'competition' && <CompetitionTab region={region} />}
        {activeTab === 'winner' && <WinnerTab region={region} />}
      </main>
    </div>
  );
}
