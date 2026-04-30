# Currency Exchange Rate Monitor

**Challenge**: MLCV-2026-6695 — Claude Code End-to-End Case Study  
**Stack**: Python FastAPI + SQLite (backend) · React + TypeScript + Vite (frontend)

---

## Quick Start

### 1. Backend (API + Database)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The server auto-creates and seeds the SQLite database on first start.  
API docs available at: http://localhost:8000/docs

### 2. Frontend (UI)

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/currency` | List all 6 supported currencies |
| GET | `/exchange-rate/{from}/{to}` | Get exchange rate between two currencies |
| GET | `/health` | Health check |

### Sample Responses

**GET /currency**
```json
{
  "INR": { "countryName": "India", "currencyCode": "INR", "currencyName": "Indian Rupees" },
  "USD": { "countryName": "Usa",   "currencyCode": "USD", "currencyName": "US Dollars" }
}
```

**GET /exchange-rate/USD/INR**
```json
{ "fromCurrencyCode": "USD", "toCurrencyCode": "INR", "exchangeRate": "80.0800" }
```

**GET /exchange-rate/INR/USD** (inverse — computed, not stored)
```json
{ "fromCurrencyCode": "INR", "toCurrencyCode": "USD", "exchangeRate": "0.0125" }
```

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

## Exchange Rate Logic

Rates are resolved using a 4-level cascade:

1. **Same currency** → rate = 1.0
2. **Direct lookup** → e.g. USD→INR = 80.08 (stored)
3. **Inverse lookup** → e.g. INR→USD = 1/80.08 ≈ 0.0125 (computed)
4. **Cross via INR pivot** → e.g. USD→AUD = 80.08/56.81 ≈ 1.41 (computed)

---

## Running Tests

### Backend (11 tests)
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend (8 tests)
```bash
cd frontend
npm test
```

---

## Project Structure

```
Currency/
├── backend/
│   ├── main.py          ← FastAPI app + routes
│   ├── database.py      ← SQLite setup + rate resolver
│   ├── models.py        ← Pydantic models
│   ├── seed.py          ← Standalone seed script
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py  ← 11 pytest test cases
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/  ← Background, CurrencySelector, RateDisplay, SwapButton, LiveClock
│   │   ├── hooks/       ← useExchangeRate (React Query)
│   │   ├── api/         ← Axios client
│   │   ├── types/       ← TypeScript interfaces
│   │   └── tests/       ← 8 Vitest test cases
│   └── package.json
├── docs/
│   ├── CLAUDE.md        ← Custom instructions (required by challenge)
│   ├── prompts.txt      ← All Claude commands/prompts used
│   └── database/
│       ├── create_tables.sql
│       └── seed_data.sql
└── README.md
```

---

## Design

**"Cosmic Finance"** futuristic theme:
- Deep space dark background with animated CSS grid + floating blur orbs
- Glassmorphism cards (backdrop-filter blur, neon borders)
- Electric cyan `#00d4ff` + purple `#a855f7` accent palette
- Framer Motion animations: mount/unmount, swap rotation, rate count-up
- Live clock timestamp (visible in screenshots as required)
- Country flag emojis with currency names

---

## Framework Rationale

**Why FastAPI?** Self-contained, fast to develop, auto-generates OpenAPI docs, runs without external DB server. SQLite is perfect for this use case — no setup, single file, fully portable.

**Why React + Vite + TypeScript?** Modern, type-safe, HMR for fast dev cycle. Framer Motion is the gold standard for React animations. Tailwind CSS enables rapid futuristic styling.

**Why this architecture?** The rate resolver algorithm is the key insight — instead of storing 30 rate pairs, we store 6 and compute the rest using direct/inverse/pivot logic. This mirrors how real FX systems work (using a base currency as a reference).
