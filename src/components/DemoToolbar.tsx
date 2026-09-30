"use client";

import React from "react";
import { Zap, FastForward } from "lucide-react";

interface DemoToolbarProps {
  demoMode: boolean;
  onToggleDemoMode: () => void;
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onAutoSolve: () => void;
}

export default function DemoToolbar({
  demoMode,
  onToggleDemoMode,
  currentScenarioId,
  onSelectScenario,
  currentStepIndex,
  onSelectStep,
  onAutoSolve,
}: DemoToolbarProps) {
  return (
    <div className="w-full bg-slate-900 text-white px-4 py-1.5 text-xs border-b border-slate-800">
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onToggleDemoMode}
          className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition ${
            demoMode ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Demo: {demoMode ? "ON" : "OFF"}</span>
        </button>

        {demoMode && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700 text-[11px]">
              <button
                onClick={() => onSelectScenario("coffee-run")}
                className={`px-2 py-0.5 rounded font-semibold ${
                  currentScenarioId === "coffee-run"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Coffee
              </button>
              <button
                onClick={() => onSelectScenario("lunch-tapao")}
                className={`px-2 py-0.5 rounded font-semibold ${
                  currentScenarioId === "lunch-tapao"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Lunch
              </button>
              <button
                onClick={() => onSelectScenario("desk-clarification")}
                className={`px-2 py-0.5 rounded font-semibold ${
                  currentScenarioId === "desk-clarification"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Clarify
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              {[1, 2, 3, 4, 5].map((s, idx) => (
                <button
                  key={s}
                  onClick={() => onSelectStep(idx)}
                  className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${
                    currentStepIndex === idx
                      ? "bg-amber-400 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={onAutoSolve}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] flex items-center gap-1"
            >
              <FastForward className="w-3 h-3" />
              <span>Auto-Pass</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
