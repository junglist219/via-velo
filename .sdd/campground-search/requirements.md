# Campground Search at Stage Stopovers

## Problem Statement

A cyclist planning a multi-day bike tour with Via Velo can import a GPX route and split
it into balanced day stages. At the end of each day (except the final destination) they
need somewhere to spend the night. Today the app shows a "Camping" step in the planner,
but there is no way to discover where they could actually sleep. The user has to leave
the app and search a separate map or website for campgrounds near each overnight point,
losing the connection between their planned stages and the places they could stay.

## Solution

After the user has planned their stages, Via Velo lets them search — on demand, one
overnight stopover at a time — for campgrounds and caravan sites near each stopover (the
end of every stage except the last). Each stopover in the side panel carries its own
search button, so the user looks up the night they are interested in without firing off
requests for every stage at once. For the chosen stopover the app searches within a small
radius and, if nothing is found, widens the search in fixed steps up to a sensible
maximum. The results appear on the map as coloured search-radius circles and clickable
tent markers, colour-matched to the stage they belong to. Clicking a marker reveals the
campground's name, address, homepage link (when known) and a Google Maps link. The side
panel summarises, per stopover, how many places were found and at what radius, and warns
the user when a place could only be found far away — or not at all.

## User Stories

1. As a tour-planning cyclist, I want to search for campgrounds near my overnight stops, so that I know where I can sleep along my route.
2. As a tour-planning cyclist, I want the search for a stopover to start only when I press its button, so that the app does not fire off network requests while I am still adjusting my stage plan.
2a. As a tour-planning cyclist, I want to search each overnight stopover individually rather than all at once, so that I can look up only the nights I care about and avoid hammering the campground data source with a burst of simultaneous requests.
3. As a tour-planning cyclist, I want campgrounds searched only at intermediate stage ends (not at my final destination), so that the results match the nights I actually need to plan for.
4. As a tour-planning cyclist, I want both camp sites and caravan sites included, so that I see the full range of overnight options.
5. As a tour-planning cyclist, I want the search to begin within a short radius around each stopover, so that the suggested places are genuinely close to where I will end my day.
6. As a tour-planning cyclist, I want the search radius to grow automatically when nothing is found nearby, so that I still get an option in remote areas instead of an empty result.
7. As a tour-planning cyclist, I want to be warned when the nearest campground is unusually far away, so that I can reconsider that stage or prepare for a longer ride to the campsite.
8. As a tour-planning cyclist, I want to be told clearly when no campground exists even at the widest search radius, so that I know to arrange an alternative for that night.
9. As a tour-planning cyclist, I want each stopover's search area drawn as a circle on the map, so that I can see how far the suggested places are from my planned stop.
10. As a tour-planning cyclist, I want each campground shown as a marker coloured to match its stage, so that I can tell at a glance which night each option belongs to.
11. As a tour-planning cyclist, I want to click a campground marker and see its name, so that I can identify the place.
12. As a tour-planning cyclist, I want to see a campground's address when it is known, so that I can locate it.
13. As a tour-planning cyclist, I want a link to a campground's homepage when one exists, so that I can check availability and prices.
14. As a tour-planning cyclist, I want a Google Maps link for every campground, so that I can get directions regardless of whether an address is listed.
15. As a tour-planning cyclist, I want a panel summarising each overnight stop — its stage number, how many places were found, and the radius used — so that I can review my options without hunting across the map.
16. As a tour-planning cyclist, I want to click a stop in the panel and have the map focus on it, so that I can inspect that night's options closely.
17. As a tour-planning cyclist, I want the focused stop highlighted and the others dimmed, so that I can concentrate on one night at a time.
18. As a tour-planning cyclist, I want clear feedback while a stopover's search is running, so that I know the app is working and have not missed anything; and I want each stopover's progress shown independently, so that I can start one search while looking at another's results.
19. As a tour-planning cyclist, I want to repeat a stopover's search with its button, so that I can retry that stop after a temporary network problem without re-running the others.
20. As a tour-planning cyclist, I want my campground results cleared automatically when I change the number of stages, so that I am never shown overnight options that no longer match my plan.
21. As a tour-planning cyclist, I want the campground search to be unavailable when my route is a single stage, so that I am not offered a search that has no overnight stops to look at.
22. As a tour-planning cyclist, I want the planner's step indicator to advance to "Camping" once I have run a search for any stopover, so that the app reflects where I am in the planning flow.
23. As a tour-planning cyclist, I want to be told when a stopover's campground search fails, so that I understand the absence of results for that stop is a temporary problem rather than there being no campgrounds.

