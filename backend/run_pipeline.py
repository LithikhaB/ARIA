"""
run_pipeline.py — ARIA Full Pipeline Runner

Steps:
  1. Crawl competitor pages  (crawler.py)
  2. Save snapshots          (snapshot.py → aria.db)
  3. Bridge to Track B       (bridge.py → extractor.py)
  4. Score themes            (snvr_scorer.py)
  5. Run adversarial guard   (adversarial_guard.py)
  6. Print ranked report

Usage:
    python run_pipeline.py

Add/edit competitors in the COMPETITORS list below.
"""

import asyncio
import json

from crawler import crawl_competitors
from snapshot import init_db, save_snapshot
from bridge import run_bridge
from snvr_scorer import score
from adversarial_guard import guard

# ─────────────────────────────────────────────────────────────────────────────
# ✏️  EDIT THIS LIST — add your target competitors
# ─────────────────────────────────────────────────────────────────────────────
COMPETITORS = [
    {
        "name":    "Notion",
        "landing": "https://www.notion.so",
        "pricing": "https://www.notion.so/pricing",
        "g2":      "https://www.g2.com/products/notion/reviews",
    },
    {
        "name":    "Linear",
        "landing": "https://linear.app",
        "pricing": "https://linear.app/pricing",
        "g2":      "https://www.g2.com/products/linear/reviews",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    print("\n" + "="*60)
    print("  ARIA — Full Intelligence Pipeline")
    print("="*60)

    # Step 1 — Initialise DB
    print("\n[1/5] Initialising database...")
    init_db()

    # Step 2 — Crawl
    print(f"\n[2/5] Crawling {len(COMPETITORS)} competitor(s)...")
    crawl_results = await crawl_competitors(COMPETITORS)

    # Step 3 — Save snapshots
    print("\n[3/5] Saving snapshots to aria.db...")
    saved = 0
    for result in crawl_results:
        name = result["name"]
        for page_type in ["landing", "pricing", "g2"]:
            html = result.get(f"{page_type}_html", "")
            url  = result.get(f"{page_type}_url",  "")
            if html:
                save_snapshot(name, page_type, html, page_url=url)
                saved += 1
    print(f"  ✓ {saved} snapshot(s) saved")

    # Step 4 — Extract signals via bridge
    print("\n[4/5] Extracting competitive signals (Track B)...")
    snapshots = run_bridge()
    print(f"  ✓ {len(snapshots)} snapshot(s) extracted")

    if not snapshots:
        print("\n⚠️  No snapshots to score. Check that crawls succeeded.")
        return

    # Step 5 — Score
    print("\n[5/5] Scoring themes & running adversarial guard...")
    scores = score(snapshots)
    flags  = guard(snapshots, scores)

    # ── Report ────────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("  📊  SNVR OPPORTUNITY SCORES  (top 10)")
    print("="*60)
    for s in scores[:10]:
        bar = "█" * int(s.opportunity * 20)
        tag = " 🚀 RISING" if s.rising else ""
        print(f"  {s.theme:<20} {bar:<20} {s.opportunity*100:5.1f}%{tag}")
        print(f"    novelty={s.novelty:.2f}  velocity={s.velocity:.2f}  "
              f"sentiment={s.sentiment:.2f}  saturation={s.saturation:.2f}  "
              f"competitors={s.competitor_count}")

    print("\n" + "="*60)
    print("  🚨  ADVERSARIAL FLAGS")
    print("="*60)
    if not flags:
        print("  No flags raised.")
    for f in flags:
        icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(f.severity, "⚪")
        print(f"\n  {icon} {f.severity} [{f.flag_type}] — {f.theme}")
        print(f"     Competitor:  {f.competitor}")
        print(f"     Evidence:    {f.evidence[:120]}")
        print(f"     Action:      {f.recommendation[:120]}")

    print("\n" + "="*60)
    print("  ✅  Pipeline complete")
    print(f"     Snapshots:  {len(snapshots)}")
    print(f"     Themes:     {len(scores)}")
    print(f"     Flags:      {len(flags)}")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
