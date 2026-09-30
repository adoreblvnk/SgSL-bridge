"use client";

import React, { useState } from "react";
import { ReceptiveStepData } from "@/types";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, ArrowRight, HelpCircle } from "lucide-react";

interface ReceptiveStepProps {
  data: ReceptiveStepData;
  onNext: () => void;
  autoSolveTrigger?: boolean;
}

export default function ReceptiveStep({ data, onNext, autoSolveTrigger }: ReceptiveStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  React.useEffect(() => {
    if (autoSolveTrigger && !submitted) {
      const correctOption = data.options.find((opt) => opt.correct);
      if (correctOption) {
        setSelectedId(correctOption.id);
        setSubmitted(true);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    }
  }, [autoSolveTrigger, data.options, submitted]);

  const handleSelect = (id: string) => {
    if (submitted) return;
    setSelectedId(id);
  };

  const handleSubmit = () => {
    if (!selectedId) return;
    setSubmitted(true);
    const chosen = data.options.find((opt) => opt.id === selectedId);
    if (chosen?.correct) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#58cc02", "#46a302", "#86efac", "#ffffff"],
      });
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelectedId(null);
  };

  const selectedOption = data.options.find((opt) => opt.id === selectedId);
  const isCorrect = selectedOption?.correct ?? false;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{data.colleagueName} signed back</h2>
        <p className="text-xs text-slate-500 font-medium">{data.colleagueRole}</p>
      </div>

      {/* Main Container */}
      <div className="duo-card p-5 bg-white flex flex-col gap-4">
        {/* SgSL Response Player */}
        <div className="w-full aspect-video max-h-56 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.mediaUrl}
            alt="Signed response"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Question */}
        <p className="text-xs sm:text-sm font-bold text-slate-800">{data.question}</p>

        {/* Options List */}
        <div className="flex flex-col gap-2">
          {data.options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            let cardClass = "duo-card cursor-pointer hover:bg-slate-50";

            if (isSelected && !submitted) {
              cardClass = "duo-card-selected";
            } else if (submitted) {
              if (opt.correct) {
                cardClass = "duo-card-correct";
              } else if (isSelected && !opt.correct) {
                cardClass = "duo-card-wrong";
              }
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-3 rounded-xl transition-all flex items-center justify-between text-left ${cardClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-700"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{opt.text}</span>
                </div>

                {submitted && opt.correct && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {submitted && isSelected && !opt.correct && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Visual Cue Note */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
          💡 <strong>Visual Cue:</strong> {data.nonVerbalCue}
        </div>

        {/* Feedback Banner */}
        {submitted && (
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-1 animate-fade-in ${
              isCorrect
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-rose-50 border-rose-300 text-rose-950"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Correct</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium pl-5">{selectedOption?.explanation}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedId}
          className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            selectedId
              ? "btn-duo-green shadow-sm"
              : "bg-slate-200 text-slate-400 border-b-2 border-slate-300 cursor-not-allowed"
          }`}
        >
          <span>Check</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : isCorrect ? (
        <button
          onClick={onNext}
          className="w-full py-3.5 btn-duo-green rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleRetry}
          className="w-full py-3.5 btn-duo-secondary rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Try Again</span>
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
