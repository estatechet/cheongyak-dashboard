import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.PUBLIC_DATA_API_KEY;

const SALE_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail';
const COMPETITION_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet';
const WINNER_AGE_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTPrzwnerAgeStat';
const WINNER_AREA_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTPrzwnerAreaStat';
const REQST_AREA_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTReqstAreaStat';
const CMPETRT_AREA_URL = 'https://api.odcloud.kr/api/ApplyhomeStatSvc/v1/getAPTCmpetrtAreaStat';

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
  });

  if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`);
  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'sale';
  const region = searchParams.get('region') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
      { status: 500 }
    );
  }

  try {
    const cond: Record<string, string> = {};
    if (region && region !== '전국') cond['SUBSCRPT_AREA_CODE_NM'] = region;
    const hasCond = Object.keys(cond).length > 0;

    let data;
    switch (type) {
      case 'kpi': {
        // Parallel fetch for KPI cards
        const [saleData, compData, ageData] = await Promise.all([
          fetchOdcloud(SALE_URL, 1, 1, hasCond ? cond : undefined),
          fetchOdcloud(COMPETITION_URL, 1, 100),
          fetchOdcloud(WINNER_AGE_URL, 1, 5),
        ]);

        const compItems: Array<{ CMPET_RATE: string }> = compData?.data ?? [];
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
        data = await fetchOdcloud(SALE_URL, page, 20, hasCond ? cond : undefined);
        break;

      case 'sale-chart':
        data = await fetchOdcloud(SALE_URL, 1, 100, hasCond ? cond : undefined);
        break;

      case 'competition':
        data = await fetchOdcloud(COMPETITION_URL, page, 50, hasCond ? cond : undefined);
        break;

      case 'winner': {
        const [ageData, areaData, cmpetAreaData] = await Promise.all([
          fetchOdcloud(WINNER_AGE_URL, 1, 30),
          fetchOdcloud(WINNER_AREA_URL, 1, 50),
          fetchOdcloud(CMPETRT_AREA_URL, 1, 50),
        ]);
        data = { ageData, areaData, cmpetAreaData };
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
