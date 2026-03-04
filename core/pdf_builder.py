"""
core/pdf_builder.py
===================
Editorial-grade PDF generator for the Smart Resume Analyzer.

Uses fpdf2 (pure-Python, zero system dependencies) to produce an
ATS-safe, beautifully laid-out PDF from the user's edited resume text.

Design principles:
  - No images, no multi-column tables → 100% ATS-parseable
  - Instrument Serif / DejaVu Bold for headings (via fpdf2 built-ins)
  - Clean white-space rhythm, amber rule under name, generous margins
  - Section headings detected and styled automatically

Author: Senior Full-Stack Engineer (Antigravity AI)
"""

import re
import io
from fpdf import FPDF

# ---------------------------------------------------------------------------
# Styling Constants
# ---------------------------------------------------------------------------

MARGIN_MM        = 18      # Page margin (left, right)
LINE_HEIGHT_BODY = 5.5     # mm per line for body text
LINE_HEIGHT_SEC  = 6       # mm for section headers
FONT_BODY        = 10      # pt — body text
FONT_SECTION     = 11      # pt — section headings (uppercase)
FONT_NAME        = 22      # pt — candidate name
FONT_CONTACT     = 9       # pt — contact line
FONT_BULLET      = 10      # pt — bullet points

# Amber accent color (RGB) for decorative rules
AMBER_R, AMBER_G, AMBER_B = 212, 168, 83
INK_R,   INK_G,   INK_B   = 26,  26,  46   # Deep charcoal

# Section heading keywords — used to detect and stylise section breaks
SECTION_KEYWORDS = [
    "summary", "objective", "profile", "overview",
    "experience", "work experience", "employment", "professional experience",
    "internship", "career history",
    "education", "academic", "qualification",
    "skills", "technical skills", "core competencies", "expertise",
    "projects", "personal projects", "portfolio",
    "certifications", "certificates", "awards", "achievements",
    "soft skills", "languages", "interests", "volunteer",
]


# ---------------------------------------------------------------------------
# Helper: detect if a line is a section heading
# ---------------------------------------------------------------------------

def _is_section_heading(line: str) -> bool:
    """Return True if the stripped, lowercased line matches a known section keyword."""
    clean = line.strip().lower().rstrip(":")
    # Exact match or starts-with match
    return any(clean == kw or clean.startswith(kw) for kw in SECTION_KEYWORDS) and len(line.strip()) < 55


def _is_bullet(line: str) -> bool:
    """Return True if the line looks like a bullet point."""
    stripped = line.strip()
    return stripped.startswith(("-", "•", "·", "*", "→", "–"))


# ---------------------------------------------------------------------------
# PDF Class
# ---------------------------------------------------------------------------

class ResumePDF(FPDF):
    """
    Custom FPDF subclass that adds the editorial header and footer.
    """

    def header(self):
        """
        Minimal page header — only shown on pages > 1 as a subtle
        continuation marker.
        """
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(160, 160, 175)
            self.cell(0, 6, "- continued -", align="C")
            self.ln(2)

    def footer(self):
        """Page number footer."""
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(180, 175, 165)
        self.cell(0, 6, f"Page {self.page_no()}", align="C")


# ---------------------------------------------------------------------------
# Line Renderer
# ---------------------------------------------------------------------------

def _sanitize(text: str) -> str:
    """
    Normalize Unicode to printable ASCII for fpdf2's core Helvetica font.
    Replaces common typography chars with ASCII equivalents,
    then strips anything else to a question mark.
    """
    # Common unicode typography → ASCII equivalents
    replacements = {
        "\u2014": "-",    # em dash
        "\u2013": "-",    # en dash
        "\u2010": "-",    # hyphen
        "\u2018": "'",    # left single quote
        "\u2019": "'",    # right single quote (including apostrophe)
        "\u201C": '"',    # left double quote
        "\u201D": '"',    # right double quote
        "\u2022": "-",    # bullet
        "\u2023": ">",    # triangular bullet
        "\u25CF": "-",    # black circle bullet
        "\u2026": "...",  # ellipsis
        "\u00B7": ".",    # middle dot
        "\u00A0": " ",    # non-breaking space
        "\u200B": "",     # zero-width space
        "\u2192": "->",   # right arrow
        "\u00E9": "e",    # é
        "\u00E8": "e",    # è
        "\u00EA": "e",    # ê
        "\u00EB": "e",    # ë
        "\u00E0": "a",    # à
        "\u00E2": "a",    # â
        "\u00E4": "a",    # ä
        "\u00F9": "u",    # ù
        "\u00FA": "u",    # ú
        "\u00FB": "u",    # û
        "\u00FC": "u",    # ü
        "\u00EE": "i",    # î
        "\u00EF": "i",    # ï
        "\u00F4": "o",    # ô
        "\u00F6": "o",    # ö
        "\u00E7": "c",    # ç
        "\u00F1": "n",    # ñ
        "\u00C9": "E",    # É
        "\u00C0": "A",    # À
        "\u00DF": "ss",   # ß
    }
    for char, repl in replacements.items():
        text = text.replace(char, repl)
    # Final fallback: strip any remaining non-ASCII to '?'
    return text.encode("ascii", errors="replace").decode("ascii")


