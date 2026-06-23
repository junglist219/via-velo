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
