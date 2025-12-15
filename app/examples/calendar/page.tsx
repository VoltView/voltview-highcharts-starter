'use client';

/**
 * Example page: Calendar Chart
 *
 * This page is intentionally minimal so you can see:
 * - How we call the VoltView-backed /api/calendar-data route
 * - How we pass the calendar data into CalendarChart
 * - How to handle month changes
 *
 * To copy into your own app:
 * - Copy CalendarChart.tsx from components/charts/
 * - Copy getHourlyConsumption from lib/api.ts (or call the VoltView /timeSeries endpoints
 *   directly from your backend with granularity=hour)
 */

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import CalendarChart from '@/components/charts/CalendarChart';
import type { CalendarChartData } from '@/types';

export default function CalendarExamplePage() {
  const [data, setData] = useState<CalendarChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ month });
        const res = await fetch(`/api/calendar-data?${params.toString()}`);
        const json = await res.json();

        setData({
          data: json.data,
          maxData: json.maxData,
          avgData: json.avgData,
          minData: json.minData,
          currentMonth: json.currentMonth,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [month]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Example: Calendar Chart (Daily Patterns)
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          This page shows the bare minimum wiring for the <code>CalendarChart</code>{' '}
          component and the VoltView-backed API route at <code>/api/calendar-data</code>.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : data ? (
            <CalendarChart
              data={data.data}
              maxData={data.maxData}
              avgData={data.avgData}
              minData={data.minData}
              currentMonth={data.currentMonth}
              onMonthChange={setMonth}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
              No calendar data available
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

