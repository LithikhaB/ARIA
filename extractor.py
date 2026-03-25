"""
extractor.py — Dev B / ARIA
Sends cleaned HTML chunks to Ollama (mistral:7b) and extracts structured
competitor intelligence as a validated CompetitorSnapshot JSON record.
"""

import json
import re
import time
import httpx
from typing import Optional
from bs4 import BeautifulSoup
from models import CompetitorSnapshot  # Pydantic schema (same package)

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_URL =  "http://localhost:11434/api/generate"
MODEL = "mistral:7b"
MAX_CHUNK_CHARS = 6_000   # ~1500 tokens — safe for mistral:7b context
MAX_RETRIES = 3
RETRY_DELAY = 2           # seconds between retries

EXTRACTION_PROMPT = """\
You are a structured data extractor. Given the text of a competitor's webpage,
extract the following fields and return ONLY a valid JSON object — no prose,
no markdown fences, no explanation.

Fields to extract:
- headline (str): The primary H1 or hero headline. Empty string if absent.
- pricing (str): Pricing model description, e.g. "Free + $12/mo Pro". Empty string if absent.
- features (list[str]): Up to 10 key features or capabilities mentioned.
- tone (str): One of: "professional", "casual", "aggressive", "inspirational", "technical".
- cta (str): The primary call-to-action button text, e.g. "Start for free".
- target_audience (str): Who this product seems aimed at, e.g. "SMB teams", "enterprise CTOs".
- fear_addressed (str): The fear or pain point the page targets, e.g. "losing deals to competitors".
- proof_type (str): Type of social proof used. One of: "testimonials", "logos", "case_studies",
  "ratings", "none", "mixed".

Webpage text:
\"\"\"
{page_text}
\"\"\"

Return only the JSON object.
"""


# ── HTML cleaning ─────────────────────────────────────────────────────────────

def clean_html(raw_html: str) -> str:
    """Strip tags, scripts, styles — return readable text."""
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "img", "meta", "link"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    # Collapse whitespace
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def chunk_text(text: str, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    """Split text into chunks, trying to break at sentence boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks, start = [], 0
    while start < len(text):
        end = start + max_chars
        if end >= len(text):
            chunks.append(text[start:])
            break
        # Try to find a sentence boundary near the limit
        boundary = text.rfind(". ", start, end)
        if boundary == -1 or boundary <= start:
            boundary = end
        chunks.append(text[start : boundary + 1])
        start = boundary + 1
    return chunks


# ── Ollama call ───────────────────────────────────────────────────────────────

def call_ollama(prompt: str, timeout: int = 120) -> str:
    """Send a prompt to Ollama and return the raw text response."""
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.0},  # deterministic for parsing
    }
    response = httpx.post(OLLAMA_URL, json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()["response"].strip()


def extract_json_from_response(raw: str) -> dict:
    """Pull the first JSON object out of a model response string."""
    # Strip possible markdown fences
    raw = re.sub(r"^```(?:json)?", "", raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r"```$", "", raw.strip(), flags=re.MULTILINE)
    raw = raw.strip()

    # Find the outermost { ... }
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in response: {raw[:200]}")
    return json.loads(match.group())


# ── Core extraction ───────────────────────────────────────────────────────────

def extract_from_chunk(chunk: str) -> dict:
    """Ask Ollama to extract fields from a single text chunk."""
    prompt = EXTRACTION_PROMPT.format(page_text=chunk)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = call_ollama(prompt)
            return extract_json_from_response(raw)
        except (ValueError, json.JSONDecodeError) as e:
            print(f"  [extractor] Attempt {attempt}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
    raise RuntimeError("Extraction failed after all retries.")


def merge_chunk_results(results: list[dict]) -> dict:
    """
    Merge extraction results from multiple chunks.
    Strategy: first non-empty value wins for scalars; lists are unioned.
    """
    merged: dict = {
        "headline": "",
        "pricing": "",
        "features": [],
        "tone": "professional",
        "cta": "",
        "target_audience": "",
        "fear_addressed": "",
        "proof_type": "none",
    }
    for r in results:
        for key in ("headline", "pricing", "tone", "cta", "target_audience",
                    "fear_addressed", "proof_type"):
            if not merged[key] and r.get(key):
                merged[key] = r[key]
        # Deduplicated feature union
        existing = set(merged["features"])
        for f in r.get("features", []):
            if f not in existing:
                merged["features"].append(f)
                existing.add(f)
    merged["features"] = merged["features"][:10]
    return merged


# ── Public API ────────────────────────────────────────────────────────────────

def extract(
    raw_html: str,
    competitor_name: str,
    page_url: str,
    snapshot_ts: Optional[str] = None,
) -> CompetitorSnapshot:
    """
    Full pipeline: raw HTML → validated CompetitorSnapshot.

    Args:
        raw_html:        Full HTML string of the competitor page.
        competitor_name: Human-readable name, e.g. "Notion".
        page_url:        URL the page was fetched from.
        snapshot_ts:     ISO timestamp of when the page was scraped.
                         Defaults to now.

    Returns:
        A validated CompetitorSnapshot Pydantic model instance.

    Raises:
        RuntimeError: If extraction fails after all retries.
        pydantic.ValidationError: If the extracted data is invalid.
    """
    from datetime import datetime, timezone

    if snapshot_ts is None:
        snapshot_ts = datetime.now(timezone.utc).isoformat()

    print(f"[extractor] Cleaning HTML for {competitor_name}...")
    text = clean_html(raw_html)
    chunks = chunk_text(text)
    print(f"[extractor] {len(chunks)} chunk(s) to process.")

    chunk_results = []
    for i, chunk in enumerate(chunks, 1):
        print(f"[extractor] Processing chunk {i}/{len(chunks)}...")
        chunk_results.append(extract_from_chunk(chunk))

    merged = merge_chunk_results(chunk_results)
    merged["competitor_name"] = competitor_name
    merged["page_url"] = page_url
    merged["snapshot_ts"] = snapshot_ts

    print(f"[extractor] Validating schema...")
    snapshot = CompetitorSnapshot(**merged)
    print(f"[extractor] ✓ Extraction complete for {competitor_name}")
    return snapshot


# ── CLI smoke test ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    SAMPLE_HTML = """
    <html><body>
    <h1>Ship faster with AI-powered project management</h1>
    <p>Trusted by 10,000+ engineering teams. Free forever, then $12/mo per seat.</p>
    <ul>
      <li>Offline mode for uninterrupted focus</li>
      <li>Auto-generated sprint summaries</li>
      <li>GitHub &amp; Jira integrations</li>
      <li>Real-time collaboration</li>
    </ul>
    <p>Built for senior engineers who hate meetings.</p>
    <button>Start for free</button>
    <section>
      <p>"Cut our planning time in half" — Acme Corp</p>
      <p>★★★★★ 4.8 on G2</p>
    </section>
    </body></html>
    """

    try:
        result = extract(
            raw_html=SAMPLE_HTML,
            competitor_name="SampleCo",
            page_url="https://example.com",
        )
        print("\n── Extracted snapshot ──")
        print(result.model_dump_json(indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
