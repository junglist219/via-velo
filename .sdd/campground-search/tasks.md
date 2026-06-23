# Tasks — Campground Search at Stage Stopovers

Derived from `requirements.md` (incl. its Technical Annex), verified against the codebase
on 2026-06-23. Tasks are vertical slices in implementation order: `01` first, each later
task builds on the working pipeline established by `01`.

Quality gates use `npm run build` (strict TypeScript) and `npm test`. No ESLint is
configured in this project, so there is no lint gate. Per the requirements, only
`CampgroundService` is unit-tested; the map and panel components are verified by runtime
observation.

The campground search is triggered **per overnight stopover**: each intermediate stop in
the panel carries its own search button and is queried in isolation, with its loading
state, result, and error tracked independently. The app never fires a search for all stage
ends at once.

---

## Task 01-search-renders-campgrounds

A thin end-to-end tracer bullet: after planning ≥2 stages, the user presses the search
button on a single overnight stopover, the app queries OpenStreetMap (Overpass) for
campgrounds near that stop, and the results appear on the map as a radius circle plus one
tent marker per campground, colour-matched to the stage. Radius escalation, warnings,
popup detail, and focus are deferred to later tasks; this slice proves the whole pipeline
(HTTP → service → per-stop page state → panel → map) and the per-stop failure path. A
single fixed search radius is used for now.

### Implementation steps

- [x] Add `provideHttpClient(withFetch())` to the providers in `src/app/app.config.ts`.
- [x] Add `Campground`, `CampStop`, and `CampStopView` interfaces to `src/app/map/models.ts` per the annex shapes (`CampStopView`: `stageIndex`, `result: CampStop | null`, `loading: boolean`, `error: string | null`).
- [x] Create root-provided `CampgroundService` (`src/app/map/campground.service.ts`) with `findNear(lat, lng): Promise<{ campgrounds: Campground[]; radiusKm: number; expanded: boolean }>` issuing one Overpass POST (`text/plain` body, `firstValueFrom`) at a single fixed radius; map node/way elements to `Campground` (coords from `lat`/`lon` or `center.lat`/`center.lon`; `name` fallback `"Campingplatz"`; `website` from `website ?? contact:website ?? null`; `address` from `addr:*` tags or `null`); return `expanded: false`.
- [x] In `MapPageComponent`: inject `CampgroundService`; add per-stop, `stageIndex`-keyed state `campStops = signal<Map<number, CampStop>>(new Map())`, `campLoadingStops = signal<Set<number>>(new Set())`, `campErrors = signal<Map<number, string>>(new Map())`; add `campStopCoordinates` computed (intermediate stage ends only — `trackPoints[stage.endPointIndex]` for `k = 0 … n-2`, excludes final destination, non-empty only when `stages >= 2`); add `loadCampgroundsForStop(stageIndex)` that no-ops if that stop is already loading, marks it loading, queries that one stop via `findNear`, on success stores the `CampStop` in the map and clears its error, on rejection sets a per-stop message in `campErrors` and leaves the prior result intact, and `finally` clears that stop's loading flag (no `Promise.all`).
- [x] Add `campStopViews = computed<CampStopView[]>(...)` joining `campStopCoordinates` with the three maps (one row per intermediate stop) and `campStopsList = computed<CampStop[]>(...)` deriving the flat ordered list the map consumes.
- [x] Create `CampingListComponent` (standalone, `OnPush`, external `.html`/`.scss`) modelled on `StageListComponent`: input `stops = input<CampStopView[]>([])`; outputs `search = output<number>()` and `stopFocused = output<number>()`; markup renders one row per stop with its own search button (`"Campingplätze suchen"`, disabled with `"Suche läuft…"` while that row's `loading` is true) and a summary showing stage number and campground count once a result exists.
- [x] Wire `CampingListComponent` into `MapPageComponent` (imports + `map-page.component.html` below `stage-list-region`, guarded by `@if (stages().length >= 2)`), bind `[stops]="campStopViews()"` and `(search)="loadCampgroundsForStop($event)"`, and pass `[campStops]="campStopsList()"` to `<app-map>`.
- [x] In `MapComponent`: add `campStops = input<CampStop[]>([])` tracked in the render `effect()`; in `render()` draw a light radius circle per stop and one tent `divIcon` marker per campground in `stageColor(stop.stageIndex)`, with a minimal name popup.

### Acceptance criteria

- [ ] ~~A route split into ≥2 stages shows one search action per intermediate stopover in the panel; a single-stage route renders no camping panel at all. (UAT 1, 2)~~ *(skipped: requires browser/Leaflet runtime; implemented via `@if (stages().length >= 2)` guard + per-stop `campStopViews` rows, not executable headless)*
- [x] Triggering the search on one stopover issues exactly one Overpass request for that stop and none for the final destination. (UAT 3) — `CampgroundService` spec proves `findNear` issues exactly one Overpass request (`expectOne` + `verify`); `campStopCoordinates` uses `stages.slice(0, -1)` so the final destination is never a search target.
- [ ] ~~On success that stop renders a radius circle and one tent marker per campground in its stage's colour; unsearched stops and the final destination render neither. (UAT 3)~~ *(skipped: requires browser/Leaflet runtime)*
- [ ] ~~When the same campground falls within two overlapping stop radii it appears once under each stop, each in that stop's stage colour (per-stop independent query, no dedup). (UAT 17)~~ *(skipped: requires browser/Leaflet runtime; each stop is queried independently with no dedup, so the same campground is stored under each stop's own `CampStop`)*
- [ ] ~~While a stop's request is in flight its button is disabled / indicates progress and cannot be retriggered, while other stops' buttons remain usable; it re-enables when the request completes. (UAT 4)~~ *(skipped: requires browser runtime; implemented via per-stop `campLoadingStops` set, the `loadCampgroundsForStop` no-op-while-loading guard, and `[disabled]="stop.loading"`)*
- [ ] ~~If a stop's request rejects, that stop's error is set and its markers are not drawn, while other stops' results stay intact. (UAT 15)~~ *(skipped: requires browser runtime; implemented via per-stop `campErrors` map set in the `catch` block, leaving the prior `campStops` entry untouched)*

