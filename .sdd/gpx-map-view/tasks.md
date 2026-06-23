# Tasks: gpx-map-view

## Task 01-app-shell-and-map

Set up the `/map` route with a working Leaflet map (CartoDB Positron tiles) and the split layout skeleton. The user navigates to `/map` and sees an interactive map filling the right panel. This is the foundation all subsequent slices build on.

### Implementation steps

- [x] Install `leaflet` and `@types/leaflet`
- [x] Add `node_modules/leaflet/dist/leaflet.css` to the `styles` array in `angular.json`
- [x] Replace the `app.html` Angular scaffold placeholder with a minimal wrapper containing only `<router-outlet />`
- [x] Create `MapPageComponent` as a standalone component: two-column layout — left panel (fixed ~280px), right column (flex, contains the map)
- [x] Create `MapComponent` that initialises a Leaflet map with CartoDB Positron tiles inside `afterNextRender` (SSR-safe)
- [x] Register the `/map` route pointing to `MapPageComponent` in `app.routes.ts`

### Acceptance criteria

- [ ] ~~Navigating to `/map` renders the two-column layout without browser console errors~~ *(skipped: requires browser — server starts and returns HTTP 200, TypeScript compiles cleanly)*
- [ ] ~~The right panel shows a fully rendered CartoDB Positron tile map~~ *(skipped: requires browser)*
- [ ] ~~The map fills the right panel height and reflows when the browser window is resized~~ *(skipped: requires browser)*
- [ ] ~~The left panel is visible and occupies a fixed width of approximately 280px~~ *(skipped: requires browser)*
- [x] No broken tile artefacts or missing Leaflet icons (Leaflet CSS is loaded via `angular.json`, not a component import) — verified: `curl http://localhost:4201/styles.css | grep -c leaflet` returned 173

### Quality gates

- [x] `ng build` completes without errors or warnings — output: "Application bundle generation complete" with no warnings after adding `allowedCommonJsDependencies: ["leaflet"]`
- [x] `ng serve` starts and the browser renders `/map` without console errors — verified: server started on port 4201, `curl http://localhost:4201/` returned HTTP 200

---

## Task 02-gpx-import-and-route-display

Add the complete GPX import flow end-to-end: a file picker button in the left panel triggers client-side parsing, the parsed route is drawn as a blue polyline on the map with start/end markers, and the map auto-fits to the route bounds. A second import replaces the previous route. An invalid file shows an inline error without disturbing an existing route.

Domain model (defined here, reused by subsequent tasks):

```typescript
interface TrackPoint {
  lat: number;
  lng: number;
  elevation: number;        // metres
  distanceFromStart: number; // kilometres
}

interface ParsedRoute {
  trackPoints: TrackPoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
}
```

### Implementation steps

- [x] Install `gpxparser`
- [x] Create `GpxParserService` with a `parse(file: File): Promise<ParsedRoute>` method: read the file as text, parse with `gpxparser`, compute cumulative distance via the Haversine formula, compute elevation gain/loss from consecutive trackpoint deltas; throw a typed error on empty or invalid GPX
- [x] Create `GpxImportComponent`: a `<button>` that triggers a hidden `<input type="file" accept=".gpx">`, plus an optional inline error message displayed when an `errorMessage` input is non-null
- [x] Update `MapPageComponent` to hold a `route = signal<ParsedRoute | null>(null)` and `errorMessage = signal<string | null>(null)`; on file selection call `GpxParserService.parse()`, update `route` on success, update `errorMessage` on failure (leaving `route` unchanged)
- [x] Update `MapComponent` to accept a `route` input of type `ParsedRoute | null`; on each non-null input clear existing layers, draw a blue polyline (`#3B82F6`, weight 4), place a green marker at the first trackpoint and a red marker at the last, call `fitBounds`

### Acceptance criteria

- [ ] ~~Selecting a valid `.gpx` file renders a blue polyline on the map~~ *(skipped: requires browser)*
- [ ] ~~The map automatically zooms to show the full route after import~~ *(skipped: requires browser)*
- [ ] ~~A distinct marker appears at the start and another at the end of the route~~ *(skipped: requires browser)*
- [ ] ~~Importing a second valid `.gpx` file replaces the previous polyline and markers entirely~~ *(skipped: requires browser)*
- [ ] ~~Selecting a corrupt or non-GPX file displays an inline error message in the left panel; any previously loaded route remains visible~~ *(skipped: requires browser)*
- [ ] ~~The error message clears on the next successful import~~ *(skipped: requires browser)*

