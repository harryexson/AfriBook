import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { COUNTRIES, type CountryConfig } from '../constants/countries';
import { getCurrencyForCountry, getCurrencySymbol } from '../lib/money';

const STORED_COUNTRY = 'afribook.market.country';
const STORED_EXPLICIT = 'afribook.market.explicit';
const FALLBACK = 'NG';

/**
 * Global market state: the country whose services, prices and currency the
 * user is currently browsing.
 *
 * Three facts are kept deliberately separate, because conflating them is what
 * makes a marketplace feel wrong when you travel:
 *
 *  - `countryCode`      what we're showing right now
 *  - `detectedCountry`  where the device actually is
 *  - `isExplicit`       whether the user chose this themselves
 *
 * Someone who deliberately picks Ghana while sitting in Kenya should still be
 * in Ghana on the next launch — an explicit choice outranks geolocation, and
 * outranks it permanently rather than until the next cold start. We keep the
 * detected country either way so the UI can say plainly that they're browsing
 * somewhere other than where they are (see CountryNotice).
 *
 * This previously hard-coded 'NG' with no detection and no persistence: every
 * user in every country opened the app to Nigerian listings priced in naira,
 * and re-picking their country did not survive a restart.
 */
interface MarketState {
  countryCode: string;
  detectedCountry: string | null;
  isExplicit: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setCountry: (code: string, opts?: { explicit?: boolean }) => void;

  country: () => CountryConfig | undefined;
  currencyCode: () => string;
  currencySymbol: () => string;
  /** True when browsing a market other than the device's own. */
  isAwayFromHome: () => boolean;
}

function isSupported(code?: string | null): code is string {
  return Boolean(code && COUNTRIES[code.toUpperCase()]);
}

/**
 * Resolve the device's country. Permission is requested, not assumed — a
 * refusal is a normal outcome rather than an error, and just leaves detection
 * null so the stored or fallback market stands.
 */
async function detectCountry(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // A country only needs coarse accuracy.
    });
    const [place] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const iso = place?.isoCountryCode?.toUpperCase();
    return isSupported(iso) ? iso : null;
  } catch {
    // Location fails for many mundane reasons — airplane mode, a simulator
    // with no fix, permission revoked mid-call. None should block startup.
    return null;
  }
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  countryCode: FALLBACK,
  detectedCountry: null,
  isExplicit: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    const [stored, explicitFlag] = await Promise.all([
      AsyncStorage.getItem(STORED_COUNTRY).catch(() => null),
      AsyncStorage.getItem(STORED_EXPLICIT).catch(() => null),
    ]);
    const explicit = explicitFlag === 'true';

    // Apply the stored market immediately, so the first frame isn't the wrong
    // country while location resolves.
    if (isSupported(stored)) {
      set({ countryCode: stored.toUpperCase(), isExplicit: explicit });
    }

    const detected = await detectCountry();
    set((s) => ({
      detectedCountry: detected,
      hydrated: true,
      // Detection only takes over when the user hasn't chosen for themselves
      // and there was nothing stored.
      countryCode: !explicit && !isSupported(stored) && detected ? detected : s.countryCode,
    }));
  },

  setCountry: (code, opts) => {
    const next = code.toUpperCase();
    if (!isSupported(next)) return;

    const explicit = opts?.explicit ?? true;
    set({ countryCode: next, isExplicit: explicit });

    AsyncStorage.setItem(STORED_COUNTRY, next).catch(() => {});
    AsyncStorage.setItem(STORED_EXPLICIT, String(explicit)).catch(() => {});
  },

  country: () => COUNTRIES[get().countryCode],
  currencyCode: () => getCurrencyForCountry(get().countryCode),
  currencySymbol: () => getCurrencySymbol(get().countryCode),
  isAwayFromHome: () => {
    const { detectedCountry, countryCode } = get();
    return Boolean(detectedCountry && detectedCountry !== countryCode);
  },
}));
