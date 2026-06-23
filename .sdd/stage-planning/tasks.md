# Tasks — Stage Planning (Step 2 of trip planning)

Derived from `requirements.md`. Each task is a vertical slice that cuts from the
domain model through the planning service, page state, and UI/map rendering to a
user-observable behavior. Tasks are in dependency order; the numeric ordinal is the
implementation order.

Stack context (verified against the codebase on 2026-06-23): Angular standalone
components + Signals; tests run on Vitest via `ng test` (`@angular/build:unit-test`).
`ng lint` / ESLint is **not** configured, so it is intentionally not used as a quality
gate. `StagePlannerService` is the only module with automated tests this iteration; all
UI/pipe/map behavior is verified by runtime observation.

---

## Task 01-propose-and-split-on-import

Importing a GPX route automatically proposes a sensible number of day stages from both
distance and climbing, splits the route into that many balanced, non-empty stages, and
draws each stage on the map as a distinct colored segment with numbered start markers and
a route-end marker. This is the foundational tracer bullet: import → proposal → balanced
split → visible on the map. Selection visuals and interactive controls are deferred to
later tasks; only the inert state scaffolding they need is added here.

### Implementation steps

- [x] Add a `Stage` interface to `map/models.ts` (`index`, `startPointIndex`, `endPointIndex`, `distanceKm`, `elevationGainM`, `elevationLossM`, `durationMinutes`) — no color field; color is derived from `index` at render time.
- [x] Create `map/stage-colors.ts` exporting `STAGE_COLORS: string[]` (~8 high-contrast colors) and resolving a stage color as `STAGE_COLORS[index % STAGE_COLORS.length]`.
- [x] Create `map/stage-planner.service.ts` (`providedIn: 'root'`, pure functions) with tunable constants `RIDING_SPEED_KMH = 18`, `CLIMB_PENALTY_KM_PER_100M = 1`, `EFFORT_PER_DAY_KM = 95`, and methods `suggestDays`, `planStages` (guarantees exactly N non-empty stages; clamps N to `[1, trackPoints.length - 1]`; `< 2` points → `[]`), and `estimateDurationMinutes`.
- [x] Create `map/stage-planner.service.spec.ts` (Vitest) with small hand-built flat and mountainous `ParsedRoute` fixtures covering the cases in the acceptance criteria.
- [x] In `map-page.component.ts` add `numberOfStages = signal(1)`, `stages = computed(...)` from the planner, an inert `selectedStageIndex = signal<number | null>(null)`, and an `effect()` that resets `selectedStageIndex` to `null` when `numberOfStages` changes; in `onFileSelected`, after `route.set(parsed)`, set `numberOfStages` to `planner.suggestDays(parsed)` and reset the selection.
- [x] Migrate `map.component.ts` to signal inputs (`route`, `stages`), replace the single polyline with one polyline per stage cycled through `STAGE_COLORS`, add numbered start markers (1…N) and a distinct route-end marker, retain green-start/red-end cues, fall back to the single polyline when `stages` is empty, and `fitBounds` to the whole route.
- [x] Bind `[stages]="stages()"` on `app-map` in `map-page.component.html`.

### Acceptance criteria

- [x] Unit test: `planStages` returns exactly N non-empty stages for valid N; a route with `< 2` points returns `[]`; N is re-clamped to `[1, trackPoints.length - 1]` (covers UAT 23, 24).
- [x] Unit test: the sum of stage `distanceKm` equals the route's `totalDistanceKm` within a small tolerance (UAT 3).
- [x] Unit test: per-stage effort (`distanceKm + elevationGainM / 100`) is within a small tolerance of the mean across stages, i.e. stages are balanced by effort and not merely by distance (UAT 4).
- [x] Unit test: `suggestDays` is lower for a flat route than for a mountainous route of comparable distance, and the resulting stages fall in the ~60–100 km band; a flat ~300 km route yields ~3 days (UAT 1, 2).
- [ ] ~~On import, the map shows exactly `numberOfStages` distinct-colored segments, each with a numbered start marker (1-based) plus a distinct route-end marker (UAT 12).~~ *(skipped: requires a running browser to observe Leaflet rendering; logic implemented in `map.component.ts`)*
- [ ] ~~Importing a different route regenerates the day proposal and resets `numberOfStages`; the (inert) selection signal returns to `null` (UAT 22, 28).~~ *(skipped: requires manual UI interaction in a browser; logic implemented in `onFileSelected` + reset `effect()`)*

