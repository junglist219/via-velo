# Feature: GPX-Kartenansicht

## Problem Statement

Bikepacking-Enthusiasten planen ihre Touren häufig mit GPS-Software und exportieren ihre Routen als GPX-Dateien. Es fehlt eine webbasierte Plattform, die es Nutzern erlaubt, eine solche GPX-Datei einfach zu importieren und die Route übersichtlich auf einer Karte mit relevanten Kennzahlen (Distanz, Höhenmeter, Höhenprofil) darzustellen — als Grundlage für die spätere Etappenplanung.

## Solution

Die Anwendung bietet eine Kartenansicht mit einem integrierten GPX-Import. Der Nutzer lädt eine GPX-Datei über einen einfachen Datei-Dialog hoch. Die Route wird sofort auf einer interaktiven Karte visualisiert. Im linken Panel werden die wichtigsten Kennzahlen der Route angezeigt. Unterhalb der Karte ist ein interaktives Höhenprofil eingeblendet. Die gesamte Verarbeitung findet im Browser statt — es ist kein Backend-Roundtrip nötig.

## User Stories

1. Als Bikepacker möchte ich eine GPX-Datei in die App laden, damit ich meine geplante Route digital visualisieren kann.
2. Als Bikepacker möchte ich meine Route auf einer hellen, übersichtlichen Karte sehen, damit ich Gelände und Umgebung gut einschätzen kann.
3. Als Bikepacker möchte ich die Gesamtdistanz meiner Route angezeigt bekommen, damit ich den Umfang meiner Tour kenne.
4. Als Bikepacker möchte ich die Gesamthöhenmeter aufwärts meiner Route sehen, damit ich die Anstrengung der Tour einschätzen kann.
5. Als Bikepacker möchte ich die Gesamthöhenmeter abwärts meiner Route sehen, damit ich die Abfahrtspassagen meiner Tour einschätzen kann.
6. Als Bikepacker möchte ich ein Höhenprofil meiner Route sehen, damit ich den Verlauf von Anstiegen und Abfahrten auf einen Blick erfassen kann.
7. Als Bikepacker möchte ich, dass die Karte nach dem Import automatisch auf meine Route zoomt, damit ich die Route sofort vollständig sehe.
8. Als Bikepacker möchte ich den Start- und Endpunkt meiner Route auf der Karte markiert sehen, damit ich die Richtung der Tour erkennen kann.
9. Als Bikepacker möchte ich eine neue GPX-Datei importieren können, die die vorherige Route ersetzt, damit ich verschiedene Routen vergleichen kann.
10. Als Bikepacker möchte ich eine verständliche Fehlermeldung erhalten, wenn ich eine ungültige Datei hochlade, damit ich weiss, was ich korrigieren muss.
11. Als Bikepacker möchte ich, dass beim Auftreten eines Fehlers meine bisherige Route sichtbar bleibt, damit ich nicht versehentlich meinen Fortschritt verliere.
12. Als Bikepacker möchte ich nur GPX-Dateien importieren können (keine anderen Formate), damit ungewollte Fehler durch falsche Dateitypen vermieden werden.

## User Acceptance Tests

1. Gegeben eine gültige GPX-Datei mit einer Tourenroute, wenn der Nutzer auf „GPX importieren" klickt und die Datei auswählt, dann wird die Route als blaue Linie auf der Karte angezeigt und die Karte zoomt automatisch auf die Route.
2. Gegeben eine angezeigte Route, wenn der Nutzer die Karte betrachtet, dann sind Start- und Endpunkt der Route mit je einem Marker gekennzeichnet.
3. Gegeben eine gültige GPX-Datei mit Höhendaten, wenn die Route geladen ist, dann zeigt das linke Panel die Gesamtdistanz in Kilometern, die Höhenmeter aufwärts in Metern und die Höhenmeter abwärts in Metern an.
4. Gegeben eine gültige GPX-Datei mit Höhendaten, wenn die Route geladen ist, dann wird unterhalb der Karte ein Höhenprofil als Linienchart angezeigt, bei dem die x-Achse die zurückgelegte Distanz und die y-Achse die Höhe in Metern darstellt.
5. Gegeben eine bereits angezeigte Route, wenn der Nutzer eine neue GPX-Datei importiert, dann verschwindet die alte Route und die neue Route wird angezeigt.
6. Gegeben eine korrupte oder nicht-GPX-Datei, wenn der Nutzer versucht diese zu importieren, dann erscheint eine Fehlermeldung im linken Panel und eine eventuell vorher angezeigte Route bleibt sichtbar.
7. Gegeben der Datei-Dialog ist geöffnet, wenn der Nutzer eine Datei mit einer anderen Endung als `.gpx` auswählen möchte, dann wird dieser Dateityp im Dialog nicht zur Auswahl angeboten.

