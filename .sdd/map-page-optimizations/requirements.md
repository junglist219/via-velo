# Map Page Optimizations — Requirements

## Problem Statement

The planning panel on the left of the map page has become crowded. The list of stages and a separate list of overnight campground options are stacked as two independent, long lists inside a narrow (280px) panel. As soon as a route is split into several stages, the user has to scroll through a long stage list and then, separately, a long camping list, mentally re-matching each campground block back to the stage it belongs to. There is no spatial connection between an overnight option and the stage it follows. Additionally, the elevation profile beneath the map is a single uniform line that gives no visual feedback about which stage is currently selected.

## Solution

Reorganize the planning panel so that each stage owns its overnight campground options directly. The separate camping list is removed; instead every intermediate stage can be expanded in place to reveal its campgrounds beneath it. Only one stage is expanded at a time. Expanding a stage also selects it and focuses the map on that stage together with its overnight location, so the spatial relationship is immediate. The panel is widened to give the inline campground details room to breathe. Finally, the elevation profile is made stage-aware: when a stage is selected, the portion of the profile belonging to that stage is highlighted in the same color used for that stage everywhere else, so selection is reflected consistently across the stage list, the map, and the elevation profile.

## User Stories

1. As a route planner, I want each stage's overnight campground options to live directly beneath that stage, so that I no longer have to mentally match a separate camping list back to its stage.
2. As a route planner, I want to expand a stage to reveal its campgrounds, so that the panel stays short and I only see the details I'm currently interested in.
3. As a route planner, I want only one stage's campgrounds open at a time, so that the panel never grows into several long lists at once.
4. As a route planner, I want opening a second stage's campgrounds to automatically close the previously opened one, so that the panel stays tidy without manual cleanup.
5. As a route planner, I want expanding a stage to also select it, so that the stage I'm inspecting is highlighted consistently.
6. As a route planner, I want expanding a stage to focus the map on that stage together with its overnight location, so that I immediately see where the stage runs and where I would stay the night.
7. As a route planner, I want to click a stage's row without expanding it, so that I can preview just the stage on the map without pulling in campground details.
8. As a route planner, I want a dedicated expand control (chevron) separate from the row body, so that selecting and expanding are distinct, predictable actions.
9. As a route planner, I want campgrounds to be searched automatically the first time I expand a stage, so that I don't need an extra click to start the search.
10. As a route planner, I want a previously loaded stage's campgrounds to appear instantly when I re-expand it, so that I'm not forced to wait for a repeated search.
11. As a route planner, I want a clear loading indication while a stage's campgrounds are being searched, so that I know the system is working.
12. As a route planner, I want a retry button when a campground search fails, so that I can re-run the search without losing my place.
13. As a route planner, I want to be told when no campground was found within the searched radius, so that I can plan accordingly.
14. As a route planner, I want to be warned when the nearest campground is only found at a widened search radius, so that I understand the overnight option is relatively far from the stage end.
15. As a route planner, I want the final stage and a single-stage route to show no campground expander, so that the interface doesn't offer an overnight search where there is no intermediate stopover.
16. As a route planner, I want selecting a different stage to collapse any open campground section, so that the open section always belongs to the stage I'm currently looking at.
17. As a route planner, I want the planning panel to be wide enough for campground details, so that names, addresses, and links are readable without cramping.
18. As a route planner, I want the elevation profile to highlight the currently selected stage in that stage's color, so that the elevation feedback matches my selection.
19. As a route planner, I want the elevation profile to fall back to a neutral, single-color appearance when no stage is selected, so that the highlight clearly means "this stage is selected".
20. As a route planner, I want the same color to represent a given stage in the stage list, on the map, and in the elevation profile, so that I can correlate the three views at a glance.
21. As a route planner, I want collapsing an expanded stage to return the map to just that stage's segment, so that the view stays consistent with my remaining selection.

## User Acceptance Tests

