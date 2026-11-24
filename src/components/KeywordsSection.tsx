import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface KeywordsSectionProps {
  missingKeywords: string[];
  matchedKeywords: string[];
}

export const KeywordsSection: React.FC<KeywordsSectionProps> = ({
  missingKeywords,
  matchedKeywords,
}) => {
  return (
    <div className="space-y-6">
      {/* Missing Skills */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Missing JD Skills &amp; Keywords
              </h3>
              <p className="text-xs text-slate-400">
                Mentioned in the job description, but not detected in your resume
              </p>
            </div>
          </div>
          <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
            {missingKeywords.length} Missing
          </span>
        </div>

        {missingKeywords.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {missingKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            No major missing skills detected from the common skills taxonomy!
          </p>
        )}
      </div>

      {/* Matched Skills */}
      {matchedKeywords.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Confirmed Skill Matches
                </h3>
                <p className="text-xs text-slate-400">
                  Skills present in both your resume and the job posting
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              {matchedKeywords.length} Matched
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
