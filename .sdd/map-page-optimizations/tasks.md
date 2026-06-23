# Map Page Optimizations — Tasks

> Derived from `requirements.md` (Technical Annex written against codebase as of 2026-06-23).
> All work lives in `ui/src/app/map/`. Presentation/orchestration only — no new services, HTTP
> contracts, or data models. `CampgroundService.findNear()` and the `CampStop` / `CampStopView`
> models are reused unchanged. Per the project testing decision, no new automated tests are added;
> the existing service specs must keep passing.

## Task 01-inline-campground-accordion

Move each intermediate stage's overnight campground options inline beneath that stage and remove
the standalone camping list. A single accordion state governs the panel: only one stage is expanded
at a time. Intermediate stages (every stage except the last) show a chevron expander; the final
stage and the only row of a single-stage route show no expander. Expanding a stage selects it and
reveals a new inline campground-section beneath the row; expanding another stage collapses the
first; selecting a different stage via its row body collapses any open section; clicking a row body
alone selects the stage without expanding it. Changing the day count closes any open section,
clears the selection, and wipes the campground caches. The planning panel widens to 360px so the
campground details have room to breathe. The new campground-section renders one stop's full state:
the loading indication, the list of found campgrounds (name, address, website link, Google Maps
link), the result metrics, the no-result and widened-radius warnings, and an error with a retry
button.

Note: the campground entry list (name / address / links) currently exists only as map popups, not
in the old camping list — this task adds that entry rendering to the new section, reusing the popup
content structure, to satisfy the requirement that details be readable in the panel.

For this task the search is still started by the section's button (automatic search-on-expand
arrives in Task 02), and the map keeps focusing the overnight location when a stage is expanded
(combined stage+overnight focus arrives in Task 03).

### Implementation steps

- [x] Introduce a single `expandedStageIndex` accordion state in the map page as the source of truth, coupled to stage selection: expanding sets selection; selecting a different stage collapses the open section; collapsing leaves the selection intact.
- [x] Extend the existing day-count reflow effect so it also resets the accordion to collapsed alongside clearing the selection and the campground caches.
- [x] Create a standalone, OnPush `campground-section` component (external `.html`/`.scss`) that renders one stop's loading state, found-campground entries (name, address, website + Google Maps links), result metrics, no-result/widened-radius warnings, and an error with a retry button.
- [x] Extend the stage list to render a chevron only on intermediate stages, toggle the accordion on chevron click (stopping propagation so the row-body select does not also fire), and render the campground-section beneath the expanded stage fed by its matching `CampStopView`.
- [x] Remove the standalone camping-list component and its usage/imports, and delete its component, template, and style files.
- [x] Widen the planning panel to 360px.

### Acceptance criteria

- [x] A route split into 3+ stages shows a single stage list and no separate camping-list region in the panel. *(camping-list component + `<app-camping-list>` usage removed; panel now renders only `<app-stage-list>`; grep for camping-list returns nothing.)*
- [x] Every intermediate stage row shows a chevron expander; the final stage row, and the only row of a single-stage route, show no expander. *(template renders chevron under `@if (isIntermediate(stage.index))` where `isIntermediate` = `index < stages().length - 1`.)*
- [x] Expanding a stage opens its campground section, marks that stage selected, and leaves it as the only open section; expanding a second stage collapses the first. *(single `expandedStageIndex` signal holds one index; `onExpandedChanged` sets selection; section rendered only for the matching index.)*
- [x] Clicking a stage's row body (not the chevron) selects it and focuses the map on that stage, opens no campground section, and collapses any previously open section. *(row click calls `select()`; chevron click calls `stopPropagation()`; page effect collapses accordion when `selectedStageIndex !== expandedStageIndex`.)*
- [ ] ~~With the panel at 360px, an expanded section renders the found campgrounds' names, addresses, and website/maps links as visible, non-truncated elements.~~ *(skipped: requires a running browser to visually confirm non-truncated rendering; markup/styles implemented in campground-section + panel widened to 360px.)*
- [x] Changing the day count collapses any open section, clears the selection, and removes previously loaded campground results. *(reflow effect on `numberOfStages` resets `expandedStageIndex`, `selectedStageIndex`, `selectedCampStopIndex`, and all camp maps/sets.)*

### Quality gates

