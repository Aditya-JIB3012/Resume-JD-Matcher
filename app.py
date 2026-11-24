"""
app.py
Streamlit UI for the Resume <-> Job Description Matcher.

Run with:  streamlit run app.py
"""

import streamlit as st
from parser import extract_text, clean_text, split_into_bullets
from embedder import Embedder
from scorer import score_resume_against_jd
from feedback import generate_feedback

st.set_page_config(page_title="Resume-JD Matcher", page_icon="📄", layout="wide")


@st.cache_resource
def load_embedder():
    return Embedder()


def score_color(score: float) -> str:
    if score >= 0.45:
        return "🟢"
    elif score >= 0.25:
        return "🟡"
    return "🔴"


st.title("📄 Resume ↔ Job Description Matcher")
st.caption(
    "Semantic fit-scoring using sentence embeddings, not just keyword overlap. "
    "Upload a resume and paste a job description to see where you match and "
    "where you're weak."
)

embedder = load_embedder()
if embedder.mode == "tfidf":
    st.info(
        "Running in TF-IDF fallback mode (sentence-transformer model weights "
        "weren't available). Scores are still meaningful but based on keyword "
        "weighting rather than deep semantic similarity.",
        icon="ℹ️",
    )

col1, col2 = st.columns(2)

with col1:
    st.subheader("1. Your Resume")
    uploaded_file = st.file_uploader("Upload PDF, DOCX, or TXT", type=["pdf", "docx", "txt"])
    resume_text_input = st.text_area(
        "...or paste resume text directly",
        height=200,
        placeholder="Paste resume text here if you'd rather not upload a file.",
    )

with col2:
    st.subheader("2. Job Description")
    jd_text_input = st.text_area(
        "Paste the job description",
        height=280,
        placeholder="Paste the full JD text here.",
    )

use_llm_feedback = st.checkbox(
    "Generate LLM feedback (requires ANTHROPIC_API_KEY environment variable)",
    value=False,
)

run = st.button("🔍 Analyze Match", type="primary", use_container_width=True)

if run:
    # --- Resolve resume text ---
    resume_raw = ""
    if uploaded_file is not None:
        try:
            resume_raw = extract_text(uploaded_file.read(), uploaded_file.name)
        except Exception as e:
            st.error(f"Couldn't read resume file: {e}")
            st.stop()
    elif resume_text_input.strip():
        resume_raw = resume_text_input
    else:
        st.warning("Upload a resume file or paste resume text first.")
        st.stop()

    if not jd_text_input.strip():
        st.warning("Paste a job description first.")
        st.stop()

    resume_clean = clean_text(resume_raw)
    jd_clean = clean_text(jd_text_input)

    resume_bullets = split_into_bullets(resume_raw)
    jd_requirements = split_into_bullets(jd_text_input)

    with st.spinner("Scoring match..."):
        result = score_resume_against_jd(
            resume_text=resume_clean,
            resume_bullets=resume_bullets,
            jd_text=jd_clean,
            jd_requirements=jd_requirements,
            embedder=embedder,
        )

    st.divider()

    # --- Overall score ---
    pct = result.overall_score * 100
    st.subheader("Overall Fit Score")
    st.progress(result.overall_score, text=f"{pct:.0f}% semantic match")

    m1, m2, m3 = st.columns(3)
    m1.metric("Requirements well covered", len(result.covered))
    m2.metric("Partially covered", len(result.weak))
    m3.metric("Likely missing", len(result.requirement_matches) - len(result.covered) - len(result.weak))

    st.divider()

    # --- Requirement-level breakdown ---
    st.subheader("Requirement-by-Requirement Breakdown")
    st.caption("Each JD requirement matched against its single best-fitting resume bullet.")

    sorted_matches = sorted(result.requirement_matches, key=lambda m: -m.score)
    for match in sorted_matches:
        icon = score_color(match.score)
        with st.expander(f"{icon} ({match.score*100:.0f}%) {match.requirement[:90]}"):
            st.write(f"**JD requirement:** {match.requirement}")
            if match.best_bullet:
                st.write(f"**Closest resume bullet:** {match.best_bullet}")
            else:
                st.write("**Closest resume bullet:** _(no comparable bullet found)_")

    st.divider()

    # --- Missing keywords ---
    if result.missing_keywords:
        st.subheader("⚠️ Skills mentioned in the JD but not found in your resume")
        st.write(", ".join(f"`{kw}`" for kw in result.missing_keywords))
    else:
        st.subheader("✅ No obvious keyword gaps detected")

    st.divider()

    # --- LLM feedback ---
    if use_llm_feedback:
        st.subheader("🧠 Qualitative Feedback")
        with st.spinner("Generating feedback..."):
            feedback_text = generate_feedback(resume_clean, jd_clean, result.missing_keywords)
        st.markdown(feedback_text)

st.divider()
st.caption(
    "Built with sentence-transformers, scikit-learn, and Streamlit. "
    "Embedding-based semantic matching goes beyond simple keyword-overlap ATS tools."
)
