# Stage Planning (Step 2 of trip planning)

## Problem Statement

A cyclist has imported a GPX route into the app and can see it as a single line on the
map, along with its total distance and elevation. But a multi-day bike tour is not ridden
in one go — it has to be split into day stages. Doing this in the head is hard: a flat
100 km day and a mountainous 100 km day are completely different efforts, so splitting
purely by distance produces unbalanced, unrealistic days. The user needs the app to
propose a sensible number of days and let them adjust it, while keeping each day's effort
roughly comparable.

## Solution

After a route is imported, the app proposes a number of day stages based on both distance
and climbing, and immediately shows the route split into that many balanced stages. The
user can adjust the split through coupled controls — a stage-length control (in km) and a
number-of-days field that stay in sync — and the stages reflow instantly. Each stage shows
its distance, climb, descent, and an estimated riding time. On the map, stages appear as
distinct colored segments with numbered start markers; the user can click a segment, click
a list entry, or step through stages with Previous/Next buttons to focus on one stage at a
time. A lightweight step indicator shows the user where they are in the overall planning
flow (Import · Stages · Camping), preparing for a later camping-search step.

## User Stories

1. As a bike tourer, I want the app to propose a number of day stages after I import a route, so that I get a realistic starting point without manual calculation.
2. As a bike tourer, I want the proposal to account for climbing and not just distance, so that mountainous routes are split into shorter days.
3. As a bike tourer, I want the route to be split automatically into the proposed number of stages, so that I see a concrete plan immediately.
4. As a bike tourer, I want each stage to represent a comparable amount of effort, so that no single day is unrealistically hard.
5. As a bike tourer, I want to adjust the stage length in kilometers with a slider, so that I can quickly explore shorter or longer days.
6. As a bike tourer, I want to type an exact stage length in kilometers, so that I can target a specific daily distance.
7. As a bike tourer, I want to type an exact number of days, so that I can plan around a fixed trip duration.
8. As a bike tourer, I want the stage-length controls and the number-of-days field to stay in sync, so that I can think in whichever unit suits me without contradictions.
9. As a bike tourer, I want the controls to snap to achievable whole-day values, so that I am never shown a split that cannot exist.
10. As a bike tourer, I want the stages to reflow immediately when I change the split, so that I get instant feedback.
11. As a bike tourer, I want to keep seeing the original suggested number of days, so that I have a reference point after adjusting.
12. As a bike tourer, I want each stage in a list to show its distance, so that I know how far I ride each day.
13. As a bike tourer, I want each stage to show total ascent and descent, so that I can judge the difficulty of each day.
14. As a bike tourer, I want each stage to show an estimated riding time, so that I can plan my daily schedule.
15. As a bike tourer, I want riding time shown in hours and minutes, so that it is easy to read at a glance.
16. As a bike tourer, I want the stages drawn as distinct colored segments on the map, so that I can see where each day begins and ends.
17. As a bike tourer, I want numbered markers at the start of each stage, so that I can match map segments to list entries.
18. As a bike tourer, I want the list and the map to use the same color for the same stage, so that I can connect them visually.
19. As a bike tourer, I want to click a stage in the list to highlight it on the map, so that I can focus on one day.
20. As a bike tourer, I want to click a segment or marker on the map to select that stage, so that I can explore the route directly.
21. As a bike tourer, I want the selected stage emphasized and the others dimmed, so that the focused day stands out.
22. As a bike tourer, I want the map to zoom to the selected stage, so that I can see its detail.
23. As a bike tourer, I want Previous and Next buttons to step through the stages in order, so that I can review the whole tour day by day.
24. As a bike tourer, I want stepping to stop at the first and last stage, so that I am not surprised by wrapping back around.
25. As a bike tourer, I want a clear overview (no day dimmed) right after import and after I change the split, so that I see the whole tour before drilling in.
26. As a bike tourer, I want a step indicator showing Import · Stages · Camping, so that I understand the overall planning flow and what comes next.
27. As a bike tourer, I want the current and completed steps emphasized and future steps muted, so that I know where I am.
28. As a bike tourer, I want importing a new route to reset the stage plan and selection, so that I start fresh without stale state.
29. As a bike tourer, I want a very short route to still produce at least one stage, so that the feature never breaks on edge cases.

## User Acceptance Tests

