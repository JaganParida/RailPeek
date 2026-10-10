# RailPeek

> **Find the berth that actually works for your journey.**

RailPeek is a production-grade, public-facing SaaS railway utility platform that transforms complex Indian Railway chart and vacancy data into simple, journey-aware decisions.

---

## Core Product Capabilities

- **Journey-Aware Segment Discovery**: Evaluates exact route station indices to distinguish 100% full-journey berths from usable partial sub-segments.
- **Deterministic Best Match Engine**: Mathematical priority rankings based on route coverage, requested travel class, and group coherence—never AI guesses.
- **Group & Family Bay Clustering**: Physical layout-aware bay allocation prioritizing same bay ($0$-bay distance) and adjacent bays ($1$-bay distance) in the same coach.
- **Cross-Train Discovery & Comparison Matrix**: Discovers all timetable services between origin and destination with side-by-side class upgrade comparisons (3A, 2A, 1A, SL) and alternative date opportunities.
- **Visual Coach & Vacancy Explorer**: Interactive, authentic SVG/CSS coach schematics with compartment bays, aisle pathways, vestibule doors, and washrooms for 3A, 2A, 1A, and SL coaches.
- **Gemini Conversational AI with Deterministic Fallback**: Natural language journey insights with zero latency risk—falls back instantaneously to verified deterministic logic if unconfigured, timed out, or rate limited.
- **Production Live Provider Integration**: Connects to external verified railway APIs with Circuit Breaker isolation, exponential retry, and transparent demo disclosures.
- **Security & Performance Armor**: Hardened Helmet headers, strict origin CORS verification, 512kb body limits, true LRU in-memory cache bounding, and SingleFlight concurrency coalescing.
- **Free & No Login**: Completely friction-free utility without accounts, passwords, or payment collection.
- **Pure JavaScript ES6+**: 100% JavaScript (ES6+) and JSX. Zero TypeScript, zero Docker.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, TanStack Query v5, Zod, Lucide React (100% SVG icons, zero emojis)
- **Backend**: Node.js, Express.js, Zod runtime validation, Helmet, CORS
- **Database**: MongoDB Atlas via Mongoose (with serverless connection reuse across warm lambdas)
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Deployment**: Vercel (Static SPA + Serverless Express Functions)
- **Testing**: Vitest (148+ unit and integration tests)

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
git clone https://github.com/your-username/railpeek.git
cd railpeek
npm install
```

### Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Key configuration variables:
- `NODE_ENV`: `development` | `production` | `test`
- `PORT`: Server port (default: `5000`)
- `MONGODB_URI`: MongoDB Atlas connection string
- `RAILWAY_PROVIDER`: `mock` | `live` (defaults to `mock`)
- `GEMINI_API_KEY`: Google Gemini API key (optional, for conversational insights)
- `CLIENT_URL`: Allowed client origin for CORS whitelisting (default: `http://localhost:5173`)

### Running Locally

Run both the frontend and backend in parallel:

```bash
# Terminal 1: Backend API server
npm run dev:server

# Terminal 2: Frontend client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Verification & Quality Checks

Run code quality linting:
```bash
npm run lint
```

Run test suite:
```bash
npm run test
```

Build for production:
```bash
npm run build
```

---

## Deployment to Vercel

RailPeek is engineered for direct deployment to Vercel without Docker or containerization:

1. Import your Git repository into Vercel.
2. The project auto-configures from `vercel.json` (`buildCommand: "npm run build"`, `outputDirectory: "dist"`).
3. Set your environment variables in the Vercel Project Settings:
   - `MONGODB_URI`
   - `GEMINI_API_KEY` (optional)
   - `RAILWAY_PROVIDER` (`mock` or `live`)
   - `CLIENT_URL` (optional)
4. Deploy! Static assets are served from Vercel's global CDN and API routes are routed to serverless function `api/index.js`.

---

## License

MIT
