"use client";

import React, { useState } from "react";
import { Hand, Info, X, Check, ShieldAlert } from "lucide-react";

interface NavbarProps {
  onHomeClick: () => void;
  activeScenarioTitle?: string;
}

export default function Navbar({ onHomeClick }: NavbarProps) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <>
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={onHomeClick}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#58cc02] border-b-2 border-[#46a302] flex items-center justify-center text-white font-bold shadow-xs">
              <Hand className="w-4 h-4 fill-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">SgSL Bridge</span>
          </div>

          {/* Right Info Control */}
          <button
            onClick={() => setShowRationale(true)}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Design Iteration (V1 → V2)"
          >
            <Info className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline text-xs">Design Rationale</span>
          </button>
        </div>
      </header>

      {/* Rationale Modal */}
      {showRationale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 border border-slate-200 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Design Evolution (V1 → V2)</h3>
              <button
                onClick={() => setShowRationale(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Key iterations driven by user testing and empathy interviews:
            </p>

            {/* Dropped Features */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col gap-1.5">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Removed Based on Feedback
              </span>
              <ul className="text-xs text-slate-700 flex flex-col gap-1 pl-1 font-medium">
                <li>• <strong>Live AI camera translation:</strong> Fragile and removes authentic human eye contact.</li>
                <li>• <strong>Gamified heart penalties:</strong> Performance anxiety in workplace learning.</li>
                <li>• <strong>Static letter quizzes:</strong> Isolated spelling did not improve conversational confidence.</li>
              </ul>
            </div>

            {/* Added Features */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col gap-1.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Added to V2 Prototype
              </span>
              <ul className="text-xs text-slate-700 flex flex-col gap-1 pl-1 font-medium">
                <li>• <strong>60-Second Micro-Prep:</strong> Desk-side readiness right before spontaneous chats.</li>
                <li>• <strong>Non-Verbal Etiquette:</strong> Desk tap vibrations vs. wide waving rules.</li>
                <li>• <strong>Receptive Decoding:</strong> Direct practice decoding colleagues' signed replies.</li>
                <li>• <strong>Generational Heritage:</strong> Preserving Pioneer Shanghainese roots alongside modern ASL styles.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowRationale(false)}
              className="w-full py-2.5 btn-duo-green rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
