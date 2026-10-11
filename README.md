# RailPeek

> **Intelligent Indian Railways Berth Discovery, PNR Status & Refund Radar**

RailPeek is a production-grade railway utility platform designed to solve one of the most persistent traveler challenges: finding usable, confirmed berths and predicting ticket outcomes with complete mathematical certainty. Instead of presenting convoluted raw chart tables or opaque railway codes, RailPeek translates live charting data, route topology, and official railway policies into transparent, journey-aware travel decisions.

---

## Key Features

### 1. Find My Berth (Vacant Seat & Route Discovery)
- **Live Vacant Berth Detection**: Discovers post-charting and operational vacancies across train services operating on a route, identifying both 100% full-journey berths and usable sub-segment vacancies.
- **Deterministic Ranking Engine**: Prioritizes travel options based on exact route coverage, requested travel classes, journey durations, and passenger grouping—ensuring zero arbitrary predictions.
- **Multi-Class Discovery**: Supports seamless comparison across all passenger classes, including Sleeper (SL), 3-Tier AC (3A), 2-Tier AC (2A), 1st Class AC (1A), 3-Tier AC Economy (3E), AC Chair Car (CC), and Second Sitting (2S).
- **Group & Family Bay Clustering**: Compartment layout-aware seat allocator that automatically clusters traveling companions into the same coach or adjacent bays ($0$-bay and $1$-bay proximity).
- **Route Chainer (Connected Itineraries)**: Discovers continuous 2-leg seat sequences on the same train when direct full-journey berths are exhausted, allowing passengers to switch berths midway rather than remaining waitlisted.
- **Smart Chart Life-Cycle Tracking**: Real-time awareness of Indian Railways charting milestones, displaying countdown schedules for First Chart finalization (~4 hours prior to departure) and Final Chart closure (~30 minutes prior to departure).

### 2. PNR Status & Cancellation Refund Radar
- **Live 10-Digit PNR Lookup**: Real-time resolution of passenger booking status (`CNF`, `RAC`, `WL`), coach identifiers, seat numbers, and berth types (`LB`, `MB`, `UB`, `SL`, `SU`, `WS`).
- **Synchronized Predictive Confirmation (% Chance)**: Seamlessly reflects live predictive clearance models, displaying exact confirmation probabilities and categorized clearance likelihoods (*High Chance*, *Medium Chance*, *Low Chance*).
- **Official IRCTC Cancellation & Refund Radar**: Rigorous, gazetted refund calculator evaluating official Ministry of Railways deduction schedules:
  - **> 48 Hours Before Departure**: Flat clerkage deduction.
  - **48 Hours to 12 Hours Before Departure**: 25% fare deduction (subject to minimum clerkage rules).
  - **12 Hours to 4 Hours Before Departure**: 50% fare deduction (subject to minimum clerkage rules).
  - **< 4 Hours / Chart Prepared**: 0% refund (zero refund window).
- **Dynamic Penalty Drop Countdown**: Live countdown indicator tracking remaining time before ticket cancellation drops into the next penalty window.
- **High-Res Boarding Pass Generator**: Renders pixel-perfect, shareable digital boarding pass cards in PNG format for offline storage, printing, and WhatsApp communication.
- **Private On-Device Ticket Wallet**: Encrypted local browser caching storing recent PNR searches without collecting user identity, credentials, or phone numbers.

### 3. Interactive Coach Layout & Berth Explorer
- **Authentic Coach Schematics**: Precision-engineered vector coach visualizers reflecting Indian Railways ICF and LHB configurations.
- **Berth Orientation & Position**: Visual inspection of berth positions relative to windows, aisles, compartments, washrooms, and entry vestibules.
- **Segment Occupancy Mapping**: Color-coded physical berth breakdown showing which stations a seat is occupied and where it becomes vacant.

### 4. AI Journey Insights
- **Contextual Route Advice**: Intelligent breakdowns explaining train selection trade-offs, boarding terminal logistics, and travel considerations.
- **Resilient Fallback Guard**: Fully deterministic offline fallback ensuring zero latency degradation even during external network fluctuations.

### 5. High-Performance Reliability & Security
- **SingleFlight Request Deduplication**: Prevents concurrent duplicate queries from straining upstream railway servers.
- **Multi-Tiered Memory Caching**: Intelligent dynamic TTL caching (extended TTL for confirmed charts, shorter TTL for dynamic waitlists).
- **Hardened Security Architecture**: Hardened Helmet security headers, strictly scoped CORS validation, body size restrictions, and zero credential leakage.
- **100% Friction-Free Utility**: Open public utility requiring zero logins, passwords, or credit card collection.

---

## Tech Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend Framework** | React 18 (ES6+), React Router v6, Vite |
| **State & Data Fetching** | TanStack React Query v5 (Optimistic caching, zero background polling storms) |
| **Styling & Design System** | Tailwind CSS, Lucide React (Clean vector iconography) |
| **Runtime Validation** | Zod (End-to-end schema validation) |
| **Backend Runtime** | Node.js (ES Modules), Express.js |
| **API Architecture** | RESTful Serverless Functions (`api/index.js`) |
| **Security & Hardening** | Helmet (HSTS, CSP, XSS Filters), CORS, SingleFlight Coalescing |
| **Database** | MongoDB Atlas via Mongoose (Serverless connection reuse) |
| **AI Insights** | Google Gemini API with deterministic fallback layer |
| **Cloud & Hosting** | Vercel (Edge CDN Static SPA + Serverless Backend API) |

---

## Proprietary & Distribution Notice

**Copyright © RailPeek. All Rights Reserved.**

This repository is maintained for deployment and informational purposes. 
- **No Forks Allowed**: Copying, reproducing, or forking this repository or its source code is strictly prohibited.
- **No External Contributions**: This project does not accept external pull requests, issues, or community contributions.
- All code, design systems, algorithms, and intellectual assets remain the exclusive proprietary property of the author.
