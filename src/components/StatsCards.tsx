import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Target } from "lucide-react";

interface StatsCardsProps {
  overallScore: number;
  totalRequirements: number;
  coveredCount: number;
  weakCount: number;
  missingCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  overallScore,
  totalRequirements,
  coveredCount,
  weakCount,
  missingCount,
}) => {
  const coveredPct = totalRequirements > 0 ? Math.round((coveredCount / totalRequirements) * 100) : 0;
  const weakPct = totalRequirements > 0 ? Math.round((weakCount / totalRequirements) * 100) : 0;
  const missingPct = totalRequirements > 0 ? Math.round((missingCount / totalRequirements) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Overall Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Cosine Fit</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {(overallScore * 100).toFixed(0)}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Whole document similarity
          </div>
        </div>

        {/* Well Covered */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Well Covered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-300">
            {coveredCount}
            <span className="ml-1 text-xs font-normal text-emerald-500">
              / {totalRequirements} ({coveredPct}%)
            </span>
          </div>
          <div className="mt-1 text-xs text-emerald-500/80">
            Score &ge; 45% (Strong evidence)
          </div>
        </div>

        {/* Partially Covered */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Partially Covered</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {weakCount}
            <span className="ml-1 text-xs font-normal text-amber-500">
              / {totalRequirements} ({weakPct}%)
            </span>
          </div>
          <div className="mt-1 text-xs text-amber-500/80">
            Score 25% - 44% (Some overlap)
          </div>
        </div>

        {/* Missing */}
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium">Missing Signals</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-300">
            {missingCount}
            <span className="ml-1 text-xs font-normal text-rose-500">
              / {totalRequirements} ({missingPct}%)
            </span>
          </div>
          <div className="mt-1 text-xs text-rose-500/80">
            Score &lt; 25% (No strong bullet)
          </div>
        </div>
      </div>

      {/* Visual Distribution Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Requirement Coverage Distribution</span>
          <span>{totalRequirements} Total Requirements</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${coveredPct}%` }}
            title={`Covered: ${coveredCount} (${coveredPct}%)`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${weakPct}%` }}
            title={`Partial: ${weakCount} (${weakPct}%)`}
          />
          <div
            className="bg-rose-500 transition-all duration-500"
            style={{ width: `${missingPct}%` }}
            title={`Missing: ${missingCount} (${missingPct}%)`}
          />
        </div>
        <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Well Covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Partially Covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Likely Missing
          </span>
        </div>
      </div>
    </div>
  );
};
