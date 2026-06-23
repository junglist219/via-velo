export interface TrackPoint {
  lat: number;
  lng: number;
  elevation: number;
  distanceFromStart: number;
}

export interface ParsedRoute {
  trackPoints: TrackPoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
}

export interface Stage {
  index: number; // 0-based
  startPointIndex: number; // index into ParsedRoute.trackPoints
  endPointIndex: number;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  durationMinutes: number; // total minutes; formatting happens in the UI
}

export interface Campground {
  id: number;
  lat: number;
  lng: number;
  name: string; // fallback "Campingplatz" when no name tag
  address: string | null;
  website: string | null;
}

export interface CampStop {
  stageIndex: number; // stage whose END is this stopover
  lat: number;
  lng: number;
  radiusKm: number; // radius at which the search settled
  expanded: boolean; // true when radiusKm >= 20 (had to widen meaningfully)
  campgrounds: Campground[];
}

export interface CampStopView {
  stageIndex: number; // identifies the stopover and its trigger target
  result: CampStop | null; // null until this stop has been searched
  loading: boolean; // this stop's request is in flight
  error: string | null; // this stop's last failure, if any
}
