-- Currency Exchange Rate Monitor
-- Database: SQLite
-- Table Creation Script

CREATE TABLE IF NOT EXISTS currency (
    id            INTEGER PRIMARY KEY,
    currency_code TEXT    UNIQUE NOT NULL,
    currency_name TEXT    NOT NULL,
    country_name  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS currency_rate (
    currency_code_from TEXT NOT NULL,
    currency_code_to   TEXT NOT NULL,
    exchange_rate      REAL NOT NULL,
    PRIMARY KEY (currency_code_from, currency_code_to)
);
