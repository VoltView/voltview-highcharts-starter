'use client';

import { useState, useEffect } from 'react';
import MonthlyEnergyChart from '@/components/charts/MonthlyEnergyChart';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConsumptionData, CostData } from '@/types';

// Demo data for when API is not configured
const DEMO_CONSUMPTION_DATA: ConsumptionData[] = [
  { timestamp: '2024-01-01', electricity: 45000, gas: 28000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-02-01', electricity: 42000, gas: 25000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-03-01', electricity: 38000, gas: 18000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-04-01', electricity: 35000, gas: 12000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-05-01', electricity: 32000, gas: 8000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-06-01', electricity: 38000, gas: 5000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-07-01', electricity: 42000, gas: 4000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-08-01', electricity: 44000, gas: 4500, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-09-01', electricity: 40000, gas: 8000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-10-01', electricity: 38000, gas: 15000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-11-01', electricity: 43000, gas: 22000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
  { timestamp: '2024-12-01', electricity: 48000, gas: 30000, measurementTypeElectricity: 'actual', measurementTypeGas: 'actual' },
];

const DEMO_COST_DATA: CostData[] = [
  { date: '2024-01-01', electricityCost: 6750, gasCost: 2800 },
  { date: '2024-02-01', electricityCost: 6300, gasCost: 2500 },
  { date: '2024-03-01', electricityCost: 5700, gasCost: 1800 },
  { date: '2024-04-01', electricityCost: 5250, gasCost: 1200 },
  { date: '2024-05-01', electricityCost: 4800, gasCost: 800 },
  { date: '2024-06-01', electricityCost: 5700, gasCost: 500 },
  { date: '2024-07-01', electricityCost: 6300, gasCost: 400 },
  { date: '2024-08-01', electricityCost: 6600, gasCost: 450 },
  { date: '2024-09-01', electricityCost: 6000, gasCost: 800 },
  { date: '2024-10-01', electricityCost: 5700, gasCost: 1500 },
  { date: '2024-11-01', electricityCost: 6450, gasCost: 2200 },
  { date: '2024-12-01', electricityCost: 7200, gasCost: 3000 },
];

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
        setConsumptionData(DEMO_CONSUMPTION_DATA);
        setCostData(DEMO_COST_DATA);
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
