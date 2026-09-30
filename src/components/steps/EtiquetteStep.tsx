"use client";

import React from "react";
import { EtiquetteStepData } from "@/types";
import { Check, X, ArrowRight } from "lucide-react";

interface EtiquetteStepProps {
  data: EtiquetteStepData;
  onNext: () => void;
}

export default function EtiquetteStep({ data, onNext }: EtiquetteStepProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{data.title}</h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{data.situationContext}</p>
      </div>

      {/* Main Card */}
      <div className="duo-card p-5 bg-white flex flex-col gap-3.5">
        {/* DO Recommendation */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>DO: {data.doTip.title}</span>
          </div>
          <p className="text-xs text-emerald-950 pl-7 leading-relaxed font-medium">
            {data.doTip.action}
          </p>
          <p className="text-[11px] text-emerald-700 pl-7">
            {data.doTip.why}
          </p>
        </div>

        {/* AVOID Caution */}
        <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>AVOID: {data.avoidTip.title}</span>
          </div>
          <p className="text-xs text-rose-950 pl-7 leading-relaxed font-medium">
            {data.avoidTip.action}
          </p>
          <p className="text-[11px] text-rose-700 pl-7">
            {data.avoidTip.why}
          </p>
        </div>

        {/* Rule of Thumb */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
          💡 {data.ruleOfThumb}
        </div>
      </div>

      {/* Action Footer */}
      <button
        onClick={onNext}
        className="w-full py-3.5 btn-duo-green rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
      >
        <span>Continue</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
