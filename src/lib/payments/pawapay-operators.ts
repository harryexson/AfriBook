// PawaPay mobile-money coverage, per the operator list supplied for this platform
// (23 markets). Operators are listed as published; a market is only routable
// once its correspondent code is confirmed in PawaPay's documentation.
//
// `correspondents` holds the codes the adapter can already send. Operators without
// a code are visible here but not yet selectable, and are never routed to.

export interface PawaPayMarket {
  country: string;
  name: string;
  operators: string[];
}

export const PAWAPAY_MARKETS: PawaPayMarket[] = [
  { country: 'BJ', name: 'Benin', operators: ['MTN', 'Moov'] },
  { country: 'BF', name: 'Burkina Faso', operators: ['Orange', 'Moov'] },
  { country: 'CM', name: 'Cameroon', operators: ['MTN', 'Orange'] },
  { country: 'GH', name: 'Ghana', operators: ['MTN', 'Telecel', 'AirtelTigo'] },
  { country: 'CI', name: 'Ivory Coast', operators: ['MTN', 'Orange', 'Moov', 'Wave'] },
  { country: 'LR', name: 'Liberia', operators: ['MTN', 'Orange'] },
  { country: 'ML', name: 'Mali', operators: ['Orange', 'Moov', 'Wave'] },
  { country: 'NG', name: 'Nigeria', operators: ['MTN', 'Airtel'] },
  { country: 'SN', name: 'Senegal', operators: ['Orange', 'Wave', 'Yas'] },
  { country: 'SL', name: 'Sierra Leone', operators: ['Orange'] },
  { country: 'CG', name: 'Congo-Brazzaville', operators: ['MTN', 'Airtel'] },
  { country: 'CD', name: 'DR Congo', operators: ['Airtel', 'Orange', 'Vodacom M-Pesa'] },
  { country: 'GA', name: 'Gabon', operators: ['Airtel'] },
  { country: 'LS', name: 'Lesotho', operators: ['Vodacom M-Pesa'] },
  { country: 'MW', name: 'Malawi', operators: ['Airtel', 'TNM'] },
  { country: 'MZ', name: 'Mozambique', operators: ['Vodacom M-Pesa', 'Movitel'] },
  { country: 'ZM', name: 'Zambia', operators: ['MTN', 'Airtel', 'Zamtel'] },
  { country: 'ET', name: 'Ethiopia', operators: ['Safaricom M-Pesa', 'Ethio telecom'] },
  { country: 'KE', name: 'Kenya', operators: ['Safaricom M-Pesa'] },
  { country: 'RW', name: 'Rwanda', operators: ['MTN', 'Airtel'] },
  { country: 'SS', name: 'South Sudan', operators: ['MTN'] },
  { country: 'TZ', name: 'Tanzania', operators: ['Vodacom M-Pesa', 'Airtel', 'Yas', 'Halotel'] },
  { country: 'UG', name: 'Uganda', operators: ['MTN', 'Airtel'] },
];

export const PAWAPAY_CORRESPONDENTS: Record<string, string> = {
  BJ: 'MTN_BJ',
  BF: 'MOOV_BF',
  CM: 'MTN_CM',
  GH: 'MTN_GH',
  CI: 'ORANGE_CI',
  ML: 'ORANGE_ML',
  NG: 'MTN_NG',
  SN: 'ORANGE_SN',
  CG: 'MTN_CG',
  CD: 'VODACOM_CD',
  ZM: 'MTN_ZM',
  KE: 'MPESA_KE',
  RW: 'MTN_RW',
  TZ: 'VODACOM_TZ',
  UG: 'MTN_UG',
};
