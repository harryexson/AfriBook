# Catalog, authentication and address fixes

2026-10-24

## Causes and changes

- Public product list/detail used authenticated Data API queries, producing errors for visitors. They now use parameterized server SQL with explicit public columns, available products and active merchants only. Private metadata and owner IDs are excluded. Market, category and search filters run in SQL. No database permissions were widened.
- The local Next.js server started without Windows system certificate trust, causing Neon Auth proxy `NETWORK_TLS` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE` responses. Running with system CA trust resolved it. `npm start` now uses the same system CA setting as `npm run dev`. Certificate verification remains enabled. `npm run build` does not inherit this worker-incompatible flag.
- Vercel's permissions header disabled geolocation despite Next.js allowing same-origin location. They now agree on `geolocation=(self)`.
- Web and Expo ride/delivery fields offer debounced address suggestions. Selecting a suggestion saves its coordinates; editing the text clears stale coordinates. Ride booking no longer invents Lagos or offset coordinates on lookup failure.
- Web forward/reverse geocoding and native forward geocoding use the same server endpoint, with input validation, per-client rate limiting, bounded responses and timeouts. Failed searches offer retry guidance. Location failures distinguish permission denied, unavailable position and timeout.

## Verification

- Local public products: HTTP 200 (no published products for the tested MW market).
- Local Neon session: HTTP 200; unauthenticated session remains empty.
- Password-reset and mobile sign-in invalid input: HTTP 400, not 502. No user account, email or password was changed during these checks.
- Address lookup returned five real results for Lilongwe and Central Park, New York. Invalid reverse coordinates return HTTP 400.
- Web and mobile TypeScript checks passed. All 187 unit tests passed. Production Next.js build passed (225 generated pages).
- Browser verified the updated ride comboboxes. A first lookup timed out; repeating the same public-landmark lookup succeeded. A retry action was added. Browser automation subsequently became unavailable, so final selection behavior needs manual browser review.

## Remaining external checks

Actual password-reset email delivery/completion and physical-device GPS have not been verified. Browser location permission and OS location services remain user-controlled.

`PHOTON_API_URL` defaults to the Photon public demo for light testing. Configure a dedicated Photon instance for production traffic; the demo does not guarantee availability. See [Photon API](https://github.com/komoot/photon/blob/master/docs/api-v1.md) and [demo server policy](https://github.com/komoot/photon#demo-server). The API does not use public Nominatim for search-as-you-type.
