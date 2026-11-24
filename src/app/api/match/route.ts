import { NextRequest, NextResponse } from "next/server";
import { cleanText, splitIntoBullets, extractTextFromFile } from "../../../lib/parser";
import { scoreResumeAgainstJd } from "../../../lib/scorer";
import { generateFeedback } from "../../../lib/feedback";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let resumeText = "";
    let jdText = "";
    let useLlm = false;
    let apiKey = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      resumeText = (formData.get("resumeText") as string) || "";
      jdText = (formData.get("jdText") as string) || "";
      useLlm = formData.get("useLlm") === "true";
      apiKey = (formData.get("apiKey") as string) || "";

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const extracted = await extractTextFromFile(buffer, file.name);
        if (extracted.trim()) {
          resumeText = extracted;
        }
      }
    } else {
      const body = await req.json();
      resumeText = body.resumeText || "";
      jdText = body.jdText || "";
      useLlm = Boolean(body.useLlm);
      apiKey = body.apiKey || "";
    }

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { error: "Resume text or document is required." },
        { status: 400 }
      );
    }

    if (!jdText || !jdText.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const cleanResume = cleanText(resumeText);
    const cleanJd = cleanText(jdText);

    const resumeBullets = splitIntoBullets(resumeText);
    const jdRequirements = splitIntoBullets(jdText);

    const matchResult = scoreResumeAgainstJd(
      cleanResume,
      resumeBullets,
      cleanJd,
      jdRequirements
    );

    let feedback: string | null = null;
    if (useLlm) {
      feedback = await generateFeedback(
        cleanResume,
        cleanJd,
        matchResult.missingKeywords,
        apiKey
      );
    }

    return NextResponse.json({
      success: true,
      result: matchResult,
      feedback,
      meta: {
        resumeBulletCount: resumeBullets.length,
        jdRequirementCount: jdRequirements.length,
        resumeCharCount: resumeText.length,
        jdCharCount: jdText.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Analysis failed", details: message },
      { status: 500 }
    );
  }
}
