# ARIA Backend Setup Guide

This guide will help you set up the ARIA (Adaptive Real-time Intelligence Architecture) backend components for competitive intelligence crawling and analysis.

## Prerequisites

- Python 3.11 or higher
- Git (for cloning the repository)
- Internet connection (for downloading dependencies and crawling websites)

## Installation

### 1. Navigate to the Backend Directory

```bash
cd backend
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `playwright` - Headless browser automation
- `beautifulsoup4` - HTML parsing and cleaning
- `sentence-transformers` - Semantic text analysis
- `torch` - PyTorch for machine learning models
- `lxml` - Fast XML/HTML parser

### 3. Install Playwright Browser

```bash
playwright install chromium
```

This downloads the Chromium browser that Playwright uses for headless crawling.

### 4. Verify Installation

```bash
python -c "import playwright; import sentence_transformers; import sqlite3; print('All dependencies installed successfully!')"
```

## Database Setup

The ARIA backend uses SQLite for data storage. The database file (`aria.db`) will be created automatically in the backend directory when you first run any of the modules.

### Database Structure

The database contains two main tables:

1. **snapshots** - Stores crawled HTML content with metadata
   - `id` - Primary key
   - `competitor_name` - Name of the competitor
   - `page_type` - Type of page (landing, pricing, g2, etc.)
   - `raw_html` - The crawled HTML content
   - `crawl_timestamp` - ISO timestamp when the content was crawled
   - `sha256_hash` - Hash of the HTML content for change detection
   - `created_at` - When the record was created

2. **diffs** - Stores diff analysis results
   - `id` - Primary key
   - `competitor_name` - Name of the competitor
   - `page_type` - Type of page
   - `diff_score` - Semantic distance score (0.0-1.0)
   - `changed_fields` - JSON array of detected changes
   - `diff_summary` - Human-readable summary of changes
   - `crawl_ts` - Timestamp of the newer snapshot
   - `created_at` - When the diff record was created

## Running Tests

Each module includes a smoke test that demonstrates end-to-end functionality. Run these tests to verify everything is working correctly.

### 1. Test the Crawler

```bash
python crawler.py
```

**What it does:**
- Crawls Stripe and Paddle websites (landing, pricing, and G2 pages)
- Cleans the HTML content
- Logs the number of characters retrieved for each page
- Should complete in 30-60 seconds

**Expected output:**
```
2024-XX-XX XX:XX:XX - INFO - Crawling URL: https://stripe.com
2024-XX-XX XX:XX:XX - INFO - Successfully crawled https://stripe.com, HTML length: XXXXX
2024-XX-XX XX:XX:XX - INFO - Crawling URL: https://stripe.com/pricing
...
2024-XX-XX XX:XX:XX - INFO - Crawler smoke test completed successfully!
```

### 2. Test the Snapshot System

```bash
python snapshot.py
```

**What it does:**
- Initializes the SQLite database
- Saves test snapshots for a competitor
- Retrieves the latest snapshot
- Gets snapshot history
- Lists all competitors in the database

**Expected output:**
```
2024-XX-XX XX:XX:XX - INFO - Database initialized successfully
2024-XX-XX XX:XX:XX - INFO - Saved snapshot for TestCompetitor landing (ID: 1)
2024-XX-XX XX:XX:XX - INFO - Saved snapshot for TestCompetitor pricing (ID: 2)
...
2024-XX-XX XX:XX:XX - INFO - Snapshot smoke test completed successfully!
```

### 3. Test the Diff Engine

```bash
python diff_engine.py
```

**What it does:**
- Downloads the sentence transformer model (first run only)
- Crawls real websites (Stripe and Paddle)
- Creates snapshots with slightly different content
- Runs semantic and lexical diff analysis
- Saves diff results to the database

**Expected output:**
```
2024-XX-XX XX:XX:XX - INFO - Loading sentence transformer model...
2024-XX-XX XX:XX:XX - INFO - Successfully loaded model: all-MiniLM-L6-v2
2024-XX-XX XX:XX:XX - INFO - Crawling URL: https://stripe.com
...
2024-XX-XX XX:XX:XX - INFO - Diff result for Stripe:
2024-XX-XX XX:XX:XX - INFO -   - Has changed: True
2024-XX-XX XX:XX:XX - INFO -   - Semantic distance: 0.XXX
2024-XX-XX XX:XX:XX - INFO -   - Changed fields: ['headline', 'content_length']
2024-XX-XX XX:XX:XX - INFO -   - Summary: X lines changed. Key changes detected in: headline, content_length.
...
2024-XX-XX XX:XX:XX - INFO - Diff engine smoke test completed successfully!
```

## File Locations

After running the tests, you'll have these files in your backend directory:

- `aria.db` - SQLite database (created automatically)
- `requirements.txt` - Python dependencies
- `crawler.py` - Web crawling module
- `snapshot.py` - Database storage module  
- `diff_engine.py` - Change detection module
- `SETUP.md` - This setup guide

## Usage Examples

### Basic Crawling

```python
from crawler import crawl_competitors

competitors = [
    {
        "name": "CompetitorA",
        "landing": "https://example.com",
        "pricing": "https://example.com/pricing",
        "g2": "https://www.g2.com/products/example/reviews"
    }
]

results = await crawl_competitors(competitors)
```

### Saving Snapshots

```python
from snapshot import save_snapshot, init_db

init_db()  # Call once at startup

snapshot = save_snapshot(
    competitor_name="CompetitorA",
    page_type="landing", 
    raw_html=html_content
)
```

### Running Diff Analysis

```python
from diff_engine import run_diff_pipeline

diff_result = run_diff_pipeline("CompetitorA", "landing")
print(f"Changes detected: {diff_result['has_changed']}")
print(f"Summary: {diff_result['diff_summary']}")
```

## Troubleshooting

### Common Issues

1. **Playwright browser not found**
   ```bash
   playwright install chromium
   ```

2. **Module not found errors**
   ```bash
   pip install -r requirements.txt
   ```

3. **Permission denied errors**
   - Make sure you have write permissions in the backend directory
   - On Windows, run PowerShell as Administrator if needed

4. **Network timeouts**
   - The crawler has a 30-second timeout per page
   - Slow websites may timeout - this is expected behavior

5. **Sentence transformer download fails**
   - Check your internet connection
   - The model download is ~90MB and only happens on first run

### Logs

All modules use Python's logging module. Logs are written to console and include:
- Timestamp
- Log level (INFO, WARNING, ERROR)
- Module name
- Message

To increase log verbosity, modify the logging level in each module:
```python
logging.basicConfig(level=logging.DEBUG, ...)
```

## Performance Notes

- **First run**: The diff engine will download the sentence transformer model (~90MB)
- **Crawling**: Each page takes 5-15 seconds depending on website complexity
- **Database**: SQLite is fast for this use case, even with thousands of snapshots
- **Memory**: The modules are memory-efficient and clean up resources properly

## Next Steps

Once you've verified all tests pass:

1. Integrate these modules into your main application
2. Set up scheduled crawling (e.g., daily or hourly)
3. Add your own competitor URLs to the crawler
4. Customize the diff detection rules for your specific use case
5. Set up monitoring and alerting for significant changes

## Support

If you encounter issues:

1. Check the logs for detailed error messages
2. Verify all dependencies are installed correctly
3. Ensure you have internet connectivity for crawling
4. Make sure the database file has proper write permissions

The modules are designed to be robust and handle errors gracefully - failed crawls won't crash the system, and missing data is handled appropriately.
