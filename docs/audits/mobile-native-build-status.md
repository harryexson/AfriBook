# Native app implementation and build status

Updated: 2026-10-23

## Implemented

- Expo customer onboarding, shared Neon email/password authentication and OTP verification, secure native session storage, profile editing and account deletion request UI.
- Marketplace navigation and API-backed catalog, order, service booking and stay reservation screens with loading, empty and failure states.
- Rider requests, trip history, authenticated trip tracking, driver status, offers, trip progression, earnings and application submission.
- Delivery request and tracking screens. Driver delivery dispatch is not connected to the new ride-offer dashboard.
- Authenticated mobile backend endpoints and ownership enforcement for ride, delivery and location operations.
- EAS project `exsonlogistics/afribook`, application identifiers `com.afribook.app`, APK preview profile and App Store production profile.

## Validation and distribution

Android/iOS JavaScript export and type checking succeeded locally. This is not native compilation or device validation.

An actual Android EAS submission uploaded source and generated the remote Android keystore, but Expo rejected starting the build because the account's free Android quota was exhausted. The user intends to upgrade. No APK has been produced by this submission.

An actual iOS EAS submission stopped at incomplete remote signing credentials. Apple Developer signing must be completed interactively before an App Store/TestFlight archive can be built. EAS login alone does not finish Apple signing. No physical-device IPA has been produced.

Set `EXPO_PUBLIC_API_URL` to the reachable HTTPS backend before the final build. Do not embed Vercel protection bypass tokens or database credentials in the app. A protected preview needs an appropriate public backend configuration before device testing.

## Remaining verification and functionality

- Complete EAS native builds and test on physical Android and iPhone devices.
- Verify shared authentication, OTP, account deletion and trusted backend origins end to end against the deployed Neon service.
- Configure payment credentials and verify real provider checkout/webhooks. Saved unpaid orders are not successful payments.
- Provide published inventory. No fabricated production listings are seeded by this change.
- Public catalog permissions require explicit server queries; the business catalog uses a restricted public field selection. Other legacy Data API catalogs still need verification.
- Implement private driver-document upload; the current application accepts HTTPS document URLs.
- Audit legacy vendor/account screens, booking collision handling, stock transactions, cancellation settlement and delivery dispatch before a production release.

This implementation is not certified production ready. Passing bundle export does not establish native installation, store acceptance, or completed payment/authentication flows.
