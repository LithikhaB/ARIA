"""
ARIA Diff Engine Module - Semantic and lexical diff detection for competitive intelligence.

This module provides sophisticated change detection between website snapshots using
both lexical (text-based) and semantic (meaning-based) analysis.
"""

import difflib
import json
import logging
import re
import sqlite3
from typing import Dict, List, Optional

from sentence_transformers import SentenceTransformer, util
from snapshot import get_snapshot_history, init_db, DB_PATH

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load sentence transformer model (lazy loading)
_model = None

def get_model():
    """Get the sentence transformer model (lazy loading)."""
    global _model
    if _model is None:
        logger.info("Loading sentence transformer model...")
        _model = SentenceModel('all-MiniLM-L6-v2')
    return _model


class SentenceModel:
    """Wrapper for sentence transformer model to handle loading."""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Successfully loaded model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}: {str(e)}")
            raise
    
    def encode(self, sentences, **kwargs):
        """Encode sentences into embeddings."""
        return self.model.encode(sentences, **kwargs)


def extract_text_content(html: str) -> str:
    """
    Extract clean text content from HTML.
    
    Args:
        html: Raw HTML content
        
    Returns:
        Clean text content
    """
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove script and style elements
    for element in soup(['script', 'style', 'noscript']):
        element.decompose()
    
    # Get text content
    text = soup.get_text(separator=' ', strip=True)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def detect_changed_fields(old_html: str, new_html: str) -> List[str]:
    """
    Detect which types of content have changed using heuristics.
    
    Args:
        old_html: Previous HTML content
        new_html: New HTML content
        
    Returns:
        List of strings indicating what types of content changed
    """
    changed_fields = []
    
    # Extract text content for analysis
    old_text = extract_text_content(old_html).lower()
    new_text = extract_text_content(new_html).lower()
    
    # Check for pricing changes
    price_keywords = ['price', 'pricing', '$', '€', '£', 'cost', 'fee', 'plan']
    old_has_prices = any(keyword in old_text for keyword in price_keywords)
    new_has_prices = any(keyword in new_text for keyword in price_keywords)
    
    if old_has_prices and new_has_prices:
        # Look for specific price pattern changes
        old_prices = re.findall(r'[$€£]\s*\d+(?:,\d{3})*(?:\.\d{2})?', old_text)
        new_prices = re.findall(r'[$€£]\s*\d+(?:,\d{3})*(?:\.\d{2})?', new_text)
        
        if old_prices != new_prices:
            changed_fields.append("pricing")
    
    # Check for headline changes
    old_headlines = re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', old_html, re.IGNORECASE)
    new_headlines = re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', new_html, re.IGNORECASE)
    
    if old_headlines != new_headlines:
        changed_fields.append("headline")
    
    # Check for CTA button changes
    cta_selectors = ['button', 'a[href*="sign"]', 'a[href*="register"]', 'a[href*="start"]', 
                    '.cta', '.button', '[class*="cta"]', '[class*="button"]']
    
    for selector in cta_selectors:
        old_ctas = re.findall(rf'<{selector}[^>]*>(.*?)</{selector}>', old_html, re.IGNORECASE)
        new_ctas = re.findall(rf'<{selector}[^>]*>(.*?)</{selector}>', new_html, re.IGNORECASE)
        
        if old_ctas != new_ctas:
            changed_fields.append("cta")
            break
    
    # Check for feature changes
    feature_keywords = ['feature', 'capability', 'functionality', 'benefit']
    old_features = any(keyword in old_text for keyword in feature_keywords)
    new_features = any(keyword in new_text for keyword in feature_keywords)
    
    if old_features and new_features:
        # Simple heuristic: if the text around features changed significantly
        old_feature_lines = [line for line in old_text.split('.') if any(keyword in line for keyword in feature_keywords)]
        new_feature_lines = [line for line in new_text.split('.') if any(keyword in line for keyword in feature_keywords)]
        
        if old_feature_lines != new_feature_lines:
            changed_fields.append("features")
    
    # Check for content length changes
    if abs(len(new_text) - len(old_text)) / len(old_text) > 0.1:  # 10% change
        changed_fields.append("content_length")
    
    return changed_fields if changed_fields else ["general"]


