/**
 * editor.js
 * =========
 * Real-time intelligence engine for the Smart Resume Editor.
 *
 * Responsibilities:
 *   - Live checklist: detect email, phone, LinkedIn, sections, verbs
 *   - Word/char count display
 *   - Rail stats sync (verb count, word count)
 *   - Unsaved changes indicator
 *   - Download PDF via fetch POST to /download-pdf
 *
 * All analysis is debounced (150ms) to stay CPU-light while typing.
 */

/* ------------------------------------------------------------------ */
/*  Impact Verb List (matches core/analyzer.py)                        */
/* ------------------------------------------------------------------ */
const IMPACT_VERBS = [
  "spearheaded","orchestrated","optimized","architected","engineered",
  "pioneered","transformed","accelerated","amplified","delivered",
  "executed","launched","implemented","developed","designed",
  "led","managed","mentored","supervised","coordinated",
  "collaborated","streamlined","automated","reduced","increased",
  "improved","enhanced","achieved","exceeded","generated",
  "built","created","established","deployed","integrated",
  "migrated","resolved","troubleshot","analyzed","researched",
  "presented","published","authored","trained","negotiated",
  "secured","scaled","refactored","audited","maintained",
];

/* ------------------------------------------------------------------ */
/*  Section keyword map                                                 */
/* ------------------------------------------------------------------ */
const SECTION_PATTERNS = {
  experience:    /\b(experience|work experience|employment|professional experience|internship|career)\b/i,
  education:     /\b(education|academic|qualification|degree|university|college)\b/i,
  skills:        /\b(skills|technical skills|core competencies|technologies|expertise)\b/i,
  projects:      /\b(projects|personal projects|portfolio|key projects)\b/i,
  certifications:/\b(certifications|certificates|awards|achievements|licenses)\b/i,
  summary:       /\b(summary|objective|profile|about me|overview)\b/i,
};

const REGEX_EMAIL    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const REGEX_PHONE    = /(\+?\d[\d\s\-]{6,}\d)/;
const REGEX_LINKEDIN = /linkedin\.com\/in\/[\w\-]+/i;

/* ------------------------------------------------------------------ */
/*  DOM References                                                      */
/* ------------------------------------------------------------------ */
const canvas        = document.getElementById('editorCanvas');
const wordCountEl   = document.getElementById('wordCount');
const charCountEl   = document.getElementById('charCount');
const railVerbsEl   = document.getElementById('railVerbs');
const railWordsEl   = document.getElementById('railWords');
const verbCountDisp = document.getElementById('verbCountDisp');
const verbMeterBar  = document.getElementById('verbMeterBar');
const verbMeterVal  = document.getElementById('verbMeterVal');
const saveIndicator = document.getElementById('saveIndicator');
const saveText      = document.getElementById('saveText');
const downloadStatus= document.getElementById('downloadStatus');

/* ------------------------------------------------------------------ */
/*  Checklist helpers                                                   */
/* ------------------------------------------------------------------ */
function setCheck(id, passed) {
  const item   = document.getElementById(`chk-${id}`);
  const circle = document.getElementById(`chk-${id}-circle`);
  if (!item || !circle) return;
  circle.textContent = passed ? '✓' : '✗';
  item.classList.toggle('check-pass', passed);
  item.classList.toggle('check-fail', !passed);
}

