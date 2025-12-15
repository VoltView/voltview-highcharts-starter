import { AuthResponse, ConsumptionData, CostData, LoadCurveApiResponse } from '@/types';

/**
 * VoltView API client helpers
 *
 * This file contains small, copy-pasteable helpers for calling the VoltView API.
 * Each chart in components/charts/ maps to a small group of functions here.
 *
 * Authentication:
 * - Uses VOLTVIEW_API_KEY (and optional VOLTVIEW_USER_ID / VOLTVIEW_USER_EMAIL)
 * - Requests a short-lived JWT via POST /v1/requestToken
 * - Caches the token in-memory until expiry
 */

const API_URL = process.env.VOLTVIEW_API_URL || 'https://api.voltview.co.uk';

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

function decodeJWT(token: string): { exp?: number } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

/**
 * Low-level helper: fetches and caches a VoltView JWT using your API key.
 *
 * Endpoint:
 *   POST /v1/requestToken
 * Headers:
 *   x-api-key: VOLTVIEW_API_KEY
 */
export async function getAuthToken(): Promise<string> {
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  const apiKey = process.env.VOLTVIEW_API_KEY;
  const userId = process.env.VOLTVIEW_USER_ID;
  const userEmail = process.env.VOLTVIEW_USER_EMAIL;

  if (!apiKey) {
    throw new Error('Missing VOLTVIEW_API_KEY environment variable');
  }

  const body: { id?: string; email?: string } = {};
  if (userId) body.id = userId;
  if (userEmail) body.email = userEmail;

  const response = await fetch(`${API_URL}/v1/requestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data: AuthResponse = await response.json();
  cachedToken = data.token;

  const decoded = decodeJWT(data.token);
  if (decoded.exp) {
    tokenExpiry = new Date(decoded.exp * 1000);
  } else {
    tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  }

  return cachedToken;
}

async function apiRequest<T>(endpoint: string): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

type SummaryLevel = 'year' | 'month' | 'week' | 'day' | 'dayOfWeek';

// ---------------------------------------------------------------------------
// Monthly Energy Consumption and Cost (used by MonthlyEnergyChart)
// ---------------------------------------------------------------------------

/**
 * Fetch monthly electricity + gas consumption (kWh) for all sites.
 *
 * VoltView endpoint:
 *   GET /v1/sites/timeSeries
 * Query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   granularity     'month'
 *   unit            'kWh'
 *
 * Example URL:
 *   /v1/sites/timeSeries?from=2025-01-01&to=2025-12-31&granularity=month&unit=kWh
 */
export async function getMonthlyConsumption(
  from: string,
  to: string
): Promise<ConsumptionData[]> {
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `/v1/sites/timeSeries?from=${from}&to=${to}&granularity=month&unit=kWh`
  );
  return response.data;
}

/**
 * Fetch monthly total energy cost (currency) for all sites.
 *
 * VoltView endpoint:
 *   GET /v1/sites/cost
 * Query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   granularity     'month'
 *
 * Example URL:
 *   /v1/sites/cost?from=2025-01-01&to=2025-12-31&granularity=month
 */
export async function getMonthlyCosts(
  from: string,
  to: string
): Promise<CostData[]> {
  const response = await apiRequest<{ data: CostData[] }>(
    `/v1/sites/cost?from=${from}&to=${to}&granularity=month`
  );
  return response.data;
}

/**
 * Fetch time series consumption (kWh) for a specific site.
 *
 * VoltView endpoint:
 *   GET /v1/sites/{siteId}/timeSeries
 * Query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   granularity     'hour' | 'day' | 'week' | 'month'
 *   unit            'kWh'
 */
export async function getSiteConsumption(
  siteId: string,
  from: string,
  to: string,
  granularity: 'hour' | 'day' | 'week' | 'month' = 'month'
): Promise<ConsumptionData[]> {
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `/v1/sites/${siteId}/timeSeries?from=${from}&to=${to}&granularity=${granularity}&unit=kWh`
  );
  return response.data;
}

/**
 * Fetch time series costs for a specific site.
 *
 * VoltView endpoint:
 *   GET /v1/sites/{siteId}/cost
 * Query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   granularity     'hour' | 'day' | 'week' | 'month'
 */
export async function getSiteCosts(
  siteId: string,
  from: string,
  to: string,
  granularity: 'hour' | 'day' | 'week' | 'month' = 'month'
): Promise<CostData[]> {
  const response = await apiRequest<{ data: CostData[] }>(
    `/v1/sites/${siteId}/cost?from=${from}&to=${to}&granularity=${granularity}`
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Load Curve (used by LoadCurveChart)
// ---------------------------------------------------------------------------

/**
 * Fetch load curve data (average kWh by hour of day) for all sites or a single site.
 *
 * VoltView endpoints:
 *   GET /v1/sites/loadCurve
 *   GET /v1/sites/{siteId}/loadCurve
 *
 * Required query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   summaryLevel    'year' | 'month' | 'week' | 'day' | 'dayOfWeek'
 *
 * Optional:
 *   utility         'ELECTRICITY' | 'GAS'
 *
 * Example URL:
 *   /v1/sites/loadCurve?from=2025-01-01&to=2025-12-31&summaryLevel=dayOfWeek
 */
export async function getLoadCurveData({
  from,
  to,
  summaryLevel = 'dayOfWeek',
  utility,
  siteId,
}: {
  from: string;
  to: string;
  summaryLevel?: SummaryLevel;
  utility?: 'ELECTRICITY' | 'GAS';
  siteId?: string;
}): Promise<LoadCurveApiResponse> {
  const params = new URLSearchParams({
    from,
    to,
    summaryLevel,
  });

  if (utility) {
    params.set('utility', utility);
  }

  const basePath = siteId ? `/v1/sites/${siteId}/loadCurve` : '/v1/sites/loadCurve';
  const endpoint = `${basePath}?${params.toString()}`;

  return apiRequest<LoadCurveApiResponse>(endpoint);
}

// ---------------------------------------------------------------------------
// Calendar Chart (used by CalendarChart)
// ---------------------------------------------------------------------------

/**
 * Fetch hourly electricity consumption (kWh) for all sites or a specific site.
 *
 * VoltView endpoint:
 *   GET /v1/sites/timeSeries
 *   GET /v1/sites/{siteId}/timeSeries
 * Query params:
 *   from, to        ISO date strings (yyyy-MM-dd)
 *   granularity     'hour'
 *   unit            'kWh'
 *
 * Example URL:
 *   /v1/sites/timeSeries?from=2025-01-01&to=2025-01-31&granularity=hour&unit=kWh
 */
export async function getHourlyConsumption(
  from: string,
  to: string,
  siteId?: string
): Promise<ConsumptionData[]> {
  const basePath = siteId ? `/v1/sites/${siteId}/timeSeries` : '/v1/sites/timeSeries';
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `${basePath}?from=${from}&to=${to}&granularity=hour&unit=kWh`
  );
  return response.data;
}

