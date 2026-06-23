import { Injectable } from '@angular/core';
import GpxParser from 'gpxparser';
import type { ParsedRoute, TrackPoint } from './models';

@Injectable({ providedIn: 'root' })
export class GpxParserService {
  parse(file: File): Promise<ParsedRoute> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const xml = e.target?.result as string;
          const parser = new GpxParser();
          parser.parse(xml);

          const tracks = parser.tracks;
          if (!tracks || tracks.length === 0) {
            reject(new Error('Keine Tracks in der GPX-Datei gefunden.'));
            return;
          }

          const track = tracks[0];
          const points = track.points;

          if (!points || points.length < 2) {
            reject(new Error('Zu wenige Trackpunkte in der GPX-Datei.'));
            return;
          }

          const cumulDistancesM = track.distance.cumul as unknown as number[];

          const trackPoints: TrackPoint[] = points.map((pt, i) => ({
            lat: pt.lat,
            lng: pt.lon,
            elevation: pt.ele ?? 0,
            distanceFromStart: (cumulDistancesM[i] ?? 0) / 1000,
          }));

          resolve({
            trackPoints,
            totalDistanceKm: track.distance.total / 1000,
            elevationGainM: track.elevation.pos ?? 0,
            elevationLossM: track.elevation.neg ?? 0,
          });
        } catch {
          reject(new Error('Ungültige oder beschädigte GPX-Datei.'));
        }
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsText(file);
    });
  }
}
