"""
parser.py
Extracts clean text from resumes (PDF/DOCX/TXT) and splits text into
bullet-point-like units for section/bullet-level matching.
"""

import re
import io
import pdfplumber
import docx


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract raw text from an uploaded resume file (pdf, docx, or txt)."""
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)

    elif ext == "docx":
        document = docx.Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in document.paragraphs if p.text.strip())

    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")

    else:
        raise ValueError(f"Unsupported file type: .{ext}. Use PDF, DOCX, or TXT.")


def clean_text(text: str) -> str:
    """Normalize whitespace and strip common resume formatting artifacts."""
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[•●▪◦‣]", "-", text)
    return text.strip()


def split_into_bullets(text: str) -> list[str]:
    """
    Split raw resume/JD text into bullet-like units for fine-grained matching.
    Handles bullet characters, newlines, and sentence-ish breaks as a fallback.
    """
    # Normalize bullet characters to a consistent marker first
    normalized = re.sub(r"[•●▪◦‣]", "\n- ", text)

    # Split on newlines first (most resumes are already line-oriented)
    lines = [ln.strip(" -\t") for ln in normalized.split("\n")]
    lines = [ln for ln in lines if len(ln) > 3]

    # If the document came through as one giant blob (common with PDFs),
    # fall back to splitting on sentence-like punctuation.
    if len(lines) <= 2:
        lines = re.split(r"(?<=[.;])\s+", normalized)
        lines = [ln.strip(" -\t") for ln in lines if len(ln.strip()) > 3]

    return lines


SECTION_HEADERS = [
    "experience", "work experience", "professional experience",
    "education", "skills", "technical skills", "projects",
    "certifications", "summary", "objective", "achievements",
    "extracurricular", "leadership", "publications",
]


def split_into_sections(text: str) -> dict[str, str]:
    """
    Best-effort split of resume text into labeled sections based on common
    header keywords. Falls back to putting everything under 'general' if no
    headers are detected.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {}
    current = "general"
    sections[current] = []

    for line in lines:
        stripped = line.strip()
        lowered = stripped.lower().strip(":")
        if lowered in SECTION_HEADERS and len(stripped) < 40:
            current = lowered
            sections.setdefault(current, [])
        else:
            if stripped:
                sections[current].append(stripped)

    return {k: " ".join(v) for k, v in sections.items() if v}
