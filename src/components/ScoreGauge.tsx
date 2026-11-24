import React from "react";

interface ScoreGaugeProps {
  score: number; // 0.0 - 1.0
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 180 }) => {
  const percentage = Math.round(score * 100);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let color = "#ef4444"; // red
  let statusText = "Significant Gaps";
  let statusBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";

  if (score >= 0.55) {
    color = "#10b981"; // emerald
    statusText = "Exceptional Match";
    statusBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (score >= 0.45) {
    color = "#22c55e"; // green
    statusText = "Strong Fit";
    statusBg = "bg-green-500/10 text-green-400 border-green-500/20";
  } else if (score >= 0.25) {
    color = "#f59e0b"; // amber
    statusText = "Moderate Match";
    statusBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {percentage}%
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Semantic Fit
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBg}`}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};
