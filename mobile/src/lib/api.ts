import * as SecureStore from 'expo-secure-store';
import { createClient } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.afribook.com';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const { data } = await createClient().auth.getSession();
      if (data.session?.access_token) return data.session.access_token;
    } catch {
      // fall through to the legacy SecureStore key
    }
    return SecureStore.getItemAsync('afribook-token');
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async throwResponseError(method: string, path: string, res: Response): Promise<never> {
    let message = `${method} ${path} failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'GET', headers });
    if (!res.ok) await this.throwResponseError('GET', path, res);
    return res.json();
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) await this.throwResponseError('POST', path, res);
    return res.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) await this.throwResponseError('PUT', path, res);
    return res.json();
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) await this.throwResponseError('DELETE', path, res);
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);
