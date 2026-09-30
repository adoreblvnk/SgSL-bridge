"use client";

import React from "react";
import { Scenario } from "@/types";
import { Coffee, Utensils, MessageSquare, ArrowRight } from "lucide-react";

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

export default function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  const getIcon = () => {
    switch (scenario.icon) {
      case "Coffee":
        return <Coffee className="w-5 h-5 text-emerald-600" />;
      case "Utensils":
        return <Utensils className="w-5 h-5 text-emerald-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(scenario)}
      className="duo-card p-5 bg-white cursor-pointer hover:border-emerald-400 hover:scale-[1.01] transition-all flex flex-col justify-between group"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <span className="text-[11px] font-bold text-slate-400">{scenario.timeTag}</span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {scenario.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
            {scenario.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
        <div className="px-3.5 py-1.5 btn-duo-green rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
          <span>Start</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
