"""
Test suite for Currency Exchange Rate API.
Covers 11 test cases: positive and negative scenarios.

DB isolation is handled by conftest.py (temp SQLite file, session-scoped).
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ─── Positive Tests ──────────────────────────────────────────────────────────

class TestGetCurrencies:
    def test_returns_all_six_currencies(self):
        """TC-01: GET /currency returns exactly 6 entries."""
        resp = client.get("/currency")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 6

    def test_response_shape_matches_spec(self):
        """TC-02: Each currency entry has required fields matching spec."""
        resp = client.get("/currency")
        assert resp.status_code == 200
        data = resp.json()
        assert "USD" in data
        usd = data["USD"]
        assert usd["currencyCode"] == "USD"
        assert usd["currencyName"] == "US Dollars"
        assert usd["countryName"] == "USA"

    def test_inr_entry_present(self):
        """TC-03: INR is present with correct details."""
        resp = client.get("/currency")
        inr = resp.json()["INR"]
        assert inr["currencyCode"] == "INR"
        assert inr["currencyName"] == "Indian Rupees"


class TestDirectExchangeRate:
    def test_usd_to_inr_direct(self):
        """TC-04: USD→INR returns stored rate 80.08."""
        resp = client.get("/exchange-rate/USD/INR")
        assert resp.status_code == 200
        data = resp.json()
        assert data["fromCurrencyCode"] == "USD"
        assert data["toCurrencyCode"] == "INR"
        assert float(data["exchangeRate"]) == pytest.approx(80.08, rel=1e-3)

    def test_inr_to_usd_inverse(self):
        """TC-05: INR→USD returns inverse of stored rate (1/80.08 ≈ 0.01249).
        Uses abs tolerance because API rounds to 4 decimal places."""
        resp = client.get("/exchange-rate/INR/USD")
        assert resp.status_code == 200
        rate = float(resp.json()["exchangeRate"])
        assert rate == pytest.approx(1 / 80.08, abs=1e-3)

    def test_same_currency_returns_one(self):
        """TC-06: INR→INR returns 1.0 (same currency identity)."""
        resp = client.get("/exchange-rate/INR/INR")
        assert resp.status_code == 200
        assert float(resp.json()["exchangeRate"]) == pytest.approx(1.0)

    def test_cross_rate_via_inr_pivot(self):
        """TC-07: CAD→AUD resolved via INR pivot (61.62/56.81 ≈ 1.0847)."""
        resp = client.get("/exchange-rate/CAD/AUD")
        assert resp.status_code == 200
        rate = float(resp.json()["exchangeRate"])
        expected = 61.62 / 56.81
        assert rate == pytest.approx(expected, rel=1e-3)

    def test_case_insensitive_input(self):
        """TC-08: Lowercase currency codes work (usd→inr)."""
        resp = client.get("/exchange-rate/usd/inr")
        assert resp.status_code == 200
        assert float(resp.json()["exchangeRate"]) == pytest.approx(80.08, rel=1e-3)


# ─── Negative Tests ───────────────────────────────────────────────────────────

class TestValidation:
    def test_invalid_from_currency_returns_400(self):
        """TC-09 (negative): Unsupported 'from' currency returns HTTP 400."""
        resp = client.get("/exchange-rate/XYZ/USD")
        assert resp.status_code == 400
        assert "XYZ" in resp.json()["detail"]

    def test_invalid_to_currency_returns_400(self):
        """TC-10 (negative): Unsupported 'to' currency returns HTTP 400."""
        resp = client.get("/exchange-rate/USD/XYZ")
        assert resp.status_code == 400
        assert "XYZ" in resp.json()["detail"]

    def test_both_invalid_currencies_returns_400(self):
        """TC-11 (negative): Both currencies invalid — both codes mentioned in error."""
        resp = client.get("/exchange-rate/FOO/BAR")
        assert resp.status_code == 400
        detail = resp.json()["detail"]
        assert "FOO" in detail
        assert "BAR" in detail
