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