1. Given a route split into three or more stages, when I view the planning panel, then I see a single stage list and no separate camping list.
2. Given the stage list, when I look at an intermediate stage row, then it shows an expand control (chevron); when I look at the final stage row (or the only row of a single-stage route), then it shows no expand control.
3. Given a collapsed intermediate stage that has never been expanded, when I click its expand control, then its campground section opens, the stage becomes selected, and a campground search starts automatically (a loading indication is shown).
4. Given a stage whose campgrounds finished loading earlier, when I collapse it and expand it again, then its previously loaded results appear immediately without a new search.
5. Given a stage whose campground search fails, when the failure occurs, then an error message and a retry button are shown in that stage's section; when I click retry, then the search runs again for that stage.
6. Given an expanded stage, when its search returns no campgrounds within the widest radius, then a "no campground found" message is shown.
7. Given an expanded stage, when its nearest campground is only found at a widened radius, then a message indicating the campground is relatively far away is shown.
8. Given stage A is expanded, when I expand stage B, then stage A collapses and only stage B remains open.
9. Given stage A is expanded and selected, when I click the row body of stage B, then stage A collapses, stage B becomes selected, and the map focuses on stage B's segment only.
10. Given a collapsed stage, when I click its row body (not the chevron), then the stage is selected and the map focuses on that stage's segment, and no campground section opens.
11. Given a stage with a stopover, when I expand it via the chevron, then the map view fits both the stage's route segment and its overnight location at the same time.
12. Given an expanded stage, when I collapse it via the chevron, then the map returns to showing just that stage's segment (the stage remains selected).
13. Given no stage is selected, when I view the elevation profile, then it is drawn in a single neutral color.
14. Given a stage is selected, when I view the elevation profile, then the portion of the profile corresponding to that stage is drawn in that stage's color and the remainder stays neutral.
15. Given a selected stage, when I compare its color in the stage list, on the map, and in the highlighted elevation segment, then all three use the same color.
16. Given the planning panel, when I open a stage's campground section, then the campground names, addresses, and links are displayed without horizontal cramping in the widened panel.
17. Given the day count of the route is changed, when the stages are recomputed, then any open campground section is closed, no stage is selected, and previously loaded campground results are cleared.

## Definition of Done

- All user acceptance tests pass.
- The separate camping list no longer appears in the planning panel; campgrounds are reachable only via per-stage expansion.
- Only one stage's campground section can be open at a time.
- Expanding a stage selects it and produces a combined map focus (stage segment + overnight location); collapsing returns to segment-only focus.
- Selecting a different stage collapses any previously open section.
- Campground search runs automatically on first expand, reuses cached results on re-expand, and offers a retry on failure.
- Intermediate stages show an expander; the final stage and single-stage routes do not.
- The planning panel is widened to comfortably fit campground details.
- The elevation profile highlights the selected stage in its stage color and is neutral when nothing is selected, using the shared stage palette.
- Existing service-level automated tests still pass; no regression in route import, stage planning, or campground search behavior.

## Out of Scope

- Changing the campground data source, search radius strategy, or the campground search results themselves (the existing search behavior is reused unchanged).
- Allowing multiple stages to be expanded simultaneously.
- A user-resizable / draggable panel splitter (the panel width is fixed).
- Mobile / responsive redesign of the planning panel.
- Persisting expansion state, selection, or search results across page reloads.
- Changes to the elevation profile's axes, tooltips, or data beyond the selection-driven coloring.

## Further Notes

- The "expanded stage" is always either the currently selected stage or none — expansion and selection of a stage are coupled, while plain row-selection without expansion remains possible.
- "Intermediate stage" means any stage except the last; this matches the existing rule that overnight stopovers exist only at intermediate stage ends.

---

## Technical Annex
> Written against codebase as of: 2026-06-23

All work is contained in `ui/src/app/map/`. The feature is presentation/orchestration only; no new services, HTTP contracts, or data models are introduced. The existing `CampgroundService.findNear()` flow and the `CampStop` / `CampStopView` models are reused unchanged.

### Architectural Decisions

**State ownership (`map-page.component.ts`)**
- Introduce a single `expandedStageIndex = signal<number | null>(null)` as the source of truth for the accordion. Replace the current `selectedCampStopIndex` usage with this expanded-stage notion (or derive the camp focus from it) so expansion and camp focus are one concept.
- Coupling rules, implemented via the existing `effect()` pattern:
  - Expanding a stage (`expandedStageIndex.set(i)`) also sets `selectedStageIndex.set(i)`.
  - Setting `selectedStageIndex` to a value different from `expandedStageIndex` (i.e. selecting another stage via row body) sets `expandedStageIndex.set(null)` (collapse).
  - Collapsing (`expandedStageIndex.set(null)`) leaves `selectedStageIndex` intact (segment-only focus).
  - The existing reflow effect (on `numberOfStages`) additionally resets `expandedStageIndex` to `null` along with clearing selection and campground caches.
