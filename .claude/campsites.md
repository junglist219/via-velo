# Schritt 3 — Campingplätze an Etappenzielen (OSM Overpass)

## Context

Die Via-Velo-App führt den Nutzer in drei Schritten: **Import** (GPX) → **Etappen**
(Tagesetappen planen) → **Camping**. Schritte 1 und 2 sind implementiert; der
Step-Indicator zeigt „Camping" bereits an, aber es gibt keine Logik dafür.

Schritt 3 soll an den **Zwischenstopps** der Etappenplanung (Übernachtungsorte =
Ende jeder Etappe ausser dem finalen Routenziel) über die **OSM Overpass API**
Campingplätze im Umkreis suchen. Startradius **10 km**; findet sich kein Platz,
wird eine **Warnung** angezeigt und der Radius iterativ um **5 km** vergrössert,
bis mindestens ein Platz gefunden ist (mit Obergrenze gegen Endlosschleifen). Die
**Radien** werden als hellerer Kreis-Layer, die **Campingplätze** als anklickbare
Marker auf der Karte dargestellt. Ein Klick zeigt **Name, Adresse, Homepage-Link
(falls vorhanden) und Google-Maps-Link**.

### Entscheidungen (mit dem Nutzer geklärt)
- **Trigger:** Automatisch, sobald ein gültiger Etappenplan existiert.
- **Sichtbarkeit:** Alle Etappenziele gleichzeitig auf der Karte.
- **Etappenziele:** Nur Zwischenstopps (n−1 bei n Etappen); finales Routenziel ausgeschlossen.
- **Platztypen:** `tourism=camp_site` **und** `tourism=caravan_site`.

## Architektur-Fit

Bestehende Muster, die wiederverwendet werden:
- Signal-/computed-basierter State in `map-page.component.ts` (analog zu `route`, `stages`, `selectedStageIndex`).
- Leaflet-Rendering in `map.component.ts`: ein `effect()` zeichnet `routeLayer` bei Input-Änderung neu; Marker via `L.divIcon` + `.bindPopup()`; `L.circleMarker` für Start/Ende.
- `@Injectable({ providedIn: 'root' })`-Services neben den Map-Dateien (`gpx-parser.service.ts`, `stage-planner.service.ts`).
- Fehleranzeige-Muster über ein Signal (`errorMessage`) + bedingtes Markup.

## Änderungen

### 1. HttpClient bereitstellen — `src/app/app.config.ts`
`provideHttpClient(withFetch())` zu `providers` hinzufügen. Bisher kein HttpClient
provider vorhanden.

### 2. Modelle — `src/app/map/models.ts`
Neue Interfaces ergänzen:
```ts
export interface Campground {
  id: number;
  lat: number;
  lng: number;
  name: string;          // Fallback "Campingplatz" wenn kein name-Tag
  address: string | null;
  website: string | null;
}

export interface CampStop {
  stageIndex: number;    // Etappe, an deren Ende der Stopp liegt
  lat: number;
  lng: number;
  radiusKm: number;      // letztlich verwendeter Suchradius
  expanded: boolean;     // true, wenn über 10 km hinaus gesucht werden musste
  campgrounds: Campground[];
}
```

### 3. Neuer Service — `src/app/map/campground.service.ts`
- `inject(HttpClient)`; Overpass-Endpoint als modulweite Konstante
  (`https://overpass-api.de/api/interpreter`).
- `findNear(lat, lng): Promise<{ campgrounds, radiusKm, expanded }>`:
  - Iteration: Radius bei **10 km** beginnen, bei 0 Treffern um **5 km** erhöhen
    (max. z. B. **50 km**, danach mit leerem Ergebnis abbrechen).
  - Overpass-QL pro Iteration (node + way, beide Tag-Typen):
    ```
    [out:json][timeout:25];
    (
      node["tourism"="camp_site"](around:R,LAT,LNG);
      way["tourism"="camp_site"](around:R,LAT,LNG);
      node["tourism"="caravan_site"](around:R,LAT,LNG);
      way["tourism"="caravan_site"](around:R,LAT,LNG);
    );
    out center tags;
    ```
  - POST mit `body=<query>` als `text/plain`; `firstValueFrom(...)` aus rxjs.
  - Mapping Overpass-Element → `Campground`: `lat/lon` bzw. `center.lat/lon`;
    `name` aus `tags.name` (sonst Fallback); `website` aus `tags.website ??
    tags['contact:website']`; `address` aus `addr:street`/`housenumber`/
    `postcode`/`city` zusammengesetzt (oder `null`).
  - Google-Maps-Link wird im Popup aus Koordinaten erzeugt, daher nicht im Modell.