## User Acceptance Tests

1. Given a route split into two or more stages and no search yet performed, when I view the planning panel, then every intermediate stopover lists its own "search campgrounds" action.
2. Given a route of exactly one stage, when I view the planning panel, then the campground search is not shown.
3. Given a route of two or more stages, when I trigger the search for a single stopover and it succeeds, then that stopover shows a search-radius circle and one tent marker per campground found, while stopovers not yet searched (and the final destination) show none.
4. Given a stopover's search has been triggered, when its results are still being fetched, then that stopover's search action indicates a search is in progress and cannot be triggered again until it finishes, while the other stopovers' actions remain usable.
5. Given an intermediate stopover with at least one campground within the smallest radius, when the search completes, then that stop's circle is drawn at the smallest radius and no "far away" warning is shown for it.
6. Given an intermediate stopover whose nearest campground lies beyond the smallest radius, when the search completes, then the circle is drawn at the radius where places were first found and a warning indicates the nearest place is that far away.
7. Given an intermediate stopover with no campground even at the widest radius, when the search completes, then no markers are drawn for it, its circle is drawn at the widest radius, and the panel warns that no campground was found within that radius.
8. Given a completed search, when I click a campground marker, then a popup shows the campground's name, its address if known, a homepage link only if a homepage is known, and a Google Maps link.
9. Given a campground with no address information, when I open its popup, then the name and Google Maps link are shown and no address line appears.
10. Given a completed search, when I view the panel, then each intermediate stop lists its stage number, the number of campgrounds found, and the radius used.
11. Given a completed search, when I click a stop in the panel, then the map zooms to that stop's search area, that stop is highlighted, and the other stops are dimmed.
12. Given a stop is focused via the panel and a stage is currently selected, when the stop becomes focused, then the stage selection is cleared so that only one focus is active; and selecting a stage clears the focused stop.
13. Given campground results are displayed, when I change the number of stages, then all campground circles, markers and panel entries are cleared and the search action is offered again.
14. Given no search has been performed, when I view the step indicator, then it shows the stage-planning step; and once a search has been triggered for any stopover, the indicator advances to the camping step.
15. Given a stopover's campground search fails, when it returns, then an error message is shown for that stopover and no results are displayed for it, while any other stopovers' results remain intact.
16. Given a stopover with completed results, when I trigger its search again, then that stopover's results are refreshed from a new lookup and the other stopovers are unaffected.
17. Given two stopovers close enough that their search areas overlap, when the same campground falls in both, then it appears once under each stop, each in that stop's stage colour.

## Definition of Done

- All user acceptance tests pass.
- Campground search runs only on explicit user action, never automatically while editing the stage plan.
- Each intermediate stopover is searched individually via its own trigger; the app never fires a search for all stage ends at once.
- Search covers only intermediate stage ends; the final route destination is never searched.
- Both camp sites and caravan sites are included in results.
- The search radius escalates through the agreed steps and stops at the agreed maximum, after which an empty-but-warned result is produced rather than an error.
- "Far away" and "nothing found" are presented as distinct, understandable warnings.
- Campground markers, radius circles and panel entries are colour-coupled to their stage.
- Changing the stage count clears all campground results and any focused stop.
- The campground search is hidden for single-stage routes.
- A per-stopover failure surfaces a clear error for that stop and leaves other stops' results intact.
- No regression in GPX import, stage planning, route/elevation display, or stage selection.
- The campground search core has automated tests covering radius escalation, result mapping, warning derivation, and the empty-result case.
- `ng build` compiles with no TypeScript errors under strict settings.

