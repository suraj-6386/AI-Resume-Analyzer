# 📄 Smart Resume Analyzer

> A consultant-grade resume analysis tool built with **Python (Flask)** and custom **editorial CSS**. Upload a PDF or plain-text resume and receive a weighted quality score, skill breakdown, impact-verb audit, contact extraction, and actionable suggestions — all in seconds.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Weighted Scoring Engine** | `Score = Σ(S×W) + (K×2) − (D×5)` — section presence, skill count, and duplicate penalty |
| **Contact Extraction** | Regex-powered detection of email, phone, and LinkedIn URL |
| **Section Detector** | Identifies Summary, Experience, Education, Skills, Projects, Certifications |
| **Impact Verb Analysis** | Scans for 50+ power verbs — measures "Action Orientation" |
| **Skill Categorization** | 200+ skills across 10 domains → Hard Skills / Soft Skills |
| **Sub-scores** | Readability · Skill Depth · Action Orientation (each 0–100) |
| **Consultant Suggestions** | Ranked, staggered suggestions with high/medium/low priority |
| **Upload History** | SQLite-powered history to track score improvement over time |
| **Humanized UI** | Instrument Serif + Inter, split-screen upload, masonry report layout |

---

## 🗂 Project Structure

```
Python Project/
├── app.py                  # Flask orchestrator — routes, SQLite, session handling
├── requirements.txt        # Pinned Python dependencies
├── resume_history.db       # SQLite DB (auto-created on first run)
│
├── core/
│   ├── __init__.py
│   └── analyzer.py         # Scoring engine, extraction, NLP, suggestions
│
├── data/
│   └── skills.json         # 200+ skills across 10 domains
│
├── static/
│   └── css/
│       └── editorial.css   # Human-centric design system
│
├── templates/
│   ├── upload.html         # Split-screen drag-and-drop upload page
│   ├── report.html         # Deep-dive analysis report
│   └── history.html        # Upload history tracker
│
└── uploads/                # Uploaded resume files (auto-created)
```

---

## 🚀 New Machine Setup

Follow these steps exactly on a fresh Windows machine.

### 1. Prerequisites

- **Python 3.9+** — [Download here](https://python.org/downloads)
- Confirm with: `python --version`

### 2. Open Terminal in Project Folder

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

# Windows CMD
venv\Scripts\activate.bat
```

> If PowerShell gives an execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### 5. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 6. Fix Upload Folder Permissions (if needed)

```powershell
# Ensure the uploads directory exists and is writable
New-Item -ItemType Directory -Force -Path "uploads"
icacls "uploads" /grant Everyone:F
```

### 7. Run the Development Server

```powershell
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📐 Scoring Algorithm

```
Score = Σ(S_section × W_section) + (K × 2) − (D × 5)
```

| Variable | Meaning |
|---|---|
| `S_section` | 1 if section present, 0 if missing |
| `W_section` | Section weight (Experience=20, Education=15, Skills=15, Projects=10, Certs=10, Summary=5) |
| `K` | Count of unique matched skills (contribution capped at 30 pts) |
| `D` | Duplicate penalty — number of non-trivial words used 5+ times (capped at 10) |

### Grade Bands
| Score | Grade |
|---|---|
| 80–100 | ✅ Excellent |
| 60–79  | 🔵 Good |
| 40–59  | 🟡 Average |
| 0–39   | 🔴 Needs Work |

---

## 🧠 Sub-score Breakdown

| Sub-score | Calculation |
|---|---|
| **Readability** | Section completeness (70%) + Contact info completeness (30%) |
| **Skill Depth** | Unique skills × 2 + Domain breadth × 5 |
| **Action Orientation** | Impact verb density (scaled: 3% density = 100/100) |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Web Framework | Flask 3.0 |
| PDF Extraction | pdfplumber (primary) + PyPDF2 (fallback) |
| Database | SQLite (built-in, no setup required) |
| Fonts | Instrument Serif + Inter (via Google Fonts) |
| Styling | Vanilla CSS (custom design system — `editorial.css`) |
| NLP | Regex + curated lists (no external NLP deps) |

---

## 📋 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Upload page |
| `POST` | `/analyze` | Analyze uploaded resume |
| `GET` | `/report` | View analysis report |
| `GET` | `/history` | View upload history |
| `GET` | `/api/history` | JSON history data |

---

## 🎨 UI Design System

- **Background**: `#F5F0E8` (warm off-white)
- **Ink**: `#1A1A2E` (deep charcoal)
- **Accent**: `#D4A853` (editorial amber)
- **Skills**: Highlighter-stroke CSS badges with `::before` pseudo-element
- **Animations**: `@keyframes fadeSlideUp` with per-card stagger delays
- **Score Gauge**: SVG `stroke-dashoffset` animated via JavaScript

---

## 👨‍💻 Author

Built as a **BCA/MCA academic project** demonstrating full-stack Python web development, NLP-inspired text analysis, and editorial UI design.

---

*ResumeIQ · Smart Resume Analyzer · 2024*
