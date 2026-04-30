"""
conftest.py — shared pytest fixtures for API tests.

Patches database.DB_PATH to a temp file before any module import so tests
never touch the real currency.db, and cleans up after the session.
"""
import os
import tempfile
import pytest

# ── Redirect the DB before the app modules are loaded ────────────────────────
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()

import database  # noqa: E402  (imported after patch so the path is set once)
database.DB_PATH = type(database.DB_PATH)(_tmp.name)


@pytest.fixture(autouse=True, scope="session")
def initialise_test_db():
    """Create schema and seed data once for the whole test session."""
    database.init_db()
    database.seed_db()
    yield
    # Teardown: remove temp DB file
    try:
        os.unlink(_tmp.name)
    except OSError:
        pass
