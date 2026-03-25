"""
ARIA Track B — Extractor

Converts raw HTML into a validated CompetitorSnapshot.

Primary:  Ollama + Mistral 7B (local, JSON mode) — zero API cost
Fallback: Deterministic keyword/BeautifulSoup heuristics (always works offline)

Usage:
    from extractor import extract
    snapshot = extract(raw_html, competitor_name, page_url, snapshot_ts)
"""

from __future__ import annotations

import json
import re
from typing import Optional

import requests
from bs4 import BeautifulSoup

from models import CompetitorSnapshot

# ─────────────────────────────────────────────────────────────────────────────
# Config (override via env vars if needed)
# ─────────────────────────────────────────────────────────────────────────────
import os
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL",    "mistral")
OLLAMA_ENABLED  = os.getenv("OLLAMA_ENABLED",  "false").lower() == "true"


# ─────────────────────────────────────────────────────────────────────────────
# Heuristic keyword maps
# ─────────────────────────────────────────────────────────────────────────────

_POSITIONING = {
    "feature-driven":     ["feature", "functionality", "tools", "integrations", "capabilities"],
    "outcome-driven":     ["results", "roi", "revenue", "growth", "outcomes", "impact", "save"],
    "cost-leadership":    ["affordable", "free", "cheap", "pricing", "save money", "cost"],
    "premium":            ["enterprise", "tailored", "dedicated", "white-glove", "exclusive"],
    "community-led":      ["community", "open source", "contributors", "ecosystem"],
    "developer-first":    ["api", "sdk", "developers", "engineers", "code", "github"],
    "enterprise-focused": ["enterprise", "compliance", "soc2", "sso", "audit", "security"],
}

_TONE = {
    "urgent":        ["now", "today", "instantly", "immediately", "limited", "don't miss"],
    "confident":     ["best", "#1", "leading", "proven", "trusted", "reliable"],
    "aspirational":  ["dream", "future", "vision", "transform", "revolutionize", "reimagine"],
    "technical":     ["api", "sdk", "infrastructure", "architecture", "latency"],
    "friendly":      ["team", "together", "join", "welcome", "simple", "easy"],
    "authoritative": ["research", "data", "study", "evidence", "according to", "experts"],
}

_THEMES = {
    "ai-powered":    ["ai", "artificial intelligence", "machine learning", "gpt", "llm"],
    "automation":    ["automate", "workflow", "trigger", "schedule", "no-code"],
    "collaboration": ["team", "collaborate", "share", "workspace", "together"],
    "security":      ["security", "compliance", "soc2", "gdpr", "encrypt", "hipaa"],
    "speed":         ["fast", "instant", "real-time", "millisecond", "performance"],
    "scale":         ["scale", "enterprise", "million", "global", "unlimited"],
    "analytics":     ["analytics", "dashboard", "report", "insights", "metrics", "data"],
    "integration":   ["integrations", "connect", "sync", "api", "zapier", "slack"],
}

_SEGMENTS = {
    "SMB":        ["small business", "startup", "solopreneur", "freelance", "small team"],
    "enterprise": ["enterprise", "corporate", "fortune 500", "large organization"],
    "developer":  ["developer", "engineer", "technical team", "devops", "api", "sdk"],
    "marketer":   ["marketing", "marketer", "campaign", "growth", "brand"],
    "sales":      ["sales", "revenue", "pipeline", "crm", "deals"],
    "ops":        ["operations", "ops team", "process", "workflow"],
}

_PRICE_RE = re.compile(
    r"\$\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?/\s?(?:mo|month|yr|year|user|seat))?"
    r"|free(?:\s+forever)?|custom\s+pricing|contact\s+sales|\d+\s?%\s+off",
    re.IGNORECASE,
)

_CTA_KW = {
    "get started", "start free", "try free", "sign up", "book a demo",
    "request demo", "get a demo", "start trial", "free trial", "buy now",
    "get pricing", "contact sales", "talk to sales", "see plans",
}


