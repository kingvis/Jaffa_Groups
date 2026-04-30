# CLAUDE.md — Custom Instructions for Currency Exchange Rate Monitor

## Project Overview

This project implements a **Currency Exchange Rate Monitoring System** as required by challenge MLCV-2026-6695. It consists of a Python FastAPI backend with SQLite storage and a React + TypeScript frontend with a futuristic "Cosmic Finance" UI theme.

---

## Code Logic Overview

### Backend Architecture (`backend/`)

#### Database (`database.py`)
- Uses Python's built-in `sqlite3` — no ORM, no external DB server required
- `DB_PATH` points to `currency.db` in the backend folder
- `ALLOWED_CURRENCIES` set enforces validation at the API layer: `{"INR","USD","CAD","EUR","AUD","AED"}`
- `init_db()` creates tables on first run using `CREATE TABLE IF NOT EXISTS`
- `seed_db()` uses `INSERT OR IGNORE` — idempotent, safe to call multiple times

#### Rate Resolution Algorithm (`resolve_rate` in `database.py`)
The `resolve_rate(from_cur, to_cur)` function uses a 4-level cascade:

```
Level 1: Same currency          → return 1.0
Level 2: Direct DB lookup       → USD→INR = 80.08 (stored)
Level 3: Inverse DB lookup      → INR→USD = 1/80.08 (computed)
Level 4: Cross via INR pivot    → USD→AUD = USD→INR / AUD→INR = 80.08/56.81
Level 5: Cross via USD pivot    → fallback for any remaining pairs
Level 6: Not resolvable         → return None → HTTP 404
```

This handles all 30 possible pairs from 6 currencies (6×5 permutations) without storing 30 rows.

#### API Routes (`main.py`)
- `GET /currency`: Returns all currencies keyed by code, country names are title-cased
- `GET /exchange-rate/{fromCur}/{toCur}`: Validates, resolves, formats to 4 decimal places
- FastAPI lifespan hook auto-inits and seeds DB on startup
- CORS middleware allows `localhost:5173` (Vite dev server)

### Frontend Architecture (`frontend/src/`)

#### Component Tree
```
App
├── Background        — Animated cosmic grid + floating orbs (CSS animations)
├── LiveClock         — Updates every second, shows date + time for screenshots
├── CurrencySelector  — Glassmorphism dropdown with flag + preview, cyan/purple accent
├── SwapButton        — Rotates 180° on click, swaps currency1 ↔ currency2
└── RateDisplay       — Animated count-up counter, shows rate + inverse rate
```

#### State Management
- `currency1`, `currency2`: local `useState` in App
- Currencies list: `useQuery` via React Query (cached, stale never)
- Rate fetch: `useMutation` via React Query (on-demand, on submit)

#### Key UX Rules
1. When Currency 1 is selected, it is **removed** from Currency 2's option list
2. If user selects Currency 2 that matches Currency 1, Currency 2 is cleared
3. Submit button is disabled unless both currencies are selected AND different
4. Swap button triggers Framer Motion 180° rotation animation
5. Rate animates up from 0 using a cubic ease-out `requestAnimationFrame` loop
6. Both the forward and inverse rates are displayed simultaneously

---

## Test Case Documentation

### Backend Tests (`backend/tests/test_api.py`)

| ID | Test | Type | Expected |
|----|------|------|---------|
| TC-01 | GET /currency returns 6 entries | Positive | 200, len=6 |
| TC-02 | Response shape matches spec | Positive | countryName, currencyCode, currencyName |
| TC-03 | INR entry correct | Positive | "Indian Rupees", India |
| TC-04 | USD→INR direct rate | Positive | 80.08 |
| TC-05 | INR→USD inverse rate | Positive | ≈0.0125 |
| TC-06 | INR→INR same currency | Positive | 1.0 |
| TC-07 | CAD→AUD cross-rate | Positive | 61.62/56.81 ≈ 1.0847 |
| TC-08 | Lowercase input (usd→inr) | Positive | normalized, 80.08 |
| TC-09 | XYZ→USD invalid from | Negative | HTTP 400, "XYZ" in detail |
| TC-10 | USD→XYZ invalid to | Negative | HTTP 400, "XYZ" in detail |
| TC-11 | FOO→BAR both invalid | Negative | HTTP 400, both codes in detail |

### Frontend Tests (`frontend/src/tests/App.test.tsx`)

| ID | Test | Type | Expected |
|----|------|------|---------|
| TC-UI-01 | Dropdowns render | Positive | Both selects in DOM |
| TC-UI-02 | Currency 1 excluded from Currency 2 | Positive | USD absent from select2 options |
| TC-UI-03a | Button disabled with one selection | Positive | button.disabled = true |
| TC-UI-03b | Button enabled with two selections | Positive | button.disabled = false |
| TC-UI-04 | Rate display shown on success | Positive | rate-display in DOM |
| TC-UI-05 | Error on API failure | Negative | api-error in DOM |
| TC-UI-06 | Swap swaps values | Positive | select1=INR, select2=USD |
| TC-UI-07 | Live clock renders | Positive | live-clock in DOM |

---

## Code Review Guidelines

### Backend
- All inputs normalized to `.upper()` before validation — prevents case-sensitivity bugs
- `ALLOWED_CURRENCIES` is a set for O(1) lookup
- `INSERT OR IGNORE` prevents duplicate key errors on re-seed
- No raw SQL string interpolation — all user input passed as parameterized queries (safe from SQLi)
- FastAPI auto-generates OpenAPI docs at `http://localhost:8000/docs`

### Frontend
- All API calls go through `src/api/currency.ts` — single Axios instance, easy to update base URL
- `mutation.reset()` called on any currency change — clears stale results before new fetch
- `excludeCode` prop on Currency 2 selector ensures sync with Currency 1 state
- All interactive elements have `data-testid` attributes for reliable test selection
- Framer Motion `AnimatePresence` ensures smooth enter/exit for error messages and rate card
