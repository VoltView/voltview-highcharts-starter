// VoltView API Types

export interface ConsumptionData {
  timestamp: string;
  electricity: string | number;
  gas: string | number | null;
  measurementTypeElectricity: string;
  measurementTypeGas: string;
}

export interface CostData {
  date: string;
  electricity: number;
  gas: number;
}

export interface TimeSeriesData {
  timestamp: string;
  electricity: string | null;
  gas: string | null;
}

export interface LoadCurveData {
  name: string;
  electricity: number[];
  gas: number[];
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
