# 📄 Smart Resume Analyzer — Professional Toolkit

> A consultant-grade resume analysis **and optimization** platform built with **Python (Flask)** and custom **editorial CSS**. Upload a PDF or plain-text resume, receive a weighted quality score and AI-guided suggestions, then edit your resume directly in the browser and download a beautifully formatted PDF.

---

## ✨ Feature Overview

| Stage | Feature | Description |
|---|---|---|
| **Stage 1** | Ingestion | Upload PDF or TXT (up to 5 MB) |
| **Stage 2** | Analysis | Weighted scoring, contact extraction, skill matching, impact verbs |
| **Stage 3** | Optimization | Smart Editor — Notion-style canvas with live AI suggestions |
| **Stage 4** | Export | Download an editorial, ATS-safe PDF via fpdf2 |

---

## 🗂 Project Structure

```
Python Project/
├── app.py                  # Flask orchestrator (6 routes + SQLite + PDF export)
├── requirements.txt        # Python dependencies
├── .gitignore              # Excludes venv/, uploads/, *.db
├── README.md               # This file
├── sample_resume.txt       # Quick demo resume
│
├── core/
│   ├── __init__.py
│   ├── analyzer.py         # Scoring engine, extraction, NLP, suggestions
│   └── pdf_builder.py      # fpdf2-based editorial PDF generator
│
├── data/
│   └── skills.json         # 200+ skills across 10 domains
│
├── static/
│   ├── css/
│   │   └── editorial.css   # Human-centric design system (upload + report + editor)
│   └── js/
│       └── editor.js       # Real-time verb/section/contact live analysis
│
├── templates/
│   ├── upload.html         # Split-screen drag-and-drop upload
│   ├── report.html         # Deep-dive analysis report
│   ├── editor.html         # Three-panel Smart Editor
│   └── history.html        # Upload history tracker
│
└── uploads/                # Uploaded resume files (auto-created)
```

---

## 🚀 New Machine Setup

### 1. Prerequisites
- **Python 3.9+** — [Download here](https://python.org/downloads)
- Confirm: `python --version`

### 2. Navigate to Project Folder
```powershell
cd "c:\Users\<YourName>\OneDrive\Desktop\Python Project"
```

### 3. Create Virtual Environment
```powershell
python -m venv venv
```

### 4. Activate Virtual Environment
```powershell
# Windows PowerShell
venv\Scripts\Activate.ps1

# If execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. Install All Dependencies (including PDF generator)
```powershell
pip install -r requirements.txt
```

This installs:
- `Flask` — Web framework
- `pdfplumber` — PDF text extraction (primary)
- `PyPDF2` — PDF extraction (fallback)
- `Werkzeug` — File handling
- `fpdf2` — Editorial PDF generation *(new)*

### 6. Fix Upload Folder Permissions (if needed)
```powershell
New-Item -ItemType Directory -Force -Path "uploads"
icacls "uploads" /grant Everyone:F
```

### 7. Run the Server
```powershell
python app.py
```

Open: **`http://127.0.0.1:5000`**

---

## 📐 Scoring Formula

```
Score = Σ(S_section × W_section) + (K × 2) − (D × 5)
```

| Variable | Meaning |
|---|---|
| `S_section` | 1 if section present, 0 if missing |
| `W_section` | Weight: Experience=20, Education=15, Skills=15, Projects=10, Certs=10, Summary=5 |
| `K` | Unique matched skills (contribution capped at 30 pts) |
| `D` | Duplicate penalty — words repeated 5+ times (max 10) |

### Sub-scores
| Sub-score | Calculation |
|---|---|
| **Readability** | Section completeness (70%) + Contact completeness (30%) |
| **Skill Depth** | Unique skills × 2 + Domain count × 5 |
| **Action Orientation** | Impact verb density (3% = 100/100) |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Web Framework | Flask 3.0 |
| PDF Extraction | pdfplumber + PyPDF2 |
| PDF Generation | **fpdf2 2.8+** |
| Database | SQLite (built-in) |
| Fonts | Instrument Serif + Inter (Google Fonts) |
| Styling | Vanilla CSS (editorial.css) |
| Editor JS | Vanilla JS (`editor.js`) — zero dependencies |

---

## 📋 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Upload page |
| `POST` | `/analyze` | Analyze uploaded resume |
| `GET` | `/report` | Analysis report |
| `GET` | `/editor` | Smart Editor (with live suggestions) |
| `POST` | `/download-pdf` | Generate & download PDF from edited text |
| `GET` | `/history` | Upload history |
| `GET` | `/api/history` | JSON history data |

---

## 🎨 Smart Editor Features

- **A4 Canvas**: White paper surface with page shadow, amber caret, `contenteditable`
- **Live Checklist**: Updates every 150ms — email, phone, LinkedIn, 6 sections, verb count
- **Impact Verb Meter**: Animated progress bar tracking verbs / 10 target
- **Download PDF**: Calls `/download-pdf` via `fetch`, triggers browser download
- **Section Rail**: Score summary, live word/verb stats, navigation links

---

*ResumeIQ · Smart Resume Analyzer + Editor · 2024*
