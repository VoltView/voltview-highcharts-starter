'use client';

import { useState, useEffect, useMemo } from 'react';
import MonthlyEnergyChart from '@/components/charts/MonthlyEnergyChart';
import LoadCurveChart from '@/components/charts/LoadCurveChart';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CurrencySelector, Currency } from '@/components/CurrencySelector';
import { ConsumptionData, CostData, LoadCurveApiResponse, LoadCurveData } from '@/types';
import { generateMonthlyDemoData, generateDemoLoadCurve } from '@/lib/demo-data';

type SummaryLevel = LoadCurveApiResponse['summaryLevel'];

const SUMMARY_LEVEL_LABELS: Record<SummaryLevel, string> = {
  year: 'Year',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  dayOfWeek: 'Day of Week',
};

function getDefaultDates() {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  return {
    from: oneYearAgo.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

type Tab = 'monthly' | 'loadCurve';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  
  // Monthly Energy Chart state
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[] | null>(null);
  const [costData, setCostData] = useState<CostData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);
  
  // Load Curve Chart state
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [from, setFrom] = useState(defaultDates.from);
  const [to, setTo] = useState(defaultDates.to);
  const [summaryLevel, setSummaryLevel] = useState<SummaryLevel>('dayOfWeek');
  const [loadCurveData, setLoadCurveData] = useState<LoadCurveData[] | null>(null);
  const [loadCurveLoading, setLoadCurveLoading] = useState(false);
  const [loadCurveUseDemo, setLoadCurveUseDemo] = useState(false);
  
  const [currency, setCurrency] = useState<Currency>('GBP');

  // Fetch monthly energy data
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
        if (data.demo) {
          setUseDemo(true);
        }
      } catch {
        const demoData = generateMonthlyDemoData();
        setConsumptionData(demoData.consumption);
        setCostData(demoData.cost);
        setUseDemo(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch load curve data
  useEffect(() => {
    if (activeTab !== 'loadCurve') return;

    async function fetchLoadCurve() {
      setLoadCurveLoading(true);
      try {
        const params = new URLSearchParams({
          from,
          to,
          summaryLevel,
        });

        const response = await fetch(`/api/load-curve?${params.toString()}`);
        if (!response.ok) {
          throw new Error('API not configured');
        }

        const json = (await response.json()) as LoadCurveApiResponse & { demo?: boolean };

        const key =
          json.summaryLevel === 'year'
            ? 'years'
            : json.summaryLevel === 'month'
            ? 'months'
            : json.summaryLevel === 'week'
            ? 'weeks'
            : json.summaryLevel === 'day'
            ? 'days'
            : 'daysOfWeek';

        const series = (json as any)[key] as LoadCurveData[] | undefined;
        setLoadCurveData(series && Array.isArray(series) ? series : []);
        setLoadCurveUseDemo(Boolean((json as any).demo));
      } catch {
        const demo = generateDemoLoadCurve(summaryLevel);
        const key =
          demo.summaryLevel === 'year'
            ? 'years'
            : demo.summaryLevel === 'month'
            ? 'months'
            : demo.summaryLevel === 'week'
            ? 'weeks'
            : demo.summaryLevel === 'day'
            ? 'days'
            : 'daysOfWeek';

        const series = (demo as any)[key] as LoadCurveData[] | undefined;
        setLoadCurveData(series && Array.isArray(series) ? series : []);
        setLoadCurveUseDemo(true);
      } finally {
        setLoadCurveLoading(false);
      }
    }

    fetchLoadCurve();
  }, [from, to, summaryLevel, activeTab]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
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
          <div className="flex items-center gap-4">
            <CurrencySelector currency={currency} onCurrencyChange={setCurrency} />
            <ThemeToggle />
          </div>
        </div>

        {/* Demo Mode Banner – shown once between header and tabs */}
        {(useDemo || loadCurveUseDemo) && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Demo Mode:</strong> Showing sample data. Configure your{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code>{' '}
              file with VoltView API credentials to see real data.
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'monthly'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Monthly Energy Consumption and Cost
            </button>
            <button
              onClick={() => setActiveTab('loadCurve')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'loadCurve'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              Load Curve
            </button>
          </nav>
        </div>

        {/* Monthly Energy Chart Tab */}
        {activeTab === 'monthly' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <MonthlyEnergyChart 
                  consumptionData={consumptionData} 
                  costData={costData}
                  currency={currency}
                />
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="font-semibold text-blue-500 mb-2">⚡ Electricity and 🔥 Gas</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track how total electricity usage changes month‑to‑month (kWh) and spot trends or step changes in demand.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="font-semibold text-orange-500 mb-2">💷 Cost</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See the combined energy spend in GBP by month and measure the impact of efficiency changes.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Load Curve Chart Tab */}
        {activeTab === 'loadCurve' && (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="from">
                    From
                  </label>
                  <input
                    id="from"
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="to">
                    To
                  </label>
                  <input
                    id="to"
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="summaryLevel">
                  Summary Level
                </label>
                <select
                  id="summaryLevel"
                  value={summaryLevel}
                  onChange={e => setSummaryLevel(e.target.value as SummaryLevel)}
                  className="border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(SUMMARY_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {loadCurveLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <LoadCurveChart data={loadCurveData ?? []} />
              )}
            </div>
          </>
        )}

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
