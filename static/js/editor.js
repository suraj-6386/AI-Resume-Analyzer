/**
 * editor.js
 * =========
 * Intelligence engine for the Smart Resume Editor.
 *
 * Works alongside the CodeMirror 6 editor mounted in editor.html.
 * Text is read via window.cmGetText() which CM exposes after mount.
 *
 * Responsibilities:
 *   - Live checklist: email, phone, LinkedIn, sections, impact verbs
 *   - Word/char count display
 *   - Rail stats sync
 *   - Unsaved changes indicator + toolbar badge
 *   - PDF download via POST /download-pdf
 *   - Toolbar helpers: cmSave(), cmCopy(), cmToggleHighlight()
 *
 * CM events: listens to 'cm-ready' and 'cm-change' custom events.
 */

'use strict';

/* ------------------------------------------------------------------ */
/*  Data: Impact Verbs  (must match core/analyzer.py)                 */
/* ------------------------------------------------------------------ */
const IMPACT_VERBS = [
  'spearheaded', 'orchestrated', 'optimized', 'architected', 'engineered',
  'pioneered', 'transformed', 'accelerated', 'amplified', 'delivered',
  'executed', 'launched', 'implemented', 'developed', 'designed',
  'led', 'managed', 'mentored', 'supervised', 'coordinated',
  'collaborated', 'streamlined', 'automated', 'reduced', 'increased',
  'improved', 'enhanced', 'achieved', 'exceeded', 'generated',
  'built', 'created', 'established', 'deployed', 'integrated',
  'migrated', 'resolved', 'troubleshot', 'analyzed', 'researched',
  'presented', 'published', 'authored', 'trained', 'negotiated',
  'secured', 'scaled', 'refactored', 'audited', 'maintained',
];

/* ------------------------------------------------------------------ */
/*  Data: Section patterns                                              */
/* ------------------------------------------------------------------ */
const SECTION_PATTERNS = {
  experience: /\b(experience|work experience|employment|professional experience|internship|career)\b/i,
  education: /\b(education|academic|qualification|degree|university|college)\b/i,
  skills: /\b(skills|technical skills|core competencies|technologies|expertise)\b/i,
  projects: /\b(projects|personal projects|portfolio|key projects)\b/i,
  certifications: /\b(certifications|certificates|awards|achievements|licenses)\b/i,
  summary: /\b(summary|objective|profile|about me|overview)\b/i,
};

const REGEX_EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const REGEX_PHONE = /(\+?\d[\d\s\-]{6,}\d)/;
const REGEX_LINKEDIN = /linkedin\.com\/in\/[\w\-]+/i;

/* ------------------------------------------------------------------ */
/*  DOM references                                                     */
/* ------------------------------------------------------------------ */
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const railVerbsEl = document.getElementById('railVerbs');
const railWordsEl = document.getElementById('railWords');
const verbCountDisp = document.getElementById('verbCountDisp');
const verbMeterBar = document.getElementById('verbMeterBar');
const verbMeterVal = document.getElementById('verbMeterVal');
const saveIndicator = document.getElementById('saveIndicator');
const saveText = document.getElementById('saveText');
const downloadStatus = document.getElementById('downloadStatus');

/* ------------------------------------------------------------------ */
/*  Checklist helpers                                                   */
/* ------------------------------------------------------------------ */
function setCheck(id, passed) {
  const item = document.getElementById(`chk-${id}`);
  const circle = document.getElementById(`chk-${id}-circle`);
  if (!item || !circle) return;
  circle.textContent = passed ? '✓' : '✗';
  item.classList.toggle('check-pass', passed);
  item.classList.toggle('check-fail', !passed);
}

/* ------------------------------------------------------------------ */
/*  Core analysis — runs on every debounced content change             */
/* ------------------------------------------------------------------ */
function analyzeText(text) {
  text = text || '';

  // Word & char count
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  if (wordCountEl) wordCountEl.textContent = words;
  if (charCountEl) charCountEl.textContent = chars.toLocaleString();
  if (railWordsEl) railWordsEl.textContent = words;

  // Contact checks
  setCheck('email', REGEX_EMAIL.test(text));
  setCheck('phone', REGEX_PHONE.test(text) && /\d{7,}/.test(text.replace(/\D/g, '')));
  setCheck('linkedin', REGEX_LINKEDIN.test(text));

  // Section checks
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    setCheck(key, pattern.test(text));
  }

  // Impact verbs
  let verbsFound = 0;
  for (const verb of IMPACT_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) verbsFound++;
  }

  if (verbCountDisp) verbCountDisp.textContent = verbsFound;
  if (railVerbsEl) railVerbsEl.textContent = verbsFound;

  const verbPct = Math.min(100, Math.round((verbsFound / 10) * 100));
  if (verbMeterBar) verbMeterBar.style.width = verbPct + '%';
  if (verbMeterVal) verbMeterVal.textContent = verbPct + '%';
  setCheck('verbs', verbsFound >= 10);

  // Unsaved state
  if (saveText) saveText.textContent = 'Unsaved changes';
  if (saveIndicator) saveIndicator.classList.add('unsaved');

  const badge = document.getElementById('autoSaveBadge');
  if (badge) {
    badge.textContent = '\u25cf Unsaved';
    badge.classList.remove('saved');
    badge.classList.add('modified');
  }
}

/* ------------------------------------------------------------------ */
/*  Debounce utility                                                   */
/* ------------------------------------------------------------------ */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedAnalyze = debounce((text) => analyzeText(text), 180);

/* ------------------------------------------------------------------ */
/*  Wire CM change events                                              */
/* ------------------------------------------------------------------ */
document.addEventListener('cm-change', (e) => {
  debouncedAnalyze(e.detail.text);
});

