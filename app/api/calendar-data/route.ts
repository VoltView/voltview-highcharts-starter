/**
 * API route backing:
 * - CalendarChart (main tabbed page)
 * - app/examples/calendar/page.tsx
 *
 * Uses helper from lib/api.ts:
 * - getHourlyConsumption
 */

import { NextResponse } from 'next/server';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getHourlyConsumption } from '@/lib/api';
import { generateCalendarDemoData } from '@/lib/demo-data';
import { CalendarChartData } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ?? format(new Date(), 'yyyy-MM');
    const siteId = searchParams.get('siteId') ?? undefined;

    // If no API key, fall back to demo data
    if (!process.env.VOLTVIEW_API_KEY) {
      const demo = generateCalendarDemoData(month);
      return NextResponse.json({ ...demo, demo: true });
    }

    // Parse month string to get date range
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, monthNum - 1));
    const endDate = endOfMonth(startDate);

    const from = format(startDate, 'yyyy-MM-dd');
    const to = format(endDate, 'yyyy-MM-dd');

    // Fetch hourly consumption data
    const consumptionData = await getHourlyConsumption(from, to, siteId);

    // Transform data into calendar format
    const calendarData: { [date: string]: number[] } = {};

    consumptionData.forEach((item) => {
      const date = item.timestamp.split('T')[0];
      const hour = new Date(item.timestamp).getHours();
      
      if (!calendarData[date]) {
        calendarData[date] = Array(24).fill(0);
      }
      
      const value = typeof item.electricity === 'string' 
        ? parseFloat(item.electricity) 
        : item.electricity;
      
      if (!isNaN(value)) {
        calendarData[date][hour] = value;
      }
    });

    // Calculate max, avg, and min data for each day
    const dateKeys = Object.keys(calendarData);
    const maxData: { [date: string]: number[] } = {};
    const avgData: { [date: string]: number[] } = {};
    const minData: { [date: string]: number[] } = {};

    dateKeys.forEach((date) => {
      maxData[date] = Array(24).fill(0);
      avgData[date] = Array(24).fill(0);
      minData[date] = Array(24).fill(0);

      for (let hour = 0; hour < 24; hour++) {
        const hourlyValues = dateKeys
          .map((dk) => calendarData[dk][hour])
          .filter((val) => val > 0);

        if (hourlyValues.length > 0) {
          maxData[date][hour] = Math.max(...hourlyValues);
          avgData[date][hour] = hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length;
          minData[date][hour] = Math.min(...hourlyValues);
        }
      }
    });

    const response: CalendarChartData = {
      data: calendarData,
      maxData,
      avgData,
      minData,
      currentMonth: month,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

