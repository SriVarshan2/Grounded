import re
import requests
from bs4 import BeautifulSoup
from nltk.tokenize import sent_tokenize
import nltk

nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

HEADERS_LIST = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/605.1.15 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml",
    },
    {
        "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        "Accept": "text/html",
    }
]

def fetch_article(url: str) -> dict:
    if not url.startswith("http"):
        url = "https://" + url

    for headers in HEADERS_LIST:
        try:
            response = requests.get(
                url,
                headers=headers,
                timeout=20,
                allow_redirects=True
            )
            if response.status_code == 200:
                return parse_html(url, response.text)
        except Exception:
            continue

    return {"error": "Could not fetch article from URL"}

def parse_html(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(["script", "style", "nav",
                     "footer", "header", "aside",
                     "form", "button", "iframe"]):
        tag.decompose()

    # Extract links
    links = []
    for a in soup.find_all("a", href=True):
        parent = a.find_parent(["p", "li", "div"])
        surrounding = parent.get_text(strip=True)[:300] if parent else ""
        links.append({
            "href": a["href"],
            "anchor_text": a.get_text(strip=True),
            "surrounding_sentence": surrounding
        })

    # Extract content
    content = ""
    selectors = [
        "article",
        "[role='main']",
        ".article-content",
        ".post-content",
        ".entry-content",
        ".content",
        "main"
    ]
    for selector in selectors:
        el = soup.select_one(selector)
        if el:
            content = el.get_text(separator=" ", strip=True)
            if len(content) > 300:
                break

    if len(content) < 300:
        paragraphs = soup.find_all(["p", "li"])
        content = " ".join(
            p.get_text(separator=" ", strip=True)
            for p in paragraphs
            if len(p.get_text(strip=True)) > 30
        )

    content = re.sub(r'\s+', ' ', content).strip()

    if len(content) < 100:
        return {"error": "Not enough readable content found"}

    # Use nltk for sentence splitting
    sentences = [
        s.strip()
        for s in sent_tokenize(content[:50000])
        if len(s.strip()) > 20
    ]

    return {
        "text": content,
        "sentences": sentences,
        "links": links,
        "url": url
    }