/* ------------------------------------------------------------------ */
/*  PDF Download                                                        */
/* ------------------------------------------------------------------ */
async function downloadPDF() {
  // Get text from CM editor; fall back gracefully if CM not yet ready
  const text = (typeof window.cmGetText === 'function')
    ? window.cmGetText().trim()
    : '';

  if (!text) {
    showDownloadStatus('❌ Editor is empty — please write your resume first.', 'error');
    return;
  }

  const btn = document.getElementById('downloadBtn');
  const panelBtn = document.querySelector('.btn-download-panel');
  if (btn) btn.textContent = '⏳ Generating PDF…';
  if (panelBtn) panelBtn.textContent = '⏳ Generating…';

  showDownloadStatus('⏳ Building your editorial PDF…', 'loading');

  try {
    const response = await fetch('/download-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || 'Server error');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'resume_optimized.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);

    showDownloadStatus('✅ PDF downloaded successfully!', 'success');
    if (saveText) saveText.textContent = 'PDF downloaded';
    if (saveIndicator) saveIndicator.classList.remove('unsaved');

    const badge = document.getElementById('autoSaveBadge');
    if (badge) {
      badge.textContent = '\u25cf Saved';
      badge.classList.remove('modified');
      badge.classList.add('saved');
    }

  } catch (err) {
    showDownloadStatus(`❌ ${err.message}`, 'error');
  } finally {
    if (btn) btn.innerHTML = '<span class="btn-download-icon">⬇</span> Download Optimized PDF <span class="btn-download-pulse"></span>';
    if (panelBtn) panelBtn.textContent = '⬇ Download PDF';
  }
}

function showDownloadStatus(msg, type) {
  if (!downloadStatus) return;
  downloadStatus.textContent = msg;
  downloadStatus.className = `download-status ds-${type}`;
  if (type === 'success') {
    setTimeout(() => { downloadStatus.textContent = ''; downloadStatus.className = 'download-status'; }, 4000);
  }
}

/* ------------------------------------------------------------------ */
/*  Toolbar action helpers (called from HTML onclick)                  */
/* ------------------------------------------------------------------ */

// window.cmUndo / cmRedo / cmSelectAll are bound by the ESM module.

function cmSave() {
  const text = typeof window.cmGetText === 'function' ? window.cmGetText() : '';
  // Mark as saved in UI
  if (saveText) saveText.textContent = 'Snapshot saved';
  if (saveIndicator) saveIndicator.classList.remove('unsaved');
  const badge = document.getElementById('autoSaveBadge');
  if (badge) {
    badge.textContent = '\u25cf Saved';
    badge.classList.remove('modified');
    badge.classList.add('saved');
  }
  // Persist to localStorage as a safety net
  if (text) {
    try { localStorage.setItem('resumeiq_snapshot', text); } catch (_) { }
  }
}

async function cmCopy() {
  const text = typeof window.cmGetText === 'function' ? window.cmGetText() : '';
  try {
    await navigator.clipboard.writeText(text);
    // Brief UI feedback
    const btn = document.querySelector('[title="Copy all text to clipboard"]');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
      setTimeout(() => { btn.innerHTML = orig; }, 1500);
    }
  } catch (_) { }
}

function cmToggleHighlight(btn) {
  const enabled = btn.classList.toggle('active');
  if (typeof window.cmSetHighlight === 'function') {
    // active class means it's ON (class was just added)
    window.cmSetHighlight(enabled);
  }
}

// Make toolbar functions global
window.downloadPDF = downloadPDF;
window.cmSave = cmSave;
window.cmCopy = cmCopy;
window.cmToggleHighlight = cmToggleHighlight;

/* ------------------------------------------------------------------ */
/*  Bootstrap: seed UI from server-side analysis on CM ready          */
/* ------------------------------------------------------------------ */
function bootstrap() {
  const analysis = window.RESUME_ANALYSIS;
  if (!analysis) return;

  // Seed checklist from last server analysis
  if (analysis.contact) {
    setCheck('email', !!analysis.contact.email);
    setCheck('phone', !!analysis.contact.phone);
    setCheck('linkedin', !!analysis.contact.linkedin);
  }
  if (analysis.sections) {
    for (const [sec, present] of Object.entries(analysis.sections)) {
      setCheck(sec, present);
    }
  }
  if (analysis.impact) {
    const count = analysis.impact.count || 0;
    const pct = Math.min(100, Math.round((count / 10) * 100));
    if (verbCountDisp) verbCountDisp.textContent = count;
    if (railVerbsEl) railVerbsEl.textContent = count;
    if (verbMeterBar) verbMeterBar.style.width = pct + '%';
    if (verbMeterVal) verbMeterVal.textContent = pct + '%';
    setCheck('verbs', count >= 10);
  }

  // Initial word / char count from CM content
  const text = typeof window.cmGetText === 'function' ? window.cmGetText() : (window.ORIGINAL_TEXT || '');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (wordCountEl) wordCountEl.textContent = words;
  if (railWordsEl) railWordsEl.textContent = words;
  if (charCountEl) charCountEl.textContent = text.length.toLocaleString();

  // Reset status indicators
  if (saveText) saveText.textContent = 'Ready to edit';
  const badge = document.getElementById('autoSaveBadge');
  if (badge) {
    badge.textContent = '\u25cf Ready';
    badge.classList.remove('modified', 'saved');
  }
}

// If CM is already ready (synchronous case), run now; otherwise wait.
if (typeof window.cmView !== 'undefined') {
  bootstrap();
} else {
  document.addEventListener('cm-ready', bootstrap, { once: true });
}