- [x] `ng build` completes successfully with no new warnings or errors. *(build output: "Application bundle generation complete." no warnings/errors.)*
- [x] `ng test` passes (existing `campground.service.spec.ts` and `stage-planner.service.spec.ts` green). *(both service spec files in "2 passed" test files; only the unrelated default `app.spec.ts` scaffolding title test fails, unmodified by this work.)*
- [x] A source-wide search shows no remaining reference to the deleted camping-list component. *(`grep -rn "camping-list\|CampingList\|app-camping-list" src/` → no matches, exit 1.)*

## Task 02-auto-search-and-retry

Couple the campground search to the accordion. When a stage is expanded for the first time and has
no cached result and no in-flight request, its campground search starts automatically with a
loading indication. Re-expanding a stage whose search already completed shows the cached results
instantly with no new request. A failed search shows an error message and a retry button inside
that stage's section, and retry re-runs the search for that stage. The always-visible manual search
button is replaced by automatic search plus a retry control shown only on failure.

### Implementation steps

- [x] Add a page-level effect that, when the accordion expands to a stage with no cached result and no in-flight request, triggers the existing campground load for that stage.
- [x] Ensure cached results short-circuit on re-expand so no refetch occurs, reusing the existing per-stop result/loading/error maps.
- [x] Reduce the section's control to a retry button shown only when that stop has an error, removing the always-present search button.

### Acceptance criteria

- [x] Expanding a never-searched intermediate stage automatically starts a search and shows a loading indication. *(page-level effect keyed only on `expandedStageIndex` calls `loadCampgroundsForStop(index)` when the stage has no cached result and no in-flight request; the section renders the "Suche läuft…" loading block while `stop().loading`.)*
- [x] A stage whose search previously completed shows its results immediately on re-expand, with no new search issued. *(auto-search effect early-returns when `campStops().has(index)`; cache reads are `untracked`, so the effect re-runs only on expand and short-circuits for completed stages — no refetch.)*
- [x] A failed search shows an error message and a retry button in that stage's section; clicking retry re-runs the search for that stage. *(section renders `camp-error` + `camp-retry` only when `stop().error` is set; retry emits `retry` → stage-list → page `loadCampgroundsForStop`, which clears the error and re-runs the search.)*
- [x] A completed search with zero campgrounds at the widest radius shows a "no campground found" message; a result found only at a widened radius shows a "relatively far away" message. *(template branches on `result.campgrounds.length === 0` → "kein Campingplatz gefunden" and on `result.expanded` → "Der nächste Campingplatz liegt erst N km entfernt".)*
- [x] No always-visible search button remains; searching is automatic with a retry control shown only on failure. *(`grep` for `camp-search` / "Campingplätze suchen" returns no matches; only the error-gated `camp-retry` button remains.)*

### Quality gates

- [x] `ng build` completes successfully with no new warnings or errors. *(build output: "Application bundle generation complete." no warnings/errors.)*
- [x] `ng test` passes (service specs green). *(`campground.service.spec.ts` and `stage-planner.service.spec.ts` in "2 passed" test files, 19 service tests green; only the unrelated default `app.spec.ts` scaffolding title test fails, unmodified by this work.)*

## Task 03-combined-map-focus

Unify the map's focus around the accordion/selection concept. Replace the map's mutually-exclusive
camp-stop focus input with the expanded-stage index passed from the page. When a stage is expanded
and its overnight location is known, the map fits both the stage's route segment and the overnight
search circle together. When a stage is selected but not expanded, the map fits the stage segment
only. When nothing is selected, the map fits the whole route. Segment and campground-marker dimming
continue to key off the focused stage.

### Implementation steps

- [x] Replace the map component's separate camp-stop focus input with the expanded-stage index, wired from the page's accordion state.
- [x] In the zoom logic, compute combined bounds (the stage segment extended by the overnight search-circle bounds) when a stage is expanded and its camp stop is known; fall back to segment-only when selected-not-expanded and whole-route when nothing is selected.
- [x] Keep stage-segment and campground-marker dimming consistent with the focused stage.

### Acceptance criteria

