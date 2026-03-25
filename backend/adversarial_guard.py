"""
ARIA Track B — Adversarial Guard

Scans the competitive landscape for red flags and surfaces strategic warnings:
  - OVERUSED_CLAIM    : a claim so saturated it's meaningless to repeat
  - NEGATIVE_SENTIMENT: customers dislike a theme competitor uses heavily
  - PRICE_UNDERCUT    : competitor pricing is significantly below market
  - MESSAGING_GAP     : a high-opportunity theme nobody is using yet
  - TONE_MISMATCH     : competitor's tone clashes with their target segment

Input:  snapshots (list[CompetitorSnapshot]) + scores (list[SNVRScore])
Output: list[GuardFlag]  — sorted by severity (HIGH → MEDIUM → LOW)
"""

from __future__ import annotations

from models import CompetitorSnapshot, SNVRScore, GuardFlag
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

_SEVERITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}

# Thresholds
SAT_OVERUSED        = 0.70   # theme used by ≥70% competitors → overused
SENT_NEGATIVE       = 0.35   # sentiment <35% (on 0-1 scale) → customers dislike
OPP_GAP_MIN         = 0.65   # opportunity >65% → whitespace if nobody using it
SAT_GAP_MAX         = 0.15   # saturation <15% → truly underexplored


def _check_overused_claims(
    snapshots: list[CompetitorSnapshot],
    scores: list[SNVRScore],
) -> list[GuardFlag]:
    """Flag themes that every (or nearly every) competitor is using."""
    flags = []
    for score in scores:
        if score.saturation >= SAT_OVERUSED:
            # Find one example claim from any competitor using this theme
            evidence_claim = ""
            for snap in snapshots:
                if score.theme in snap.themes and snap.key_claims:
                    evidence_claim = snap.key_claims[0]
                    break

            flags.append(GuardFlag(
                flag_type="OVERUSED_CLAIM",
                severity="HIGH",
                theme=score.theme,
                competitor="(market-wide)",
                evidence=f"{int(score.saturation*100)}% of competitors use '{score.theme}'. "
                         f"Example: \"{evidence_claim}\"",
                recommendation=f"Avoid leading with '{score.theme}' — it no longer differentiates. "
                               f"Test a more specific sub-angle or find an adjacent white space.",
            ))
    return flags


def _check_negative_sentiment(
    snapshots: list[CompetitorSnapshot],
    scores: list[SNVRScore],
) -> list[GuardFlag]:
    """Flag themes where customer sentiment is notably negative."""
    flags = []
    for score in scores:
        if score.sentiment < SENT_NEGATIVE and score.competitor_count >= 1:
            # Find which competitor is most associated with this theme
            top_comp = ""
            for snap in snapshots:
                if score.theme in snap.themes:
                    top_comp = snap.competitor_name
                    break

            flags.append(GuardFlag(
                flag_type="NEGATIVE_SENTIMENT",
                severity="MEDIUM",
                theme=score.theme,
                competitor=top_comp,
                evidence=f"Customer sentiment on '{score.theme}' is "
                         f"{int(score.sentiment * 100 - 50)}% below neutral "
                         f"(VADER score: {score.sentiment:.2f}).",
                recommendation=f"Customers are frustrated with how '{score.theme}' is currently "
                               f"executed. An opportunity exists to fix the pain and own the "
                               f"narrative — but avoid copying the existing messaging.",
            ))
    return flags


def _check_price_signals(snapshots: list[CompetitorSnapshot]) -> list[GuardFlag]:
    """
    Flag competitors showing aggressive pricing language
    (e.g. 'free forever', '50% off', '$0').
    """
    flags = []
    aggressive_kw = {"free forever", "50% off", "free plan", "$0", "no credit card"}

    for snap in snapshots:
        matched = [
            sig for sig in snap.pricing_signals
            if any(kw in sig.lower() for kw in aggressive_kw)
        ]
        if matched:
            flags.append(GuardFlag(
                flag_type="PRICE_UNDERCUT",
                severity="HIGH",
                theme="pricing",
                competitor=snap.competitor_name,
                evidence=f"{snap.competitor_name} is using aggressive pricing: {matched[:3]}",
                recommendation=f"Consider your pricing response to {snap.competitor_name}'s "
                               f"aggressive offer. Test a value-emphasis angle or a "
                               f"limited-period promotional tier.",
            ))
    return flags


