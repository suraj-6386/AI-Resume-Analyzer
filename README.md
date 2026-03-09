# ATS Optimizer Pro

> High-Accuracy (90%+) Resume Analysis & Optimization Suite built with Python (Flask) and AI-powered semantic analysis.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.9+-green)
![License](https://img.shields.io/badge/License-MIT-orange)

A consultant-grade resume analysis platform that uses AI and semantic embeddings to provide 90%+ accuracy in matching resumes to job descriptions. Features an expandable dashboard, smart editor, and comprehensive ATS scoring.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Deep Contextual Analysis** | Analyze resumes against specific job descriptions, roles, and companies |
| **90%+ Accuracy** | Uses vector embeddings or AI APIs for semantic comparison |
| **Comprehensive ATS Scoring** | Four core metrics: Tone & Style, Content, Structure, Skills Match |
| **Interactive Smart Editor** | Human-readable editor with live AI suggestions and dynamic scoring |
| **MySQL Integration** | Store user profiles, resumes, and analysis history for tracking improvement |
| **Dark Red & White Theme** | Elegant serif fonts for headers, high-contrast sans-serif for data |

---

## 🗂 Project Structure

```
ATS Optimizer Pro/
├── app.py                  # Flask orchestrator with new AI workflow
├── config.py               # API and database configuration
├── requirements.txt        # Python dependencies
├── database.sql           # MySQL schema for production
├── usermanual.txt         # Setup and troubleshooting guide
│
├── core/
│   ├── __init__.py
│   ├── analyzer.py         # AI-powered analysis engine with embeddings
│   └── pdf_builder.py     # Editorial PDF generator
│
├── data/
│   └── skills.json         # 200+ skills across 10 domains
│
├── static/
│   ├── css/
│   │   └── editorial.css   # Dark Red/White theme design system
│   └── js/
│       └── editor.js       # Live editor functionality
│
├── templates/
│   ├── upload.html         # Landing page with job details
│   ├── report.html         # Expandable dashboard (4 metrics)
│   ├── editor.html         # Smart Editor with AI sidebar
│   └── history.html        # Analysis history
│
└── uploads/                # Uploaded resume files
```

---

## 🚀 Fresh Machine Setup

### 1. Prerequisites

- **Python 3.9+** — [Download here](https://python.org/downloads)
- **MySQL Server** (optional) — For production use

Verify Python installation:
```powershell
python --version
```

### 2. Navigate to Project Folder

```powershell
cd "e:\DPU MCA\SEM 2\AI\Python Project"
```

### 3. Create Virtual Environment

```powershell
python -m venv venv
```

### 4. Activate Virtual Environment

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
.\venv\Scripts\activate

# If execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. Install Dependencies

```powershell
pip install -r requirements.txt
```

This installs:
- `Flask` — Web framework
- `google-generativeai` — Google Gemini API client
- `openai` — OpenAI API client
- `sentence-transformers` — Local embeddings (no API needed)
- `pdfplumber` + `PyPDF2` — PDF text extraction
- `fpdf2` — PDF generation
- `mysql-connector-python` — MySQL support

### 6. Configure API Key (Choose One)

**Option A: Google Gemini (Recommended)**
```powershell
# Create .env file
echo "GOOGLE_API_KEY=your_api_key" > .env
echo "AI_PROVIDER=google" >> .env
```

Get API key: https://aistudio.google.com/app/apikey

**Option B: OpenAI**
```powershell
echo "OPENAI_API_KEY=your_api_key" > .env
echo "AI_PROVIDER=openai" >> .env
```

Get API key: https://platform.openai.com/api-keys

**Option C: Local Embeddings (No API Required)**
```powershell
echo "USE_LOCAL_EMBEDDINGS=true" > .env
```

This provides ~80% accuracy. For 90%+, use an API key.

### 7. (Optional) MySQL Setup

If using MySQL instead of SQLite:

```powershell
# Create database
mysql -u root -p -e "CREATE DATABASE ats_optimizer;"

# Import schema
mysql -u root -p ats_optimizer < database.sql

# Add credentials to .env
echo "MYSQL_HOST=localhost" >> .env
echo "MYSQL_USER=root" >> .env
echo "MYSQL_PASSWORD=your_password" >> .env
echo "MYSQL_DATABASE=ats_optimizer" >> .env
```

### 8. Create Upload Folder

```powershell
New-Item -ItemType Directory -Force -Path "uploads"
```

### 9. Run the Server

```powershell
python app.py
```

Open: **http://127.0.0.1:5000**

---

## 📊 Scoring Formula

### Four Core Metrics (Weights)

```
Overall Score = (Tone & Style × 0.25) + (Content × 0.25) + (Structure × 0.20) + (Skills Match × 0.30)
```

| Metric | Weight | Description |
|--------|--------|-------------|
| Tone & Style | 25% | Impact verbs, active voice, professional tone |
| Content | 25% | Word count, skill depth, quantifiable achievements |
| Structure | 20% | Section completeness, ATS readability |
| Skills Match | 30% | Keyword matching against job description |

### Grades

| Score | Grade |
|-------|-------|
| 90-100 | Excellent |
| 75-89 | Good |
| 60-74 | Average |
| 0-59 | Needs Work |

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Upload page with job details |
| `POST` | `/analyze` | Analyze resume with optional job description |
| `GET` | `/report` | Analysis report with expandable dashboard |
| `GET` | `/editor` | Smart Editor with AI suggestions |
| `POST` | `/download-pdf` | Generate PDF from edited text |
| `GET` | `/history` | Past analyses |
| `POST` | `/api/analyze-editor` | Live editor analysis |
| `POST` | `/api/save-editor` | Save editor session |

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Web Framework | Flask 3.0 |
| AI/ML | Google Gemini / OpenAI / Sentence-Transformers |
| Database | SQLite (default) / MySQL (production) |
| PDF Processing | pdfplumber, PyPDF2, fpdf2 |
| Design | Custom CSS (Dark Red/White theme) |
| Fonts | Playfair Display (serif), Inter (sans-serif) |

---

## 📝 Usage Guide

### 1. Upload Resume
- Drag & drop PDF or TXT file
- Optionally provide job details:
  - Company Name
  - Job Role
  - Job Description (enables 90%+ accuracy matching)

### 2. View Report
- See overall score (0-100)
- Explore four expandable metrics:
  - Tone & Style
  - Content
  - Structure
  - Skills Match
- Read AI recommendations

### 3. Optimize Resume
- Click "Power Up My Resume"
- Edit in the Smart Editor
- Watch live score updates
- Follow AI suggestions in sidebar
- Download optimized PDF

### 4. Track Progress
- View history of analyses
- See improvement over time

---

## 🔧 Configuration

Create a `.env` file in the project root:

```env
# AI Configuration
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=google
USE_LOCAL_EMBEDDINGS=true

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=ats_optimizer

# Flask Configuration
SECRET_KEY=your_secret_key
DEBUG=true
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

*ATS Optimizer Pro — High-Accuracy Resume Analysis • 2024*