def compute_lexical_diff(old_html: str, new_html: str, max_lines: int = 50) -> List[str]:
    """
    Compute lexical (text-based) diff between two HTML contents.
    
    Args:
        old_html: Previous HTML content
        new_html: New HTML content
        max_lines: Maximum number of diff lines to return
        
    Returns:
        List of strings representing the unified diff
    """
    old_text = extract_text_content(old_html)
    new_text = extract_text_content(new_html)
    
    # Generate unified diff
    diff_lines = list(difflib.unified_diff(
        old_text.splitlines(keepends=True),
        new_text.splitlines(keepends=True),
        fromfile='previous',
        tofile='current',
        lineterm=''
    ))
    
    # Limit the number of lines
    if len(diff_lines) > max_lines:
        # Keep context lines and the most important changes
        context_lines = [line for line in diff_lines if line.startswith(' ') or line.startswith('@@')]
        change_lines = [line for line in diff_lines if line.startswith('+') or line.startswith('-')]
        
        # Take first few context lines and most recent changes
        result = context_lines[:10] + change_lines[-(max_lines - len(context_lines[:10])):]
    else:
        result = diff_lines
    
    return result


def compute_semantic_distance(old_html: str, new_html: str) -> float:
    """
    Compute semantic distance between two HTML contents using sentence transformers.
    
    Args:
        old_html: Previous HTML content
        new_html: New HTML content
        
    Returns:
        Float between 0.0 and 1.0 representing semantic distance
    """
    try:
        model = get_model()
        
        # Extract text content
        old_text = extract_text_content(old_html)
        new_text = extract_text_content(new_html)
        
        # Split into sentences (simple approach)
        old_sentences = [s.strip() for s in old_text.split('.') if s.strip()]
        new_sentences = [s.strip() for s in new_text.split('.') if s.strip()]
        
        if not old_sentences or not new_sentences:
            return 0.0
        
        # Encode sentences
        old_embeddings = model.encode(old_sentences, convert_to_tensor=True)
        new_embeddings = model.encode(new_sentences, convert_to_tensor=True)
        
        # Compute cosine similarity
        cosine_scores = util.cos_sim(old_embeddings, new_embeddings)
        
        # Take the maximum similarity as the overall similarity
        max_similarity = cosine_scores.max().item()
        
        # Convert to distance (0.0 = identical, 1.0 = completely different)
        semantic_distance = 1.0 - max_similarity
        
        return semantic_distance
        
    except Exception as e:
        logger.error(f"Failed to compute semantic distance: {str(e)}")
        return 0.0  # Default to no change if computation fails


def compute_diff(old_html: str, new_html: str) -> Dict:
    """
    Compute comprehensive diff between two HTML contents.
    
    Args:
        old_html: Previous HTML content
        new_html: New HTML content
        
    Returns:
        Dictionary containing diff analysis results
    """
    logger.info("Computing diff analysis...")
    
    # Compute lexical diff
    lexical_diff = compute_lexical_diff(old_html, new_html)
    
    # Compute semantic distance
    semantic_distance = compute_semantic_distance(old_html, new_html)
    
    # Detect changed fields
    changed_fields = detect_changed_fields(old_html, new_html)
    
    # Determine if content has changed
    has_changed = bool(lexical_diff) or semantic_distance > 0.1 or len(changed_fields) > 1
    
    # Generate summary
    if has_changed:
        diff_summary = f"{len(lexical_diff)} lines changed. Key changes detected in: {', '.join(changed_fields)}."
    else:
        diff_summary = "No significant changes detected."
    
    result = {
        "has_changed": has_changed,
        "lexical_diff": lexical_diff,
        "semantic_distance": semantic_distance,
        "changed_fields": changed_fields,
        "diff_summary": diff_summary
    }
    
    logger.info(f"Diff analysis completed: has_changed={has_changed}, distance={semantic_distance:.3f}")
    return result


def save_diff_result(competitor_name: str, page_type: str, diff_result: Dict, crawl_ts: str) -> Dict:
    """
    Save diff result to the database.
    
    Args:
        competitor_name: Name of the competitor
        page_type: Type of page
        diff_result: Diff analysis result
        crawl_ts: Timestamp of the newer snapshot
        
    Returns:
        Dictionary representing the saved diff record
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Insert diff result
        cursor.execute("""
            INSERT INTO diffs 
            (competitor_name, page_type, diff_score, changed_fields, diff_summary, crawl_ts)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            competitor_name,
            page_type,
            diff_result["semantic_distance"],
            json.dumps(diff_result["changed_fields"]),
            diff_result["diff_summary"],
            crawl_ts
        ))
        
        diff_id = cursor.lastrowid
        conn.commit()
        
        saved_diff = {
            "id": diff_id,
            "competitor_name": competitor_name,
            "page_type": page_type,
            "diff_score": diff_result["semantic_distance"],
            "changed_fields": diff_result["changed_fields"],
            "diff_summary": diff_result["diff_summary"],
            "crawl_ts": crawl_ts
        }
        
        logger.info(f"Saved diff result for {competitor_name} {page_type} (ID: {diff_id})")
        return saved_diff
        
    except Exception as e:
        logger.error(f"Failed to save diff result: {str(e)}")
        raise
    finally:
        conn.close()


