import React from "react";
import { Sparkles, FileText, Zap } from "lucide-react";

interface NavbarProps {
  onLoadSample: () => void;
  isLoadingSample: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoadSample, isLoadingSample }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Resume<span className="text-emerald-400">Match</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <Sparkles className="h-3 w-3" /> Semantic ATS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Embedding-based fit scoring &amp; requirement gap analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
            title="Load sample resume & job description"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>{isLoadingSample ? "Loading..." : "Load Sample Pair"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-400">
            <svg
              className="h-3.5 w-3.5 text-white"
              viewBox="0 0 1155 1000"
              fill="currentColor"
            >
              <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
            </svg>
            <span>Vercel Edge Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};