- [ ] ~~Expanding a stage with a known overnight location fits the map to both the stage's segment and the overnight search circle simultaneously.~~ *(skipped: requires a running browser/Leaflet to visually confirm the fitted bounds; `updateZoom()` builds `L.latLngBounds(segment)` and, when the expanded stage's `campStop` is known, `.extend()`s it with the search-circle bounds before `fitBounds`.)*
- [ ] ~~Collapsing an expanded stage via the chevron returns the map to that stage's segment only, with the stage still selected.~~ *(skipped: requires a running browser; collapsing sets `expandedStageIndex=null` while `selectedStageIndex` stays set, so `campStop` is undefined and `updateZoom()` fits the segment-only bounds.)*
- [ ] ~~Selecting a different stage's row body moves the map focus to that stage's segment only.~~ *(skipped: requires a running browser; row-body select collapses the accordion via the page effect, so the map fits the newly selected stage's segment-only bounds.)*
- [ ] ~~With no stage selected, the map is fit to the whole route.~~ *(skipped: requires a running browser; `updateZoom()` early-returns to whole-route `fitBounds` when `stage` is undefined.)*
- [ ] ~~After a day-count change with nothing selected, the map remains fit to the whole-route overview (no spurious zoom).~~ *(skipped: requires a running browser; the zoom effect tracks only `route`/`selectedStageIndex`/`expandedStageIndex` and reads `stages`/`campStops` `untracked`, so a reflow that leaves selection cleared produces the whole-route fit without a spurious re-zoom.)*

### Quality gates

- [x] `ng build` completes successfully with no new warnings or errors. *(build output: "Application bundle generation complete." no warnings/errors.)*
- [x] `ng test` passes (service specs green). *(`campground.service.spec.ts` and `stage-planner.service.spec.ts` in "2 passed" test files, 19 service tests green; only the unrelated default `app.spec.ts` scaffolding title test fails, unmodified by this work.)*

## Task 04-stage-aware-elevation-coloring

Make the elevation profile reflect the selected stage. Pass the stage plan and the selected-stage
index from the page into the elevation profile. Extract a pure, deterministic helper that builds
the chart dataset from track points, stages, and the selected index: it colors only the points
within the selected stage's `[startPointIndex, endPointIndex]` range in that stage's shared-palette
color and leaves the remainder neutral, and it returns the single-neutral-color dataset when nothing
is selected. The profile's chart data is driven through this helper, reusing the shared `stageColor`
palette so the same color represents a stage in the stage list, on the map, and in the profile.

### Implementation steps

- [x] Pass the stage plan and the selected-stage index from the page into the elevation profile component.
- [x] Extract a pure helper (a standalone function in a sibling module, not reading component state) that builds the chart dataset from `(trackPoints, stages, selectedStageIndex)`, coloring the selected stage's point range with `stageColor` and the rest neutral, and returning the single-neutral-color dataset when the index is null.
- [x] Drive the elevation profile's chart data through the helper.

### Acceptance criteria

- [ ] ~~With no stage selected, the elevation profile is drawn in a single neutral color.~~ *(skipped: requires a running browser/Chart.js to visually confirm; `buildElevationChartData` returns the single `NEUTRAL_ELEVATION_COLOR` dataset when `selectedStageIndex` is null/out-of-range — verified by static inspection.)*
- [ ] ~~With a stage selected, the profile points within that stage's range are drawn in the stage's color and the remainder stays neutral.~~ *(skipped: requires a running browser to visually confirm; helper uses a Chart.js `segment.borderColor` callback returning `stageColor(index)` for segments inside `[startPointIndex, endPointIndex]` and `NEUTRAL_ELEVATION_COLOR` elsewhere.)*
- [ ] ~~The color used for a selected stage in the profile matches that stage's color in the stage list and on the map.~~ *(skipped: requires a running browser to visually compare; all three call the same shared `stageColor()` from `stage-colors.ts`, so colors are identical by construction.)*
- [x] The coloring logic is a pure standalone function that reads no component state (verifiable by static inspection) and uses the shared `stageColor` palette. *(`elevation-chart-data.ts#buildElevationChartData` is a top-level exported function; `grep` for `this.`/`inject`/`signal`/`computed`/`input(` returns no matches, exit 1; it imports and calls `stageColor` from `stage-colors.ts`.)*

### Quality gates

- [x] `ng build` completes successfully with no new warnings or errors. *(build output: "Application bundle generation complete." no warnings/errors.)*
- [x] `ng test` passes (service specs green). *(`campground.service.spec.ts` and `stage-planner.service.spec.ts` in "2 passed" test files, 19 service tests green; only the unrelated default `app.spec.ts` scaffolding title test fails, unmodified by this work.)*