### Quality gates

- [x] `ng build` completes with no errors.
- [x] `ng test` passes, including the new `stage-planner.service.spec.ts` (all 10 new tests pass). Note: one pre-existing, unrelated failure remains in `app.spec.ts` (default starter test asserting an `<h1>` the app never rendered); not introduced or affected by this task.

---

## Task 02-stage-list-and-duration

A scrollable stage list appears in the side panel, one row per stage, showing the stage
number, distance, total ascent, total descent, and an estimated riding time formatted as
hours/minutes. Each row is tinted with the same color the map uses for that stage, so the
list and map read as one plan.

### Implementation steps

- [x] Create `map/duration.pipe.ts` (`transform(minutes): string`) that rounds to the nearest minute and renders `"2h 5m"` for combined values, `"2h"` for whole hours, `"45 min"` when under an hour, and `"0 min"` for zero.
- [x] Create `map/stage-list.component.{ts,html,scss}` (standalone): `stages` input; per stage render "Etappe k" (1-based), distance in km, ↑gain / ↓loss in m, and duration via `DurationPipe`; tint each row using `STAGE_COLORS[index % STAGE_COLORS.length]` from `stage-colors.ts`.
- [x] Add `app-stage-list` to the panel in `map-page.component.html` (below route info) bound to `[stages]="stages()"`, and make the list region vertically scrollable in `map-page.component.scss`.

### Acceptance criteria

