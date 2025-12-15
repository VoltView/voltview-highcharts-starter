import { format, startOfMonth, endOfMonth, subMonths, subYears, getDaysInMonth, eachDayOfInterval } from 'date-fns';
import type { ConsumptionData, CostData, LoadCurveApiResponse, LoadCurveData, CalendarChartData } from '@/types';

// ---------------------------------------------------------------------------
// Monthly demo patterns (used when no API key is configured)
// ---------------------------------------------------------------------------

const SEASONAL_PATTERNS = {
  0:  { electricity: 45000, gas: 28000 },
  1:  { electricity: 42000, gas: 25000 },
  2:  { electricity: 38000, gas: 18000 },
  3:  { electricity: 35000, gas: 12000 },
  4:  { electricity: 32000, gas: 8000  },
  5:  { electricity: 38000, gas: 5000  },
  6:  { electricity: 42000, gas: 4000  },
  7:  { electricity: 44000, gas: 4500  },
  8:  { electricity: 40000, gas: 8000  },
  9:  { electricity: 38000, gas: 15000 },
  10: { electricity: 43000, gas: 22000 },
  11: { electricity: 48000, gas: 30000 },
} as const;

/**
 * Generate realistic-looking monthly demo data using the seasonal patterns above.
 *
 * Dates:
 * - Uses the current month as "now" and goes back 11 months (1 year rolling window).
 * - This means demo data never looks stale even though the values are constant patterns.
 *
 * Costs:
 * - Electricity: 21p/kWh (0.21)
 * - Gas: 4.5p/kWh (0.045)
 * - Costs are computed from kWh volumes and rounded to 2 decimal places.
 */
export function generateMonthlyDemoData(): { consumption: ConsumptionData[]; cost: CostData[] } {
  const consumption: ConsumptionData[] = [];
  const cost: CostData[] = [];
  const today = new Date();

  // Tariffs used for demo cost calculation (p/kWh)
  const ELECTRICITY_TARIFF = 0.21; // 21p/kWh
  const GAS_TARIFF = 0.045; // 4.5p/kWh

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

    // Compute costs from kWh volumes using explicit tariffs
    const electricityCost = pattern.electricity * ELECTRICITY_TARIFF;
    const gasCost = pattern.gas * GAS_TARIFF;

    cost.push({
      date: dateStr,
      electricity: Number(electricityCost.toFixed(2)),
      gas: Number(gasCost.toFixed(2)),
    });
  }

  return { consumption, cost };
}

// ---------------------------------------------------------------------------
// Load curve demo patterns (used when no API key is configured)
// ---------------------------------------------------------------------------

type SummaryLevel = LoadCurveApiResponse['summaryLevel'];

function getDefaultLoadCurveDates() {
  const now = new Date();
  const oneYearAgo = subYears(now, 1);

  return {
    from: format(oneYearAgo, 'yyyy-MM-dd'),
    to: format(now, 'yyyy-MM-dd'),
  };
}

/**
 * Canonical 24-hour load shape derived from averaging real VoltView day-of-week curves.
 *
 * Pattern:
 * - Night (00-04): Low baseline (~12-14 kWh)
 * - Morning ramp (05-09): Sharp increase to peak (~18-22 kWh)
 * - Midday plateau (10-14): Broad high period (~20-23 kWh)
 * - Afternoon/evening (15-20): Secondary bump (~19-22 kWh)
 * - Late evening (21-23): Decline back to baseline (~13-15 kWh)
 *
 * This base shape is scaled by seasonal/day-type factors for different summary levels.
 */
const BASE_DAY_LOAD_SHAPE: number[] = [
  12.9, 12.9, 13.9, 14.5, 14.2, 15.9, 18.4, 21.8, 21.2, 21.9, 21.6, 23.2,
  20.7, 16.1, 15.0, 19.2, 21.9, 19.0, 16.1, 15.3, 14.7, 14.1, 13.5, 12.8,
];

/**
 * Day-of-week scaling factors derived from real VoltView dayOfWeek load curve data.
 *
 * Computed by averaging mean kWh per day-of-week profile and normalizing to Monday = 1.0.
 * Pattern: Weekdays similar (~1.0-1.05), Friday slightly higher, Sunday noticeably lower.
 */
const DAY_OF_WEEK_SCALE: Record<string, number> = {
  Monday: 1.0,
  Tuesday: 1.02,
  Wednesday: 1.01,
  Thursday: 1.0,
  Friday: 1.05,
  Saturday: 0.95,
  Sunday: 0.88,
};

/**
 * Week-of-year scaling factors inspired by real VoltView week load curve data.
 *
 * Derived from computing mean kWh per week profile and mapping into seasonal bands:
 * - Winter weeks: ~1.15 (higher demand)
 * - Shoulder weeks: ~1.0 (typical)
 * - Summer weeks: ~0.85-0.95 (lower demand)
 */
const WEEK_SCALE: number[] = [
  1.15, // Week 1 – higher demand (e.g. winter / busy period)
  1.0,  // Week 2 – typical
  0.85, // Week 3 – lower demand
  0.95, // Week 4 – slightly below typical
];

