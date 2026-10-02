"use client";

import React, { useState, useEffect } from "react";
import { ExpressiveStepData } from "@/types";
import WebcamTracker from "@/components/WebcamTracker";
import { ArrowRight } from "lucide-react";

interface ExpressiveStepProps {
  data: ExpressiveStepData;
  onNext: () => void;
}

export default function ExpressiveStep({ data, onNext }: ExpressiveStepProps) {
  const [, setPracticed] = useState(false);
  const [viewMode, setViewMode] = useState<"sgsl" | "asl">("sgsl");
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  useEffect(() => {
    setActivePartIndex(0);
  }, [data]);

  const currentPart = data.signParts && data.signParts[activePartIndex]
    ? data.signParts[activePartIndex]
    : null;

  const currentMediaUrl = viewMode === "asl"
    ? (data.aslComparison?.mediaUrl || data.mediaUrl)
    : (currentPart?.mediaUrl || data.mediaUrl);

  const currentHandShape = (viewMode === "sgsl" && currentPart?.handShape)
    ? currentPart.handShape
    : data.handShape;

  const currentMovement = (viewMode === "sgsl" && currentPart?.movement)
    ? currentPart.movement
    : data.movement;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-mono tracking-wide text-emerald-600">
              {data.signGloss}
            </h2>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">"{data.englishMeaning}"</p>
          </div>

          {data.aslComparison && (
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("sgsl")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  viewMode === "sgsl"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🇸🇬 SgSL
              </button>
              <button
                type="button"
                onClick={() => setViewMode("asl")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  viewMode === "asl"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🌐 ASL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="duo-card p-5 bg-white flex flex-col gap-4">
        {/* Multi-Sign Sequence Selector */}
        {data.signParts && data.signParts.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Sign Sequence:</span>
            {data.signParts.map((part, idx) => (
              <button
                key={part.gloss}
                type="button"
                onClick={() => {
                  setViewMode("sgsl");
                  setActivePartIndex(idx);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition shrink-0 ${
                  viewMode === "sgsl" && activePartIndex === idx
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {idx + 1}. {part.gloss}
              </button>
            ))}
          </div>
        )}

        {/* Media & Guide Layout */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Sign Reference GIF */}
          <div className="w-full sm:w-1/2 aspect-square max-h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMediaUrl}
              alt={viewMode === "sgsl" ? (currentPart?.gloss || data.signGloss) : (data.aslComparison?.gloss || data.signGloss)}
              className="w-full h-full object-contain"
            />
            <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              {currentPart ? currentPart.gloss : data.signGloss}
            </span>
          </div>

          {/* Guide Breakdown */}
          <div className="w-full sm:w-1/2 flex flex-col gap-2 text-xs">
            {viewMode === "sgsl" ? (
              <>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-0.5">Handshape:</span>
                  <p className="text-slate-600 leading-relaxed font-medium">{currentHandShape}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-0.5">Movement:</span>
                  <p className="text-slate-600 leading-relaxed font-medium">{currentMovement}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] font-medium">
                  💡 {data.culturalTip}
                </div>
              </>
            ) : (
              <>
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-0.5">Linguistic Comparison:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{data.aslComparison?.note}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Webcam Mirror */}
        <div className="pt-2 border-t border-slate-100">
          <WebcamTracker
            targetSign={data.targetSignId}
            mode={viewMode}
            onSuccess={() => setPracticed(true)}
          />
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
