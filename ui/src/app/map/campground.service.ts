import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Campground } from './models';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// Search radii (km) tried in ascending order. The search stops at the first
// radius that yields at least one result; if the widest radius yields nothing
// it settles there with an empty, warned result.
const RADIUS_STEPS_KM = [10, 20, 30];

// A result is considered "expanded" (meaningfully widened) once the settled
// radius reaches this threshold — used to drive the panel's far-away / not-found
// warnings.
const EXPANDED_THRESHOLD_KM = 20;

interface OverpassTags {
  name?: string;
  website?: string;
  'contact:website'?: string;
  'addr:street'?: string;
  'addr:housenumber'?: string;
  'addr:postcode'?: string;
  'addr:city'?: string;
  [key: string]: string | undefined;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

@Injectable({ providedIn: 'root' })
export class CampgroundService {
  private readonly http = inject(HttpClient);

  async findNear(
    lat: number,
    lng: number,
  ): Promise<{ campgrounds: Campground[]; radiusKm: number; expanded: boolean }> {
    for (const radiusKm of RADIUS_STEPS_KM) {
      const campgrounds = await this.queryRadius(lat, lng, radiusKm);
      if (campgrounds.length > 0) {
        return { campgrounds, radiusKm, expanded: radiusKm >= EXPANDED_THRESHOLD_KM };
      }
    }
    // Nothing found even at the widest radius: settle there with an empty result.
    const radiusKm = RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1];
    return { campgrounds: [], radiusKm, expanded: radiusKm >= EXPANDED_THRESHOLD_KM };
  }

  private async queryRadius(lat: number, lng: number, radiusKm: number): Promise<Campground[]> {
    const query = this.buildQuery(lat, lng, radiusKm);
    const response = await firstValueFrom(
      this.http.post<OverpassResponse>(OVERPASS_ENDPOINT, query, {
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    return (response.elements ?? []).map((el) => this.toCampground(el));
  }

  private buildQuery(lat: number, lng: number, radiusKm: number): string {
    const r = Math.round(radiusKm * 1000);
    return `[out:json][timeout:25];
(
  node["tourism"="camp_site"](around:${r},${lat},${lng});
  way["tourism"="camp_site"](around:${r},${lat},${lng});
  node["tourism"="caravan_site"](around:${r},${lat},${lng});
  way["tourism"="caravan_site"](around:${r},${lat},${lng});
);
out center tags;`;
  }

  private toCampground(el: OverpassElement): Campground {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    const tags = el.tags ?? {};
    return {
      id: el.id,
      lat,
      lng,
      name: tags.name ?? 'Campingplatz',
      address: this.assembleAddress(tags),
      website: tags.website ?? tags['contact:website'] ?? null,
    };
  }

  private assembleAddress(tags: OverpassTags): string | null {
    const streetLine = [tags['addr:street'], tags['addr:housenumber']]
      .filter(Boolean)
      .join(' ');
    const cityLine = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
    const parts = [streetLine, cityLine].filter((p) => p.length > 0);
    return parts.length > 0 ? parts.join(', ') : null;
  }
}
