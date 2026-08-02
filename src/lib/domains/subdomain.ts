import type { BusinessDomain, DomainStatus } from '@/types';

// The root domain under which every business gets a free subdomain.
// A wildcard TLS certificate covers `*.afribook.xyz` so business pages
// are served over HTTPS at no cost to the vendor.
export const ROOT_DOMAIN = 'afribook.xyz';

// Edge target for the CNAME/DNS record pointing a subdomain at AfriBook.
export const EDGE_TARGET = `edge.${ROOT_DOMAIN}`;

export const SUBDOMAIN_MIN_LENGTH = 3;
export const SUBDOMAIN_MAX_LENGTH = 63;

const SUBDOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'app', 'edge', 'mail', 'smtp', 'imap', 'pop',
  'ftp', 'blog', 'shop', 'store', 'support', 'help', 'status', 'docs',
  'cdn', 'assets', 'static', 'web', 'dev', 'test', 'staging', 'prod',
  'afribook', 'accounts', 'billing', 'payments', 'auth', 'login',
  'register', 'events', 'vendor', 'driver', 'business',
]);

/**
 * Converts a free-text business name into a DNS-safe subdomain slug.
 * Kept in sync with the SQL `generate_business_subdomain` helper.
 */
export function slugifySubdomain(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, SUBDOMAIN_MAX_LENGTH);

  if (slug.length < SUBDOMAIN_MIN_LENGTH) {
    slug = `biz-${slug}`;
  }
  slug = slug.replace(/(^-+|-+$)/g, '');

  return slug || 'business';
}

export function isValidSubdomain(subdomain: string): boolean {
  if (typeof subdomain !== 'string') return false;
  const s = subdomain.toLowerCase();
  return (
    s.length >= SUBDOMAIN_MIN_LENGTH &&
    s.length <= SUBDOMAIN_MAX_LENGTH &&
    SUBDOMAIN_PATTERN.test(s) &&
    !RESERVED_SUBDOMAINS.has(s)
  );
}

export function buildFullDomain(subdomain: string): string {
  return `${subdomain}.${ROOT_DOMAIN}`;
}

export function getSubdomainUrl(subdomain: string): string {
  return `https://${buildFullDomain(subdomain)}`;
}

/**
 * DNS records required to route `<subdomain>.afribook.xyz` to the AfriBook
 * edge. For the free wildcard setup the zone is managed by AfriBook, so these
 * are reference records — they do not need to be created by the vendor.
 */
export function buildDnsRecords(subdomain: string): Record<string, unknown> {
  const host = buildFullDomain(subdomain);
  return {
    cname: [
      {
        host,
        target: EDGE_TARGET,
        ttl: 3600,
        type: 'CNAME',
      },
    ],
    txt: [
      {
        host,
        value: `afribook-site-verification=${subdomain}`,
        ttl: 3600,
        type: 'TXT',
      },
    ],
  };
}

export function isDomainActive(domain: Pick<BusinessDomain, 'status'>): boolean {
  return domain.status === 'active';
}

export function domainStatusLabel(status: DomainStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Provisioning';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}