def run_diff_pipeline(competitor_name: str, page_type: str) -> Dict:
    """
    Run the complete diff pipeline for a competitor and page type.
    
    Args:
        competitor_name: Name of the competitor
        page_type: Type of page
        
    Returns:
        Dictionary containing the diff analysis result
    """
    logger.info(f"Running diff pipeline for {competitor_name} {page_type}")
    
    try:
        # Get the 2 most recent snapshots
        snapshots = get_snapshot_history(competitor_name, page_type, limit=2)
        
        if len(snapshots) < 2:
            logger.warning(f"Not enough snapshots for {competitor_name} {page_type} (found {len(snapshots)})")
            return {
                "has_changed": False,
                "lexical_diff": [],
                "semantic_distance": 0.0,
                "changed_fields": [],
                "diff_summary": "Insufficient data for comparison."
            }
        
        # Get the two most recent snapshots (newest first)
        new_snapshot = snapshots[0]
        old_snapshot = snapshots[1]
        
        # Compute diff
        diff_result = compute_diff(old_snapshot["raw_html"], new_snapshot["raw_html"])
        
        # Save diff result if there are changes
        if diff_result["has_changed"]:
            save_diff_result(
                competitor_name,
                page_type,
                diff_result,
                new_snapshot["crawl_timestamp"]
            )
        
        logger.info(f"Diff pipeline completed for {competitor_name} {page_type}")
        return diff_result
        
    except Exception as e:
        logger.error(f"Diff pipeline failed for {competitor_name} {page_type}: {str(e)}")
        raise


def get_recent_diffs(competitor_name: str, limit: int = 5) -> List[Dict]:
    """
    Get recent diff results for a competitor.
    
    Args:
        competitor_name: Name of the competitor
        limit: Maximum number of diffs to return
        
    Returns:
        List of dictionaries representing recent diff results
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, competitor_name, page_type, diff_score, changed_fields,
                   diff_summary, crawl_ts, created_at
            FROM diffs
            WHERE competitor_name = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (competitor_name, limit))
        
        rows = cursor.fetchall()
        
        diffs = []
        for row in rows:
            diff = {
                "id": row[0],
                "competitor_name": row[1],
                "page_type": row[2],
                "diff_score": row[3],
                "changed_fields": json.loads(row[4]),
                "diff_summary": row[5],
                "crawl_ts": row[6],
                "created_at": row[7]
            }
            diffs.append(diff)
        
        logger.info(f"Found {len(diffs)} recent diffs for {competitor_name}")
        return diffs
        
    except Exception as e:
        logger.error(f"Failed to get recent diffs for {competitor_name}: {str(e)}")
        raise
    finally:
        conn.close()


async def test():
    """Smoke test for the diff engine module."""
    logger.info("Starting diff engine smoke test...")
    
    try:
        # Initialize database
        init_db()
        
        # Import crawler for test data
        from crawler import crawl_url
        from snapshot import save_snapshot
        
        # Test with real URLs
        test_urls = [
            ("https://stripe.com", "Stripe"),
            ("https://paddle.com", "Paddle")
        ]
        
        for url, competitor_name in test_urls:
            try:
                # Crawl the URL
                html = await crawl_url(url)
                
                # Save two snapshots with slightly different content
                snapshot1 = save_snapshot(competitor_name, "landing", html)
                
                # Modify the HTML slightly for the second snapshot
                modified_html = html.replace("<title>", "<title>Updated ")
                snapshot2 = save_snapshot(competitor_name, "landing", modified_html)
                
                logger.info(f"Created test snapshots for {competitor_name}: {snapshot1['id']}, {snapshot2['id']}")
                
                # Run diff pipeline
                diff_result = run_diff_pipeline(competitor_name, "landing")
                
                logger.info(f"Diff result for {competitor_name}:")
                logger.info(f"  - Has changed: {diff_result['has_changed']}")
                logger.info(f"  - Semantic distance: {diff_result['semantic_distance']:.3f}")
                logger.info(f"  - Changed fields: {diff_result['changed_fields']}")
                logger.info(f"  - Summary: {diff_result['diff_summary']}")
                
                # Test getting recent diffs
                recent_diffs = get_recent_diffs(competitor_name, limit=2)
                logger.info(f"Recent diffs for {competitor_name}: {len(recent_diffs)}")
                
            except Exception as e:
                logger.error(f"Failed to test {competitor_name}: {str(e)}")
                continue
        
        logger.info("Diff engine smoke test completed successfully!")
        
    except Exception as e:
        logger.error(f"Diff engine smoke test failed: {str(e)}")
        raise


if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
