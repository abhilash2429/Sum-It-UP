# SUM-RISE

## Overview

SUM-RISE is a Chrome extension paired with a Flask backend that summarizes web content using Google's Gemini API. I built this to handle web pages, YouTube videos, and arbitrary text. It supports conversational follow-up questions and provides clean, factual summaries without promotional fluff.

The primary use case is consuming content faster. If you read a lot of documentation, watch tutorial videos, or need to extract key points from articles, this tool does that work for you.

## Features

- Summarizes web pages, YouTube videos (via URL), and custom text
- Four summary length presets (S, M, L, XL) that adjust output detail
- YouTube processing with two paths: pulls automatic captions first, falls back to Whisper audio transcription if captions are unavailable
- Follow-up questions on summaries (capped at 3 per session)
- Chrome side panel UI with persistent state across browser restarts
- Markdown-formatted summaries with automatic heading extraction
- JSON export for summaries
- In-memory caching to reduce redundant API calls
- Included utility scripts for committing files to GitHub one at a time

## Repository Structure

```
.
├── extension/              Chrome extension (Manifest V3)
│   ├── manifest.json       Extension config
│   ├── sidepanel.html      UI markup
│   ├── sidepanel.js        Frontend logic
│   ├── background.js       Service worker to open side panel
│   └── icons/              Extension icons
├── server.py               Flask API server
├── requirements.txt        Python dependencies
├── .env                    API key storage (not tracked)
├── github_committer.py     Single-file GitHub commit utility
├── batch_commit.py         Script to commit all tracked files individually
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Google Chrome
- FFmpeg (for YouTube audio extraction)
- CUDA-compatible GPU (optional, speeds up Whisper transcription)

### Backend

1. Install dependencies:
```powershell
pip install -r requirements.txt
```

2. Create a `.env` file in the project root:
```
GEMINI_API_KEY=your_api_key_here
```

3. Start the server:
```powershell
py server.py
```

The server runs on `http://127.0.0.1:5000`.

### Extension

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory
5. Pin the extension to your toolbar

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Required. Must have access to `gemini-2.5-flash-lite`.

### Backend Settings

Defined in `server.py`:

- Model: `gemini-2.5-flash-lite` (line 27)
- Whisper model: `base`, auto-detects CUDA or CPU (line 33)
- Max video duration: 30 minutes (line 412)
- Input truncation: 30,000 characters (line 226)
- Cache limits: 100 summaries, 50 transcriptions (lines 257, 379)

### Extension Settings

Defined in `extension/sidepanel.js`:

- API endpoint: `http://127.0.0.1:5000` (line 5)
- Follow-up question limit: 3 (line 6)
- Font size range: 12px to 24px (lines 460, 468)
- Default summary length: Medium (line 15)

## Usage

### Running Locally

1. Start the Flask server (must be running first):
```powershell
py server.py
```

2. Open the extension side panel in Chrome

3. Choose a source:
   - **Current Page**: Summarize the active tab
   - **Enter URL**: Provide a custom URL
   - **YouTube Video**: Summarize a YouTube video
   - **Custom Text**: Paste text directly

4. Adjust length (S/M/L/XL) and font size as needed

5. Click the action button

6. Ask up to 3 follow-up questions about the summary

### API Endpoints

- `POST /summarize` - Text summarization
  - Body: `{text: string, length: "S"|"M"|"L"|"XL"}`
  
- `POST /summarize-url` - Web page summarization
  - Body: `{url: string, length: "S"|"M"|"L"|"XL"}`
  
- `POST /summarize-youtube` - YouTube video summarization
  - Body: `{url: string, length: "S"|"M"|"L"|"XL"}`
  
- `POST /follow-up` - Follow-up question
  - Body: `{question: string, context: string, history: array}`
  
- `GET /health` - Health check

### Example

```javascript
const response = await fetch('http://127.0.0.1:5000/summarize-youtube', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=example',
    length: 'M'
  })
});

const data = await response.json();
console.log(data.heading, data.summary);
```

## Development

### Running in Dev Mode

The Flask server runs in debug mode by default:

```powershell
py server.py
```

This enables auto-reload and detailed error output (line 634).

### Code Organization

**Backend (`server.py`)**:
- Lines 42-200: Prompt engineering for professional, ad-free summaries
- Lines 218-262: Gemini API calls with caching
- Lines 305-501: YouTube transcript extraction with Whisper fallback
- Lines 505-622: Flask endpoints

**Frontend (`extension/sidepanel.js`)**:
- Lines 13-22: State management
- Lines 68-100: Chrome storage persistence
- Lines 245-395: API communication
- Lines 408-539: Event handling

### Testing

No automated tests are present. The following test scripts exist locally but are excluded from version control per `.gitignore`:
- `test_audio_download.py`
- `test_implementation.py`
- `test_model.py`
- `test_whisper.py`

## Deployment

### Production Setup

`.gitignore` excludes:
- Virtual environments (`venv/`, `env/`)
- Environment variables (`.env`)
- Internal design docs (`V1.md`, `V2.md`, `v3.md`, `ytaddon.md`)

### Artifacts

- Backend: `requirements.txt` includes `gunicorn` for production WSGI serving (line 8)
- Extension: `extension/` directory is ready for Chrome Web Store submission
- Icons provided in three sizes (16px, 48px, 128px)

### Deployment Notes

- Backend needs a persistent HTTP endpoint accessible to the extension
- Extension manifest currently points to `http://127.0.0.1:5000/*` (line 23)
- For production, update `API_BASE` in `sidepanel.js` (line 5) and `host_permissions` in `manifest.json` (line 23)

## Limitations and Assumptions

### Functional Constraints

- YouTube videos over 30 minutes are rejected (line 412)
- Text over 30,000 characters is truncated (line 226)
- Follow-up questions limited to 3 per session (line 6, `sidepanel.js`)
- Caching is in-memory only, clears on server restart (lines 204-205)
- No persistent storage for summaries or history
- FFmpeg must be installed for audio transcription, but this is not validated at startup

### Environmental Requirements

- Flask server runs on localhost port 5000
- Extension expects local backend, not a remote service
- Gemini API key must have quota for `gemini-2.5-flash-lite`
- Whisper GPU acceleration requires CUDA setup
- YouTube caption extraction fails if videos have no English captions or captions are disabled
- Web scraping assumes standard HTML (JavaScript-rendered or paywalled pages may fail, noted at line 300)


