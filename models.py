"""
models.py — Dev B / ARIA
Pydantic schema for a single competitor page snapshot.
Used by extractor.py (output) and snvr_scorer.py / adversarial_guard.py (input).
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# ── Enums (as Literals for clean JSON serialisation) ─────────────────────────

ToneType = Literal["professional", "casual", "aggressive", "inspirational", "technical"]
ProofType = Literal["testimonials", "logos", "case_studies", "ratings", "none", "mixed"]


# ── Core snapshot ─────────────────────────────────────────────────────────────

class CompetitorSnapshot(BaseModel):
    """
    One validated extraction record for a competitor page.
    Produced by extractor.py; consumed by snvr_scorer.py and adversarial_guard.py.
    """

    # Identity
    competitor_name: str = Field(..., min_length=1, description="Human-readable competitor name")
    page_url: str = Field(..., min_length=1, description="URL the snapshot was taken from")
    snapshot_ts: str = Field(..., description="ISO 8601 UTC timestamp of the scrape")

    # Extracted fields
    headline: str = Field(default="", description="Primary H1 / hero headline")
    pricing: str = Field(default="", description="Pricing model as free text")
    features: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="Key features/capabilities (max 10)",
    )
    tone: ToneType = Field(default="professional", description="Overall page tone")
    cta: str = Field(default="", description="Primary call-to-action button text")
    target_audience: str = Field(default="", description="Who the page is aimed at")
    fear_addressed: str = Field(default="", description="Pain point or fear being solved")
    proof_type: ProofType = Field(default="none", description="Type of social proof used")

    # ── Validators ────────────────────────────────────────────────────────────

    @field_validator("snapshot_ts")
    @classmethod
    def validate_iso_timestamp(cls, v: str) -> str:
        """Accept any ISO 8601 string; normalise to UTC if possible."""
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError(f"snapshot_ts must be ISO 8601, got: {v!r}")
        return v

    @field_validator("features", mode="before")
    @classmethod
    def deduplicate_features(cls, v):
        if not isinstance(v, list):
            return v
        seen, result = set(), []
        for item in v:
            norm = str(item).strip()
            if norm and norm not in seen:
                seen.add(norm)
                result.append(norm)
        return result

    @field_validator("tone", mode="before")
    @classmethod
    def coerce_tone(cls, v):
        """Lowercase and map near-matches to valid literals."""
        valid = {"professional", "casual", "aggressive", "inspirational", "technical"}
        if isinstance(v, str):
            v = v.lower().strip()
            if v in valid:
                return v
            # Fuzzy fallback mapping
            mapping = {
                "formal": "professional",
                "friendly": "casual",
                "bold": "aggressive",
                "motivational": "inspirational",
                "dev": "technical",
                "developer": "technical",
            }
            return mapping.get(v, "professional")
        return v

    @field_validator("proof_type", mode="before")
    @classmethod
    def coerce_proof_type(cls, v):
        valid = {"testimonials", "logos", "case_studies", "ratings", "none", "mixed"}
        if isinstance(v, str):
            v = v.lower().strip()
            if v in valid:
                return v
            if "testimon" in v:
                return "testimonials"
            if "logo" in v:
                return "logos"
            if "case" in v:
                return "case_studies"
            if "rating" in v or "review" in v or "star" in v:
                return "ratings"
        return "none"

    @model_validator(mode="after")
    def strip_whitespace_fields(self) -> "CompetitorSnapshot":
        for field in ("headline", "pricing", "cta", "target_audience", "fear_addressed"):
            val = getattr(self, field)
            if isinstance(val, str):
                object.__setattr__(self, field, val.strip())
        return self

    class Config:
        extra = "ignore"   # silently drop unknown keys from LLM output
        str_strip_whitespace = True


# ── Batch container ───────────────────────────────────────────────────────────

class SnapshotBatch(BaseModel):
    """A collection of snapshots for a single scoring run."""
    snapshots: list[CompetitorSnapshot] = Field(default_factory=list)
    run_id: Optional[str] = Field(default=None, description="Optional run identifier")
    created_at: Optional[str] = Field(default=None)

    def by_competitor(self, name: str) -> list[CompetitorSnapshot]:
        return [s for s in self.snapshots if s.competitor_name == name]

    def all_features_flat(self) -> list[str]:
        """Return every feature string across all snapshots."""
        return [f for snap in self.snapshots for f in snap.features]


# ── Retried extraction result (wraps snapshot + retry metadata) ───────────────

class ExtractionResult(BaseModel):
    """Wraps a snapshot with metadata about how it was obtained."""
    snapshot: CompetitorSnapshot
    attempts: int = Field(default=1, ge=1)
    used_fallback: bool = False
    raw_response_preview: Optional[str] = Field(
        default=None, description="First 200 chars of raw LLM output, for debugging"
    )
