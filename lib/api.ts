import { AuthResponse, ConsumptionData, CostData } from '@/types';

const API_URL = process.env.VOLTVIEW_API_URL || 'https://api.voltview.co.uk';

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

/**
 * Authenticate with the VoltView API and get a JWT token.
 * Tokens are cached and reused until they expire.
 */
export async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  const email = process.env.VOLTVIEW_API_EMAIL;
  const password = process.env.VOLTVIEW_API_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing VOLTVIEW_API_EMAIL or VOLTVIEW_API_PASSWORD environment variables'
    );
  }

  const response = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data: AuthResponse = await response.json();
  cachedToken = data.token;
  tokenExpiry = new Date(data.expiresAt);

  return cachedToken;
}

/**
 * Make an authenticated request to the VoltView API
 */
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

/**
 * Fetch monthly energy consumption data for all sites
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getMonthlyConsumption(
  from: string,
  to: string
): Promise<ConsumptionData[]> {
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `/consumption/time-series?from=${from}&to=${to}&granularity=month`
  );
  return response.data;
}

/**
 * Fetch energy cost data for all sites
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getMonthlyCosts(
  from: string,
  to: string
): Promise<CostData[]> {
  const response = await apiRequest<{ data: CostData[] }>(
    `/sites/energy-cost?from=${from}&to=${to}&granularity=month`
  );
  return response.data;
}

/**
 * Fetch consumption data for a specific site
 * @param siteId - The site ID
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param granularity - Data granularity (hour, day, week, month)
 */
export async function getSiteConsumption(
  siteId: string,
  from: string,
  to: string,
  granularity: 'hour' | 'day' | 'week' | 'month' = 'month'
): Promise<ConsumptionData[]> {
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `/consumption/time-series/${siteId}?from=${from}&to=${to}&granularity=${granularity}`
  );
  return response.data;
}