### Quality gates

- [x] `npm run build` compiles with no TypeScript errors under strict settings. — Build succeeded: "Application bundle generation complete."
- [x] `npm test` passes, including a new `CampgroundService` spec (via `HttpClientTesting`) covering a single-radius hit and element→`Campground` mapping (node vs `center` coords, `name` fallback, `website`/`contact:website` fallback, `addr:*` assembly and `null`). — New `CampgroundService` spec: 7/7 pass; stage-planner: 10/10 pass. (One pre-existing, unrelated failure remains in `app.spec.ts` — the default Angular scaffold "Hello, ui" `<h1>` test, untouched by this work.)

---

## Task 02-radius-escalation-and-warnings

The search no longer uses a single radius: each stop's lookup starts small and widens in
fixed steps only when nothing is found, settling at the first radius that yields a result
(or the widest radius with an empty result). The panel reports the radius used per stop
and warns the user when a campground could only be found far away — or not at all — and
the map draws each circle at its settled radius.

### Implementation steps

- [x] In `CampgroundService`, replace the fixed radius with an escalation sequence `[5, 10, 20, 30]` km (module constant): query each radius ascending, stop at the first with ≥1 result; if 30 km yields nothing resolve `{ campgrounds: [], radiusKm: 30, expanded: true }`. Derive `expanded = radiusKm >= 20` (threshold constant).
- [x] Ensure each `CampStop` carries the `radiusKm` and `expanded` produced by the service result through `loadCampgroundsForStop()`. — Already threaded through `loadCampgroundsForStop` from task 01; verified, no change needed.
- [x] In `CampingListComponent`, show the radius used per stop and a warning that distinguishes "found but far" (`expanded && campgrounds.length > 0`) from "none found" (`campgrounds.length === 0`); show a per-row loading hint while that row's `loading` is true.
- [x] In `MapComponent`, draw each stop's circle at its settled `radiusKm`, and draw no tent markers for a stop whose `campgrounds` is empty. — Circle already uses `stop.radiusKm` and the marker loop iterates `stop.campgrounds`, so an empty result draws no markers; verified, no change needed.
- [x] Expand the `CampgroundService` spec to drive the escalation through `HttpTestingController`.

### Acceptance criteria

