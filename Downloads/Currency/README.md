# Currency Exchange Rate Monitor
**Challenge**: MLCV-2026-6695 — Claude Code End-to-End Case Study  
**Author**: V (2141269@cognizant.com)  
**Date**: 2026-04-30  
**Stack**: Python FastAPI + SQLite · React + TypeScript + Vite + Tailwind CSS + Framer Motion

---

## Quick Start

### Backend (API + Database)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- Auto-creates & seeds SQLite DB on first start
- API docs (Swagger UI): http://localhost:8000/docs

### Frontend (UI)
```bash
cd frontend
npm install
npm run dev
```
- Open: http://localhost:5173

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/currency` | List all 6 supported currencies |
| `GET` | `/exchange-rate/{from}/{to}` | Exchange rate (direct, inverse, or cross-computed) |
| `GET` | `/health` | Health check |

### Sample: GET /currency
```json
{
  "INR": { "countryName": "India",  "currencyCode": "INR", "currencyName": "Indian Rupees" },
  "USD": { "countryName": "Usa",    "currencyCode": "USD", "currencyName": "US Dollars"    }
}
```

### Sample: GET /exchange-rate/USD/INR
```json
{ "fromCurrencyCode": "USD", "toCurrencyCode": "INR", "exchangeRate": "80.0800" }
```

### Sample: GET /exchange-rate/INR/USD  ← inverse (not stored, computed)
```json
{ "fromCurrencyCode": "INR", "toCurrencyCode": "USD", "exchangeRate": "0.0125" }
```

### Sample: GET /exchange-rate/XYZ/USD  ← invalid currency
```json
{ "detail": "Unsupported currency code(s): XYZ. Allowed currencies: AED, AUD, CAD, EUR, INR, USD" }
```
HTTP status: `400 Bad Request`

---

## Supported Currencies

| Code | Name | Country |
|------|------|---------|
| INR | Indian Rupees | India |
| USD | US Dollars | USA |
| CAD | Canadian Dollars | Canada |
| EUR | European Dollars | Europe |
| AUD | Australian Dollars | Australia |
| AED | UAE Dirham | UAE |

---

## Exchange Rate Resolution Algorithm

Only 6 rates are stored. All 30 permutations (6×5) are covered by a 4-level cascade:

```
Level 1: Same currency          → rate = 1.0
Level 2: Direct DB lookup       → e.g. USD→INR = 80.08 (stored)
Level 3: Inverse DB lookup      → e.g. INR→USD = 1/80.08 ≈ 0.0125
Level 4: Cross via INR pivot    → e.g. USD→AUD = 80.08/56.81 ≈ 1.41
Level 5: Cross via USD pivot    → fallback for any remaining pairs
Level 6: Not resolvable         → HTTP 404
```

This mirrors real FX systems that use a single base currency (e.g. USD or INR) as a reference anchor. It avoids storing O(n²) rate pairs while maintaining full accuracy.

---

## Running Tests

### Backend — 11 test cases
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend — 8 test cases
```bash
cd frontend
npm test
```

---

## Project Structure

```
Currency/
├── backend/
│   ├── main.py              ← FastAPI app, CORS, API routes, lifespan hook
│   ├── database.py          ← SQLite init/seed, 4-level rate resolver
│   ├── models.py            ← Pydantic response models
│   ├── seed.py              ← Standalone seed script (run once)
│   ├── requirements.txt
│   └── tests/
│       ├── conftest.py      ← Temp DB isolation, session fixture
│       └── test_api.py      ← 11 pytest cases (positive + negative)
├── frontend/
│   ├── src/
│   │   ├── App.tsx          ← Root state + submit logic
│   │   ├── components/
│   │   │   ├── Background.tsx        ← Animated cosmic grid + orbs
│   │   │   ├── CurrencySelector.tsx  ← Glassmorphism dropdown
│   │   │   ├── RateDisplay.tsx       ← Animated count-up + inverse
│   │   │   ├── SwapButton.tsx        ← 180° rotation swap
│   │   │   └── LiveClock.tsx         ← Live timestamp display
│   │   ├── hooks/useExchangeRate.ts  ← React Query data hooks
│   │   ├── api/currency.ts           ← Axios API client
│   │   └── tests/App.test.tsx        ← 8 Vitest cases
│   └── package.json
├── docs/
│   ├── CLAUDE.md            ← Custom instructions (code logic, tests, review)
│   ├── CODE_REVIEW.md       ← Detailed code review
│   ├── prompts.txt          ← All Claude Code commands/prompts used
│   └── database/
│       ├── create_tables.sql
│       └── seed_data.sql
└── README.md
```

---

## Framework & Design Rationale

### Why FastAPI + SQLite?
FastAPI provides automatic OpenAPI documentation, native async support, and Pydantic validation with minimal boilerplate. SQLite requires zero infrastructure — no separate DB server, no connection strings to manage — making the submission fully self-contained and portable. For a 6-currency dataset, SQLite is not a limitation; it is the right tool.

### Why React + Vite + TypeScript?
Vite gives sub-second HMR during development and produces optimized production bundles. TypeScript catches contract mismatches between the API client and UI components at compile time, not runtime. This is especially valuable for the `ExchangeRateResponse` shape which must exactly match the FastAPI model.

### Why the 4-Level Rate Resolver?
Storing all 30 possible pairs (6×5) would be brittle — every new currency doubles the required rows. The cascade resolver stores only "base" rates and derives the rest mathematically. This is how real FX systems work: banks quote rates against USD or EUR and cross-rates are computed. The spec explicitly requires inverse calculation; the pivot cross-rate is the natural extension of that same principle.

### Why Framer Motion for Animations?
Framer Motion's `AnimatePresence` handles mount/unmount transitions correctly — elements animate out before being removed from the DOM. This is critical for the rate card (which appears/disappears on each submit) and error messages. CSS transitions cannot handle this case.

### UI Design: "Cosmic Finance" Theme
The futuristic dark theme (deep space background, glassmorphism cards, neon cyan/purple palette) creates visual differentiation while remaining professional. The animated CSS grid background, floating blur orbs, and number count-up animation all use GPU-accelerated CSS properties (`transform`, `opacity`, `backdrop-filter`) — no jank, even on mid-range hardware.
