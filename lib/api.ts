import { AuthResponse, ConsumptionData, CostData } from '@/types';

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

export async function getMonthlyConsumption(
  from: string,
  to: string
): Promise<ConsumptionData[]> {
  const response = await apiRequest<{ data: ConsumptionData[] }>(
    `/v1/sites/timeSeries?from=${from}&to=${to}&granularity=month&unit=kWh`
  );
  return response.data;
}

export async function getMonthlyCosts(
  from: string,
  to: string
): Promise<CostData[]> {
  const response = await apiRequest<{ data: CostData[] }>(
    `/v1/sites/cost?from=${from}&to=${to}&granularity=month`
  );
  return response.data;
}

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