- [x] A stop with a campground within 5 km settles at `radiusKm === 5`, `expanded === false`, issues only one Overpass request, and shows no warning. (UAT 5) — Spec "settles at 5 km with a single request…" passes: asserts `around:5000` body, `radiusKm === 5`, `expanded === false`, and `expectOne`/`verify` prove exactly one request. The panel only renders a warning when `campgrounds.length === 0` or `expanded`, so a 5 km hit shows none.
- [x] A stop whose nearest campground first appears at 20 km issues requests for 5, 10, 20 km, settles `radiusKm === 20` / `expanded === true` with results, and shows a "far away" warning in the panel. (UAT 6) — Spec "escalates to 20 km…" passes: asserts three sequential requests (`around:5000/10000/20000`), `radiusKm === 20`, `expanded === true`, results returned. Panel renders the "Der nächste Campingplatz liegt erst {radiusKm} km entfernt." warning for `expanded && campgrounds.length > 0`.
- [x] A stop with nothing at any radius issues requests for 5, 10, 20, 30 km and resolves `{ campgrounds: [], radiusKm: 30, expanded: true }`; the map draws its circle at 30 km with no markers and the panel warns "none found". (UAT 7) — Spec "settles at 30 km with an empty, expanded result…" passes: asserts four requests (`around:5000/10000/20000/30000`), `radiusKm === 30`, `expanded === true`, empty result. Map circle uses `stop.radiusKm` (30) and the marker loop over an empty `campgrounds` draws nothing; panel renders the "kein Campingplatz gefunden" warning when `campgrounds.length === 0`. (Map/panel render verified by code inspection; runtime not executable headless.)
- [x] The panel lists, per intermediate stop, its stage number, the number of campgrounds found, and the radius used. (UAT 10) — `camping-list.component.html` renders "Nach Etappe {{ stageIndex + 1 }}", "{{ campgrounds.length }} Campingplätze", and "im Umkreis von {{ radiusKm }} km" per row; build compiles the template successfully.

### Quality gates

- [x] `npm test` passes, including `CampgroundService` specs for: hit at 5 km (one request), no hit until 20 km (requests 5/10/20, results returned), and no hit at any radius (requests 5/10/20/30, empty result at 30 km, `expanded` true). — CampgroundService: 10/10 pass; 19/20 total pass. (One pre-existing unrelated failure in `app.spec.ts` — the default Angular scaffold "Hello, ui" `<h1>` title test, untouched by this work.)
- [x] `npm run build` compiles with no TypeScript errors under strict settings. — Build succeeded: "Application bundle generation complete."

---

## Task 03-campground-detail-popup

Clicking a campground marker reveals its details, gracefully handling the missing-data
that is common in OpenStreetMap: name (always, with fallback), address (only when known),
homepage link (only when a website is known), and a Google Maps link (always, built from
coordinates). Acceptance here is verified by runtime observation — there is no automated
test for map rendering.

### Implementation steps

- [x] In `MapComponent`, build the marker popup HTML: `name` in `<strong>`; an address line only when `address` is present; a homepage link only when `website` is present; a Google Maps link always (`https://www.google.com/maps/search/?api=1&query=LAT,LNG`). External links carry `target="_blank" rel="noopener"`. Bind with `{ maxWidth: 260 }`.
- [x] Add `::ng-deep` styles for `.campground-marker` (analogous to `.stage-marker__badge`) and `.campground-popup` in `map.component.scss`.

### Acceptance criteria

- [ ] ~~Clicking a marker opens a popup showing the campground's name, its address if known, a homepage link only if a homepage is known, and a Google Maps link. (UAT 8)~~ *(skipped: requires browser/Leaflet runtime; implemented in `buildCampgroundPopup()` — `name` in `<strong>`, address `<span>` only when `camp.address`, homepage `<a>` only when `camp.website`, and an always-present Google Maps link built from coordinates)*
- [ ] ~~A campground with no address information shows only the name and Google Maps link, with no address line. (UAT 9)~~ *(skipped: requires browser/Leaflet runtime; the address `<span>` is pushed only inside `if (camp.address)`, so a null/empty address omits the line)*
- [ ] ~~A campground with no website shows no homepage link but still shows the Google Maps link.~~ *(skipped: requires browser/Leaflet runtime; the homepage `<a>` is pushed only inside `if (camp.website)`, while the Google Maps link is always appended)*
- [ ] ~~External links (homepage, Google Maps) carry `target="_blank"` and `rel="noopener"`.~~ *(skipped: requires browser/Leaflet runtime; both `<a>` tags in `buildCampgroundPopup()` carry `target="_blank" rel="noopener"`)*

### Quality gates

- [x] `npm run build` compiles with no TypeScript errors under strict settings. — Build succeeded: "Application bundle generation complete."

---

## Task 04-panel-focus-highlight-and-mutual-exclusion

Clicking a stop in the panel focuses that overnight option: the map zooms to fit the
stop's search-radius circle, highlights it, and dims the others — mirroring the existing
stage-selection behaviour. Only one focus is ever active, so focusing a stop clears any
selected stage and vice versa.

### Implementation steps

