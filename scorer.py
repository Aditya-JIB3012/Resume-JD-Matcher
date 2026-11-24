"""
scorer.py
Turns raw embeddings into an interpretable fit score:
- Overall resume-vs-JD similarity
- Per-JD-requirement best match against resume bullets (so you can see
  *which* requirements are covered and which aren't)
"""

from dataclasses import dataclass
from embedder import Embedder


@dataclass
class RequirementMatch:
    requirement: str
    best_bullet: str
    score: float


@dataclass
class MatchResult:
    overall_score: float
    requirement_matches: list[RequirementMatch]
    covered: list[RequirementMatch]
    weak: list[RequirementMatch]
    missing_keywords: list[str]


COVERED_THRESHOLD = 0.45   # >= this: JD requirement is well represented
WEAK_THRESHOLD = 0.25      # between WEAK and COVERED: partially represented
                            # below WEAK: effectively missing


def score_resume_against_jd(
    resume_text: str,
    resume_bullets: list[str],
    jd_text: str,
    jd_requirements: list[str],
    embedder: Embedder,
) -> MatchResult:

    overall_score = embedder.similarity(resume_text, jd_text)

    sim_matrix = embedder.similarity_matrix(jd_requirements, resume_bullets)

    requirement_matches: list[RequirementMatch] = []
    for i, req in enumerate(jd_requirements):
        if sim_matrix.shape[1] == 0:
            requirement_matches.append(RequirementMatch(req, "", 0.0))
            continue
        best_j = sim_matrix[i].argmax()
        best_score = float(sim_matrix[i][best_j])
        best_bullet = resume_bullets[best_j] if resume_bullets else ""
        requirement_matches.append(RequirementMatch(req, best_bullet, best_score))

    covered = [m for m in requirement_matches if m.score >= COVERED_THRESHOLD]
    weak = [m for m in requirement_matches if WEAK_THRESHOLD <= m.score < COVERED_THRESHOLD]
    missing = [m for m in requirement_matches if m.score < WEAK_THRESHOLD]

    missing_keywords = extract_missing_keywords(resume_text, jd_text)

    return MatchResult(
        overall_score=overall_score,
        requirement_matches=requirement_matches,
        covered=covered,
        weak=weak,
        missing_keywords=missing_keywords,
    )


# A small, extensible skills taxonomy for lightweight keyword-gap detection.
# This is intentionally simple (no heavy NER model) to keep the app fast
# and dependency-light -- documented as a known limitation in the README.
COMMON_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "sql", "nosql",
    "react", "next.js", "node.js", "django", "flask", "fastapi", "spring",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
    "machine learning", "deep learning", "nlp", "computer vision",
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "git", "linux", "rest api", "graphql", "microservices",
    "agile", "scrum", "data analysis", "data visualization", "tableau",
    "power bi", "excel", "spark", "hadoop", "kafka", "airflow",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "html", "css", "tailwind", "figma", "product management",
]


def extract_missing_keywords(resume_text: str, jd_text: str) -> list[str]:
    """
    Simple, transparent keyword-gap check against a common skills list.
    Flags skills mentioned in the JD that don't appear anywhere in the resume.
    """
    resume_lower = resume_text.lower()
    jd_lower = jd_text.lower()

    missing = []
    for skill in COMMON_SKILLS:
        if skill in jd_lower and skill not in resume_lower:
            missing.append(skill)

    return missing