## Out of Scope

- Booking, availability, pricing, or any reservation workflow.
- Filtering campgrounds by amenities, rating, or type beyond camp site / caravan site.
- Persisting or exporting the chosen campgrounds.
- Routing or detour distance from the planned route to a campground.
- Offline use or caching of campground results across sessions.
- Automatic retry on rate-limited or failed requests (the user retries manually).
- Deduplicating a campground that falls within two overlapping stop radii (it intentionally appears under both).
- Searching for accommodation types other than campgrounds (hotels, hostels, etc.).
- Automated tests for the map rendering and the panel component.

## Further Notes

- Campground data comes from OpenStreetMap via the public Overpass API. Coverage and tag
  completeness vary by region; missing names, addresses, or homepages are expected and
  handled with fallbacks rather than treated as errors.
- The public Overpass endpoint is rate-limited and can be slow; the manual-trigger design
  and the absence of automatic retries are deliberate choices to stay within fair use.
- Radius steps, the warning threshold, and the maximum radius are tuned for European /
  Swiss cycle touring, where campgrounds within ~30 km are the practical limit.

---

## Technical Annex
> Written against codebase as of: 2026-06-23

This section captures the architectural and testing decisions from the planning session.
When tasks are generated, each decision below should be re-verified against the codebase
and any conflict flagged before proceeding.

### Architectural Decisions

**Overall fit.** The feature extends the existing `src/app/map/` feature folder and reuses
its established patterns: `signal()`/`computed()` state in `MapPageComponent`, a Leaflet
render `effect()` in `MapComponent`, root-provided services alongside the map files
(`GpxParserService`, `StagePlannerService`), `stageColor(index)` from `stage-colors.ts` for
stage↔visual coupling, and the `errorMessage` signal + conditional markup pattern.

**1. HTTP provider — `src/app/app.config.ts`**
Add `provideHttpClient(withFetch())` to `providers`. No `HttpClient` provider exists today.

**2. Models — `src/app/map/models.ts`**
Add two interfaces:
```ts
export interface Campground {
  id: number;
  lat: number;
  lng: number;
  name: string;            // fallback "Campingplatz" when no name tag
  address: string | null;
  website: string | null;
}

export interface CampStop {
  stageIndex: number;      // stage whose END is this stopover
  lat: number;
  lng: number;
  radiusKm: number;        // radius at which the search settled
  expanded: boolean;       // true when radiusKm >= 20 (had to widen meaningfully)
  campgrounds: Campground[];
}
```

**3. Deep module — `src/app/map/campground.service.ts` (new)**
`@Injectable({ providedIn: 'root' })`, `inject(HttpClient)`. Overpass endpoint as a module
constant: `https://overpass-api.de/api/interpreter`.

- Public interface:
  `findNear(lat: number, lng: number): Promise<{ campgrounds: Campground[]; radiusKm: number; expanded: boolean }>`
- Radius escalation sequence (module constant): `[5, 10, 20, 30]` km. Query each radius in
  ascending order; stop at the first radius that yields ≥ 1 result. If 30 km yields nothing,
  resolve with `{ campgrounds: [], radiusKm: 30, expanded: true }`.
- `expanded` is derived as `radiusKm >= 20` (threshold constant). Holds for the found-but-far
  case (20/30 km with results) and the nothing-found case (30 km, empty).
- Overpass-QL per iteration (node + way, both tag types):
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
- Transport: POST with `body=<query>` as `text/plain`; `firstValueFrom(...)` from rxjs.
- Element → `Campground` mapping: coordinates from `lat`/`lon` (nodes) or `center.lat`/
  `center.lon` (ways); `name` from `tags.name` else fallback `"Campingplatz"`; `website`
  from `tags.website ?? tags['contact:website'] ?? null`; `address` assembled from
  `addr:street` / `addr:housenumber` / `addr:postcode` / `addr:city`, or `null` when none
  present. The Google Maps link is built in the popup from coordinates, so it is not stored
  on the model.

