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
  electricityCost: number;
  gasCost: number;
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
  token: string;
  expiresAt: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