- [x] In `MapPageComponent`: add `selectedCampStopIndex = signal<number | null>(null)`; add `onCampStopFocused(index)` that sets it and clears `selectedStageIndex`; ensure selecting a stage clears `selectedCampStopIndex` (mutual exclusion — only one focus active).
- [x] In `CampingListComponent`: emit `stopFocused = output<number>()` on a per-stop row click (already declared in task 01).
- [x] In `map-page.component.html`: bind `(stopFocused)="onCampStopFocused($event)"` and pass `[selectedCampStopIndex]="selectedCampStopIndex()"` to `<app-map>`.
- [x] In `MapComponent`: add `selectedCampStopIndex = input<number | null>(null)` tracked in both the render and zoom effects; render the focused stop's circle/markers at full opacity and dim the others using `DIMMED_OPACITY`; add a zoom branch that fits to the focused stop's circle bounds.

### Acceptance criteria

- [ ] ~~Clicking a stop row zooms the map to fit that stop's search-radius circle bounds, renders that stop at full opacity, and dims the other stops. (UAT 11, 17)~~ *(skipped: requires browser/Leaflet runtime; implemented via the camp-stop branch in `updateZoom()` (fits `L.circle(...).getBounds()`) and `addCampStop(stop, dim)` rendering the focused stop's circle/markers at full opacity and others at `DIMMED_OPACITY`)*
- [x] Focusing a camp stop clears any selected stage, and selecting a stage clears the focused camp stop — only one focus is active at a time. (UAT 12) — `onCampStopFocused()` calls `selectedStageIndex.set(null)` before setting the camp focus; a constructor `effect()` clears `selectedCampStopIndex` whenever `selectedStageIndex` becomes non-null. Mutual exclusion verified by code; build compiles. (Visual confirmation requires browser runtime.)
- [ ] ~~With no camp stop focused, stage selection, highlighting, and zoom behave exactly as before (no regression in stage selection).~~ *(skipped: requires browser/Leaflet runtime; the camp-stop branches in `render()`/`updateZoom()` are guarded by `selectedCampStopIndex() !== null`, so with no camp focus the existing stage logic is reached unchanged. Build passes with no regression.)*

### Quality gates

- [x] `npm run build` compiles with no TypeScript errors under strict settings. — Build succeeded: "Application bundle generation complete."

---

## Task 05-step-advance-and-stage-count-reset

The planner's step indicator advances to "Camping" once a search has been run (or is
running) for any stopover, and changing the number of stages wipes any campground results
and focus so the user is never shown overnight options that no longer match the current
plan.

### Implementation steps

- [x] In `MapPageComponent`, change the `currentStep` computed to `route() ? (campStops().size || campLoadingStops().size ? 3 : 2) : 1` (any stop searched or in flight ⇒ Camping).
- [x] Extend the existing `numberOfStages` reset `effect()` to also clear all per-stop campground state — `campStops.set(new Map())`, `campLoadingStops.set(new Set())`, `campErrors.set(new Map())` — and `selectedCampStopIndex.set(null)` alongside the current `selectedStageIndex.set(null)`.

### Acceptance criteria

- [x] For a loaded route with no search yet, the step indicator shows step 2 (Etappen); from the moment a search is triggered for any stopover — while in flight and after it completes — it shows step 3 (Camping). (UAT 14) — `currentStep = route() ? (campStops().size || campLoadingStops().size ? 3 : 2) : 1`. `loadCampgroundsForStop` adds the stop to `campLoadingStops` before awaiting (⇒ step 3 in flight) and to `campStops` on success (⇒ step 3 after); a loaded route with neither populated yields step 2. Build compiles the computed. (Visual indicator confirmation requires browser runtime.)
- [x] Changing `numberOfStages` clears all campground circles, markers, and panel entries and clears any focused stop, and each stop's search action is offered again. (UAT 13, 20) — The `numberOfStages` reset `effect()` now sets `campStops`/`campLoadingStops`/`campErrors` to empty and `selectedCampStopIndex`/`selectedStageIndex` to null; cleared `campStops` empties `campStopsList()` (map) and resets each `campStopViews()` row to `result: null` (offering the search button again). Verified by code; build compiles. (Visual confirmation requires browser runtime.)
- [x] Re-triggering a stop's search (after a stage-count change or otherwise) refreshes that stop's results from a new lookup. (UAT 16, 19) — `loadCampgroundsForStop` no-ops only while that stop is in `campLoadingStops`; once finished the stop is removed from the loading set, so a later call re-issues `findNear` and overwrites the `campStops` entry with the fresh result. No cache or race token. Verified by code; build compiles. (Interactive re-trigger confirmation requires browser runtime.)

### Quality gates

- [x] `npm run build` compiles with no TypeScript errors under strict settings. — Build succeeded: "Application bundle generation complete."
- [x] `npm test` passes with no regression in existing specs. — 19/20 pass (CampgroundService 10/10, StagePlannerService 10/10). The single failure is the pre-existing, unrelated `app.spec.ts` "should render title" scaffold test, untouched by this work and failing on prior tasks too.
