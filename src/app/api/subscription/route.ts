import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PUBLIC_DATA_API_KEY;

const SALE_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail';
const COMPETITION_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet';
const WINNER_AGE_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTPrzwnerAgeStat';
const WINNER_AREA_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTPrzwnerAreaStat';

async function fetchOdcloud(url: string, page = 1, perPage = 10, cond?: Record<string, string>) {
  const params = new URLSearchParams({
    serviceKey: API_KEY!,
    page: String(page),
    perPage: String(perPage),
  });
  if (cond) {
    Object.entries(cond).forEach(([k, v]) => params.append(`cond[${k}::EQ]`, v));
  }

  const response = await fetch(`${url}?${params.toString()}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) throw new Error(`외부 API 오류: ${response.status}`);
  return response.json();
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'sale';
  const region = searchParams.get('region') || '';
  const houseSecd = searchParams.get('houseSecd') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
      { status: 500 }
    );
  }

  try {
    // SALE_URL · KPI cond (HOUSE_SECD 지원)
    const saleCond: Record<string, string> = {};
    if (region && region !== '전국') saleCond['SUBSCRPT_AREA_CODE_NM'] = region;
    if (houseSecd) saleCond['HOUSE_SECD'] = houseSecd;
    const hasSaleCond = Object.keys(saleCond).length > 0;

    // COMPETITION_URL cond (HOUSE_SECD 미지원 → region만)
    const compCond: Record<string, string> = {};
    if (region && region !== '전국') compCond['SUBSCRPT_AREA_CODE_NM'] = region;
    const hasCompCond = Object.keys(compCond).length > 0;

    // 경쟁률 데이터에 houseSecd 필터를 적용해야 하면, 분양공고 API로 매칭 HOUSE_MANAGE_NO를
    // 미리 받아 둠. 외부 API는 perPage 100 한도이므로 정확하지 않을 수 있다.
    async function matchingHouseNos(): Promise<Set<string> | null> {
      if (!houseSecd) return null;
      const saleRaw = await fetchOdcloud(SALE_URL, 1, 100, saleCond);
      const items: Array<{ HOUSE_MANAGE_NO?: string }> = saleRaw?.data ?? [];
      return new Set(items.map((i) => i.HOUSE_MANAGE_NO ?? '').filter(Boolean));
    }

    let data;
    switch (type) {
      case 'kpi': {
        const [saleRes, compRes, ageRes] = await Promise.allSettled([
          fetchOdcloud(SALE_URL, 1, 1, hasSaleCond ? saleCond : undefined),
          fetchOdcloud(COMPETITION_URL, 1, 100, hasCompCond ? compCond : undefined),
          fetchOdcloud(WINNER_AGE_URL, 1, 5),
        ]);
        const saleData = settled(saleRes, null);
        const compData = settled(compRes, null);
        const ageData = settled(ageRes, null);

        let compItems: Array<{ CMPET_RATE: string; HOUSE_MANAGE_NO?: string }> = compData?.data ?? [];
        if (houseSecd) {
          const matchSet = await matchingHouseNos();
          if (matchSet) compItems = compItems.filter((i) => i.HOUSE_MANAGE_NO && matchSet.has(i.HOUSE_MANAGE_NO));
        }
        const validRates = compItems
          .map((i) => parseFloat(i.CMPET_RATE))
          .filter((r) => r > 0);
        const maxRate = validRates.length > 0 ? Math.max(...validRates) : 0;
        const avgRate =
          validRates.length > 0
            ? validRates.reduce((s, r) => s + r, 0) / validRates.length
            : 0;

        // Find top age group from latest record
        const ageItems: Array<{ AGE_30: string; AGE_40: string; AGE_50: string; AGE_60: string }> =
          ageData?.data ?? [];
        const latest = ageItems[ageItems.length - 1];
        let topAge = '-';
        if (latest) {
          const ages = [
            { label: '30대', value: Number(latest.AGE_30 || 0) },
            { label: '40대', value: Number(latest.AGE_40 || 0) },
            { label: '50대', value: Number(latest.AGE_50 || 0) },
            { label: '60대+', value: Number(latest.AGE_60 || 0) },
          ];
          const top = ages.reduce((a, b) => (b.value > a.value ? b : a), ages[0]);
          topAge = top.label;
        }

        data = {
          saleCount: saleData?.totalCount ?? 0,
          maxRate,
          avgRate,
          topAge,
        };
        break;
      }

      case 'sale':
        data = await fetchOdcloud(SALE_URL, page, 20, hasSaleCond ? saleCond : undefined);
        break;

      case 'sale-chart':
        data = await fetchOdcloud(SALE_URL, 1, 100, hasSaleCond ? saleCond : undefined);
        break;

      case 'competition': {
        const raw = await fetchOdcloud(COMPETITION_URL, 1, 100, hasCompCond ? compCond : undefined);
        const items: Array<Record<string, string>> = raw?.data ?? [];
        const matchSet = await matchingHouseNos();
        const filtered = matchSet
          ? items.filter((i) => i.HOUSE_MANAGE_NO && matchSet.has(i.HOUSE_MANAGE_NO))
          : items;
        // 클라이언트 페이지네이션 (perPage 50)
        const perPage = 50;
        const start = (page - 1) * perPage;
        data = {
          totalCount: filtered.length,
          data: filtered.slice(start, start + perPage),
        };
        break;
      }

      case 'winner': {
        const [ageRes, areaRes] = await Promise.allSettled([
          fetchOdcloud(WINNER_AGE_URL, 1, 30),
          fetchOdcloud(WINNER_AREA_URL, 1, 100),
        ]);
        data = {
          ageData: settled(ageRes, null),
          areaData: settled(areaRes, null),
        };
        break;
      }

      default:
        return NextResponse.json({ error: '잘못된 타입입니다.' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
