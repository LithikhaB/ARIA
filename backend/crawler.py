"""
ARIA Crawler Module - Playwright-based async web crawler for competitive intelligence.

This module provides headless browser crawling capabilities with stealth features
to avoid bot detection. It extracts and cleans HTML content from competitor websites.
"""

import asyncio
import logging
import random
from typing import Dict, List, Optional

from playwright.async_api import async_playwright, BrowserContext, Browser, Page
from bs4 import BeautifulSoup, Comment

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User agent rotation for stealth
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


def clean_html(html: str) -> str:
    """
    Clean HTML by removing scripts, styles, navigation, footer, and other non-content elements.
    
    Args:
        html: Raw HTML content
        
    Returns:
        Cleaned HTML containing only main content
    """
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove script and style elements
    for element in soup(['script', 'style', 'noscript', 'iframe', 'object', 'embed']):
        element.decompose()
    
    # Remove common navigation and footer elements
    for selector in [
        'nav', 'header', 'footer', '.nav', '.navigation', '.menu', 
        '.footer', '.header', '.sidebar', '.ads', '.advertisement',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
    ]:
        for element in soup.select(selector):
            element.decompose()
    
    # Remove HTML comments
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    
    # Remove hidden elements
    for element in soup.find_all(attrs={'style': 'display:none'}):
        element.decompose()
    
    # Return the cleaned HTML
    return str(soup)


async def crawl_url(url: str, timeout: int = 30000) -> str:
    """
    Crawl a single URL and return cleaned HTML content.
    
    Args:
        url: URL to crawl
        timeout: Timeout in milliseconds for page load
        
    Returns:
        Cleaned HTML content as string
        
    Raises:
        Exception: If crawling fails
    """
    async with async_playwright() as p:
        browser: Browser = await p.chromium.launch(headless=True)
        
        try:
            # Create context with stealth settings
            context: BrowserContext = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={'width': 1920, 'height': 1080},
                java_script_enabled=True,
                ignore_https_errors=True
            )
            
            # Add stealth headers
            await context.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            })
            
            page: Page = await context.new_page()
            
            # Set timeout and navigate
            page.set_default_timeout(timeout)
            
            logger.info(f"Crawling URL: {url}")
            await page.goto(url, wait_until='networkidle')
            
            # Wait a bit more for dynamic content
            await asyncio.sleep(2)
            
            # Get the HTML content
            html = await page.content()
            
            # Clean the HTML
            cleaned_html = clean_html(html)
            
            logger.info(f"Successfully crawled {url}, HTML length: {len(cleaned_html)}")
            return cleaned_html
            
        except Exception as e:
            logger.error(f"Failed to crawl {url}: {str(e)}")
            raise
        finally:
            await browser.close()


async def crawl_competitors(competitor_urls: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Crawl multiple competitors and their pages.
    
    Args:
        competitor_urls: List of competitor dictionaries with name, landing, pricing, g2 URLs
        
    Returns:
        List of dictionaries with crawled HTML content
        
    Example:
        Input: [{"name": "CompetitorA", "landing": "url", "pricing": "url", "g2": "url"}, ...]
        Output: [{"name": "CompetitorA", "landing_html": "...", "pricing_html": "...", "g2_html": "..."}, ...]
    """
    results = []
    
    for competitor in competitor_urls:
        competitor_result = {"name": competitor["name"]}
        
        # Crawl each page type
        for page_type in ["landing", "pricing", "g2"]:
            url = competitor.get(page_type)
            if url:
                try:
                    html = await crawl_url(url)
                    competitor_result[f"{page_type}_html"] = html
                    competitor_result[f"{page_type}_url"] = url   # ← thread URL through for bridge.py
                except Exception as e:
                    logger.error(f"Failed to crawl {page_type} for {competitor['name']}: {str(e)}")
                    competitor_result[f"{page_type}_html"] = ""
                    competitor_result[f"{page_type}_url"] = ""    # ← keep key present even on failure
            else:
                logger.warning(f"No {page_type} URL provided for {competitor['name']}")
                competitor_result[f"{page_type}_html"] = ""
                competitor_result[f"{page_type}_url"] = ""        # ← always present
        
        results.append(competitor_result)
    
    return results


async def test():
    """Smoke test for the crawler module."""
    logger.info("Starting crawler smoke test...")
    
    test_competitors = [
        {
            "name": "Stripe",
            "landing": "https://stripe.com",
            "pricing": "https://stripe.com/pricing",
            "g2": "https://www.g2.com/products/stripe/reviews"
        },
        {
            "name": "Paddle",
            "landing": "https://paddle.com",
            "pricing": "https://paddle.com/pricing",
            "g2": "https://www.g2.com/products/paddle/reviews"
        }
    ]
    
    try:
        results = await crawl_competitors(test_competitors)
        
        for result in results:
            logger.info(f"Successfully crawled {result['name']}:")
            for page_type in ["landing", "pricing", "g2"]:
                html_key = f"{page_type}_html"
                if html_key in result and result[html_key]:
                    logger.info(f"  - {page_type}: {len(result[html_key])} characters")
                else:
                    logger.warning(f"  - {page_type}: Failed to crawl")
        
        logger.info("Crawler smoke test completed successfully!")
        
    except Exception as e:
        logger.error(f"Crawler smoke test failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(test())
