import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/payments/db', () => ({ createPaymentDb: vi.fn() }));

import { MpesaProvider } from '@/lib/payments/providers/mpesa-provider';

type FetchResponse = { ok: boolean; status?: number; body: unknown };

function stubFetch(stkResponse: FetchResponse) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/oauth/v1/generate')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'test-token' }) };
    }
    return {
      ok: stkResponse.ok,
      status: stkResponse.status ?? (stkResponse.ok ? 200 : 500),
      json: async () => stkResponse.body,
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('M-Pesa STK status verification', () => {
  beforeEach(() => {
    vi.stubEnv('MPESA_CONSUMER_KEY', 'key');
    vi.stubEnv('MPESA_CONSUMER_SECRET', 'secret');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reports succeeded only when Daraja returns ResultCode 0', async () => {
    stubFetch({ ok: true, body: { ResultCode: '0', ResultDesc: 'processed successfully' } });
    const provider = new MpesaProvider('KE');
    await expect(provider.getTransactionStatus('ws_CO_1')).resolves.toBe('succeeded');
  });

  it('reports failed for a terminal ResultCode such as customer cancellation', async () => {
    stubFetch({ ok: true, body: { ResultCode: '1032', ResultDesc: 'Request cancelled by user' } });
    const provider = new MpesaProvider('KE');
    await expect(provider.getTransactionStatus('ws_CO_1')).resolves.toBe('failed');
  });

  it('keeps non-terminal ResultCodes as processing', async () => {
    stubFetch({ ok: true, body: { ResultCode: '4999', ResultDesc: 'still under processing' } });
    const provider = new MpesaProvider('KE');
    await expect(provider.getTransactionStatus('ws_CO_1')).resolves.toBe('processing');
  });

  it('treats an error envelope with no ResultCode as processing, not success', async () => {
    stubFetch({
      ok: false,
      status: 500,
      body: { errorCode: '500.001.1001', errorMessage: 'The transaction is being processed' },
    });
    const provider = new MpesaProvider('KE');
    await expect(provider.getTransactionStatus('ws_CO_1')).resolves.toBe('processing');
  });

  it('sends the CheckoutRequestID to the STK query endpoint with a bearer token', async () => {
    const calls = stubFetch({ ok: true, body: { ResultCode: '0' } });
    const provider = new MpesaProvider('KE');
    await provider.getTransactionStatus('ws_CO_42');

    const query = calls.find((c) => c.url.includes('/mpesa/stkpushquery/v1/query'));
    expect(query).toBeDefined();
    expect((query!.init!.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect(JSON.parse(query!.init!.body as string).CheckoutRequestID).toBe('ws_CO_42');
  });

  it('propagates network failures so the orchestrator can fall back to local status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));
    const provider = new MpesaProvider('KE');
    await expect(provider.getTransactionStatus('ws_CO_1')).rejects.toThrow('network down');
  });
});
