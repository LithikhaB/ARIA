"""
adversarial_guard.py — Dev B / ARIA
Detects misleading or adversarial competitor signals.

Three checks:
  1. ToneSentiment Mismatch
     Compare the claimed page tone (from extractor) against the actual VADER
     sentiment of customer reviews. A "casual/friendly" page with −0.4 review
     sentiment is a red flag — and your attack vector.

  2. Velocity Spike Detection
     If a theme's frequency suddenly spikes > 3 std deviations above its
     rolling mean, flag it. Could be a coordinated PR push or astroturfing.

  3. Phrasing Similarity Guard
     If a competitor's new headline/feature text is cosine-similar > 0.85 to
     your own (or to a reference copy), flag potential copycat behaviour.

Outputs: list[GuardFlag] — each flag has a type, severity, evidence, and
         a recommended action for the scoring layer.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field
from typing import Literal, Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from models import CompetitorSnapshot

# ── Constants ─────────────────────────────────────────────────────────────────

VELOCITY_SPIKE_THRESHOLD = 3.0          # std deviations
COSINE_SIMILARITY_THRESHOLD = 0.85
TONE_SENTIMENT_MISMATCH_DELTA = 0.35    # absolute gap triggers flag

SEVERITY = Literal["low", "medium", "high"]

# Tone → expected sentiment polarity (rough prior)
TONE_SENTIMENT_PRIOR: dict[str, float] = {
    "professional":   0.10,
    "casual":         0.20,
    "aggressive":    -0.10,
    "inspirational":  0.40,
    "technical":      0.05,
}

_vader = SentimentIntensityAnalyzer()


# ── Output dataclass ──────────────────────────────────────────────────────────

@dataclass
class GuardFlag:
    flag_type: Literal["tone_mismatch", "velocity_spike", "phrasing_similarity"]
    competitor: str
    theme_or_text: str
    severity: str               # "low" | "medium" | "high"
    evidence: str               # human-readable explanation
    recommended_action: str     # what ARIA should do with this

    def to_dict(self) -> dict:
        return {
            "flag_type": self.flag_type,
            "competitor": self.competitor,
            "theme_or_text": self.theme_or_text,
            "severity": self.severity,
            "evidence": self.evidence,
            "recommended_action": self.recommended_action,
        }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _vader_score(text: str) -> float:
    """Return VADER compound score [−1, +1] for a text string."""
    return _vader.polarity_scores(text)["compound"]


def _bag_of_words_vector(text: str) -> dict[str, int]:
    """Simple BoW tokeniser — lowercase, alpha only."""
    tokens = [w.lower() for w in text.split() if w.isalpha()]
    vec: dict[str, int] = {}
    for t in tokens:
        vec[t] = vec.get(t, 0) + 1
    return vec


def _cosine_similarity(a: str, b: str) -> float:
    """
    Cosine similarity between two texts using BoW vectors.
    Fast, dependency-free, good enough for flag detection.
    Returns value in [0, 1].
    """
    va = _bag_of_words_vector(a)
    vb = _bag_of_words_vector(b)
    if not va or not vb:
        return 0.0

    all_terms = set(va) | set(vb)
    dot = sum(va.get(t, 0) * vb.get(t, 0) for t in all_terms)
    mag_a = math.sqrt(sum(v * v for v in va.values()))
    mag_b = math.sqrt(sum(v * v for v in vb.values()))

    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _severity_from_delta(delta: float, low=0.35, high=0.55) -> str:
    if delta >= high:
        return "high"
    if delta >= low:
        return "medium"
    return "low"


# ── Check 1 — Tone–Sentiment Mismatch ─────────────────────────────────────────

def check_tone_sentiment_mismatch(
    snapshot: CompetitorSnapshot,
    review_texts: list[str],
) -> Optional[GuardFlag]:
    """
    Compare the tone the competitor projects vs what reviewers actually feel.

    Args:
        snapshot:      Latest CompetitorSnapshot for this competitor.
        review_texts:  Raw G2/Trustpilot review strings for this competitor.
    """
    if not review_texts:
        return None

    # Average VADER compound across all reviews
    review_sentiments = [_vader_score(r) for r in review_texts]
    avg_review_sentiment = sum(review_sentiments) / len(review_sentiments)

    # Expected sentiment based on claimed tone
    expected = TONE_SENTIMENT_PRIOR.get(snapshot.tone, 0.0)
    delta = abs(avg_review_sentiment - expected)

    if delta < TONE_SENTIMENT_MISMATCH_DELTA:
        return None

    direction = (
        "much more negative than" if avg_review_sentiment < expected
        else "much more positive than"
    )

    return GuardFlag(
        flag_type="tone_mismatch",
        competitor=snapshot.competitor_name,
        theme_or_text=snapshot.tone,
        severity=_severity_from_delta(delta),
        evidence=(
            f"{snapshot.competitor_name} projects a '{snapshot.tone}' tone "
            f"(expected sentiment ≈ {expected:+.2f}) but actual review sentiment "
            f"is {avg_review_sentiment:+.2f} — {direction} expected (Δ={delta:.2f}). "
            f"Based on {len(review_texts)} reviews."
        ),
        recommended_action=(
            "Surface as attack vector: counter their claimed tone with "
            "authentic proof that validates what customers actually say."
        ),
    )


# ── Check 2 — Velocity Spike Detection ───────────────────────────────────────

def check_velocity_spike(
    theme: str,
    competitor: str,
    historical_freqs: list[int],
    current_freq: int,
    threshold_std: float = VELOCITY_SPIKE_THRESHOLD,
) -> Optional[GuardFlag]:
    """
    Flag if current_freq is > threshold_std standard deviations above the
    rolling historical mean.

    Args:
        theme:            The messaging theme being monitored.
        competitor:       Competitor name (or "market" for cross-competitor aggregate).
        historical_freqs: Weekly/daily frequency counts from prior periods (list of ints).
        current_freq:     Frequency count in the current observation window.
        threshold_std:    Number of std deviations to trigger a flag (default 3).
    """
    if len(historical_freqs) < 2:
        return None  # Not enough data to establish baseline

    mean = statistics.mean(historical_freqs)
    std = statistics.stdev(historical_freqs)

    if std == 0:
        # No variance in history; any change is notable
        if current_freq > mean:
            z = float("inf")
        else:
            return None
    else:
        z = (current_freq - mean) / std

    if z < threshold_std:
        return None

    severity = "high" if z > 5 else "medium" if z > 3.5 else "low"

    return GuardFlag(
        flag_type="velocity_spike",
        competitor=competitor,
        theme_or_text=theme,
        severity=severity,
        evidence=(
            f"'{theme}' spiked to {current_freq} mentions (z={z:.1f}σ). "
            f"Historical baseline: mean={mean:.1f}, std={std:.1f} "
            f"over {len(historical_freqs)} prior periods. "
            f"Threshold: >{threshold_std}σ."
        ),
        recommended_action=(
            "Investigate whether this is organic trend growth, a coordinated "
            "PR push, or review gating. Do not react immediately — wait one "
            "more observation window to confirm persistence."
        ),
    )


# ── Check 3 — Phrasing Similarity Guard ───────────────────────────────────────

def check_phrasing_similarity(
    snapshot: CompetitorSnapshot,
    reference_texts: list[str],
    threshold: float = COSINE_SIMILARITY_THRESHOLD,
) -> list[GuardFlag]:
    """
    Flag if any competitor headline or feature phrase is suspiciously similar
    to your own reference copy (or a set of protected phrases).

    Args:
        snapshot:         Competitor snapshot to check.
        reference_texts:  Your own headlines/copy or any reference phrases to protect.
        threshold:        Cosine similarity above which to flag (default 0.85).
    """
    flags: list[GuardFlag] = []

    candidate_texts = [snapshot.headline] + snapshot.features
    candidate_texts = [t for t in candidate_texts if t.strip()]

    for candidate in candidate_texts:
        for ref in reference_texts:
            if not ref.strip():
                continue
            sim = _cosine_similarity(candidate, ref)
            if sim >= threshold:
                severity = "high" if sim >= 0.95 else "medium" if sim >= 0.90 else "low"
                flags.append(GuardFlag(
                    flag_type="phrasing_similarity",
                    competitor=snapshot.competitor_name,
                    theme_or_text=candidate,
                    severity=severity,
                    evidence=(
                        f"'{candidate}' from {snapshot.competitor_name} has cosine "
                        f"similarity {sim:.3f} ≥ {threshold} with reference: '{ref[:80]}'"
                    ),
                    recommended_action=(
                        "Review for potential copy-lifting. If confirmed, update "
                        "your own messaging to differentiate further and document "
                        "the timeline for IP records."
                    ),
                ))
                break  # One flag per candidate text is enough

    return flags


# ── Orchestrator ──────────────────────────────────────────────────────────────

class AdversarialGuard:
    """
    Run all guard checks against a batch of snapshots.

    Usage:
        guard = AdversarialGuard(
            snapshots=current_snaps,
            review_map={"Notion": ["Great app", "Setup was painful"]},
            historical_freq_map={"AI-powered": {"Notion": [3, 4, 3, 5]}},
            reference_texts=["Ship faster with calm focus"],
        )
        flags = guard.run_all()
    """

    def __init__(
        self,
        snapshots: list[CompetitorSnapshot],
        review_map: Optional[dict[str, list[str]]] = None,
        historical_freq_map: Optional[dict[str, dict[str, list[int]]]] = None,
        current_freq_map: Optional[dict[str, dict[str, int]]] = None,
        reference_texts: Optional[list[str]] = None,
    ):
        """
        Args:
            snapshots:           Current competitor snapshots.
            review_map:          {competitor_name: [review_text, ...]}
            historical_freq_map: {theme: {competitor: [freq_t-n, ..., freq_t-1]}}
            current_freq_map:    {theme: {competitor: freq_current}}
            reference_texts:     Your own copy / protected phrases for similarity check.
        """
        self.snapshots = snapshots
        self.review_map = review_map or {}
        self.historical_freq_map = historical_freq_map or {}
        self.current_freq_map = current_freq_map or {}
        self.reference_texts = reference_texts or []

    def run_all(self) -> list[GuardFlag]:
        flags: list[GuardFlag] = []

        for snap in self.snapshots:
            # Check 1 — tone vs sentiment
            reviews = self.review_map.get(snap.competitor_name, [])
            flag = check_tone_sentiment_mismatch(snap, reviews)
            if flag:
                flags.append(flag)

            # Check 3 — phrasing similarity (per snapshot)
            if self.reference_texts:
                flags.extend(check_phrasing_similarity(snap, self.reference_texts))

        # Check 2 — velocity spikes (per theme × competitor)
        all_themes = {f for snap in self.snapshots for f in snap.features}
        for theme in all_themes:
            theme_hist = self.historical_freq_map.get(theme, {})
            theme_curr = self.current_freq_map.get(theme, {})
            competitors = set(theme_hist) | set(theme_curr)
            for comp in competitors:
                historical = theme_hist.get(comp, [])
                current = theme_curr.get(comp, 0)
                flag = check_velocity_spike(theme, comp, historical, current)
                if flag:
                    flags.append(flag)

        return sorted(flags, key=lambda f: {"high": 0, "medium": 1, "low": 2}[f.severity])

    def sentiment_map_for_scorer(self) -> dict[str, list[float]]:
        """
        Build the sentiment_map dict expected by SNVRScorer.reliability.
        Returns {theme: [vader_compound_scores_from_reviews]}.
        Looks for theme keywords in review texts.
        """
        all_themes = {f for snap in self.snapshots for f in snap.features}
        result: dict[str, list[float]] = {}

        for theme in all_themes:
            scores: list[float] = []
            for comp, reviews in self.review_map.items():
                for review in reviews:
                    if theme.lower() in review.lower():
                        scores.append(_vader_score(review))
            result[theme] = scores

        return result


# ── CLI smoke test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from models import CompetitorSnapshot

    snaps = [
        CompetitorSnapshot(
            competitor_name="Notion",
            page_url="https://notion.so",
            snapshot_ts="2026-03-25T10:00:00+00:00",
            headline="The all-in-one workspace for your notes and tasks",
            features=["AI-powered", "Offline mode", "Templates"],
            tone="inspirational",
            proof_type="ratings",
        ),
        CompetitorSnapshot(
            competitor_name="Linear",
            page_url="https://linear.app",
            snapshot_ts="2026-03-25T10:00:00+00:00",
            headline="The issue tracker built for high-performance teams",
            features=["AI-powered", "Sprint planning", "GitHub integration"],
            tone="professional",
            proof_type="logos",
        ),
    ]

    reviews = {
        "Notion": [
            "Setup was a nightmare, took 3 days to configure",
            "Not as easy as they claim",
            "Confusing interface for new users",
            "Offline mode keeps crashing",
        ],
        "Linear": [
            "Blazing fast and clean",
            "Best issue tracker we've used",
            "Integrations work flawlessly",
        ],
    }

    hist_freq = {
        "AI-powered": {"Notion": [2, 3, 2, 4, 3], "Linear": [1, 2, 1, 2, 2]},
    }
    curr_freq = {
        "AI-powered": {"Notion": 18},   # spike!
    }

    guard = AdversarialGuard(
        snapshots=snaps,
        review_map=reviews,
        historical_freq_map=hist_freq,
        current_freq_map=curr_freq,
        reference_texts=["The all-in-one workspace for notes and tasks"],  # similarity test
    )

    flags = guard.run_all()

    print(f"\n── {len(flags)} guard flag(s) raised ──\n")
    for f in flags:
        print(f"[{f.severity.upper()}] {f.flag_type} → {f.competitor}")
        print(f"  Theme/text : {f.theme_or_text}")
        print(f"  Evidence   : {f.evidence}")
        print(f"  Action     : {f.recommended_action}")
        print()
