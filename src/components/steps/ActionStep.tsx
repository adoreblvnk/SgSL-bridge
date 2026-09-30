"use client";

import React, { useEffect } from "react";
import { ActionStepData } from "@/types";
import confetti from "canvas-confetti";
import { ArrowRight, RotateCcw, Home } from "lucide-react";

interface ActionStepProps {
  data: ActionStepData;
  scenarioTitle: string;
  onRestart: () => void;
  onHome: () => void;
  onNextScenario?: () => void;
}

export default function ActionStep({
  data,
  scenarioTitle,
  onRestart,
  onHome,
  onNextScenario,
}: ActionStepProps) {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#58cc02", "#46a302", "#86efac", "#fbbf24"],
    });
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{data.missionTitle}</h2>
        <p className="text-xs text-slate-500 font-medium">{scenarioTitle}</p>
      </div>

      {/* Main Container */}
      <div className="duo-card p-5 bg-white flex flex-col gap-4">
        {/* Quick Reference Card */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Quick Reference
          </span>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-950 w-24 shrink-0">Etiquette:</span>
              <span className="text-slate-700">{data.readySummary.etiquette}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-950 w-24 shrink-0">Your Sign:</span>
              <span className="text-emerald-800 font-mono font-bold">{data.readySummary.sign}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-950 w-24 shrink-0">Expected Reply:</span>
              <span className="text-slate-700">{data.readySummary.expectedReply}</span>
            </div>
          </div>
        </div>

        {/* Action Steps */}
        <div className="flex flex-col gap-2">
          {data.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-slate-800"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {idx + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Encouragement */}
        <p className="text-center text-xs font-medium text-slate-500 italic pt-1">
          "{data.encouragement}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        {onNextScenario && (
          <button
            onClick={onNextScenario}
            className="flex-1 py-3 btn-duo-green rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onHome}
          className="flex-1 py-3 btn-duo-secondary rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <button
          onClick={onRestart}
          title="Restart scenario"
          className="p-3 btn-duo-secondary rounded-xl flex items-center justify-center shadow-sm text-slate-600"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
