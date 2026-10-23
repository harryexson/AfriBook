// Proxies every Neon Auth request (sign-up, sign-in, sign-out, session,
// token, password reset, email OTP, ...) from the browser client through
// this Next.js route. Required by @neondatabase/neon-js's Next.js server
// SDK — see src/lib/neon/server.ts.
import { getNeonAuth } from '@/lib/neon/server'

type AuthHandlers = ReturnType<ReturnType<typeof getNeonAuth>['handler']>

export function GET(...args: Parameters<AuthHandlers['GET']>) {
  return getNeonAuth().handler().GET(...args)
}

export function POST(...args: Parameters<AuthHandlers['POST']>) {
  return getNeonAuth().handler().POST(...args)
}

export function PUT(...args: Parameters<AuthHandlers['PUT']>) {
  return getNeonAuth().handler().PUT(...args)
}

export function DELETE(...args: Parameters<AuthHandlers['DELETE']>) {
  return getNeonAuth().handler().DELETE(...args)
}

export function PATCH(...args: Parameters<AuthHandlers['PATCH']>) {
  return getNeonAuth().handler().PATCH(...args)
}
