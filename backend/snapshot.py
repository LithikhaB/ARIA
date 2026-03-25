"""
ARIA Snapshot Module - SQLite-based storage for crawled web content.

This module provides functions to store, retrieve, and manage timestamped snapshots
of competitor website content for competitive intelligence analysis.
"""

import hashlib
import json
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database file path
DB_PATH = "aria.db"


def init_db() -> None:
    """
    Initialize the SQLite database and create tables if they don't exist.
    
    Creates:
    - snapshots table: stores crawled HTML content with metadata
    - diffs table: stores diff analysis results
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create snapshots table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competitor_name TEXT NOT NULL,
                page_type TEXT NOT NULL,
                page_url TEXT NOT NULL DEFAULT '',   -- Track B's extractor requires a URL
                raw_html TEXT NOT NULL,
                crawl_timestamp TEXT NOT NULL,
                sha256_hash TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add page_url column to existing DBs that predate this change
        try:
            cursor.execute("ALTER TABLE snapshots ADD COLUMN page_url TEXT NOT NULL DEFAULT ''")
        except Exception:
            pass  # Column already exists — safe to ignore
        
        # Create indexes for better query performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_snapshots_competitor_page 
            ON snapshots(competitor_name, page_type)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp 
            ON snapshots(crawl_timestamp DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_snapshots_hash 
            ON snapshots(sha256_hash)
        """)
        
        # Create diffs table for diff_engine.py
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diffs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                competitor_name TEXT NOT NULL,
                page_type TEXT NOT NULL,
                diff_score REAL NOT NULL,
                changed_fields TEXT NOT NULL,
                diff_summary TEXT NOT NULL,
                crawl_ts TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_diffs_competitor_page 
            ON diffs(competitor_name, page_type)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_diffs_created_at 
            ON diffs(created_at DESC)
        """)
        
        conn.commit()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise
    finally:
        conn.close()


def compute_sha256(content: str) -> str:
    """
    Compute SHA-256 hash of the given content.
    
    Args:
        content: String content to hash
        
    Returns:
        SHA-256 hash as hexadecimal string
    """
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def save_snapshot(competitor_name: str, page_type: str, raw_html: str, page_url: str = "") -> Dict:
    """
    Save a snapshot of crawled content to the database.
    
    Args:
        competitor_name: Name of the competitor
        page_type: Type of page (landing, pricing, g2, etc.)
        raw_html: Raw HTML content to save
        
    Returns:
        Dictionary representing the saved snapshot
        
    Raises:
        Exception: If saving fails
    """
    if not raw_html.strip():
        raise ValueError("Raw HTML cannot be empty")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Compute hash and timestamp (UTC-aware so Track B's ISO 8601 validator accepts it)
        html_hash = compute_sha256(raw_html)
        timestamp = datetime.now(timezone.utc).isoformat()  # e.g. 2026-03-25T17:00:00+00:00
        
        # Insert snapshot
        cursor.execute("""
            INSERT INTO snapshots 
            (competitor_name, page_type, page_url, raw_html, crawl_timestamp, sha256_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (competitor_name, page_type, page_url, raw_html, timestamp, html_hash))
        
        snapshot_id = cursor.lastrowid
        conn.commit()
        
        # Return the saved snapshot as dict
        snapshot = {
            "id": snapshot_id,
            "competitor_name": competitor_name,
            "page_type": page_type,
            "page_url": page_url,
            "raw_html": raw_html,
            "crawl_timestamp": timestamp,
            "sha256_hash": html_hash,
            "created_at": timestamp
        }
        
        logger.info(f"Saved snapshot for {competitor_name} {page_type} (ID: {snapshot_id})")
        return snapshot
        
    except Exception as e:
        logger.error(f"Failed to save snapshot for {competitor_name} {page_type}: {str(e)}")
        raise
    finally:
        conn.close()


