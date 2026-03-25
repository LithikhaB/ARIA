"""
ARIA Track B — SNVR Scorer

Saturation · Novelty · Velocity · Relevance (sentiment)

Input:  list[CompetitorSnapshot]  (all competitors in one batch)
Output: list[SNVRScore]            (one score per unique theme, ranked by opportunity)

All math — no LLM on the critical path.
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from models import CompetitorSnapshot, SNVRScore

_vader = SentimentIntensityAnalyzer()

# Scoring weights (must sum to 1.0)
W_NOVELTY    = 0.40
W_VELOCITY   = 0.30
W_SENTIMENT  = 0.30


# ─────────────────────────────────────────────────────────────────────────────
# Individual score functions
# ─────────────────────────────────────────────────────────────────────────────

def _saturation(theme: str, snapshots: list[CompetitorSnapshot]) -> float:
    """
    Fraction of competitors whose themes list includes this theme.
    0 = nobody talking about it (white space), 1 = everyone is (saturated).
    """
    n_competitors = len({s.competitor_name for s in snapshots})
    if n_competitors == 0:
        return 0.0
    n_with_theme = len({s.competitor_name for s in snapshots if theme in s.themes})
    return round(n_with_theme / n_competitors, 4)


def _novelty(saturation: float) -> float:
    """
    Sigmoid-amplified inverse of saturation.
    Rare themes (used by <20% of competitors) score close to 1.0.
    """
    raw = 1.0 - saturation
    return round(1 / (1 + math.exp(-10 * (raw - 0.7))), 4)


def _velocity(theme: str, snapshots: list[CompetitorSnapshot], window_days: int = 7) -> float:
    """
    Claim frequency in the last `window_days` vs the prior equal window.
    Returns 0–1 (0.5 = neutral/stable, >0.6 = rising, <0.4 = declining).
    """
    now = datetime.now(timezone.utc)
    recent_cutoff = now - timedelta(days=window_days)
    prev_cutoff   = now - timedelta(days=window_days * 2)

    recent_count = 0
    prev_count   = 0

    for snap in snapshots:
        if theme not in snap.themes:
            continue
        try:
            ts = datetime.fromisoformat(snap.snapshot_ts.replace("Z", "+00:00"))
        except Exception:
            continue
        if ts >= recent_cutoff:
            recent_count += 1
        elif ts >= prev_cutoff:
            prev_count += 1

    if recent_count == 0 and prev_count == 0:
        return 0.5  # no data → neutral

    if prev_count == 0:
        return 1.0  # brand new theme

    raw = (recent_count - prev_count) / max(prev_count, 1)
    clamped = max(-1.0, min(1.0, raw))
    return round((clamped + 1) / 2, 4)  # shift [-1,1] → [0,1]


def _sentiment(theme: str, snapshots: list[CompetitorSnapshot]) -> float:
    """
    Average VADER compound sentiment across all claims + social proof
    that belong to snapshots containing this theme.
    Returns 0–1 (0.5 = neutral, >0.5 = positive, <0.5 = negative).
    """
    texts = []
    for snap in snapshots:
        if theme not in snap.themes:
            continue
        texts.extend(snap.key_claims)
        texts.extend(snap.social_proof)
        texts.extend(snap.feature_claims[:5])

    if not texts:
        return 0.5

    scores = [_vader.polarity_scores(t)["compound"] for t in texts[:50]]
    avg = sum(scores) / len(scores)
    return round((avg + 1) / 2, 4)  # shift [-1,1] → [0,1]


def _opportunity(novelty: float, velocity: float, sentiment: float) -> float:
    raw = novelty * W_NOVELTY + velocity * W_VELOCITY + sentiment * W_SENTIMENT
    return round(min(1.0, max(0.0, raw)), 4)


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def score(snapshots: list[CompetitorSnapshot]) -> list[SNVRScore]:
    """
    Compute SNVR scores for every unique theme across all competitor snapshots.

    Args:
        snapshots: list of CompetitorSnapshot objects (all competitors in one batch)

    Returns:
        list of SNVRScore, sorted by opportunity score descending
    """
    if not snapshots:
        return []

    # Collect all unique themes
    all_themes: set[str] = set()
    for snap in snapshots:
        all_themes.update(snap.themes)

    results = []
    for theme in all_themes:
        sat  = _saturation(theme, snapshots)
        nov  = _novelty(sat)
        vel  = _velocity(theme, snapshots)
        sent = _sentiment(theme, snapshots)
        opp  = _opportunity(nov, vel, sent)

        claim_count    = sum(len(s.key_claims) for s in snapshots if theme in s.themes)
        competitor_count = len({s.competitor_name for s in snapshots if theme in s.themes})

        results.append(SNVRScore(
            theme=theme,
            saturation=sat,
            novelty=nov,
            velocity=vel,
            sentiment=sent,
            opportunity=opp,
            competitor_count=competitor_count,
            claim_count=claim_count,
            rising=vel > 0.6,
        ))

    # Rank by opportunity score descending
    results.sort(key=lambda x: x.opportunity, reverse=True)
    print(f"[Scorer] Scored {len(results)} themes from {len(snapshots)} snapshots")
    return results


if __name__ == "__main__":
    # Quick smoke test with dummy data
    from models import CompetitorSnapshot
    dummy = [
        CompetitorSnapshot(
            competitor_name="TestCo",
            page_url="https://testco.com",
            snapshot_ts="2026-03-25T12:00:00+00:00",
            themes=["ai-powered", "automation"],
            key_claims=["We save you 10 hours a week", "AI that actually works"],
        )
    ]
    for s in score(dummy):
        print(s.model_dump_json(indent=2))
