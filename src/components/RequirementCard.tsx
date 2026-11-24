import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check, AlertCircle, XCircle } from "lucide-react";
import { RequirementMatch } from "../lib/scorer";

interface RequirementCardProps {
  match: RequirementMatch;
  index: number;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({ match, index }) => {
  const [isOpen, setIsOpen] = useState(index < 3); // open top 3 by default
  const pct = Math.round(match.score * 100);

  let badgeColor = "border-rose-500/30 bg-rose-500/10 text-rose-400";
  let statusIcon = <XCircle className="h-4 w-4 text-rose-400" />;
  let barColor = "bg-rose-500";

  if (match.status === "covered") {
    badgeColor = "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    statusIcon = <Check className="h-4 w-4 text-emerald-400" />;
    barColor = "bg-emerald-500";
  } else if (match.status === "weak") {
    badgeColor = "border-amber-500/30 bg-amber-500/10 text-amber-400";
    statusIcon = <AlertCircle className="h-4 w-4 text-amber-400" />;
    barColor = "bg-amber-500";
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 transition hover:border-slate-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-slate-800/30"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{statusIcon}</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${badgeColor}`}
              >
                {pct}% match
              </span>
              <span className="text-xs text-slate-400 font-mono">REQ #{index + 1}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {match.requirement}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>Semantic Alignment</span>
              <span className="font-mono">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${barColor} transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Closest Resume Evidence:
            </span>
            {match.bestBullet ? (
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed pl-2 border-l-2 border-indigo-500/60 font-mono">
                &ldquo;{match.bestBullet}&rdquo;
              </p>
            ) : (
              <p className="mt-1.5 text-xs italic text-slate-400">
                (No comparable bullet point found in resume)
              </p>
            )}
          </div>

          {match.status === "missing" && (
            <div className="text-xs text-rose-400/90 flex items-center gap-1.5 bg-rose-500/5 p-2 rounded border border-rose-500/10">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Recommendation: Add a project bullet demonstrating direct experience with this requirement.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
