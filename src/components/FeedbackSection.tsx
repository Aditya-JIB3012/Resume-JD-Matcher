import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface FeedbackSectionProps {
  feedback: string;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedback }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Qualitative AI Feedback &amp; Critique
            </h3>
            <p className="text-xs text-slate-400">
              Actionable coaching on strengths, gaps, and rewrite suggestions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Feedback</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
        {feedback}
      </div>
    </div>
  );
};
