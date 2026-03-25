# ARIA — Automated Real-time Intelligence Analyzer

> **Competitive intelligence, automated. No manual research. No hallucinated insights. Just math.**

---

## What is ARIA?

ARIA is a competitive intelligence engine that continuously monitors your competitors' websites, ads, and customer reviews — then tells you exactly where the market gaps are, backed by traceable, deterministic math.

No dashboards to check manually. No opinions. Just ranked opportunities with full source provenance.

---

## The Problem

Product and marketing teams waste hours every week manually checking competitor websites, reading G2 reviews, and trying to spot messaging trends. Even after all that work, the output is anecdotal — "I think they're moving upmarket" — with no way to quantify confidence or prove the insight to stakeholders.

---

## The Solution

ARIA automates the entire intelligence pipeline:

1. **Crawls** competitor websites and review platforms on a schedule
2. **Detects changes** — both exact word-level edits and semantic meaning shifts
3. **Extracts structured signals** — positioning claims, target audiences, tone, themes
4. **Scores every messaging theme** using a deterministic formula
5. **Surfaces ranked opportunities** with full source traceability

The scoring engine is 100% Python math — no LLM on the critical path. Same inputs always produce the same outputs.

---

## How It Works

### Step 1 — Data Collection (Spy)

ARIA visits competitor URLs like a browser, saves timestamped page snapshots, and ingests reviews from G2, Trustpilot, and Reddit.

### Step 2 — Change Detection (Spot)

Two complementary comparison methods:

| Method | What it catches |
|---|---|
| **Exact diff** | Word-for-word edits  |
| **Semantic diff** | Meaning shifts even when the text is fully rewritten |

Semantic diffing uses sentence embeddings to measure cosine distance between snapshots — no manual reading required.

### Step 3 — Signal Extraction (Understand)

**Mistral 7B (via Ollama)** converts each raw page into a structured JSON record:

**The model is a parser, not an advisor.** It runs locally via Ollama — no API key, no cost, no data sent externally. All decisions happen in the scoring layer.

### Step 4 — Scoring & Ranking (Decide)

Pure deterministic math. No AI.

---

## The Scoring Model

### Saturation Score
> *"How crowded is this messaging space?"*

### Novelty Score
> *"How rare is this claim right now?"*

### Velocity Score
> *"Is this trend emerging or dying?"*

### Sentiment Score
> *"Do customers actually like what competitors are claiming?"*

Runs **VADER** (rule-based NLP, no API needed) on review data.  
Score range: `−1` (hated) to `+1` (loved).

### Opportunity Score — the main output
> *"Where should YOU play?"*

Every messaging theme across your competitive set gets scored and ranked.




## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    ARIA Pipeline                    │
├──────────────┬──────────────┬───────────────────────┤
│   Crawler    │    Differ    │   Signal Extractor    │
│  (Selenium / │  (exact diff │  (Ollama + Mistral — │
│  Playwright) │  + MiniLM)   │  local, text→JSON)   │
└──────┬───────┴──────┬───────┴───────────┬───────────┘
       │              │                   │
       └──────────────▼───────────────────┘
                ┌─────────────┐
                │  Scoring    │
                │   Engine    │
                │  (pure math,│
                │  no LLM)    │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │  Whitespace │
                │     Map     │
                │  + Reports  │
                └─────────────┘
```

---

## Tech Stack

| Layer | Technology | 
|---|---|
| Crawling | Playwright / Selenium |
| Diffing | `difflib` (exact) + `sentence-transformers` (semantic) | 
| Signal extraction | **Ollama + Mistral 7B** (local inference, structured JSON output) |
| Embeddings | `all-MiniLM-L6-v2` via `sentence-transformers` (runs locally) | 
| Sentiment analysis | VADER (`vaderSentiment`) | 
| Scoring engine | Python (NumPy / Pandas) |
| Visualization | Matplotlib / Plotly | 
| Storage | SQLite | 

---

## Key Design Decisions

**Why is the scoring engine not AI?**  
Determinism matters for trust. The scoring formula is explainable, auditable, and reproducible. Same inputs = same outputs, always. Strategic recommendations shouldn't hallucinate.

**Why Ollama + Mistral 7B for signal extraction?**  
Unstructured web pages need to become structured records. Mistral 7B runs entirely locally via Ollama — zero API cost, no rate limits, no data leaves the machine. It's prompted in JSON mode to act purely as a parser: convert HTML noise into clean JSON records. It does not score, rank, or recommend.

**Why VADER for sentiment?**  
It's rule-based, fast, requires no API, and performs well on short-form review text. No inference cost, no latency, fully offline.

---

## Judging Criteria Alignment

| Criterion | How ARIA addresses it |
|---|---|
| **Insight accuracy** | Math-derived scores with source citations, not AI opinions |
| **Traceability** | Full provenance chain on every insight |
| **Automation** | Zero manual research steps in the pipeline |
| **Reliability** | Deterministic scoring — no hallucination risk on decisions |
| **Novelty** | Semantic diffing catches meaning shifts, not just word changes |

---



## License

MIT

---

*Built for teams who want competitive intelligence they can actually defend in a meeting.*