/* ------------------------------------------------------------------ */
/*  Core analysis — runs on every debounced input                      */
/* ------------------------------------------------------------------ */
function analyzeText() {
  const text  = canvas.innerText || '';
  const lower = text.toLowerCase();

  // --- Word & char count ---
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  if (wordCountEl) wordCountEl.textContent = words;
  if (charCountEl) charCountEl.textContent = chars.toLocaleString();
  if (railWordsEl) railWordsEl.textContent = words;

  // --- Contact checks ---
  setCheck('email',    REGEX_EMAIL.test(text));
  setCheck('phone',    REGEX_PHONE.test(text) && (/\d{7,}/.test(text.replace(/\D/g, ''))));
  setCheck('linkedin', REGEX_LINKEDIN.test(text));

  // --- Section checks ---
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    setCheck(key, pattern.test(text));
  }

  // --- Impact verbs ---
  let verbsFound = 0;
  for (const verb of IMPACT_VERBS) {
    const re = new RegExp(`\\b${verb}\\b`, 'i');
    if (re.test(text)) verbsFound++;
  }

  if (verbCountDisp) verbCountDisp.textContent = verbsFound;
  if (railVerbsEl)   railVerbsEl.textContent   = verbsFound;

  // Meter: 10 verbs = 100%
  const verbPct = Math.min(100, Math.round((verbsFound / 10) * 100));
  if (verbMeterBar) verbMeterBar.style.width = verbPct + '%';
  if (verbMeterVal) verbMeterVal.textContent = verbPct + '%';
  setCheck('verbs', verbsFound >= 10);

  // --- Save indicator ---
  if (saveText) {
    saveText.textContent = 'Unsaved changes';
    saveIndicator.classList.add('unsaved');
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

const debouncedAnalyze = debounce(analyzeText, 150);

/* ------------------------------------------------------------------ */
/*  Attach listeners                                                    */
/* ------------------------------------------------------------------ */
if (canvas) {
  canvas.addEventListener('input', debouncedAnalyze);

  // Prevent contenteditable from inserting <div> on enter;
  // use \n instead for cleaner text extraction
  canvas.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  });

  // On paste, strip HTML and paste plain text only
  canvas.addEventListener('paste', e => {
    e.preventDefault();
    const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, plain);
  });
}

/* ------------------------------------------------------------------ */
/*  PDF Download                                                        */
/* ------------------------------------------------------------------ */
async function downloadPDF() {
  const text = canvas ? (canvas.innerText || '').trim() : '';

  if (!text) {
    showDownloadStatus('❌ Editor is empty — please write your resume first.', 'error');
    return;
  }

  // Button feedback
  const btn = document.getElementById('downloadBtn');
  const panelBtn = document.querySelector('.btn-download-panel');
  if (btn)      btn.textContent = '⏳ Generating PDF…';
  if (panelBtn) panelBtn.textContent = '⏳ Generating…';

  showDownloadStatus('⏳ Building your editorial PDF…', 'loading');

  try {
    const response = await fetch('/download-pdf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error');
    }

    // Trigger browser download
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'resume_optimized.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showDownloadStatus('✅ PDF downloaded successfully!', 'success');
    if (saveText) { saveText.textContent = 'PDF downloaded'; saveIndicator.classList.remove('unsaved'); }

  } catch (err) {
    showDownloadStatus(`❌ ${err.message}`, 'error');
  } finally {
    if (btn)      btn.innerHTML = '<span class="btn-download-icon">⬇</span> Download Optimized PDF <span class="btn-download-pulse"></span>';
    if (panelBtn) panelBtn.textContent = '⬇ Download PDF';
  }
}

function showDownloadStatus(msg, type) {
  if (!downloadStatus) return;
  downloadStatus.textContent = msg;
  downloadStatus.className   = `download-status ds-${type}`;
  if (type === 'success') {
    setTimeout(() => { downloadStatus.textContent = ''; downloadStatus.className = 'download-status'; }, 4000);
  }
}

/* ------------------------------------------------------------------ */
/*  Bootstrap: seed the UI from server-side initial state              */
/* ------------------------------------------------------------------ */
(function init() {
  const analysis = window.RESUME_ANALYSIS;
  if (!analysis) return;

  // Seed checklist from last server analysis
  if (analysis.contact) {
    setCheck('email',    !!analysis.contact.email);
    setCheck('phone',    !!analysis.contact.phone);
    setCheck('linkedin', !!analysis.contact.linkedin);
  }
  if (analysis.sections) {
    for (const [sec, present] of Object.entries(analysis.sections)) {
      setCheck(sec, present);
    }
  }
  if (analysis.impact) {
    const count  = analysis.impact.count || 0;
    const pct    = Math.min(100, Math.round((count / 10) * 100));
    if (verbCountDisp) verbCountDisp.textContent = count;
    if (railVerbsEl)   railVerbsEl.textContent   = count;
    if (verbMeterBar)  verbMeterBar.style.width   = pct + '%';
    if (verbMeterVal)  verbMeterVal.textContent   = pct + '%';
    setCheck('verbs', count >= 10);
  }

  // Initial word count
  if (canvas) {
    const words = (canvas.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCountEl) wordCountEl.textContent = words;
    if (railWordsEl) railWordsEl.textContent = words;
    if (charCountEl) charCountEl.textContent = (canvas.innerText || '').length.toLocaleString();
  }

  // Mark save state as fresh
  if (saveText) saveText.textContent = 'Auto-saved on download';
})();
