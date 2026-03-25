"""
snvr_scorer.py — Dev B / ARIA
Implements the SNVR composite scoring formula.

Score (0–100) = weighted sum of:
  Novelty          0.20
  Velocity         0.20
  Saturation_inv   0.20   (1 − Saturation, so low-saturation themes score higher)
  Reliability      0.25
  StrategyShift    0.15

All component scores are normalised to [0, 1] before weighting.
Final score is scaled to 0–100.

Inputs:  list[CompetitorSnapshot]  (from extractor.py)
Outputs: list[SNVRScore]           (one per unique theme/feature)
"""

from __future__ import annotations

import math
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Optional

from models import CompetitorSnapshot


# ── Weights ───────────────────────────────────────────────────────────────────

WEIGHTS = {
    "novelty": 0.20,
    "velocity": 0.20,
    "saturation_inv": 0.20,
    "reliability": 0.25,
    "strategy_shift": 0.15,
}

assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, "Weights must sum to 1.0"


# ── Output dataclass ──────────────────────────────────────────────────────────

@dataclass
class SNVRScore:
    theme: str

    # Raw component scores [0, 1]
    novelty: float = 0.0
    velocity: float = 0.0
    saturation_inv: float = 0.0
    reliability: float = 0.0
    strategy_shift: float = 0.0

    # Weighted composite [0–100]
    score: float = 0.0

    # Metadata for provenance
    competitor_count: int = 0       # how many competitors mention this theme
    total_competitors: int = 0
    recent_freq: int = 0            # frequency in "current" window
    prior_freq: int = 0             # frequency in "prior" window
    sentiment_avg: float = 0.0      # average VADER compound score for this theme

    def saturation(self) -> float:
        if self.total_competitors == 0:
            return 0.0
        return self.competitor_count / self.total_competitors

    def to_dict(self) -> dict:
        return {
            "theme": self.theme,
            "score": round(self.score, 2),
            "novelty": round(self.novelty, 4),
            "velocity": round(self.velocity, 4),
            "saturation_inv": round(self.saturation_inv, 4),
            "reliability": round(self.reliability, 4),
            "strategy_shift": round(self.strategy_shift, 4),
            "saturation": round(self.saturation(), 4),
            "competitor_count": self.competitor_count,
            "total_competitors": self.total_competitors,
            "recent_freq": self.recent_freq,
            "prior_freq": self.prior_freq,
            "sentiment_avg": round(self.sentiment_avg, 4),
        }


# ── Component calculators ─────────────────────────────────────────────────────

def _calc_novelty(theme_freq: int, max_freq: int) -> float:
    """
    Novelty = 1 − (theme_freq / max_freq)
    Rare themes score close to 1; ubiquitous themes score close to 0.
    """
    if max_freq == 0:
        return 1.0
    return max(0.0, 1.0 - (theme_freq / max_freq))


def _calc_velocity(recent: int, prior: int) -> float:
    """
    Raw velocity = (recent − prior) / prior  →  can be negative or >1.
    Normalise to [0, 1] using sigmoid so the scorer is bounded.
    Velocity = sigmoid(raw_velocity)
      - prior=0, recent>0  →  treat as infinite growth → 1.0
      - declining themes   →  <0.5
      - no change          →  0.5
      - growing            →  >0.5
    """
    if prior == 0:
        return 1.0 if recent > 0 else 0.5
    raw = (recent - prior) / prior
    # sigmoid centred at 0
    return 1.0 / (1.0 + math.exp(-raw))


def _calc_saturation_inv(competitor_count: int, total_competitors: int) -> float:
    """Saturation_inv = 1 − (competitor_count / total_competitors)"""
    if total_competitors == 0:
        return 1.0
    return max(0.0, 1.0 - (competitor_count / total_competitors))


def _calc_reliability(sentiments: list[float]) -> float:
    """
    Reliability = normalised average sentiment score.
    VADER compound is [−1, +1]; we map to [0, 1].
    If no sentiment data, default to neutral 0.5.
    """
    if not sentiments:
        return 0.5
    avg = sum(sentiments) / len(sentiments)
    return (avg + 1.0) / 2.0  # maps [−1,1] → [0,1]


def _calc_strategy_shift(
    tone_before: Optional[str],
    tone_after: Optional[str],
    proof_before: Optional[str],
    proof_after: Optional[str],
) -> float:
    """
    StrategyShift = fraction of strategic attributes that changed.
    Compares tone and proof_type between the two most recent snapshots.
    Returns 0 (no change) to 1 (everything changed).
    """
    attributes = [
        (tone_before, tone_after),
        (proof_before, proof_after),
    ]
    # Only score pairs where we have both values
    valid = [(a, b) for a, b in attributes if a is not None and b is not None]
    if not valid:
        return 0.0
    changed = sum(1 for a, b in valid if a != b)
    return changed / len(valid)


