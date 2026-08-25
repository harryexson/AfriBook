import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COUNTRIES, type CountryConfig } from '../constants/countries';
import { getCurrencyForCountry, getCurrencySymbol } from '../lib/money';

/**
 * Global market state — single authoritative source on mobile.
 *
 * The selected country drives currency, locale and category context across
 * every screen and is PERSISTED via AsyncStorage so the market survives app
 * restarts, background/foreground cycles, navigation, deep links and
 * logout/login. Mirrors the web `CountryProvider` precedence model:
 *   1. explicit in-session selection (setCountry)
 *   2. persisted selection (AsyncStorage, applied automatically)
 *   3. safe configured fallback (NG — never silently US)
 */
export type MarketSource =
  | 'USER_SELECTED_COUNTRY'
  | 'USER_SELECTED_CITY'
  | 'ACCOUNT_PREFERENCE'
  | 'AUTO_FALLBACK';

interface MarketState {
  countryCode: string;
  city: string;
  source: MarketSource;
  hasSelected: boolean;

  setCountry: (code: string, options?: { city?: string; source?: MarketSource }) => void;

  country: () => CountryConfig | undefined;
  currencyCode: () => string;
  currencySymbol: () => string;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      countryCode: 'NG',
      city: '',
      source: 'AUTO_FALLBACK' as MarketSource,
      hasSelected: false,

      setCountry: (code, options) =>
        set({
          countryCode: code.toUpperCase(),
          city: options?.city ?? get().city,
          source: options?.source ?? ('USER_SELECTED_COUNTRY' as MarketSource),
          hasSelected: true,
        }),

      country: () => COUNTRIES[get().countryCode],
      currencyCode: () => getCurrencyForCountry(get().countryCode),
      currencySymbol: () => getCurrencySymbol(get().countryCode),
    }),
    {
      name: 'afribook-market',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