## Definition of Done

- Alle User Acceptance Tests sind erfolgreich durchführbar.
- Die Karte wird mit dem CartoDB-Positron-Kartenstil (hell) dargestellt.
- Die GPX-Verarbeitung findet vollständig im Browser statt — es werden keine Dateien ans Backend gesendet.
- Bei ungültiger Datei erscheint eine Fehlermeldung; eine zuvor geladene Route bleibt erhalten.
- Die Anwendung ist unter der Route `/map` erreichbar.
- Keine Regression in bestehenden Funktionen.

## Out of Scope

- Drag & Drop für den GPX-Import
- Gleichzeitiges Anzeigen mehrerer Routen
- Speichern oder Exportieren von Routen
- Etappenplanung und POI-Suche (folgt in späteren Features)
- Backend-Verarbeitung der GPX-Datei
- Mobile-optimierte Ansicht
- Automatisierte Tests

## Further Notes

Die GPX-Kartenansicht bildet das technische Fundament für das spätere Etappenplanungs-Feature. Die Route (als strukturiertes Datenmodell mit Trackpoints) wird von dieser Komponente bereits so aufbereitet, dass sie für die spätere Aufteilung in Tagesetappen direkt weiterverwendet werden kann.

---

## Technical Annex
> Written against codebase as of: 2026-06-23

### Architectural Decisions

**Tech Stack**

| Zweck | Library | Begründung |
|---|---|---|
| Karte | `leaflet` (vanilla) | `ngx-leaflet` unterstützt Angular 21 nicht zuverlässig; volle Kontrolle |
| Tile-Layer | CartoDB Positron | Kein API-Key, sauberer heller Stil, GPX-Route gut sichtbar |
| GPX-Parsing | `gpxparser` | Einfache API, client-side, kein Backend-Roundtrip |
| Höhenprofil | `chart.js` + `ng2-charts` | Weit verbreitet, leichtgewichtig |

**Domain-Modell**

```typescript
interface TrackPoint {
  lat: number;
  lng: number;
  elevation: number; // Meter
  distanceFromStart: number; // Kilometer
}

interface ParsedRoute {
  trackPoints: TrackPoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
}
```

**Module & Verantwortlichkeiten**

- **`GpxParserService`** — Deep Module. Nimmt ein `File`-Objekt entgegen, gibt ein `ParsedRoute` zurück (oder wirft bei ungültigem GPX). Kapselt die gesamte `gpxparser`-Abhängigkeit. Berechnet Distanz (Haversine-Formel), Höhenmeter auf/ab intern.

- **`MapPageComponent`** — Route `/map`. Orchestriert das Split-Layout. Hält den Zustand der aktuellen Route als Angular Signal (`signal<ParsedRoute | null>`). Leitet Daten an Kind-Komponenten weiter.

- **`GpxImportComponent`** — Enthält `<input type="file" accept=".gpx">`. Emittiert das ausgewählte `File`-Objekt via `EventEmitter`. Zeigt Fehlermeldung (als Input-Property) an.

- **`RouteInfoComponent`** — Reine Darstellungskomponente (Input: `ParsedRoute | null`). Zeigt Distanz, Höhenmeter auf/ab.

- **`MapComponent`** — Initialisiert Leaflet in `ngAfterViewInit`. Reagiert auf Input-Änderungen (Route) via `ngOnChanges`. Zeichnet Polyline, Start/End-Marker. Ruft `map.fitBounds()` auf.

- **`ElevationProfileComponent`** — Chart.js Linienchart. Input: `TrackPoint[]`. x-Achse: `distanceFromStart`, y-Achse: `elevation`.

**Datenfluss**

```
GpxImportComponent
  → (File-Event) → MapPageComponent
  → GpxParserService.parse(file): ParsedRoute
  → signal(parsedRoute) verteilt an:
      ├── MapComponent (rendert Polyline)
      ├── RouteInfoComponent (rendert Kennzahlen)
      └── ElevationProfileComponent (rendert Chart)
```

**Fehlerbehandlung**

`GpxParserService` wirft bei ungültigem GPX. `MapPageComponent` fängt den Fehler und setzt ein `errorMessage`-Signal. `GpxImportComponent` zeigt die Fehlermeldung als Input-Property an. Die vorherige Route (`ParsedRoute`) im Signal bleibt unverändert.

**Karteninitialisierung**

Leaflet wird nur im Browser initialisiert (`afterNextRender` oder `isPlatformBrowser`-Guard, falls SSR relevant wird). CartoDB Positron Tile-URL:
```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```

### Automated Testing Decisions

Keine automatisierten Tests für dieses Feature gewünscht. Verifikation erfolgt ausschliesslich über die User Acceptance Tests (manuell).