1. Given a flat route of roughly 300 km, when it is imported, then the app proposes about 3 days and shows the route split into that many stages.
2. Given a mountainous route, when it is imported, then the proposed number of days is higher (stages are shorter in kilometers) than for a flat route of the same distance.
3. Given an imported route, when I read the stage list, then the sum of the stage distances is approximately equal to the route's total distance.
4. Given an imported route split into several stages, when I compare the stages, then they represent roughly comparable effort (distance plus climbing), not merely equal distance.
5. Given an imported route, when I drag the stage-length slider, then the number-of-days field updates accordingly and the stages reflow.
6. Given an imported route, when I type a number into the days field, then the stage-length control updates accordingly and the stages reflow.
7. Given an imported route, when I enter a stage length that does not divide evenly into whole days, then the displayed stage length snaps to the nearest value that corresponds to a whole number of days.
8. Given a route of about 300 km, when I set the stage length to roughly 70 km, then the plan becomes 4 days and the stage-length display snaps to about 75 km.
9. Given an imported route, when I view the planner, then the original suggested number of days remains visible as a reference.
10. Given a stage in the list, when I read its row, then it shows distance in kilometers, total ascent, total descent, and an estimated riding time.
11. Given a stage whose estimated time is 125 minutes, when the time is displayed, then it reads "2h 5m"; given 120 minutes it reads "2h"; given 45 minutes it reads "45 min".
12. Given an imported route split into stages, when I look at the map, then each stage is a distinct colored segment with a numbered marker at its start and a distinct end marker at the route finish.
13. Given a stage shown in both the list and the map, when I compare them, then the same stage uses the same color in both places.
14. Given an imported route with no stage selected, when I look at the map, then all stages are shown at full strength and the map frames the whole route.
15. Given an imported route, when I click a stage in the list, then that stage is emphasized on the map, the others are dimmed, and the map zooms to that stage.
16. Given an imported route, when I click a segment or numbered marker on the map, then the corresponding stage becomes selected and is highlighted in the list.
17. Given no stage selected, when I click Next, then the first stage is selected; when I click Previous, then the last stage is selected.
18. Given the first stage selected, when I attempt to go Previous, then nothing happens (the control is unavailable); given the last stage selected, the same applies to Next.
19. Given a selected stage, when I change the number of days, then the selection clears and the map returns to the full-route overview.
20. Given a selected stage, when I change the split via the slider, then the map does not jarringly re-zoom; it returns to the overview.
21. Given an imported route, when I view the step indicator, then "Import" and "Stages" are emphasized and "Camping" is muted.
22. Given a route is loaded and I import a different route, when the import completes, then a new day proposal is generated and any previous stage selection is cleared.
23. Given a route with very few track points, when it is imported, then the app still produces at least one stage and does not error.
24. Given a route with fewer than two track points, when it is imported, then no stages are produced and the app does not error.
25. Given the elevation profile below the map, when I select or change stages, then the profile continues to show the full route unchanged.

## Definition of Done

- All user acceptance tests pass.
- A day-count proposal appears automatically on import and reflects both distance and climbing.
- The stage-length controls and the days field remain mutually consistent at all times and snap to achievable whole-day values.
- The number of stages displayed always equals the number of days requested.
- Each stage's distance, ascent, descent, and riding time are shown and are internally consistent (stage distances sum to the route total).
- Map and list use identical colors per stage, and selection is synchronized between them.
- The project builds without errors (`ng build`).
- Automated tests for the stage-planning calculations pass (`ng test`).
- No regression in the existing GPX import, route info, or elevation profile behavior.

## Out of Scope

- Camping-site search via OpenStreetMap at stage destinations (Step 3) — only prepared for by the step indicator, not implemented.
- Persisting the stage plan; stages are computed at runtime and not saved.
- Editing individual stage boundaries by hand (drag-to-adjust); splitting is driven only by the day count.
- Stage-awareness in the elevation profile (per-stage shading or boundary lines).
- Routing, re-routing, or any modification of the imported GPX track itself.
- Surface type, road difficulty, traffic, or weather factors in the effort/time model.

## Further Notes

- The effort model treats 100 m of climbing as equivalent to 1 km of additional distance, and assumes a loaded touring-bike travel speed of 18 km/h. These constants are intended to be easy to tune.
- The target daily effort for the proposal is 95 effort-km, which yields roughly 60–100 km per day depending on terrain.
- The number-of-days value is the single source of truth for the coupling; both the slider and the km field are derived from and feed back into it.

