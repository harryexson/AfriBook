import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.afribook.com';

export { API_BASE };

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('afribook-token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'GET', headers });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);
