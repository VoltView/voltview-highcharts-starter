// VoltView API Types
//
// These types are shared between the API helpers in lib/api.ts and the
// chart components in components/charts/*.tsx. When copying a chart into
// your own app, copy the matching types and helpers as well.

// Used by MonthlyEnergyChart – monthly kWh per timestamp for electricity + gas
export interface ConsumptionData {
  timestamp: string;
  electricity: string | number;
  gas: string | number | null;
  measurementTypeElectricity: string;
  measurementTypeGas: string;
}

// Used by MonthlyEnergyChart – monthly total cost per timestamp
export interface CostData {
  date: string;
  electricity: number;
  gas: number;
}

// Generic time-series shape for other potential charts
export interface TimeSeriesData {
  timestamp: string;
  electricity: string | null;
  gas: string | null;
}

// Used by LoadCurveChart – one series (e.g. Monday) with 24 hourly values
export interface LoadCurveData {
  name: string;
  electricity: number[];
  gas: number[];
}

// Response shape from the VoltView /loadCurve endpoints,
// grouped by the chosen summaryLevel.
export interface LoadCurveApiResponse {
  summaryLevel: 'year' | 'month' | 'week' | 'day' | 'dayOfWeek';
  from: string;
  to: string;
  years?: LoadCurveData[];
  months?: LoadCurveData[];
  weeks?: LoadCurveData[];
  days?: LoadCurveData[];
  daysOfWeek?: LoadCurveData[];
}

export interface AuthResponse {
  id: string;
  email: string;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
