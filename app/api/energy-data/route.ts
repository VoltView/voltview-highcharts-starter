import { NextResponse } from 'next/server';
import { getMonthlyConsumption, getMonthlyCosts } from '@/lib/api';
import { format, subYears } from 'date-fns';

export async function GET() {
  // Check if API credentials are configured
  if (!process.env.VOLTVIEW_API_EMAIL || !process.env.VOLTVIEW_API_PASSWORD) {
    return NextResponse.json(
      { error: 'VoltView API credentials not configured' },
      { status: 503 }
    );
  }

  try {
    const now = new Date();
    const oneYearAgo = subYears(now, 1);
    
    const from = format(oneYearAgo, 'yyyy-MM-dd');
    const to = format(now, 'yyyy-MM-dd');

    // Fetch consumption and cost data in parallel
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
