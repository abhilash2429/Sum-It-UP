import os
import hashlib
import requests
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import yt_dlp
from dotenv import load_dotenv
import google.generativeai as genai

# ─── Load environment variables ──────────────────────────────
load_dotenv()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env file")

# ─── Configure Gemini ────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-flash-latest')
print("Gemini API configured (gemini-flash-latest)")

# ─── App and CORS ────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ─── Summarization Prompt ────────────────────────────────────
SYSTEM_PROMPT = """You are a summarization engine. Not a chatbot.
Output ONLY in this exact JSON format, no deviations:

{
  "title": "[inferred title, max 10 words]",
  "takeaway": "[single sentence, core insight]",
  "key_points": ["point 1", "point 2", "point 3"],
  "details": "[1-2 paragraphs expanding on key points]",
  "actionable": ["insight 1", "insight 2"] or [],
  "limitations": "[notes on bias/limitations]" or ""
}

Rules:
- Output ONLY valid JSON, nothing else
- No meta commentary, disclaimers, or source references
- Prioritize claims and concepts over examples
- Compress aggressively without hallucinating
- 3-6 key points maximum
- If no actionable insights, use empty array []
- If no limitations, use empty string ""
"""

# ─── Caching layer ───────────────────────────────────────────
_summary_cache = {}

def gemini_summarize(text):
    """Call Gemini API to generate structured summary."""
    cache_key = hashlib.md5(text.encode()).hexdigest()
    if cache_key in _summary_cache:
        return _summary_cache[cache_key]
    
    # Truncate very long texts (Gemini has 1M context but we want speed)
    if len(text) > 30000:
        text = text[:30000] + "..."
    
    prompt = f"{SYSTEM_PROMPT}\n\nContent to summarize:\n{text}"
    
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if raw_text.startswith('```'):
            raw_text = re.sub(r'^```json?\n?', '', raw_text)
            raw_text = re.sub(r'\n?```$', '', raw_text)
        
        summary_data = json.loads(raw_text)
        
        # Cache it
        if len(_summary_cache) < 100:
            _summary_cache[cache_key] = summary_data
        
        return summary_data
    except json.JSONDecodeError:
        # Fallback: return raw text as details
        return {
            "title": "Summary",
            "takeaway": "See details below.",
            "key_points": [],
            "details": raw_text,
            "actionable": [],
            "limitations": ""
        }
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

# ─── Web page text extraction ────────────────────────────────
def fetch_url_text(url):
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; SummarizBot/1.0)'}
    try:
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
    except requests.Timeout:
        raise Exception("Website took too long to respond (15s timeout)")
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch URL: {str(e)}")

    soup = BeautifulSoup(response.content, 'html.parser')
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    text = soup.get_text(separator=' ', strip=True)
    if not text or len(text) < 100:
        raise Exception("No meaningful text found on this page (may be paywalled or JavaScript-rendered)")
    return text

# ─── YouTube transcript extraction ───────────────────────────
def fetch_youtube_transcript(url):
    ydl_opts = {
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.DownloadError as e:
        raise Exception(f"yt-dlp failed: {str(e)}. If you see 'JS runtime' errors, ensure Deno is installed.")

    # Duration check: 30 minutes = 1800 seconds
    duration = info.get('duration', 0)
    if duration > 1800:
        raise Exception(f"Video is {duration // 60} minutes long. Maximum is 30 minutes.")

    # Try manual subtitles first (higher quality), then auto-generated
    subtitle_source = None
    if 'subtitles' in info and 'en' in info.get('subtitles', {}):
        subtitle_source = info['subtitles']['en']
    elif 'automatic_captions' in info and 'en' in info.get('automatic_captions', {}):
        subtitle_source = info['automatic_captions']['en']

    if not subtitle_source:
        raise Exception("No English captions found. Video needs manual or auto-generated English subtitles.")

    # Find a subtitle URL and fetch it
    sub_url = None
    for sub in subtitle_source:
        if sub.get('ext') in ('vtt', 'srv1', 'srv2', 'srv3', 'json3'):
            sub_url = sub.get('url')
            break
    
    if not sub_url:
        raise Exception("Could not find subtitle URL.")

    # Fetch and parse subtitles
    try:
        sub_response = requests.get(sub_url, timeout=15)
        sub_content = sub_response.text
    except Exception as e:
        raise Exception(f"Failed to fetch subtitles: {str(e)}")

    # Parse VTT/SRT content - extract just the text
    text_parts = []
    lines = sub_content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip timestamp lines, headers, and metadata
        if re.match(r'^\d{2}:\d{2}', line):
            continue
        if line.startswith('NOTE') or line == 'WEBVTT' or '-->' in line:
            continue
        if re.match(r'^\d+$', line):
            continue
        # Remove HTML tags
        line = re.sub(r'<[^>]+>', '', line)
        if line:
            text_parts.append(line)

    if not text_parts:
        raise Exception("Captions exist but contain no extractable text.")

    return ' '.join(text_parts)

# ─── API Endpoints ───────────────────────────────────────────

@app.route('/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get('text', '')
    if not text or len(text.strip()) < 20:
        return jsonify({'error': 'Text must be at least 20 characters'}), 400
    try:
        summary = gemini_summarize(text)
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/summarize-url', methods=['POST'])
def summarize_url():
    data = request.get_json()
    url = data.get('url', '')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    try:
        text = fetch_url_text(url)
        summary = gemini_summarize(text)
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/summarize-youtube', methods=['POST'])
def summarize_youtube():
    data = request.get_json()
    url = data.get('url', '')
    if not url or ('youtube.com' not in url and 'youtu.be' not in url):
        return jsonify({'error': 'Invalid YouTube URL'}), 400
    try:
        transcript = fetch_youtube_transcript(url)
        summary = gemini_summarize(transcript)
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'gemini-flash-latest',
        'backend': 'Gemini API'
    })

# ─── Run ──────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
