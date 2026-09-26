import { describe, it, expect, vi, beforeEach } from 'vitest'

// The orchestrator touches the DB (via createPaymentDb -> @/lib/neon/server)
// only to persist/look up transaction records; none of that matters for
// routing logic, so stub it to a quiet no-op client rather than pull in a
// real Neon connection.
vi.mock('@/lib/neon/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
      }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
      insert: async () => ({ data: null, error: null }),
    }),
  }),
}))

import { PaymentOrchestrator } from '@/lib/payments/orchestrator'
import type { PaymentProvider, PaymentRequest, PaymentResult } from '@/lib/payments/types'

function stubProvider(code: string, impl: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    code,
    name: code,
    supportedCountries: ['NG'],
    supportedMethods: ['card'],
    initialize: vi.fn(async () => {}),
    processPayment: vi.fn(async () => ({ success: true, transactionId: `${code}_tx`, status: 'succeeded' }) as PaymentResult),
    processRefund: vi.fn(),
    processPayout: vi.fn(),
    getTransactionStatus: vi.fn(),
    verifyWebhook: vi.fn(),
    calculateFees: vi.fn(() => ({ platformFee: 0, providerFee: 0, total: 0 }) as any),
    ...impl,
  } as PaymentProvider
}

function baseRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    amount: 5000,
    currency: 'NGN',
    countryCode: 'NG',
    method: 'card',
    metadata: {},
    customer: { email: 'buyer@example.com', name: 'Buyer' },
    description: 'test charge',
    ...overrides,
  }
}

// NG's real preference order is paystack -> flutterwave -> pawapay
// (COUNTRY_PROVIDER_MAP in src/lib/payments/types.ts).

describe('PaymentOrchestrator.processPayment — cross-provider failover', () => {
  let orchestrator: PaymentOrchestrator

  beforeEach(() => {
    orchestrator = new PaymentOrchestrator()
  })

  it('falls through to the next provider when the first one throws', async () => {
    const paystack = stubProvider('paystack', {
      processPayment: vi.fn(async () => { throw new Error('network timeout') }),
    })
    const flutterwave = stubProvider('flutterwave', {
      processPayment: vi.fn(async () => ({ success: true, transactionId: 'fw_tx', status: 'succeeded' }) as PaymentResult),
    })
    orchestrator.registerProvider('paystack', paystack)
    orchestrator.registerProvider('flutterwave', flutterwave)

    const result = await orchestrator.processPayment(baseRequest())

    expect(result.success).toBe(true)
    expect(result.transactionId).toBe('fw_tx')
    // Retried the failing provider 3x before moving on, not just once.
    expect(paystack.processPayment).toHaveBeenCalledTimes(3)
    expect(flutterwave.processPayment).toHaveBeenCalledTimes(1)
  })

  it('falls through when a provider returns a structured failure without throwing', async () => {
    const paystack = stubProvider('paystack', {
      processPayment: vi.fn(async () => ({ success: false, transactionId: '', status: 'failed', error: 'invalid request' }) as PaymentResult),
    })
    const flutterwave = stubProvider('flutterwave', {
      processPayment: vi.fn(async () => ({ success: true, transactionId: 'fw_tx', status: 'succeeded' }) as PaymentResult),
    })
    orchestrator.registerProvider('paystack', paystack)
    orchestrator.registerProvider('flutterwave', flutterwave)

    const result = await orchestrator.processPayment(baseRequest())

    expect(result.success).toBe(true)
    expect(result.transactionId).toBe('fw_tx')
  })

  it('throws the last error when every provider for the country fails', async () => {
    const paystack = stubProvider('paystack', {
      processPayment: vi.fn(async () => { throw new Error('paystack down') }),
    })
    const flutterwave = stubProvider('flutterwave', {
      processPayment: vi.fn(async () => { throw new Error('flutterwave down') }),
    })
    orchestrator.registerProvider('paystack', paystack)
    orchestrator.registerProvider('flutterwave', flutterwave)

    await expect(orchestrator.processPayment(baseRequest())).rejects.toThrow('flutterwave down')
  }, 15000) // real retry backoff (2 providers x 3 attempts) exceeds the 5s default

  it('skips a registered provider that does not support the requested method', async () => {
    const paystack = stubProvider('paystack', { supportedMethods: ['bank_transfer'] as any })
    const flutterwave = stubProvider('flutterwave', {
      supportedMethods: ['card'] as any,
      processPayment: vi.fn(async () => ({ success: true, transactionId: 'fw_tx', status: 'succeeded' }) as PaymentResult),
    })
    orchestrator.registerProvider('paystack', paystack)
    orchestrator.registerProvider('flutterwave', flutterwave)

    const result = await orchestrator.processPayment(baseRequest({ method: 'card' }))

    expect(result.transactionId).toBe('fw_tx')
    expect(paystack.processPayment).not.toHaveBeenCalled()
  })

  it('respects country provider ordering — tries paystack before flutterwave', async () => {
    const calls: string[] = []
    const paystack = stubProvider('paystack', {
      processPayment: vi.fn(async () => { calls.push('paystack'); return { success: true, transactionId: 'ps_tx', status: 'succeeded' } as PaymentResult }),
    })
    const flutterwave = stubProvider('flutterwave', {
      processPayment: vi.fn(async () => { calls.push('flutterwave'); return { success: true, transactionId: 'fw_tx', status: 'succeeded' } as PaymentResult }),
    })
    orchestrator.registerProvider('flutterwave', flutterwave) // registered out of order on purpose
    orchestrator.registerProvider('paystack', paystack)

    const result = await orchestrator.processPayment(baseRequest())

    expect(result.transactionId).toBe('ps_tx')
    expect(calls).toEqual(['paystack'])
  })
})
