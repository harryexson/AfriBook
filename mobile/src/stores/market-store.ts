import { create } from 'zustand';
import { COUNTRIES, type CountryConfig } from '../constants/countries';
import { getCurrencyForCountry, getCurrencySymbol } from '../lib/money';

/**
 * Global market state. The selected country drives currency, locale and
 * category context across every screen, mirroring the web `MarketContext`.
 * Defaults to NG to match the existing home experience.
 */
interface MarketState {
  countryCode: string;

  setCountry: (code: string) => void;

  country: () => CountryConfig | undefined;
  currencyCode: () => string;
  currencySymbol: () => string;
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  countryCode: 'NG',

  setCountry: (code) => set({ countryCode: code.toUpperCase() }),

  country: () => COUNTRIES[get().countryCode],
  currencyCode: () => getCurrencyForCountry(get().countryCode),
  currencySymbol: () => getCurrencySymbol(get().countryCode),
}));
