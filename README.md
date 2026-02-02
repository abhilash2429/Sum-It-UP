# Summa - Your Intelligent Web Companion

Let's face it: the internet is noisy. We drown in 20-minute videos that could be 5-minute reads, and 2,000-word articles that bury the lede.

**Summa** solves this. It's a Chrome extension that sits quietly in your browser and, with one click, distills the noise into signal. Whether you're watching a YouTube tutorial, reading a technical documentation, or just trying to make sense of a long email, Summa uses Google's Gemini Flash model to give you exactly what you need to know—instantly.

---

## ⚡ What Makes This Different?

Most summarizers just shrink text. Summa *understands* it. We don't just give you a shorter paragraph; we return a **structured intelligence report** for every piece of content.

### 1. Smart YouTube Summarization
Stop scrubbing through video timelines.
- **Automatic Transcript Extraction**: We pull the subtitles directly (prioritizing manual captions over auto-generated ones for accuracy).
- **Context Awareness**: Efficiently handles videos up to 30 minutes long.
- **No Extra Steps**: Just browse to the video and click "Summarize YouTube". The extension knows you're there.

### 2. Intelligent Page Scraping 
- **Clutter Freeing**: We strip away the ads, the nav bars, and the sidebars to send only the core content to the AI.
- **Smart Routing**: If you click "Summarize Page" while on YouTube, we automatically switch to video mode. You don't have to think about it.

### 3. The "Deep-Dive" Structure
We don't output a wall of text. Every summary is broken down into:
- **🎯 Core Takeaway**: The "TL;DR" in one single, powerful sentence.
- **🔑 Key Points**: The 3-6 critical facts you actually need.
- **📝 Detailed Breakdown**: A few paragraphs adding necessary context to the key points.
- **🚀 Actionable Insights**: Things you can actually *do* with this information.
- **⚠️ Limitations**: An honest assessment of what might be missing or biased in the source content.

---

## 🛠️ The Technology Stack

We built this with performance and simplicity in mind.

- **Frontend**: A minimal, dark-mode Chrome Extension (Manifest V3) that respects your battery and memory.
- **Backend API**: A Python Flask server that handles the heavy lifting.
- **AI Brain**: Google's **Gemini 1.5 Flash** (via `google-generativeai` library)—chosen for its extreme speed and large context window.
- **Extraction**: `yt-dlp` for robust video data and `BeautifulSoup4` for clean HTML parsing.

---

## 🚀 Getting Started

Since this runs on your own local server (for maximum control), setup takes about 2 minutes.

### Step 1: Fire up the Backend
1.  Clone this repo:
    ```bash
    git clone https://github.com/abhilash2429/Summa.git
    cd Summa
    ```
2.  Create your environment (optional but recommended):
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    ```
3.  Install the goods:
    ```bash
    pip install -r requirements.txt
    ```
4.  Adding your Key:
    Create a `.env` file in the root folder and add your Gemini Key:
    ```
    GEMINI_API_KEY=AIzaSy...
    ```
    *(Don't have one? Get it free at [Google AI Studio](https://aistudio.google.com/))*

5.  Run it:
    ```bash
    python server.py
    ```
    You'll see `Running on http://127.0.0.1:5000`. Keep this terminal open!

### Step 2: Load the Extension
1.  Open Chrome and go to `chrome://extensions`.
2.  Toggle **Developer mode** (top right switch).
3.  Click **Load unpacked**.
4.  Select the `extension` folder inside this project.
5.  Pin the **Summa** icon to your toolbar. You're done!

---

## � Future Roadmap

We are just getting started. Here is what is coming next:
- [ ] **History & Bookmarks**: Save your best summaries for later.
- [ ] **PDF Support**: Drag and drop papers to summarize them.
- [ ] **Chat-to-Page**: Ask follow-up questions about the specific content (e.g., "What did he say about the pricing model?").

---

## 🤝 Contributing

Found a bug? Want to add a feature?
Fork it, fix it, and send a Pull Request. We love seeing what you build.

**License**: MIT
