/**
 * API route backing:
 * - MonthlyEnergyChart (main tabbed page)
 * - app/examples/monthly-energy/page.tsx
 *
 * Uses helpers from lib/api.ts:
 * - getMonthlyConsumption
 * - getMonthlyCosts
 */

import { NextResponse } from 'next/server';
import { getMonthlyConsumption, getMonthlyCosts } from '@/lib/api';
import { format, subYears } from 'date-fns';
import { generateMonthlyDemoData } from '@/lib/demo-data';

export async function GET() {
  if (!process.env.VOLTVIEW_API_KEY) {
    // No API key configured – serve rolling-window demo data instead of an error.
    const demo = generateMonthlyDemoData();
    return NextResponse.json({ demo: true, consumption: demo.consumption, cost: demo.cost });
  }

  try {
    const now = new Date();
    const oneYearAgo = subYears(now, 1);
    
    const from = format(oneYearAgo, 'yyyy-MM-dd');
    const to = format(now, 'yyyy-MM-dd');

    const [consumption, cost] = await Promise.all([
      getMonthlyConsumption(from, to),
      getMonthlyCosts(from, to),
    ]);

    return NextResponse.json({ consumption, cost });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy data' },
      { status: 500 }
    );
  }
}
