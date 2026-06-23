# Etappenplanung (Schritt 2 der Reiseplanung)

## Context

Die App (`ui/src/app/map/`) kann aktuell eine GPX-Route importieren und als einzelne
Polyline mit Start-/Endmarker, Distanz/Höhenmeter-Infos und Höhenprofil anzeigen
(Schritt 1). Jetzt soll **Schritt 2** dazukommen: Der Nutzer teilt die importierte Route
in **Tagesetappen** auf.

Ziele:
- Automatischer **Vorschlag** für die Anzahl Tage, abhängig von Distanz **und** Höhenmetern
  (typische Etappe 60–100 km, bei viel Anstieg kürzer).
- Anpassung über **gekoppelte Bedienelemente**: Slider/Eingabe für Etappenlänge (km) und
  ein Eingabefeld für Anzahl Tage — beide aktualisieren sich gegenseitig.
- Etappen werden **nach Aufwand (km + Höhenmeter)** ausbalanciert, nicht rein nach Distanz.
- Pro Etappe wird eine **geschätzte Fahrzeit (h/min)** angezeigt (Distanz + Höhenmeter-Modell).
- Auf der Karte sind die Etappen als farbige Segmente sichtbar und **durchklickbar**;
  eine **Liste** zeigt pro Etappe Distanz, Höhenmeter (↑/↓) und Dauer.

Schritt 3 (Campingplätze via OSM an den Etappenzielen) ist **nicht** Teil dieses Tasks,
wird aber durch eine leichtgewichtige Schrittanzeige vorbereitet.

## Domänenmodell — `map/models.ts` (erweitern)

```ts
export interface Stage {
  index: number;            // 0-basiert
  startPointIndex: number;  // Index in ParsedRoute.trackPoints
  endPointIndex: number;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  durationMinutes: number;  // Gesamtminuten; Formatierung im UI
}
```

`ParsedRoute` bleibt unverändert. Die Etappenliste wird zur Laufzeit berechnet, nicht
persistiert.

## Berechnungslogik — neuer `map/stage-planner.service.ts`

Reine, testbare Funktionen (`@Injectable({ providedIn: 'root' })`), keine UI.

Konstanten (oben im File, kommentiert/tunebar):
- `RIDING_SPEED_KMH = 18` — Reisegeschwindigkeit beladenes Tourenrad.
- `CLIMB_PENALTY_KM_PER_100M = 1` — 100 Hm ≙ 1 km Zusatzaufwand.
- `EFFORT_PER_DAY_KM = 95` — Ziel-Aufwand pro Tag für den Vorschlag.

Aufwand-Metrik: `effortKm = distanceKm + elevationGainM / 100 * CLIMB_PENALTY_KM_PER_100M`.

Methoden:
- `suggestDays(route): number`
  → `clamp(1, maxStages, Math.round(totalEffortKm / EFFORT_PER_DAY_KM))`.
  Liefert bei flachen Routen ~100 km/Tag, bei bergigen weniger → erfüllt 60–100 km.
- `planStages(route, numberOfStages): Stage[]`
  → Gesamtaufwand `totalEffort` über alle Segmente; `targetEffort = totalEffort / N`.
  Punkte durchlaufen, Segment-Aufwand (Distanzdelta + positives Höhendelta/100)
  kumulieren; bei jedem Überschreiten von `k * targetEffort` eine Etappe schneiden.
  Letzte Etappe endet garantiert am letzten Punkt. Pro Etappe `distanceKm`
  (Distanzdifferenz Start↔Ende), `elevationGainM`/`elevationLossM` (Summe der ±Höhendeltas
  im Slice) und `durationMinutes` via `estimateDurationMinutes` berechnen.
- `estimateDurationMinutes(distanceKm, gainM): number`
  → `(distanceKm + gainM/100 * CLIMB_PENALTY_KM_PER_100M) / RIDING_SPEED_KMH * 60`.

Edge cases: `numberOfStages` auf `[1, trackPoints.length - 1]` clampen; Route mit < 2
Punkten → leeres Array.

Unit-Test `map/stage-planner.service.spec.ts` (vitest ist vorhanden): N Etappen werden
erzeugt, Summe der Etappen-km ≈ `totalDistanceKm`, Etappen haben ~gleichen Aufwand,
`suggestDays` plausibel für flach vs. bergig.

## State / Orchestrierung — `map-page.component.ts`

`MapPageComponent` bleibt Orchestrator (Signals):
- vorhanden: `route = signal<ParsedRoute | null>(null)`, `errorMessage`.
- neu:
  - `numberOfStages = signal<number>(1)` — **Single Source of Truth** der Kopplung.
  - `stages = computed(...)` → `planner.planStages(route(), numberOfStages())` (leer wenn keine Route).
  - `selectedStageIndex = signal<number | null>(null)`.
  - `currentStep = computed(() => route() ? 2 : 1)`.
