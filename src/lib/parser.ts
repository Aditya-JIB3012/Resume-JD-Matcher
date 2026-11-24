import mammoth from "mammoth";

export function cleanText(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/[•●▪◦‣]/g, "-");
  return cleaned.trim();
}

export function splitIntoBullets(text: string): string[] {
  if (!text) return [];

  // Normalize bullet characters to newline dash
  const normalized = text.replace(/[•●▪◦‣]/g, "\n- ");

  // Split on newlines
  let lines = normalized
    .split("\n")
    .map((ln) => ln.replace(/^[\s\-–—\t]+|[\s\-–—\t]+$/g, "").trim())
    .filter((ln) => ln.length > 3);

  // Fallback to punctuation split if all condensed
  if (lines.length <= 2) {
    lines = normalized
      .split(/(?<=[.;])\s+/)
      .map((ln) => ln.replace(/^[\s\-–—\t]+|[\s\-–—\t]+$/g, "").trim())
      .filter((ln) => ln.length > 3);
  }

  return lines;
}

export const SECTION_HEADERS = [
  "experience",
  "work experience",
  "professional experience",
  "education",
  "skills",
  "technical skills",
  "projects",
  "certifications",
  "summary",
  "objective",
  "achievements",
  "extracurricular",
  "leadership",
  "publications",
];

export function splitIntoSections(text: string): Record<string, string> {
  const lines = text.split("\n");
  const sections: Record<string, string[]> = { general: [] };
  let current = "general";

  for (const line of lines) {
    const stripped = line.trim();
    const lowered = stripped.toLowerCase().replace(/:+$/, "");
    if (SECTION_HEADERS.includes(lowered) && stripped.length < 40) {
      current = lowered;
      if (!sections[current]) sections[current] = [];
    } else {
      if (stripped) {
        if (!sections[current]) sections[current] = [];
        sections[current].push(stripped);
      }
    }
  }

  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(sections)) {
    if (v.length > 0) {
      result[k] = v.join(" ");
    }
  }
  return result;
}

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    // Dynamically require pdf-parse so it doesn't break client-side bundles
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text || "";
  } else if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } else if (ext === "txt" || ext === "text" || ext === "md") {
    return buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: .${ext}. Use PDF, DOCX, or TXT.`);
  }
}
