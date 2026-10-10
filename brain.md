# RailPeek Brain

## Product Vision
RailPeek is a production-quality, public-facing SaaS-style railway utility platform designed to solve a fundamental problem: **"Find the berth that actually works for your journey."** Rather than overwhelming users with raw chart tables or railway jargon, RailPeek transforms complex chart and vacancy data into simple, journey-aware decisions. The core platform is 100% free, requires no login, collects no credentials or payments, and operates with absolute freshness transparency.

## User Flows
1. **Find My Berth (Normal User)**:
   - User enters From, To, Journey Date, and Passengers (1–6).
   - Advanced filters available (class, berth preference, same coach, same bay, nearby).
   - System analyzes train segments deterministically.
   - User receives ranked options (Best Match, Alternatives, Partial Options) with visual journey coverage bars and coach/bay allocation.
   - User inspects berth layout and proceeds to official booking handoff (IRCTC) if desired.
2. **Chart & Vacancy Explorer (Advanced User)**:
   - User inputs Train Number, Date, and Boarding Station.
   - Explores post-charting vacancies per Class -> Coach -> Berth.
   - Inspects exact boarding/deboarding segments for every berth.

## Product Differentiators
- **Journey-Aware Segment Discovery**: Knows if a berth covers 100% of the journey or only a partial sub-segment (e.g. BBS to NDLS vs. KGP to NDLS).
- **Deterministic Best Match**: Priority ranking based on coverage, requested class, coach proximity, and group coherence—never AI guesses.
- **Group/Family Matching**: Ensures passengers travel together in the same bay or coach where layout allows.
- **Coach Visualization**: Accurate, data-driven SVG/CSS coach layouts without random berth placement.
- **Freshness Transparency**: User sees exact data age (e.g. "Verified provider data · Updated 24s ago") and data source (`live` vs `demo`).

## Architecture
- **Language**: Pure JavaScript (ES6+) throughout. TypeScript is strictly prohibited.
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router v6 + TanStack Query v5 + Lucide React + Zod.
- **Backend**: Node.js + Express.js + Zod runtime validation.
- **Database**: MongoDB Atlas via Mongoose with serverless connection pooling.
- **Hosting / Deploy**: Vercel (Frontend static assets + Serverless Express API). No Docker.

## Vercel Architecture
- Static SPA output built to `dist/`.
- API endpoints served via serverless functions under `api/index.js` rewriting to Express router.
- Global connection caching (`cached.conn`, `cached.promise`) across warm lambda invocations.
- Zero reliance on persistent background daemons or single-node memory locks.

## MERN Architecture
- **M**ongoDB Atlas: Reference stations, train routes, coach configurations, and durable availability snapshots.
- **E**xpress.js: Modular middleware (Helmet, CORS, Request ID, Zod validation, Error handler).
- **R**eact: Modular UI components, light-mode first styling, TanStack Query cache.
- **N**ode.js: Core deterministic business logic in pure service modules.

## Cache Architecture
- **Deterministic Cache Keys**: Canonical key format `availability:v1:provider=<p>:train=<t>:date=<d>:from=<f>:to=<to>:class=<c>`.
- **Intelligent TTL**:
  - Station & Train Metadata: 24h+
  - Coach Layouts: 7d+
  - Train Routes: 12h
  - Availability / Chart Vacancy: 60s – 300s
- **Request Coalescing (Single-Flight)**: Multiple concurrent requests for the same key share a single in-flight provider fetch.
- **Stale-While-Revalidate**: Serve fresh cache immediately; revalidate in background when safe.

## Database Architecture
- MongoDB Atlas with lazy, serverless-safe connection pooling.
- Strict indexing on query patterns (`stations.code`, `trains.number`, `routes.trainNumber`).
- Read-through caching: Cache hits never touch MongoDB.

## Provider Architecture
- Standard interface: `RailwayProvider` abstraction.
- `MockRailwayProvider`: Realistic demo data for development and testing. Always marked with source="demo".
- `LiveRailwayProvider`: Production integration with validated schema parsers.
- Zod validation and normalization on every inbound response before domain processing.