# ─────────────────────────────────────────────────────────────────────────────
# HTML parsing helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_html(html: str) -> dict:
    """BeautifulSoup structured extraction — deterministic, no LLM."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True).lower()

    # Headline
    h1 = soup.find("h1")
    headline = h1.get_text(separator=" ", strip=True)[:400] if h1 else ""

    h2 = soup.find("h2")
    subheadline = h2.get_text(separator=" ", strip=True)[:400] if h2 else ""

    meta = soup.find("meta", attrs={"name": "description"})
    meta_desc = (meta.get("content", "") if meta else "")[:300]

    cta_buttons = []
    seen_cta = set()
    for el in soup.find_all(["a", "button"]):
        t = el.get_text(strip=True)
        if t.lower() in _CTA_KW and t not in seen_cta:
            seen_cta.add(t)
            cta_buttons.append(t)

    pricing_signals = list(set(_PRICE_RE.findall(soup.get_text(separator=" "))))[:12]

    feature_claims = []
    seen_fc = set()
    for li in soup.find_all("li"):
        t = li.get_text(separator=" ", strip=True)
        if 10 < len(t) < 200 and t not in seen_fc:
            seen_fc.add(t)
            feature_claims.append(t)
        if len(feature_claims) >= 25:
            break

    social_proof = []
    for el in soup.find_all(["blockquote", "q"], limit=5):
        t = el.get_text(separator=" ", strip=True)
        if len(t) > 15:
            social_proof.append(t[:300])

    return {
        "text":           text,
        "headline":       headline,
        "subheadline":    subheadline,
        "meta_desc":      meta_desc,
        "cta_buttons":    cta_buttons[:8],
        "pricing_signals": pricing_signals,
        "feature_claims": feature_claims,
        "social_proof":   social_proof,
    }


def _match_best(mapping: dict, text: str) -> str:
    scores = {k: sum(1 for kw in kws if kw in text) for k, kws in mapping.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "other"


def _match_all(mapping: dict, text: str, threshold: int = 1) -> list:
    return [k for k, kws in mapping.items()
            if sum(1 for kw in kws if kw in text) >= threshold]


# ─────────────────────────────────────────────────────────────────────────────
# Heuristic extractor
# ─────────────────────────────────────────────────────────────────────────────

def _heuristic_extract(parsed: dict) -> dict:
    text = parsed["text"][:6000]
    claims = parsed["feature_claims"][:7]
    if parsed["headline"]:
        claims = [parsed["headline"]] + claims

    return {
        "headline":          parsed["headline"],
        "subheadline":       parsed["subheadline"],
        "positioning_angle": _match_best(_POSITIONING, text),
        "target_segments":   _match_all(_SEGMENTS, text) or ["general"],
        "key_claims":        claims,
        "tone":              _match_best(_TONE, text),
        "primary_offer":     parsed["meta_desc"] or parsed["headline"],
        "themes":            _match_all(_THEMES, text) or ["general"],
        "differentiation":   parsed["subheadline"],
        "pricing_signals":   parsed["pricing_signals"],
        "cta_buttons":       parsed["cta_buttons"],
        "feature_claims":    parsed["feature_claims"],
        "social_proof":      parsed["social_proof"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Ollama extractor
# ─────────────────────────────────────────────────────────────────────────────

_PROMPT = """\
You are a competitive intelligence parser. Return ONLY valid JSON — no markdown, no explanation.

Schema:
{{
  "headline": "<h1 or og:title>",
  "subheadline": "<h2 or subtitle>",
  "positioning_angle": "<feature-driven|outcome-driven|cost-leadership|premium|community-led|enterprise-focused|developer-first|other>",
  "target_segments": ["<SMB|enterprise|developer|marketer|sales|ops|general>"],
  "key_claims": ["<3-7 distinct competitive claims>"],
  "tone": "<confident|urgent|aspirational|technical|friendly|authoritative|neutral>",
  "primary_offer": "<main product/offer in one sentence>",
  "themes": ["<2-5 of: ai-powered|automation|collaboration|security|speed|scale|analytics|integration|general>"],
  "differentiation": "<what makes this competitor unique, 1-2 sentences>"
}}

PAGE TEXT (first 4000 chars):
{text}
"""

def _ollama_extract(text: str) -> Optional[dict]:
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": _PROMPT.format(text=text[:4000]),
                  "stream": False, "format": "json"},
            timeout=90,
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "")
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as exc:
        print(f"[Extractor] Ollama failed: {exc}")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def extract(
    raw_html: str,
    competitor_name: str,
    page_url: str,
    snapshot_ts: str,
) -> CompetitorSnapshot:
    """
    Convert raw HTML → validated CompetitorSnapshot.

    Tries Ollama/Mistral if OLLAMA_ENABLED=true, otherwise uses heuristics.
    Always returns a valid CompetitorSnapshot — never raises on bad HTML.

    Args:
        raw_html:        Raw HTML string from crawler
        competitor_name: e.g. "Notion"
        page_url:        Full URL that was crawled
        snapshot_ts:     ISO 8601 timestamp (UTC or naive — will be normalised)

    Returns:
        CompetitorSnapshot (validated Pydantic model)
    """
    parsed = _parse_html(raw_html)
    signals: dict = {}

    if OLLAMA_ENABLED:
        result = _ollama_extract(parsed["text"])
        if result:
            print(f"[Extractor] Ollama OK — {competitor_name}")
            signals = result
        else:
            print(f"[Extractor] Ollama failed — falling back to heuristics for {competitor_name}")

    if not signals:
        signals = _heuristic_extract(parsed)
        print(f"[Extractor] Heuristic extraction — {competitor_name}")

    # Merge parsed HTML fields that Ollama might not return
    signals.setdefault("pricing_signals", parsed["pricing_signals"])
    signals.setdefault("cta_buttons",     parsed["cta_buttons"])
    signals.setdefault("feature_claims",  parsed["feature_claims"])
    signals.setdefault("social_proof",    parsed["social_proof"])
    signals.setdefault("headline",        parsed["headline"])
    signals.setdefault("subheadline",     parsed["subheadline"])

    return CompetitorSnapshot(
        competitor_name=competitor_name,
        page_url=page_url,
        snapshot_ts=snapshot_ts,
        **{k: v for k, v in signals.items()
           if k in CompetitorSnapshot.model_fields},
    )
