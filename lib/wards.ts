export const WARDS: Record<string, { lat: number; lng: number }> = {
  'andheri':        { lat: 19.1136, lng: 72.8697 },
  'bandra':         { lat: 19.0596, lng: 72.8295 },
  'borivali':       { lat: 19.2307, lng: 72.8567 },
  'chembur':        { lat: 19.0522, lng: 72.9005 },
  'chunabhatti':    { lat: 19.0390, lng: 72.8778 },
  'colaba':         { lat: 18.9067, lng: 72.8147 },
  'dadar':          { lat: 19.0178, lng: 72.8478 },
  'dharavi':        { lat: 19.0376, lng: 72.8540 },
  'ghatkopar':      { lat: 19.0858, lng: 72.9081 },
  'goregaon':       { lat: 19.1663, lng: 72.8526 },
  'juhu':           { lat: 19.1075, lng: 72.8263 },
  'kandivali':      { lat: 19.2042, lng: 72.8491 },
  'kurla':          { lat: 19.0726, lng: 72.8845 },
  'malad':          { lat: 19.1874, lng: 72.8484 },
  'mankhurd':       { lat: 19.0437, lng: 72.9271 },
  'matunga':        { lat: 19.0286, lng: 72.8628 },
  'mulund':         { lat: 19.1726, lng: 72.9563 },
  'powai':          { lat: 19.1197, lng: 72.9051 },
  'santacruz':      { lat: 19.0816, lng: 72.8414 },
  'thane':          { lat: 19.2183, lng: 72.9781 },
  'vikhroli':       { lat: 19.1077, lng: 72.9283 },
  'vile parle':     { lat: 19.0990, lng: 72.8478 },
  'vileparle':      { lat: 19.0990, lng: 72.8478 },
  'wadala':         { lat: 19.0185, lng: 72.8620 },
  'worli':          { lat: 19.0048, lng: 72.8172 },
};

const ALIASES: Record<string, string> = {
  'vile-parle':   'vileparle',
  'vp':           'vileparle',
  'andheri west': 'andheri',
  'andheri east': 'andheri',
  'bandra west':  'bandra',
  'bandra east':  'bandra',
  'kandivli':     'kandivali',
  'borivli':      'borivali',
};

export function resolveWard(name: string): { lat: number; lng: number } | null {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
  const stripped = normalized.replace(/[-_]/g, '');

  if (WARDS[normalized]) return WARDS[normalized];
  if (WARDS[stripped]) return WARDS[stripped];
  if (ALIASES[normalized] && WARDS[ALIASES[normalized]]) return WARDS[ALIASES[normalized]];

  // partial match fallback
  const match = Object.keys(WARDS).find(w => normalized.includes(w) || w.includes(normalized));
  return match ? WARDS[match] : null;
}

export const WARD_NAMES = Object.keys(WARDS);