---

## Technical Annex
> Written against codebase as of: 2026-06-23

This section contains the architectural and automated testing decisions derived from the
planning session. It is intended for architect and developer review.

When this document is later used to generate tasks, the task-generation step will verify
each decision in this annex against the current state of the codebase and flag any
conflicts before proceeding.

### Architectural Decisions

**Existing state.** The feature lives in `ui/src/app/map/`. `MapPageComponent` is the
orchestrator holding `route = signal<ParsedRoute | null>(null)` and `errorMessage`.
`MapComponent` currently uses legacy `@Input`/`OnChanges` and renders a single polyline
with green start / red end circle markers. `GpxParserService` and `onFileSelected` remain
unchanged (extended only). `ParsedRoute` / `TrackPoint` in `models.ts` are unchanged.

**Domain model — extend `map/models.ts`.** Add:

```ts
export interface Stage {
  index: number;            // 0-based
  startPointIndex: number;  // index into ParsedRoute.trackPoints
  endPointIndex: number;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  durationMinutes: number;  // total minutes; formatting happens in the UI
}
```

`Stage` carries **no** color field — color is presentation, derived from `index` at render
time.

**Shared colors — new `map/stage-colors.ts`.** Export `STAGE_COLORS: string[]` (~8
high-contrast colors) and resolve a stage's color as `STAGE_COLORS[index % STAGE_COLORS.length]`.
Both `MapComponent` and `StageListComponent` import this so colors are guaranteed identical.

**Planning service — new `map/stage-planner.service.ts`** (`@Injectable({ providedIn: 'root' })`,
pure functions, no UI). Constants at top of file, commented/tunable:
- `RIDING_SPEED_KMH = 18`
- `CLIMB_PENALTY_KM_PER_100M = 1`
- `EFFORT_PER_DAY_KM = 95`

Effort metric: `effortKm = distanceKm + elevationGainM / 100 * CLIMB_PENALTY_KM_PER_100M`.

Methods:
- `suggestDays(route: ParsedRoute): number` → `clamp(1, maxStages, Math.round(totalEffortKm / EFFORT_PER_DAY_KM))`, where `maxStages = trackPoints.length - 1`.
- `planStages(route: ParsedRoute, numberOfStages: number): Stage[]` — **guarantees exactly N non-empty stages**. Clamp `numberOfStages` to `[1, trackPoints.length - 1]`. Compute `totalEffort` over all segments and `targetEffort = totalEffort / N`. Walk the points accumulating per-segment effort (distance delta + positive elevation delta / 100); cut a stage at the first point where cumulative effort ≥ `k * targetEffort` for `k = 1..N-1`; force the last stage to end at the final point. Guard each of the N stages to contain at least one segment (relevant when N approaches `trackPoints.length - 1`). Per stage compute `distanceKm` (distance difference start↔end), `elevationGainM`/`elevationLossM` (sum of ± elevation deltas in the slice), and `durationMinutes` via `estimateDurationMinutes`.
- `estimateDurationMinutes(distanceKm: number, gainM: number): number` → `(distanceKm + gainM / 100 * CLIMB_PENALTY_KM_PER_100M) / RIDING_SPEED_KMH * 60`.

Edge cases: route with < 2 points → `[]`; `numberOfStages` always re-clamped defensively
inside the service.

**State / orchestration — `map-page.component.ts`.** Keep `route` and `errorMessage`. Add:
- `numberOfStages = signal<number>(1)` — single source of truth for the coupling.
- `stages = computed(() => route() ? planner.planStages(route()!, numberOfStages()) : [])`.
- `selectedStageIndex = signal<number | null>(null)`.
- `currentStep = computed(() => route() ? 2 : 1)`.
- An `effect()` that resets `selectedStageIndex` to `null` whenever `numberOfStages` changes.
- In `onFileSelected`, after `route.set(parsed)`: set `numberOfStages` to `planner.suggestDays(parsed)` and reset `selectedStageIndex`.

**Components** (standalone; each `.ts`/`.html`/`.scss`, external templates/styles per CLAUDE.md):

