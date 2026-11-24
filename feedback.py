"""
feedback.py
Optional LLM-generated qualitative feedback layer on top of the embedding
scores. This is what turns "62% match" into an actual actionable critique.

Requires an ANTHROPIC_API_KEY environment variable. If it's not set, the
app still works fully using the embedding-based scoring -- this layer is
an enhancement, not a dependency.
"""

import os


def generate_feedback(resume_text: str, jd_text: str, missing_keywords: list[str]) -> str:
    """
    Calls the Claude API to produce a short, structured critique of how well
    the resume matches the JD. Returns plain text. Falls back to a templated
    message if no API key is configured or the call fails.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    if not api_key:
        return _fallback_feedback(missing_keywords)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)

        prompt = f"""You are a career coach reviewing a resume against a job description.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{jd_text[:4000]}

Give a short, direct critique in 4-6 bullet points covering:
- The strongest overlaps between the resume and the JD
- The 2-3 biggest gaps or missing signals
- One concrete rewrite suggestion for a weak bullet point, if you can find one

Be specific and reference actual content from both documents. No preamble."""

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )

        return "".join(
            block.text for block in response.content if hasattr(block, "text")
        )

    except Exception as e:
        return _fallback_feedback(missing_keywords) + f"\n\n_(LLM feedback unavailable: {e})_"


def _fallback_feedback(missing_keywords: list[str]) -> str:
    if missing_keywords:
        kw_list = ", ".join(missing_keywords[:8])
        return (
            "LLM-based feedback isn't configured (no ANTHROPIC_API_KEY set), "
            f"so here's a rule-based check instead: the JD mentions these skills "
            f"that don't appear anywhere in your resume text: **{kw_list}**. "
            "Consider adding them if you genuinely have that experience, or "
            "rephrasing existing bullets to surface it."
        )
    return (
        "LLM-based feedback isn't configured (no ANTHROPIC_API_KEY set). "
        "No obvious keyword gaps found against the common skills list -- "
        "rely on the requirement-match scores above for detail."
    )
