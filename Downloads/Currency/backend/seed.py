"""Standalone seed script — run once to populate the database."""
from database import init_db, seed_db

if __name__ == "__main__":
    init_db()
    seed_db()
    print("Database initialized and seeded successfully.")
    print("Tables: currency (6 rows), currency_rate (6 rows)")
