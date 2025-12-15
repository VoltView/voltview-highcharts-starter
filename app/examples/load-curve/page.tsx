'use client';

/**
 * Example page: Load Curve
 *
 * This page is intentionally minimal so you can see:
 * - How we call the VoltView-backed /api/load-curve route
 * - How we pick the correct array for the chosen summaryLevel
 * - How we pass that data into LoadCurveChart
 *
 * To copy into your own app:
 * - Copy LoadCurveChart.tsx from components/charts/
 * - Copy getLoadCurveData from lib/api.ts (or call the VoltView /loadCurve endpoints
 *   directly from your backend)
 */

import { useEffect, useState } from 'react';
import LoadCurveChart from '@/components/charts/LoadCurveChart';
import type { LoadCurveApiResponse, LoadCurveData } from '@/types';

export default function LoadCurveExamplePage() {
  const [data, setData] = useState<LoadCurveData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // For the example we fix a summaryLevel and let the API route
        // choose a sensible date range (last year by default).
        const params = new URLSearchParams({ summaryLevel: 'dayOfWeek' });
        const res = await fetch(`/api/load-curve?${params.toString()}`);
        const json = (await res.json()) as LoadCurveApiResponse;

        const series = json.daysOfWeek ?? [];
        setData(series);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          Example: Load Curve (Hourly Pattern)
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          This page shows the bare minimum wiring for the <code>LoadCurveChart</code>{' '}
          component and the VoltView-backed API route at <code>/api/load-curve</code>.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : (
            <LoadCurveChart data={data ?? []} />
          )}
        </div>
      </div>
    </main>
  );
}


