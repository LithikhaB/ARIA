"""
Full pipeline test using successfully crawled content.
"""

import asyncio
import logging
from crawler import crawl_url
from snapshot import init_db, save_snapshot, get_latest_snapshot
from diff_engine import run_diff_pipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_full_pipeline():
    """Test the complete ARIA pipeline with real crawled data."""
    logger.info("=== ARIA Full Pipeline Test ===")
    
    # Initialize database
    init_db()
    
    # Test with a simpler URL that's more likely to succeed
    test_url = "https://example.com"
    
    try:
        # Step 1: Crawl
        logger.info("Step 1: Crawling...")
        html1 = await crawl_url(test_url)
        logger.info(f"Crawled {len(html1)} characters")
        
        # Step 2: Save first snapshot
        logger.info("Step 2: Saving first snapshot...")
        snapshot1 = save_snapshot("TestCompany", "landing", html1)
        logger.info(f"Saved snapshot ID: {snapshot1['id']}")
        
        # Step 3: Create slightly modified content
        html2 = html1.replace("<title>Example Domain</title>", "<title>Modified Example Domain</title>")
        
        # Step 4: Save second snapshot
        logger.info("Step 3: Saving second snapshot...")
        snapshot2 = save_snapshot("TestCompany", "landing", html2)
        logger.info(f"Saved snapshot ID: {snapshot2['id']}")
        
        # Step 5: Run diff analysis
        logger.info("Step 4: Running diff analysis...")
        diff_result = run_diff_pipeline("TestCompany", "landing")
        
        logger.info("=== Diff Results ===")
        logger.info(f"Has changed: {diff_result['has_changed']}")
        logger.info(f"Semantic distance: {diff_result['semantic_distance']:.3f}")
        logger.info(f"Changed fields: {diff_result['changed_fields']}")
        logger.info(f"Summary: {diff_result['diff_summary']}")
        
        logger.info("=== Full Pipeline Test Completed Successfully! ===")
        
    except Exception as e:
        logger.error(f"Pipeline test failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
