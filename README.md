# Summa - AI Summarizer

Summa is a powerful Chrome extension that leverages Google's Gemini Flash model to generate concise, structured summaries for web pages, YouTube videos, and arbitrary text. It features a modern, dark-themed UI and a robust Flask backend.

## ✨ Features

- **Summarize Web Pages**: Instantly extract and summarize the main content of any active tab.
- **YouTube Summaries**: Automatically fetches transcripts and generates summaries for YouTube videos (supports auto-generated captions).
- **Text Summarization**: Paste any text snippet to get a quick analysis.
- **Structured Output**: Returns consistent, organized summaries including:
  - 🎯 **Core Takeaway**: A single sentence capturing the essence.
  - 🔑 **Key Points**: Bulleted list of maximum 3-6 critical points.
  - 📝 **Details**: Expanded paragraphs for context.
  - 🚀 **Actionable Insights**: practical steps or learnings.
  - ⚠️ **Limitations**: Notes on potential bias or missing info.
- **Caching**: Smart backend caching to speed up repeated requests.

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Google Gemini API, `yt-dlp` (YouTube), `BeautifulSoup` (Web Scraping).
- **Frontend**: Chrome Extension (Manifest V3), HTML5, CSS3, JavaScript.

## 🚀 Setup Guide

### 1. Backend Setup

The backend handles the AI processing and data fetching.

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd SUM-RISE
    ```

2.  **Create and activate a virtual environment**:
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```bash
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    *Get your API key from [Google AI Studio](https://aistudio.google.com/).*

5.  **Start the Server**:
    ```bash
    python server.py
    ```
    The server will start at `http://127.0.0.1:5000`.

### 2. Extension Setup

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `extension` folder inside this project directory.
5.  The **AI Summarizer** icon should now appear in your browser toolbar.

## 📖 Usage

1.  Ensure the Flask server is running (`python server.py`).
2.  **Web Page**: Navigate to an article, click the extension icon, and select "📄 Summarize Current Page".
3.  **YouTube**: Open a YouTube video, click the extension, and select "▶️ Summarize YouTube Video".
4.  **Text**: Paste text into the text area and click "✍️ Summarize Pasted Text".

## 📦 Deployment (Optional)

The backend includes a `Procfile` for deployment on platforms like Heroku or Render.

```bash
# Example for production run
gunicorn server:app
```

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
