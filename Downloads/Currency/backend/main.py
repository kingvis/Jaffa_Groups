from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware

from database import (
    ALLOWED_CURRENCIES,
    get_connection,
    init_db,
    resolve_rate,
    seed_db,
)
from models import CurrencyInfo, ExchangeRateResponse

# Abbreviations that must remain fully uppercase (not title-cased)
_UPPERCASE_COUNTRIES = {"USA", "UAE", "UK", "EU"}


def _format_country(name: str) -> str:
    """Format stored country name for display, preserving known abbreviations."""
    upper = name.upper()
    if upper in _UPPERCASE_COUNTRIES:
        return upper
    return name.title()


def _format_rate(rate: float) -> str:
    """Format exchange rate removing trailing zeros, matching spec format."""
    formatted = f"{rate:.10f}".rstrip("0").rstrip(".")
    # Ensure at least 2 decimal places for readability
    if "." not in formatted:
        formatted += ".00"
    elif len(formatted.split(".")[1]) < 2:
        formatted += "0" * (2 - len(formatted.split(".")[1]))
    return formatted


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_db()
    yield


app = FastAPI(
    title="Currency Exchange Rate API",
    description="Currency Exchange Rate Monitor — MLCV-2026-6695",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev — restrict to specific origins in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/currency", response_model=dict[str, CurrencyInfo], summary="List all currencies")
def get_currencies():
    """Returns all supported currencies keyed by currency code."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT currency_code, currency_name, country_name FROM currency ORDER BY currency_code"
        ).fetchall()

    return {
        row["currency_code"]: CurrencyInfo(
            countryName=_format_country(row["country_name"]),
            currencyCode=row["currency_code"],
            currencyName=row["currency_name"],
        )
        for row in rows
    }


@app.get(
    "/exchange-rate/{fromCur}/{toCur}",
    response_model=ExchangeRateResponse,
    summary="Get exchange rate between two currencies",
)
def get_exchange_rate(
    fromCur: str = Path(..., description="Source currency code"),
    toCur: str = Path(..., description="Target currency code"),
):
    """
    Returns the exchange rate between two currencies.
    Supports direct, inverse, and cross-currency (via INR pivot) calculations.
    """
    from_code = fromCur.upper()
    to_code = toCur.upper()

    invalid = []
    if from_code not in ALLOWED_CURRENCIES:
        invalid.append(from_code)
    if to_code not in ALLOWED_CURRENCIES:
        invalid.append(to_code)

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported currency code(s): {', '.join(invalid)}. "
            f"Allowed currencies: {', '.join(sorted(ALLOWED_CURRENCIES))}",
        )

    rate = resolve_rate(from_code, to_code)

    if rate is None:
        raise HTTPException(
            status_code=404,
            detail=f"Exchange rate not available for {from_code} → {to_code}",
        )

    formatted = _format_rate(rate)

    return ExchangeRateResponse(
        fromCurrencyCode=from_code,
        toCurrencyCode=to_code,
        exchangeRate=formatted,
    )


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}