1. `stage-planner.component.*` — coupled controls. Input `route` (for total km + suggested-days display); `model()` `numberOfStages` (two-way `[(numberOfStages)]`). A range slider (`<input type="range">`, 30–150 km, step 5) + a km number field for stage length, and a separate days number field. All coupled through `numberOfStages`:
   - displayed km = `totalKm / N`; editing km → `N = clamp(round(totalKm / km))` (visible snapping);
   - days = `N`; editing days → `N`.
   - km field clamps to 30–150; days field `min=1`, `max = trackPoints.length - 1`.
   - Shows "Vorschlag: N Tage".
2. `stage-list.component.*` — Inputs `stages`; `model()` `selectedIndex`. Per stage: "Etappe k" (1-based), distance (km), ↑gain/↓loss (m), duration via `DurationPipe`; row uses the shared stage color. Click row → set `selectedIndex`. Prev/Next buttons in the header: from null → first/last; clamp (disable) at both ends, no wrap-around.
3. `duration.pipe.ts` — `transform(minutes): string`. Round to nearest minute. `"2h 5m"` for combined, `"2h"` when minutes is a whole number of hours, `"45 min"` when < 1 h, `"0 min"` for zero.
4. `step-indicator.component.*` — display-only. Input `currentStep`. Renders "1 Import · 2 Etappen · 3 Camping"; steps with number ≤ `currentStep` emphasized, future steps muted (step 3 stays muted until Step 3 ships).
5. `map.component.*` — modify. Migrate to signal inputs: `route = input<ParsedRoute | null>(null)`, `stages = input<Stage[]>([])`, `selectedStageIndex = input<number | null>(null)`; add `stageSelected = output<number>()`. Keep `afterNextRender` for init; replace `ngOnChanges` with an `effect()` re-render guarded on map initialization. Rendering: one polyline per stage from `STAGE_COLORS` (cycled by index); numbered start markers 1…N (1-based) at each stage start plus a distinct unnumbered end marker at the route finish; retain green-start / red-end cues. Selected stage thicker/strong, others dimmed; `fitBounds` to the selected stage. `selectedStageIndex === null` → all stages full strength, `fitBounds` whole route. Reflowing stages (N change) must not re-zoom. Clicking a segment or a start marker emits `stageSelected(index)` for the stage that starts there. Falls back to the existing single polyline when `stages` is empty.

**Layout — `map-page.component.html` / `.scss`.** Panel (`aside`) top-to-bottom:
`app-step-indicator`, `app-gpx-import`, `app-route-info`, `app-stage-planner`,
`app-stage-list`. Map area: `app-map` + `app-elevation-profile` (elevation profile
unchanged). Keep the existing flex structure; make the stage list scrollable. Bindings:
`[(numberOfStages)]` on the planner; `[stages]`, `[selectedStageIndex]` and
`(stageSelected)` wired to both the map and (via `[(selectedIndex)]`-style coupling) the
list, with `MapPageComponent` holding `selectedStageIndex` as the shared signal.

### Automated Testing Decisions

**What makes a good test here:** assert only the externally observable behavior of the
planning calculations — number of stages, summed distances, relative effort balance, and
plausibility of the suggestion — not the internal accumulation mechanics. Tests should use
small hand-built `ParsedRoute` fixtures (flat vs. mountainous) so expectations are
checkable by hand.

**Modules under automated test:** `StagePlannerService` only (per the user's decision). The
UI components, `DurationPipe`, and `MapComponent` rendering are verified manually via the
acceptance tests, not by automated tests in this iteration.

**Type & location:** unit tests in `map/stage-planner.service.spec.ts`, run via the
existing Vitest setup (`vitest` is present in devDependencies; `ng test`).

**Cases to cover:**
- `planStages` produces exactly N stages for valid N.
- Sum of stage `distanceKm` ≈ route `totalDistanceKm` (within a small tolerance).
- Stages have approximately equal effort (distance + gain/100).
- `suggestDays` is plausible and lower for a flat route than for a mountainous route of comparable distance, and lands stages in the ~60–100 km band.
- Edge cases: route with < 2 points → `[]`; N clamped to `[1, trackPoints.length - 1]`.

**Prior art:** there are currently no `.spec` files in `ui/src/app/map/`; this is the first
unit-test suite in the feature area. It establishes the pattern (pure service + Vitest)
for subsequent tests.