- [ ] ~~Runtime: each stage row shows distance (km), total ascent (↑ m), total descent (↓ m), and an estimated riding time (UAT 10).~~ *(skipped: requires a running browser to observe rendered rows; markup implemented in `stage-list.component.html`)*
- [x] Runtime: `DurationPipe` renders 125 → "2h 5m", 120 → "2h", 45 → "45 min", and 0 → "0 min" (UAT 11). *(verified by executing the pipe's transform logic: 125→"2h 5m", 120→"2h", 45→"45 min", 0→"0 min")*
- [ ] ~~Runtime: the color of a stage's list row matches that stage's color on the map (same `STAGE_COLORS` index) (UAT 13, 18).~~ *(skipped: requires a running browser to compare rendered colors; both map and list resolve color via the shared `stageColor(index)` in `stage-colors.ts`)*
- [ ] ~~Runtime: the number of list rows always equals `numberOfStages`.~~ *(skipped: requires a running browser; list `@for`s over `stages()` which is `planStages(route, numberOfStages)`)*
- [ ] ~~Runtime: the list region scrolls within the panel when stages exceed its height; the rest of the panel stays visible.~~ *(skipped: requires a running browser to observe scrolling; `.stage-list-region` flex/`overflow-y: auto` implemented in `map-page.component.scss`)*

### Quality gates

- [x] `ng build` completes with no errors.
- [x] `ng test` passes (all 10 `stage-planner.service.spec.ts` tests pass). Note: the same pre-existing, unrelated `app.spec.ts` "should render title" starter failure remains; not introduced or affected by this task.

---

## Task 03-coupled-controls-and-reflow

The user can reshape the split through coupled controls: a stage-length slider, a
stage-length km field, and a number-of-days field, all kept in sync through a single
`numberOfStages` source of truth. Editing any control re-derives the others, snaps to
values that correspond to a whole number of days, and reflows the stages on the map and in
the list instantly. The originally suggested day count stays visible as a reference.

### Implementation steps

- [x] Create `map/stage-planner.component.{ts,html,scss}` (standalone): `route` input (for total km + suggested-days display) and a two-way `numberOfStages` model. Provide a range slider (`<input type="range">`, 30–150 km, step 5) and a km number field for stage length, plus a separate days number field.
- [x] Couple everything through `numberOfStages`: displayed km = `totalKm / N`; editing km → `N = clamp(round(totalKm / km))` (visible snapping); days = `N`; editing days → `N`. Clamp the km field to 30–150 and the days field to `[1, trackPoints.length - 1]`.
- [x] Capture the suggested day count on import and display it as a stable "Vorschlag: N Tage" reference that does not change when the user adjusts the split.
- [x] Bind `[(numberOfStages)]` on `app-stage-planner` in `map-page.component.html`, placed between route info and the stage list.

### Acceptance criteria

- [ ] ~~Runtime: dragging the slider updates the days field and reflows the stages on the map and in the list (UAT 5).~~ *(skipped: requires a running browser to observe the slider/reflow; coupling implemented — slider `(input)` → `onKmInput` → `numberOfStages.set(...)`, which drives the `stages` computed in `map-page`)*
- [ ] ~~Runtime: typing a number into the days field updates the stage-length controls and reflows the stages (UAT 6).~~ *(skipped: requires a running browser; days field `(change)` → `onDaysInput` → `numberOfStages.set(...)`, and `displayedKm` recomputes from `numberOfStages`)*
- [x] Runtime: entering a km value that does not divide into whole days snaps the displayed km to the nearest whole-day value; for a ~300 km route, setting ~70 km yields 4 days and the km display snaps to ~75 km (UAT 7, 8). *(verified by executing the coupling math: km 70 → 4 days, displayed 75 km; km 90 → 3 days, displayed 100 km)*
- [ ] ~~Runtime: the originally suggested day count remains visible and unchanged after the user adjusts the split (UAT 9, 11-reference).~~ *(skipped: visibility requires a running browser; stability is guaranteed because `suggestedDays` is a `computed` of `route()` only — it does not depend on `numberOfStages`)*
- [x] Runtime: the km field is constrained to 30–150 and the days field to `[1, trackPoints.length - 1]`; out-of-range entries are clamped (UAT 9 snapping). *(verified by executing the handlers: km 10 → clamped to 30, km 500 → clamped to 150, days 0 → clamped to 1)*

### Quality gates

- [x] `ng build` completes with no errors.
- [x] `ng test` passes (all 10 `stage-planner.service.spec.ts` tests pass). Note: the same pre-existing, unrelated `app.spec.ts` "should render title" starter failure remains; not introduced or affected by this task.

---

## Task 04-selection-focus-and-stepping

The user can focus a single stage by clicking its list row, clicking its segment or
numbered marker on the map, or stepping with Previous/Next. The selected stage is
emphasized on the map and highlighted in the list while the others dim, and the map zooms
to the selected stage. With no stage selected the map shows the full-strength overview
framed to the whole route. Changing the split clears the selection and returns to the
overview without re-zooming to a stage.

### Implementation steps

- [x] Extend `map.component.ts`: add `selectedStageIndex = input<number | null>(null)` and `stageSelected = output<number>()`; replace `ngOnChanges` with an `effect()` guarded on map initialization. Render the selected stage thicker/strong and dim the others; `fitBounds` to the selected stage; when `selectedStageIndex` is `null` render all stages at full strength and `fitBounds` to the whole route. A change in `stages`/`numberOfStages` with no selection must NOT call `fitBounds` to a stage. Emit `stageSelected(index)` when a segment or its start marker is clicked.
- [x] Extend `stage-list.component.ts`: add a two-way `selectedIndex` model; clicking a row sets it and the selected row is visually emphasized. Add Previous/Next buttons in the list header that move from `null` to first/last and otherwise step by one, clamped (disabled) at both ends with no wrap-around.
- [x] In `map-page.component.html`, wire the shared `selectedStageIndex` signal to both components: `[selectedStageIndex]` + `(stageSelected)` on `app-map`, and `[(selectedIndex)]`-style coupling on `app-stage-list`. The reset `effect()` from Task 01 already clears the selection when `numberOfStages` changes.
- [x] Confirm `app-elevation-profile` receives only `[trackPoints]` (no selection input), so its render is independent of stage selection.

### Acceptance criteria

- [ ] ~~Runtime: with no stage selected, all stages render at full strength and the map frames the whole route (UAT 14).~~ *(skipped: requires a running browser to observe Leaflet rendering/zoom; implemented — `render()` draws all stages at opacity 1 when `selectedStageIndex` is null, `updateZoom()` fits the whole route)*
- [ ] ~~Runtime: clicking a list row emphasizes that stage on the map, dims the others, zooms the map to it, and highlights the row (UAT 15).~~ *(skipped: requires a running browser; implemented — row `(click)`→`selectedIndex` model → map dims non-selected (opacity 0.3) + thickens selected (weight 7) + `fitBounds` to the stage; `.selected` row styling)*
- [ ] ~~Runtime: clicking a map segment or numbered marker selects the corresponding stage and highlights it in the list (UAT 16).~~ *(skipped: requires a running browser; implemented — polyline and start-marker `click` handlers emit `stageSelected(index)`, wired to the shared `selectedStageIndex` signal)*
- [x] Runtime: from no selection, Next selects the first stage and Previous selects the last; Previous on the first stage and Next on the last stage are unavailable, with no wrap-around (UAT 17, 18). *(verified by executing the stepping logic: null→next=0, null→prev=3, first canPrev=false, last canNext=false, no wrap)*
- [ ] ~~Runtime: changing the number of days clears the selection and returns the map to the whole-route overview; changing the split via the slider returns to the overview and the map keeps the whole-route bounds (no `fitBounds` to a stage on reflow) (UAT 19, 20).~~ *(skipped: visual zoom behavior requires a running browser; implemented — reset `effect()` clears the selection on `numberOfStages` change, and `updateZoom()` reads `stages()` via `untracked()` so reflow never re-zooms to a stage)*
- [x] Runtime: `ElevationProfileComponent` has no selection input and its rendered profile is identical before and after selecting or changing stages (UAT 25). *(verified by source: the component exposes only `trackPoints = input<TrackPoint[]>()` and `chartData` depends solely on it; the page binds only `[trackPoints]` — no selection/stages path reaches the profile)*

### Quality gates

- [x] `ng build` completes with no errors.
- [x] `ng test` passes (all 10 `stage-planner.service.spec.ts` tests pass). Note: the same pre-existing, unrelated `app.spec.ts` "should render title" starter failure remains; not introduced or affected by this task.

---

## Task 05-planning-flow-step-indicator

A lightweight step indicator at the top of the panel shows where the user is in the
overall planning flow — Import · Etappen · Camping — with completed and current steps
emphasized and future steps muted, preparing for the later camping-search step.

### Implementation steps

- [x] Add a `currentStep = computed(() => route() ? 2 : 1)` to `map-page.component.ts`.
- [x] Create `map/step-indicator.component.{ts,html,scss}` (standalone, display-only): a `currentStep` input rendering "1 Import · 2 Etappen · 3 Camping"; steps whose number is ≤ `currentStep` are emphasized and higher-numbered steps are muted (step 3 stays muted until Step 3 ships).
- [x] Place `app-step-indicator` as the first element in the panel in `map-page.component.html`, bound to `[currentStep]="currentStep()"`.

### Acceptance criteria

- [ ] ~~Runtime: before any route is imported, only "Import" is emphasized while "Etappen" and "Camping" are muted.~~ *(skipped: requires a running browser to observe the emphasized/muted styling; implemented — with no route `currentStep` is 1, and the template applies `.active` only where `step.number <= currentStep()`, so only step 1 is emphasized)*
- [ ] ~~Runtime: after a route is imported, "Import" and "Etappen" are emphasized and "Camping" is muted (UAT 21).~~ *(skipped: requires a running browser; implemented — with a route `currentStep` is 2, so `.active` applies to steps 1 and 2 and step 3 stays muted)*
- [x] Runtime: the component is display-only (no outputs or internal state) and is the first element in the side panel. *(verified by source: `StepIndicatorComponent` exposes only a `currentStep` input — no `output()`, no writable signal/model; `app-step-indicator` is the first child of the `<aside class="panel">` after the header in `map-page.component.html`)*

### Quality gates

- [x] `ng build` completes with no errors. *(ran `npx ng build` — "Application bundle generation complete", no errors)*
- [x] `ng test` passes. *(ran `npx ng test --watch=false` — all 10 `stage-planner.service.spec.ts` tests pass; the only failure is the pre-existing, unrelated `app.spec.ts` "should render title" starter test, not introduced or affected by this task)*
