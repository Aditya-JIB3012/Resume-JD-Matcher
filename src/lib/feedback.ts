import Anthropic from "@anthropic-ai/sdk";

export async function generateFeedback(
  resumeText: string,
  jdText: string,
  missingKeywords: string[],
  apiKey?: string
): Promise<string> {
  const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!effectiveKey) {
    return generateFallbackFeedback(missingKeywords);
  }

  try {
    const anthropic = new Anthropic({
      apiKey: effectiveKey,
    });

    const prompt = `You are an expert technical recruiter and career coach reviewing a resume against a job description.

RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 4000)}

Give a concise, highly actionable critique formatted with clean markdown bullet points covering:
- **Strongest Overlaps**: 2-3 key experiences or skills that directly fulfill core JD needs.
- **Critical Gaps**: 2-3 missing requirements or unproven competencies.
- **Concrete Bullet Rewrite**: Take one actual weak bullet from the resume and rewrite it using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]) tailored to the JD.
- **ATS Quick Advice**: One high-impact tip to maximize interview callback chances.

Be specific and quote exact details. No fluff or conversational filler.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 750,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlocks = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text);

    return textBlocks.join("\n\n");
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `${generateFallbackFeedback(missingKeywords)}\n\n> *Note: AI API call encountered an error (${errorMsg}). Showing heuristic feedback above.*`;
  }
}

export function generateFallbackFeedback(missingKeywords: string[]): string {
  let feedback = `### 💡 Automated Action Plan & Feedback\n\n`;

  if (missingKeywords.length > 0) {
    const topKeywords = missingKeywords.slice(0, 6).map((k) => `\`${k}\``).join(", ");
    feedback += `- **Keyword Alignment**: The job description specifically looks for ${topKeywords}. If you have hands-on experience or coursework with these technologies, ensure they are explicitly named in your Skills and Project descriptions.\n`;
  } else {
    feedback += `- **Keyword Coverage**: Strong baseline alignment! You have included the primary tools and technologies mentioned in the JD.\n`;
  }

  feedback += `- **Impact Quantification**: Ensure your bullet points follow Google's XYZ formula: *"Accomplished [X] as measured by [Y], by doing [Z]"*. Replace generic descriptions with tangible metrics (e.g. latency reduced, user counts, model accuracy).\n`;
  feedback += `- **Semantic Match Tip**: Tailor the verbs and terminology in your recent projects to echo the exact responsibilities stated in the Job Description, ensuring modern ATS semantic models score you in the top tier.\n`;
  feedback += `- **Recommended Next Step**: Review the requirements marked as "Partially Covered" or "Likely Missing" in the breakdown table below and weave corresponding project work into your resume bullets.\n\n`;
  feedback += `_(Set \`ANTHROPIC_API_KEY\` in your environment or enter your key in the AI Feedback settings to generate customized Claude 3.5 Sonnet critique.)_`;

  return feedback;
}
