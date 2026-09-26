// Local emergency-service phone numbers, by ISO country code.
//
// IMPORTANT: this app cannot programmatically dial or notify emergency
// dispatch (911/999/112/etc.) the way a telecom carrier or a paid
// integration like RapidSOS can — no API does that job for free, and
// wiring one up needs a real business/API relationship this codebase
// doesn't have. What we *can* do, and what this powers, is a one-tap
// `tel:` link that dials the right local number for the user's country,
// plus logging the incident (location, time, who) so it's on record and
// can be forwarded to the app's own safety team and to any configured
// emergency contacts. Treat "beats 911 auto-dispatch" claims in product
// copy as false until a real dispatch-integration partner is contracted.
export const EMERGENCY_NUMBERS: Record<string, string> = {
  NG: '112', KE: '999', ZA: '10111', GH: '191', TZ: '112', UG: '999',
  MW: '997', EG: '122', RW: '112', SN: '17', CI: '111', CM: '112',
  US: '911', CA: '911', GB: '999', IN: '112', AE: '999', FR: '112', DE: '112',
};

const DEFAULT_EMERGENCY_NUMBER = '112'; // the international GSM emergency number, works as a fallback in most countries.

export function getEmergencyNumber(countryCode: string): string {
  return EMERGENCY_NUMBERS[(countryCode || '').toUpperCase()] ?? DEFAULT_EMERGENCY_NUMBER;
}
