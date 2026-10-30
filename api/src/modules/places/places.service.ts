import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { find as findTz } from 'geo-tz';

/**
 * Offline place search for birth places (no paid geocoding API).
 * Data: GeoNames cities with population ≥ 1000 via the all-the-cities package (CC BY 4.0, credit GeoNames).
 * Time zones: geo-tz (offline polygon lookup).
 */
export interface Place {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population: number;
  label: string;
}

interface CityRow {
  cityId: number;
  name: string;
  altName: string;
  country: string;
  population: number;
  loc: { coordinates: [number, number] };
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', NP: 'Nepal', US: 'United States', GB: 'United Kingdom', AE: 'United Arab Emirates', CA: 'Canada',
  AU: 'Australia', SG: 'Singapore', NZ: 'New Zealand', LK: 'Sri Lanka', BD: 'Bangladesh', PK: 'Pakistan',
  DE: 'Germany', FR: 'France', NL: 'Netherlands', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman',
  ZA: 'South Africa', MY: 'Malaysia', MU: 'Mauritius', FJ: 'Fiji', IT: 'Italy', IE: 'Ireland', JP: 'Japan',
};

@Injectable()
export class PlacesService {
  private readonly logger = new Logger('Places');
  private rows: (CityRow & { key: string; alt: string })[] | null = null;
  private byId = new Map<string, CityRow>();

  private load() {
    if (this.rows) return this.rows;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cities: CityRow[] = require('all-the-cities');
    this.rows = cities
      .map((c) => ({ ...c, key: PlacesService.norm(c.name), alt: PlacesService.norm(c.altName ?? '') }))
      .sort((a, b) => b.population - a.population);
    for (const c of this.rows) this.byId.set(String(c.cityId), c);
    this.logger.log(`Loaded ${this.rows.length} places`);
    return this.rows;
  }

  private static norm(s: string) {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private toPlace(c: CityRow): Place {
    const [longitude, latitude] = c.loc.coordinates;
    const timezone = findTz(latitude, longitude)[0] ?? 'UTC';
    const country = COUNTRY_NAMES[c.country] ?? c.country;
    return {
      id: String(c.cityId),
      name: c.name,
      country,
      latitude,
      longitude,
      timezone,
      population: c.population,
      label: `${c.name}, ${country}`,
    };
  }

  /** Prefix search, largest places first, India ranked ahead of other countries. */
  search(q: string, limit = 10): Place[] {
    const needle = PlacesService.norm(q);
    if (needle.length < 2) return [];
    const rows = this.load();
    const india: CityRow[] = [];
    const rest: CityRow[] = [];
    for (const c of rows) {
      const hit = (c as { key: string }).key.startsWith(needle) || (c as { alt: string }).alt.split(',').some((a) => a.startsWith(needle));
      if (!hit) continue;
      (c.country === 'IN' ? india : rest).push(c);
      if (india.length >= limit) break;
    }
    return [...india, ...rest].slice(0, limit).map((c) => this.toPlace(c));
  }

  getById(id: string): Place {
    this.load();
    const c = this.byId.get(id);
    if (!c) throw new NotFoundException('Place not found');
    return this.toPlace(c);
  }
}