def _render_lines(pdf: ResumePDF, lines: list[str]):
    """
    Iterate through text lines and apply smart styling:
      - First non-empty line → candidate name (large bold)
      - Contact-like lines after name → small italics
      - Section headings → uppercase bold + amber underline
      - Bullet lines → indented body with bullet dot
      - Everything else → regular body
    """
    name_rendered    = False
    contact_block    = True   # True until we hit a non-contact line after name
    after_name_lines = 0

    # Effective body width (page width minus both margins)
    body_w = pdf.w - MARGIN_MM * 2

    for raw in lines:
        line = raw.rstrip()

        # ---- Skip blank lines (add spacing instead) ----
        if not line.strip():
            if name_rendered:
                pdf.ln(2)
            continue

        # ---- CANDIDATE NAME (first meaningful line) ----
        if not name_rendered:
            pdf.set_font("Helvetica", "B", FONT_NAME)
            pdf.set_text_color(INK_R, INK_G, INK_B)
            pdf.cell(body_w, 10, _sanitize(line.strip()), align="L")
            pdf.ln(1)

            # Amber decorative rule under the name
            pdf.set_draw_color(AMBER_R, AMBER_G, AMBER_B)
            pdf.set_line_width(0.8)
            y = pdf.get_y()
            pdf.line(MARGIN_MM, y, pdf.w - MARGIN_MM, y)
            pdf.ln(3)

            name_rendered = True
            after_name_lines = 0
            continue

        # ---- CONTACT BLOCK (lines immediately after the name) ----
        if contact_block and after_name_lines < 5:
            has_contact_marker = (
                "@" in line or
                re.search(r"\+?\d[\d\s\-]{6,}", line) or
                "linkedin" in line.lower() or
                "github" in line.lower() or
                len(line.strip()) < 70
            )
            if has_contact_marker:
                pdf.set_font("Helvetica", "", FONT_CONTACT)
                pdf.set_text_color(90, 90, 110)
                pdf.multi_cell(body_w, LINE_HEIGHT_BODY, _sanitize(line.strip()))
                after_name_lines += 1
                continue
            else:
                contact_block = False  # Contact block is over

        # ---- SECTION HEADINGS ----
        if _is_section_heading(line):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", FONT_SECTION)
            pdf.set_text_color(INK_R, INK_G, INK_B)
            pdf.cell(body_w, LINE_HEIGHT_SEC, _sanitize(line.strip().upper()), align="L")
            pdf.ln(1)

            # Thin amber underline below section heading
            pdf.set_draw_color(AMBER_R, AMBER_G, AMBER_B)
            pdf.set_line_width(0.4)
            y = pdf.get_y()
            pdf.line(MARGIN_MM, y, pdf.w - MARGIN_MM, y)
            pdf.ln(3)
            continue

        # ---- BULLET POINTS ----
        if _is_bullet(line):
            clean_bullet = re.sub(r"^[-•·*→–]\s*", "", line.strip())
            safe_bullet  = _sanitize(clean_bullet)

            pdf.set_font("Helvetica", "", FONT_BULLET)
            pdf.set_text_color(30, 30, 50)

            # Draw bullet symbol as a mini-cell, then body text beside it
            INDENT = 4   # mm extra indent for bullet
            DOT_W  = 5   # mm for the bullet marker cell

            pdf.set_x(MARGIN_MM + INDENT)
            pdf.cell(DOT_W, LINE_HEIGHT_BODY, "-")   # simple dash bullet

            # Now move X to right of the dash, compute remaining width
            x_after_dot = pdf.get_x()
            remaining_w = pdf.w - MARGIN_MM - x_after_dot
            if remaining_w < 20:   # safety fallback
                remaining_w = body_w - INDENT - DOT_W

            pdf.set_x(x_after_dot)
            pdf.multi_cell(remaining_w, LINE_HEIGHT_BODY, safe_bullet)
            continue

        # ---- REGULAR BODY TEXT ----
        pdf.set_font("Helvetica", "", FONT_BODY)
        pdf.set_text_color(30, 30, 50)
        pdf.multi_cell(body_w, LINE_HEIGHT_BODY, _sanitize(line.strip()))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_pdf(text: str) -> io.BytesIO:
    """
    Convert a plain-text resume into an editorial-grade PDF.

    Args:
        text:  The resume text (may be from the Smart Editor, newline-separated).

    Returns:
        BytesIO buffer containing the PDF bytes, ready for Flask's send_file.
    """
    pdf = ResumePDF(orientation="P", format="A4")
    pdf.set_margins(MARGIN_MM, 15, MARGIN_MM)   # left, top, right
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Pre-sanitize the entire text to pure ASCII before any FPDF calls
    clean_text = _sanitize(text)

    # Split into lines while preserving paragraph structure
    lines = clean_text.splitlines()

    _render_lines(pdf, lines)

    # Output to BytesIO buffer (fpdf2 returns bytes directly)
    pdf_bytes = pdf.output()
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer
