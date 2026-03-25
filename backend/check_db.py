import sqlite3

conn = sqlite3.connect('aria.db')
cursor = conn.cursor()

print("=== ARIA Database Status ===")

# Check snapshots
cursor.execute('SELECT competitor_name, page_type, COUNT(*) as snapshots FROM snapshots GROUP BY competitor_name, page_type')
print("\nSnapshots:")
for row in cursor.fetchall():
    print(f"  {row[0]} - {row[1]}: {row[2]} snapshots")

# Check diffs
cursor.execute('SELECT competitor_name, page_type, diff_summary FROM diffs')
print("\nDiffs:")
for row in cursor.fetchall():
    print(f"  {row[0]} - {row[1]}: {row[2]}")

print(f"\nDatabase file: aria.db")
print(f"Total snapshots: {cursor.execute('SELECT COUNT(*) FROM snapshots').fetchone()[0]}")
print(f"Total diffs: {cursor.execute('SELECT COUNT(*) FROM diffs').fetchone()[0]}")

conn.close()
