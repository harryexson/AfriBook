# AfriBook — Remediation Register
**Audit Date:** 2026-10-11  
**Auditor:** Claude (cloud session `session_01LcvvzoVdFWkSkptzsZk1hq`)  
**Baseline commit:** `8defe5b` (main)  
**Branch:** `claude/afribook-earnings-incentives-tn7v3m`

---

## Severity Scale
| Level | Definition |
|-------|-----------|
| **P0** | Production blocker — exploitable security flaw, data loss, or complete vertical failure |
| **P1** | Serious defect — user-facing breakage or financial risk in a happy path |
| **P2** | Meaningful degradation — feature works but with reliability or security gap |
| **P3** | Best-practice gap — no immediate user harm, but should be fixed before wide rollout |
| **P4** | Tech debt / cosmetic — low urgency, opportunistic fix |

---

## Register

| ID | Severity | Vertical | File(s) | Summary | Status | Fixed In |
|----|----------|---------|---------|---------|--------|---------|
| R-001 | **P0-FIXED** | Auth/Middleware | `src/proxy.ts` | Middleware queried non-existent `users` table — role was always `null`, blocking every vendor/admin/driver from their dashboards | **RESOLVED** (current code queries `profiles`) | Pre-existing fix, in `main` |
| R-002 | **P1-RESOLVED** | Rides/Driver | `src/app/driver/earnings/page.tsx:362` | TS18048 `data.statement` possibly undefined — earnings breakdown rendered `undefined` without guard | **RESOLVED** | Commit `8defe5b` |
| R-003 | **P1-EXTERNAL** | Storage | `src/lib/storage/r2.ts`, `src/app/api/upload/route.ts` | R2 API credentials not yet minted — `/api/upload` returns 503 until set | **BLOCKED — external** | Awaiting human action on Cloudflare dashboard |
| R-004 | **P2** | Auth | `src/lib/supabase/*.ts` | Legacy Supabase client files remain on disk — not imported from `src/`, dead code. Risk: future dev accidentally imports stale path | **OPEN** | — |
| R-005 | **P3** | All API | `src/proxy.ts` | In-memory rate limiter is per-instance only — on serverless/edge, limits are not globally enforced across cold-started instances | **OPEN — documented** | Known limitation in `src/lib/rate-limit.ts` |
| R-006 | **P3** | Security | `src/proxy.ts` | No `Content-Security-Policy` header set — missing layer of XSS/injection defense in browser | **OPEN** | — |
| R-007 | **P3** | Auth | `src/app/api/auth/callback/route.ts` | OAuth PKCE code exchange not wired — `/api/auth` proxies Neon Auth correctly but the callback route notes this as a known gap requiring `@neondatabase/auth/next/server`'s `authApiHandler` | **OPEN — documented in code** | — |
| R-008 | **P4** | Storage | Multiple | Supabase Storage references remain in legacy `src/lib/supabase/admin.ts` comments — no production code path, cosmetic debt | **OPEN** | — |
| R-009 | **P4** | Payment | `src/lib/payments/db.ts` | `Database` type does not include payment tables (`payment_transactions`, `escrow_holds`, `refunds`) — `createPaymentDb` uses `any` cast as a workaround | **OPEN** | — |
| R-010 | **P3** | Rides | `src/lib/realtime/ride-status.ts` | Realtime ride-status subscriptions are no-op stubs — live ride tracking is not functional (Neon has no Realtime equivalent). Documented but unresolved. | **OPEN — by design pending Neon alternative** | — |

---

## Summary Counts
| Status | Count |
|--------|-------|
| P0 FIXED | 1 |
| P1 RESOLVED | 1 |
| P1 EXTERNAL BLOCKED | 1 |
| P2 OPEN | 1 |
| P3 OPEN | 4 |
| P4 OPEN | 2 |

**Zero P0 open findings. Zero P1 open findings (one externally blocked).**
