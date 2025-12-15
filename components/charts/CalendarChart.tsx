/**
 * CalendarChart
 *
 * What it shows:
 * - Monthly calendar grid with mini line charts for each day
 * - Each day shows actual consumption vs max/avg/min across the month
 * - Clicking a day reveals a detailed expanded chart
 *
 * VoltView API usage:
 * - Expects data shaped like CalendarChartData in types/index.ts
 * - Typically produced from:
 *   - getHourlyConsumption(from, to, siteId?)
 *   which wraps:
 *   - /v1/sites/timeSeries?granularity=hour&unit=kWh
 *
 * How to use:
 * - Call getHourlyConsumption in lib/api.ts on your backend
 * - Transform the response into the CalendarChartData shape
 * - Pass that data into this component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import { format, parse } from 'date-fns';
import { useTheme } from 'next-themes';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

interface ChartData {
  time: string;
  value: number;
  max: number;
  avg: number;
  min: number;
  dateTime: Date;
}

interface TooltipEntry {
  name: string;
  value: number;
  color?: string;
  payload?: {
    dateTime?: Date;
  };
}

interface CalendarChartProps {
  data: {
    [date: string]: number[];
  };
  maxData: {
    [date: string]: number[];
  };
  avgData: {
    [date: string]: number[];
  };
  minData: {
    [date: string]: number[];
  };
  currentMonth: string;
  onMonthChange?: (month: string) => void;
}

const chartColors = {
  actual: '#3b82f6',
  max: '#ef4444',
  avg: '#22c55e',
  min: '#a855f7',
};

const MIN_DAYS_REQUIRED = 5;

const CalendarChart: React.FC<CalendarChartProps> = ({
  data,
  maxData,
  avgData,
  minData,
  currentMonth,
  onMonthChange,
}) => {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme || 'light') as 'light' | 'dark';
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(currentMonth));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [topDays, setTopDays] = useState<string[]>([]);

  useEffect(() => {
    setCurrentMonthDate(new Date(currentMonth));
  }, [currentMonth]);

  useEffect(() => {
    const computeTopDays = () => {
      const daysInMonth = new Date(
        currentMonthDate.getFullYear(),
        currentMonthDate.getMonth() + 1,
        0
      ).getDate();
      const dayDifferences: { dateKey: string; difference: number }[] = [];
      let validDaysCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = format(
          new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day),
          'yyyy-MM-dd'
        );
        const dayDataValues = data[dateKey] || [];
        const avgDayDataValues = avgData[dateKey] || [];

        // Check if both dayData and avgData have data for this day
        if (dayDataValues.length === 0 || avgDayDataValues.length === 0) {
          continue; // Skip days with incomplete data
        }

        // Compute the total positive difference
        const difference = dayDataValues.reduce(
          (sum, value, index) => sum + Math.max(value - (avgDayDataValues[index] || 0), 0),
          0
        );

        if (difference > 0) {
          dayDifferences.push({ dateKey, difference });
          validDaysCount++;
        }
      }

      if (validDaysCount >= MIN_DAYS_REQUIRED) {
        // Sort descending by difference
        dayDifferences.sort((a, b) => b.difference - a.difference);

        // Determine the number of top days to highlight
        const topDaysCount = Math.min(3, dayDifferences.length);

        // Take top N days with the highest difference
        const topSelectedDays = dayDifferences.slice(0, topDaysCount).map(day => day.dateKey);

        setTopDays(topSelectedDays);
      } else {
        // Not enough data to highlight top days
        setTopDays([]);
      }
    };

    computeTopDays();
  }, [currentMonthDate, data, avgData]);

  const handleMonthChange = (newMonth: Date) => {
    const formattedMonth = format(newMonth, 'yyyy-MM');
    setCurrentMonthDate(newMonth);
    onMonthChange?.(formattedMonth);
  };

  type CalendarTooltipProps = TooltipProps<number, string> & {
    payload?: TooltipEntry[];
    label?: string;
    coordinate?: { x: number; y: number };
  };

  const CustomTooltip: React.FC<CalendarTooltipProps> = ({
    active,
    payload,
    label,
    coordinate,
  }) => {
    if (active && payload && payload.length) {
      const dateTime = payload[0]?.payload?.dateTime;

      let formattedDate = '';
      let formattedTime = '';

      if (dateTime) {
        formattedDate = format(dateTime, 'MMMM d, yyyy');
        formattedTime = format(dateTime, 'h:mm a');
      } else {
        const fallbackDate = new Date();
        formattedDate = format(fallbackDate, 'MMMM d, yyyy');
        formattedTime = label ?? format(fallbackDate, 'h:mm a');
      }

      return (
        <div
          className="pointer-events-none absolute rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-md"
          style={{
            left: coordinate?.x ?? 0,
            top: (coordinate?.y ?? 0) - 10,
            transform: 'translate(-50%, -100%)',
            minWidth: '220px',
            maxWidth: '280px',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center text-gray-900 dark:text-gray-100">
              <Clock className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-md font-medium">{formattedTime}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</div>
          </div>
          {payload
            .filter(
              (entry): entry is TooltipEntry => entry.name === 'value' || entry.name === 'avg'
            )
            .map((entry: TooltipEntry, index: number) => (
              <div key={index} className="mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" style={{ color: entry.color ?? '#3b82f6' }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {entry.name === 'value' ? 'Actual' : 'Avg'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {entry.value.toFixed(2)}
                  </span>
                  <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                    kWh
                  </span>
                </div>
              </div>
            ))}
        </div>
      );
    }
    return null;
  };

  const renderCalendarDays = () => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysInMonth = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth(),
      1
    ).getDay();

    // Render weekday headers
    weekdays.forEach(day =>
      days.push(
        <div
          key={day}
          className="border-b border-r border-gray-200 dark:border-gray-700 p-2 text-center font-semibold text-gray-700 dark:text-gray-300"
        >
          {day}
        </div>
      )
    );

    // Render empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"></div>
      );
    }

    // Render each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = format(
        new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day),
        'yyyy-MM-dd'
      );
      const dayData = data[dateKey] || [];
      const maxDayData = maxData[dateKey] || [];
      const avgDayData = avgData[dateKey] || [];
      const minDayData = minData[dateKey] || [];

      const dateComponents = dateKey.split('-').map(Number);
      const [yearNum, monthNum, dayNum] = dateComponents;

      const chartData: ChartData[] = dayData.map((value, index) => {
        const dateTime = new Date(yearNum, monthNum - 1, dayNum, index);
        return {
          time: format(dateTime, 'h a'),
          value,
          max: maxDayData[index] || 0,
          avg: avgDayData[index] || 0,
          min: minDayData[index] || 0,
          dateTime,
        };
      });

      // Determine background color
      let bgColor = 'bg-white dark:bg-gray-800';
      if (selectedDay === dateKey) {
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
      } else if (topDays.includes(dateKey)) {
        bgColor = 'bg-red-100 dark:bg-red-900/30';
      }

      days.push(
        <div
          key={day}
          className={`cursor-pointer border-b border-r border-gray-200 dark:border-gray-700 p-2 ${bgColor} transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20`}
          onClick={() => setSelectedDay(dateKey)}
        >
          <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{day}</div>
          <div className="h-32">
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors.actual}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="max"
                    stroke={chartColors.max}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke={chartColors.avg}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="min"
                    stroke={chartColors.min}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-600">
                No data
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderDetailedChart = () => {
    if (!selectedDay) return null;

    const dayData = data[selectedDay] || [];
    const maxDayData = maxData[selectedDay] || [];
    const avgDayData = avgData[selectedDay] || [];
    const minDayData = minData[selectedDay] || [];

    if (dayData.length === 0) {
      return (
        <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No detailed data available for {format(parse(selectedDay, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
          </div>
        </div>
      );
    }

    const selectedDateComponents = selectedDay.split('-').map(Number);
    const [yearNum, monthNum, dayNum] = selectedDateComponents;

    const chartData: ChartData[] = dayData.map((value, index) => {
      const dateTime = new Date(yearNum, monthNum - 1, dayNum, index);
      return {
        time: format(dateTime, 'h a'),
        value,
        max: maxDayData[index] || 0,
        avg: avgDayData[index] || 0,
        min: minDayData[index] || 0,
        dateTime,
      };
    });

    return (
      <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detailed View for {format(parse(selectedDay, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
              />
              <XAxis 
                dataKey="time" 
                stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Actual"
                stroke={chartColors.actual}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="max"
                name="Max"
                stroke={chartColors.max}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avg"
                name="Avg"
                stroke={chartColors.avg}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="min"
                name="Min"
                stroke={chartColors.min}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value;
    const newDate = new Date(currentMonthDate.getFullYear(), parseInt(month), 1);
    handleMonthChange(newDate);
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    const newDate = new Date(parseInt(year), currentMonthDate.getMonth(), 1);
    handleMonthChange(newDate);
  };

  return (
    <div className="w-full">
      {/* Header with navigation */}
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() =>
              handleMonthChange(
                new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </button>
          <select
            value={currentMonthDate.getMonth().toString()}
            onChange={handleMonthSelect}
            className="w-[130px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index.toString()}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={currentMonthDate.getFullYear().toString()}
            onChange={handleYearSelect}
            className="w-[90px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            {YEARS.map(year => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
          <button
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() =>
              handleMonthChange(
                new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <span className="block h-4 w-4 rounded" style={{ backgroundColor: chartColors.actual }}></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Daily Profile:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Energy usage for every hour of the day.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="block h-4 w-4 rounded border-2 border-dashed" style={{ borderColor: chartColors.max }}></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Maximum:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Highest consumption at each hour.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="block h-4 w-4 rounded border-2 border-dashed" style={{ borderColor: chartColors.avg }}></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Average:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average consumption at each hour.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="block h-4 w-4 rounded border-2 border-dashed" style={{ borderColor: chartColors.min }}></span>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Minimum:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Lowest consumption at each hour.</p>
          </div>
        </div>
      </div>

      {/* Top days notice */}
      {topDays.length === 0 && (
        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Not enough data to highlight top consumption days.
        </div>
      )}
      {topDays.length > 0 && (
        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 mr-1"></span>
          Days with highest consumption above average are highlighted in red.
        </div>
      )}

      {/* Detailed chart */}
      {renderDetailedChart()}
    </div>
  );
};

export default CalendarChart;