### 4. Page-State & Auto-Trigger — `src/app/map/map-page.component.ts`
- Neue Signals: `campStops = signal<CampStop[]>([])`, `campLoading = signal(false)`,
  `campWarnings = computed(...)` (Liste der Stopps mit `expanded` bzw. leerem Ergebnis).
- `inject(CampgroundService)`.
- `effect()`, der `stages()` liest und bei ≥2 Etappen die Zwischenstopp-Koordinaten
  bestimmt (`route().trackPoints[stage.endPointIndex]` für `k = 0 … n−2`) und
  `loadCampgrounds(stops)` auslöst. **Cancellation/Race-Schutz** über einen
  Request-Token (Zähler), damit veraltete Antworten bei schneller Etappenänderung
  verworfen werden. Identische Stopp-Sets nicht erneut abfragen.
- `loadCampgrounds`: `campLoading.set(true)`, Stopps **parallel** abfragen
  (`Promise.all`, wenige Stopps), Ergebnis als `CampStop[]` setzen,
  Fehlerbehandlung analog `errorMessage`.
- `currentStep` erweitern: `route() ? (campStops().length || campLoading() ? 3 : 2) : 1`.

### 5. Karte — `src/app/map/map.component.ts` (+ `.scss`)
- Neuer Input `campStops = input<CampStop[]>([])`; im Render-`effect()` mittracken.
- In `render()` nach den Etappen:
  - Pro Stopp einen **hellen Radius-Kreis**: `L.circle([lat,lng], { radius: radiusKm*1000, color, weight:1, fillColor: color, fillOpacity:0.08, opacity:0.4 })` (Farbe via `stageColor(stop.stageIndex)` für visuelle Kopplung an die Etappe).
  - Pro Campingplatz einen **Marker** (`L.divIcon`, Zelt-Symbol `⛺`/SVG) mit
    `.bindPopup(html, { maxWidth: 260 })`. Popup-HTML: Name (`<strong>`), Adresse,
    Homepage-Link (nur wenn `website`), Google-Maps-Link
    `https://www.google.com/maps/search/?api=1&query=LAT,LNG`. Links mit
    `target="_blank" rel="noopener"`.
- `.scss`: `::ng-deep`-Styles für `.campground-marker` (analog `.stage-marker__badge`) und `.campground-popup`.

### 6. Neue Panel-Komponente — `src/app/map/camping-list.component.{ts,html,scss}`
Standalone, OnPush; analog zu `stage-list.component`. Zeigt pro Zwischenstopp:
Etappennummer, Anzahl gefundener Plätze, verwendeten Radius und eine **Warnung**,
wenn `expanded` (kein Platz in 10 km) bzw. wenn trotz Maximalradius nichts gefunden
wurde. Optional Lade-Hinweis bei `campLoading`. Inputs: `campStops`, `loading`.

### 7. Verdrahtung — `src/app/map/map-page.component.html`
- `<app-camping-list [campStops]="campStops()" [loading]="campLoading()">` im Panel
  (unterhalb der `stage-list-region`).
- `<app-map ... [campStops]="campStops()">`.
- `camping-list` zu den `imports` in `map-page.component.ts` hinzufügen.

## Kritische Dateien
- `src/app/app.config.ts` (HttpClient)
- `src/app/map/models.ts` (neue Interfaces)
- `src/app/map/campground.service.ts` (**neu** — Overpass + iterative Radiussuche)
- `src/app/map/map-page.component.ts` / `.html` (State, Auto-Trigger, Verdrahtung)
- `src/app/map/map.component.ts` / `.scss` (Radius-Kreise + Camping-Marker/Popups)
- `src/app/map/camping-list.component.{ts,html,scss}` (**neu** — Status/Warnungen)

## Verifikation
1. `cd ui && ng build` — kompiliert ohne TS-Fehler (strict).
2. `ng serve`, GPX importieren, Etappenzahl > 1 wählen.
  - Erwartung: pro Zwischenstopp ein heller Kreis (10 km) + Camping-Marker.
  - Marker anklicken → Popup mit Name, Adresse, Homepage-Link (falls vorhanden), Google-Maps-Link.
3. Etappenziel ohne Platz in 10 km (z. B. abgelegene Region): Warnung im Camping-Panel, Kreis sichtbar grösser (10/15/20 … km).
4. Etappenzahl ändern → Stopps/Kreise/Marker aktualisieren sich automatisch; keine veralteten Marker (Race-Token greift).
5. Network-Tab: POST an Overpass nur bei Etappenänderung, nicht bei reiner Etappen-Selektion.