def get_latest_snapshot(competitor_name: str, page_type: str) -> Optional[Dict]:
    """
    Get the most recent snapshot for a competitor and page type.
    
    Args:
        competitor_name: Name of the competitor
        page_type: Type of page
        
    Returns:
        Dictionary representing the latest snapshot, or None if not found
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, competitor_name, page_type, raw_html, crawl_timestamp, 
                   sha256_hash, created_at
            FROM snapshots
            WHERE competitor_name = ? AND page_type = ?
            ORDER BY crawl_timestamp DESC
            LIMIT 1
        """, (competitor_name, page_type))
        
        row = cursor.fetchone()
        
        if row:
            snapshot = {
                "id": row[0],
                "competitor_name": row[1],
                "page_type": row[2],
                "raw_html": row[3],
                "crawl_timestamp": row[4],
                "sha256_hash": row[5],
                "created_at": row[6]
            }
            logger.info(f"Found latest snapshot for {competitor_name} {page_type} (ID: {row[0]})")
            return snapshot
        else:
            logger.info(f"No snapshot found for {competitor_name} {page_type}")
            return None
            
    except Exception as e:
        logger.error(f"Failed to get latest snapshot for {competitor_name} {page_type}: {str(e)}")
        raise
    finally:
        conn.close()


def get_snapshot_history(competitor_name: str, page_type: str, limit: int = 10) -> List[Dict]:
    """
    Get the history of snapshots for a competitor and page type.
    
    Args:
        competitor_name: Name of the competitor
        page_type: Type of page
        limit: Maximum number of snapshots to return
        
    Returns:
        List of dictionaries representing snapshot history, ordered by newest first
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, competitor_name, page_type, raw_html, crawl_timestamp,
                   sha256_hash, created_at
            FROM snapshots
            WHERE competitor_name = ? AND page_type = ?
            ORDER BY crawl_timestamp DESC
            LIMIT ?
        """, (competitor_name, page_type, limit))
        
        rows = cursor.fetchall()
        
        snapshots = []
        for row in rows:
            snapshot = {
                "id": row[0],
                "competitor_name": row[1],
                "page_type": row[2],
                "raw_html": row[3],
                "crawl_timestamp": row[4],
                "sha256_hash": row[5],
                "created_at": row[6]
            }
            snapshots.append(snapshot)
        
        logger.info(f"Found {len(snapshots)} snapshots for {competitor_name} {page_type}")
        return snapshots
        
    except Exception as e:
        logger.error(f"Failed to get snapshot history for {competitor_name} {page_type}: {str(e)}")
        raise
    finally:
        conn.close()


def get_all_competitors() -> List[str]:
    """
    Get a list of all competitor names in the database.
    
    Returns:
        List of unique competitor names
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT competitor_name FROM snapshots ORDER BY competitor_name")
        rows = cursor.fetchall()
        
        competitors = [row[0] for row in rows]
        logger.info(f"Found {len(competitors)} competitors in database")
        return competitors
        
    except Exception as e:
        logger.error(f"Failed to get competitors list: {str(e)}")
        raise
    finally:
        conn.close()


async def test():
    """Smoke test for the snapshot module."""
    logger.info("Starting snapshot smoke test...")
    
    try:
        # Initialize database
        init_db()
        
        # Test saving snapshots
        test_html_1 = "<html><body><h1>Test Page 1</h1><p>Some content</p></body></html>"
        test_html_2 = "<html><body><h1>Test Page 2</h1><p>Different content</p></body></html>"
        
        snapshot_1 = save_snapshot("TestCompetitor", "landing", test_html_1)
        snapshot_2 = save_snapshot("TestCompetitor", "pricing", test_html_2)
        
        logger.info(f"Saved snapshots: {snapshot_1['id']}, {snapshot_2['id']}")
        
        # Test retrieving latest snapshot
        latest = get_latest_snapshot("TestCompetitor", "landing")
        if latest:
            logger.info(f"Retrieved latest snapshot: {latest['id']}, hash: {latest['sha256_hash']}")
        else:
            logger.error("Failed to retrieve latest snapshot")
        
        # Test getting history
        history = get_snapshot_history("TestCompetitor", "landing", limit=5)
        logger.info(f"Retrieved history: {len(history)} snapshots")
        
        # Test getting all competitors
        competitors = get_all_competitors()
        logger.info(f"Competitors in database: {competitors}")
        
        logger.info("Snapshot smoke test completed successfully!")
        
    except Exception as e:
        logger.error(f"Snapshot smoke test failed: {str(e)}")
        raise


if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
