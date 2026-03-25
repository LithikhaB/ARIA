"""
bridge.py — Connects Track A (snapshot.py / aria.db) to Track B (extractor.py).

For each competitor + page_type in the DB, pulls the latest raw_html snapshot
and runs Track B's extraction pipeline, returning a list of CompetitorSnapshot objects.
"""

import sqlite3
from datetime import datetime, timezone
from extractor import extract          # Track B
from models import CompetitorSnapshot  # Track B Pydantic schema

DB_PATH = "aria.db"

# Map page_type → representative URL template (fill with real URLs or store in DB)
# Track B's extractor needs a page_url string — Track A only stores page_type.
# Option 1: maintain a lookup dict here.
# Option 2 (recommended): add a `page_url` column to Track A's snapshots table (see below).
PAGE_URL_MAP: dict[tuple[str, str], str] = {
    # ("CompetitorName", "page_type"): "https://..."
    # Populate this or use the DB approach below.
}


def get_latest_snapshots() -> list[dict]:
    """Pull the most recent raw_html for every competitor × page_type pair."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT competitor_name, page_type, raw_html, crawl_timestamp,
               COALESCE(page_url, '') as page_url
        FROM snapshots
        WHERE id IN (
            SELECT MAX(id)
            FROM snapshots
            GROUP BY competitor_name, page_type
        )
    """)
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "competitor_name": row[0],
            "page_type":       row[1],
            "raw_html":        row[2],
            "crawl_timestamp": row[3],
            "page_url":        row[4],
        }
        for row in rows
    ]


def _normalise_timestamp(ts: str) -> str:
    """
    Track A stores timestamps without timezone (datetime.now().isoformat()).
    Track B's CompetitorSnapshot validator requires valid ISO 8601.
    We append +00:00 if no tz info is present.
    """
    if "+" not in ts and not ts.endswith("Z"):
        return ts + "+00:00"
    return ts


def run_bridge() -> list[CompetitorSnapshot]:
    snapshots = get_latest_snapshots()
    results = []

    for snap in snapshots:
        competitor = snap["competitor_name"]
        page_type  = snap["page_type"]
        raw_html   = snap["raw_html"]
        ts         = _normalise_timestamp(snap["crawl_timestamp"])

        # Resolve URL — prefer stored page_url, then fall back to map, then placeholder
        page_url = (
            snap.get("page_url")
            or PAGE_URL_MAP.get((competitor, page_type))
            or f"https://unknown/{competitor}/{page_type}"
        )

        print(f"[bridge] Extracting {competitor} / {page_type}...")
        try:
            cs = extract(
                raw_html=raw_html,
                competitor_name=competitor,
                page_url=page_url,
                snapshot_ts=ts,
            )
            results.append(cs)
        except Exception as e:
            print(f"[bridge] ERROR for {competitor}/{page_type}: {e}")

    return results


if __name__ == "__main__":
    snapshots = run_bridge()
    for s in snapshots:
        print(s.model_dump_json(indent=2))