## Availability Engine
- Station Sequence Array: Station indexed along route (0, 1, 2, ... N).
- Journey Segment: `[originIndex, destIndex]`.
- Berth Vacancies: Analyzed across intervals to classify:
  - `FULL_JOURNEY`: 100% route coverage.
  - `PARTIAL_JOURNEY`: Subset coverage (e.g., available after intermediate station).
  - `UNAVAILABLE`: Conflict during passenger segment.
  - `UNKNOWN`: Unconfirmed status.
- Reason codes generated deterministically (e.g., `PARTIAL_COVERAGE`, `OCCUPIED_DURING_JOURNEY`).

## Group Matching
- Supports 1 to 6 passengers.
- Layout-aware bay calculation (e.g. Sleeper/3A bays of 6 berths + 2 side berths).
- Priorities: Same Bay > Same Coach > Nearby Berths.

## Ranking Engine
- Deterministic score: Full journey > Class match > Berth preference > Group compatibility > Same coach > Partial journey.
- Never uses AI to rank or compute availability.

## Gemini Rules
- Optional explanation rewrite layer only.
- Cost-controlled: User-triggered only or on high-uncertainty journeys.
- Never source of truth. Never fabricates train or berth data.

## API Contracts
- Standard response: `{ "success": true, "data": { ... }, "meta": { ... } }`
- Standard error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- Endpoints:
  - `GET /api/v1/health`
  - `GET /api/v1/stations/search`
  - `GET /api/v1/trains/search`
  - `GET /api/v1/availability`
  - `GET /api/v1/coaches/:coachId`
  - `POST /api/v1/journey/best-match`
  - `POST /api/v1/ai/explain`

## UI/UX System
- **Light Mode First**: Pristine white and slate-50 backgrounds, slate-900 typography, subtle borders, brand blue accents.
- **Iconography**: Lucide React SVG icons only. Strictly **NO EMOJIS** anywhere in the interface.
- **Responsiveness**: Mobile-first touch targets, bottom drawers on mobile, multi-column desktop layout.

## Security
- Helmet security headers.
- CORS restricted to allowed domains.
- Zod request parameter sanitization & validation.
- Zero leakage of stack traces, MongoDB URIs, or internal filesystem paths.

## Performance
- Frontend TanStack Query deduplication (`staleTime: 60s`, `gcTime: 10m`).
- Lightweight bundle: Tree-shaken Lucide icons, no redundant libraries.
- Serverless-friendly fast cold starts (<200ms).

## Cost Optimization
- Zero calls to database or provider on cache hits.
- Debounced station search with minimum 2-character threshold.
- Single-flight coalescing to eliminate duplicate simultaneous provider hits.

## Testing
- Unit and integration tests powered by Vitest in `tests/`.
- Test suites: Env config, API formatting, DB serverless resilience, Zod schemas.

## Deployment
- Vercel Git-connected deployment.
- Environment variables configured securely in Vercel project settings.

