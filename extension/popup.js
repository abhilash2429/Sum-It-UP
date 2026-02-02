const API = 'http://127.0.0.1:5000';
const output = document.getElementById('output');
const healthStatus = document.getElementById('healthStatus');

// ─── Health check on popup open ──────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API}/health`);
    const data = await res.json();
    healthStatus.innerHTML = `<span class="health-ok">${data.backend || 'Server OK'}</span>`;
  } catch {
    healthStatus.innerHTML = '<span class="health-fail">Server not running</span>';
  }
}
checkHealth();

// ─── Utility: display states ─────────────────────────────────
function showLoading(msg) {
  output.innerHTML = `<span class="loading">${msg}</span>`;
}

function showError(msg) {
  output.innerHTML = `<span class="error">❌ Error: ${msg}</span>`;
}

function showSummary(data) {
  // Handle structured JSON response
  if (typeof data === 'string') {
    // Legacy plain text response
    output.innerHTML = `<div class="summary-section"><p>${data}</p></div>`;
    return;
  }

  let html = '';

  // Title
  if (data.title) {
    html += `<h3 class="summary-title">${escapeHtml(data.title)}</h3>`;
  }

  // One-sentence takeaway
  if (data.takeaway) {
    html += `<div class="summary-takeaway">${escapeHtml(data.takeaway)}</div>`;
  }

  // Key points
  if (data.key_points && data.key_points.length > 0) {
    html += `<div class="summary-section">
      <div class="section-label">Key Points</div>
      <ul class="key-points">
        ${data.key_points.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Important details
  if (data.details) {
    html += `<div class="summary-section">
      <div class="section-label">Details</div>
      <p class="summary-details">${escapeHtml(data.details)}</p>
    </div>`;
  }

  // Actionable insights
  if (data.actionable && data.actionable.length > 0) {
    html += `<div class="summary-section">
      <div class="section-label">Actionable Insights</div>
      <ul class="actionable-list">
        ${data.actionable.map(a => `<li>💡 ${escapeHtml(a)}</li>`).join('')}
      </ul>
    </div>`;
  }

  // Limitations
  if (data.limitations && data.limitations.length > 0) {
    html += `<div class="summary-section limitations">
      <div class="section-label">⚠️ Limitations</div>
      <p>${escapeHtml(data.limitations)}</p>
    </div>`;
  }

  output.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Get current tab URL ─────────────────────────────────────
async function getCurrentUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url || '';
}

// ─── Summarize current page ──────────────────────────────────
document.getElementById('btnPage').addEventListener('click', async () => {
  const url = await getCurrentUrl();
  if (!url) { showError('Could not get current page URL'); return; }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    callYoutube(url);
  } else {
    callUrl(url);
  }
});

// ─── Summarize YouTube ───────────────────────────────────────
document.getElementById('btnYoutube').addEventListener('click', async () => {
  const url = await getCurrentUrl();
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    showError('Open a YouTube video first, then click this button.');
    return;
  }
  callYoutube(url);
});

// ─── Summarize pasted text ───────────────────────────────────
document.getElementById('btnText').addEventListener('click', () => {
  const text = document.getElementById('textInput').value.trim();
  if (text.length < 20) {
    showError('Enter at least 20 characters of text.');
    return;
  }
  callText(text);
});

// ─── HTTP request functions ──────────────────────────────────
async function callUrl(url) {
  showLoading('Fetching and summarizing page...');
  try {
    const res = await fetch(`${API}/summarize-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.error) { showError(data.error); }
    else { showSummary(data); }
  } catch {
    showError('Cannot connect to server. Is it running?');
  }
}

async function callYoutube(url) {
  showLoading('Extracting transcript and summarizing...');
  try {
    const res = await fetch(`${API}/summarize-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.error) { showError(data.error); }
    else { showSummary(data); }
  } catch {
    showError('Cannot connect to server. Is it running?');
  }
}

async function callText(text) {
  showLoading('Summarizing text...');
  try {
    const res = await fetch(`${API}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.error) { showError(data.error); }
    else { showSummary(data); }
  } catch {
    showError('Cannot connect to server. Is it running?');
  }
}
