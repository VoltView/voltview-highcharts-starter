'use client';

/**
 * Example page: Monthly Energy Consumption & Cost
 *
 * This page is intentionally minimal so you can see:
 * - How we call the VoltView-backed API route
 * - How we pass the data into MonthlyEnergyChart
 *
 * To copy into your own app:
 * - Copy MonthlyEnergyChart.tsx from components/charts/
 * - Copy getMonthlyConsumption / getMonthlyCosts from lib/api.ts (or call the VoltView
 *   endpoints directly from your backend)
 */

import { useEffect, useState } from 'react';
import MonthlyEnergyChart from '@/components/charts/MonthlyEnergyChart';
import type { ConsumptionData, CostData } from '@/types';

export default function MonthlyEnergyExamplePage() {
  const [consumption, setConsumption] = useState<ConsumptionData[] | null>(null);
  const [cost, setCost] = useState<CostData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/energy-data');
        const json = await res.json();
        setConsumption(json.consumption);
        setCost(json.cost);
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
          Example: Monthly Energy Consumption & Cost
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          This page shows the bare minimum wiring for the <code>MonthlyEnergyChart</code>{' '}
          component and the VoltView-backed API route at <code>/api/energy-data</code>.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          ) : (
            <MonthlyEnergyChart
              consumptionData={consumption}
              costData={cost}
              currency="GBP"
            />
          )}
        </div>
      </div>
    </main>
  );
}


