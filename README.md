# Resume ↔ Job Description Matcher

A full-stack **Next.js** web app that scores how well a resume matches a job description using **TF-IDF cosine similarity** (semantic-ish matching via sublinear TF + bigrams), not just word counts. Built to actually use in my own internship search, and now Vercel-deployable.

## Why TF-IDF with bigrams instead of raw keyword matching?

Most free "ATS checker" tools just count overlapping words. This tool uses **sublinear TF-IDF with bigrams and L2 normalization** — it weights rare, important terms higher, suppresses stop words, and captures two-word technical phrases like `"machine learning"` or `"next.js"`. It still doesn't equal semantic deep learning but it's far more robust than naive overlap and runs fully in-process without any external model server.

A `ANTHROPIC_API_KEY` optionally unlocks **Claude 3.5 Sonnet AI critique** for qualitative gap analysis and bullet rewrites.

## What it does

1. **Overall Fit Score** — TF-IDF cosine similarity between whole resume and whole JD.
2. **Requirement-by-Requirement Breakdown** — splits the JD into individual requirements and the resume into bullet points, then finds the single best-fitting bullet for each requirement. Expandable cards show the matched bullet and a score bar.
3. **Missing-Skill Flags** — keyword gap check against a 50+ skill taxonomy. Shows both missing _and_ matched skills.
4. **Filter, Sort & Search** — filter requirements by status (covered/partial/missing), sort by score, and search by text.
5. **Claude AI Feedback** — optional qualitative critique with concrete rewrite suggestions (Anthropic API key required; can be entered inline in the UI without touching env vars).

## Architecture

```
src/
├── app/
│   ├── page.tsx             ← Main SPA client component (file upload, text input, results)
│   ├── layout.tsx           ← Root layout + dark theme + background gradients
│   ├── globals.css          ← Tailwind base + glassmorphism custom classes
│   └── api/
│       ├── match/route.ts   ← POST /api/match  — runs the full scoring pipeline
│       └── sample/route.ts  ← GET  /api/sample — serves sample data from /sample_data/
├── components/
│   ├── Navbar.tsx           ← Sticky header with "Load Sample" button
│   ├── ScoreGauge.tsx       ← Animated SVG ring gauge for overall score
│   ├── StatsCards.tsx       ← 4 metric cards + colour-coded distribution bar
│   ├── RequirementCard.tsx  ← Collapsible card per JD requirement with match details
│   ├── KeywordsSection.tsx  ← Missing vs. matched keyword chips
│   └── FeedbackSection.tsx  ← AI feedback display with copy-to-clipboard
└── lib/
    ├── parser.ts            ← Text extraction (pdf-parse, mammoth for DOCX), bullet splitting
    ├── scorer.ts            ← TF-IDF engine, cosine similarity, MatchResult type
    ├── feedback.ts          ← Claude 3.5 Sonnet API call + heuristic fallback
    └── skills.ts            ← 50+ skill taxonomy for keyword gap detection
```

Modular by design — each file has one job, easy to explain in an interview.

## Setup & Local Dev

```bash
# 1. Install dependencies
npm install

# 2. (Optional) set Anthropic key for LLM feedback
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

The app works fully without any API key (uses heuristic fallback for feedback).

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From project root:
vercel

# Or link to an existing project:
vercel --prod
```

**Environment variables to set in Vercel dashboard** (optional):
- `ANTHROPIC_API_KEY` — enables Claude AI critique server-side (users can also supply their own key inline in the UI)

## Try it immediately with sample data

Click **"Load Sample Pair"** in the top navbar — it loads the included `sample_data/sample_resume.txt` and `sample_data/sample_jd.txt`. Then hit **Analyze Match**.

## Known limitations

- **No ground-truth labels.** Scores are similarity heuristics, not calibrated interview probabilities.
- **TF-IDF ≠ deep semantic similarity.** Two synonyms with no shared tokens (e.g. "engineered" vs. "built") will score lower than they should. A sentence-transformer model would handle this better but requires running Python or a hosted model server.
- **Keyword-gap list is a fixed taxonomy**, not NER — it misses skills not in `src/lib/skills.ts`.
- **Bullet splitting is heuristic** — messy PDF exports can produce oddly-split bullets.

## Possible extensions

- Swap TF-IDF scorer for a Hugging Face Inference API call (serverless semantic embeddings)
- Add a "before/after" bullet rewrite mode: suggest a rewrite and re-score live
- Persist sessions with Supabase / Upstash for returning users
- Add a job board scraper to auto-fill the JD from a URL
