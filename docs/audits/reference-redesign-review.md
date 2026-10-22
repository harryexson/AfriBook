# Reference redesign — review status

This branch incorporates origin/main through 843e0f4 and contains the reference-led web landing page, new generated editorial imagery, React Native home layout, shared mobile controls, food browsing/detail styling, and registration recovery fixes. Existing kitchen authorization changes from main were retained.

## Validation

- Web TypeScript check passes.
- 15 Vitest files / 154 tests pass. Vitest reported a worker shutdown timeout after the test results.
- React Native TypeScript check run separately.
- Desktop landing page visually reviewed at 1440 px and the app's default preview width.
- Editorial assets are generated category imagery, not evidence of actual merchant inventory.

## Remaining release work

- Shared Neon authentication for native mobile is not complete. The legacy Supabase client now permits public browsing when unconfigured and returns an explicit sign-in configuration error; it does not simulate authentication.
- Existing mock catalogues remain in several routes and must be replaced with real inventory before launch.
- POS/kiosk migration 024 was applied to an isolated development branch only. Production rollout, end-to-end cash/stock validation, hardware receipts and native device checks remain outstanding.
- This is not a production-readiness certification. The full platform and all mobile detail flows still need verification.
- Higgsfield tools were unavailable in this chat. Images were generated with the available image-generation tool; motion uses Framer Motion/CSS and native press feedback with reduced-motion support. No generated video is included.
- Local environment files, Neon connection details, diagnostic exports, installed local skills, and redundant source PNG copies are excluded from the commit.

## Design references

The supplied AfriBook screenshots remain the primary layout references. Editorial inspiration: https://styles.refero.design/style/b753dfda-cbe1-41e4-b341-b98d69c8422f and https://styles.refero.design/style/8618f649-6d1c-45ca-aff8-e7f04928d8dd .