- Bei neuem Import (`onFileSelected`): nach `route.set(...)` `numberOfStages` auf
  `planner.suggestDays(parsed)` setzen und `selectedStageIndex` zurücksetzen.

`GpxParserService` und `onFileSelected` bleiben unverändert (nur Erweiterung).

## Komponenten (Standalone, je `.ts`/`.html`/`.scss` — externe Templates/Styles laut CLAUDE.md)

1. **`stage-planner.component.*`** — Bedienelemente.
  - Input `route` (für totalKm + `suggestedDays`-Anzeige), `model()` `numberOfStages`
    (Two-Way `[(numberOfStages)]`).
  - Slider (`<input type="range">`, `@angular/forms`) + Zahlenfeld für **Etappenlänge km**;
    separates Zahlenfeld für **Tage**. Alle gekoppelt über `numberOfStages`:
    - km-Wert (angezeigt) = `totalKm / N`; Edit km → `N = clamp(round(totalKm / km))`.
    - Tage = `N`; Edit Tage → `N`.
  - Zeigt den Vorschlag an („Vorschlag: N Tage").
  - Slider-Range z. B. 30–150 km.

2. **`stage-list.component.*`** — Etappenliste.
  - Inputs `stages`, `model()` `selectedIndex`.
  - Pro Etappe: „Etappe k", Distanz (km), ↑Gain/↓Loss (m), Dauer (über `DurationPipe`).
  - Klick auf Eintrag → `selectedIndex` setzen. Prev/Next-Buttons im Header zum
    **Durchklicken** der Etappen.

3. **`duration.pipe.ts`** — `transform(minutes) → "Xh Ym"` (bzw. „Y min" wenn < 1 h).
   Wird von der Etappenliste genutzt.

4. **`step-indicator.component.*`** — schlanke Schrittanzeige „1 Import · 2 Etappen ·
   3 Camping", Input `currentStep`; Schritte ≥ aktuell hervorgehoben. Nur Anzeige.

5. **`map.component.*`** — erweitern, um Etappen statt einzelner Polyline zu rendern.
  - Auf Signal-Inputs umstellen (Konvention): `route = input(...)`, neu
    `stages = input<Stage[]>([])`, `selectedStageIndex = input<number | null>(null)`,
    Output `stageSelected = output<number>()`.
  - `afterNextRender` für Init beibehalten; Re-Render per `effect()` (statt `ngOnChanges`),
    mit Guard, dass die Karte initialisiert ist.
  - Rendering: jede Etappe als eigene Polyline aus einer Farbpalette; nummerierte
    Boundary-Marker an jedem Etappenstart + Endmarker. Ausgewählte Etappe dicker/kräftig,
    übrige gedimmt; `fitBounds` auf die ausgewählte Etappe. Klick auf Segment/Marker →
    `stageSelected.emit(index)`. Fällt auf bisherige Einzel-Polyline zurück, wenn `stages`
    leer.

## Layout — `map-page.component.html` / `.scss`

Panel (`aside`) von oben nach unten: `app-step-indicator`, `app-gpx-import`,
`app-route-info`, `app-stage-planner`, `app-stage-list`. Map-Bereich: `app-map`
(jetzt etappenfähig, mit `[(selectedStageIndex)]`-artiger Kopplung über Input + Output)
+ `app-elevation-profile`. Bestehende Flex-Struktur beibehalten; Liste scrollbar.
  Bindings in `map-page.component.html`: `[(numberOfStages)]`, `[stages]`,
  `[selectedStageIndex]` / `(stageSelected)` an Map und Liste.

## Betroffene / neue Dateien

- erweitern: `map/models.ts`, `map/map-page.component.ts|html|scss`,
  `map/map.component.ts|html|scss`
- neu: `map/stage-planner.service.ts` (+ `.spec.ts`),
  `map/stage-planner.component.ts|html|scss`,
  `map/stage-list.component.ts|html|scss`,
  `map/step-indicator.component.ts|html|scss`,
  `map/duration.pipe.ts`

## Verifikation

1. `npx ng build` — kompiliert ohne Fehler.
2. `npx ng test` — `stage-planner.service.spec.ts` grün.
3. `ng serve`, GPX importieren und manuell prüfen:
  - Vorschlag für Tage erscheint; Etappen werden automatisch erzeugt.
  - Slider/km-Feld und Tage-Feld aktualisieren sich gegenseitig; Etappen reflowen.
  - Liste zeigt pro Etappe km, ↑/↓ Hm und Dauer (h/min).
  - Karte zeigt farbige Etappensegmente + nummerierte Marker.
  - Klick auf Listeneintrag bzw. Prev/Next hebt Etappe hervor und zoomt; Klick auf
    Kartensegment selektiert ebenfalls.
  - Bergige Route → kürzere km-Etappen als flache Route (Aufwandsausgleich sichtbar).
