import requests
from bs4 import BeautifulSoup
import psycopg2
import time

# Connect to your database (same settings as main.py)
conn = psycopg2.connect(
    host="localhost",
    database="Matchory",
    user="postgres",
    password="123456"  # <-- change this to your actual password
)
cur = conn.cursor()

# Get all webtoons that have a link but no image_url
cur.execute("SELECT id, title, link FROM webtoons WHERE link IS NOT NULL AND (image_url IS NULL OR image_url = '')")
rows = cur.fetchall()

print(f"Found {len(rows)} webtoons to fetch images for\n")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

success = 0
fail = 0

for i, (wid, title, link) in enumerate(rows):
    try:
        res = requests.get(link, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        # Try og:image meta tag first
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            image_url = og["content"]
            cur.execute("UPDATE webtoons SET image_url = %s WHERE id = %s", (image_url, wid))
            conn.commit()
            success += 1
            print(f"[{i+1}/{len(rows)}] OK: {title}")
        else:
            fail += 1
            print(f"[{i+1}/{len(rows)}] No image found: {title}")

    except Exception as e:
        fail += 1
        print(f"[{i+1}/{len(rows)}] Error: {title} - {e}")

    # Wait 0.5 seconds between requests to be polite
    time.sleep(0.5)

cur.close()
conn.close()

print(f"\nDone! Success: {success}, Failed: {fail}")