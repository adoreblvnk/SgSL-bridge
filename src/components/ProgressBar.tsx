"use client";

import React from "react";
import { X } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onExit: () => void;
  stepLabels: string[];
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  onExit,
  stepLabels,
}: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          title="Exit scenario"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar container */}
        <div className="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-[#58cc02] transition-all duration-300 ease-out rounded-full relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Glossy highlight effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-full"></div>
          </div>
        </div>

        <span className="text-xs font-black text-slate-500 font-mono w-10 text-right">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Step dots with micro-labels */}
      <div className="flex items-center justify-between px-8 text-[10px] font-bold text-slate-400">
        {stepLabels.map((label, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === currentStep;
          const isDone = stepNumber < currentStep;

          return (
            <div key={label} className="flex flex-col items-center">
              <span
                className={`transition-colors ${
                  isActive
                    ? "text-emerald-700 font-extrabold"
                    : isDone
                    ? "text-slate-600"
                    : "text-slate-300"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