**4. State & per-stopover trigger — `src/app/map/map-page.component.ts`**
- Campground results are tracked per stopover, keyed by the stop's `stageIndex` so that
  each stop's result, loading flag, and error are independent:
  `campStops = signal<Map<number, CampStop>>(new Map())`,
  `campLoadingStops = signal<Set<number>>(new Set())`,
  `campErrors = signal<Map<number, string>>(new Map())`. (The existing shared
  `errorMessage` signal stays for non-campground errors such as GPX import.)
- New `selectedCampStopIndex = signal<number | null>(null)` for the panel→map focus.
- `inject(CampgroundService)`.
- `campStopCoordinates = computed(...)`: for `n` stages with `n >= 2`, the intermediate
  stop coordinates are `route().trackPoints[stage.endPointIndex]` for `k = 0 … n-2`
  (the final stage's end is the route destination and is excluded).
- `loadCampgroundsForStop(stageIndex)` (invoked from a per-stop search output): no-op if
  that stop is already loading; add `stageIndex` to `campLoadingStops`; query that single
  stop via `findNear`; on success store the resulting `CampStop` in the `campStops` map and
  clear any prior error for that key; on rejection set a per-stop message in `campErrors`
  and leave that stop's previous result untouched; `finally` remove `stageIndex` from
  `campLoadingStops`. Each stop is searched in isolation — no `Promise.all`, no burst of
  simultaneous requests. A re-trigger re-queries just that stop. No race token, no cache.
- `campStopsList = computed(...)`: derive the ordered `CampStop[]` the map consumes from the
  `campStops` map (intermediate stops in stage order), so the map keeps a flat list.
- Extend the existing `numberOfStages` reset `effect()` to also clear all campground state:
  `campStops.set(new Map())`, `campLoadingStops.set(new Set())`, `campErrors.set(new Map())`
  and `selectedCampStopIndex.set(null)` (alongside the current `selectedStageIndex.set(null)`).
- Mutual-exclusion: selecting a stage clears `selectedCampStopIndex`; focusing a camp stop
  clears `selectedStageIndex`. Only one focus is ever active.
- `currentStep` becomes `route() ? (campStops().size || campLoadingStops().size ? 3 : 2) : 1`
  — any stop searched or in flight advances the indicator to Camping.

**5. Map rendering — `src/app/map/map.component.ts` (+ `.scss`)**
- New inputs: `campStops = input<CampStop[]>([])` and `selectedCampStopIndex = input<number | null>(null)`;
  track both in the render `effect()`.
- New output to mirror `stageSelected` is not required; focus is panel-driven, but the map
  may also emit a camp-stop selection if a marker/circle click should focus — minimal scope
  keeps focus panel-driven only (confirm during task breakdown).
- In `render()`, after the stages: per stop draw a light radius circle
  `L.circle([lat, lng], { radius: radiusKm * 1000, color, weight: 1, fillColor: color, fillOpacity: 0.08, opacity: 0.4 })`
  with `color = stageColor(stop.stageIndex)`. Per campground draw a tent marker
  (`L.divIcon`, `⛺`/SVG) in the same stage colour with
  `.bindPopup(html, { maxWidth: 260 })`. Popup HTML: name in `<strong>`, address line only
  when present, homepage link only when `website`, Google Maps link
  `https://www.google.com/maps/search/?api=1&query=LAT,LNG`; external links carry
  `target="_blank" rel="noopener"`.
- Highlight: when `selectedCampStopIndex` is set, the focused stop's circle/markers render
  at full opacity and the others are dimmed using the existing `DIMMED_OPACITY = 0.3`
  pattern (mirrors stage dimming).
- Zoom: the existing zoom `effect()`/`updateZoom()` gains a camp-stop branch — when a camp
  stop is focused, fit to its circle bounds (e.g. `L.latLng(lat, lng).toBounds(radiusKm * 2000)`
  or `L.circle(...).getBounds()`); otherwise the current stage/route logic applies. Keep
  reading the stage plan via `untracked` as today so reflows do not re-zoom.
- `.scss`: `::ng-deep` styles for `.campground-marker` (analogous to `.stage-marker__badge`)
  and `.campground-popup`.

**6. Panel component — `src/app/map/camping-list.component.{ts,html,scss}` (new)**
Standalone, `OnPush`, modelled on `StageListComponent`.
- The panel renders one row per intermediate stopover (present even before that stop is
  searched). It takes a per-stop view-model so each row owns its trigger, loading flag,
  result and error. Define a view shape (e.g. in `models.ts`):
  ```ts
  export interface CampStopView {
    stageIndex: number;        // identifies the stopover and its trigger target
    result: CampStop | null;   // null until this stop has been searched
    loading: boolean;          // this stop's request is in flight
    error: string | null;      // this stop's last failure, if any
  }
  ```
- Inputs: `stops = input<CampStopView[]>([])`.
- Outputs: `search = output<number>()` (emits the row's `stageIndex`),
  `stopFocused = output<number>()` (row click → focus by `stageIndex`).
- Markup per row: stage number plus its own search button labelled "Campingplätze suchen"
  / "Erneut suchen" (after a result), disabled and showing "Suche läuft…" while that row's
  `loading` is true. When a result exists: count of campgrounds, radius used, and a warning
  when `expanded` — distinguishing "found but far" (`expanded && campgrounds.length > 0`)
  from "none found" (`campgrounds.length === 0`). When that row's `error` is set, show its
  error message. Summary only — no per-campground name list (details live in the map popup).

**7. Wiring — `src/app/map/map-page.component.{html,ts}`**
- Add `CampingListComponent` to the `MapPageComponent` `imports`.
- Add a `campStopViews = computed<CampStopView[]>(...)` that joins `campStopCoordinates`
  with the `campStops`, `campLoadingStops`, and `campErrors` maps (keyed by `stageIndex`),
  so each intermediate stopover yields one row.
- Render `<app-camping-list>` in the panel below `stage-list-region`, guarded by
  `@if (stages().length >= 2)`, with `[stops]="campStopViews()"`,
  `(search)="loadCampgroundsForStop($event)"`, `(stopFocused)="onCampStopFocused($event)"`.
- Pass `[campStops]="campStopsList()"` and `[selectedCampStopIndex]="selectedCampStopIndex()"`
  to `<app-map>`.

### Automated Testing Decisions

**What makes a good test here.** Tests assert externally observable behaviour through the
module's public interface, not its internals. For `CampgroundService` that means: given a
mocked Overpass HTTP layer returning a known payload, the resolved
`{ campgrounds, radiusKm, expanded }` is correct. Tests must not assert on private query
strings beyond what is needed to drive the mock, nor on Leaflet objects.

**Module under test.** `CampgroundService` only (per the planning decision). The components
(`MapComponent`, `CampingListComponent`) are Leaflet/DOM glue and are not unit-tested.

**Type.** Unit tests with Angular `TestBed`, using `provideHttpClient` +
`provideHttpClientTesting` and `HttpTestingController` to stub Overpass responses. Each
radius iteration is a separate POST, so the test flushes responses per expected request to
drive the escalation.

**Cases to cover:**
- Hit at the smallest radius (5 km) ⇒ `radiusKm === 5`, `expanded === false`, only one
  Overpass request issued.
- No hit until 20 km ⇒ requests issued for 5, 10, 20 km; `radiusKm === 20`,
  `expanded === true`, results returned.
- No hit at any radius ⇒ requests for 5, 10, 20, 30 km; resolves
  `{ campgrounds: [], radiusKm: 30, expanded: true }`.
- Mapping: node element (`lat`/`lon`) and way element (`center.lat`/`center.lon`) both map
  to correct coordinates; missing `name` ⇒ `"Campingplatz"`; `website` falls back to
  `contact:website`; address assembled from `addr:*` tags, and `null` when absent.

**Prior art.** `src/app/map/stage-planner.service.spec.ts` — a root service tested in
isolation via `TestBed.inject(...)` with hand-built fixtures and behaviour-level assertions.
Follow its structure; add `HttpClientTesting` for the network boundary.