/**
 * Month-of-year scaling factors derived from real VoltView month load curve data.
 *
 * Computed by averaging mean kWh per 24-hour profile for each month and normalizing to mean 1.0.
 * Clear seasonality: Winter (Dec-Feb) ~1.15-1.25, Summer (Jun-Aug) ~0.75-0.80, Shoulder ~0.85-1.10.
 */
const MONTH_SCALE: number[] = [
  1.25, // Jan
  1.20, // Feb
  1.10, // Mar
  1.00, // Apr
  0.90, // May
  0.80, // Jun
  0.75, // Jul
  0.78, // Aug
  0.85, // Sep
  0.95, // Oct
  1.05, // Nov
  1.15, // Dec
];

/**
 * Day-type scaling factors inspired by variance in real VoltView day-level load curve data.
 *
 * Represents archetypal day types:
 * - High-demand weekday: ~1.20 (events, cold snaps)
 * - Typical weekday: ~1.00
 * - Weekend: ~0.90
 * - Holiday/low-demand: ~0.85
 */
const DAY_TYPE_SCALE: number[] = [
  1.20, // Day 1 – high demand day
  1.00, // Day 2 – typical weekday
  0.90, // Day 3 – weekend
  0.85, // Day 4 – holiday / low demand
];

/**
 * Year-level scaling factors derived from real VoltView year load curve data.
 *
 * Computed from mean kWh per year profile. Typically 1-2 years in a rolling window.
 */
const YEAR_SCALE: number[] = [
  1.0,  // Year 1
];

/**
 * Deterministic pseudo-random helper for adding reproducible variation without storing seeds.
 *
 * Returns a number in [0, 1) based on a hash of the input string.
 * Used to add smooth, low-amplitude noise to load curves so series differ realistically.
 */
