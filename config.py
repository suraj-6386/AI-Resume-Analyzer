"""
config.py
=========
Configuration settings for the ATS Optimization Suite.
Handles API keys, database connections, and environment variables.

IMPORTANT: Create a .env file in the project root with your API keys.
DO NOT commit .env or config.py with real API keys to version control.

Author: Senior Full-Stack Engineer
"""

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Project Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_FOLDER = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"

# Ensure upload directory exists
UPLOAD_FOLDER.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Flask Configuration
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get("SECRET_KEY", "ats-optimizer-secret-2024")
DEBUG_MODE = os.environ.get("DEBUG", "True").lower() == "true"

# File Upload Settings
ALLOWED_EXTENSIONS = {"pdf", "txt"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

# ---------------------------------------------------------------------------
# Database Configuration (MySQL)
# ---------------------------------------------------------------------------
# MySQL is optional - the app falls back to SQLite if MySQL is not configured
MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "port": int(os.environ.get("MYSQL_PORT", 3306)),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": os.environ.get("MYSQL_DATABASE", "ats_optimizer"),
    "charset": "utf8mb4",
}

# SQLite fallback (for local development without MySQL)
SQLITE_DB_PATH = BASE_DIR / "resume_history.db"

# Use MySQL if credentials are provided, otherwise use SQLite
USE_MYSQL = all([
    MYSQL_CONFIG["user"],
    MYSQL_CONFIG["database"],
])

# ---------------------------------------------------------------------------
# AI/LLM Configuration
# ---------------------------------------------------------------------------
# Supported providers: "openai", "google"
AI_PROVIDER = os.environ.get("AI_PROVIDER", "google").lower()

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4")

# Google Gemini Configuration
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
GOOGLE_MODEL = os.environ.get("GOOGLE_MODEL", "gemini-2.0-flash")

# Embedding Configuration (for semantic similarity)
EMBEDDING_PROVIDER = os.environ.get("EMBEDDING_PROVIDER", "google")

# Use sentence-transformers for local embeddings (no API needed)
USE_LOCAL_EMBEDDINGS = os.environ.get("USE_LOCAL_EMBEDDINGS", "true").lower() == "true"

# Fallback: Use AI API for semantic analysis if local embeddings disabled
# This provides 90%+ accuracy using prompt engineering

# ---------------------------------------------------------------------------
# Scoring Configuration
# ---------------------------------------------------------------------------
# Weights for the four core ATS metrics
SCORING_WEIGHTS = {
    "tone_style": 0.25,       # 25% - Professional voice and impact
    "content": 0.25,         # 25% - Technical and soft skills depth
    "structure": 0.20,       # 20% - Layout and ATS-readability
    "skills_match": 0.30,    # 30% - Keyword matching with Job Description
}

# Minimum requirements for passing score
MIN_PASING_SCORE = 60
GOOD_SCORE = 75
EXCELLENT_SCORE = 90

# ---------------------------------------------------------------------------
# Skill Categories
# ---------------------------------------------------------------------------
# Domain keywords for job description matching
JOB_ROLE_KEYWORDS = {
    "software_engineer": [
        "software", "developer", "engineer", "programming", "code", "debug",
        "agile", "scrum", "api", "database", "backend", "frontend", "fullstack"
    ],
    "data_scientist": [
        "data science", "machine learning", "ml", "ai", "analytics",
        "statistics", "python", "r", "tensorflow", "pytorch", "visualization"
    ],
    "product_manager": [
        "product", "roadmap", "stakeholder", "strategy", "launch", "metrics",
        "agile", "scrum", "user research", "requirements"
    ],
    "designer": [
        "design", "ui", "ux", "figma", "sketch", "prototype", "user research",
        "wireframe", "visual", "brand"
    ],
    "marketing": [
        "marketing", "campaign", "seo", "sem", "content", "social media",
        "analytics", "brand", "strategy", "advertising"
    ],
}

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def get_api_key() -> str:
    """Get the appropriate API key based on the configured provider."""
    if AI_PROVIDER == "openai":
        return OPENAI_API_KEY
    elif AI_PROVIDER == "google":
        return GOOGLE_API_KEY
    return ""


def is_configured() -> bool:
    """Check if the application is properly configured for AI analysis."""
    if USE_LOCAL_EMBEDDINGS:
        return True  # Local embeddings don't need API key
    
    if AI_PROVIDER == "openai":
        return bool(OPENAI_API_KEY)
    elif AI_PROVIDER == "google":
        return bool(GOOGLE_API_KEY)
    
    return False


def get_model_name() -> str:
    """Get the model name for the configured AI provider."""
    if AI_PROVIDER == "openai":
        return OPENAI_MODEL
    elif AI_PROVIDER == "google":
        return GOOGLE_MODEL
    return "gpt-4"


# ---------------------------------------------------------------------------
# Template Constants
# ---------------------------------------------------------------------------
APP_NAME = "ATS Optimizer Pro"
APP_TAGLINE = "High-Accuracy Resume Analysis & Optimization Suite"
APP_VERSION = "2.0.0"

# Color theme (Dark Red and White)
THEME_COLORS = {
    "primary": "#8B0000",      # Dark Red
    "primary_light": "#B22222", # Firebrick
    "primary_dark": "#5C0000",  # Darker red
    "secondary": "#FFFFFF",     # White
    "background": "#FAFAFA",    # Off-white
    "surface": "#FFFFFF",       # White
    "text_primary": "#1A1A1A",  # Near black
    "text_secondary": "#666666", # Gray
    "success": "#2E7D32",        # Green
    "warning": "#F57C00",        # Orange
    "error": "#C62828",          # Red
    "border": "#E0E0E0",         # Light gray
}

# Font configuration
FONTS = {
    "serif": "'Playfair Display', Georgia, serif",
    "sans_serif": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "monospace": "'JetBrains Mono', 'Fira Code', Consolas, monospace",
}
