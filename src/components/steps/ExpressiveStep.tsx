"use client";

import React, { useState } from "react";
import { ExpressiveStepData } from "@/types";
import WebcamTracker from "@/components/WebcamTracker";
import { ArrowRight } from "lucide-react";

interface ExpressiveStepProps {
  data: ExpressiveStepData;
  onNext: () => void;
}

export default function ExpressiveStep({ data, onNext }: ExpressiveStepProps) {
  const [, setPracticed] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 font-mono tracking-wide text-emerald-600">
          {data.signGloss}
        </h2>
        <p className="text-sm font-semibold text-slate-700 mt-0.5">"{data.englishMeaning}"</p>
      </div>

      {/* Main Container */}
      <div className="duo-card p-5 bg-white flex flex-col gap-4">
        {/* Media & Guide Layout */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* SgSL Reference GIF */}
          <div className="w-full sm:w-1/2 aspect-square max-h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.mediaUrl}
              alt={data.signGloss}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Guide Breakdown */}
          <div className="w-full sm:w-1/2 flex flex-col gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">Handshape:</span>
              <p className="text-slate-600 leading-relaxed font-medium">{data.handShape}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">Movement:</span>
              <p className="text-slate-600 leading-relaxed font-medium">{data.movement}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] font-medium">
              💡 {data.culturalTip}
            </div>
          </div>
        </div>

        {/* Webcam Mirror */}
        <div className="pt-2 border-t border-slate-100">
          <WebcamTracker
            targetSign={data.targetSignId}
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
