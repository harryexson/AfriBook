import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Currency pricing configuration
const PRICING = {
  starter: {
    USD: { monthly: 99, annual: 950 },
    CAD: { monthly: 129, annual: 1250 },
    EUR: { monthly: 89, annual: 850 },
    GBP: { monthly: 79, annual: 750 }
  },
  professional: {
    USD: { monthly: 299, annual: 2868 },
    CAD: { monthly: 389, annual: 3750 },
    EUR: { monthly: 269, annual: 2580 },
    GBP: { monthly: 239, annual: 2290 }
  },
  enterprise: {
    USD: { monthly: 599, annual: 5748 },
    CAD: { monthly: 779, annual: 7500 },
    EUR: { monthly: 539, annual: 5170 },
    GBP: { monthly: 479, annual: 4590 }
  }
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  CAD: 'CA$',
  EUR: '€',
  GBP: '£'
};

// Detect currency from country code
function getCurrencyFromCountry(country) {
  const countryToCurrency = {
    US: 'USD',
    CA: 'CAD',
    GB: 'GBP',
    UK: 'GBP',
    FR: 'EUR',
    DE: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    PT: 'EUR',
    IE: 'EUR',
    FI: 'EUR',
    GR: 'EUR'
  };
  return countryToCurrency[country?.toUpperCase()] || 'USD';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { country, currency: requestedCurrency } = body;

    // Determine currency
    let currency = requestedCurrency || getCurrencyFromCountry(country) || 'USD';
    
    // Validate currency
    if (!['USD', 'CAD', 'EUR', 'GBP'].includes(currency)) {
      currency = 'USD';
    }

    const response = {
      currency,
      symbol: CURRENCY_SYMBOLS[currency],
      pricing: {
        starter: PRICING.starter[currency],
        professional: PRICING.professional[currency],
        enterprise: PRICING.enterprise[currency]
      }
    };

    return Response.json(response);
  } catch (error) {
    console.error('[Currency Pricing] Error:', error);
    return Response.json({ 
      error: error.message,
      // Fallback to USD
      currency: 'USD',
      symbol: '$',
      pricing: {
        starter: PRICING.starter.USD,
        professional: PRICING.professional.USD,
        enterprise: PRICING.enterprise.USD
      }
    }, { status: 500 });
  }
});