- Auto-search on first expand: when `expandedStageIndex` changes to a stage index that has no cached entry in `campStops` and is not already in `campLoadingStops`, call the existing `loadCampgroundsForStop(stageIndex)`. Cached results short-circuit (no re-fetch). Keep the per-stop `campStops` / `campLoadingStops` / `campErrors` maps as-is.
- Remove `CampingListComponent` from the `imports` array and from `map-page.component.html`. Pass the camp data (`campStopViews()`), `selectedStageIndex`, and `expandedStageIndex` down into `StageListComponent`.

**`stage-list.component.ts` / `.html` / `.scss`**
- New inputs: `campStops = input<CampStopView[]>([])` and `expandedIndex = model<number | null>(null)` (or input + explicit output). Keep existing `stages` input and `selectedIndex` model.
- Each stage row renders a chevron toggle only when `stage.index < stages().length - 1` (intermediate stages). The chevron click calls a handler that toggles `expandedIndex` for that stage and emits selection; `$event.stopPropagation()` so it does not also trigger the row-body select.
- Row-body click keeps the existing `select(index)` behavior (sets `selectedIndex`), which—via the page-level coupling—collapses any open section.
- When `expandedIndex() === stage.index`, render `<app-campground-section>` beneath the row for that stage, fed by the matching `CampStopView`.
- Outputs to bubble up: `search` (retry / trigger) and the existing selection model. Auto-search is driven by the page-level effect, so the section's explicit emit is needed only for the retry button.

**`campground-section.component.ts` (new, presentational, OnPush, standalone)**
- Input: `stop = input.required<CampStopView>()`. Output: `retry = output<number>()` (emits the stageIndex).
- Renders the four states currently in `camping-list.component.html`: loading ("Suche läuft…"), result metrics + campground list, the "kein Campingplatz / nächster Platz erst N km entfernt" warnings, and an error message with a **retry button** shown only when `stop.error` is set. External `.html`/`.scss` files per project convention.
- Markup/styles are migrated from `camping-list.component.*`, which is then deleted (component file, template, styles, and its import in `map-page.component.ts`).

**`map.component.ts` — combined focus**
- `updateZoom()` changes: when a stage is expanded (its index has both a selected stage segment and a known camp stop), compute combined bounds = `L.latLngBounds(stageSegmentLatLngs)` extended by the camp circle bounds (`L.circle([lat,lng], { radius: radiusKm*1000 }).getBounds()`), then `fitBounds(combined, { padding: [32,32] })`.
- When a stage is selected but not expanded → segment-only bounds (existing behavior). When nothing selected → whole-route bounds (existing behavior).
- Input surface adjusts to reflect the unified expanded/selected concept rather than the prior mutually-exclusive `selectedCampStopIndex`; marker dimming logic continues to key off the focused stage.

**`elevation-profile.component.ts` / `.html` + pure coloring helper**
- New inputs: `stages = input<Stage[]>([])` and `selectedStageIndex = input<number | null>(null)`, in addition to existing `trackPoints`.
- Extract a pure function, e.g. `buildElevationChartData(trackPoints, stages, selectedStageIndex): ChartConfiguration['data']`, into a sibling module (e.g. `elevation-chart-data.ts`). It produces the chart dataset, coloring only the points within `stages[selectedStageIndex]`'s `[startPointIndex, endPointIndex]` range in `stageColor(selectedStageIndex)` and the rest in the neutral default color. With `selectedStageIndex === null` it returns the current single-neutral-color dataset.
- Coloring approach within Chart.js: use a segment color callback or per-segment dataset so only the selected stage's range carries the stage color; reuse `stageColor()` from `stage-colors.ts` so the palette stays shared. The exact Chart.js mechanism (segment styling vs. split datasets) is an implementation detail left to the developer, provided the helper's output is deterministic for a given input.

**Layout (`map-page.component.scss`)**
- `.panel { width: 360px; }` (from 280px). No other structural layout changes.

### Automated Testing Decisions

- A good test verifies externally observable behavior (inputs → outputs) and not implementation details, so it survives refactors of the internals.
- Per the planning decision, **automated tests are written only for services**. This feature introduces no new service logic and does not change `CampgroundService` or `StagePlannerService`, so **no new automated tests are added**.
- The existing service specs — `campground.service.spec.ts` and `stage-planner.service.spec.ts` — must continue to pass unchanged, guarding against regressions in campground search and stage planning (the data this feature renders).
- All other behavior (accordion, combined focus, auto-search-on-expand, elevation coloring) is validated through the manual User Acceptance Tests above.
- Note for future consideration (not part of this scope): the extracted pure `buildElevationChartData` helper is deterministic and would be straightforward to unit-test should the team later choose to broaden test coverage beyond services.
