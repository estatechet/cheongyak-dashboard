# 청약 대시보드

공공데이터포털 청약홈 API 기반 실시간 APT 청약 현황 대시보드

## Features

- **KPI Cards** — 이번달 공고 건수, 최고 경쟁률, 평균 경쟁률, 최다 당첨 연령대
- **분양공고 탭** — 지역별 공고 수 차트, 공급세대 규모 분포, 공고 목록(페이지네이션)
- **경쟁률 현황 탭** — 상위 15개 경쟁률 차트, 지역별 평균 경쟁률, 전체 테이블
- **당첨자 분석 탭** — 연령대별 도넛 차트, 지역별 당첨자 수, 지역별 경쟁률, 상세 테이블
- **지역 필터** — 전국 / 서울 / 경기 외 15개 지역 버튼 필터

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Recharts
- TanStack React Query v5

## Getting Started

```bash
npm install
```

Create `.env.local`:

```
PUBLIC_DATA_API_KEY=your_api_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Key

공공데이터포털 (data.go.kr) 에서 청약홈 API 서비스 키를 발급받아 사용합니다.