def _check_whitespace_gaps(scores: list[SNVRScore]) -> list[GuardFlag]:
    """Flag high-opportunity themes that are barely explored."""
    flags = []
    for score in scores:
        if score.opportunity >= OPP_GAP_MIN and score.saturation <= SAT_GAP_MAX:
            flags.append(GuardFlag(
                flag_type="MESSAGING_GAP",
                severity="LOW",   # positive flag — this is an opportunity
                theme=score.theme,
                competitor="(none — whitespace)",
                evidence=f"'{score.theme}' has {int(score.opportunity*100)}% opportunity score "
                         f"but only {int(score.saturation*100)}% competitor saturation.",
                recommendation=f"'{score.theme}' is an underexplored angle with strong "
                               f"potential. Consider building a content or ad campaign "
                               f"specifically targeting this theme.",
            ))
    return flags


def _check_tone_mismatch(snapshots: list[CompetitorSnapshot]) -> list[GuardFlag]:
    """Flag competitors whose tone clashes with their stated target segments."""
    flags = []
    mismatch_map = {
        # (tone, segment) pairs that are red flags
        ("technical", "SMB"),
        ("authoritative", "SMB"),
        ("urgent", "enterprise"),
        ("playful", "enterprise"),
    }
    for snap in snapshots:
        for segment in snap.target_segments:
            if (snap.tone, segment) in mismatch_map:
                flags.append(GuardFlag(
                    flag_type="TONE_MISMATCH",
                    severity="LOW",
                    theme="messaging",
                    competitor=snap.competitor_name,
                    evidence=f"{snap.competitor_name} uses a '{snap.tone}' tone "
                             f"while targeting '{segment}'.",
                    recommendation=f"This tone/segment mismatch for {snap.competitor_name} "
                                   f"is a vulnerability. Position your product with a "
                                   f"'{segment}'-appropriate tone to contrast effectively.",
                ))
    return flags


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def guard(
    snapshots: list[CompetitorSnapshot],
    scores: list[SNVRScore],
) -> list[GuardFlag]:
    """
    Run all adversarial checks and return sorted GuardFlag list.

    Args:
        snapshots: list of validated CompetitorSnapshot objects
        scores:    list of SNVRScore objects from snvr_scorer.score()

    Returns:
        list[GuardFlag] sorted HIGH → MEDIUM → LOW
    """
    flags: list[GuardFlag] = []
    flags += _check_overused_claims(snapshots, scores)
    flags += _check_negative_sentiment(snapshots, scores)
    flags += _check_price_signals(snapshots)
    flags += _check_whitespace_gaps(scores)
    flags += _check_tone_mismatch(snapshots)

    flags.sort(key=lambda f: _SEVERITY_ORDER.get(f.severity, 99))
    print(f"[Guard] {len(flags)} flags: "
          f"{sum(1 for f in flags if f.severity=='HIGH')} HIGH, "
          f"{sum(1 for f in flags if f.severity=='MEDIUM')} MEDIUM, "
          f"{sum(1 for f in flags if f.severity=='LOW')} LOW")
    return flags


if __name__ == "__main__":
    # Quick smoke test
    from models import CompetitorSnapshot, SNVRScore
    from snvr_scorer import score as compute_scores

    dummy_snaps = [
        CompetitorSnapshot(
            competitor_name="Notion",
            page_url="https://notion.so",
            snapshot_ts="2026-03-25T12:00:00+00:00",
            themes=["ai-powered", "collaboration"],
            tone="confident",
            target_segments=["SMB", "enterprise"],
            key_claims=["AI that thinks with you", "Your second brain"],
            pricing_signals=["Free plan", "$10/month"],
        ),
        CompetitorSnapshot(
            competitor_name="Linear",
            page_url="https://linear.app",
            snapshot_ts="2026-03-25T12:00:00+00:00",
            themes=["speed", "collaboration"],
            tone="technical",
            target_segments=["developer"],
            key_claims=["Built for speed", "The issue tracker you'll actually enjoy"],
        ),
    ]
    dummy_scores = compute_scores(dummy_snaps)
    flags = guard(dummy_snaps, dummy_scores)
    for f in flags:
        print(f"\n{f.severity} [{f.flag_type}] {f.theme}")
        print(f"  Evidence:       {f.evidence}")
        print(f"  Recommendation: {f.recommendation}")