function hashToUnit(name: string, hour: number, context: string): number {
  let hash = 0;
  const str = `${name}-${hour}-${context}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000; // 0–0.999
}

/**
 * Circularly shift an array by n positions (positive = right, negative = left).
 * Used to slightly shift peak timings for realistic variation.
 */
function shiftArray<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return arr;
  const shift = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(-shift), ...arr.slice(0, -shift)];
}

/**
 * Generate demo load curve data using profiles derived from real VoltView data.
 *
 * Approach:
 * - Uses a single canonical 24-hour BASE_DAY_LOAD_SHAPE derived from averaging real day-of-week curves
 * - Scales this base shape by seasonal/day-type factors (DAY_OF_WEEK_SCALE, MONTH_SCALE, etc.)
 * - Adds deterministic noise and occasional peak-time shifts for realistic variation
 *
 * Electricity:
 * - Base shape captures the core pattern: night low → morning peak → midday plateau → evening bump
 * - Scaled differently per summary level to reflect seasonality and day-type differences
 * - Small noise added per series/hour (smaller at night) so curves don't overlap perfectly
 * - Low-probability peak shifts (±1 hour) mimic real timing variations
 *
 * Gas:
 * - Real load-curve gas is currently zero in VoltView API responses
 * - Synthesised as a modest fraction of electricity (10-18% depending on season)
 * - Higher ratio in winter, lower in summer, always secondary to electricity
 */
export function generateDemoLoadCurve(summaryLevel: SummaryLevel): LoadCurveApiResponse {
  const baseNames: Record<SummaryLevel, string[]> = {
    year: ['Year 1'],
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    week: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    day: ['Day 1', 'Day 2', 'Day 3', 'Day 4'],
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };

  const names = baseNames[summaryLevel];

  const series: LoadCurveData[] = names.map((name, index) => {
    let scale = 1;

    if (summaryLevel === 'dayOfWeek') {
      scale = DAY_OF_WEEK_SCALE[name] ?? 1;
    } else if (summaryLevel === 'week') {
      scale = WEEK_SCALE[index] ?? 1;
    } else if (summaryLevel === 'month') {
      scale = MONTH_SCALE[index] ?? 1;
    } else if (summaryLevel === 'day') {
      scale = DAY_TYPE_SCALE[index] ?? 1;
    } else if (summaryLevel === 'year') {
      scale = YEAR_SCALE[index] ?? 1;
    }

    // Base electricity profile scaled for this series
    let baseElectricity = BASE_DAY_LOAD_SHAPE.map(v => v * scale);

    // Occasionally shift peak timing by ±1 hour (low probability, deterministic)
    // This mimics real variations where peaks move slightly from week to week
    const shiftHash = hashToUnit(name, 0, `${summaryLevel}-shift`);
    if (shiftHash < 0.15) {
      // 15% chance of shifting
      const shiftDirection = hashToUnit(name, 1, `${summaryLevel}-shift`) < 0.5 ? -1 : 1;
      baseElectricity = shiftArray(baseElectricity, shiftDirection);
    }

    // Add smooth, low-amplitude variation per series and hour.
    // Higher noise for day-level (more variability), lower for aggregated levels.
    const noiseAmplitude =
      summaryLevel === 'day' ? 0.06 :
      summaryLevel === 'week' ? 0.05 :
      summaryLevel === 'month' ? 0.04 :
      summaryLevel === 'dayOfWeek' ? 0.03 :
      0.03;

    const electricity = baseElectricity.map((v, hour) => {
      const n = hashToUnit(name, hour, summaryLevel) * 2 - 1; // -1..1
      // Smaller variance at night than during peak hours (6-20)
      const hourWeight = hour >= 6 && hour <= 20 ? 1 : 0.5;
      const adjusted = v * (1 + n * noiseAmplitude * hourWeight);
      return Number(Math.max(0, adjusted).toFixed(2));
    });

    // Synthesise gas as a fraction of electricity so demos have believable but smaller gas usage.
    // Vary ratio by season: higher in winter (more heating), lower in summer.
    let baseGasRatio = 0.14;
    if (summaryLevel === 'month') {
      const monthFactor = MONTH_SCALE[index] ?? 1;
      // Higher gas ratio in winter, lower in summer
      // Range: ~0.18 (winter) to ~0.12 (summer)
      baseGasRatio = 0.10 + 0.08 * monthFactor;
    } else if (summaryLevel === 'week') {
      // Use week scale as proxy for season
      const weekFactor = WEEK_SCALE[index] ?? 1;
      baseGasRatio = 0.10 + 0.08 * weekFactor;
    }

    // Ensure gas never exceeds electricity and remains visually secondary
    const gas = electricity.map(v => Number(Math.min(v, v * baseGasRatio).toFixed(2)));

    return {
      name,
      electricity,
      gas,
    };
  });

  const { from, to } = getDefaultLoadCurveDates();
  const key =
    summaryLevel === 'year'
      ? 'years'
      : summaryLevel === 'month'
      ? 'months'
      : summaryLevel === 'week'
      ? 'weeks'
      : summaryLevel === 'day'
      ? 'days'
      : 'daysOfWeek';

  return {
    summaryLevel,
    from,
    to,
    [key]: series,
  } as LoadCurveApiResponse;
}

// ---------------------------------------------------------------------------
// Calendar Chart demo data (used when no API key is configured)
// ---------------------------------------------------------------------------

/**
 * Day-of-week scaling factors for calendar demo data.
 * Weekdays have higher consumption, weekends are lower.
 */
const CALENDAR_DAY_OF_WEEK_SCALE: Record<number, number> = {
  0: 0.85, // Sunday
  1: 1.0,  // Monday
  2: 1.02, // Tuesday
  3: 1.01, // Wednesday
  4: 1.0,  // Thursday
  5: 1.05, // Friday
  6: 0.90, // Saturday
};

/**
 * Generate realistic-looking hourly consumption data for a calendar month.
 *
 * Pattern:
 * - Uses BASE_DAY_LOAD_SHAPE as the base 24-hour pattern
 * - Scales by day-of-week (weekdays higher, weekends lower)
 * - Scales by month (seasonal variation)
 * - Adds noise for realistic variation between days
 *
 * @param month - Format 'YYYY-MM'
 * @returns CalendarChartData with data, maxData, avgData, minData
 */
export function generateCalendarDemoData(month: string): CalendarChartData {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = startOfMonth(new Date(year, monthNum - 1));
  const endDate = endOfMonth(startDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const data: { [date: string]: number[] } = {};
  const monthIndex = monthNum - 1; // 0-indexed
  const monthScale = MONTH_SCALE[monthIndex] ?? 1;

  // Generate hourly data for each day
  days.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();
    const dayScale = CALENDAR_DAY_OF_WEEK_SCALE[dayOfWeek] ?? 1;

    // Generate 24 hours of data
    const hourlyData = BASE_DAY_LOAD_SHAPE.map((baseValue, hour) => {
      // Apply seasonal and day-of-week scaling
      let value = baseValue * monthScale * dayScale;

      // Add noise for realistic variation (±10%)
      const noise = hashToUnit(dateKey, hour, 'calendar') * 0.2 - 0.1;
      value = value * (1 + noise);

      return Number(Math.max(0, value).toFixed(2));
    });

    data[dateKey] = hourlyData;
  });

  // Calculate max, avg, and min data across all days
  const maxData: { [date: string]: number[] } = {};
  const avgData: { [date: string]: number[] } = {};
  const minData: { [date: string]: number[] } = {};

  const dateKeys = Object.keys(data);

  dateKeys.forEach((dateKey) => {
    maxData[dateKey] = Array(24).fill(0);
    avgData[dateKey] = Array(24).fill(0);
    minData[dateKey] = Array(24).fill(0);

    for (let hour = 0; hour < 24; hour++) {
      const hourlyValues = dateKeys
        .map((dk) => data[dk][hour])
        .filter((val) => val > 0);

      if (hourlyValues.length > 0) {
        maxData[dateKey][hour] = Number(Math.max(...hourlyValues).toFixed(2));
        avgData[dateKey][hour] = Number(
          (hourlyValues.reduce((sum, val) => sum + val, 0) / hourlyValues.length).toFixed(2)
        );
        minData[dateKey][hour] = Number(Math.min(...hourlyValues).toFixed(2));
      }
    }
  });

  return {
    data,
    maxData,
    avgData,
    minData,
    currentMonth: month,
  };
}


