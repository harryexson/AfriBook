# Geolocation Architecture

> Last updated: 2026-08-25
> Supersedes the previous version of this file (which described a stale `us`
> default that never matched the code).

## 1. Two concepts, strictly separated

| Concept | Owner | Storage | Purpose |
|---|---|---|---|
| `currentLocation` | `LocationProvider` (`src/components/providers/LocationProvider.tsx`) | localStorage `afribook-location` (1 h TTL) | GPS position for "near me" modules: rides, delivery, nearby restaurants/services |
| `selectedMarket` | `CountryProvider` (web) / `market-store` (mobile) | `country` cookie + `afribook-country` storage / AsyncStorage `afribook-market` | Marketplace country, city, currency, locale, timezone |

**Invariant:** neither writes to the other's storage. GPS in Chicago must
never reset Malawi; selecting Malawi must never falsify GPS.

## 2. Geolocation flow (one-time, not per-navigation)

1. On app mount, `LocationProvider.detect()` runs once:
   stored location (TTL) → browser geolocation → reverse geocode.
2. Reverse geocoding currently uses Nominatim/OpenStreetMap
   (`src/lib/geo.ts:reverseGeocode`). Mapbox is integrated for routing /
   directions (`src/lib/ridely/route-engine.ts`, `MAPBOX_ACCESS_TOKEN`) and
   is the designated upgrade path for forward/reverse geocoding — swap the
   implementation inside `reverseGeocode()`; call sites do not change.
3. Result populates **currentLocation only**. It does NOT set the market.
   If no explicit market exists yet, the market resolution order still
   applies (see MARKET_CONTEXT.md §4).

## 3. Destination vs current location

- Hotels support NEARBY and DESTINATION modes: destination search
  (`DestinationSelector` → `destination-store`) sets the search context;
  it never overwrites currentLocation or the selected market.
- Restaurants/services/events behave the same ("Near You" vs
  "in [Selected City]").
- Rides/delivery always use transaction geography: pickup, dropoff,
  driver service area.

## 4. Failure behavior

If geolocation fails or permission is denied:

- `currentLocation` = null; near-me modules prompt to enable location.
- The market context falls through its precedence chain and, if unresolved,
  surfaces **"Choose your location"** UI — it NEVER silently assumes US/USD.
