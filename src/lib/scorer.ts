import { COMMON_SKILLS } from "./skills";

export interface RequirementMatch {
  requirement: string;
  bestBullet: string;
  score: number;
  status: "covered" | "weak" | "missing";
}

export interface MatchResult {
  overallScore: number;
  requirementMatches: RequirementMatch[];
  covered: RequirementMatch[];
  weak: RequirementMatch[];
  missing: RequirementMatch[];
  missingKeywords: string[];
  matchedKeywords: string[];
  stats: {
    totalRequirements: number;
    coveredCount: number;
    weakCount: number;
    missingCount: number;
    coveragePct: number;
  };
}

export const COVERED_THRESHOLD = 0.45;
export const WEAK_THRESHOLD = 0.25;

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves", "will", "shall", "must", "can", "may", "might"
]);

function tokenize(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9+#.\- ]/g, " ");
  const rawTokens = clean.split(/\s+/).filter((t) => t.length > 1);
  return rawTokens.filter((t) => !STOP_WORDS.has(t));
}

function extractNGrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

class TfidfVectorEngine {
  private vocabulary: Map<string, number> = new Map();
  private idf: number[] = [];

  constructor(documents: string[]) {
    this.buildVocabularyAndIdf(documents);
  }

  private buildVocabularyAndIdf(documents: string[]) {
    const docTermFreqs: Map<string, number>[] = [];
    const df: Map<string, number> = new Map();

    documents.forEach((doc) => {
      const tokens = tokenize(doc);
      const bigrams = extractNGrams(tokens, 2);
      const allTerms = [...tokens, ...bigrams];

      const seenInDoc = new Set<string>();
      const tfMap = new Map<string, number>();

      allTerms.forEach((term) => {
        tfMap.set(term, (tfMap.get(term) || 0) + 1);
        if (!seenInDoc.has(term)) {
          seenInDoc.add(term);
          df.set(term, (df.get(term) || 0) + 1);
        }
      });
      docTermFreqs.push(tfMap);
    });

    let index = 0;
    const N = documents.length;
    df.forEach((docCount, term) => {
      this.vocabulary.set(term, index++);
      // Standard smooth IDF formula: log((1 + N) / (1 + df)) + 1
      this.idf.push(Math.log((1 + N) / (1 + docCount)) + 1.0);
    });
  }

  public transform(text: string): Float64Array {
    const vector = new Float64Array(this.vocabulary.size);
    const tokens = tokenize(text);
    const bigrams = extractNGrams(tokens, 2);
    const allTerms = [...tokens, ...bigrams];

    const tfMap = new Map<string, number>();
    allTerms.forEach((t) => {
      tfMap.set(t, (tfMap.get(t) || 0) + 1);
    });

    let normSq = 0;
    tfMap.forEach((count, term) => {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        // Sublinear TF: (1 + ln(tf)) * idf
        const tf = 1 + Math.log(count);
        const weight = tf * this.idf[idx];
        vector[idx] = weight;
        normSq += weight * weight;
      }
    });

    // L2 Normalize
    if (normSq > 0) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  public cosineSimilarity(vecA: Float64Array, vecB: Float64Array): number {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  }
}

export function extractKeywordGaps(
  resumeText: string,
  jdText: string
): { missing: string[]; matched: string[] } {
  const rLower = resumeText.toLowerCase();
  const jLower = jdText.toLowerCase();

  const missing: string[] = [];
  const matched: string[] = [];

  for (const skill of COMMON_SKILLS) {
    const inJd = jLower.includes(skill);
    const inResume = rLower.includes(skill);

    if (inJd && !inResume) {
      missing.push(skill);
    } else if (inJd && inResume) {
      matched.push(skill);
    }
  }

  return { missing, matched };
}

export function scoreResumeAgainstJd(
  resumeText: string,
  resumeBullets: string[],
  jdText: string,
  jdRequirements: string[]
): MatchResult {
  // 1. Overall score
  const overallEngine = new TfidfVectorEngine([resumeText, jdText]);
  const resumeVec = overallEngine.transform(resumeText);
  const jdVec = overallEngine.transform(jdText);
  const overallScore = overallEngine.cosineSimilarity(resumeVec, jdVec);

  // 2. Requirement by requirement matching
  const corpus = [...jdRequirements, ...resumeBullets];
  const reqEngine = new TfidfVectorEngine(corpus.length > 0 ? corpus : [resumeText, jdText]);

  const resumeBulletVectors = resumeBullets.map((b) => reqEngine.transform(b));

  const requirementMatches: RequirementMatch[] = [];

  jdRequirements.forEach((req) => {
    if (resumeBullets.length === 0) {
      requirementMatches.push({
        requirement: req,
        bestBullet: "",
        score: 0.0,
        status: "missing",
      });
      return;
    }

    const reqVec = reqEngine.transform(req);
    let bestScore = -1;
    let bestBullet = "";

    resumeBullets.forEach((bullet, j) => {
      const bVec = resumeBulletVectors[j];
      const sim = reqEngine.cosineSimilarity(reqVec, bVec);
      if (sim > bestScore) {
        bestScore = sim;
        bestBullet = bullet;
      }
    });

    const score = Math.max(0, Math.min(1, bestScore));
    let status: "covered" | "weak" | "missing" = "missing";
    if (score >= COVERED_THRESHOLD) {
      status = "covered";
    } else if (score >= WEAK_THRESHOLD) {
      status = "weak";
    }

    requirementMatches.push({
      requirement: req,
      bestBullet: score > 0.05 ? bestBullet : "",
      score,
      status,
    });
  });

  const covered = requirementMatches.filter((m) => m.status === "covered");
  const weak = requirementMatches.filter((m) => m.status === "weak");
  const missing = requirementMatches.filter((m) => m.status === "missing");

  const { missing: missingKeywords, matched: matchedKeywords } = extractKeywordGaps(
    resumeText,
    jdText
  );

  const totalReqs = requirementMatches.length;
  const coveragePct = totalReqs > 0 ? Math.round((covered.length / totalReqs) * 100) : 0;

  return {
    overallScore,
    requirementMatches,
    covered,
    weak,
    missing,
    missingKeywords,
    matchedKeywords,
    stats: {
      totalRequirements: totalReqs,
      coveredCount: covered.length,
      weakCount: weak.length,
      missingCount: missing.length,
      coveragePct,
    },
  };
}