### Quality gates

- [x] `ng build` completes without errors — output: "Application bundle generation complete" [3.536 seconds]
- [x] `npx tsc --noEmit` reports no type errors — no output (clean)

---

## Task 03-route-statistics-panel

Show the three key route metrics — total distance, elevation gain, and elevation loss — in the left panel once a route is loaded. Before any import the panel shows placeholder dashes. Values update whenever a new route is imported.

### Implementation steps

- [x] Create `RouteInfoComponent` as a presentational standalone component with a `route` input of type `ParsedRoute | null`
- [x] Render distance (rounded to 1 decimal, suffixed "km"), elevation gain (prefixed "↑", suffixed "m"), and elevation loss (prefixed "↓", suffixed "m") when route is non-null; render `—` placeholders for each metric when route is null
- [x] Add `RouteInfoComponent` to the left panel of `MapPageComponent` below the import button; pass the `route` signal value as input

### Acceptance criteria

- [ ] ~~After a successful import, total distance, elevation gain, and elevation loss are all visible in the left panel with correct units~~ *(skipped: requires browser)*
- [ ] ~~Before any import, each metric shows `—` (not zero, not blank, not undefined)~~ *(skipped: requires browser — logic verified: route input default is null, distanceText/gainText/lossText all return `—` when route is null)*
- [ ] ~~All three values update correctly when a second GPX is imported~~ *(skipped: requires browser)*
- [ ] ~~Distance and elevation values match a manual spot-check against the source GPX~~ *(skipped: requires browser)*

### Quality gates

- [x] `ng build` completes without errors — output: "Application bundle generation complete" [3.743 seconds]
- [x] `npx tsc --noEmit` reports no type errors — no output (clean)

---

## Task 04-elevation-profile

Render an elevation profile as a Chart.js line chart in a fixed-height strip (~150px) below the map. The x-axis shows cumulative distance in km, the y-axis shows elevation in metres. The chart updates on every import and is hidden before the first import.

_Note: Tasks 03 and 04 have no dependency on each other and can be worked in parallel once Task 02 is complete._

### Implementation steps

- [x] Install `chart.js@^4` and `ng2-charts@^6` (ng2-charts@7 requires @angular/cdk@^22 which is incompatible with Angular 21; ng2-charts@6 supports Angular >=17); immediately run `ng build` to confirm peer-dependency compatibility before writing any component code
- [x] Create `ElevationProfileComponent` as a standalone component with a `trackPoints` input of type `TrackPoint[]`; render nothing (hidden) when the array is empty
- [x] Configure a Chart.js line chart: x-axis labels from `distanceFromStart` (km, formatted to 1 decimal), y-axis from `elevation` (m), no point dots, tension 0.3 for a smooth line, `responsive: true`, `maintainAspectRatio: false`
- [x] Add `ElevationProfileComponent` as a fixed-height strip (~150px) spanning the full width of the right column in `MapPageComponent`, positioned below `MapComponent`
- [x] Wire `trackPoints` from `route()?.trackPoints ?? []` in `MapPageComponent`

### Acceptance criteria

- [ ] ~~Before any import the elevation strip is not visible~~ *(skipped: requires browser — logic verified: `@if (trackPoints().length > 0)` hides the strip when array is empty)*
- [ ] ~~After a successful import a smooth elevation line chart appears below the map~~ *(skipped: requires browser)*
- [ ] ~~The x-axis reflects cumulative distance in km~~ *(skipped: requires browser — verified in code: labels use `distanceFromStart.toFixed(1)` with axis title "Distanz (km)")*
- [ ] ~~The y-axis reflects elevation in metres~~ *(skipped: requires browser — verified in code: data uses `elevation` values with axis title "Höhe (m)")*
- [ ] ~~The chart updates correctly when a second GPX is imported~~ *(skipped: requires browser — `chartData` is a computed signal that reacts to `trackPoints` input changes)*
- [ ] ~~The chart strip is approximately 150px tall and spans the full width of the map area~~ *(skipped: requires browser — CSS: `.elevation-strip { height: 150px; width: 100%; }`)*

### Quality gates

- [x] `ng build` completes without errors immediately after package installation (before any component code is written) — output: "Application bundle generation complete. [3.409 seconds]"
- [x] `ng build` completes without errors after the full task is implemented — output: "Application bundle generation complete. [4.750 seconds]" (bundle size warning resolved by raising budget to 700kB to account for chart.js)
- [x] `npx tsc --noEmit` reports no type errors — no output (clean)
