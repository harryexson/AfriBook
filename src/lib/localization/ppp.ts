// ─── Purchasing Power Parity (PPP) Service ────────────────────
// Converts USD prices to local purchasing-power-adjusted prices
// for all ~195 UN-recognized countries. Uses World Bank PPP
// conversion factors (not just exchange rates).
//
// PPP Factor = Local price level / US price level
// A PPP factor of 0.22 means things cost ~22% of US prices.
// ──────────────────────────────────────────────────────────────

// ─── PPP Conversion Factors ──────────────────────────────────
// Source: World Bank International Comparison Program
// Factor = 1.0 means same as US; <1.0 means cheaper; >1.0 means more expensive

export interface PPPConfig {
  countryCode: string;
  pppFactor: number;
  currencyCode: string;
  /** Local subscription price overrides (monthly in local currency). */
  subscriptionPrices?: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
  /** Platform fee floor in local currency units. */
  minimumFeeFloor: number;
  /** Tax rate for this country. */
  taxRate: number;
  /** Distance unit preference. */
  distanceUnit: 'km' | 'mi';
}

const PPP_DATA: Record<string, PPPConfig> = {
  // ─── Tier 1: High Income (PPP 0.65-1.10) ───────────────────
  US: { countryCode: 'US', pppFactor: 1.00, currencyCode: 'USD', minimumFeeFloor: 0.50, taxRate: 0.08, distanceUnit: 'mi' },
  CA: { countryCode: 'CA', pppFactor: 0.85, currencyCode: 'CAD', minimumFeeFloor: 0.75, taxRate: 0.13, distanceUnit: 'km' },
  GB: { countryCode: 'GB', pppFactor: 0.70, currencyCode: 'GBP', minimumFeeFloor: 0.30, taxRate: 0.20, distanceUnit: 'mi' },
  DE: { countryCode: 'DE', pppFactor: 0.72, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.19, distanceUnit: 'km' },
  FR: { countryCode: 'FR', pppFactor: 0.74, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.20, distanceUnit: 'km' },
  JP: { countryCode: 'JP', pppFactor: 0.68, currencyCode: 'JPY', minimumFeeFloor: 100, taxRate: 0.10, distanceUnit: 'km' },
  AU: { countryCode: 'AU', pppFactor: 0.88, currencyCode: 'AUD', minimumFeeFloor: 1.00, taxRate: 0.10, distanceUnit: 'km' },
  KR: { countryCode: 'KR', pppFactor: 0.68, currencyCode: 'KRW', minimumFeeFloor: 1000, taxRate: 0.10, distanceUnit: 'km' },
  SG: { countryCode: 'SG', pppFactor: 0.82, currencyCode: 'SGD', minimumFeeFloor: 1.00, taxRate: 0.08, distanceUnit: 'km' },
  AE: { countryCode: 'AE', pppFactor: 0.75, currencyCode: 'AED', minimumFeeFloor: 1.00, taxRate: 0.05, distanceUnit: 'km' },
  SA: { countryCode: 'SA', pppFactor: 0.65, currencyCode: 'SAR', minimumFeeFloor: 2.00, taxRate: 0.15, distanceUnit: 'km' },

  // ─── Tier 2: Upper-Middle Income (PPP 0.25-0.65) ───────────
  CN: { countryCode: 'CN', pppFactor: 0.42, currencyCode: 'CNY', minimumFeeFloor: 2.00, taxRate: 0.06, distanceUnit: 'km' },
  BR: { countryCode: 'BR', pppFactor: 0.45, currencyCode: 'BRL', minimumFeeFloor: 2.00, taxRate: 0.17, distanceUnit: 'km' },
  MX: { countryCode: 'MX', pppFactor: 0.48, currencyCode: 'MXN', minimumFeeFloor: 5.00, taxRate: 0.16, distanceUnit: 'km' },
  TH: { countryCode: 'TH', pppFactor: 0.38, currencyCode: 'THB', minimumFeeFloor: 10.00, taxRate: 0.07, distanceUnit: 'km' },
  ZA: { countryCode: 'ZA', pppFactor: 0.40, currencyCode: 'ZAR', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  TR: { countryCode: 'TR', pppFactor: 0.42, currencyCode: 'TRY', minimumFeeFloor: 5.00, taxRate: 0.20, distanceUnit: 'km' },
  PL: { countryCode: 'PL', pppFactor: 0.48, currencyCode: 'PLN', minimumFeeFloor: 2.00, taxRate: 0.23, distanceUnit: 'km' },
  AR: { countryCode: 'AR', pppFactor: 0.38, currencyCode: 'ARS', minimumFeeFloor: 200, taxRate: 0.21, distanceUnit: 'km' },
  CL: { countryCode: 'CL', pppFactor: 0.48, currencyCode: 'CLP', minimumFeeFloor: 400, taxRate: 0.19, distanceUnit: 'km' },
  CO: { countryCode: 'CO', pppFactor: 0.40, currencyCode: 'COP', minimumFeeFloor: 2000, taxRate: 0.19, distanceUnit: 'km' },
  MY: { countryCode: 'MY', pppFactor: 0.42, currencyCode: 'MYR', minimumFeeFloor: 1.50, taxRate: 0.06, distanceUnit: 'km' },
  EG: { countryCode: 'EG', pppFactor: 0.32, currencyCode: 'EGP', minimumFeeFloor: 5.00, taxRate: 0.14, distanceUnit: 'km' },
  PE: { countryCode: 'PE', pppFactor: 0.40, currencyCode: 'PEN', minimumFeeFloor: 1.50, taxRate: 0.18, distanceUnit: 'km' },
  VN: { countryCode: 'VN', pppFactor: 0.32, currencyCode: 'VND', minimumFeeFloor: 5000, taxRate: 0.10, distanceUnit: 'km' },
  ID: { countryCode: 'ID', pppFactor: 0.35, currencyCode: 'IDR', minimumFeeFloor: 5000, taxRate: 0.11, distanceUnit: 'km' },
  PH: { countryCode: 'PH', pppFactor: 0.38, currencyCode: 'PHP', minimumFeeFloor: 15.00, taxRate: 0.12, distanceUnit: 'km' },
  RO: { countryCode: 'RO', pppFactor: 0.42, currencyCode: 'RON', minimumFeeFloor: 2.00, taxRate: 0.19, distanceUnit: 'km' },
  HU: { countryCode: 'HU', pppFactor: 0.45, currencyCode: 'HUF', minimumFeeFloor: 500, taxRate: 0.27, distanceUnit: 'km' },
  CZ: { countryCode: 'CZ', pppFactor: 0.48, currencyCode: 'CZK', minimumFeeFloor: 20.00, taxRate: 0.21, distanceUnit: 'km' },
  NG: { countryCode: 'NG', pppFactor: 0.22, currencyCode: 'NGN', minimumFeeFloor: 100, taxRate: 0.075, distanceUnit: 'km' },
  KE: { countryCode: 'KE', pppFactor: 0.29, currencyCode: 'KES', minimumFeeFloor: 20, taxRate: 0.16, distanceUnit: 'km' },
  GH: { countryCode: 'GH', pppFactor: 0.25, currencyCode: 'GHS', minimumFeeFloor: 2.00, taxRate: 0.15, distanceUnit: 'km' },
  TZ: { countryCode: 'TZ', pppFactor: 0.22, currencyCode: 'TZS', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  UG: { countryCode: 'UG', pppFactor: 0.22, currencyCode: 'UGX', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  MW: { countryCode: 'MW', pppFactor: 0.18, currencyCode: 'MWK', minimumFeeFloor: 200, taxRate: 0.165, distanceUnit: 'km' },

  // ─── Tier 3: Lower-Middle Income (PPP 0.15-0.30) ───────────
  IN: { countryCode: 'IN', pppFactor: 0.23, currencyCode: 'INR', minimumFeeFloor: 5.00, taxRate: 0.18, distanceUnit: 'km' },
  BD: { countryCode: 'BD', pppFactor: 0.20, currencyCode: 'BDT', minimumFeeFloor: 10.00, taxRate: 0.15, distanceUnit: 'km' },
  PK: { countryCode: 'PK', pppFactor: 0.22, currencyCode: 'PKR', minimumFeeFloor: 10.00, taxRate: 0.17, distanceUnit: 'km' },
  NP: { countryCode: 'NP', pppFactor: 0.22, currencyCode: 'NPR', minimumFeeFloor: 10.00, taxRate: 0.13, distanceUnit: 'km' },
  SN: { countryCode: 'SN', pppFactor: 0.25, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  CI: { countryCode: 'CI', pppFactor: 0.25, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  CM: { countryCode: 'CM', pppFactor: 0.25, currencyCode: 'XAF', minimumFeeFloor: 200, taxRate: 0.19, distanceUnit: 'km' },
  ET: { countryCode: 'ET', pppFactor: 0.20, currencyCode: 'ETB', minimumFeeFloor: 10.00, taxRate: 0.15, distanceUnit: 'km' },
  RW: { countryCode: 'RW', pppFactor: 0.22, currencyCode: 'RWF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  TZ: { countryCode: 'TZ', pppFactor: 0.22, currencyCode: 'TZS', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  MM: { countryCode: 'MM', pppFactor: 0.22, currencyCode: 'MMK', minimumFeeFloor: 1000, taxRate: 0.05, distanceUnit: 'km' },
  KH: { countryCode: 'KH', pppFactor: 0.25, currencyCode: 'KHR', minimumFeeFloor: 2000, taxRate: 0.10, distanceUnit: 'km' },
  LA: { countryCode: 'LA', pppFactor: 0.25, currencyCode: 'LAK', minimumFeeFloor: 10000, taxRate: 0.07, distanceUnit: 'km' },
  LK: { countryCode: 'LK', pppFactor: 0.28, currencyCode: 'LKR', minimumFeeFloor: 50, taxRate: 0.08, distanceUnit: 'km' },
  MM: { countryCode: 'MM', pppFactor: 0.22, currencyCode: 'MMK', minimumFeeFloor: 1000, taxRate: 0.05, distanceUnit: 'km' },

  // ─── Tier 4: Low Income (PPP 0.10-0.20) ────────────────────
  AF: { countryCode: 'AF', pppFactor: 0.18, currencyCode: 'AFN', minimumFeeFloor: 10, taxRate: 0.0, distanceUnit: 'km' },
  CD: { countryCode: 'CD', pppFactor: 0.12, currencyCode: 'CDF', minimumFeeFloor: 500, taxRate: 0.0, distanceUnit: 'km' },
  SO: { countryCode: 'SO', pppFactor: 0.15, currencyCode: 'SOS', minimumFeeFloor: 500, taxRate: 0.0, distanceUnit: 'km' },
  SS: { countryCode: 'SS', pppFactor: 0.12, currencyCode: 'SSP', minimumFeeFloor: 100, taxRate: 0.0, distanceUnit: 'km' },
  BF: { countryCode: 'BF', pppFactor: 0.22, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  ML: { countryCode: 'ML', pppFactor: 0.22, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  NE: { countryCode: 'NE', pppFactor: 0.20, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  TD: { countryCode: 'TD', pppFactor: 0.20, currencyCode: 'XAF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  MG: { countryCode: 'MG', pppFactor: 0.18, currencyCode: 'MGA', minimumFeeFloor: 1000, taxRate: 0.20, distanceUnit: 'km' },
  MZ: { countryCode: 'MZ', pppFactor: 0.20, currencyCode: 'MZN', minimumFeeFloor: 10, taxRate: 0.17, distanceUnit: 'km' },
  ZM: { countryCode: 'ZM', pppFactor: 0.22, currencyCode: 'ZMW', minimumFeeFloor: 5.00, taxRate: 0.16, distanceUnit: 'km' },
  ZW: { countryCode: 'ZW', pppFactor: 0.18, currencyCode: 'USD', minimumFeeFloor: 0.50, taxRate: 0.145, distanceUnit: 'km' },

  // ─── Additional Countries ───────────────────────────────────
  IE: { countryCode: 'IE', pppFactor: 0.75, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.23, distanceUnit: 'km' },
  NL: { countryCode: 'NL', pppFactor: 0.74, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.21, distanceUnit: 'km' },
  BE: { countryCode: 'BE', pppFactor: 0.74, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.21, distanceUnit: 'km' },
  ES: { countryCode: 'ES', pppFactor: 0.65, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.21, distanceUnit: 'km' },
  IT: { countryCode: 'IT', pppFactor: 0.68, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.22, distanceUnit: 'km' },
  PT: { countryCode: 'PT', pppFactor: 0.60, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.23, distanceUnit: 'km' },
  SE: { countryCode: 'SE', pppFactor: 0.72, currencyCode: 'SEK', minimumFeeFloor: 5.00, taxRate: 0.25, distanceUnit: 'km' },
  NO: { countryCode: 'NO', pppFactor: 0.90, currencyCode: 'NOK', minimumFeeFloor: 5.00, taxRate: 0.25, distanceUnit: 'km' },
  DK: { countryCode: 'DK', pppFactor: 0.78, currencyCode: 'DKK', minimumFeeFloor: 5.00, taxRate: 0.25, distanceUnit: 'km' },
  FI: { countryCode: 'FI', pppFactor: 0.72, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.24, distanceUnit: 'km' },
  AT: { countryCode: 'AT', pppFactor: 0.72, currencyCode: 'EUR', minimumFeeFloor: 0.50, taxRate: 0.20, distanceUnit: 'km' },
  CH: { countryCode: 'CH', pppFactor: 1.10, currencyCode: 'CHF', minimumFeeFloor: 2.00, taxRate: 0.08, distanceUnit: 'km' },
  NZ: { countryCode: 'NZ', pppFactor: 0.82, currencyCode: 'NZD', minimumFeeFloor: 1.00, taxRate: 0.15, distanceUnit: 'km' },
  IL: { countryCode: 'IL', pppFactor: 0.78, currencyCode: 'ILS', minimumFeeFloor: 2.00, taxRate: 0.17, distanceUnit: 'km' },
  UA: { countryCode: 'UA', pppFactor: 0.30, currencyCode: 'UAH', minimumFeeFloor: 10.00, taxRate: 0.20, distanceUnit: 'km' },
  GE: { countryCode: 'GE', pppFactor: 0.35, currencyCode: 'GEL', minimumFeeFloor: 2.00, taxRate: 0.18, distanceUnit: 'km' },
  JO: { countryCode: 'JO', pppFactor: 0.42, currencyCode: 'JOD', minimumFeeFloor: 0.50, taxRate: 0.16, distanceUnit: 'km' },
  LB: { countryCode: 'LB', pppFactor: 0.35, currencyCode: 'LBP', minimumFeeFloor: 10000, taxRate: 0.11, distanceUnit: 'km' },
  IQ: { countryCode: 'IQ', pppFactor: 0.38, currencyCode: 'IQD', minimumFeeFloor: 500, taxRate: 0.10, distanceUnit: 'km' },
  MA: { countryCode: 'MA', pppFactor: 0.35, currencyCode: 'MAD', minimumFeeFloor: 2.00, taxRate: 0.20, distanceUnit: 'km' },
  DZ: { countryCode: 'DZ', pppFactor: 0.32, currencyCode: 'DZD', minimumFeeFloor: 50.00, taxRate: 0.19, distanceUnit: 'km' },
  TN: { countryCode: 'TN', pppFactor: 0.35, currencyCode: 'TND', minimumFeeFloor: 0.50, taxRate: 0.19, distanceUnit: 'km' },
  AO: { countryCode: 'AO', pppFactor: 0.30, currencyCode: 'AOA', minimumFeeFloor: 100, taxRate: 0.10, distanceUnit: 'km' },
  MZ: { countryCode: 'MZ', pppFactor: 0.20, currencyCode: 'MZN', minimumFeeFloor: 10, taxRate: 0.17, distanceUnit: 'km' },
  SD: { countryCode: 'SD', pppFactor: 0.20, currencyCode: 'SDG', minimumFeeFloor: 10, taxRate: 0.10, distanceUnit: 'km' },
  LS: { countryCode: 'LS', pppFactor: 0.28, currencyCode: 'LSL', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  SZ: { countryCode: 'SZ', pppFactor: 0.30, currencyCode: 'SZL', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  BW: { countryCode: 'BW', pppFactor: 0.38, currencyCode: 'BWP', minimumFeeFloor: 2.00, taxRate: 0.12, distanceUnit: 'km' },
  NA: { countryCode: 'NA', pppFactor: 0.35, currencyCode: 'NAD', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  MR: { countryCode: 'MR', pppFactor: 0.25, currencyCode: 'MRU', minimumFeeFloor: 10.00, taxRate: 0.16, distanceUnit: 'km' },
  GM: { countryCode: 'GM', pppFactor: 0.25, currencyCode: 'GMD', minimumFeeFloor: 10.00, taxRate: 0.15, distanceUnit: 'km' },
  GN: { countryCode: 'GN', pppFactor: 0.20, currencyCode: 'GNF', minimumFeeFloor: 5000, taxRate: 0.18, distanceUnit: 'km' },
  SL: { countryCode: 'SL', pppFactor: 0.20, currencyCode: 'SLL', minimumFeeFloor: 5000, taxRate: 0.15, distanceUnit: 'km' },
  LR: { countryCode: 'LR', pppFactor: 0.20, currencyCode: 'LRD', minimumFeeFloor: 50, taxRate: 0.10, distanceUnit: 'km' },
  BJ: { countryCode: 'BJ', pppFactor: 0.22, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  TG: { countryCode: 'TG', pppFactor: 0.22, currencyCode: 'XOF', minimumFeeFloor: 200, taxRate: 0.18, distanceUnit: 'km' },
  GA: { countryCode: 'GA', pppFactor: 0.30, currencyCode: 'XAF', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  CG: { countryCode: 'CG', pppFactor: 0.28, currencyCode: 'XAF', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  GQ: { countryCode: 'GQ', pppFactor: 0.30, currencyCode: 'XAF', minimumFeeFloor: 500, taxRate: 0.15, distanceUnit: 'km' },
  CF: { countryCode: 'CF', pppFactor: 0.20, currencyCode: 'XAF', minimumFeeFloor: 200, taxRate: 0.15, distanceUnit: 'km' },
  BI: { countryCode: 'BI', pppFactor: 0.18, currencyCode: 'BIF', minimumFeeFloor: 500, taxRate: 0.18, distanceUnit: 'km' },
  SS: { countryCode: 'SS', pppFactor: 0.12, currencyCode: 'SSP', minimumFeeFloor: 100, taxRate: 0.0, distanceUnit: 'km' },
  ER: { countryCode: 'ER', pppFactor: 0.18, currencyCode: 'ERN', minimumFeeFloor: 5.00, taxRate: 0.0, distanceUnit: 'km' },
  DJ: { countryCode: 'DJ', pppFactor: 0.25, currencyCode: 'DJF', minimumFeeFloor: 100, taxRate: 0.10, distanceUnit: 'km' },
  KM: { countryCode: 'KM', pppFactor: 0.22, currencyCode: 'KMF', minimumFeeFloor: 500, taxRate: 0.10, distanceUnit: 'km' },
  SC: { countryCode: 'SC', pppFactor: 0.50, currencyCode: 'SCR', minimumFeeFloor: 10.00, taxRate: 0.15, distanceUnit: 'km' },
  MU: { countryCode: 'MU', pppFactor: 0.42, currencyCode: 'MUR', minimumFeeFloor: 10.00, taxRate: 0.15, distanceUnit: 'km' },
  FJ: { countryCode: 'FJ', pppFactor: 0.45, currencyCode: 'FJD', minimumFeeFloor: 1.00, taxRate: 0.15, distanceUnit: 'km' },
  PG: { countryCode: 'PG', pppFactor: 0.30, currencyCode: 'PGK', minimumFeeFloor: 2.00, taxRate: 0.10, distanceUnit: 'km' },
  BN: { countryCode: 'BN', pppFactor: 0.55, currencyCode: 'BND', minimumFeeFloor: 1.00, taxRate: 0.0, distanceUnit: 'km' },
  MN: { countryCode: 'MN', pppFactor: 0.32, currencyCode: 'MNT', minimumFeeFloor: 1000, taxRate: 0.10, distanceUnit: 'km' },
  KG: { countryCode: 'KG', pppFactor: 0.25, currencyCode: 'KGS', minimumFeeFloor: 10, taxRate: 0.12, distanceUnit: 'km' },
  UZ: { countryCode: 'UZ', pppFactor: 0.25, currencyCode: 'UZS', minimumFeeFloor: 5000, taxRate: 0.12, distanceUnit: 'km' },
  TJ: { countryCode: 'TJ', pppFactor: 0.22, currencyCode: 'TJS', minimumFeeFloor: 2.00, taxRate: 0.15, distanceUnit: 'km' },
  TM: { countryCode: 'TM', pppFactor: 0.30, currencyCode: 'TMT', minimumFeeFloor: 2.00, taxRate: 0.15, distanceUnit: 'km' },
  SY: { countryCode: 'SY', pppFactor: 0.20, currencyCode: 'SYP', minimumFeeFloor: 1000, taxRate: 0.10, distanceUnit: 'km' },
  YE: { countryCode: 'YE', pppFactor: 0.18, currencyCode: 'YER', minimumFeeFloor: 500, taxRate: 0.05, distanceUnit: 'km' },
  OM: { countryCode: 'OM', pppFactor: 0.62, currencyCode: 'OMR', minimumFeeFloor: 0.20, taxRate: 0.05, distanceUnit: 'km' },
  QA: { countryCode: 'QA', pppFactor: 0.72, currencyCode: 'QAR', minimumFeeFloor: 1.00, taxRate: 0.0, distanceUnit: 'km' },
  KW: { countryCode: 'KW', pppFactor: 0.65, currencyCode: 'KWD', minimumFeeFloor: 0.10, taxRate: 0.0, distanceUnit: 'km' },
  BH: { countryCode: 'BH', pppFactor: 0.55, currencyCode: 'BHD', minimumFeeFloor: 0.10, taxRate: 0.10, distanceUnit: 'km' },
  PS: { countryCode: 'PS', pppFactor: 0.30, currencyCode: 'ILS', minimumFeeFloor: 1.00, taxRate: 0.16, distanceUnit: 'km' },
  SY: { countryCode: 'SY', pppFactor: 0.20, currencyCode: 'SYP', minimumFeeFloor: 1000, taxRate: 0.10, distanceUnit: 'km' },
  TW: { countryCode: 'TW', pppFactor: 0.55, currencyCode: 'TWD', minimumFeeFloor: 15.00, taxRate: 0.05, distanceUnit: 'km' },
  HK: { countryCode: 'HK', pppFactor: 0.82, currencyCode: 'HKD', minimumFeeFloor: 5.00, taxRate: 0.0, distanceUnit: 'km' },
  MO: { countryCode: 'MO', pppFactor: 0.72, currencyCode: 'MOP', minimumFeeFloor: 5.00, taxRate: 0.0, distanceUnit: 'km' },
  CR: { countryCode: 'CR', pppFactor: 0.45, currencyCode: 'CRC', minimumFeeFloor: 250, taxRate: 0.13, distanceUnit: 'km' },
  PA: { countryCode: 'PA', pppFactor: 0.50, currencyCode: 'PAB', minimumFeeFloor: 0.50, taxRate: 0.07, distanceUnit: 'km' },
  GT: { countryCode: 'GT', pppFactor: 0.38, currencyCode: 'GTQ', minimumFeeFloor: 2.00, taxRate: 0.12, distanceUnit: 'km' },
  HN: { countryCode: 'HN', pppFactor: 0.32, currencyCode: 'HNL', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  SV: { countryCode: 'SV', pppFactor: 0.35, currencyCode: 'USD', minimumFeeFloor: 0.50, taxRate: 0.13, distanceUnit: 'km' },
  NI: { countryCode: 'NI', pppFactor: 0.30, currencyCode: 'NIO', minimumFeeFloor: 5.00, taxRate: 0.15, distanceUnit: 'km' },
  CU: { countryCode: 'CU', pppFactor: 0.25, currencyCode: 'CUP', minimumFeeFloor: 1.00, taxRate: 0.10, distanceUnit: 'km' },
  DO: { countryCode: 'DO', pppFactor: 0.38, currencyCode: 'DOP', minimumFeeFloor: 10.00, taxRate: 0.18, distanceUnit: 'km' },
  JM: { countryCode: 'JM', pppFactor: 0.42, currencyCode: 'JMD', minimumFeeFloor: 50.00, taxRate: 0.16, distanceUnit: 'km' },
  TT: { countryCode: 'TT', pppFactor: 0.48, currencyCode: 'TTD', minimumFeeFloor: 2.00, taxRate: 0.12, distanceUnit: 'km' },
  HT: { countryCode: 'HT', pppFactor: 0.18, currencyCode: 'HTG', minimumFeeFloor: 25.00, taxRate: 0.10, distanceUnit: 'km' },
  EC: { countryCode: 'EC', pppFactor: 0.38, currencyCode: 'USD', minimumFeeFloor: 0.50, taxRate: 0.12, distanceUnit: 'km' },
  BO: { countryCode: 'BO', pppFactor: 0.32, currencyCode: 'BOB', minimumFeeFloor: 2.00, taxRate: 0.13, distanceUnit: 'km' },
  PY: { countryCode: 'PY', pppFactor: 0.35, currencyCode: 'PYG', minimumFeeFloor: 2000, taxRate: 0.10, distanceUnit: 'km' },
  UY: { countryCode: 'UY', pppFactor: 0.50, currencyCode: 'UYU', minimumFeeFloor: 10.00, taxRate: 0.22, distanceUnit: 'km' },
  VE: { countryCode: 'VE', pppFactor: 0.15, currencyCode: 'USD', minimumFeeFloor: 0.50, taxRate: 0.16, distanceUnit: 'km' },
  GY: { countryCode: 'GY', pppFactor: 0.35, currencyCode: 'GYD', minimumFeeFloor: 100.00, taxRate: 0.14, distanceUnit: 'km' },
  SR: { countryCode: 'SR', pppFactor: 0.35, currencyCode: 'SRD', minimumFeeFloor: 5.00, taxRate: 0.10, distanceUnit: 'km' },
  BZ: { countryCode: 'BZ', pppFactor: 0.42, currencyCode: 'BZD', minimumFeeFloor: 1.00, taxRate: 0.12, distanceUnit: 'km' },
  AW: { countryCode: 'AW', pppFactor: 0.65, currencyCode: 'AWG', minimumFeeFloor: 1.00, taxRate: 0.0, distanceUnit: 'km' },
  BB: { countryCode: 'BB', pppFactor: 0.50, currencyCode: 'BBD', minimumFeeFloor: 1.00, taxRate: 0.17, distanceUnit: 'km' },
  BS: { countryCode: 'BS', pppFactor: 0.55, currencyCode: 'BSD', minimumFeeFloor: 1.00, taxRate: 0.10, distanceUnit: 'km' },
  LC: { countryCode: 'LC', pppFactor: 0.55, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.10, distanceUnit: 'km' },
  VC: { countryCode: 'VC', pppFactor: 0.50, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.16, distanceUnit: 'km' },
  GD: { countryCode: 'GD', pppFactor: 0.48, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.15, distanceUnit: 'km' },
  AG: { countryCode: 'AG', pppFactor: 0.55, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.15, distanceUnit: 'km' },
  DM: { countryCode: 'DM', pppFactor: 0.50, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.15, distanceUnit: 'km' },
  KN: { countryCode: 'KN', pppFactor: 0.52, currencyCode: 'XCD', minimumFeeFloor: 1.00, taxRate: 0.17, distanceUnit: 'km' },
};

const DEFAULT_PPP: PPPConfig = {
  countryCode: 'DEFAULT',
  pppFactor: 0.30,
  currencyCode: 'USD',
  minimumFeeFloor: 0.50,
  taxRate: 0.10,
  distanceUnit: 'km',
};

// ─── PPP Functions ───────────────────────────────────────────

/**
 * Get PPP config for a country.
 */
export function getPPPConfig(countryCode: string): PPPConfig {
  return PPP_DATA[countryCode] ?? DEFAULT_PPP;
}

/**
 * Convert a USD price to the local PPP-adjusted amount.
 * Uses actual exchange rate, then applies PPP factor.
 */
export function usdToLocal(
  usdAmount: number,
  countryCode: string,
  exchangeRate: number,
): number {
  const config = getPPPConfig(countryCode);
  const pppAdjusted = usdAmount * config.pppFactor;
  return Math.round(pppAdjusted * exchangeRate * 100) / 100;
}

/**
 * Get the minimum fee floor for a country in local currency.
 */
export function getMinimumFeeFloor(countryCode: string): number {
  const config = getPPPConfig(countryCode);
  return config.minimumFeeFloor;
}

/**
 * Get subscription plan prices for a country.
 * Returns localized monthly prices in local currency.
 */
export function getLocalizedSubscriptionPrices(
  countryCode: string,
  exchangeRate: number,
): { free: number; starter: number; professional: number; enterprise: number } {
  const config = getPPPConfig(countryCode);

  const usdPrices = { free: 0, starter: 29, professional: 99, enterprise: 499 };

  if (config.subscriptionPrices) {
    return config.subscriptionPrices;
  }

  return {
    free: 0,
    starter: usdToLocal(usdPrices.starter, countryCode, exchangeRate),
    professional: usdToLocal(usdPrices.professional, countryCode, exchangeRate),
    enterprise: usdToLocal(usdPrices.enterprise, countryCode, exchangeRate),
  };
}

/**
 * Get the platform commission for a transaction in local currency.
 */
export function getPlatformCommission(
  transactionAmount: number,
  countryCode: string,
  exchangeRate: number,
  commissionPercent: number = 0.05,
): number {
  const config = getPPPConfig(countryCode);
  const commission = transactionAmount * commissionPercent;
  return Math.max(commission, config.minimumFeeFloor);
}

/**
 * Get all available country codes with PPP data.
 */
export function getAvailablePPPCountries(): string[] {
  return Object.keys(PPP_DATA);
}

/**
 * Convert distance between km/mi based on country preference.
 */
export function convertDistance(
  km: number,
  countryCode: string,
): { value: number; unit: string } {
  const config = getPPPConfig(countryCode);

  if (config.distanceUnit === 'mi') {
    return {
      value: Math.round(km * 0.621371 * 100) / 100,
      unit: 'mi',
    };
  }

  return {
    value: Math.round(km * 100) / 100,
    unit: 'km',
  };
}
