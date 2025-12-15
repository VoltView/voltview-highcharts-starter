/**
 * LoadCurveChart
 *
 * What it shows:
 * - Spline chart of average load (kWh) across the 24 hours of a day
 * - One series per summary bucket (e.g. Monday–Sunday for dayOfWeek)
 *
 * VoltView API usage:
 * - Expects data shaped like the `LoadCurveData[]` in types/index.ts
 * - Typically produced from:
 *   - getLoadCurveData({ from, to, summaryLevel, siteId?, utility? })
 *   which wraps:
 *   - /v1/sites/loadCurve or /v1/sites/{siteId}/loadCurve
 *   with query params: from, to, summaryLevel, optional utility
 *
 * How to use:
 * - Call getLoadCurveData in lib/api.ts on your backend
 * - Pick the array matching your summaryLevel (e.g. data.daysOfWeek)
 * - Pass that array as the `data` prop into this component
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Highcharts, { Options, SeriesSplineOptions } from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { chartTheme, legendTheme, tooltipTheme } from '@/components/charts/styles/chart-theme';
import { useTheme } from 'next-themes';
import type { LoadCurveData } from '@/types';

interface LoadCurveChartProps {
  data: LoadCurveData[];
}

export default function LoadCurveChart({ data }: LoadCurveChartProps) {
  const [chartHeight, setChartHeight] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme || 'light') as 'light' | 'dark';

  useEffect(() => {
    const updateChartHeight = () => {
      if (chartRef.current) {
        setChartHeight(chartRef.current.offsetHeight);
      }
    };

    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);

    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
        <p className="text-center text-lg font-medium">
          No load curve data found for the selected period
        </p>
      </div>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const series: SeriesSplineOptions[] = data.map(item => ({
    type: 'spline',
    name: item.name,
    data: item.electricity,
  }));

  const options: Options = {
    chart: {
      type: 'spline',
      zooming: {
        type: 'x',
      },
      height: chartHeight || 400,
      backgroundColor: 'transparent',
    },
    title: {
      text: 'Load Curve',
      style: {
        color: chartTheme[theme]?.color,
      },
      align: 'left',
    },
    xAxis: {
      categories: hours.map(String),
      title: {
        text: 'Hour of Day',
        style: {
          color: chartTheme[theme]?.color,
        },
      },
      labels: {
        style: {
          color: chartTheme[theme]?.color,
        },
      },
    },
    yAxis: {
      title: {
        text: 'Energy (kWh)',
        style: {
          color: chartTheme[theme]?.color,
        },
      },
      labels: {
        style: {
          color: chartTheme[theme]?.color,
        },
      },
    },
    tooltip: {
      formatter: function () {
        return `<b>${this.series.name}</b><br/>Hour ${this.x}: ${this.y} kWh`;
      },
      backgroundColor: tooltipTheme[theme]?.backgroundColor,
      style: {
        color: tooltipTheme[theme]?.color,
      },
    },
    legend: {
      itemStyle: {
        color: legendTheme[theme]?.color,
      },
    },
    plotOptions: {
      spline: {
        marker: {
          enabled: false,
        },
      },
    },
    series,
  };

  return (
    <div ref={chartRef} className="h-[400px]">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}


