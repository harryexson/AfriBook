// Proxies every Neon Auth request (sign-up, sign-in, sign-out, session,
// token, password reset, email OTP, ...) from the browser client through
// this Next.js route. Required by @neondatabase/neon-js's Next.js server
// SDK — see src/lib/neon/server.ts.
import { neonAuth } from '@/lib/neon/server'

export const { GET, POST, PUT, DELETE, PATCH } = neonAuth.handler()