# ── Main scorer ───────────────────────────────────────────────────────────────

class SNVRScorer:
    """
    Scores all unique themes/features across a set of competitor snapshots.

    Usage:
        scorer = SNVRScorer(snapshots, sentiment_map)
        scores = scorer.score_all()
    """

    def __init__(
        self,
        snapshots: list[CompetitorSnapshot],
        sentiment_map: Optional[dict[str, list[float]]] = None,
        recent_snapshots: Optional[list[CompetitorSnapshot]] = None,
        prior_snapshots: Optional[list[CompetitorSnapshot]] = None,
    ):
        """
        Args:
            snapshots:         Full list of CompetitorSnapshot objects (current run).
            sentiment_map:     {theme: [vader_compound_scores]}  (from adversarial_guard or
                               external sentiment pass). If None, reliability defaults to 0.5.
            recent_snapshots:  Snapshots from the current time window (for velocity numerator).
                               Defaults to `snapshots` if not provided.
            prior_snapshots:   Snapshots from the previous time window (velocity denominator).
                               Defaults to empty list (treats everything as new).
        """
        self.snapshots = snapshots
        self.sentiment_map: dict[str, list[float]] = sentiment_map or {}
        self.recent_snapshots = recent_snapshots if recent_snapshots is not None else snapshots
        self.prior_snapshots = prior_snapshots or []
        self.total_competitors = len({s.competitor_name for s in snapshots})

    # ── Frequency helpers ─────────────────────────────────────────────────────

    def _theme_competitor_count(self, theme: str, snaps: list[CompetitorSnapshot]) -> int:
        """How many distinct competitors mention this theme?"""
        return len({
            s.competitor_name for s in snaps
            if theme in s.features
               or theme.lower() in s.headline.lower()
               or theme.lower() in s.fear_addressed.lower()
        })

    def _theme_total_freq(self, theme: str, snaps: list[CompetitorSnapshot]) -> int:
        """Total mention count across all snapshots (not deduplicated by competitor)."""
        count = 0
        for s in snaps:
            if theme in s.features:
                count += 1
            if theme.lower() in s.headline.lower():
                count += 1
            if theme.lower() in s.fear_addressed.lower():
                count += 1
        return count

    def _all_themes(self) -> list[str]:
        """Collect every unique theme from features across all snapshots."""
        themes: set[str] = set()
        for snap in self.snapshots:
            themes.update(snap.features)
        return sorted(themes)

    # ── Strategy shift helper ─────────────────────────────────────────────────

    def _strategy_shift_for_competitor(self, competitor: str) -> float:
        """
        Compare most recent prior snapshot vs most recent current snapshot
        for a given competitor to detect strategic shifts.
        """
        current = [s for s in self.recent_snapshots if s.competitor_name == competitor]
        prior = [s for s in self.prior_snapshots if s.competitor_name == competitor]
        if not current or not prior:
            return 0.0

        # Use the most recent of each window
        c = sorted(current, key=lambda s: s.snapshot_ts)[-1]
        p = sorted(prior, key=lambda s: s.snapshot_ts)[-1]

        return _calc_strategy_shift(p.tone, c.tone, p.proof_type, c.proof_type)

    # ── Core scoring ──────────────────────────────────────────────────────────

    def score_theme(self, theme: str) -> SNVRScore:
        result = SNVRScore(theme=theme, total_competitors=self.total_competitors)

        # --- Saturation / novelty ---
        result.competitor_count = self._theme_competitor_count(theme, self.snapshots)
        recent_freq = self._theme_total_freq(theme, self.recent_snapshots)
        prior_freq = self._theme_total_freq(theme, self.prior_snapshots)
        result.recent_freq = recent_freq
        result.prior_freq = prior_freq

        # Find max frequency across ALL themes (for novelty denominator)
        # (computed once in score_all; here we use a lazy local pass if called standalone)
        all_themes = self._all_themes()
        max_freq = max(
            (self._theme_total_freq(t, self.recent_snapshots) for t in all_themes),
            default=1,
        )

        result.novelty = _calc_novelty(recent_freq, max_freq)
        result.velocity = _calc_velocity(recent_freq, prior_freq)
        result.saturation_inv = _calc_saturation_inv(
            result.competitor_count, self.total_competitors
        )

        # --- Reliability (sentiment) ---
        sentiments = self.sentiment_map.get(theme, [])
        result.sentiment_avg = sum(sentiments) / len(sentiments) if sentiments else 0.0
        result.reliability = _calc_reliability(sentiments)

        # --- Strategy shift (average across competitors mentioning this theme) ---
        competitors_with_theme = {
            s.competitor_name for s in self.snapshots if theme in s.features
        }
        if competitors_with_theme:
            shifts = [self._strategy_shift_for_competitor(c) for c in competitors_with_theme]
            result.strategy_shift = sum(shifts) / len(shifts)
        else:
            result.strategy_shift = 0.0

        # --- Composite score (0–100) ---
        raw = (
            WEIGHTS["novelty"]        * result.novelty
            + WEIGHTS["velocity"]     * result.velocity
            + WEIGHTS["saturation_inv"] * result.saturation_inv
            + WEIGHTS["reliability"]  * result.reliability
            + WEIGHTS["strategy_shift"] * result.strategy_shift
        )
        result.score = round(raw * 100, 2)
        return result

    def score_all(self) -> list[SNVRScore]:
        """Score every theme and return sorted list (highest score first)."""
        themes = self._all_themes()
        if not themes:
            return []

        # Pre-compute max frequency once for efficiency
        max_freq = max(
            (self._theme_total_freq(t, self.recent_snapshots) for t in themes),
            default=1,
        )

        scores = []
        for theme in themes:
            s = self.score_theme(theme)
            # Patch novelty with global max_freq (score_theme may re-compute locally)
            recent_freq = self._theme_total_freq(theme, self.recent_snapshots)
            s.novelty = _calc_novelty(recent_freq, max_freq)
            # Recompute final score with corrected novelty
            raw = (
                WEIGHTS["novelty"]          * s.novelty
                + WEIGHTS["velocity"]       * s.velocity
                + WEIGHTS["saturation_inv"] * s.saturation_inv
                + WEIGHTS["reliability"]    * s.reliability
                + WEIGHTS["strategy_shift"] * s.strategy_shift
            )
            s.score = round(raw * 100, 2)
            scores.append(s)

        return sorted(scores, key=lambda x: x.score, reverse=True)


