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

const HOUSE_SECDS = [
  { code: '', label: '전체' },
  { code: '01', label: '아파트' },
  { code: '03', label: '오피스텔' },
  { code: '04', label: '도시형생활주택' },
  { code: '06', label: '민간임대' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('sale');
  const [region, setRegion] = useState('전국');
  const [houseSecd, setHouseSecd] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [houseSecdOpen, setHouseSecdOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const houseSecdRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!houseSecdOpen) return;
    function handleClick(e: MouseEvent) {
      if (houseSecdRef.current && !houseSecdRef.current.contains(e.target as Node)) {
        setHouseSecdOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [houseSecdOpen]);

  const houseSecdLabel = HOUSE_SECDS.find((h) => h.code === houseSecd)?.label ?? '전체';

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

        {/* Right: filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* 주택구분 */}
          <div ref={houseSecdRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setHouseSecdOpen((v) => !v)}
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
              {houseSecdLabel}
              <span style={{ fontSize: '10px' }}>{houseSecdOpen ? '▾' : '▸'}</span>
            </button>

            {houseSecdOpen && (
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
                  width: '260px',
                  outline: '1px solid #e0e0e0',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {HOUSE_SECDS.map((h) => (
                    <button
                      key={h.code}
                      onClick={() => {
                        setHouseSecd(h.code);
                        setHouseSecdOpen(false);
                      }}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        borderRadius: '9999px',
                        border: houseSecd === h.code ? '1px solid #1d1d1f' : '1px solid #e0e0e0',
                        backgroundColor: houseSecd === h.code ? '#1d1d1f' : '#ffffff',
                        color: houseSecd === h.code ? '#ffffff' : '#333333',
                        cursor: 'pointer',
                      }}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
                {activeTab === 'winner' && houseSecd && (
                  <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#b0b0b0', lineHeight: 1.4 }}>
                    당첨자 통계 API는 주택 유형 필터를 지원하지 않아 무시됩니다.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 지역 */}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
        </div>
      </header>

      {/* KPI SLIM BAR */}
      <KpiSlimBar region={region} houseSecd={houseSecd} />

      {/* MAIN CONTENT */}
      <main
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '12px',
        }}
      >
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {activeTab === 'sale' && <SaleTab region={region} houseSecd={houseSecd} />}
          {activeTab === 'competition' && <CompetitionTab region={region} houseSecd={houseSecd} />}
          {activeTab === 'winner' && <WinnerTab region={region} />}
        </div>
      </main>
    </div>
  );
}