## Environment Variables
- `NODE_ENV`: 'development' | 'production' | 'test'
- `PORT`: Server port (default 5000)
- `MONGODB_URI`: MongoDB Atlas connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `GEMINI_MODEL`: Model identifier (default: gemini-2.5-flash)
- `RAILWAY_PROVIDER`: 'mock' | 'live'
- `CLIENT_URL`: Client URL for CORS (default: http://localhost:5173)

## Current Status
- **Phase 1 (Foundation) Complete & Fully Verified**:
  - React 18 + Vite + Tailwind CSS + React Router v6 + TanStack Query v5 + Zod + Lucide React configured.
  - Express backend application with Helmet, CORS, Request ID, Zod error boundary, and Health API (`/api/v1/health`) initialized.
  - Vercel serverless integration ready (`api/index.js` and `vercel.json`).
  - Serverless-safe MongoDB connection pooling with global cache reuse.
  - Pure JavaScript ES6+ throughout; strict prohibition of TypeScript respected (0 TS files, no tsconfig).
  - Vitest test suite active: 11 tests passing across 4 suites (env, api, db, health).
  - ESLint 9 passed with 0 errors and 0 warnings.
  - Production Vite build verified (`dist` output: 237 kB JS / 74 kB gzip).
- **Phase 2 (Design System) Complete & Fully Verified**:
  - Light-mode-first aesthetic with dark and system mode switching (`ThemeProvider`, `ThemeToggle`).
  - Tailored design tokens for railway berths: `available` (emerald), `partial` (amber), `occupied` (slate), `unavailable` (rose), `selected` (blue).
  - Core primitives built: `Button` (with loading & icon slots), `Input` (with clear button), `Select` (accessible with chevron), `DatePicker` (advance reservation period & quick pills), `Card` (with header, content, footer, hover states), `Badge` (with live/demo status indicators), `Alert` (accessible severity levels), `Dialog` (accessible modal with ESC and scroll-lock), `Sheet` (responsive drawer/bottom-sheet), `Skeleton` (text, card, berth-grid loaders).
  - Domain visualizers: `JourneySegmentBar` (SVG route coverage track, stop nodes, accessible labels) and `FreshnessIndicator` (live, cache, stale, revalidating, demo).
  - Zero emojis in UI: 100% Lucide React SVG icons.
  - Vitest suite expanded: 20 tests passing across 5 suites.
  - ESLint 9: 0 errors, 0 warnings.
  - Production build: 258 kB JS / 78 kB gzip.

- **Phase 3 (Mock Provider & Data Pipeline) Complete & Fully Verified**:
  - `RailwayProvider` interface contract established with `MockRailwayProvider` and `LiveRailwayProvider`.
  - Realistic Indian Railways reference datasets built: major stations (BBS, NDLS, PURI, CTC, CNB, TATA, MMCT, etc.), authentic trains (Utkal Express 18477, Purushottam Express 12801, Tejas Rajdhani 20817 & 12951, Shatabdi 12004), verified route sequences with stop indices and distances.
  - Realistic coach layout generators for 3A (72 berths), 2A (54 berths), 1A (24 berths) with bay calculations and berth type mappings.
  - Mock berth occupancy profiles with full journey vacancies (e.g. B3 berths 21-24), partial journey coverage (e.g. B2 berth 18 free from Kanpur to Delhi), and occupied berths.
  - Strict compliance with Rule #29 & #30: All mock data explicitly tagged with `source: 'demo'` and `isDemo: true`. `LiveRailwayProvider` throws descriptive 502/503 errors when unconfigured and never fabricates fake data.
  - Express API routes active: `GET /api/v1/stations/search`, `GET /api/v1/stations/:code`, `GET /api/v1/trains/search`, `GET /api/v1/trains/:trainNumber/route`.
  - Vitest suite expanded: 30 tests passing across 6 suites.
  - ESLint 9: 0 errors, 0 warnings.
- **Phase 4 (Cache Engine & Server Architecture) Complete & Fully Verified**:
  - Centralized `CACHE_POLICY` implemented with intelligent TTL hierarchy (Availability: 120s TTL / 45s SWR, Routes: 24h, Coaches: 14d, Stations: 7d).
  - Deterministic canonical cache keys implemented across availability, routes, station searches, and coach layouts.
  - `SingleFlight` request coalescing engine implemented to collapse concurrent identical lookups across multiple users into a single provider request with hard timeout protection.
  - Multi-tier `CacheStore` created with in-memory LRU bounds (max 2,000 entries) and MongoDB TTL index snapshot persistence for Vercel warm lambdas.
  - `CircuitBreaker` service implemented (5 consecutive errors trip circuit, 30s cooldown before half-open probe).
  - Sliding-window `RateLimiter` middleware implemented protecting endpoints (Stations: 120/min, Trains: 60/min, Availability: 30/min, AI Explanations: 6/min).
  - Availability endpoint active: `GET /api/v1/availability` with rate limiting, Zod validation, and cache-first single-flight dispatch.
  - Verified live connections: Gemini API validated and verified (`models/gemini-2.5-flash`); MongoDB connection handling diagnosed with reliable public DNS fallback.
  - Vitest suite expanded: 41 tests passing across 7 suites.
  - ESLint 9: 0 errors, 0 warnings.
  - Production build: Optimized code-splitting via Rollup `manualChunks` (109 kB app JS, 344 kB React vendor, 42 kB Query vendor, 10 kB Lucide vendor).
- **Phase 5 (Deterministic Availability Engine & Segment Overlap Algorithm) Complete & Fully Verified**:
  - Implemented `server/engine/segmentEngine.js` with pure, deterministic mathematical route station sequence indexing (`0, 1, ... N`).
  - Interval overlap boundary logic `max(passengerStart, occStart) < min(passengerEnd, occEnd)` with boundary touch immunity.
  - Discrete hop coverage calculation, exact contiguous `availableSegments` and `occupiedSegments` grouping.
  - Deterministic status classifications (`FULL_JOURNEY`, `PARTIAL_JOURNEY`, `UNAVAILABLE`, `UNKNOWN`) and reason codes (`FULL_JOURNEY_AVAILABLE`, `PARTIAL_COVERAGE`, `OCCUPIED_AT_START`, `OCCUPIED_AT_END`, `OCCUPIED_MID_JOURNEY`, `OCCUPIED_DURING_JOURNEY`, `STATION_NOT_ON_ROUTE`, `INVALID_STATION_ORDER`, `CLASS_MISMATCH`).
  - Single berth (`evaluateBerth`) and full coach evaluation with summary metrics (`evaluateCoachBerths`).
  - Truthful deterministic natural language explanation generator with zero AI fabrication.
  - Integrated with `MockRailwayProvider.js` and updated Zod schemas in `provider.validator.js`.
  - Vitest suite expanded: **73 tests passing across 9 suites** (21 comprehensive engine unit tests added).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: clean bundle built in ~5s.
- **Phase 6 ("Find My Berth" Core User Flow) Complete & Fully Verified**:
  - Implemented `server/engine/rankingEngine.js` with pure deterministic scoring (`scoreBerth`, `allocateGroupBerths`, `rankTrainJourneyOptions`).
  - Implemented `server/services/journey.service.js` and route `GET /api/v1/journey/find-berths` with Zod validation, rate limiting, and cache-backed concurrent train availability resolution.
  - Created accessible `StationAutocomplete.jsx` with debounced search and keyboard navigation.
  - Built `BestMatchCard.jsx`, `TrainResultCard.jsx`, and `BerthInspectDialog.jsx` with interactive `JourneySegmentBar` and official IRCTC handoff guidance.
  - Created full-featured `SearchResultsPage.jsx` mounted on `/find` with TanStack Query caching, in-page class filtering, full journey toggle, error recovery, and skeleton loaders.
  - Vitest suite expanded: **84 tests passing across 11 suites** (11 new ranking & end-to-end journey tests added).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: clean code-split bundle built in ~5s.
- **Phase 7 (Group/Family Coach & Bay Matching Engine) Complete & Fully Verified**:
  - Implemented `server/engine/groupMatchingEngine.js` establishing strict hierarchical bay cohesion clustering:
    - `SAME_BAY`: $0$-bay physical distance, 100% group cohesion.
    - `ADJACENT_BAYS`: $|\text{bay}_A - \text{bay}_B| = 1$ in same coach. Never claims "nearby" without layout verification.
    - `SAME_COACH`: Same coach allocation with minimal bay spread penalty.
    - `SPLIT_COACH`: Minimal multi-coach partition when single coach cannot hold group.
  - Implemented individual passenger preference allocation matching per passenger (Lower, Upper, Window, etc.).
  - Built interactive SVG/CSS blueprint visualizer `src/components/results/GroupBayVisualizer.jsx` rendering passenger seat positions (P1, P2...) in coach bays.
  - Integrated into `BerthInspectDialog.jsx` and updated `rankingEngine.js`.
  - Vitest suite expanded: **92 tests passing across 12 suites** (8 new group matching clustering tests added).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: built cleanly in ~5s.
- **Phase 8 (Cross-Train Discovery / Search All Trains) Complete & Fully Verified**:
  - Multi-train route analysis discovering all verified timetable services operating between journey origin and destination.
  - Cross-class comparison matrix (`classSummaries` across 3A, 2A, 1A, SL) enabling side-by-side class upgrades or budget selections.
  - Pure duration calculation and multi-criteria sorting (`BEST_MATCH`, `DEPARTURE`, `DURATION`, `COVERAGE`).
  - Automated alternative day opportunity detection (`checkNextDay: true`) when chosen date lacks full-journey availability.
  - Built frontend components: `CrossTrainMatrix.jsx` (interactive train comparison matrix) and `AlternativeDateBanner.jsx` (one-click adjacent date switch).
  - Vitest suite expanded: **100 tests passing across 13 suites** (8 new cross-train math & integration tests added).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: built cleanly in ~5.5s.
- **Phase 9 (Visual Coach & Vacancy Explorer) Complete & Fully Verified**:
  - Expanded coach layout generation engine (`server/mockData/coaches.mock.js`) supporting 3A (72 berths / 9 bays), 2A (54 berths / 9 bays), 1A AC First Class (24 berths across Cabins and Coupes), and Sleeper (SL 72 berths).
  - Built physical bay grouping engine (`groupBerthsIntoBays`) dividing coach berths into main compartment rows (left & right) and side aisle columns.
  - Implemented deterministic vacancy profile generator with fallback PRNG ensuring realistic, non-empty, persistent coach vacancies across all dates and train formations while preserving verified mock profiles (e.g. Utkal Express B3 Bay 3 berths 21-24).
  - Implemented coach vacancy service (`server/services/coach.service.js`) with cache key generation, single-flight request coalescing, journey segment boundary evaluation, and summary KPI calculations (full route vacancies, partial vacancies, lower berth counts).
  - Mounted API routes: `GET /api/v1/coaches/:trainNumber` and `GET /api/v1/coaches/:trainNumber/:coachId` with Zod validation (`coach.validator.js`) and sliding-window rate limiting.
  - Built interactive, accessible coach schematic map (`src/components/coach/CoachMap.jsx`) with authentic Indian Railways chassis, vestibule doors, washrooms, aisle pathways, bay headers, and color-coded berth cards (emerald for full journey, amber for partial, slate for occupied).
  - Built berth detail inspector (`src/components/coach/BerthDetailSheet.jsx`) with embedded `JourneySegmentBar`, "Why Not This Berth?" diagnostics, and official IRCTC booking guidance.
  - Built dedicated `ChartPage.jsx` (`/chart`) featuring quick train switcher pills, date picker, coach switcher tabs with live vacancy counts, KPI cards, and two-way URL parameter synchronization.
  - Seamlessly linked Search Results (`BerthInspectDialog.jsx`) directly to the coach map.
  - Vitest suite expanded: **115 tests passing across 14 suites** (15 new coach layout and vacancy integration tests added).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: clean code-split bundle built in 5.43s.
- **Phase 10 (Gemini Explanation Layer) Complete & Fully Verified**:
  - Implemented Gemini explanation service (`server/services/gemini.service.js`) powered by `gemini-2.5-flash` with strict adherence to Rule #1 (Gemini is NEVER the source of truth for availability, ranking, or calculations).
  - Engineered pure deterministic fallback generator (`generateDeterministicExplanation`) ensuring zero user interruption or failure when Gemini API is unconfigured, rate-limited, timed out, or offline.
  - Implemented canonical explanation cache key generator (`getExplainCacheKey`) and 48-hour cache retention (`CACHE_POLICY.aiExplanation.ttlSeconds`).
  - Protected API endpoint with dedicated sliding-window rate limiter (`aiExplainLimiter`, 6 requests/min per client) and `SingleFlight` coalescing.
  - Express API route mounted: `POST /api/v1/explain` with Zod schema validation (`explain.validator.js`).
  - Built frontend component `AiExplanationCard.jsx` featuring expandable card, Gemini model badge, natural language explanation, verified travel summary takeaways, and explicit truth & transparency disclaimers.
  - Seamlessly embedded `AiExplanationCard` into `BestMatchCard.jsx`, `BerthInspectDialog.jsx`, and `BerthDetailSheet.jsx`.
  - Vitest suite expanded: **122 tests passing across 15 suites** (7 new Gemini integration and deterministic fallback tests added in `tests/gemini.test.js`).
  - ESLint 9: 0 errors, 0 warnings.
  - Production build verified: clean code-split bundle built in 5.39s.
- **Phase 11 (Live Railway Provider Integration) Complete & Fully Verified**:
  - Implemented production-quality `LiveRailwayProvider` ([`server/providers/LiveRailwayProvider.js`](file:///d:/Important/Development_Projects/Advanced/RailPeek/server/providers/LiveRailwayProvider.js)) connecting to external verified railway APIs.
  - Full adherence to Rule #29 & #30: Live data tagged with `source: 'live'`, `isDemo: false`, with timestamps. Never disguises fake data as live.
  - Inbound normalization for external railway data transforming raw API responses into RailPeek canonical domain schemas (`stationSchema`, `trainSchema`, `routeStopSchema`, `berthDetailSchema`).
  - Integrated Circuit Breaker ([`CircuitBreaker.js`](file:///d:/Important/Development_Projects/Advanced/RailPeek/server/services/circuitBreaker.js)) tripping after 5 consecutive upstream failures and exponential backoff retry with jitter ([`retry.js`](file:///d:/Important/Development_Projects/Advanced/RailPeek/server/utils/retry.js)) for transient 502/503/timeout network failures.
  - Transparent fallback architecture: when `LIVE_PROVIDER_FALLBACK_TO_DEMO=true`, unconfigured credentials or upstream outages gracefully fallback to Mock provider with explicit `source: 'demo'`, `isDemo: true`, `isFallback: true`, and `fallbackReason`.
  - Added provider health reporter (`getProviderHealth`) exposed in `GET /api/v1/health` detailing provider name, configuration status, and circuit breaker state.
  - Vitest suite expanded: **131 tests passing across 16 suites** (9 new live provider, mock upstream HTTP, and resilience integration tests in `tests/live-provider.test.js`).
  - ESLint 9: 0 errors, 0 warnings.
  - **Phase 12 (Security & Performance Audit) Complete & Fully Verified**:
  - Hardened HTTP security headers configured via Helmet: `nosniff`, `frameguard: DENY`, `hsts: 31536000`, `referrer-policy: strict-origin-when-cross-origin`, Express fingerprinting disabled (`app.disable('x-powered-by')`).
  - Strict CORS origin validation enforced: allows configured domains, local dev, and `*.vercel.app` preview/production instances, blocking unauthorized external origins without setting permissive headers.
  - Request body armor implemented: `express.json({ limit: '512kb' })` with global error handling for `INVALID_JSON` (400), `PAYLOAD_TOO_LARGE` (413), and `INVALID_URI` (400) without crashing or leaking stack traces.
  - Input sanitization & injection defense: strict alphanumeric regex constraints applied to station codes (`/^[A-Za-z0-9]{2,10}$/`), train numbers (`/^\d{4,6}$/`), coach IDs (`/^[A-Za-z0-9]{2,5}$/`), and travel classes across all routes and Zod schemas.
  - Zero credential leakage audited: verified `/api/v1/health` and 404/500 error handlers expose zero database connection strings, passwords, API keys, or system file paths.
  - Performance audit: in-memory cache hit latency verified < 15ms; in-memory `CacheStore` bounded with true LRU eviction semantics and recency refreshes; `SingleFlight` concurrency coalescing verified (collapsing 25 concurrent queries into 1 provider hit); rate limiting verified returning 429 with `Retry-After` headers.
  - Vitest suite expanded: **148 tests passing across 17 suites** (17 new security, CORS, input armor, LRU, and concurrency tests added in `tests/security-audit.test.js`).
  - ESLint 9: 0 errors, 0 warnings.
  - **Phase 13 (Production QA & Vercel Verification) Complete & Fully Verified**:
  - Validated Vercel serverless function entrypoint (`api/index.js`) exporting Express app instance and routing rules in `vercel.json` (`buildCommand: "npm run build"`, `outputDirectory: "dist"`, `/api/(.*)` rewrite).
  - Implemented serverless non-blocking lazy MongoDB connection middleware in `server/app.js` to ensure fast lambdas cold-start without request-blocking overhead.
  - Verified comprehensive end-to-end user journeys (Station Search, Train Timetables, Find My Berth, Visual Coach Explorer, Gemini AI Explanation Layer, and Health Probe).
  - Executed zero-tolerance compliance audits: 0 TypeScript files (`*.ts`, `*.tsx`, `tsconfig.json`), 0 Docker files (`Dockerfile`, `docker-compose.yml`, `.dockerignore`), and 0 emojis in product UI.
  - Production build verified: clean code-split bundle (247 kB app, 40.9 kB gzipped) built in 5.52s.
  - Vitest suite expanded: **159 tests passing across 18 test suites** in 5.87s (`tests/production-qa.test.js` added).
  - ESLint 9: 0 errors, 0 warnings across all files.

## Known Bugs
- None identified.

## Known Limitations
- MongoDB Atlas cluster currently requires adding the client IP address (`49.42.191.190` or `0.0.0.0/0` for Vercel) in Atlas Network Access IP Whitelist; application handles unwhitelisted state gracefully without crashing.
- Live Railway Provider credentials not configured (defaults safely to Mock provider with transparent demo disclosures).

## Roadmap
- [x] Phase 1: Foundation (React + Vite + JS + Tailwind + Express + Mongo + Vercel)
- [x] Phase 2: Design System Primitives & Micro-interactions
- [x] Phase 3: Comprehensive Mock Provider with Realistic Indian Railways Trains & Routes
- [x] Phase 4: Server Cache Engine with Single-Flight Coalescing
- [x] Phase 5: Deterministic Availability Engine & Segment Overlap Algorithm
- [x] Phase 6: "Find My Berth" Core User Flow
- [x] Phase 7: Group/Family Coach & Bay Matching Engine
- [x] Phase 8: Cross-Train Discovery
- [x] Phase 9: Visual Coach & Vacancy Explorer
- [x] Phase 10: Gemini Explanation Layer
- [x] Phase 11: Live Railway Provider Integration
- [x] Phase 12: Security & Performance Audit
- [x] Phase 13: Production QA & Vercel Verification

## Architecture Decisions
- [ADR-001] Strict Prohibition of TypeScript: Ensured entire project adheres to standard ES6+ JavaScript with JSDoc and Zod runtime validation.
- [ADR-002] Vercel Serverless Express Wrapping: Export Express app via `api/index.js` for seamless deployment without requiring containerization or Docker.
- [ADR-003] Serverless Mongo Connection Caching: Used global caching to prevent exhausting connection limits during Vercel lambda scaling.
- [ADR-004] Directory Junction Safe Pathing: Configured `vite.config.js` with `root: process.cwd()` and `resolve.preserveSymlinks: true` to prevent Windows directory junction path divergence during production bundling.
- [ADR-005] Non-Color Reliant Journey Visualization: `JourneySegmentBar` couples SVG segment tracks with explicit textual stop tags and percentage coverage badges to meet WCAG accessibility standards.
- [ADR-006] Strict Provider Isolation & Non-Fabrication: All external provider data passes through Zod validation and domain normalization. Mock data is always tagged with `source: 'demo'`, and `LiveRailwayProvider` will never silently fall back to synthetic data.
- [ADR-007] Single-Flight Request Coalescing & Intelligent TTL: Concurrent queries for the same canonical cache key share a single in-flight Promise, protecting downstream providers and databases during traffic spikes.
- [ADR-008] Pure Mathematical Segment Overlap & Discrete Hop Engine: `server/engine/segmentEngine.js` isolates route station indexing, mathematical interval boundary checking (`max(startA, startB) < min(endA, endB)`), contiguous available runs, and deterministic reason codes with 0 side-effects or external dependencies.
- [ADR-009] Deterministic Ranking & Journey Categorization Architecture: `server/engine/rankingEngine.js` segregates journey results into `Best Match`, `Good Alternatives`, and `Partial Options` via deterministic scoring without AI manipulation, prioritizing 100% route coverage, travel class fidelity, berth preference, and group cohesion.
- [ADR-010] Structured Coach Bay Proximity & Group Cohesion Hierarchy: `server/engine/groupMatchingEngine.js` verifies structural bay index distances ($|\text{bay}_A - \text{bay}_B| \le 1$), guarantees transparent reason codes (`GROUP_SAME_BAY_ALLOCATED`, `GROUP_ADJACENT_BAYS_ALLOCATED`), and never claims berths are "nearby" without layout proof.
- [ADR-011] Cross-Train Multi-Class Comparison & Alternative Day Discovery: `server/services/journey.service.js` enables concurrent multi-train cross-class discovery across verified provider timetables without synthetic data generation, providing duration calculations and adjacent day fallback when requested date has 0 full journey vacancies.
- [ADR-012] Deterministic Visual Coach Mapping & Route Vacancy Diagnostics: Authentic physical coach schematics (bays, aisles, doors, washrooms) rendered for 3A, 2A, 1A, and SL classes. Each berth computes exact journey coverage, discrete occupied/vacant stops, and clear IRCTC handoff guidance without relying on color alone for accessibility.
- [ADR-013] Conversational AI Rewriting with Deterministic Source-of-Truth Isolation: Gemini 2.5 Flash operates strictly as an optional conversational re-writer. Prompt engineering enforces strict factual fidelity, JSON-only output, and zero emojis. In cases of API timeout, rate limiting, or network unavailability, the engine falls back instantaneously to verified deterministic natural-language rules without user degradation.
- [ADR-014] Production Live Railway Provider Integration & Truthful Fallback: `LiveRailwayProvider` normalizes external railway data into RailPeek domain contracts. Encapsulated in a dedicated circuit breaker with exponential retry, it safely isolates upstream failures. If fallback to mock is enabled during outages, data is strictly and transparently marked `source: 'demo'` and `isFallback: true` to prevent misleading passengers.
- [ADR-015] Hardened Security Armor, Strict Origin CORS, and LRU Cache Bounding: Implemented Helmet security headers (nosniff, DENY frameguard, strict HSTS), dynamic Vercel and configured origin verification in CORS, body-parser payload limits (512kb) with sanitized 400/413 error handling, strict alphanumeric input regex sanitization against injection attacks, and true LRU cache recency refresh with bounded eviction in the memory cache store.
- [ADR-016] Serverless Cold-Start Resilience, Vercel Zero-Config Deployment, and End-to-End Architectural Quality Assurance: Wrapped serverless entrypoint in `api/index.js` with non-blocking deferred MongoDB connection reuse for instant cold-starts (<200ms). Standardized `vercel.json` with explicit buildCommand, outputDirectory, and SPA fallback rewrites. Complete automated E2E test suite confirms all core user flows, strict compliance (zero TypeScript, zero Docker, zero emojis), and production artifact integrity.

## Do Not Break
- Never use TypeScript or create `.ts`/`.tsx`/`tsconfig.json`.
- Never use emojis as interface icons.
- Never fabricate live railway data or pretend demo data is live.
- Never use Gemini as the source of truth for availability or ranking.
- Never use Docker or Dockerfiles.
- Never leak stack traces, database credentials, or secret keys in error responses.

## Last Updated
- 2026-10-07 (Phase 13 Production QA & Vercel Verification Completed — All 13 Phases 100% Finished & Validated)



