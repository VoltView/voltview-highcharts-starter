'use client';

import { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth } from 'date-fns';
import MonthlyEnergyChart from '@/components/charts/MonthlyEnergyChart';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConsumptionData, CostData } from '@/types';

// Seasonal patterns for energy consumption (indexed by month 0-11)
// Higher gas in winter months, higher electricity in summer (AC usage)
const SEASONAL_PATTERNS = {
  // Month: [electricity, gas, elecCost, gasCost]
  0:  { electricity: 45000, gas: 28000, elecCost: 6750, gasCost: 2800 },  // January
  1:  { electricity: 42000, gas: 25000, elecCost: 6300, gasCost: 2500 },  // February
  2:  { electricity: 38000, gas: 18000, elecCost: 5700, gasCost: 1800 },  // March
  3:  { electricity: 35000, gas: 12000, elecCost: 5250, gasCost: 1200 },  // April
  4:  { electricity: 32000, gas: 8000,  elecCost: 4800, gasCost: 800 },   // May
  5:  { electricity: 38000, gas: 5000,  elecCost: 5700, gasCost: 500 },   // June
  6:  { electricity: 42000, gas: 4000,  elecCost: 6300, gasCost: 400 },   // July
  7:  { electricity: 44000, gas: 4500,  elecCost: 6600, gasCost: 450 },   // August
  8:  { electricity: 40000, gas: 8000,  elecCost: 6000, gasCost: 800 },   // September
  9:  { electricity: 38000, gas: 15000, elecCost: 5700, gasCost: 1500 },  // October
  10: { electricity: 43000, gas: 22000, elecCost: 6450, gasCost: 2200 },  // November
  11: { electricity: 48000, gas: 30000, elecCost: 7200, gasCost: 3000 },  // December
} as const;

/**
 * Generates 12 months of demo data going backwards from today's date
 * Uses realistic seasonal patterns based on the actual month of year
 */
function generateDemoData(): { consumption: ConsumptionData[]; cost: CostData[] } {
  const consumption: ConsumptionData[] = [];
  const cost: CostData[] = [];
  const today = new Date();

  // Generate 12 months of data, going backwards from current month
  for (let i = 11; i >= 0; i--) {
    const date = startOfMonth(subMonths(today, i));
    const monthIndex = date.getMonth() as keyof typeof SEASONAL_PATTERNS;
    const pattern = SEASONAL_PATTERNS[monthIndex];
    const dateStr = format(date, 'yyyy-MM-dd');

    consumption.push({
      timestamp: dateStr,
      electricity: pattern.electricity,
      gas: pattern.gas,
      measurementTypeElectricity: 'actual',
      measurementTypeGas: 'actual',
    });

    cost.push({
      date: dateStr,
      electricityCost: pattern.elecCost,
      gasCost: pattern.gasCost,
    });
  }

  return { consumption, cost };
}

export default function Home() {
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[] | null>(null);
  const [costData, setCostData] = useState<CostData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/energy-data');
        if (!response.ok) {
          throw new Error('API not configured');
        }
        const data = await response.json();
        setConsumptionData(data.consumption);
        setCostData(data.cost);
      } catch {
        // Use demo data if API is not configured
        const demoData = generateDemoData();
        setConsumptionData(demoData.consumption);
        setCostData(demoData.cost);
        setUseDemo(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">VoltView Highcharts Starter</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Energy consumption charts powered by{' '}
              <a 
                href="https://docs.voltview.co.uk/api-reference/introduction" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                VoltView API
              </a>
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Demo Mode Banner */}
        {useDemo && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Demo Mode:</strong> Showing sample data. Configure your{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code>{' '}
              file with VoltView API credentials to see real data.
            </p>
          </div>
        )}

        {/* Chart Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <MonthlyEnergyChart 
              consumptionData={consumptionData} 
              costData={costData} 
            />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="font-semibold text-blue-500 mb-2">📊 Electricity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Blue bars show monthly electricity consumption in kWh
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="font-semibold text-orange-300 mb-2">🔥 Gas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Peach bars show monthly gas consumption in kWh
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h3 className="font-semibold text-orange-500 mb-2">💷 Cost</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Orange line shows total energy cost in GBP
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Built with{' '}
            <a href="https://nextjs.org" className="hover:underline">Next.js</a>,{' '}
            <a href="https://www.highcharts.com" className="hover:underline">Highcharts</a>, and{' '}
            <a href="https://voltview.co.uk" className="hover:underline">VoltView</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
