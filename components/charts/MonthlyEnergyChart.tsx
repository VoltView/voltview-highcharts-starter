'use client';

import { useEffect, useState, useRef } from 'react';
import Highcharts, { Options, SeriesColumnOptions, SeriesLineOptions } from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { parseISO, subYears, startOfMonth, subDays } from 'date-fns';
import { toZonedTime, format as tzFormat } from 'date-fns-tz';
import { chartTheme, legendTheme, tooltipTheme } from '@/components/charts/styles/chart-theme';
import { useTheme } from 'next-themes';
import { ConsumptionData, CostData } from '@/types';
import { Currency } from '@/components/CurrencySelector';

interface MonthlyEnergyChartProps {
  consumptionData: ConsumptionData[] | null;
  costData: CostData[] | null;
  currency?: Currency;
}

export default function MonthlyEnergyChart({
  consumptionData,
  costData,
  currency = 'GBP',
}: MonthlyEnergyChartProps) {
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme || 'light') as 'light' | 'dark';
  const [minDate, setMinDate] = useState<number>(0);
  const costDataRef = useRef<Array<{ x: number; electricityCost: number; gasCost: number; y?: number }>>([]);

  useEffect(() => {
    const now = new Date();
    const todayMinus3Days = subDays(now, 3);
    const oneYearAgoStartOfMonth = startOfMonth(subYears(now, 1));
    
    setMinDate(oneYearAgoStartOfMonth.getTime());
    setLastUpdated(tzFormat(todayMinus3Days, 'HH:mm dd/MM/yyyy', { timeZone: 'UTC' }));
  }, []);

  if (!consumptionData || !costData || (consumptionData.length === 0 && costData.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
        <p className="text-center text-lg font-medium">
          No consumption or cost data available
        </p>
      </div>
    );
  }

  const formattedConsumptionData = consumptionData
    .map(d => {
      const electricityValue = d.electricity !== null ? parseFloat(d.electricity as string) : null;
      const gasValue = d.gas !== null ? parseFloat(d.gas as string) : null;

      if (electricityValue === null || Number.isNaN(electricityValue)) {
        return null;
      }

      const timestamp = parseISO(d.timestamp).getTime();
      if (timestamp < minDate) {
        return null;
      }

      return {
        x: timestamp,
        electricityY: electricityValue,
        gasY: gasValue,
        measurementTypeElectricity: d.measurementTypeElectricity,
        measurementTypeGas: d.measurementTypeGas,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const formattedCostData = costData
    .map(d => {
      try {
        const parsedDate = parseISO(d.date);
        if (isNaN(parsedDate.getTime())) {
          return null;
        }
        
        const timestamp = parsedDate.getTime();
        if (timestamp < minDate) {
          return null;
        }

        const electricityCost = d.electricity || 0;
        const gasCost = d.gas || 0;
        const totalCost = electricityCost + gasCost;

        return {
          x: timestamp,
          y: totalCost,
          electricityCost,
          gasCost,
        };
      } catch {
        return null;
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  costDataRef.current = formattedCostData;
  const getCurrencySymbol = () => currency === 'USD' ? '$' : '£';
  const formatCurrency = (value: number): string => {
    const symbol = getCurrencySymbol();
    if (value >= 1000) {
      return `${symbol}${(Math.round(value / 10) / 100).toFixed(2)}k`;
    }
    return `${symbol}${value.toFixed(2)}`;
  };
  const formatCurrencyShort = (value: number): string => {
    const symbol = getCurrencySymbol();
    if (value >= 1000) {
      return `${symbol}${(Math.round(value / 10) / 100).toFixed(1)}k`;
    }
    return `${symbol}${value.toFixed(1)}`;
  };

  const options: Options = {
    chart: {
      type: 'column',
      height: 400,
      backgroundColor: 'transparent',
      events: {
        load: function () {
          (this as Highcharts.Chart & { costData?: typeof formattedCostData }).costData = formattedCostData;
        }
      }
    },
    title: {
      text: 'Monthly Energy Consumption and Cost',
      align: 'left',
      style: {
        color: chartTheme[theme]?.color,
      },
    },
    subtitle: {
      text: `Last updated: ${lastUpdated}`,
      style: {
        color: chartTheme[theme]?.color,
      },
      align: 'left',
    },
    xAxis: {
      type: 'datetime',
      min: minDate,
      labels: {
        style: {
          color: chartTheme[theme]?.color,
        },
        formatter: function () {
          if (typeof this.value === 'number') {
            const date = toZonedTime(new Date(this.value), 'UTC');
            return tzFormat(date, 'MMM yyyy', { timeZone: 'UTC' });
          }
          return '';
        },
      },
    },
    yAxis: [
      {
        min: 0,
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
      {
        min: 0,
        opposite: true,
        title: {
          text: `Cost (${getCurrencySymbol()})`,
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
    ],
    legend: {
      layout: 'horizontal',
      align: 'left',
      verticalAlign: 'top',
      backgroundColor: legendTheme[theme]?.backgroundColor,
      itemStyle: {
        color: legendTheme[theme]?.color,
      },
    },
    tooltip: {
      backgroundColor: tooltipTheme[theme]?.backgroundColor,
      style: {
        color: tooltipTheme[theme]?.color,
      },
      shared: true,
      formatter: function () {
        const date = toZonedTime(new Date(this.x as number), 'UTC');
        let s = `<b>${tzFormat(date, 'MMM yyyy', { timeZone: 'UTC' })}</b><br/>`;
        if (this.points) {
          this.points.forEach(point => {
            if (point.y != null) {
              const value = point.y;
              const formattedValue = point.series.name === 'Cost' 
                ? formatCurrency(value)
                : `${value.toFixed(2)} kWh`;
              s += `${point.series.name}: ${formattedValue}<br/>`;
            }
          });
        }
        return s;
      },
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: true,
          inside: true,
          verticalAlign: 'middle',
          formatter: function () {
            const value = this.y ?? 0;
            const roundedValue = Math.round(value / 10) * 10;
            return roundedValue >= 1000
              ? `${(Math.round(roundedValue / 100) / 10).toFixed(1)}M`
              : `${roundedValue}`;
          },
          style: {
            color: '#FFFFFF',
            textOutline: 'none',
            fontSize: '8px',
            fontWeight: 'bold'
          },
        },
        pointPadding: 0.02,
        groupPadding: 0.05,
        maxPointWidth: 50,
        events: {
          legendItemClick: function () {
            const series = this;
            const chart = series.chart;
            const seriesName = series.name;
            
            if (seriesName !== 'Electricity' && seriesName !== 'Gas') {
              return;
            }

            setTimeout(() => {
              const electricitySeries = chart.series.find(s => s.name === 'Electricity');
              const gasSeries = chart.series.find(s => s.name === 'Gas');
              const costSeries = chart.series.find(s => s.name === 'Cost');

              if (!costSeries || !electricitySeries || !gasSeries) return;

              const isElecVisible = electricitySeries.visible;
              const isGasVisible = gasSeries.visible;

              const costData = (chart as Highcharts.Chart & { costData?: typeof costDataRef.current }).costData || costDataRef.current;
              
              if (!costData || costData.length === 0) return;

              const newCostData = costData.map((point) => {
                let newCost = 0;
                if (isElecVisible) newCost += (point.electricityCost || 0);
                if (isGasVisible) newCost += (point.gasCost || 0);

                return { ...point, y: newCost };
              });

              costSeries.setData(newCostData, false);
              chart.redraw();
            }, 10);
          }
        }
      },
      line: {
        dataLabels: {
          enabled: true,
          formatter: function () {
            const value = this.y ?? 0;
            return formatCurrencyShort(value);
          },
          style: {
            textOutline: 'none',
            color: chartTheme[theme]?.color,
            fontSize: '10px',
          },
        },
      },
    },
    series: [
      {
        type: 'column',
        name: 'Electricity',
        data: formattedConsumptionData.map(d => ({
          x: d.x,
          y: d.electricityY,
        })),
        color: '#00AAFF',
        yAxis: 0,
      } as SeriesColumnOptions,
      {
        type: 'column',
        name: 'Gas',
        data: formattedConsumptionData.map(d => ({
          x: d.x,
          y: d.gasY,
        })),
        color: '#FFBC99',
        yAxis: 0,
      } as SeriesColumnOptions,
      {
        type: 'line',
        name: 'Cost',
        data: formattedCostData,
        color: '#FF8C00',
        yAxis: 1,
        lineWidth: 3,
        marker: {
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
      } as SeriesLineOptions,
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
