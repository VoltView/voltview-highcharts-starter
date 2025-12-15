/**
 * API route backing:
 * - LoadCurveChart (main tabbed page)
 * - app/examples/load-curve/page.tsx
 *
 * Uses helper from lib/api.ts:
 * - getLoadCurveData
 */

import { NextResponse } from 'next/server';
import { format, subYears } from 'date-fns';
import { getLoadCurveData } from '@/lib/api';

const DEFAULT_SUMMARY_LEVEL = 'dayOfWeek' as const;

type SummaryLevel = 'year' | 'month' | 'week' | 'day' | 'dayOfWeek';

export async function GET(request: Request) {
  if (!process.env.VOLTVIEW_API_KEY) {
    return NextResponse.json(
      { error: 'VoltView API key not configured' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const oneYearAgo = subYears(now, 1);

    const from = searchParams.get('from') ?? format(oneYearAgo, 'yyyy-MM-dd');
    const to = searchParams.get('to') ?? format(now, 'yyyy-MM-dd');

    const summaryLevelParam = searchParams.get('summaryLevel') as SummaryLevel | null;
    const summaryLevel: SummaryLevel =
      summaryLevelParam && ['year', 'month', 'week', 'day', 'dayOfWeek'].includes(summaryLevelParam)
        ? summaryLevelParam
        : DEFAULT_SUMMARY_LEVEL;

    const siteId = searchParams.get('siteId') ?? undefined;
    const utility = (searchParams.get('utility') as 'ELECTRICITY' | 'GAS' | null) ?? undefined;

    const data = await getLoadCurveData({
      from,
      to,
      summaryLevel,
      siteId,
      utility,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching load curve data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load curve data' },
      { status: 500 }
    );
  }
}


