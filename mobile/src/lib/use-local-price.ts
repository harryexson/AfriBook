import { useMarketStore } from '../stores/market-store';
import { COUNTRIES } from '../constants/countries';
import { convertCurrency, formatMoneySymbol, getExchangeRate } from './money';

export interface LocalPrice {
  /** What the user is actually charged — always the listing's own currency.
   *  This is the bound, authoritative amount, and it's always what renders
   *  as the primary price. */
  display: string;
  /** An indicative estimate in the viewer's own currency, or null. Only ever
   *  set when the viewer has explicitly opted in (market store's
   *  `showCurrencyEstimate`) — never shown automatically. */
  estimate: string | null;
  /** True when `estimate` is populated: the viewer opted in AND the
   *  currencies actually differ. */
  hasEstimate: boolean;
}

/**
 * Prices a listing for display: the listing's own currency is what's shown
 * and charged, an optional estimate in the viewer's currency is opt-in only.
 * Mirrors src/lib/use-local-price.tsx on web — see that file for the
 * Uber/Airbnb/Amazon/Bolt/Jumia research behind this model.
 *
 * Short version: every platform we checked treats the listing's own currency
 * as the binding price, and a converted figure in the viewer's currency as
 * something the viewer opts into seeing — never a silent substitution based
 * on device location.
 */
export function useLocalPrice() {
  const detected = useMarketStore((s) => s.detectedCountry);
  const browsing = useMarketStore((s) => s.countryCode);
  const showCurrencyEstimate = useMarketStore((s) => s.showCurrencyEstimate);

  const homeCurrency =
    (detected && COUNTRIES[detected]?.currency.code) ||
    COUNTRIES[browsing]?.currency.code ||
    'USD';

  function price(amount: number, listingCurrency: string): LocalPrice {
    const from = (listingCurrency || '').toUpperCase();
    const display = formatMoneySymbol(amount, from);

    const to = homeCurrency.toUpperCase();
    if (!showCurrencyEstimate || !from || from === to || !getExchangeRate(from, to)) {
      return { display, estimate: null, hasEstimate: false };
    }

    const estimate = formatMoneySymbol(convertCurrency(amount, from, to), to);
    return { display, estimate, hasEstimate: true };
  }

  return {
    price,
    homeCurrency,
    hasForeignCurrency: Boolean(
      detected && COUNTRIES[detected]?.currency.code !== COUNTRIES[browsing]?.currency.code,
    ),
    showCurrencyEstimate,
  };
}