# ── Convenience function ──────────────────────────────────────────────────────

def compute_snvr(
    snapshots: list[CompetitorSnapshot],
    sentiment_map: Optional[dict[str, list[float]]] = None,
    recent_snapshots: Optional[list[CompetitorSnapshot]] = None,
    prior_snapshots: Optional[list[CompetitorSnapshot]] = None,
) -> list[SNVRScore]:
    """One-liner entry point."""
    return SNVRScorer(snapshots, sentiment_map, recent_snapshots, prior_snapshots).score_all()


# ── CLI smoke test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from models import CompetitorSnapshot

    def _snap(name, features, tone="professional", proof="none"):
        return CompetitorSnapshot(
            competitor_name=name,
            page_url=f"https://{name.lower()}.com",
            snapshot_ts="2026-03-25T10:00:00+00:00",
            headline=f"{name} headline",
            features=features,
            tone=tone,
            proof_type=proof,
        )

    current_snaps = [
        _snap("Notion",  ["AI-powered", "Offline mode", "Templates"]),
        _snap("Linear",  ["AI-powered", "Sprint planning", "GitHub integration"]),
        _snap("Asana",   ["AI-powered", "Workload view", "Templates"]),
        _snap("ClickUp", ["AI-powered", "Offline mode", "Dashboards"]),
    ]

    prior_snaps = [
        _snap("Notion",  ["AI-powered", "Templates"]),
        _snap("Linear",  ["AI-powered", "Sprint planning"]),
    ]

    sentiment = {
        "Offline mode": [0.71, 0.65, 0.80],
        "AI-powered":   [0.30, 0.25, 0.40],
        "Templates":    [0.50, 0.45],
    }

    scores = compute_snvr(current_snaps, sentiment, current_snaps, prior_snaps)

    print(f"\n{'Theme':<25} {'Score':>6}  {'Nov':>5} {'Vel':>5} {'Sat⁻':>5} {'Rel':>5} {'Shft':>5}")
    print("─" * 65)
    for s in scores:
        print(
            f"{s.theme:<25} {s.score:>6.1f}  "
            f"{s.novelty:>5.2f} {s.velocity:>5.2f} {s.saturation_inv:>5.2f} "
            f"{s.reliability:>5.2f} {s.strategy_shift:>5.2f}"
        )
