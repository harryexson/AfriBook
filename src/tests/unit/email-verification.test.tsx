// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import PhoneVerification from '@/components/shared/PhoneVerification'
import { describeAuthError } from '@/lib/auth-error'

afterEach(cleanup)

describe('email verification', () => {
  it('preserves errors returned as plain SDK objects', () => {
    expect(describeAuthError({ message: 'The code has expired' })).toBe('The code has expired')
  })

  it('blocks duplicate submissions while verification is pending', async () => {
    let finish!: () => void
    const verify = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    render(<PhoneVerification destination="test@example.invalid" channel="email" onVerify={verify} onResend={vi.fn()} />)
    screen.getAllByRole('textbox').forEach((input, i) => fireEvent.change(input, { target: { value: String(i + 1) } }))
    const button = screen.getByRole('button', { name: /verify/i })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(verify).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    finish()
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it('shows verification errors and allows a retry', async () => {
    const verify = vi.fn().mockRejectedValue(new Error('The code has expired'))
    render(<PhoneVerification destination="test@example.invalid" channel="email" onVerify={verify} onResend={vi.fn()} />)
    screen.getAllByRole('textbox').forEach((input, i) => fireEvent.change(input, { target: { value: String(i + 1) } }))
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => expect(screen.getByText('The code has expired')).toBeVisible())
    expect(screen.getByRole('button', { name: /verify/i })).toBeEnabled()
  })
})
