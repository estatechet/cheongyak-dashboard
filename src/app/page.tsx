'use client';

import { useState, useEffect, useRef } from 'react';
import KpiSlimBar from '@/components/KpiCards';
import SaleTab from '@/components/SaleTab';
import CompetitionTab from '@/components/CompetitionTab';
import WinnerTab from '@/components/WinnerTab';

const TABS = [
  { id: 'sale', label: '분양공고' },
  { id: 'competition', label: '경쟁률' },
  { id: 'winner', label: '당첨자' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const REGIONS = [
  '전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('sale');
  const [region, setRegion] = useState('전국');
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!regionOpen) return;
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [regionOpen]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f7',
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          height: '58px',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          gap: '24px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Left: title */}
        <span
          style={{
            color: '#ffffff',
            fontSize: '15px',
            letterSpacing: '-0.3px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          청약 대시보드
        </span>

        {/* Center: segment control */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              backgroundColor: '#333333',
              borderRadius: '10px',
              padding: '3px',
              display: 'flex',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 22px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
                  color: activeTab === tab.id ? '#1d1d1f' : '#b0b0b0',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: region accordion button */}
        <div ref={regionRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setRegionOpen((v) => !v)}
            style={{
              backgroundColor: '#333333',
              color: '#ffffff',
              fontSize: '13px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {region}
            <span style={{ fontSize: '10px' }}>{regionOpen ? '▾' : '▸'}</span>
          </button>

          {/* Dropdown panel */}
          {regionOpen && (
            <div
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                zIndex: 50,
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '11px',
                padding: '12px',
                width: '280px',
                outline: '1px solid #e0e0e0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setRegionOpen(false);
                    }}
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      borderRadius: '9999px',
                      border: region === r ? '1px solid #1d1d1f' : '1px solid #e0e0e0',
                      backgroundColor: region === r ? '#1d1d1f' : '#ffffff',
                      color: region === r ? '#ffffff' : '#333333',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* KPI SLIM BAR */}
      <KpiSlimBar region={region} />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '12px',
        }}
      >
        <div style={{ height: '100%', overflowY: 'auto' }}>
          {activeTab === 'sale' && <SaleTab region={region} />}
          {activeTab === 'competition' && <CompetitionTab region={region} />}
          {activeTab === 'winner' && <WinnerTab region={region} />}
        </div>
      </main>
    </div>
  );
}
