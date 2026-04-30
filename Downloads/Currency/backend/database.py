import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "currency.db"

ALLOWED_CURRENCIES = {"INR", "USD", "CAD", "EUR", "AUD", "AED"}

SEED_CURRENCIES = [
    (1, "INR", "Indian Rupees", "INDIA"),
    (2, "USD", "US Dollars", "USA"),
    (3, "CAD", "Canadian Dollars", "CANADA"),
    (4, "EUR", "European Dollars", "EUROPE"),
    (5, "AUD", "Australian Dollars", "AUSTRALIA"),
    (6, "AED", "UAE Dirham", "UAE"),
]

SEED_RATES = [
    ("USD", "INR", 80.08),
    ("CAD", "INR", 61.62),
    ("USD", "CAD", 1.36),
    ("EUR", "INR", 93.14),
    ("AUD", "INR", 56.81),
    ("AED", "INR", 22.79),
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS currency (
                id INTEGER PRIMARY KEY,
                currency_code TEXT UNIQUE NOT NULL,
                currency_name TEXT NOT NULL,
                country_name TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS currency_rate (
                currency_code_from TEXT NOT NULL,
                currency_code_to TEXT NOT NULL,
                exchange_rate REAL NOT NULL,
                PRIMARY KEY (currency_code_from, currency_code_to)
            )
        """)
        conn.commit()


def seed_db() -> None:
    with get_connection() as conn:
        conn.executemany(
            "INSERT OR IGNORE INTO currency (id, currency_code, currency_name, country_name) VALUES (?,?,?,?)",
            SEED_CURRENCIES,
        )
        conn.executemany(
            "INSERT OR IGNORE INTO currency_rate (currency_code_from, currency_code_to, exchange_rate) VALUES (?,?,?)",
            SEED_RATES,
        )
        conn.commit()


def resolve_rate(from_cur: str, to_cur: str) -> float | None:
    """
    Resolve exchange rate using a 4-level cascade:
    1. Same currency → 1.0
    2. Direct DB lookup
    3. Inverse of stored rate
    4. Cross-rate via INR pivot
    """
    from_cur = from_cur.upper()
    to_cur = to_cur.upper()

    if from_cur == to_cur:
        return 1.0

    with get_connection() as conn:
        def lookup(a: str, b: str) -> float | None:
            row = conn.execute(
                "SELECT exchange_rate FROM currency_rate WHERE currency_code_from=? AND currency_code_to=?",
                (a, b),
            ).fetchone()
            return row["exchange_rate"] if row else None

        # Direct
        rate = lookup(from_cur, to_cur)
        if rate is not None:
            return rate

        # Inverse
        rate = lookup(to_cur, from_cur)
        if rate is not None:
            return 1.0 / rate

        # Cross via INR pivot: from→INR / to→INR
        def rate_to_inr(code: str) -> float | None:
            r = lookup(code, "INR")
            if r is not None:
                return r
            r = lookup("INR", code)
            if r is not None:
                return 1.0 / r
            return None

        from_inr = rate_to_inr(from_cur)
        to_inr = rate_to_inr(to_cur)
        if from_inr is not None and to_inr is not None:
            return from_inr / to_inr

        # Cross via USD pivot
        def rate_to_usd(code: str) -> float | None:
            r = lookup(code, "USD")
            if r is not None:
                return r
            r = lookup("USD", code)
            if r is not None:
                return 1.0 / r
            return None

        from_usd = rate_to_usd(from_cur)
        to_usd = rate_to_usd(to_cur)
        if from_usd is not None and to_usd is not None:
            return from_usd / to_usd

    return None
