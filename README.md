# AI Summarizer — Chrome Extension

Summarize web pages, YouTube videos, and text using a locally-hosted deep learning model. No API keys. No cloud services. Runs entirely on your GPU.

## Requirements

- Python 3.10+
- NVIDIA GPU with CUDA support (RTX 3050 tested)
- Deno (https://deno.land)
- Chrome browser

## Setup

### 1. Install Python dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install other dependencies
pip install transformers flask flask-cors beautifulsoup4 requests yt-dlp
```

### 2. Install Deno (required for YouTube)

```powershell
# Windows PowerShell
irm https://deno.land/install.ps1 | iex
```

### 3. Start the server

```bash
python server.py
```

The model downloads on first run (~1.6GB). Subsequent starts load from cache.

### 4. Load the Chrome extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

## Usage

1. Keep the Flask server running (`python server.py`)
2. Click the AI Summarizer icon in Chrome toolbar
3. Choose a summarization mode:
   - **Summarize Current Page**: Works on any webpage
   - **Summarize YouTube Video**: Works on YouTube videos with captions
   - **Summarize Pasted Text**: Paste any text to summarize

## How It Works

The extension sends the current page URL (or pasted text) to a local Flask server. The server extracts text (BeautifulSoup for websites, yt-dlp for YouTube), splits it into chunks that fit BART's input window, runs inference on each chunk using the GPU, and returns the combined summary.

- **Model:** facebook/bart-large-cnn (400M parameters)
- **Precision:** FP16 on GPU (~750MB VRAM)
- **Latency:** 0.3-1s per chunk on RTX 3050

## Limitations

- YouTube videos must have English captions
- Maximum video length: 30 minutes
- JavaScript-rendered pages may not extract text correctly
- Paywalled pages cannot be accessed
