"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Briefcase,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Search,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ScoreGauge } from "../components/ScoreGauge";
import { StatsCards } from "../components/StatsCards";
import { RequirementCard } from "../components/RequirementCard";
import { KeywordsSection } from "../components/KeywordsSection";
import { FeedbackSection } from "../components/FeedbackSection";
import { MatchResult } from "../lib/scorer";

type SortMode = "default" | "asc" | "desc";
type FilterMode = "all" | "covered" | "weak" | "missing";

export default function Home() {
  /* ─────────────── State ─────────────── */
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [useLlm, setUseLlm] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [reqSearch, setReqSearch] = useState("");
  const [showAllReqs, setShowAllReqs] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─────────────── Load Sample ─────────────── */
  const loadSample = useCallback(async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch("/api/sample");
      if (!res.ok) throw new Error("Failed to load sample data");
      const data = await res.json();
      setResumeText(data.sampleResume || "");
      setJdText(data.sampleJd || "");
      setUploadedFile(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoadingSample(false);
    }
  }, []);

  /* ─────────────── File handling ─────────────── */
  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      setError("Unsupported file type. Please upload PDF, DOCX, or TXT.");
      return;
    }
    setUploadedFile(file);
    setResumeText("");
    setError(null);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  /* ─────────────── Analyze ─────────────── */
  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    setFeedback(null);

    if (!uploadedFile && !resumeText.trim()) {
      setError("Please upload a resume file or paste resume text.");
      return;
    }
    if (!jdText.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append("file", uploadedFile);
      }
      formData.append("resumeText", resumeText);
      formData.append("jdText", jdText);
      formData.append("useLlm", String(useLlm));
      formData.append("apiKey", apiKey);

      const res = await fetch("/api/match", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);
      setFeedback(data.feedback);
      setSortMode("default");
      setFilterMode("all");
      setShowAllReqs(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ─────────────── Requirement filtering & sorting ─────────────── */
  const displayedRequirements = useCallback(() => {
    if (!result) return [];
    let reqs = [...result.requirementMatches];

    if (filterMode !== "all") {
      reqs = reqs.filter((r) => r.status === filterMode);
    }

    if (reqSearch.trim()) {
      const q = reqSearch.toLowerCase();
      reqs = reqs.filter(
        (r) =>
          r.requirement.toLowerCase().includes(q) ||
          r.bestBullet.toLowerCase().includes(q)
      );
    }

    if (sortMode === "asc") {
      reqs.sort((a, b) => a.score - b.score);
    } else if (sortMode === "desc") {
      reqs.sort((a, b) => b.score - a.score);
    }

    return reqs;
  }, [result, filterMode, reqSearch, sortMode]);

  const allReqs = displayedRequirements();
  const visibleReqs = showAllReqs ? allReqs : allReqs.slice(0, 6);

  /* ─────────────── Keyboard shortcut ─────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isAnalyzing) {
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeText, jdText, uploadedFile, isAnalyzing]);

  /* ─────────────── Render ─────────────── */
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onLoadSample={loadSample} isLoadingSample={isLoadingSample} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* ── HERO ── */}
        <section className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Semantic TF-IDF Cosine Matching · Next.js App Router · Vercel Deployed
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Go beyond{" "}
            <span className="gradient-text">keyword matching.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
            Paste your resume &amp; job description — get a semantic fit score, a
            requirement-by-requirement breakdown with matched bullet evidence, skill gap
            detection, and optional AI coaching feedback.
          </p>
        </section>

        {/* ── INPUT SECTION ── */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Resume Input */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-white">1. Your Resume</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">PDF · DOCX · TXT</span>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploadedFile && fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition
                ${isDragOver
                  ? "border-blue-400 bg-blue-500/10"
                  : uploadedFile
                  ? "border-emerald-500/50 bg-emerald-500/5 cursor-default"
                  : "border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800/40"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {uploadedFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-emerald-300">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(uploadedFile.size / 1024).toFixed(1)} KB · Click the&nbsp;
                      <span className="text-rose-400">✕</span> to remove
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      Drop your resume here or click to browse
                    </p>
                    <p className="text-xs text-slate-500">PDF, DOCX, or TXT</p>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-500">
                <span className="bg-[#090d16] px-3">or paste text directly</span>
              </div>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (e.target.value) setUploadedFile(null);
              }}
              placeholder="Paste your resume text here…"
              rows={10}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          {/* JD Input */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-white">2. Job Description</span>
            </div>

            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here (responsibilities, requirements, etc.)…"
              rows={22}
              className="w-full flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>
        </div>

        {/* ── LLM Feedback toggle ── */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={useLlm}
                  onChange={(e) => {
                    setUseLlm(e.target.checked);
                    if (e.target.checked) setShowApiKeyInput(true);
                  }}
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-700 transition after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:bg-indigo-500 peer-checked:after:translate-x-full" />
              </label>
              <div>
                <span className="text-sm font-semibold text-slate-200">
                  Enable Claude AI Feedback
                </span>
                <p className="text-xs text-slate-400">
                  Requires an Anthropic API key · generates a qualitative critique
                </p>
              </div>
            </div>

            {useLlm && (
              <button
                type="button"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                {showApiKeyInput ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                {showApiKeyInput ? "Hide" : "Set"} API Key
              </button>
            )}
          </div>

          {useLlm && showApiKeyInput && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-… (optional — uses ANTHROPIC_API_KEY env var if unset)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Key is sent only to your own Next.js API route · never stored · never logged.
              </p>
            </div>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── CTA Button ── */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-90 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing Semantic Fit…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Search className="h-5 w-5" />
              Analyze Match
              <span className="ml-1 text-xs font-normal opacity-70">
                (Ctrl+Enter)
              </span>
            </span>
          )}
        </button>

        {/* ══════════════════════════════════
            RESULTS
        ══════════════════════════════════ */}
        {result && (
          <div ref={resultsRef} className="mt-10 space-y-8 animate-fade-in">
            <div className="border-t border-slate-800 pt-8">
              <h2 className="mb-6 text-xl font-bold text-white">
                📊 Analysis Results
              </h2>

              {/* Score + Stats side by side on large screens */}
              <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
                <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-6">
                  <ScoreGauge score={result.overallScore} />
                </div>
                <StatsCards
                  overallScore={result.overallScore}
                  totalRequirements={result.stats.totalRequirements}
                  coveredCount={result.stats.coveredCount}
                  weakCount={result.stats.weakCount}
                  missingCount={result.stats.missingCount}
                />
              </div>
            </div>

            {/* ── Requirement Breakdown ── */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    📋 Requirement-by-Requirement Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Each JD requirement matched against the single best-fitting resume bullet.
                  </p>
                </div>
              </div>

              {/* Filters & Sort */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {/* Filter tabs */}
                {(["all", "covered", "weak", "missing"] as FilterMode[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterMode(f)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      filterMode === f
                        ? f === "all"
                          ? "border-blue-500/60 bg-blue-500/20 text-blue-300"
                          : f === "covered"
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                          : f === "weak"
                          ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                          : "border-rose-500/60 bg-rose-500/20 text-rose-300"
                        : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {f === "all"
                      ? `All (${result.requirementMatches.length})`
                      : f === "covered"
                      ? `Covered (${result.covered.length})`
                      : f === "weak"
                      ? `Partial (${result.weak.length})`
                      : `Missing (${result.missing.length})`}
                  </button>
                ))}

                {/* Sort */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sort:</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="desc">Highest Score</option>
                    <option value="asc">Lowest Score</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="Search requirements…"
                    className="rounded-lg border border-slate-700 bg-slate-900 py-1.5 pl-7 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {visibleReqs.map((match, i) => (
                  <RequirementCard key={i} match={match} index={i} />
                ))}
                {allReqs.length === 0 && (
                  <div className="rounded-xl border border-slate-800 p-8 text-center text-sm text-slate-400">
                    No requirements match the current filter.
                  </div>
                )}
              </div>

              {allReqs.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllReqs(!showAllReqs)}
                  className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
                >
                  {showAllReqs
                    ? "Show Less"
                    : `Show ${allReqs.length - 6} More Requirements`}
                </button>
              )}
            </section>

            {/* ── Keyword Gaps ── */}
            <section>
              <h3 className="mb-4 text-base font-bold text-white">
                🔍 Skill &amp; Keyword Gap Analysis
              </h3>
              <KeywordsSection
                missingKeywords={result.missingKeywords}
                matchedKeywords={result.matchedKeywords}
              />
            </section>

            {/* ── LLM Feedback ── */}
            {feedback && (
              <section>
                <h3 className="mb-4 text-base font-bold text-white">
                  🧠 AI Coaching Feedback
                </h3>
                <FeedbackSection feedback={feedback} />
              </section>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-slate-800/60 py-6 text-center">
        <p className="text-xs text-slate-500">
          Built with{" "}
          <span className="text-slate-400 font-medium">Next.js App Router</span>,{" "}
          <span className="text-slate-400 font-medium">TF-IDF Cosine Scoring</span>, and{" "}
          <span className="text-slate-400 font-medium">Tailwind CSS</span>.
          Deployed on{" "}
          <a
            href="https://vercel.com"
            className="text-slate-300 hover:text-white underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel
          </a>
          .
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Semantic matching goes beyond simple keyword-overlap ATS tools. Scores are similarity heuristics, not calibrated interview probabilities.
        </p>
      </footer>
    </div>
  );
}
