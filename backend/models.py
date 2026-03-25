"""
ARIA Track B — Pydantic Models

CompetitorSnapshot: the single validated record produced by extractor.extract().
All downstream modules (snvr_scorer, adversarial_guard, bridge) consume this schema.
"""

from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, field_validator


# ─────────────────────────────────────────────────────────────────────────────
# Core snapshot schema
# ─────────────────────────────────────────────────────────────────────────────

class CompetitorSnapshot(BaseModel):
    """
    Fully validated, structured representation of one crawled competitor page.
    Produced by extractor.extract() and consumed by scorer + guard.
    """
    competitor_name:    str
    page_url:           str
    snapshot_ts:        str                      # ISO 8601, UTC

    # Extracted signals
    headline:           str  = ""
    subheadline:        str  = ""
    positioning_angle:  str  = "other"           # see POSITIONING_ANGLES
    target_segments:    List[str] = []
    key_claims:         List[str] = []
    tone:               str  = "neutral"
    primary_offer:      str  = ""
    themes:             List[str] = []
    differentiation:    str  = ""
    pricing_signals:    List[str] = []
    cta_buttons:        List[str] = []
    feature_claims:     List[str] = []
    social_proof:       List[str] = []

    @field_validator("snapshot_ts", mode="before")
    @classmethod
    def normalise_ts(cls, v: str) -> str:
        """Accept naive ISO strings by appending UTC offset."""
        if isinstance(v, str) and "+" not in v and not v.endswith("Z"):
            return v + "+00:00"
        return v

    @field_validator("positioning_angle", mode="before")
    @classmethod
    def normalise_positioning(cls, v: str) -> str:
        valid = {
            "feature-driven", "outcome-driven", "cost-leadership",
            "premium", "community-led", "enterprise-focused",
            "developer-first", "other",
        }
        return v if v in valid else "other"


# ─────────────────────────────────────────────────────────────────────────────
# Scorer output
# ─────────────────────────────────────────────────────────────────────────────

class SNVRScore(BaseModel):
    """Saturation-Novelty-Velocity-Relevance score for a single messaging theme."""
    theme:              str
    saturation:         float   # 0=nobody uses it, 1=everyone uses it
    novelty:            float   # 0=stale, 1=very fresh
    velocity:           float   # 0=dying, 1=rapidly growing
    sentiment:          float   # 0=negative, 1=positive customer response
    opportunity:        float   # composite: weighted(novelty, velocity, sentiment)
    competitor_count:   int     = 0
    claim_count:        int     = 0
    rising:             bool    = False


# ─────────────────────────────────────────────────────────────────────────────
# Adversarial guard output
# ─────────────────────────────────────────────────────────────────────────────

class GuardFlag(BaseModel):
    """A red-flag or strategic warning raised by adversarial_guard."""
    flag_type:      str         # e.g. OVERUSED_CLAIM, NEGATIVE_SENTIMENT, PRICE_UNDERCUT
    severity:       str         # LOW | MEDIUM | HIGH
    theme:          str
    competitor:     str
    evidence:       str         # short quote / data supporting the flag
    recommendation: str         # what the user's team should do about it
