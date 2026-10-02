"use client";

import React from "react";
import { VariantStepData } from "@/types";
import { ArrowRight } from "lucide-react";

interface VariantStepProps {
  data: VariantStepData;
  onNext: () => void;
}

export default function VariantStep({ data, onNext }: VariantStepProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{data.heritageSign}</h2>
        <p className="text-xs text-slate-500 font-medium">{data.headline}</p>
      </div>

      {/* Main Container */}
      <div className="duo-card p-5 bg-white flex flex-col gap-4">
        {/* Generational Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Older Pioneer SgSL Style */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-900 font-extrabold uppercase tracking-wide">
                🇸🇬 SgSL (Heritage)
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                {data.olderStyle.era}
              </span>
            </div>

            {data.olderStyle.mediaUrl && (
              <div className="w-full aspect-video bg-white/80 rounded-lg overflow-hidden border border-amber-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.olderStyle.mediaUrl}
                  alt={data.olderStyle.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <h3 className="text-xs font-black text-slate-900">{data.olderStyle.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {data.olderStyle.description}
            </p>
            <p className="mt-auto pt-2 border-t border-amber-200 text-[11px] text-amber-900 font-semibold">
              🏛️ {data.olderStyle.influence}
            </p>
          </div>

          {/* Newer Contemporary / ASL Style */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-900 font-extrabold uppercase tracking-wide">
                🌐 ASL / Modern Variant
              </span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                {data.newerStyle.era}
              </span>
            </div>

            {data.newerStyle.mediaUrl && (
              <div className="w-full aspect-video bg-white/80 rounded-lg overflow-hidden border border-emerald-200 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.newerStyle.mediaUrl}
                  alt={data.newerStyle.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <h3 className="text-xs font-black text-slate-900">{data.newerStyle.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {data.newerStyle.description}
            </p>
            <p className="mt-auto pt-2 border-t border-emerald-200 text-[11px] text-emerald-900 font-semibold">
              🌐 {data.newerStyle.influence}
            </p>
          </div>
        </div>

        {/* Heritage Note */}
        <p className="text-xs text-slate-600 leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-xl">
          {data.historicalBridge}
        </p>

        {/* Respect Rule Callout */}
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950">
          🤝 {data.respectRule}
        </div>
      </div>

      {/* Advance Button */}
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
